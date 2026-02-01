import { db } from '@/lib/db'

export async function submitPicks(
  userId: string,
  leagueId: string,
  roundId: string,
  playerIds: string[]
) {
  // Verify user is member of league
  const membership = await db.leagueMembership.findUnique({
    where: {
      userId_leagueId: { userId, leagueId }
    }
  })

  if (!membership) {
    throw new Error('You are not a member of this league')
  }

  // Get round details
  const round = await db.round.findUnique({
    where: { id: roundId },
    include: { tournament: true }
  })

  if (!round) {
    throw new Error('Round not found')
  }

  // Check if round is locked
  if (new Date() >= round.lockTime) {
    throw new Error('This round is locked. Picks can no longer be submitted.')
  }

  // Verify correct number of picks
  if (playerIds.length !== round.requiredPicks) {
    throw new Error(`This round requires exactly ${round.requiredPicks} picks`)
  }

  // Check if user already submitted picks for this round
  const existingPicks = await db.pick.findFirst({
    where: {
      userId,
      leagueId,
      roundId
    }
  })

  if (existingPicks) {
    throw new Error('You have already submitted picks for this round')
  }

  // Check no re-use of players
  const previousPicks = await db.pick.findMany({
    where: {
      userId,
      leagueId,
      playerId: { in: playerIds }
    }
  })

  if (previousPicks.length > 0) {
    const reusedPlayer = previousPicks[0]
    throw new Error('You have already picked one of these players in a previous round')
  }

  // Verify all players exist and belong to this tournament
  const players = await db.player.findMany({
    where: {
      id: { in: playerIds },
      tournamentId: round.tournamentId
    }
  })

  if (players.length !== playerIds.length) {
    throw new Error('Invalid players selected')
  }

  // Check for eliminated status
  const standings = await db.standings.findUnique({
    where: {
      userId_leagueId: { userId, leagueId }
    }
  })

  if (standings?.eliminated) {
    throw new Error('You have been eliminated and cannot make new picks')
  }

  // Create picks
  const picks = await db.pick.createMany({
    data: playerIds.map(playerId => ({
      userId,
      leagueId,
      roundId,
      playerId
    }))
  })

  return picks
}

export async function getUserPicks(userId: string, leagueId: string) {
  return await db.pick.findMany({
    where: { userId, leagueId },
    include: {
      player: true,
      round: true
    },
    orderBy: [
      { round: { roundNumber: 'asc' } },
      { submittedAt: 'asc' }
    ]
  })
}

export async function getRoundPicks(userId: string, leagueId: string, roundId: string) {
  return await db.pick.findMany({
    where: {
      userId,
      leagueId,
      roundId
    },
    include: {
      player: true
    }
  })
}

export async function getAvailablePlayers(userId: string, leagueId: string, tournamentId: string) {
  // Get all players user has already picked
  const usedPicks = await db.pick.findMany({
    where: { userId, leagueId },
    select: { playerId: true }
  })

  const usedPlayerIds = usedPicks.map(p => p.playerId)

  // Return all players NOT already picked
  return await db.player.findMany({
    where: {
      tournamentId,
      id: { notIn: usedPlayerIds }
    },
    orderBy: [
      { seed: 'asc' },
      { name: 'asc' }
    ]
  })
}
