// ABOUTME: Tests for bracket auto-generation logic.
// ABOUTME: Verifies that winners are correctly paired into next-round matches based on bracket position.
import { describe, it, expect } from 'vitest'
import { pairWinnersForNextRound } from './bracket'

describe('pairWinnersForNextRound', () => {
  it('pairs consecutive winners into next-round matches', () => {
    const completedMatches = [
      { bracketPosition: 1, winnerId: 'w1' },
      { bracketPosition: 2, winnerId: 'w2' },
      { bracketPosition: 3, winnerId: 'w3' },
      { bracketPosition: 4, winnerId: 'w4' },
    ]

    const pairs = pairWinnersForNextRound(completedMatches)

    expect(pairs).toEqual([
      { player1Id: 'w1', player2Id: 'w2', bracketPosition: 1 },
      { player1Id: 'w3', player2Id: 'w4', bracketPosition: 2 },
    ])
  })

  it('sorts by bracket position before pairing', () => {
    const completedMatches = [
      { bracketPosition: 4, winnerId: 'w4' },
      { bracketPosition: 1, winnerId: 'w1' },
      { bracketPosition: 3, winnerId: 'w3' },
      { bracketPosition: 2, winnerId: 'w2' },
    ]

    const pairs = pairWinnersForNextRound(completedMatches)

    expect(pairs).toEqual([
      { player1Id: 'w1', player2Id: 'w2', bracketPosition: 1 },
      { player1Id: 'w3', player2Id: 'w4', bracketPosition: 2 },
    ])
  })

  it('handles a single match (final)', () => {
    const completedMatches = [
      { bracketPosition: 1, winnerId: 'w1' },
      { bracketPosition: 2, winnerId: 'w2' },
    ]

    const pairs = pairWinnersForNextRound(completedMatches)

    expect(pairs).toEqual([
      { player1Id: 'w1', player2Id: 'w2', bracketPosition: 1 },
    ])
  })

  it('throws if any match has no bracket position', () => {
    const completedMatches = [
      { bracketPosition: 1, winnerId: 'w1' },
      { bracketPosition: null, winnerId: 'w2' },
    ]

    expect(() => pairWinnersForNextRound(completedMatches)).toThrow(
      'All matches must have bracket positions'
    )
  })

  it('throws if odd number of matches', () => {
    const completedMatches = [
      { bracketPosition: 1, winnerId: 'w1' },
      { bracketPosition: 2, winnerId: 'w2' },
      { bracketPosition: 3, winnerId: 'w3' },
    ]

    expect(() => pairWinnersForNextRound(completedMatches)).toThrow(
      'Cannot generate pairs from odd number of matches'
    )
  })

  it('throws if any match has no winner', () => {
    const completedMatches = [
      { bracketPosition: 1, winnerId: 'w1' },
      { bracketPosition: 2, winnerId: null },
    ]

    expect(() => pairWinnersForNextRound(completedMatches)).toThrow(
      'All matches must have results'
    )
  })

  it('handles large bracket (32 matches to 16)', () => {
    const completedMatches = Array.from({ length: 32 }, (_, i) => ({
      bracketPosition: i + 1,
      winnerId: `w${i + 1}`,
    }))

    const pairs = pairWinnersForNextRound(completedMatches)

    expect(pairs).toHaveLength(16)
    expect(pairs[0]).toEqual({ player1Id: 'w1', player2Id: 'w2', bracketPosition: 1 })
    expect(pairs[15]).toEqual({ player1Id: 'w31', player2Id: 'w32', bracketPosition: 16 })
  })
})
