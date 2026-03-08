// ABOUTME: Client component for the player selection grid on the picks page.
// ABOUTME: Uses optimistic updates with client-side fetch to avoid full-page reloads.
'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { getFlagPath, getCountryName } from '@/lib/utils/country'

type Player = {
  id: string
  name: string
  seed: number | null
  country: string | null
}

type MatchData = {
  id: string
  player1: Player
  player2: Player
  bracketPosition: number | null
}

function PlayerHalf({
  player,
  isUsed,
  isPicked,
  canSelect,
  isBye,
  opponentPicked,
  isPending,
  winPct,
  onPick,
}: {
  player: Player
  isUsed: boolean
  isPicked: boolean
  canSelect: boolean
  isBye?: boolean
  opponentPicked?: boolean
  isPending?: boolean
  winPct?: number
  onPick?: (playerId: string, action: 'add' | 'remove') => void
}) {
  return (
    <div className={`flex-1 p-4 transition-opacity duration-300 ${isPicked ? 'bg-wimbledon-green/5' : ''} ${opponentPicked ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 leading-tight mb-1 flex items-center gap-1.5 min-w-0">
            <span className="truncate">{player.name}</span>
            {player.seed && (
              <span className="inline-flex items-center px-2 py-0.5 bg-wimbledon-purple/10 text-wimbledon-purple text-xs rounded-full shrink-0">
                Seed {player.seed}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
            <img
              src={getFlagPath(player.country)}
              alt={getCountryName(player.country)}
              className="w-4 h-3 object-cover rounded-sm border border-gray-200 shadow-sm"
            />
            <span className="font-medium">{getCountryName(player.country)}</span>
            {winPct != null && (
              <span className="ml-auto text-[11px] font-semibold text-gray-400">{winPct}%</span>
            )}
          </p>
        </div>
        {isPicked && <span className="text-wimbledon-green text-xl flex-shrink-0">✓</span>}
        {isUsed && !isPicked && (
          <span className="text-xs bg-gray-300 text-gray-600 px-2 py-1 uppercase tracking-wider rounded-full flex-shrink-0">
            Used
          </span>
        )}
      </div>
      {!isUsed && !isBye && !opponentPicked && (
        <button
          type="button"
          onClick={() => onPick?.(player.id, isPicked ? 'remove' : 'add')}
          disabled={isPending || (!isPicked && !canSelect)}
          className={`w-full mt-2 px-3 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg ${
            isPending
              ? 'bg-gray-200 text-gray-500 cursor-wait'
              : isPicked
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : canSelect
                  ? 'bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isPending ? '...' : isPicked ? '✕ Remove' : '+ Select'}
        </button>
      )}
    </div>
  )
}

