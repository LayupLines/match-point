// ABOUTME: Client panel for entering match results by clicking the winning player button.
// Supports walkover and retirement flags, removes matches from the list after result entry without page reload.
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Player = {
  id: string
  name: string
  seed: number | null
  country: string | null
}

type Round = {
  id: string
  roundNumber: number
  name: string
}

type Match = {
  id: string
  roundId: string
  player1Id: string
  player2Id: string
  round: Round
  player1: Player
  player2: Player
}

type Tournament = {
  id: string
  name: string
  level: string
  gender: string
  status: string
}

export function ResultEntryPanel({
  tournaments,
}: {
  tournaments: Tournament[]
}) {
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  // Walkover/retirement state per match
  const [matchOptions, setMatchOptions] = useState<
    Record<string, { isWalkover: boolean; retiredPlayerId: string }>
  >({})

  const fetchMatches = useCallback(async (tournamentId: string) => {
    setLoadingMatches(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/matches`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch matches')
        return
      }

      setMatches(data.matches)
    } catch {
      setError('Failed to fetch matches')
    } finally {
      setLoadingMatches(false)
    }
  }, [])

  useEffect(() => {
    if (selectedTournamentId) {
      fetchMatches(selectedTournamentId)
    } else {
      setMatches([])
    }
  }, [selectedTournamentId, fetchMatches])

  const handleSelectWinner = async (match: Match, winnerId: string) => {
    setSubmittingMatchId(match.id)
    setError('')
    setSuccessMessage('')

    const options = matchOptions[match.id] || { isWalkover: false, retiredPlayerId: '' }

    try {
      const res = await fetch(`/api/admin/matches/${match.id}/result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id, // Required by enterResultSchema even though it's in the URL
          winnerId,
          isWalkover: options.isWalkover || undefined,
          retiredPlayerId: options.retiredPlayerId || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to enter result')
        return
      }

      // Remove the match from the list (no full refresh needed)
      setMatches((prev) => prev.filter((m) => m.id !== match.id))
      const winnerName =
        winnerId === match.player1Id ? match.player1.name : match.player2.name
      setSuccessMessage(`Result entered: ${winnerName} wins`)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmittingMatchId(null)
    }
  }

  const toggleWalkover = (matchId: string) => {
    setMatchOptions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        isWalkover: !(prev[matchId]?.isWalkover || false),
        retiredPlayerId: '', // Clear retirement if setting walkover
      },
    }))
  }

  const setRetiredPlayer = (matchId: string, playerId: string) => {
    setMatchOptions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        isWalkover: false, // Clear walkover if setting retirement
        retiredPlayerId:
          prev[matchId]?.retiredPlayerId === playerId ? '' : playerId,
      },
    }))
  }

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const roundName = match.round.name
      if (!acc[roundName]) acc[roundName] = []
      acc[roundName].push(match)
      return acc
    },
    {} as Record<string, Match[]>
  )

  const activeTournaments = tournaments.filter((t) => t.status === 'ACTIVE')

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="tournament-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Tournament
        </label>
        <select
          id="tournament-select"
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-wimbledon-purple focus:border-transparent"
        >
          <option value="">-- Select a tournament --</option>
          {activeTournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.gender}, {t.level.replace('_', ' ')})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
          {successMessage}
        </div>
      )}

      {loadingMatches && (
        <div className="text-center py-8 text-gray-500">Loading matches...</div>
      )}

      {selectedTournamentId && !loadingMatches && matches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No pending matches for this tournament.
        </div>
      )}

      {Object.entries(matchesByRound).map(([roundName, roundMatches]) => (
        <div key={roundName}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{roundName}</h3>
          <div className="space-y-3">
            {roundMatches.map((match) => {
              const options = matchOptions[match.id] || {
                isWalkover: false,
                retiredPlayerId: '',
              }
              const isSubmitting = submittingMatchId === match.id

              return (
                <Card key={match.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col gap-3">
                      {/* Player buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-auto py-4 text-left flex flex-col items-start hover:bg-green-50 hover:border-green-500"
                          disabled={isSubmitting}
                          onClick={() =>
                            handleSelectWinner(match, match.player1Id)
                          }
                        >
                          <span className="font-semibold">
                            {match.player1.name}
                          </span>
                          {match.player1.seed && (
                            <span className="text-xs text-gray-500">
                              Seed {match.player1.seed}
                            </span>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-auto py-4 text-left flex flex-col items-start hover:bg-green-50 hover:border-green-500"
                          disabled={isSubmitting}
                          onClick={() =>
                            handleSelectWinner(match, match.player2Id)
                          }
                        >
                          <span className="font-semibold">
                            {match.player2.name}
                          </span>
                          {match.player2.seed && (
                            <span className="text-xs text-gray-500">
                              Seed {match.player2.seed}
                            </span>
                          )}
                        </Button>
                      </div>

                      {/* Options row */}
                      <div className="flex items-center gap-4 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={options.isWalkover}
                            onChange={() => toggleWalkover(match.id)}
                            className="rounded"
                          />
                          <span className="text-gray-600">Walkover</span>
                        </label>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600">Retired:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setRetiredPlayer(match.id, match.player1Id)
                          }
                          className={`px-2 py-0.5 rounded text-xs ${
                            options.retiredPlayerId === match.player1Id
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {match.player1.name.split(' ').pop()}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRetiredPlayer(match.id, match.player2Id)
                          }
                          className={`px-2 py-0.5 rounded text-xs ${
                            options.retiredPlayerId === match.player2Id
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {match.player2.name.split(' ').pop()}
                        </button>

                        {isSubmitting && (
                          <Badge variant="secondary" className="ml-auto">
                            Submitting...
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
