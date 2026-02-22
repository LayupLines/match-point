// ABOUTME: Player management page showing the current player list and a CSV upload form for adding new players.
// Displays player seed and country alongside name.
import { getTournamentById } from '@/lib/services/tournament'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PlayerUploadForm } from '@/components/admin/player-upload-form'

export const runtime = 'nodejs'

export default async function PlayerManagementPage({
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
        <Link href={`/admin/tournaments/${tournament.id}`} className="text-wimbledon-purple hover:underline">
          {tournament.name}
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">Players</span>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-light text-gray-900 tracking-wide mb-1">
          Players — {tournament.name}
        </h2>
        <p className="text-sm text-gray-500">{tournament.players.length} players registered</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Player list */}
        <div className="lg:col-span-2">
          {tournament.players.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
              <p className="text-gray-500">No players yet. Upload a CSV to add players.</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Player List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium text-gray-500">Seed</th>
                        <th className="pb-2 pr-4 font-medium text-gray-500">Name</th>
                        <th className="pb-2 font-medium text-gray-500">Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournament.players.map((player) => (
                        <tr key={player.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 text-gray-400">
                            {player.seed || '—'}
                          </td>
                          <td className="py-2 pr-4 font-medium">{player.name}</td>
                          <td className="py-2 text-gray-600">
                            {player.country || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upload form */}
        <div>
          <PlayerUploadForm tournamentId={tournament.id} />
        </div>
      </div>
    </main>
  )
}
