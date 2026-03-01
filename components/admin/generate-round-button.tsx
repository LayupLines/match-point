// ABOUTME: Button to auto-generate next round matches by pairing winners from a completed round.
// ABOUTME: Calls the bracket generation API and refreshes the page on success.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function GenerateRoundButton({
  tournamentId,
  roundId,
  roundName,
  nextRoundName,
}: {
  tournamentId: string
  roundId: string
  roundName: string
  nextRoundName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!window.confirm(
      `Generate ${nextRoundName} matches from ${roundName} winners?`
    )) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `/api/admin/tournaments/${tournamentId}/rounds/${roundId}/generate`,
        { method: 'POST' }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate matches')
        return
      }

      router.refresh()
    } catch {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-3">
      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={loading}
        className="bg-wimbledon-green hover:bg-wimbledon-green/90 text-white"
      >
        {loading ? 'Generating...' : `Generate ${nextRoundName}`}
      </Button>
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
