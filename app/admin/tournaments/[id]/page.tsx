// ABOUTME: Tournament detail page showing metadata, status controls, action links, and round lock time editors.
// Serves as the hub for managing a specific tournament.
import { getTournamentById } from '@/lib/services/tournament'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StatusControls } from '@/components/admin/status-controls'
import { LockTimeEditor } from '@/components/admin/lock-time-editor'

export const runtime = 'nodejs'

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tournament = await getTournamentById(id)

  if (!tournament) {
    notFound()
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link href="/admin" className="text-wimbledon-purple hover:underline">
          Tournaments
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{tournament.name}</span>
      </div>

      {/* Tournament info card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-2xl">{tournament.name}</CardTitle>
            <Badge className={STATUS_COLORS[tournament.status] || ''}>
              {tournament.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <span className="text-xs text-gray-500 uppercase">Year</span>
              <p className="font-medium">{tournament.year}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Gender</span>
              <p className="font-medium">{tournament.gender === 'MEN' ? "Men's" : "Women's"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Level</span>
              <p className="font-medium">{tournament.level.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Players</span>
              <p className="font-medium">{tournament.players.length}</p>
            </div>
          </div>

          {/* Action links */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              href={`/admin/tournaments/${tournament.id}/players`}
              className="px-4 py-2 bg-wimbledon-purple text-white text-sm rounded-lg hover:bg-wimbledon-purple-light transition-colors"
            >
              Manage Players
            </Link>
            <Link
              href={`/admin/tournaments/${tournament.id}/matches`}
              className="px-4 py-2 bg-wimbledon-green text-white text-sm rounded-lg hover:bg-wimbledon-green-light transition-colors"
            >
              Manage Matches
            </Link>
          </div>

          {/* Status controls */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Status Transition</h3>
            <StatusControls
              tournamentId={tournament.id}
              currentStatus={tournament.status as 'UPCOMING' | 'ACTIVE' | 'COMPLETED'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rounds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rounds & Lock Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tournament.rounds.map((round) => (
              <div
                key={round.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium">{round.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    (Round {round.roundNumber}, {round.requiredPicks} pick{round.requiredPicks !== 1 ? 's' : ''})
                  </span>
                </div>
                <LockTimeEditor
                  roundId={round.id}
                  currentLockTime={round.lockTime.toISOString()}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
