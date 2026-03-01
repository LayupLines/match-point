// ABOUTME: Pure scoring logic that evaluates picks against match results.
// ABOUTME: Calculates strikes, correct picks, and tracks final round submissions without database dependencies.

export type MatchResult = {
  roundId: string
  player1Id: string
  player2Id: string
  winnerId: string | null
  isWalkover: boolean
  retiredPlayerId: string | null
}

export type PickData = {
  playerId: string
  roundId: string
  round: { roundNumber: number }
  submittedAt: Date
}

export type EvaluationResult = {
  strikes: number
  correctPicks: number
  finalRoundSubmission: Date | null
}

export function evaluatePicks(
  picks: PickData[],
  matches: MatchResult[],
  finalRoundNumber: number
): EvaluationResult {
  let strikes = 0
  let correctPicks = 0
  let finalRoundSubmission: Date | null = null

  for (const pick of picks) {
    // Find match involving this player in the same round
    const match = matches.find(
      m => m.roundId === pick.roundId &&
        (m.player1Id === pick.playerId || m.player2Id === pick.playerId)
    )

    if (!match || !match.winnerId) continue

    // Check if pick won
    const didPlayerWin = match.winnerId === pick.playerId

    if (didPlayerWin) {
      // Player won - no strike
      correctPicks++

      // Handle walkover (opponent didn't show)
      if (match.isWalkover) {
        correctPicks++ // Bonus for walkover advancement
      }
    } else {
      // Player lost - check if it was a retirement
      if (match.retiredPlayerId === pick.playerId) {
        // Picked player retired - this is a strike
        strikes++
      } else if (match.retiredPlayerId) {
        // Opponent retired, picked player advanced - no strike
        correctPicks++
      } else {
        // Normal loss - strike
        strikes++
      }
    }

    // Track final round submission time
    if (pick.round.roundNumber === finalRoundNumber) {
      finalRoundSubmission = pick.submittedAt
    }
  }

  return { strikes, correctPicks, finalRoundSubmission }
}
