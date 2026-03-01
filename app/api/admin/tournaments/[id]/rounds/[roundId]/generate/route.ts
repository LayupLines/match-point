// ABOUTME: Admin API route to auto-generate next round matches from completed round results.
// ABOUTME: Pairs winners by bracket position to create the next round's matchups.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateNextRoundMatches } from '@/lib/services/tournament'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roundId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId, roundId } = await params

    const result = await generateNextRoundMatches(tournamentId, roundId)

    return NextResponse.json({
      message: `${result.matches.length} matches generated for ${result.round.name}`,
      round: result.round,
      matches: result.matches,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error generating next round:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate next round matches' },
      { status: 400 }
    )
  }
}
