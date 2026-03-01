import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { getFlagPath, getCountryName } from '@/lib/utils/country'
import { CountdownTimer } from '@/components/countdown-timer'
import { PlayerGrid } from '@/components/player-grid'
import { evaluatePicksDetailed } from '@/lib/services/pick-evaluation'
import type { MatchResult, PickData } from '@/lib/services/pick-evaluation'

export const runtime = 'nodejs'

export default async function PicksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ round?: string; feedback?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const { id: leagueId } = await params
  const { round: roundId, feedback } = await searchParams

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

  // When round is locked, fetch matches and compute per-pick outcomes
  let pickOutcomes: { playerId: string; status: 'win' | 'loss' | 'pending'; reason: string; bonus: boolean }[] = []
  if (isLocked && existingPicks.length > 0) {
    const matches = await db.match.findMany({
      where: { roundId },
      select: {
        roundId: true,
        player1Id: true,
        player2Id: true,
        winnerId: true,
        isWalkover: true,
        retiredPlayerId: true,
      },
    })

    const matchResults: MatchResult[] = matches.map(m => ({
      roundId: m.roundId,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      winnerId: m.winnerId,
      isWalkover: m.isWalkover,
      retiredPlayerId: m.retiredPlayerId,
    }))

    const pickData: PickData[] = existingPicks.map(p => ({
      playerId: p.playerId,
      roundId: p.roundId,
      round: { roundNumber: round.roundNumber },
      submittedAt: p.submittedAt,
    }))

    pickOutcomes = evaluatePicksDetailed(pickData, matchResults)
  }

  // Build a map from playerId to outcome for easy lookup
  const outcomeByPlayer = new Map(pickOutcomes.map(o => [o.playerId, o]))

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
      <header className="bg-gradient-to-r from-wimbledon-purple via-wimbledon-purple-dark to-wimbledon-purple shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 py-5 sm:py-6 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="w-full sm:w-auto">
              <Link
                href={`/league/${leagueId}`}
                className="text-xs sm:text-sm text-white/70 hover:text-white mb-2 inline-flex items-center gap-1 transition-all duration-300 hover:gap-2"
              >
                <span>←</span> Back to League
              </Link>
              <h1 className="text-2xl sm:text-3xl font-light text-white tracking-wide mb-1">
                {round.name}
              </h1>
              <p className="text-xs sm:text-sm text-white/60">{league.name}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-white/20 w-full sm:w-auto">
              <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
                🕒 <CountdownTimer lockTime={round.lockTime.toISOString()} className="text-white/80" />
              </p>
              <p className="text-sm sm:text-base text-white font-medium">
                {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's' : ''} required
              </p>
              {isLocked && (
                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 text-xs bg-status-locked text-white uppercase tracking-wider rounded-full">
                  <span>🔒</span> Locked
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
          <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-wide">Your Picks</h2>
              {pickOutcomes.some(o => o.status === 'pending') ? (
                <p className="text-sm text-gray-500 mt-1">Some results are still pending</p>
              ) : pickOutcomes.length > 0 ? (
                <p className="text-sm text-gray-500 mt-1">All results are in</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">Waiting for match results</p>
              )}
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {existingPicks.map((pick) => {
                  const outcome = outcomeByPlayer.get(pick.playerId)
                  const status = outcome?.status ?? 'pending'
                  const reason = outcome?.reason ?? 'Awaiting result'
                  const bonus = outcome?.bonus ?? false

                  return (
                    <div
                      key={pick.id}
                      className={`rounded-xl p-5 transition-all duration-300 relative overflow-hidden ${
                        status === 'win'
                          ? 'border-2 border-wimbledon-green/40 bg-gradient-to-br from-green-50 to-white'
                          : status === 'loss'
                            ? 'border-2 border-red-300/40 bg-gradient-to-br from-red-50 to-white'
                            : 'border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white'
                      }`}
                    >
                      {/* Status indicator */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-lg leading-tight">{pick.player.name}</p>
                          {pick.player.seed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-wimbledon-purple/10 text-wimbledon-purple text-xs rounded-full mt-1">
                              <span>🏆</span> Seed {pick.player.seed}
                            </span>
                          )}
                          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                            <img
                              src={getFlagPath(pick.player.country)}
                              alt={getCountryName(pick.player.country)}
                              className="w-4 h-3 object-cover rounded-sm border border-gray-200 shadow-sm"
                            />
                            <span className="font-medium">{getCountryName(pick.player.country)}</span>
                          </p>
                        </div>
                        <span className="text-2xl">
                          {status === 'win' ? '✅' : status === 'loss' ? '❌' : '⏳'}
                        </span>
                      </div>

                      {/* Result badge */}
                      <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
                        status === 'win'
                          ? 'bg-wimbledon-green/10 text-wimbledon-green'
                          : status === 'loss'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="block text-xs uppercase tracking-wider mb-0.5">
                          {status === 'win' ? (bonus ? 'Correct Pick +1 Bonus' : 'Correct Pick') : status === 'loss' ? 'Strike' : 'Pending'}
                        </span>
                        <span className="text-xs font-normal opacity-80">{reason}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              {pickOutcomes.length > 0 && !pickOutcomes.some(o => o.status === 'pending') && (
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                    <span>✅</span>
                    <span className="text-sm font-semibold text-wimbledon-green">
                      {pickOutcomes.filter(o => o.status === 'win').length} correct
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full">
                    <span>❌</span>
                    <span className="text-sm font-semibold text-red-700">
                      {pickOutcomes.filter(o => o.status === 'loss').length} strike{pickOutcomes.filter(o => o.status === 'loss').length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Current Picks Summary with Progress Bar */}
            {existingPicks.length > 0 && (
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-wimbledon-purple/20 p-6 mb-6 shadow-xl rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-wimbledon-purple/10 to-wimbledon-green/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">📋</span>
                        <h3 className="text-lg sm:text-xl font-light text-gray-900 tracking-wide">
                          Current Selection
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {existingPicks.map((p) => p.player.name).join(', ')}
                      </p>
                    </div>
                    {existingPicks.length === round.requiredPicks && (
                      <span className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white text-xs uppercase tracking-wider rounded-full shadow-lg animate-pulse">
                        <span>✓</span> Complete
                      </span>
                    )}
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-wimbledon-purple">
                        {existingPicks.length} / {round.requiredPicks}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-wimbledon-purple via-wimbledon-green to-wimbledon-green-dark h-full transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${round.requiredPicks > 0 ? (existingPicks.length / round.requiredPicks) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      {round.requiredPicks > 0 ? Math.round((existingPicks.length / round.requiredPicks) * 100) : 0}% complete
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-wimbledon-purple/20 p-6 mb-6 shadow-lg rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💡</span>
                <h2 className="text-lg sm:text-xl font-light text-gray-900 tracking-wide">Instructions</h2>
              </div>
              <ul className="space-y-3 text-gray-700 text-sm sm:text-base">
                <li className="flex items-start gap-3 p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <span className="text-wimbledon-green mt-1 text-lg">→</span>
                  <span>Select exactly <strong>{round.requiredPicks} player{round.requiredPicks !== 1 ? 's' : ''}</strong> from the list below</span>
                </li>
                <li className="flex items-start gap-3 p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <span className="text-wimbledon-purple mt-1 text-lg">→</span>
                  <span>You cannot pick players you've already used in previous rounds</span>
                </li>
                <li className="flex items-start gap-3 p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <span className="text-wimbledon-green mt-1 text-lg">→</span>
                  <span>Your selections are saved automatically</span>
                </li>
              </ul>
            </div>

            {/* Player Grid */}
            <PlayerGrid
              players={allPlayers.map((p) => ({
                id: p.id,
                name: p.name,
                seed: p.seed,
                country: p.country,
              }))}
              usedPlayerIds={Array.from(usedPlayerIds)}
              currentPickIds={Array.from(currentPickIds)}
              requiredPicks={round.requiredPicks}
              existingPickCount={existingPicks.length}
              leagueId={leagueId}
              roundId={roundId}
              tournamentName={league.tournament.name}
              feedback={feedback}
            />

            {/* Submit Notice */}
            {existingPicks.length === round.requiredPicks && (
              <div className="mt-6 bg-gradient-to-r from-wimbledon-green/10 via-wimbledon-green/5 to-transparent border-2 border-wimbledon-green/30 p-6 shadow-xl rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-wimbledon-green/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl animate-bounce">🎉</span>
                    <h3 className="text-xl sm:text-2xl font-light text-gray-900 tracking-wide">
                      Selection Complete!
                    </h3>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                    Your {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's have' : ' has'} been saved successfully.
                    They will be locked when the round begins at <strong>{new Date(round.lockTime).toLocaleString()}</strong>.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
