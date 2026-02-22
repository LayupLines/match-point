// ABOUTME: Client component for editing a round's pick lock time using a datetime-local input.
// Calls PUT /api/admin/rounds/[id]/lock-time and shows inline saved/error feedback.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LockTimeEditor({
  roundId,
  currentLockTime,
}: {
  roundId: string
  currentLockTime: string
}) {
  const router = useRouter()
  // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
  const initialValue = new Date(currentLockTime).toISOString().slice(0, 16)
  const [lockTime, setLockTime] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setError('')
    setSaved(false)
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/rounds/${roundId}/lock-time`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockTime: new Date(lockTime).toISOString() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update lock time')
        return
      }

      setSaved(true)
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="datetime-local"
        value={lockTime}
        onChange={(e) => {
          setLockTime(e.target.value)
          setSaved(false)
        }}
        className="w-auto text-sm"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : saved ? 'Saved' : 'Save'}
      </Button>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  )
}
