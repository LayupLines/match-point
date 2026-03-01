// ABOUTME: Bracket generation logic for pairing match winners into next-round matchups.
// ABOUTME: Used by the admin workflow to auto-generate subsequent round matches after results are entered.

type CompletedMatchData = {
  bracketPosition: number | null
  winnerId: string | null
}

type NextRoundPairing = {
  player1Id: string
  player2Id: string
  bracketPosition: number
}

export function pairWinnersForNextRound(
  completedMatches: CompletedMatchData[]
): NextRoundPairing[] {
  if (completedMatches.some(m => m.bracketPosition === null || m.bracketPosition === undefined)) {
    throw new Error('All matches must have bracket positions to generate next round')
  }

  if (completedMatches.some(m => !m.winnerId)) {
    throw new Error('All matches must have results before generating next round')
  }

  if (completedMatches.length % 2 !== 0) {
    throw new Error('Cannot generate pairs from odd number of matches')
  }

  // Sort by bracket position
  const sorted = [...completedMatches].sort(
    (a, b) => a.bracketPosition! - b.bracketPosition!
  )

  // Pair consecutive winners
  const pairs: NextRoundPairing[] = []
  for (let i = 0; i < sorted.length; i += 2) {
    pairs.push({
      player1Id: sorted[i].winnerId!,
      player2Id: sorted[i + 1].winnerId!,
      bracketPosition: Math.floor(i / 2) + 1,
    })
  }

  return pairs
}
