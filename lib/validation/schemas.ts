import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// League schemas
export const createLeagueSchema = z.object({
  name: z.string().min(3, 'League name must be at least 3 characters').max(50),
  description: z.string().max(500).optional(),
  tournamentId: z.string().cuid(),
})

// Pick schemas
export const submitPicksSchema = z.object({
  leagueId: z.string().cuid(),
  roundId: z.string().cuid(),
  playerIds: z.array(z.string().cuid()).min(1).max(4),
})

// Admin schemas
export const createTournamentSchema = z.object({
  name: z.string().min(3),
  year: z.number().int().min(2024).max(2100),
  gender: z.enum(['MEN', 'WOMEN']),
})

export const enterResultSchema = z.object({
  matchId: z.string().cuid(),
  winnerId: z.string().cuid(),
  isWalkover: z.boolean().optional(),
  retiredPlayerId: z.string().cuid().optional(),
})

export const uploadPlayersSchema = z.object({
  tournamentId: z.string().cuid(),
  players: z.array(z.object({
    name: z.string().min(1),
    seed: z.number().int().min(1).max(128).optional(),
    country: z.string().length(3).optional(), // ISO 3-letter code
  })),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateLeagueInput = z.infer<typeof createLeagueSchema>
export type SubmitPicksInput = z.infer<typeof submitPicksSchema>
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>
export type EnterResultInput = z.infer<typeof enterResultSchema>
export type UploadPlayersInput = z.infer<typeof uploadPlayersSchema>
