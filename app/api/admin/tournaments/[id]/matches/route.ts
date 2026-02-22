// ABOUTME: Admin API route to list upcoming matches (GET) and create matches from CSV data (POST).
// Requires ADMIN role. POST resolves player names and round numbers to IDs before creating each match.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUpcomingMatches, getTournamentById, addMatch } from '@/lib/services/tournament'
import { parseMatchesCSV } from '@/lib/utils/csv'

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
    const matches = await getUpcomingMatches(id)

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params
    const body = await req.json()
    const { csvData } = body

    if (!csvData) {
      return NextResponse.json({ error: 'CSV data required' }, { status: 400 })
    }

    // Parse CSV into match entries
    const matchEntries = parseMatchesCSV(csvData)

    // Get tournament with rounds and players for name/round resolution
    const tournament = await getTournamentById(tournamentId)
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const createdMatches = []

    for (const entry of matchEntries) {
      // Resolve round number to round ID
      const round = tournament.rounds.find(r => r.roundNumber === entry.roundNumber)
      if (!round) {
        return NextResponse.json(
          { error: `Round ${entry.roundNumber} not found in tournament` },
          { status: 400 }
        )
      }

      // Resolve player names to IDs
      const player1 = tournament.players.find(
        p => p.name.toLowerCase() === entry.player1Name.toLowerCase()
      )
      const player2 = tournament.players.find(
        p => p.name.toLowerCase() === entry.player2Name.toLowerCase()
      )

      if (!player1) {
        return NextResponse.json(
          { error: `Player not found: ${entry.player1Name}` },
          { status: 400 }
        )
      }
      if (!player2) {
        return NextResponse.json(
          { error: `Player not found: ${entry.player2Name}` },
          { status: 400 }
        )
      }

      const match = await addMatch(round.id, player1.id, player2.id)
      createdMatches.push(match)
    }

    return NextResponse.json(
      { message: `${createdMatches.length} matches created`, matches: createdMatches },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating matches:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create matches' },
      { status: 500 }
    )
  }
}
