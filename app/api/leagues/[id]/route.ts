import { NextRequest, NextResponse } from 'next/server'
import { getLeagueDetails } from '@/lib/services/league'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const league = await getLeagueDetails(id)

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    return NextResponse.json({ league })
  } catch (error) {
    console.error('Error fetching league:', error)
    return NextResponse.json(
      { error: 'Failed to fetch league' },
      { status: 500 }
    )
  }
}
