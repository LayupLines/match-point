import { db } from '@/lib/db'
import { STRIKES_TO_ELIMINATE } from '@/lib/constants'

export async function calculateScoring(tournamentId: string) {
  return await db.$transaction(async (tx) => {
    // Get all leagues for this tournament
    const leagues = await tx.league.findMany({
      where: { tournamentId },
      include: { memberships: true }
    })

    // Get all completed matches for this tournament
    const matches = await tx.match.findMany({
      where: {
        round: { tournamentId },
        winnerId: { not: null }
      },
      include: {
        player1: true,
        player2: true,
        winner: true,
        retiredPlayer: true
      }
    })

    // For each league, calculate standings
    for (const league of leagues) {
      for (const membership of league.memberships) {
        const userId = membership.userId

        // Get all picks for this user in this league
        const picks = await tx.pick.findMany({
          where: {
            userId,
            leagueId: league.id
          },
          include: {
            player: true,
            round: true
          }
        })

        let strikes = 0
        let correctPicks = 0
        let finalRoundSubmission: Date | null = null

        // Evaluate each pick
        for (const pick of picks) {
          // Find match involving this player
          const match = matches.find(
            m => m.player1Id === pick.playerId || m.player2Id === pick.playerId
          )

          if (!match || !match.winnerId) continue

          // Check if pick won
          const didPlayerWin = match.winnerId === pick.playerId

          if (didPlayerWin) {
            // Player won - no strike
            correctPicks++

            // Handle walkover (opponent didn't show)
            if (match.isWalkover) {
              correctPicks++ // Bonus for walkover advancement
            }
          } else {
            // Player lost - check if it was a retirement
            if (match.retiredPlayerId === pick.playerId) {
              // Picked player retired - this is a strike
              strikes++
            } else if (match.retiredPlayerId) {
              // Opponent retired, picked player advanced - no strike
              correctPicks++
            } else {
              // Normal loss - strike
              strikes++
            }
          }

          // Track final round submission time
          if (pick.round.roundNumber === 7) {
            finalRoundSubmission = pick.submittedAt
          }
        }

        // Determine if eliminated
        const eliminated = strikes >= STRIKES_TO_ELIMINATE

        // Upsert standings
        await tx.standings.upsert({
          where: {
            userId_leagueId: {
              userId,
              leagueId: league.id
            }
          },
          create: {
            userId,
            leagueId: league.id,
            strikes,
            correctPicks,
            eliminated
          },
          update: {
            strikes,
            correctPicks,
            eliminated,
            lastUpdated: new Date()
          }
        })
      }

      // Apply rankings with tiebreakers
      await applyRankings(league.id, tx)
    }
  })
}

async function applyRankings(leagueId: string, tx: any) {
  // Get all standings for this league
  const standings = await tx.standings.findMany({
    where: { leagueId },
    include: {
      user: {
        include: {
          picks: {
            where: {
              leagueId,
              round: { roundNumber: 7 }
            },
            orderBy: { submittedAt: 'asc' },
            take: 1
          }
        }
      }
    }
  })

  // Sort by tiebreakers:
  // 1. Fewest strikes
  // 2. Most correct picks
  // 3. Earliest final round submission
  const sorted = standings.sort((a: any, b: any) => {
    // First: fewest strikes
    if (a.strikes !== b.strikes) return a.strikes - b.strikes

    // Second: most correct picks
    if (a.correctPicks !== b.correctPicks) return b.correctPicks - a.correctPicks

    // Third: earliest final submission
    const aFinalPick = a.user.picks[0]?.submittedAt
    const bFinalPick = b.user.picks[0]?.submittedAt

    if (aFinalPick && bFinalPick) {
      return aFinalPick.getTime() - bFinalPick.getTime()
    }

    return 0
  })

  // Apply ranks
  for (let i = 0; i < sorted.length; i++) {
    await tx.standings.update({
      where: { id: sorted[i].id },
      data: { rank: i + 1 }
    })
  }
}

export async function scoreMatch(matchId: string, winnerId: string, isWalkover: boolean = false, retiredPlayerId?: string) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { round: { include: { tournament: true } } }
  })

  if (!match) {
    throw new Error('Match not found')
  }

  // Update match with result
  await db.match.update({
    where: { id: matchId },
    data: {
      winnerId,
      isWalkover,
      retiredPlayerId: retiredPlayerId || null,
      resultEnteredAt: new Date()
    }
  })

  // Trigger scoring for this tournament
  await calculateScoring(match.round.tournament.id)
}
