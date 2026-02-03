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
    <div className="min-h-screen bg-gradient-to-br from-wimbledon-cream via-white to-wimbledon-cream/50">
      <header className="bg-gradient-to-r from-wimbledon-purple via-wimbledon-purple-dark to-wimbledon-purple shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-xl">🎾</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-light text-white tracking-wide">MATCH POINT</h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
              <span className="text-white/80 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                Welcome, {session.user.name || session.user.email}
              </span>
              {session.user.role === 'ADMIN' && (
                <Link href="/admin" className="px-3 sm:px-4 py-2 border border-white/30 hover:bg-white/20 hover:border-white/50 text-white text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105">
                  Admin
                </Link>
              )}
              <form action={async () => {
                'use server'
                await signOut()
              }}>
                <button type="submit" className="px-3 sm:px-4 py-2 border border-white/30 hover:bg-white/20 hover:border-white/50 text-white text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 lg:py-16 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-wide mb-2">My Leagues</h2>
            <p className="text-sm text-gray-500">Manage your tournament entries</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/leagues"
              className="px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 text-sm hover:border-wimbledon-green hover:text-wimbledon-green hover:shadow-md transition-all duration-300 text-center hover:scale-105"
            >
              Browse Leagues
            </Link>
            <Link
              href="/leagues/create"
              className="px-5 py-2.5 bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white text-sm hover:shadow-lg transition-all duration-300 text-center hover:scale-105"
            >
              + Create League
            </Link>
          </div>
        </div>

        {leagues.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl p-12 sm:p-16 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-wimbledon-purple/10 to-wimbledon-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎾</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4 tracking-wide">
              You haven't joined any leagues yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Browse public leagues or create your own to get started
            </p>
            <Link
              href="/leagues"
              className="inline-block px-8 py-4 bg-gradient-to-r from-wimbledon-green to-wimbledon-green-dark text-white hover:shadow-xl transition-all duration-300 text-sm rounded-lg hover:scale-105"
            >
              Browse Leagues
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league, index) => (
              <Link
                key={league.id}
                href={`/league/${league.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 group border border-gray-100 hover:border-wimbledon-green/30 hover:scale-[1.02] hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeIn 0.5s ease-out forwards',
                  opacity: 0
                }}
              >
                <div className="mb-4 relative">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-wimbledon-purple to-wimbledon-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white text-xs">→</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-light text-gray-900 group-hover:text-wimbledon-green transition-colors tracking-wide pr-8">{league.name}</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {league.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-gray-100">
                  <span className="text-wimbledon-purple font-medium truncate max-w-[60%]">
                    {league.tournament.name}
                  </span>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                    <span className="text-xs text-gray-400">👥</span>
                    <span className="text-gray-700 font-medium">
                      {league._count?.memberships || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-gradient-to-r from-wimbledon-purple/10 to-wimbledon-green/10 text-wimbledon-purple text-xs uppercase tracking-wider rounded-full">
                    {league.tournament.gender === 'MEN' ? "Men's" : "Women's"}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {league.tournament.year}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </main>
    </div>
  )
}
