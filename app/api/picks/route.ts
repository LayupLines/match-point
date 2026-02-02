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

      const { db } = await import('@/lib/db')
      const { redirect } = await import('next/navigation')

      if (action === 'add') {
        // Add pick
        await db.pick.create({
          data: {
            userId: session.user.id!,
            leagueId,
            roundId,
            playerId,
          },
        })
      } else if (action === 'remove') {
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

      // Redirect back to picks page
      return NextResponse.redirect(new URL(`/league/${leagueId}/picks?round=${roundId}`, req.url))
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
