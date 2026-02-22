// ABOUTME: Client component with buttons to transition a tournament through UPCOMING, ACTIVE, and COMPLETED states.
// Calls PUT /api/admin/tournaments/[id]/status and refreshes the page on success.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type TournamentStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED'

const STATUS_TRANSITIONS: Record<TournamentStatus, TournamentStatus | null> = {
  UPCOMING: 'ACTIVE',
  ACTIVE: 'COMPLETED',
  COMPLETED: null,
}

const BUTTON_LABELS: Record<TournamentStatus, string> = {
  UPCOMING: 'Activate Tournament',
  ACTIVE: 'Mark as Completed',
  COMPLETED: '',
}

export function StatusControls({
  tournamentId,
  currentStatus,
}: {
  tournamentId: string
  currentStatus: TournamentStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const nextStatus = STATUS_TRANSITIONS[currentStatus]

  if (!nextStatus) {
    return (
      <div className="text-sm text-gray-500">
        Tournament is completed. No further status changes available.
      </div>
    )
  }

  const handleTransition = async () => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update status')
        return
      }

      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
      <Button
        onClick={handleTransition}
        disabled={loading}
        variant={currentStatus === 'UPCOMING' ? 'default' : 'destructive'}
      >
        {loading ? 'Updating...' : BUTTON_LABELS[currentStatus]}
      </Button>
    </div>
  )
}
