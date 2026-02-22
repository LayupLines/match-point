// ABOUTME: Tournament configuration presets and game constants.
// ABOUTME: Maps tournament levels to their round structures and pick requirements.

export type RoundConfig = {
  roundNumber: number
  name: string
  requiredPicks: number
}

export const ROUND_PRESETS: Record<string, RoundConfig[]> = {
  GRAND_SLAM: [
    { roundNumber: 1, name: 'Round 1', requiredPicks: 4 },
    { roundNumber: 2, name: 'Round 2', requiredPicks: 3 },
    { roundNumber: 3, name: 'Round 3', requiredPicks: 2 },
    { roundNumber: 4, name: 'Round of 16', requiredPicks: 2 },
    { roundNumber: 5, name: 'Quarterfinals', requiredPicks: 1 },
    { roundNumber: 6, name: 'Semifinals', requiredPicks: 1 },
    { roundNumber: 7, name: 'Final', requiredPicks: 1 },
  ],
  ATP_1000: [
    { roundNumber: 1, name: 'Round 1', requiredPicks: 3 },
    { roundNumber: 2, name: 'Round 2', requiredPicks: 2 },
    { roundNumber: 3, name: 'Round 3', requiredPicks: 2 },
    { roundNumber: 4, name: 'Round of 16', requiredPicks: 1 },
    { roundNumber: 5, name: 'Quarterfinals', requiredPicks: 1 },
    { roundNumber: 6, name: 'Semifinals', requiredPicks: 1 },
    { roundNumber: 7, name: 'Final', requiredPicks: 1 },
  ],
  ATP_500: [
    { roundNumber: 1, name: 'Round 1', requiredPicks: 2 },
    { roundNumber: 2, name: 'Round 2', requiredPicks: 2 },
    { roundNumber: 3, name: 'Quarterfinals', requiredPicks: 1 },
    { roundNumber: 4, name: 'Semifinals', requiredPicks: 1 },
    { roundNumber: 5, name: 'Final', requiredPicks: 1 },
  ],
  ATP_250: [
    { roundNumber: 1, name: 'Round 1', requiredPicks: 2 },
    { roundNumber: 2, name: 'Round 2', requiredPicks: 2 },
    { roundNumber: 3, name: 'Quarterfinals', requiredPicks: 1 },
    { roundNumber: 4, name: 'Semifinals', requiredPicks: 1 },
    { roundNumber: 5, name: 'Final', requiredPicks: 1 },
  ],
  WTA_1000: [
    { roundNumber: 1, name: 'Round 1', requiredPicks: 3 },
    { roundNumber: 2, name: 'Round 2', requiredPicks: 2 },
    { roundNumber: 3, name: 'Round of 16', requiredPicks: 1 },
    { roundNumber: 4, name: 'Quarterfinals', requiredPicks: 1 },
    { roundNumber: 5, name: 'Semifinals', requiredPicks: 1 },
    { roundNumber: 6, name: 'Final', requiredPicks: 1 },
  ],
  WTA_500: [
    { roundNumber: 1, name: 'Round 1', requiredPicks: 2 },
    { roundNumber: 2, name: 'Round 2', requiredPicks: 2 },
    { roundNumber: 3, name: 'Quarterfinals', requiredPicks: 1 },
    { roundNumber: 4, name: 'Semifinals', requiredPicks: 1 },
    { roundNumber: 5, name: 'Final', requiredPicks: 1 },
  ],
  WTA_250: [
    { roundNumber: 1, name: 'Round 1', requiredPicks: 2 },
    { roundNumber: 2, name: 'Round 2', requiredPicks: 2 },
    { roundNumber: 3, name: 'Quarterfinals', requiredPicks: 1 },
    { roundNumber: 4, name: 'Semifinals', requiredPicks: 1 },
    { roundNumber: 5, name: 'Final', requiredPicks: 1 },
  ],
}

// Backward compatibility alias during migration
export const ROUND_CONFIGS = ROUND_PRESETS.GRAND_SLAM

export const STRIKES_TO_ELIMINATE = 2
