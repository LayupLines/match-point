// ABOUTME: Client form component for creating a new tournament with name, year, gender, and level fields.
// Submits to POST /api/admin/tournaments and navigates to the new tournament detail page on success.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CreateTournamentForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [gender, setGender] = useState('MEN')
  const [level, setLevel] = useState('GRAND_SLAM')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, year, gender, level }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create tournament')
        return
      }

      router.push(`/admin/tournaments/${data.tournament.id}`)
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
        <CardTitle className="text-lg">Create Tournament</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Doha Open"
              required
            />
          </div>

          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              min={2024}
              max={2100}
              required
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-wimbledon-purple focus:border-transparent"
            >
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
            </select>
          </div>

          <div>
            <Label htmlFor="level">Level</Label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-wimbledon-purple focus:border-transparent"
            >
              <option value="GRAND_SLAM">Grand Slam</option>
              <option value="ATP_1000">ATP 1000</option>
              <option value="ATP_500">ATP 500</option>
              <option value="ATP_250">ATP 250</option>
              <option value="WTA_1000">WTA 1000</option>
              <option value="WTA_500">WTA 500</option>
              <option value="WTA_250">WTA 250</option>
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Tournament'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
