import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function LeaguesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  // Fetch all public leagues
  const leagues = await db.league.findMany({
    include: {
      tournament: {
        select: {
          name: true,
          year: true,
          gender: true,
          status: true,
        },
      },
      creator: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          memberships: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get user's memberships
  const userMemberships = await db.leagueMembership.findMany({
    where: {
      userId: session.user.id!,
    },
    select: {
      leagueId: true,
    },
  })

  const membershipSet = new Set(userMemberships.map((m) => m.leagueId))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Browse Leagues</h1>
              <p className="text-gray-600 mt-1">Join a league and start competing</p>
            </div>
            <Link
              href="/leagues/create"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create League
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {leagues.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No leagues yet</h2>
            <p className="text-gray-600 mb-6">Be the first to create a league!</p>
            <Link
              href="/leagues/create"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create League
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => {
              const isMember = membershipSet.has(league.id)

              return (
                <div key={league.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{league.name}</h3>
                      {isMember && (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-200 text-blue-800">
                          Joined
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{league.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Tournament:</span>
                        <span className="ml-2">{league.tournament.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Creator:</span>
                        <span className="ml-2">{league.creator.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Members:</span>
                        <span className="ml-2">{league._count.memberships}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium">Status:</span>
                        <span
                          className={`ml-2 px-2 py-1 text-xs rounded ${
                            league.tournament.status === 'ACTIVE'
                              ? 'bg-green-200 text-green-800'
                              : league.tournament.status === 'UPCOMING'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {league.tournament.status}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/league/${league.id}`}
                      className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      View League
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
