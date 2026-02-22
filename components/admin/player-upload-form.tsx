// ABOUTME: Client form component for uploading players to a tournament via pasted CSV data.
// Accepts name, seed, country columns and submits to POST /api/admin/tournaments/[id]/players.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PlayerUploadForm({ tournamentId }: { tournamentId: string }) {
  const router = useRouter()
  const [csvData, setCsvData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to upload players')
        return
      }

      setSuccess(data.message)
      setCsvData('')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload Players (CSV)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
              {success}
            </div>
          )}

          <div>
            <Label htmlFor="csv">CSV Data (name, seed, country)</Label>
            <textarea
              id="csv"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={`name,seed,country\nNovak Djokovic,1,SRB\nCarlos Alcaraz,2,ESP`}
              rows={10}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-wimbledon-purple focus:border-transparent"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Uploading...' : 'Upload Players'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
