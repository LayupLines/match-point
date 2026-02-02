import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createLeague, getPublicLeagues } from '@/lib/services/league'
import { createLeagueSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gender = searchParams.get('gender') as 'MEN' | 'WOMEN' | null

    const leagues = await getPublicLeagues(gender || undefined)

    return NextResponse.json({ leagues })
  } catch (error) {
    console.error('Error fetching leagues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = createLeagueSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, description, tournamentId } = result.data

    const league = await createLeague(
      name,
      tournamentId,
      session.user.id,
      description
    )

    return NextResponse.json({ league }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating league:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create league' },
      { status: 500 }
    )
  }
}
