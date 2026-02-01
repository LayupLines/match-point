import { db } from '@/lib/db'

export async function createLeague(
  name: string,
  tournamentId: string,
  creatorId: string,
  description?: string
) {
  // Verify tournament exists
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId }
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  // Create league
  const league = await db.league.create({
    data: {
      name,
      description,
      tournamentId,
      creatorId
    }
  })

  // Auto-join creator to league
  await db.leagueMembership.create({
    data: {
      userId: creatorId,
      leagueId: league.id
    }
  })

  // Create initial standings entry for creator
  await db.standings.create({
    data: {
      userId: creatorId,
      leagueId: league.id
    }
  })

  return league
}

export async function joinLeague(userId: string, leagueId: string) {
  // Verify league exists
  const league = await db.league.findUnique({
    where: { id: leagueId }
  })

  if (!league) {
    throw new Error('League not found')
  }

  // Check if already a member
  const existingMembership = await db.leagueMembership.findUnique({
    where: {
      userId_leagueId: { userId, leagueId }
    }
  })

  if (existingMembership) {
    throw new Error('You are already a member of this league')
  }

  // Join league
  await db.leagueMembership.create({
    data: {
      userId,
      leagueId
    }
  })

  // Create standings entry
  await db.standings.create({
    data: {
      userId,
      leagueId
    }
  })

  return league
}

export async function getPublicLeagues(gender?: 'MEN' | 'WOMEN') {
  return await db.league.findMany({
    where: gender ? {
      tournament: { gender }
    } : undefined,
    include: {
      tournament: true,
      _count: {
        select: { memberships: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getUserLeagues(userId: string) {
  const memberships = await db.leagueMembership.findMany({
    where: { userId },
    include: {
      league: {
        include: {
          tournament: true,
          _count: {
            select: { memberships: true }
          }
        }
      }
    },
    orderBy: {
      joinedAt: 'desc'
    }
  })

  return memberships.map(m => m.league)
}

export async function getLeagueStandings(leagueId: string) {
  return await db.standings.findMany({
    where: { leagueId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }
    },
    orderBy: [
      { rank: 'asc' }
    ]
  })
}

export async function getLeagueDetails(leagueId: string) {
  return await db.league.findUnique({
    where: { id: leagueId },
    include: {
      tournament: {
        include: {
          rounds: {
            orderBy: { roundNumber: 'asc' }
          }
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: { memberships: true }
      }
    }
  })
}
