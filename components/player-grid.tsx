// ABOUTME: Client component for the player selection grid on the picks page.
// Provides search/filter by name or country, pick feedback banner, and handles form submissions.
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

export function PlayerGrid({
  players,
  usedPlayerIds,
  currentPickIds,
  requiredPicks,
  existingPickCount,
  leagueId,
  roundId,
  tournamentName,
  feedback,
}: {
  players: Player[]
  usedPlayerIds: string[]
  currentPickIds: string[]
  requiredPicks: number
  existingPickCount: number
  leagueId: string
  roundId: string
  tournamentName: string
  feedback?: string | null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFeedback, setShowFeedback] = useState(!!feedback)

  const usedSet = new Set(usedPlayerIds)
  const pickedSet = new Set(currentPickIds)

  // Auto-dismiss feedback after 3 seconds
  useEffect(() => {
    if (!feedback) return
    setShowFeedback(true)
    const timer = setTimeout(() => setShowFeedback(false), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  // Filter players by search query
  const filteredPlayers = searchQuery.trim()
    ? players.filter((player) => {
        const query = searchQuery.toLowerCase()
        const nameMatch = player.name.toLowerCase().includes(query)
        const countryMatch = player.country
          ? getCountryName(player.country).toLowerCase().includes(query)
          : false
        return nameMatch || countryMatch
      })
    : players

  return (
    <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
      {/* Feedback banner */}
      {showFeedback && feedback && (
        <div
          className={`px-6 py-3 text-sm font-medium text-center transition-all duration-300 ${
            feedback === 'added'
              ? 'bg-green-50 text-green-700 border-b border-green-100'
              : 'bg-gray-50 text-gray-700 border-b border-gray-100'
          }`}
        >
          {feedback === 'added' ? '✓ Pick added' : '✕ Pick removed'}
        </div>
      )}

      {/* Header with search */}
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👥</span>
              <h2 className="text-2xl sm:text-3xl font-light text-gray-900 tracking-wide">
                Available Players
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              {searchQuery
                ? `Showing ${filteredPlayers.length} of ${players.length} players`
                : `${players.length} players • ${tournamentName}`}
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

      {/* Player grid */}
      <div className="p-4 sm:p-6">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No players match "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-wimbledon-purple hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlayers.map((player) => {
              const isUsed = usedSet.has(player.id)
              const isPicked = pickedSet.has(player.id)
              const canSelect = !isUsed && !isPicked && existingPickCount < requiredPicks

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
                      <p className="font-medium text-gray-900 leading-tight mb-1">{player.name}</p>
                      {player.seed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-wimbledon-purple/10 text-wimbledon-purple text-xs rounded-full mt-1">
                          <span>🏆</span>
                          <span>Seed {player.seed}</span>
                        </span>
                      )}
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
                        className={`w-full mt-3 px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg ${
                          isPicked
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105'
                            : canSelect
                              ? 'bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white hover:shadow-lg hover:scale-105'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isPicked ? '✕ Remove' : '+ Select'}
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
