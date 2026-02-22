// ABOUTME: Admin API route to update the pick lock time for a specific round (PUT).
// Requires ADMIN role. Validates the lockTime is a valid ISO date string before saving.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateRoundLockTime } from '@/lib/services/tournament'

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

    const { id: roundId } = await params
    const body = await req.json()
    const { lockTime } = body

    if (!lockTime) {
      return NextResponse.json({ error: 'lockTime is required' }, { status: 400 })
    }

    const parsedTime = new Date(lockTime)
    if (isNaN(parsedTime.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const round = await updateRoundLockTime(roundId, parsedTime)

    return NextResponse.json({ round })
  } catch (error: any) {
    console.error('Error updating lock time:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update lock time' },
      { status: 500 }
    )
  }
}
