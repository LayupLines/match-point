import { NextRequest, NextResponse } from 'next/server'
import { getLeagueStandings } from '@/lib/services/league'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const standings = await getLeagueStandings(id)

    return NextResponse.json({ standings })
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    )
  }
}