export function PlayerGrid({
  players,
  matches = [],
  byePlayerIds = [],
  usedPlayerIds,
  currentPickIds,
  requiredPicks,
  leagueId,
  roundId,
  tournamentName,
  feedback,
  matchOdds = {},
}: {
  players: Player[]
  matches?: MatchData[]
  byePlayerIds?: string[]
  usedPlayerIds: string[]
  currentPickIds: string[]
  requiredPicks: number
  leagueId: string
  roundId: string
  tournamentName: string
  feedback?: string | null
  matchOdds?: Record<string, { player1Pct: number; player2Pct: number }>
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [localPickIds, setLocalPickIds] = useState<string[]>(currentPickIds)
  const [localFeedback, setLocalFeedback] = useState<string | null>(feedback ?? null)
  const [feedbackTrigger, setFeedbackTrigger] = useState(0)
  const [showFeedback, setShowFeedback] = useState(!!feedback)
  const [pendingPlayers, setPendingPlayers] = useState<Set<string>>(new Set())

  const usedSet = new Set(usedPlayerIds)
  const pickedSet = new Set(localPickIds)
  const byeSet = new Set(byePlayerIds)
  const hasMatchups = matches.length > 0
  const playerById = new Map(players.map(p => [p.id, p]))

  // Auto-dismiss feedback after 3 seconds
  useEffect(() => {
    if (!localFeedback) return
    setShowFeedback(true)
    const timer = setTimeout(() => setShowFeedback(false), 3000)
    return () => clearTimeout(timer)
  }, [localFeedback, feedbackTrigger])

  // Handle pick add/remove with optimistic updates
  const handlePick = async (playerId: string, action: 'add' | 'remove') => {
    // Optimistic update
    if (action === 'add') {
      setLocalPickIds(prev => [...prev, playerId])
    } else {
      setLocalPickIds(prev => prev.filter(id => id !== playerId))
    }
    setLocalFeedback(action === 'add' ? 'added' : 'removed')
    setFeedbackTrigger(prev => prev + 1)
    setPendingPlayers(prev => new Set(prev).add(playerId))

    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, roundId, playerId, action }),
      })

      if (!res.ok) {
        // Roll back
        if (action === 'add') {
          setLocalPickIds(prev => prev.filter(id => id !== playerId))
        } else {
          setLocalPickIds(prev => [...prev, playerId])
        }
        const data = await res.json().catch(() => ({ error: 'Request failed' }))
        setLocalFeedback(data.error || 'Something went wrong')
        setFeedbackTrigger(prev => prev + 1)
      }
    } catch {
      // Roll back on network error
      if (action === 'add') {
        setLocalPickIds(prev => prev.filter(id => id !== playerId))
      } else {
        setLocalPickIds(prev => [...prev, playerId])
      }
      setLocalFeedback('Network error — please try again')
      setFeedbackTrigger(prev => prev + 1)
    } finally {
      setPendingPlayers(prev => {
        const next = new Set(prev)
        next.delete(playerId)
        return next
      })
    }
  }

  // Search helper
  const playerMatchesQuery = (player: Player, query: string) => {
    const nameMatch = player.name.toLowerCase().includes(query)
    const countryMatch = player.country
      ? getCountryName(player.country).toLowerCase().includes(query)
      : false
    return nameMatch || countryMatch
  }

  // Filter matches by search query (either player matches)
  const filteredMatches = searchQuery.trim()
    ? matches.filter((match) => {
        const query = searchQuery.toLowerCase()
        return playerMatchesQuery(match.player1, query) || playerMatchesQuery(match.player2, query)
      })
    : matches

  // Filter bye players by search query
  const byePlayers = players.filter(p => byeSet.has(p.id))
  const filteredByePlayers = searchQuery.trim()
    ? byePlayers.filter(p => playerMatchesQuery(p, searchQuery.toLowerCase()))
    : byePlayers

  // Filter players by search query (flat grid fallback)
  const filteredPlayers = searchQuery.trim()
    ? players.filter((player) => playerMatchesQuery(player, searchQuery.toLowerCase()))
    : players

  const noResults = hasMatchups
    ? filteredMatches.length === 0 && filteredByePlayers.length === 0
    : filteredPlayers.length === 0

  return (
    <>
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        {/* Feedback banner */}
        {showFeedback && localFeedback && (
          <div
            className={`px-6 py-3 text-sm font-medium text-center transition-all duration-300 ${
              localFeedback === 'added'
                ? 'bg-green-50 text-green-700 border-b border-green-100'
                : localFeedback === 'removed'
                  ? 'bg-gray-50 text-gray-700 border-b border-gray-100'
                  : 'bg-red-50 text-red-700 border-b border-red-100'
            }`}
          >
            {localFeedback === 'added' ? '✓ Pick added' : localFeedback === 'removed' ? '✕ Pick removed' : localFeedback}
          </div>
        )}

        {/* Header with search */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{hasMatchups ? '🎾' : '👥'}</span>
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-wide">
                  {hasMatchups ? 'Round Matchups' : 'Available Players'}
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                {hasMatchups
                  ? (searchQuery
                      ? `Showing ${filteredMatches.length} of ${matches.length} matchups`
                      : `${matches.length} matchups • ${tournamentName}`)
                  : (searchQuery
                      ? `Showing ${filteredPlayers.length} of ${players.length} players`
                      : `${players.length} players • ${tournamentName}`)}
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Input
                type="text"
                placeholder="Search by name or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {noResults ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No {hasMatchups ? 'matchups' : 'players'} match &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-wimbledon-purple hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : hasMatchups ? (
            <>
              {/* Matchup cards */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {filteredMatches.map((match) => {
                  const p1Picked = pickedSet.has(match.player1.id)
                  const p2Picked = pickedSet.has(match.player2.id)
                  const eitherPicked = p1Picked || p2Picked
                  const odds = matchOdds[match.id]

                  return (
                    <div
                      key={match.id}
                      className={`rounded-xl overflow-hidden transition-all duration-300 ${
                        eitherPicked
                          ? 'border-2 border-wimbledon-green/40 shadow-lg'
                          : 'border-2 border-gray-200 hover:border-wimbledon-purple/30 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row">
                        <PlayerHalf
                          player={match.player1}
                          isUsed={usedSet.has(match.player1.id)}
                          isPicked={p1Picked}
                          opponentPicked={p2Picked}
                          canSelect={!usedSet.has(match.player1.id) && !p1Picked && localPickIds.length < requiredPicks}
                          isPending={pendingPlayers.has(match.player1.id)}
                          winPct={odds?.player1Pct}
                          onPick={handlePick}
                        />
                        <div className="flex items-center justify-center sm:flex-col px-3 py-2 sm:py-0 bg-gray-50 sm:border-x border-y sm:border-y-0 border-gray-100">
                          <span className="text-xs font-bold text-wimbledon-purple/60 uppercase tracking-widest">vs</span>
                        </div>
                        <PlayerHalf
                          player={match.player2}
                          isUsed={usedSet.has(match.player2.id)}
                          isPicked={p2Picked}
                          opponentPicked={p1Picked}
                          canSelect={!usedSet.has(match.player2.id) && !p2Picked && localPickIds.length < requiredPicks}
                          isPending={pendingPlayers.has(match.player2.id)}
                          winPct={odds?.player2Pct}
                          onPick={handlePick}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bye players section */}
              {filteredByePlayers.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                    Players with Byes — Not Available This Round
                  </h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredByePlayers.map((player) => (
                      <div
                        key={player.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 opacity-60 p-4"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-700 leading-tight mb-1 flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{player.name}</span>
                              {player.seed && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-wimbledon-purple/10 text-wimbledon-purple text-xs rounded-full shrink-0">
                                  Seed {player.seed}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 font-medium uppercase tracking-wider">BYE</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Flat player grid (fallback when no matches) */
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPlayers.map((player) => {
                const isUsed = usedSet.has(player.id)
                const isPicked = pickedSet.has(player.id)
                const canSelect = !isUsed && !isPicked && localPickIds.length < requiredPicks

                return (
                  <div
                    key={player.id}
                    className={`rounded-xl p-4 transition-all duration-300 relative overflow-hidden ${
                      isPicked
                        ? 'border-2 border-wimbledon-green bg-gradient-to-br from-wimbledon-green/10 to-wimbledon-green/5 shadow-lg scale-105'
                        : isUsed
                          ? 'border border-gray-200 bg-gray-50 opacity-50'
                          : 'border-2 border-gray-200 hover:border-wimbledon-green/50 hover:shadow-xl hover:scale-105 bg-white'
                    }`}
                  >
                    {isPicked && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-wimbledon-green/20 to-transparent rounded-bl-full"></div>
                    )}
                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 leading-tight mb-1 flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{player.name}</span>
                          {player.seed && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-wimbledon-purple/10 text-wimbledon-purple text-xs rounded-full shrink-0">
                              Seed {player.seed}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                          <img
                            src={getFlagPath(player.country)}
                            alt={getCountryName(player.country)}
                            className="w-4 h-3 object-cover rounded-sm border border-gray-200 shadow-sm"
                          />
                          <span className="font-medium">{getCountryName(player.country)}</span>
                        </p>
                      </div>
                      {isPicked && <span className="text-wimbledon-green text-2xl animate-bounce">✓</span>}
                      {isUsed && !isPicked && (
                        <span className="text-xs bg-gray-300 text-gray-600 px-2 py-1 uppercase tracking-wider rounded-full">
                          Used
                        </span>
                      )}
                    </div>

                    {!isUsed && (
                      <button
                        type="button"
                        onClick={() => handlePick(player.id, isPicked ? 'remove' : 'add')}
                        disabled={pendingPlayers.has(player.id) || (!isPicked && !canSelect)}
                        className={`w-full mt-3 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg ${
                          pendingPlayers.has(player.id)
                            ? 'bg-gray-200 text-gray-500 cursor-wait'
                            : isPicked
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105'
                              : canSelect
                                ? 'bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white hover:shadow-lg hover:scale-105'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {pendingPlayers.has(player.id) ? '...' : isPicked ? '✕ Remove' : '+ Select'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom spacer for sticky bar */}
      <div className="h-20" />

      {/* Sticky progress bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Progress bar track */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-wimbledon-purple to-wimbledon-green transition-all duration-700 ease-out"
            style={{ width: `${requiredPicks > 0 ? (localPickIds.length / requiredPicks) * 100 : 0}%` }}
          />
        </div>
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">
                  {localPickIds.length === requiredPicks ? '✅' : '📋'}
                </span>
                <div className="min-w-0">
                  {localPickIds.length === 0 ? (
                    <p className="text-sm text-gray-500">No picks yet</p>
                  ) : (
                    <p className="text-sm text-gray-700 truncate">
                      {localPickIds.map(id => playerById.get(id)?.name ?? 'Unknown').join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {localPickIds.length === requiredPicks ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wimbledon-green text-white text-xs font-semibold uppercase tracking-wider rounded-full">
                    <span>✓</span> Complete
                  </span>
                ) : (
                  <span className="text-sm font-bold text-wimbledon-purple">
                    {localPickIds.length} / {requiredPicks}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
