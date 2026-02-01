import { NextRequest, NextResponse } from 'next/server'
import { calculateScoring } from '@/lib/services/scoring'
import { getTournaments } from '@/lib/services/tournament'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active tournaments
    const tournaments = await getTournaments('ACTIVE')

    // Recalculate scoring for each tournament
    for (const tournament of tournaments) {
      await calculateScoring(tournament.id)
    }

    return NextResponse.json({
      message: `Scoring recalculated for ${tournaments.length} tournaments`,
      tournaments: tournaments.map(t => ({ id: t.id, name: t.name }))
    })
  } catch (error: any) {
    console.error('Error in cron scoring:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to recalculate scoring' },
      { status: 500 }
    )
  }
}
