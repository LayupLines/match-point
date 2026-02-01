export const ROUND_CONFIGS = [
  { roundNumber: 1, name: 'Round 1', requiredPicks: 4 },
  { roundNumber: 2, name: 'Round 2', requiredPicks: 3 },
  { roundNumber: 3, name: 'Round 3', requiredPicks: 2 },
  { roundNumber: 4, name: 'Round of 16', requiredPicks: 2 },
  { roundNumber: 5, name: 'Quarterfinals', requiredPicks: 1 },
  { roundNumber: 6, name: 'Semifinals', requiredPicks: 1 },
  { roundNumber: 7, name: 'Final', requiredPicks: 1 },
] as const

export const STRIKES_TO_ELIMINATE = 2
