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
    <div className="min-h-screen bg-wimbledon-cream">
      {/* Header */}
      <header className="bg-wimbledon-purple shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Link href="/dashboard" className="text-sm text-white/70 hover:text-white mb-3 inline-flex items-center gap-1">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-light text-white tracking-wide">
                {league.name}
              </h1>
              <p className="text-white/70 mt-2">{league.description}</p>
            </div>
            <div className="text-right bg-white/5 px-6 py-4">
              <p className="text-sm text-white/60 mb-1">
                {league.tournament.name}
              </p>
              <p className="text-2xl font-light text-white">
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
            <div className="bg-white shadow-card mb-8">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-light text-gray-900 tracking-wide">Tournament Rounds</h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {league.tournament.rounds.map((round) => {
                    const now = new Date()
                    const lockTime = new Date(round.lockTime)
                    const isLocked = lockTime < now
                    const timeUntilLock = lockTime.getTime() - now.getTime()
                    const isClosingSoon = !isLocked && timeUntilLock < 2 * 24 * 60 * 60 * 1000

                    return (
                      <div
                        key={round.id}
                        className={`border p-5 transition-all hover:shadow-elegant ${
                          isLocked
                            ? 'border-gray-200 bg-gray-50'
                            : isClosingSoon
                            ? 'border-status-closing/30 bg-white'
                            : 'border-wimbledon-green/30 bg-white'
                        }`}
                      >
                        <div className="mb-4">
                          <h3 className="font-light text-lg text-gray-900 tracking-wide">{round.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's' : ''} required
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          {lockTime.toLocaleDateString()} at {lockTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </p>
                        {isLocked ? (
                          <span className="inline-block px-4 py-1.5 text-xs bg-gray-200 text-gray-600 uppercase tracking-wider">
                            Locked
                          </span>
                        ) : (
                          <>
                            <Link
                              href={`/league/${id}/picks?round=${round.id}`}
                              className={`inline-flex items-center justify-center w-full px-4 py-2 text-sm transition-all ${
                                isClosingSoon
                                  ? 'bg-status-closing text-white hover:bg-status-closing/90'
                                  : 'bg-wimbledon-green text-white hover:bg-wimbledon-green-dark'
                              }`}
                            >
                              Make Picks
                            </Link>
                            {isClosingSoon && (
                              <p className="text-xs text-status-closing mt-2 text-center uppercase tracking-wider">
                                Closing Soon
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
            <div className="bg-white shadow-card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-light text-gray-900 tracking-wide">Standings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Strikes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Correct
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {standings.map((standing, index) => {
                      const isCurrentUser = standing.userId === session.user.id
                      const isFirst = index === 0 && !standing.eliminated
                      return (
                        <tr
                          key={standing.id}
                          className={`transition-colors ${
                            standing.eliminated
                              ? 'bg-red-50/30'
                              : isCurrentUser
                              ? 'bg-wimbledon-purple/5 border-l-2 border-l-wimbledon-purple'
                              : 'hover:bg-gray-50/50'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${
                              isFirst ? 'font-bold text-wimbledon-green' : 'text-gray-900'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {standing.user.name}
                            </span>
                            {isCurrentUser && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-wimbledon-purple text-white uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${
                              standing.strikes === 0
                                ? 'text-wimbledon-green'
                                : standing.strikes >= 2
                                ? 'text-status-locked'
                                : 'text-status-closing'
                            }`}>
                              {standing.strikes}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {standing.correctPicks}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {standing.eliminated ? (
                              <span className="inline-block px-3 py-1 text-xs bg-gray-200 text-gray-600 uppercase tracking-wider">
                                Eliminated
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 text-xs bg-wimbledon-green/10 text-wimbledon-green uppercase tracking-wider">
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
