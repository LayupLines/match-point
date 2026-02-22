// ABOUTME: Admin API route to fetch a single tournament by ID (GET), including its rounds and players.
// Requires ADMIN role and returns 404 if the tournament does not exist.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTournamentById } from '@/lib/services/tournament'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const tournament = await getTournamentById(id)

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    )
  }
}
