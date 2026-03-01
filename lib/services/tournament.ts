// ABOUTME: Tournament service providing CRUD operations for tournaments, rounds, players, and matches.
// Used by admin API routes and server components to manage all tournament-related data.
import { db } from '@/lib/db'
import { Gender, TournamentLevel, TournamentStatus } from '@prisma/client'
import { ROUND_PRESETS } from '@/lib/constants'
import { pairWinnersForNextRound } from './bracket'

export async function createTournament(
  name: string,
  year: number,
  gender: Gender,
  level: TournamentLevel = TournamentLevel.GRAND_SLAM
) {
  // Check if tournament already exists
  const existing = await db.tournament.findUnique({
    where: {
      year_gender_level: { year, gender, level }
    }
  })

  if (existing) {
    throw new Error('Tournament already exists for this year, gender, and level')
  }

  // Create tournament
  const tournament = await db.tournament.create({
    data: {
      name,
      year,
      gender,
      level,
      status: TournamentStatus.UPCOMING
    }
  })

  // Create rounds from preset for this tournament level
  const roundConfigs = ROUND_PRESETS[level]
  const baseDate = new Date(year, 5, 1) // June 1st of tournament year

  for (const config of roundConfigs) {
    const lockTime = new Date(baseDate)
    lockTime.setDate(lockTime.getDate() + (config.roundNumber - 1) * 2)

    await db.round.create({
      data: {
        tournamentId: tournament.id,
        roundNumber: config.roundNumber,
        name: config.name,
        requiredPicks: config.requiredPicks,
        lockTime
      }
    })
  }

  return tournament
}

export async function updateTournamentStatus(
  tournamentId: string,
  status: TournamentStatus
) {
  return await db.tournament.update({
    where: { id: tournamentId },
    data: { status }
  })
}

export async function updateRoundLockTime(
  roundId: string,
  lockTime: Date
) {
  return await db.round.update({
    where: { id: roundId },
    data: { lockTime }
  })
}

export async function addPlayers(
  tournamentId: string,
  players: Array<{ name: string; seed?: number; country?: string }>
) {
  const createdPlayers = []

  for (const player of players) {
    const created = await db.player.create({
      data: {
        tournamentId,
        name: player.name,
        seed: player.seed,
        country: player.country
      }
    })
    createdPlayers.push(created)
  }

  return createdPlayers
}

export async function addMatch(
  roundId: string,
  player1Id: string,
  player2Id: string,
  bracketPosition?: number
) {
  return await db.match.create({
    data: {
      roundId,
      player1Id,
      player2Id,
      bracketPosition: bracketPosition ?? null,
    }
  })
}

export async function getTournaments(status?: TournamentStatus) {
  return await db.tournament.findMany({
    where: status ? { status } : undefined,
    include: {
      _count: {
        select: {
          players: true,
          leagues: true
        }
      }
    },
    orderBy: [
      { year: 'desc' },
      { gender: 'asc' }
    ]
  })
}

export async function getTournamentById(tournamentId: string) {
  return await db.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      rounds: {
        orderBy: { roundNumber: 'asc' }
      },
      players: {
        orderBy: [
          { seed: 'asc' },
          { name: 'asc' }
        ]
      }
    }
  })
}

export async function getUpcomingMatches(tournamentId: string) {
  return await db.match.findMany({
    where: {
      round: { tournamentId },
      winnerId: null
    },
    include: {
      round: true,
      player1: true,
      player2: true
    },
    orderBy: {
      round: { roundNumber: 'asc' }
    }
  })
}

export async function getCompletedMatches(tournamentId: string) {
  return await db.match.findMany({
    where: {
      round: { tournamentId },
      winnerId: { not: null }
    },
    include: {
      round: true,
      player1: true,
      player2: true,
      winner: true,
      retiredPlayer: true
    },
    orderBy: [
      { round: { roundNumber: 'asc' } },
      { resultEnteredAt: 'desc' }
    ]
  })
}

export async function generateNextRoundMatches(tournamentId: string, sourceRoundId: string) {
  // Get the source round and its matches
  const sourceRound = await db.round.findUnique({
    where: { id: sourceRoundId },
    include: {
      matches: {
        orderBy: { bracketPosition: 'asc' },
      },
      tournament: {
        include: {
          rounds: { orderBy: { roundNumber: 'asc' } },
        },
      },
    },
  })

  if (!sourceRound) {
    throw new Error('Round not found')
  }

  if (sourceRound.tournamentId !== tournamentId) {
    throw new Error('Round does not belong to this tournament')
  }

  // Find the next round
  const nextRound = sourceRound.tournament.rounds.find(
    r => r.roundNumber === sourceRound.roundNumber + 1
  )

  if (!nextRound) {
    throw new Error('No next round exists (this is the final round)')
  }

  // Check that the next round has no matches yet
  const existingNextRoundMatches = await db.match.count({
    where: { roundId: nextRound.id },
  })

  if (existingNextRoundMatches > 0) {
    throw new Error(`Round ${nextRound.name} already has ${existingNextRoundMatches} matches`)
  }

  // Generate pairings from completed matches
  const pairings = pairWinnersForNextRound(sourceRound.matches)

  // Create matches in the next round
  const createdMatches = []
  for (const pairing of pairings) {
    const match = await db.match.create({
      data: {
        roundId: nextRound.id,
        player1Id: pairing.player1Id,
        player2Id: pairing.player2Id,
        bracketPosition: pairing.bracketPosition,
      },
      include: {
        player1: true,
        player2: true,
        round: true,
      },
    })
    createdMatches.push(match)
  }

  return {
    round: nextRound,
    matches: createdMatches,
  }
}
