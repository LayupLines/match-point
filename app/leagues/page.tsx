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
    <div className="min-h-screen relative">
      {/* Grass court background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: 'url(/grass-court.jpg)' }}
      />
      {/* Semi-transparent overlay for readability */}
      <div className="fixed inset-0 bg-white/75 -z-10" />

      {/* Header */}
      <header className="bg-gradient-to-r from-wimbledon-purple via-wimbledon-purple-dark to-wimbledon-purple shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
            <div className="flex-1 w-full">
              <Link href="/dashboard" className="text-xs sm:text-sm text-white/70 hover:text-white mb-3 inline-flex items-center gap-1 transition-colors duration-300 hover:gap-2">
                <span>←</span> Back to Dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-wide mb-2">
                Browse Leagues
              </h1>
              <p className="text-white/70 text-sm sm:text-base">Join a league and start competing</p>
            </div>
            <Link
              href="/leagues/create"
              className="bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white px-6 py-3 rounded-xl hover:scale-105 hover:shadow-md transition-all duration-300 text-sm font-medium"
            >
              Create League
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {leagues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <span className="text-4xl mb-4 block">🏆</span>
            <h2 className="text-xl font-light text-gray-900 tracking-wide mb-2">No leagues yet</h2>
            <p className="text-gray-600 mb-6">Be the first to create a league!</p>
            <Link
              href="/leagues/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white text-sm font-medium rounded-lg hover:scale-105 hover:shadow-md transition-all duration-300"
            >
              Create League
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => {
              const isMember = membershipSet.has(league.id)

              return (
                <div
                  key={league.id}
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-light text-lg sm:text-xl text-gray-900 tracking-wide">{league.name}</h3>
                      {isMember && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-wimbledon-purple to-wimbledon-purple-dark text-white uppercase tracking-wider">
                          Joined
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{league.description}</p>

                    <div className="space-y-2 mb-5 pb-5 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-wimbledon-purple">🎾</span>
                        <span>{league.tournament.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-wimbledon-purple">👤</span>
                        <span>{league.creator.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-wimbledon-purple">👥</span>
                        <span>{league._count.memberships} member{league._count.memberships !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                            league.tournament.status === 'ACTIVE'
                              ? 'bg-wimbledon-green/10 text-wimbledon-green'
                              : league.tournament.status === 'UPCOMING'
                              ? 'bg-orange-100 text-status-closing'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {league.tournament.status}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/league/${league.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg hover:scale-105 hover:shadow-md bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white"
                    >
                      <span>🏆</span>
                      <span>View League</span>
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
