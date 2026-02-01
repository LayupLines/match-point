import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserLeagues } from '@/lib/services/league'
import Link from 'next/link'
import { signOut } from '@/lib/auth'

export const runtime = 'nodejs'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const leagues = await getUserLeagues(session.user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-800">Match Point</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {session.user.name || session.user.email}</span>
            {session.user.role === 'ADMIN' && (
              <Link href="/admin" className="text-green-600 hover:text-green-700 font-semibold">
                Admin
              </Link>
            )}
            <form action={async () => {
              'use server'
              await signOut()
            }}>
              <button type="submit" className="text-red-600 hover:text-red-700">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">My Leagues</h2>
          <div className="flex gap-4">
            <Link
              href="/leagues"
              className="px-6 py-2 bg-white border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
            >
              Browse Leagues
            </Link>
            <Link
              href="/leagues/create"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Create League
            </Link>
          </div>
        </div>

        {leagues.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              You haven't joined any leagues yet
            </h3>
            <p className="text-gray-600 mb-6">
              Browse public leagues or create your own to get started!
            </p>
            <Link
              href="/leagues"
              className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Browse Leagues
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/league/${league.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{league.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {league.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-semibold">
                    {league.tournament.name}
                  </span>
                  <span className="text-gray-500">
                    {league._count?.memberships || 0} members
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  {league.tournament.gender === 'MEN' ? "Men's" : "Women's"} • {league.tournament.year}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
