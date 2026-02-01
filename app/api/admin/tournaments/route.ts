import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createTournament, getTournaments } from '@/lib/services/tournament'
import { createTournamentSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tournaments = await getTournaments()

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = createTournamentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, year, gender } = result.data

    const tournament = await createTournament(name, year, gender)

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create tournament' },
      { status: 500 }
    )
  }
}
