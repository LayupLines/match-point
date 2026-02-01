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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{league.name}</h1>
              <p className="text-gray-600 mt-1">{league.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {league.tournament.name}
              </p>
              <p className="text-sm text-gray-500">
                {league._count.memberships} member{league._count.memberships !== 1 ? 's' : ''}
              </p>
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
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Tournament Rounds</h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {league.tournament.rounds.map((round) => {
                    const now = new Date()
                    const isLocked = new Date(round.lockTime) < now
                    const isPast = isLocked
                    const isCurrent = !isPast && new Date(round.lockTime).getTime() - now.getTime() < 2 * 24 * 60 * 60 * 1000

                    return (
                      <div
                        key={round.id}
                        className={`border rounded-lg p-4 ${
                          isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <h3 className="font-semibold text-lg">{round.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's' : ''} required
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Locks: {new Date(round.lockTime).toLocaleDateString()}
                        </p>
                        {isLocked ? (
                          <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Locked
                          </span>
                        ) : (
                          <Link
                            href={`/league/${id}/picks?round=${round.id}`}
                            className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                          >
                            Make Picks
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Standings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Standings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strikes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correct Picks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {standings.map((standing, index) => (
                      <tr key={standing.id} className={standing.eliminated ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {standing.user.name}
                          {standing.userId === session.user.id && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {standing.strikes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {standing.correctPicks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {standing.eliminated ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-200 text-red-800">
                              Eliminated
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-200 text-green-800">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
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
