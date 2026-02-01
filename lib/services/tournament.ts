import { db } from '@/lib/db'
import { Gender, TournamentStatus } from '@prisma/client'
import { ROUND_CONFIGS } from '@/lib/constants'

export async function createTournament(
  name: string,
  year: number,
  gender: Gender
) {
  // Check if tournament already exists
  const existing = await db.tournament.findUnique({
    where: {
      year_gender: { year, gender }
    }
  })

  if (existing) {
    throw new Error('Tournament already exists for this year and gender')
  }

  // Create tournament
  const tournament = await db.tournament.create({
    data: {
      name,
      year,
      gender,
      status: TournamentStatus.UPCOMING
    }
  })

  // Create rounds with default lock times (can be updated later)
  const baseDate = new Date(year, 5, 1) // June 1st of tournament year

  for (const config of ROUND_CONFIGS) {
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
  player2Id: string
) {
  return await db.match.create({
    data: {
      roundId,
      player1Id,
      player2Id
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
