// ABOUTME: Result entry page that passes active tournaments to the ResultEntryPanel client component.
// Serializes only the fields needed by the client component to avoid passing non-serializable Prisma objects.
import { getTournaments } from '@/lib/services/tournament'
import { ResultEntryPanel } from '@/components/admin/result-entry-panel'

export const runtime = 'nodejs'

export default async function ResultEntryPage() {
  const tournaments = await getTournaments()

  // Serialize for client component
  const serializedTournaments = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    level: t.level,
    gender: t.gender,
    status: t.status,
  }))

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-light text-gray-900 tracking-wide mb-2">Enter Results</h2>
        <p className="text-sm text-gray-500">
          Select a tournament, then click the winning player to record the result.
        </p>
      </div>

      <ResultEntryPanel tournaments={serializedTournaments} />
    </main>
  )
}
