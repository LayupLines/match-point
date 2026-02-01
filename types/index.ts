import { User, Tournament, Round, Player, Match, League, Pick, Standings } from '@prisma/client'

export type UserWithoutPassword = Omit<User, 'password'>

export type LeagueWithTournament = League & {
  tournament: Tournament
  _count?: {
    memberships: number
  }
}

export type StandingsWithUser = Standings & {
  user: UserWithoutPassword
}

export type PickWithPlayer = Pick & {
  player: Player
}

export type MatchWithPlayers = Match & {
  player1: Player
  player2: Player
  winner?: Player | null
  retiredPlayer?: Player | null
}

export type RoundWithMatches = Round & {
  matches: MatchWithPlayers[]
}
