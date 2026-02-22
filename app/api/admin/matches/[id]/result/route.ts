// ABOUTME: Admin API route to record a match result and immediately trigger scoring recalculation (PUT).
// Requires ADMIN role. Accepts winnerId with optional walkover and retiredPlayerId flags.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { scoreMatch } from '@/lib/services/scoring'
import { enterResultSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: matchId } = await params
    const body = await req.json()
    const result = enterResultSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { winnerId, isWalkover, retiredPlayerId } = result.data

    // Enter result and trigger immediate scoring
    await scoreMatch(matchId, winnerId, isWalkover || false, retiredPlayerId)

    return NextResponse.json(
      { message: 'Result entered and scoring updated' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error entering result:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to enter result' },
      { status: 500 }
    )
  }
}
