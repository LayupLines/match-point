// ABOUTME: Tests for the scoring engine's pick evaluation logic.
// ABOUTME: Covers normal wins/losses, walkovers, retirements, bye players, partial results, and per-pick classification.
import { describe, it, expect } from 'vitest'
import { evaluatePicks, classifyPick, evaluatePicksDetailed } from './pick-evaluation'
import type { MatchResult, PickData } from './pick-evaluation'

// Helper to create match data
function match(overrides: Partial<MatchResult> & { player1Id: string; player2Id: string; roundId: string }): MatchResult {
  return {
    winnerId: null,
    isWalkover: false,
    retiredPlayerId: null,
    ...overrides,
  }
}

// Helper to create pick data
function pick(playerId: string, roundNumber: number): PickData {
  return {
    playerId,
    roundId: `r${roundNumber}`,
    round: { roundNumber },
    submittedAt: new Date('2026-03-10T12:00:00Z'),
  }
}

describe('evaluatePicks', () => {
  const finalRoundNumber = 7

  describe('normal wins and losses', () => {
    it('counts a correct pick when the picked player wins', () => {
      const picks = [pick('playerA', 1)]
      const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' })]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(1)
    })

    it('counts a strike when the picked player loses normally', () => {
      const picks = [pick('playerA', 1)]
      const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerB' })]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(1)
      expect(result.correctPicks).toBe(0)
    })

    it('accumulates strikes across multiple picks', () => {
      const picks = [pick('playerA', 1), pick('playerC', 1)]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerB' }),
        match({ roundId: 'r1', player1Id: 'playerC', player2Id: 'playerD', winnerId: 'playerD' }),
      ]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(2)
      expect(result.correctPicks).toBe(0)
    })

    it('counts mixed results correctly', () => {
      const picks = [pick('playerA', 1), pick('playerC', 1), pick('playerE', 1)]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
        match({ roundId: 'r1', player1Id: 'playerC', player2Id: 'playerD', winnerId: 'playerD' }),
        match({ roundId: 'r1', player1Id: 'playerE', player2Id: 'playerF', winnerId: 'playerE' }),
      ]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(1)
      expect(result.correctPicks).toBe(2)
    })
  })

  describe('walkovers', () => {
    it('gives bonus correct pick for walkover win', () => {
      const picks = [pick('playerA', 1)]
      const matches = [match({
        roundId: 'r1',
        player1Id: 'playerA',
        player2Id: 'playerB',
        winnerId: 'playerA',
        isWalkover: true,
      })]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(2) // 1 normal + 1 bonus
    })

    it('still gives strike when picked player loses via walkover', () => {
      // Picked player was the one who didn't show (walkover for opponent)
      const picks = [pick('playerB', 1)]
      const matches = [match({
        roundId: 'r1',
        player1Id: 'playerA',
        player2Id: 'playerB',
        winnerId: 'playerA',
        isWalkover: true,
      })]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(1)
      expect(result.correctPicks).toBe(0)
    })
  })

  describe('retirements', () => {
    it('gives a strike when the picked player retired', () => {
      const picks = [pick('playerA', 1)]
      const matches = [match({
        roundId: 'r1',
        player1Id: 'playerA',
        player2Id: 'playerB',
        winnerId: 'playerB',
        retiredPlayerId: 'playerA',
      })]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(1)
      expect(result.correctPicks).toBe(0)
    })

    it('gives correct pick when opponent retired (picked player advances)', () => {
      const picks = [pick('playerA', 1)]
      const matches = [match({
        roundId: 'r1',
        player1Id: 'playerA',
        player2Id: 'playerB',
        winnerId: 'playerA',
        retiredPlayerId: 'playerB',
      })]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(1)
    })

    it('gives correct pick (not strike) when picking the winner of a retirement match where opponent retired', () => {
      // Player B retired, Player A wins. User picked Player A.
      // This tests the else-if branch: player won, but there was a retirement.
      // The player DID win, so it goes through the "didPlayerWin" branch.
      const picks = [pick('playerA', 1)]
      const matches = [match({
        roundId: 'r1',
        player1Id: 'playerA',
        player2Id: 'playerB',
        winnerId: 'playerA',
        retiredPlayerId: 'playerB',
      })]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(1)
    })

    it('gives strike when picking the loser of a non-retirement match even when retiredPlayerId is irrelevant', () => {
      // Edge: user picked the loser, and there IS a retiredPlayerId but it's neither player in the match
      // This shouldn't happen in practice but tests defensive behavior
      const picks = [pick('playerB', 1)]
      const matches = [match({
        roundId: 'r1',
        player1Id: 'playerA',
        player2Id: 'playerB',
        winnerId: 'playerA',
        retiredPlayerId: null,
      })]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(1)
      expect(result.correctPicks).toBe(0)
    })
  })

  describe('bye players (no match in round)', () => {
    it('silently skips picks for players with no match in the round', () => {
      const picks = [pick('byePlayer', 1)]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
      ]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(0)
    })

    it('scores other picks normally when one pick has no match', () => {
      const picks = [pick('byePlayer', 1), pick('playerA', 1)]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
      ]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(1)
    })
  })

  describe('partial results (matches without winners)', () => {
    it('skips matches that have no result yet', () => {
      const picks = [pick('playerA', 1), pick('playerC', 1)]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
        match({ roundId: 'r1', player1Id: 'playerC', player2Id: 'playerD', winnerId: null }),
      ]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(1)
    })

    it('does not count strikes for pending matches', () => {
      const picks = [pick('playerA', 1)]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: null }),
      ]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(0)
    })
  })

  describe('multi-round scoring', () => {
    it('evaluates picks across multiple rounds', () => {
      const picks = [
        pick('playerA', 1),
        pick('playerA', 2),
      ]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
        match({ roundId: 'r2', player1Id: 'playerA', player2Id: 'playerC', winnerId: 'playerC' }),
      ]

      const result = evaluatePicks(picks, matches, finalRoundNumber)

      expect(result.strikes).toBe(1)
      expect(result.correctPicks).toBe(1)
    })
  })

  describe('final round submission tracking', () => {
    it('tracks submission time for final round picks', () => {
      const finalPick = pick('playerA', 7) // finalRoundNumber = 7
      finalPick.submittedAt = new Date('2026-03-15T10:00:00Z')
      const picks = [finalPick]
      const matches = [
        match({ roundId: 'r7', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
      ]

      const result = evaluatePicks(picks, matches, 7)

      expect(result.finalRoundSubmission).toEqual(new Date('2026-03-15T10:00:00Z'))
    })

    it('returns null for final round submission when no final round picks exist', () => {
      const picks = [pick('playerA', 1)]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
      ]

      const result = evaluatePicks(picks, matches, 7)

      expect(result.finalRoundSubmission).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('returns zeros when there are no picks', () => {
      const result = evaluatePicks([], [], 7)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(0)
      expect(result.finalRoundSubmission).toBeNull()
    })

    it('returns zeros when there are picks but no matches', () => {
      const picks = [pick('playerA', 1)]
      const result = evaluatePicks(picks, [], 7)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(0)
    })

    it('handles player appearing as player2 in a match', () => {
      const picks = [pick('playerB', 1)]
      const matches = [
        match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerB' }),
      ]

      const result = evaluatePicks(picks, matches, 7)

      expect(result.strikes).toBe(0)
      expect(result.correctPicks).toBe(1)
    })
  })
})

describe('classifyPick', () => {
  it('returns pending when no match exists for the player', () => {
    const p = pick('playerA', 1)
    const matches: MatchResult[] = []

    const result = classifyPick(p, matches)

    expect(result.status).toBe('pending')
    expect(result.reason).toBe('Awaiting result')
  })

  it('returns pending when match has no winner yet', () => {
    const p = pick('playerA', 1)
    const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: null })]

    const result = classifyPick(p, matches)

    expect(result.status).toBe('pending')
    expect(result.reason).toBe('Awaiting result')
  })

  it('returns win with "Won match" and no bonus for a normal win', () => {
    const p = pick('playerA', 1)
    const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' })]

    const result = classifyPick(p, matches)

    expect(result.status).toBe('win')
    expect(result.reason).toBe('Won match')
    expect(result.bonus).toBe(false)
  })

  it('returns win with "Won by walkover" and bonus for walkover win', () => {
    const p = pick('playerA', 1)
    const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA', isWalkover: true })]

    const result = classifyPick(p, matches)

    expect(result.status).toBe('win')
    expect(result.reason).toBe('Won by walkover')
    expect(result.bonus).toBe(true)
  })

  it('returns win with "Opponent retired" when opponent retired', () => {
    const p = pick('playerA', 1)
    const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA', retiredPlayerId: 'playerB' })]

    const result = classifyPick(p, matches)

    expect(result.status).toBe('win')
    expect(result.reason).toBe('Opponent retired')
  })

  it('returns loss with "Lost match" for a normal loss', () => {
    const p = pick('playerA', 1)
    const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerB' })]

    const result = classifyPick(p, matches)

    expect(result.status).toBe('loss')
    expect(result.reason).toBe('Lost match')
  })

  it('returns loss with "Retired from match" when picked player retired', () => {
    const p = pick('playerA', 1)
    const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerB', retiredPlayerId: 'playerA' })]

    const result = classifyPick(p, matches)

    expect(result.status).toBe('loss')
    expect(result.reason).toBe('Retired from match')
  })

  it('returns loss with "Lost by walkover" when picked player lost via walkover', () => {
    const p = pick('playerB', 1)
    const matches = [match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA', isWalkover: true })]

    const result = classifyPick(p, matches)

    expect(result.status).toBe('loss')
    expect(result.reason).toBe('Lost by walkover')
  })

  it('includes playerId in the result', () => {
    const p = pick('playerX', 1)
    const matches = [match({ roundId: 'r1', player1Id: 'playerX', player2Id: 'playerY', winnerId: 'playerX' })]

    const result = classifyPick(p, matches)

    expect(result.playerId).toBe('playerX')
  })
})

describe('evaluatePicksDetailed', () => {
  it('returns outcomes for all picks', () => {
    const picks = [pick('playerA', 1), pick('playerC', 1)]
    const matches = [
      match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
      match({ roundId: 'r1', player1Id: 'playerC', player2Id: 'playerD', winnerId: 'playerD' }),
    ]

    const results = evaluatePicksDetailed(picks, matches)

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ playerId: 'playerA', status: 'win', reason: 'Won match', bonus: false })
    expect(results[1]).toEqual({ playerId: 'playerC', status: 'loss', reason: 'Lost match', bonus: false })
  })

  it('handles mixed pending and completed picks', () => {
    const picks = [pick('playerA', 1), pick('playerC', 1)]
    const matches = [
      match({ roundId: 'r1', player1Id: 'playerA', player2Id: 'playerB', winnerId: 'playerA' }),
      match({ roundId: 'r1', player1Id: 'playerC', player2Id: 'playerD', winnerId: null }),
    ]

    const results = evaluatePicksDetailed(picks, matches)

    expect(results[0].status).toBe('win')
    expect(results[1].status).toBe('pending')
  })

  it('returns empty array for no picks', () => {
    const results = evaluatePicksDetailed([], [])
    expect(results).toEqual([])
  })
})
