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
    <div className="min-h-screen bg-wimbledon-cream">
      {/* Header */}
      <header className="bg-wimbledon-purple shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href={`/league/${leagueId}`}
                className="text-sm text-white/70 hover:text-white mb-2 inline-flex items-center gap-1"
              >
                ← Back to League
              </Link>
              <h1 className="text-2xl font-light text-white tracking-wide">
                {round.name}
              </h1>
              <p className="text-sm text-white/60 mt-1">{league.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60 uppercase tracking-wider">
                Locks: {new Date(round.lockTime).toLocaleDateString()}
              </p>
              <p className="text-sm text-white mt-1">
                {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's' : ''} required
              </p>
              {isLocked && (
                <span className="inline-block mt-2 px-3 py-1 text-xs bg-status-locked text-white uppercase tracking-wider">
                  Locked
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
            {/* Current Picks Summary with Progress Bar */}
            {existingPicks.length > 0 && (
              <div className="bg-white border border-wimbledon-purple/20 p-6 mb-6 shadow-card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-light text-gray-900 tracking-wide">
                      Current Selection: {existingPicks.length} / {round.requiredPicks}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      {existingPicks.map((p) => p.player.name).join(', ')}
                    </p>
                  </div>
                  {existingPicks.length === round.requiredPicks && (
                    <span className="px-4 py-1.5 bg-wimbledon-green text-white text-xs uppercase tracking-wider">
                      Complete
                    </span>
                  )}
                </div>
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 h-1">
                    <div
                      className="bg-wimbledon-green h-full transition-all duration-500"
                      style={{ width: `${(existingPicks.length / round.requiredPicks) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    {existingPicks.length} of {round.requiredPicks} selected
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white border border-gray-200 p-6 mb-6 shadow-card">
              <h2 className="text-lg font-light mb-4 text-gray-900 tracking-wide">Instructions</h2>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-wimbledon-green mt-1">•</span>
                  <span>Select exactly {round.requiredPicks} player{round.requiredPicks !== 1 ? 's' : ''} from the list below</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-wimbledon-green mt-1">•</span>
                  <span>You cannot pick players you've already used in previous rounds</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-wimbledon-green mt-1">•</span>
                  <span>Your selections are saved automatically</span>
                </li>
              </ul>
            </div>

            {/* Player Grid */}
            <div className="bg-white shadow-card">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-2xl font-light text-gray-900 tracking-wide">
                  Available Players
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {allPlayers.length} players • {league.tournament.name}
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
                        className={`border p-4 transition-all ${
                          isPicked
                            ? 'border-wimbledon-green bg-wimbledon-green/5'
                            : isUsed
                            ? 'border-gray-200 bg-gray-50 opacity-50'
                            : 'border-gray-200 hover:border-wimbledon-green/50 hover:shadow-elegant bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-light text-gray-900 leading-tight">{player.name}</p>
                            {player.seed && (
                              <span className="inline-block text-xs text-gray-500 mt-1">
                                Seed {player.seed}
                              </span>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {player.country}
                            </p>
                          </div>
                          {isPicked && <span className="text-wimbledon-green text-xl">✓</span>}
                          {isUsed && !isPicked && (
                            <span className="text-xs bg-gray-300 text-gray-600 px-2 py-0.5 uppercase tracking-wider">
                              Used
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
                              className={`w-full mt-3 px-4 py-2 text-sm transition-all ${
                                isPicked
                                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  : canSelect
                                  ? 'bg-wimbledon-green text-white hover:bg-wimbledon-green-dark'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
              <div className="mt-6 bg-wimbledon-green/5 border border-wimbledon-green/30 p-6 shadow-card">
                <h3 className="text-lg font-light text-gray-900 mb-2 tracking-wide">
                  Selection Complete
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's have' : ' has'} been saved.
                  They will be locked when the round begins at {new Date(round.lockTime).toLocaleString()}.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
