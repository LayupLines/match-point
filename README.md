# Match Point - Wimbledon Survivor Tennis Game

A full-stack web application for running Wimbledon survivor-style tennis leagues where users pick players each round and compete to avoid elimination.

## Features

- **Dual Tournament Support**: Separate Men's and Women's Wimbledon tournaments
- **Public Leagues**: Browse and join any league or create your own
- **Multi-Pick Rounds**: Pick 4 players in Round 1, narrowing down each round (4→3→2→2→1→1→1)
- **Strike System**: Two incorrect picks = elimination
- **No Re-Use Rule**: Players can only be picked once per tournament
- **Lock Times**: Picks automatically lock when the round starts
- **Special Cases**: Proper handling of walkovers and retirements
- **Real-Time Scoring**: Immediate updates when admin enters results + nightly recalculation
- **Mobile-First Design**: Fully responsive interface

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, NextAuth.js v5
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel + Neon/Supabase PostgreSQL
- **Validation**: Zod
- **Password Hashing**: bcrypt

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)

### 1. Clone and Install

```bash
cd match-point
npm install
```

### 2. Database Setup

Create a PostgreSQL database and add the connection string to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set:
```
DATABASE_URL="postgresql://user:password@localhost:5432/matchpoint"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
CRON_SECRET="your-cron-secret-here"
```

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

### 3. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database

```bash
npx prisma db seed
```

This creates:
- Admin user: `admin@matchpoint.com` / `admin123`
- Test users: `user1@example.com` / `password123`, `user2@example.com` / `password123`
- Men's and Women's Wimbledon 2026 tournaments
- 128 players for each tournament
- 7 rounds for each tournament
- Sample leagues

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
match-point/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── auth/                # NextAuth endpoints
│   │   ├── leagues/             # League management
│   │   ├── picks/               # Pick submission
│   │   ├── admin/               # Admin operations
│   │   └── cron/                # Scheduled scoring
│   ├── (pages)/                 # Frontend pages
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/                   # React components
├── lib/                          # Core business logic
│   ├── services/                # Business logic services
│   │   ├── scoring.ts           # Scoring engine
│   │   ├── picks.ts             # Pick validation
│   │   ├── league.ts            # League management
│   │   └── tournament.ts        # Tournament operations
│   ├── validation/              # Zod schemas
│   ├── utils/                   # Utilities (CSV, dates)
│   ├── auth.ts                  # NextAuth config
│   ├── db.ts                    # Prisma client
│   └── constants.ts             # Game constants
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed script
└── types/                        # TypeScript types
```

## Game Rules

### Round Structure
- **Round 1**: 4 picks required
- **Round 2**: 3 picks required
- **Round 3**: 2 picks required
- **Round of 16**: 2 picks required
- **Quarterfinals**: 1 pick required
- **Semifinals**: 1 pick required
- **Final**: 1 pick required

### Scoring
- **Correct Pick**: Player wins their match → No strike
- **Incorrect Pick**: Player loses → 1 strike
- **Walkover**: Player advances without playing → WIN (no strike)
- **Retirement**:
  - If your player retires → STRIKE
  - If opponent retires (your player advances) → WIN (no strike)

### Elimination
- **2 strikes** = Eliminated from league
- Eliminated users can still view standings but cannot make new picks

### Tiebreakers (in order)
1. Fewest strikes
2. Most correct picks
3. Earliest final round submission time

## Admin Guide

### Creating a Tournament

1. Login as admin
2. Navigate to `/admin/tournaments`
3. Click "Create Tournament"
4. Fill in:
   - Name: e.g., "Wimbledon Men's Singles 2026"
   - Year: 2026
   - Gender: MEN or WOMEN

### Uploading Players

CSV Format:
```
name,seed,country
Novak Djokovic,1,SRB
Carlos Alcaraz,2,ESP
Unseeded Player,,USA
```

API: `POST /api/admin/tournaments/[id]/players`
```json
{
  "csvData": "name,seed,country\nNovak Djokovic,1,SRB\n..."
}
```

### Entering Match Results

API: `PUT /api/admin/matches/[matchId]/result`
```json
{
  "winnerId": "player-id-here",
  "isWalkover": false,
  "retiredPlayerId": "player-id-if-retired"
}
```

This triggers immediate scoring recalculation for all affected leagues.

### Manual Scoring Trigger

API: `POST /api/admin/scoring`

Recalculates all standings for active tournaments.

## Deployment

### Vercel + Neon/Supabase

1. **Create a Neon or Supabase PostgreSQL database**

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel:**
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production domain)
   - `NEXTAUTH_SECRET`
   - `CRON_SECRET`

4. **Run migrations in production:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

6. **Vercel Cron** will automatically run nightly scoring at 3 AM UTC (configured in `vercel.json`)

## API Endpoints

### Public
- `GET /api/leagues` - Browse all public leagues
- `GET /api/leagues/[id]` - Get league details
- `GET /api/leagues/[id]/standings` - View standings

### Authenticated
- `POST /api/register` - Create account
- `POST /api/leagues` - Create league
- `POST /api/leagues/[id]/join` - Join league
- `POST /api/picks` - Submit picks
- `GET /api/picks?leagueId=X` - View my picks

### Admin Only
- `POST /api/admin/tournaments` - Create tournament
- `POST /api/admin/tournaments/[id]/players` - Upload players
- `PUT /api/admin/matches/[id]/result` - Enter result
- `POST /api/admin/scoring` - Manual scoring

### Cron
- `GET /api/cron/scoring` - Nightly scoring (requires `CRON_SECRET`)

## Database Schema

### Core Models
- **User** - Authentication and user profiles
- **Tournament** - Tournament instances (Men's/Women's, year, status)
- **Round** - 7 rounds per tournament with lock times
- **Player** - Tennis players (name, seed, country)
- **Match** - Individual matches with results
- **League** - Public leagues
- **LeagueMembership** - Users in leagues
- **Pick** - User picks (user + league + round + player)
- **Standings** - Calculated standings (strikes, eliminations, ranks)

## Development

### Running Prisma Studio
```bash
npx prisma studio
```

### Resetting Database
```bash
npx prisma migrate reset
```

### Type Generation
```bash
npx prisma generate
```

## Testing

### End-to-End Test Flow

1. Register 2 test users
2. Create a league for Men's Wimbledon 2026
3. Both users join the league
4. Submit picks for Round 1 (4 players each)
5. Login as admin
6. Enter match results (mix of wins, losses, retirements)
7. Verify standings update correctly
8. Check strike counting and elimination logic
9. Test tiebreakers with users having same strikes

## Troubleshooting

### Prisma Client Issues
```bash
npx prisma generate
```

### Database Connection Errors
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database exists

### NextAuth Session Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain

### Cron Job Not Running
- Verify `vercel.json` is committed
- Check Vercel dashboard > Cron Jobs
- Ensure `CRON_SECRET` matches

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
