// ABOUTME: Admin layout wrapper that enforces ADMIN role authentication and renders the Wimbledon-themed navigation header.
// Redirects non-admin users to /dashboard.
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const runtime = 'nodejs'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen relative">
      {/* Grass court background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: 'url(/grass-court.jpg)' }}
      />
      {/* Semi-transparent overlay for readability */}
      <div className="fixed inset-0 bg-white/75 -z-10" />

      <header className="bg-gradient-to-r from-wimbledon-purple via-wimbledon-purple-dark to-wimbledon-purple shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-xl">🎾</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-light text-white tracking-wide">MATCH POINT ADMIN</h1>
            </div>
            <nav className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
              <Link
                href="/admin"
                className="px-3 py-2 text-white/80 hover:text-white text-sm transition-colors"
              >
                Tournaments
              </Link>
              <Link
                href="/admin/results"
                className="px-3 py-2 text-white/80 hover:text-white text-sm transition-colors"
              >
                Enter Results
              </Link>
              <Link
                href="/dashboard"
                className="px-3 sm:px-4 py-2 border border-white/30 hover:bg-white/20 hover:border-white/50 text-white text-xs sm:text-sm rounded-lg transition-all duration-300"
              >
                Back to Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
