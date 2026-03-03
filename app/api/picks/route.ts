import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { submitPicks, getUserPicks } from '@/lib/services/picks'
import { submitPicksSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

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

    // Handle form data (single pick add/remove)
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

      const { db } = await import('@/lib/db')

      // Validate membership
      const membership = await db.leagueMembership.findUnique({
        where: { userId_leagueId: { userId: session.user.id!, leagueId } },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 })
      }

      // Validate round exists and belongs to the league's tournament
      const league = await db.league.findUnique({ where: { id: leagueId }, select: { tournamentId: true } })
      const round = await db.round.findUnique({ where: { id: roundId } })
      if (!round || !league || round.tournamentId !== league.tournamentId) {
        return NextResponse.json({ error: 'Invalid round' }, { status: 400 })
      }

      // Check lock time
      if (new Date(round.lockTime) < new Date()) {
        return NextResponse.redirect(new URL(`/league/${leagueId}/picks?round=${roundId}&feedback=locked`, req.url))
      }

      // Check elimination
      const standing = await db.standings.findUnique({
        where: { userId_leagueId: { userId: session.user.id!, leagueId } },
      })
      if (standing?.eliminated) {
        return NextResponse.json({ error: 'You have been eliminated' }, { status: 403 })
      }

      if (action === 'add') {
        // Check player belongs to this tournament
        const player = await db.player.findUnique({ where: { id: playerId } })
        if (!player || player.tournamentId !== league.tournamentId) {
          return NextResponse.json({ error: 'Invalid player' }, { status: 400 })
        }

        // Check player not already used in a prior round
        const priorPick = await db.pick.findFirst({
          where: { userId: session.user.id!, leagueId, playerId, roundId: { not: roundId } },
        })
        if (priorPick) {
          return NextResponse.json({ error: 'Player already used in a prior round' }, { status: 400 })
        }

        // Atomic check+create inside a transaction to prevent race conditions
        try {
          await db.$transaction(async (tx) => {
            const currentPickCount = await tx.pick.count({
              where: { userId: session.user.id!, leagueId, roundId },
            })
            if (currentPickCount >= round.requiredPicks) {
              throw new Error('Maximum picks reached')
            }

            await tx.pick.create({
              data: {
                userId: session.user.id!,
                leagueId,
                roundId,
                playerId,
              },
            })
          })
        } catch (err: any) {
          // Handle unique constraint violation (duplicate pick)
          if (err?.code === 'P2002') {
            return NextResponse.json({ error: 'Player already selected for this round' }, { status: 400 })
          }
          if (err?.message === 'Maximum picks reached') {
            return NextResponse.json({ error: 'Maximum picks reached' }, { status: 400 })
          }
          throw err
        }
      } else {
        // Remove pick
        await db.pick.deleteMany({
          where: {
            userId: session.user.id!,
            leagueId,
            roundId,
            playerId,
          },
        })
      }

      // Redirect back to picks page with feedback
      const feedbackParam = action === 'add' ? 'added' : 'removed'
      return NextResponse.redirect(new URL(`/league/${leagueId}/picks?round=${roundId}&feedback=${feedbackParam}`, req.url))
    }

    // Handle JSON data (bulk submission)
    const body = await req.json()
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
