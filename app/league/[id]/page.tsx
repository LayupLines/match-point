import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  // Fetch league details with tournament info
  const league = await db.league.findUnique({
    where: { id },
    include: {
      tournament: {
        include: {
          rounds: {
            orderBy: { roundNumber: 'asc' },
          },
        },
      },
      creator: {
        select: { name: true, email: true },
      },
      _count: {
        select: { memberships: true },
      },
    },
  })

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600">League not found</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Check if user is a member
  const membership = await db.leagueMembership.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id!,
        leagueId: id,
      },
    },
  })

  // Get standings if user is a member
  const standings = membership
    ? await db.standings.findMany({
        where: { leagueId: id },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: [
          { eliminated: 'asc' },
          { strikes: 'asc' },
          { correctPicks: 'desc' },
          { lastUpdated: 'asc' },
        ],
      })
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-wimbledon-cream via-white to-wimbledon-cream/50">
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
                {league.name}
              </h1>
              <p className="text-white/70 text-sm sm:text-base">{league.description}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <p className="text-xs sm:text-sm text-white/60 mb-1">
                {league.tournament.name}
              </p>
              <p className="text-3xl sm:text-4xl font-light text-white">
                {league._count.memberships}
              </p>
              <p className="text-xs text-white/60 uppercase tracking-wider">Members</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!membership ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Join this league</h2>
            <p className="text-gray-600 mb-4">
              You're not a member of this league yet. Join to start making picks and compete!
            </p>
            <form action={`/api/leagues/${id}/join`} method="POST">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Join League
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tournament Rounds */}
            <div className="bg-white shadow-xl rounded-2xl mb-8 border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-wide">Tournament Rounds</h2>
                <p className="text-sm text-gray-500 mt-1">Select a round to make your picks</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {league.tournament.rounds.map((round, index) => {
                    const now = new Date()
                    const lockTime = new Date(round.lockTime)
                    const isLocked = lockTime < now
                    const timeUntilLock = lockTime.getTime() - now.getTime()
                    const isClosingSoon = !isLocked && timeUntilLock < 2 * 24 * 60 * 60 * 1000

                    return (
                      <div
                        key={round.id}
                        className={`border-2 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                          isLocked
                            ? 'border-gray-200 bg-gray-50/50'
                            : isClosingSoon
                            ? 'border-status-closing/40 bg-gradient-to-br from-orange-50 to-white'
                            : 'border-wimbledon-green/40 bg-gradient-to-br from-green-50 to-white'
                        }`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animation: 'fadeIn 0.5s ease-out forwards',
                          opacity: 0
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-light text-lg sm:text-xl text-gray-900 tracking-wide mb-2">{round.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <span className="text-wimbledon-purple">📋</span>
                              <span>{round.requiredPicks} pick{round.requiredPicks !== 1 ? 's' : ''} required</span>
                            </div>
                          </div>
                          {!isLocked && (
                            <div className={`w-3 h-3 rounded-full ${
                              isClosingSoon ? 'bg-status-closing' : 'bg-wimbledon-green'
                            } animate-pulse`}></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                          <span>🕒</span>
                          <span className="truncate">{lockTime.toLocaleDateString()} at {lockTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                        {isLocked ? (
                          <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs bg-gray-200 text-gray-600 uppercase tracking-wider rounded-lg">
                            <span>🔒</span>
                            <span>Locked</span>
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/league/${id}/picks?round=${round.id}`}
                              className={`flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg hover:scale-105 hover:shadow-md ${
                                isClosingSoon
                                  ? 'bg-gradient-to-r from-status-closing to-orange-600 text-white'
                                  : 'bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white'
                              }`}
                            >
                              <span>🎯</span>
                              <span>Make Picks</span>
                            </Link>
                            {isClosingSoon && (
                              <p className="text-xs text-status-closing font-semibold mt-2 text-center uppercase tracking-wider animate-pulse">
                                ⚠️ Closing Soon
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>

            {/* Standings */}
            <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-wide">Standings</h2>
                <p className="text-sm text-gray-500 mt-1">Current leaderboard</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Strikes
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Correct
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {standings.map((standing, index) => {
                      const isCurrentUser = standing.userId === session.user.id
                      const isFirst = index === 0 && !standing.eliminated
                      const isTop3 = index < 3 && !standing.eliminated
                      return (
                        <tr
                          key={standing.id}
                          className={`transition-all duration-200 ${
                            standing.eliminated
                              ? 'bg-red-50/30 opacity-60'
                              : isCurrentUser
                              ? 'bg-gradient-to-r from-wimbledon-purple/10 to-wimbledon-green/10 border-l-4 border-l-wimbledon-purple shadow-sm'
                              : 'hover:bg-gray-50/70'
                          }`}
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: 'fadeIn 0.4s ease-out forwards',
                            opacity: 0
                          }}
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm sm:text-base font-semibold ${
                                isFirst ? 'text-2xl text-wimbledon-green' : isTop3 ? 'text-lg text-wimbledon-green' : 'text-gray-900'
                              }`}>
                                {index + 1}
                              </span>
                              {isFirst && <span className="text-xl">🏆</span>}
                              {index === 1 && !standing.eliminated && <span className="text-lg">🥈</span>}
                              {index === 2 && !standing.eliminated && <span className="text-lg">🥉</span>}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base text-gray-900 font-medium">
                                {standing.user.name}
                              </span>
                              {isCurrentUser && (
                                <span className="px-2 py-1 text-xs bg-gradient-to-r from-wimbledon-purple to-wimbledon-purple-dark text-white uppercase tracking-wider rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                              standing.strikes === 0
                                ? 'bg-wimbledon-green/10 text-wimbledon-green'
                                : standing.strikes >= 2
                                ? 'bg-red-100 text-status-locked'
                                : 'bg-orange-100 text-status-closing'
                            }`}>
                              {standing.strikes === 0 ? '✓' : '⚠️'}
                              <span>{standing.strikes}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className="text-sm sm:text-base font-semibold text-gray-900">
                              {standing.correctPicks}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {standing.eliminated ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-600 uppercase tracking-wider rounded-full">
                                <span>❌</span>
                                <span className="hidden sm:inline">Eliminated</span>
                                <span className="sm:hidden">Out</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-wimbledon-green/20 to-wimbledon-green/10 text-wimbledon-green uppercase tracking-wider rounded-full font-semibold">
                                <span>✓</span>
                                <span>Active</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <style jsx>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateX(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `}</style>
          </>
        )}
      </main>
    </div>
  )
}
