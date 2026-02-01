import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function PicksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ round?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id: leagueId } = await params
  const { round: roundId } = await searchParams

  if (!roundId) {
    redirect(`/league/${leagueId}`)
  }

  // Fetch league with tournament info
  const league = await db.league.findUnique({
    where: { id: leagueId },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          gender: true,
        },
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

  // Check membership
  const membership = await db.leagueMembership.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id!,
        leagueId,
      },
    },
  })

  if (!membership) {
    redirect(`/league/${leagueId}`)
  }

  // Fetch round details
  const round = await db.round.findUnique({
    where: { id: roundId },
  })

  if (!round || round.tournamentId !== league.tournamentId) {
    redirect(`/league/${leagueId}`)
  }

  // Check if round is locked
  const now = new Date()
  const isLocked = new Date(round.lockTime) < now

  // Get existing picks for this round
  const existingPicks = await db.pick.findMany({
    where: {
      userId: session.user.id!,
      leagueId,
      roundId,
    },
    include: {
      player: true,
    },
  })

  // Get all players for this tournament
  const allPlayers = await db.player.findMany({
    where: {
      tournamentId: league.tournamentId,
    },
    orderBy: [{ seed: 'asc' }, { name: 'asc' }],
  })

  // Get all previously used players by this user in this league
  const previousPicks = await db.pick.findMany({
    where: {
      userId: session.user.id!,
      leagueId,
      roundId: { not: roundId },
    },
    select: {
      playerId: true,
    },
  })

  const usedPlayerIds = new Set(previousPicks.map((p) => p.playerId))
  const currentPickIds = new Set(existingPicks.map((p) => p.playerId))

  // Check if user is eliminated
  const standing = await db.standings.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id!,
        leagueId,
      },
    },
  })

  const isEliminated = standing?.eliminated || false

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href={`/league/${leagueId}`}
                className="text-sm text-blue-600 hover:underline mb-1 inline-block"
              >
                ← Back to League
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{round.name}</h1>
              <p className="text-sm text-gray-600">{league.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Lock Time: {new Date(round.lockTime).toLocaleString()}
              </p>
              <p className="text-sm font-semibold text-gray-700">
                {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's' : ''} required
              </p>
              {isLocked && (
                <span className="inline-block mt-1 px-3 py-1 text-sm bg-red-200 text-red-800 rounded">
                  Round Locked
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isEliminated ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">You've been eliminated</h2>
            <p className="text-red-700">You can no longer make picks in this league.</p>
          </div>
        ) : isLocked && existingPicks.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Round Locked</h2>
            <p className="text-yellow-700">
              This round has locked and you didn't submit any picks. You will receive strikes for any
              matches where you could have made picks.
            </p>
          </div>
        ) : isLocked ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Picks (Locked)</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {existingPicks.map((pick) => (
                <div key={pick.id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{pick.player.name}</p>
                      {pick.player.seed && (
                        <p className="text-sm text-gray-600">Seed {pick.player.seed}</p>
                      )}
                      <p className="text-sm text-gray-500">{pick.player.country}</p>
                    </div>
                    <div className="text-2xl">🎾</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Results will be available once the admin enters match outcomes.
            </p>
          </div>
        ) : (
          <>
            {/* Current Picks Summary */}
            {existingPicks.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Current Picks: {existingPicks.length} / {round.requiredPicks}
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {existingPicks.map((p) => p.player.name).join(', ')}
                    </p>
                  </div>
                  {existingPicks.length === round.requiredPicks && (
                    <span className="px-3 py-1 bg-green-200 text-green-800 rounded text-sm font-semibold">
                      Ready to submit
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-2">How to Pick</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                <li>Select exactly {round.requiredPicks} player{round.requiredPicks !== 1 ? 's' : ''} from the list below</li>
                <li>You cannot pick players you've already used in previous rounds (marked as "Burned")</li>
                <li>Once submitted, your picks are locked for this round</li>
                <li>Players marked with a seed number are seeded players</li>
              </ul>
            </div>

            {/* Player Grid */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Available Players</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {allPlayers.length} players for {league.tournament.name}
                </p>
              </div>
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {allPlayers.map((player) => {
                    const isUsed = usedPlayerIds.has(player.id)
                    const isPicked = currentPickIds.has(player.id)
                    const canSelect = !isUsed && !isPicked && existingPicks.length < round.requiredPicks

                    return (
                      <div
                        key={player.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isPicked
                            ? 'border-blue-500 bg-blue-50'
                            : isUsed
                            ? 'border-gray-300 bg-gray-100 opacity-60'
                            : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{player.name}</p>
                            {player.seed && (
                              <p className="text-sm text-gray-600">Seed {player.seed}</p>
                            )}
                            <p className="text-xs text-gray-500">{player.country}</p>
                          </div>
                          {isPicked && <span className="text-blue-600 text-xl">✓</span>}
                          {isUsed && !isPicked && (
                            <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">
                              Burned
                            </span>
                          )}
                        </div>

                        {!isUsed && (
                          <form action="/api/picks" method="POST">
                            <input type="hidden" name="leagueId" value={leagueId} />
                            <input type="hidden" name="roundId" value={roundId} />
                            <input type="hidden" name="playerId" value={player.id} />
                            <input
                              type="hidden"
                              name="action"
                              value={isPicked ? 'remove' : 'add'}
                            />
                            <button
                              type="submit"
                              disabled={!isPicked && !canSelect}
                              className={`w-full mt-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                                isPicked
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : canSelect
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {isPicked ? 'Remove' : 'Select'}
                            </button>
                          </form>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Submit Notice */}
            {existingPicks.length === round.requiredPicks && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Picks Complete!
                </h3>
                <p className="text-green-700">
                  You've selected all {round.requiredPicks} required picks. Your picks are automatically
                  saved and will be locked when the round begins at{' '}
                  {new Date(round.lockTime).toLocaleString()}.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
