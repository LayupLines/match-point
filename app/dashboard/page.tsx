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
    <div className="min-h-screen bg-wimbledon-cream">
      <header className="bg-wimbledon-purple shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-white tracking-wide">MATCH POINT</h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-white/80 text-sm">Welcome, {session.user.name || session.user.email}</span>
            {session.user.role === 'ADMIN' && (
              <Link href="/admin" className="px-4 py-1.5 border border-white/30 hover:bg-white/10 text-white text-sm rounded transition-all">
                Admin
              </Link>
            )}
            <form action={async () => {
              'use server'
              await signOut()
            }}>
              <button type="submit" className="px-4 py-1.5 border border-white/30 hover:bg-white/10 text-white text-sm rounded transition-all">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-3xl font-light text-gray-900 tracking-wide">My Leagues</h2>
          <div className="flex gap-3">
            <Link
              href="/leagues"
              className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm hover:border-wimbledon-green hover:text-wimbledon-green transition-all"
            >
              Browse Leagues
            </Link>
            <Link
              href="/leagues/create"
              className="px-5 py-2 bg-wimbledon-green text-white text-sm hover:bg-wimbledon-green-dark transition-all"
            >
              Create League
            </Link>
          </div>
        </div>

        {leagues.length === 0 ? (
          <div className="bg-white shadow-card p-16 text-center">
            <h3 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">
              You haven't joined any leagues yet
            </h3>
            <p className="text-gray-600 mb-8">
              Browse public leagues or create your own to get started
            </p>
            <Link
              href="/leagues"
              className="inline-block px-8 py-3 bg-wimbledon-green text-white hover:bg-wimbledon-green-dark transition-all text-sm"
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
                className="bg-white shadow-card hover:shadow-elegant transition-all p-6 group"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-light text-gray-900 group-hover:text-wimbledon-green transition-colors tracking-wide">{league.name}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {league.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-gray-100">
                  <span className="text-wimbledon-purple font-medium">
                    {league.tournament.name}
                  </span>
                  <span className="text-gray-500">
                    {league._count?.memberships || 0} members
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="uppercase tracking-wider">
                    {league.tournament.gender === 'MEN' ? "Men's" : "Women's"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span>
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
