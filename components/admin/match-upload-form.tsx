// ABOUTME: Client form component for creating tournament matches via pasted CSV data.
// Accepts roundNumber, player1Name, player2Name columns and submits to POST /api/admin/tournaments/[id]/matches.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MatchUploadForm({ tournamentId }: { tournamentId: string }) {
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
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create matches')
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
        <CardTitle className="text-lg">Upload Matches (CSV)</CardTitle>
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
            <Label htmlFor="matchCsv">CSV Data (roundNumber, player1Name, player2Name)</Label>
            <textarea
              id="matchCsv"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={`roundNumber,player1Name,player2Name\n1,Novak Djokovic,Qualifier 1\n1,Carlos Alcaraz,Qualifier 2`}
              rows={10}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-wimbledon-purple focus:border-transparent"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating Matches...' : 'Create Matches'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
