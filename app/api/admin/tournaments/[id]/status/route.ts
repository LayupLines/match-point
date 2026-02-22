// ABOUTME: Admin API route to update a tournament's status (PUT): UPCOMING to ACTIVE to COMPLETED.
// Requires ADMIN role and validates the new status against the TournamentStatus enum.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateTournamentStatus } from '@/lib/services/tournament'
import { TournamentStatus } from '@prisma/client'

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

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !Object.values(TournamentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: UPCOMING, ACTIVE, COMPLETED' },
        { status: 400 }
      )
    }

    const tournament = await updateTournamentStatus(id, status)

    return NextResponse.json({ tournament })
  } catch (error: any) {
    console.error('Error updating tournament status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update tournament status' },
      { status: 500 }
    )
  }
}
