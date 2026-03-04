// ABOUTME: API routes for pick submission (single add/remove and bulk).
// ABOUTME: Supports form data (with redirect) and JSON (with response) for single picks.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { submitPicks, getUserPicks } from '@/lib/services/picks'
import { submitPicksSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

// Validates and processes a single pick add/remove operation
async function processSinglePick(
  userId: string,
  leagueId: string,
  roundId: string,
  playerId: string,
  action: 'add' | 'remove',
): Promise<{ success: true; action: string } | { error: string; status: number }> {
  const { db } = await import('@/lib/db')

  // Validate membership
  const membership = await db.leagueMembership.findUnique({
    where: { userId_leagueId: { userId, leagueId } },
  })
  if (!membership) {
    return { error: 'Not a member of this league', status: 403 }
  }

  // Validate round exists and belongs to the league's tournament
  const league = await db.league.findUnique({ where: { id: leagueId }, select: { tournamentId: true } })
  const round = await db.round.findUnique({ where: { id: roundId } })
  if (!round || !league || round.tournamentId !== league.tournamentId) {
    return { error: 'Invalid round', status: 400 }
  }

  // Check lock time
  if (new Date(round.lockTime) < new Date()) {
    return { error: 'Round is locked', status: 400 }
  }

  // Check if this is a future round (not the current one)
  const allRounds = await db.round.findMany({
    where: { tournamentId: round.tournamentId },
    orderBy: { roundNumber: 'asc' },
    select: { id: true, roundNumber: true, lockTime: true },
  })
  const currentRound = allRounds.find(r => new Date(r.lockTime) > new Date())
  if (currentRound && round.roundNumber > currentRound.roundNumber) {
    return { error: 'Round is not yet open', status: 400 }
  }

  // Check elimination
  const standing = await db.standings.findUnique({
    where: { userId_leagueId: { userId, leagueId } },
  })
  if (standing?.eliminated) {
    return { error: 'You have been eliminated', status: 403 }
  }

  if (action === 'add') {
    // Check player belongs to this tournament
    const player = await db.player.findUnique({ where: { id: playerId } })
    if (!player || player.tournamentId !== league.tournamentId) {
      return { error: 'Invalid player', status: 400 }
    }

    // Check player not already used in a prior round
    const priorPick = await db.pick.findFirst({
      where: { userId, leagueId, playerId, roundId: { not: roundId } },
    })
    if (priorPick) {
      return { error: 'Player already used in a prior round', status: 400 }
    }

    // Atomic check+create inside a transaction to prevent race conditions
    try {
      await db.$transaction(async (tx) => {
        const currentPickCount = await tx.pick.count({
          where: { userId, leagueId, roundId },
        })
        if (currentPickCount >= round.requiredPicks) {
          throw new Error('Maximum picks reached')
        }

        await tx.pick.create({
          data: { userId, leagueId, roundId, playerId },
        })
      })
    } catch (err: any) {
      // Handle unique constraint violation (duplicate pick)
      if (err?.code === 'P2002') {
        return { error: 'Player already selected for this round', status: 400 }
      }
      if (err?.message === 'Maximum picks reached') {
        return { error: 'Maximum picks reached', status: 400 }
      }
      throw err
    }
  } else {
    // Remove pick
    await db.pick.deleteMany({
      where: { userId, leagueId, roundId, playerId },
    })
  }

  return { success: true, action }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const leagueId = searchParams.get('leagueId')

    if (!leagueId) {
      return NextResponse.json({ error: 'League ID required' }, { status: 400 })
    }

    const picks = await getUserPicks(session.user.id, leagueId)

    return NextResponse.json({ picks })
  } catch (error) {
    console.error('Error fetching picks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch picks' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type')

    // Handle form data (single pick add/remove — progressive enhancement fallback)
    if (contentType?.includes('application/x-www-form-urlencoded') || contentType?.includes('multipart/form-data')) {
      const formData = await req.formData()
      const leagueId = formData.get('leagueId') as string
      const roundId = formData.get('roundId') as string
      const playerId = formData.get('playerId') as string
      const action = formData.get('action') as string

      if (!leagueId || !roundId || !playerId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      if (action !== 'add' && action !== 'remove') {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }

      const result = await processSinglePick(session.user.id!, leagueId, roundId, playerId, action)

      if ('error' in result) {
        // For form submissions, redirect for lock/future cases to update the page state
        if (result.error === 'Round is locked') {
          return NextResponse.redirect(new URL(`/league/${leagueId}/picks?round=${roundId}&feedback=locked`, req.url))
        }
        if (result.error === 'Round is not yet open') {
          return NextResponse.redirect(new URL(`/league/${leagueId}/picks?round=${roundId}&feedback=not-open`, req.url))
        }
        return NextResponse.json({ error: result.error }, { status: result.status })
      }

      // Redirect back to picks page with feedback
      const feedbackParam = action === 'add' ? 'added' : 'removed'
      return NextResponse.redirect(new URL(`/league/${leagueId}/picks?round=${roundId}&feedback=${feedbackParam}`, req.url))
    }

    // Handle JSON data
    const body = await req.json()

    // Single pick add/remove via JSON (used by client-side fetch)
    if ('action' in body && (body.action === 'add' || body.action === 'remove')) {
      const { leagueId, roundId, playerId, action } = body

      if (!leagueId || !roundId || !playerId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const result = await processSinglePick(session.user.id!, leagueId, roundId, playerId, action)

      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }

      return NextResponse.json({ success: true, action })
    }

    // Bulk submission
    const result = submitPicksSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { leagueId, roundId, playerIds } = result.data

    const picks = await submitPicks(
      session.user.id,
      leagueId,
      roundId,
      playerIds
    )

    return NextResponse.json({ picks }, { status: 201 })
  } catch (error: any) {
    console.error('Error submitting picks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit picks' },
      { status: 400 }
    )
  }
}
