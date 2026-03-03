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

    await joinLeague(session.user.id, leagueId)

    // Redirect back to the league page (supports HTML form submissions)
    return NextResponse.redirect(new URL(`/league/${leagueId}`, req.url))
  } catch (error: any) {
    console.error('Error joining league:', error)
    // Redirect back with error feedback
    const { id: leagueId } = await params
    return NextResponse.redirect(new URL(`/league/${leagueId}?error=${encodeURIComponent(error.message || 'Failed to join league')}`, req.url))
  }
}
