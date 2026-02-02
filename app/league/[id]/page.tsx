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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-wimbledon-purple to-wimbledon-green shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Link href="/dashboard" className="text-sm text-white/90 hover:text-white mb-2 inline-flex items-center gap-1 font-medium">
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                <span>🏆</span>
                {league.name}
              </h1>
              <p className="text-white/90 mt-2 text-lg">{league.description}</p>
            </div>
            <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4">
              <p className="text-sm text-white/80 mb-1">
                {league.tournament.name}
              </p>
              <p className="text-2xl font-bold text-white flex items-center justify-end gap-1">
                <span>👥</span>
                {league._count.memberships}
              </p>
              <p className="text-xs text-white/70">members</p>
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
            <div className="bg-white rounded-xl shadow-card border border-gray-100 mb-8">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🎾</span>
                  Tournament Rounds
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {league.tournament.rounds.map((round) => {
                    const now = new Date()
                    const lockTime = new Date(round.lockTime)
                    const isLocked = lockTime < now
                    const timeUntilLock = lockTime.getTime() - now.getTime()
                    const isClosingSoon = !isLocked && timeUntilLock < 2 * 24 * 60 * 60 * 1000
                    const isOpen = !isLocked && !isClosingSoon

                    return (
                      <div
                        key={round.id}
                        className={`border-2 rounded-xl p-5 transition-all shadow-card hover:shadow-card-hover ${
                          isLocked
                            ? 'border-gray-200 bg-gray-50'
                            : isClosingSoon
                            ? 'border-status-closing bg-status-closing/5'
                            : 'border-status-open bg-status-open/5'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-xl text-gray-900">{round.name}</h3>
                          {isLocked ? (
                            <span className="text-xl">🔒</span>
                          ) : isClosingSoon ? (
                            <span className="text-xl">⚠️</span>
                          ) : (
                            <span className="text-xl">✅</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-medium mb-3 flex items-center gap-1">
                          <span>📋</span>
                          {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's' : ''} required
                        </p>
                        <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                          <span>🕒</span>
                          {lockTime.toLocaleDateString()} at {lockTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </p>
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-status-locked text-white rounded-lg font-semibold">
                            <span>🔒</span> Locked
                          </span>
                        ) : (
                          <>
                            <Link
                              href={`/league/${id}/picks?round=${round.id}`}
                              className={`inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md ${
                                isClosingSoon
                                  ? 'bg-status-closing text-white hover:bg-status-closing/90'
                                  : 'bg-wimbledon-purple text-white hover:bg-wimbledon-purple-dark'
                              }`}
                            >
                              <span>🎯</span>
                              Make Picks
                            </Link>
                            {isClosingSoon && (
                              <p className="text-xs text-status-closing font-semibold mt-2 text-center">
                                ⏰ Closing Soon!
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

            {/* Standings */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📊</span>
                  Standings
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-wimbledon-purple/10 to-wimbledon-green/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Strikes
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Correct Picks
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {standings.map((standing, index) => {
                      const isCurrentUser = standing.userId === session.user.id
                      const isTop3 = index < 3 && !standing.eliminated
                      return (
                        <tr
                          key={standing.id}
                          className={`transition-colors ${
                            standing.eliminated
                              ? 'bg-red-50/50'
                              : isCurrentUser
                              ? 'bg-wimbledon-purple/5 border-l-4 border-l-wimbledon-purple'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${
                                isTop3 ? 'text-wimbledon-green' : 'text-gray-900'
                              }`}>
                                {index + 1}
                              </span>
                              {index === 0 && !standing.eliminated && <span className="text-xl">🥇</span>}
                              {index === 1 && !standing.eliminated && <span className="text-xl">🥈</span>}
                              {index === 2 && !standing.eliminated && <span className="text-xl">🥉</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {standing.user.name}
                            </span>
                            {isCurrentUser && (
                              <span className="ml-2 px-2 py-1 text-xs font-bold bg-wimbledon-purple text-white rounded-full">
                                YOU
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-bold ${
                              standing.strikes === 0
                                ? 'text-status-open'
                                : standing.strikes >= 2
                                ? 'text-status-locked'
                                : 'text-status-closing'
                            }`}>
                              {standing.strikes === 0 ? '✓' : `⚠️ ${standing.strikes}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-wimbledon-green">
                              {standing.correctPicks}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {standing.eliminated ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-status-locked text-white">
                                <span>❌</span>
                                Eliminated
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-status-open text-white">
                                <span>✓</span>
                                Active
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
          </>
        )}
      </main>
    </div>
  )
}
