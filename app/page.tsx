import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-green-800">
            Match Point
          </h1>
          <p className="text-2xl text-gray-600">
            Wimbledon Survivor Tennis Game
          </p>
        </div>

        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Join the ultimate tennis survivor game. Pick players each round, avoid strikes, and compete to be the last one standing.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Register
          </Link>
        </div>

        <div className="pt-8">
          <Link
            href="/leagues"
            className="text-green-600 hover:text-green-700 underline"
          >
            Browse Public Leagues
          </Link>
        </div>

        <div className="pt-12 grid md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">🎾 Multi-Pick Rounds</h3>
            <p className="text-gray-600">Pick 4 players in early rounds, narrowing down as the tournament progresses.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">⚡ Strike System</h3>
            <p className="text-gray-600">Two strikes and you're out. Choose wisely and track your opponents.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">🏆 Public Leagues</h3>
            <p className="text-gray-600">Join or create leagues for both Men's and Women's Wimbledon.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
