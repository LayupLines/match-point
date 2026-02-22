// ABOUTME: Match management page showing pending and completed matches grouped by round, plus a CSV upload form.
// Completed matches highlight the winner in green and show walkover and retirement badges.
import { getTournamentById, getUpcomingMatches, getCompletedMatches } from '@/lib/services/tournament'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MatchUploadForm } from '@/components/admin/match-upload-form'

export const runtime = 'nodejs'

export default async function MatchManagementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tournament = await getTournamentById(id)

  if (!tournament) {
    notFound()
  }

  const [upcomingMatches, completedMatches] = await Promise.all([
    getUpcomingMatches(id),
    getCompletedMatches(id),
  ])

  // Group matches by round
  const groupByRound = <T extends { round: { name: string; roundNumber: number } }>(
    matches: T[]
  ) => {
    const groups: Record<string, T[]> = {}
    for (const match of matches) {
      const key = match.round.name
      if (!groups[key]) groups[key] = []
      groups[key].push(match)
    }
    return groups
  }

  const upcomingByRound = groupByRound(upcomingMatches)
  const completedByRound = groupByRound(completedMatches)

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm">
        <Link href="/admin" className="text-wimbledon-purple hover:underline">
          Tournaments
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href={`/admin/tournaments/${tournament.id}`} className="text-wimbledon-purple hover:underline">
          {tournament.name}
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">Matches</span>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-light text-gray-900 tracking-wide mb-1">
          Matches — {tournament.name}
        </h2>
        <p className="text-sm text-gray-500">
          {upcomingMatches.length} pending, {completedMatches.length} completed
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Pending matches */}
          {upcomingMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(upcomingByRound).map(([roundName, matches]) => (
                  <div key={roundName} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{roundName}</h4>
                    <div className="space-y-2">
                      {matches.map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{match.player1.name}</span>
                            {match.player1.seed && (
                              <span className="text-xs text-gray-400">[{match.player1.seed}]</span>
                            )}
                            <span className="text-gray-400 mx-1">vs</span>
                            <span className="font-medium text-sm">{match.player2.name}</span>
                            {match.player2.seed && (
                              <span className="text-xs text-gray-400">[{match.player2.seed}]</span>
                            )}
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed matches */}
          {completedMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Completed Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(completedByRound).map(([roundName, matches]) => (
                  <div key={roundName} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{roundName}</h4>
                    <div className="space-y-2">
                      {matches.map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium text-sm ${
                                match.winnerId === match.player1Id
                                  ? 'text-green-700'
                                  : 'text-gray-400'
                              }`}
                            >
                              {match.player1.name}
                            </span>
                            <span className="text-gray-400 mx-1">vs</span>
                            <span
                              className={`font-medium text-sm ${
                                match.winnerId === match.player2Id
                                  ? 'text-green-700'
                                  : 'text-gray-400'
                              }`}
                            >
                              {match.player2.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {match.isWalkover && (
                              <Badge variant="outline" className="text-xs">W/O</Badge>
                            )}
                            {match.retiredPlayerId && (
                              <Badge variant="outline" className="text-xs">RET</Badge>
                            )}
                            <Badge variant="secondary">Done</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {upcomingMatches.length === 0 && completedMatches.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
              <p className="text-gray-500">No matches yet. Upload a CSV to create matches.</p>
            </div>
          )}
        </div>

        {/* Upload form */}
        <div>
          <MatchUploadForm tournamentId={tournament.id} />
        </div>
      </div>
    </main>
  )
}
