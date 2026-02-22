// ABOUTME: Admin dashboard page listing all tournaments with status, player counts, and league counts.
// Includes a sidebar form for creating new tournaments.
import { getTournaments } from '@/lib/services/tournament'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CreateTournamentForm } from '@/components/admin/create-tournament-form'

export const runtime = 'nodejs'

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
}

export default async function AdminDashboardPage() {
  const tournaments = await getTournaments()

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-light text-gray-900 tracking-wide mb-2">Tournaments</h2>
        <p className="text-sm text-gray-500">Manage tournaments, players, and matches</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tournaments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
              <p className="text-gray-500">No tournaments yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tournaments.map((tournament) => (
                <Link key={tournament.id} href={`/admin/tournaments/${tournament.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer hover:border-wimbledon-purple/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{tournament.name}</CardTitle>
                        <Badge className={STATUS_COLORS[tournament.status] || ''}>
                          {tournament.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{tournament.year}</span>
                        <span>|</span>
                        <span>{tournament.gender === 'MEN' ? "Men's" : "Women's"}</span>
                        <span>|</span>
                        <span>{tournament.level.replace('_', ' ')}</span>
                      </div>
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="text-gray-600">
                          {tournament._count.players} players
                        </span>
                        <span className="text-gray-600">
                          {tournament._count.leagues} leagues
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <CreateTournamentForm />
        </div>
      </div>
    </main>
  )
}
