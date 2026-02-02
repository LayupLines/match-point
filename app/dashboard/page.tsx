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
      <header className="bg-gradient-to-r from-wimbledon-purple to-wimbledon-green shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎾</span>
            <h1 className="text-3xl font-bold text-white">Match Point</h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-white/90 font-medium">Welcome, {session.user.name || session.user.email}</span>
            {session.user.role === 'ADMIN' && (
              <Link href="/admin" className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all backdrop-blur-sm">
                Admin
              </Link>
            )}
            <form action={async () => {
              'use server'
              await signOut()
            }}>
              <button type="submit" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-between items-center">
          <h2 className="text-4xl font-bold text-gray-900">My Leagues</h2>
          <div className="flex gap-4">
            <Link
              href="/leagues"
              className="px-6 py-3 bg-white border-2 border-wimbledon-purple text-wimbledon-purple rounded-lg hover:bg-wimbledon-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
            >
              Browse Leagues
            </Link>
            <Link
              href="/leagues/create"
              className="px-6 py-3 bg-wimbledon-green text-white rounded-lg hover:bg-wimbledon-green-dark transition-all shadow-sm hover:shadow-md font-semibold"
            >
              + Create League
            </Link>
          </div>
        </div>

        {leagues.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-16 text-center border border-gray-100">
            <div className="text-6xl mb-6">🎾</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              You haven't joined any leagues yet
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Browse public leagues or create your own to get started!
            </p>
            <Link
              href="/leagues"
              className="inline-block px-8 py-4 bg-wimbledon-purple text-white rounded-lg hover:bg-wimbledon-purple-dark transition-all shadow-md hover:shadow-lg font-semibold"
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
                className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 border border-gray-100 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-wimbledon-purple transition-colors flex-1">{league.name}</h3>
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {league.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-wimbledon-green font-semibold">
                    {league.tournament.name}
                  </span>
                  <span className="text-gray-500 flex items-center gap-1">
                    <span>👥</span>
                    {league._count?.memberships || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t border-gray-100">
                  <span className="px-3 py-1 bg-gray-100 rounded-full">
                    {league.tournament.gender === 'MEN' ? "Men's" : "Women's"}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full">
                    {league.tournament.year}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
