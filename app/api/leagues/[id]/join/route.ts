import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { joinLeague } from '@/lib/services/league'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await params

    const league = await joinLeague(session.user.id, leagueId)

    return NextResponse.json({ league }, { status: 200 })
  } catch (error: any) {
    console.error('Error joining league:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join league' },
      { status: 400 }
    )
  }
}
