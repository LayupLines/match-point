import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addPlayers } from '@/lib/services/tournament'
import { parsePlayersCSV } from '@/lib/utils/csv'

export const runtime = 'nodejs'

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

    const players = parsePlayersCSV(csvData)
    const createdPlayers = await addPlayers(tournamentId, players)

    return NextResponse.json(
      { message: `${createdPlayers.length} players added`, players: createdPlayers },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error adding players:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add players' },
      { status: 500 }
    )
  }
}
