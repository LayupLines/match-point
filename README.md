# Match Point - Tennis Survivor Game

A full-stack web application for running tennis survivor-style leagues. Users pick players each round and compete to avoid elimination. Supports multiple tournament formats from Grand Slams to ATP/WTA 250s.

**Production**: https://match-point-delta.vercel.app
**Repository**: https://github.com/LayupLines/match-point

## Features

### Player Experience
- **Multi-Tournament Support**: Grand Slams, ATP 1000/500/250, WTA 1000/500/250 with tailored pick counts per level
- **Player Search & Filter**: Search 96+ players by name or country in a responsive grid
- **Live Countdown Timers**: Color-coded urgency (green > orange < 24h > red+pulse < 2h > locked)
- **Per-Pick Result Cards**: Win/loss/pending status with detailed reasons (walkover, retirement, etc.)
- **Walkover Bonus Display**: Correct pick + bonus indicator matching standings engine
- **Pick Save Feedback**: Auto-dismissing banners confirm selections
- **Standings & Rankings**: Live standings with strike tracking, correct pick counts, and elimination status
- **Mobile-Responsive**: Adaptive layouts, hidden columns on small screens, touch-friendly targets

### Admin Experience
- **Tournament Operations**: Full lifecycle management (create, activate, complete)
- **CSV Uploads**: Bulk player and match imports
- **Auto-Bracket Generation**: Generates next-round matches from completed round results
- **Result Entry & Correction**: Enter results with walkover/retirement toggles, correct mistakes
- **Round Lock Time Management**: Inline datetime editors per round

### Game Rules
- **No Re-Use Rule**: Players can only be picked once per tournament
- **Strike System**: 2 strikes = elimination
- **Special Cases**: Walkovers grant a bonus correct pick; retirements handled correctly
- **Tiebreakers**: Fewest strikes > most correct picks > earliest final round submission

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS v4, shadcn/ui (OKLCH color format, Wimbledon theme)
- **Database**: PostgreSQL (Neon) with Prisma 7 ORM
- **Auth**: NextAuth v5 (beta) with JWT sessions (`AUTH_SECRET` env var)
- **Validation**: Zod v4
- **Testing**: Vitest (39 tests: 32 scoring + 7 bracket)
- **Deployment**: Vercel with auto-deploy on GitHub push

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)

### 1. Clone and Install

```bash
git clone https://github.com/LayupLines/match-point.git
cd match-point
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/matchpoint"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
CRON_SECRET="your-cron-secret-here"
```

> **Important**: NextAuth v5 uses `AUTH_SECRET`, not `NEXTAUTH_SECRET`.

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates:
- Admin: `admin@matchpoint.com` / `admin123`
- Test users: `user1@example.com` / `password123`, `user2@example.com` / `password123`
- Sample tournaments, players, rounds, and leagues

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Round Structure by Tournament Level

| Level | Rounds | Pick Requirements |
|-------|--------|------------------|
| Grand Slam | 7 | 4 / 3 / 2 / 2 / 1 / 1 / 1 |
| ATP 1000 | 7 | 3 / 2 / 2 / 1 / 1 / 1 / 1 |
| WTA 1000 | 6 | 3 / 2 / 1 / 1 / 1 / 1 |
| ATP/WTA 500 | 5 | 2 / 2 / 1 / 1 / 1 |
| ATP/WTA 250 | 5 | 2 / 2 / 1 / 1 / 1 |

## Scoring Rules

| Scenario | Result |
|----------|--------|
| Picked player wins match | Correct pick (no strike) |
| Picked player loses match | 1 strike |
| Picked player wins by walkover | Correct pick + 1 bonus |
| Picked player's opponent retires | Correct pick (no strike) |
| Picked player retires | 1 strike |
| Picked player loses by walkover | 1 strike |
| **2 total strikes** | **Eliminated** |

### Tiebreakers (in order)
1. Fewest strikes
2. Most correct picks (including walkover bonuses)
3. Earliest final round submission time

## Project Structure

```
match-point/
├── app/
│   ├── api/
│   │   ├── auth/                  # NextAuth endpoints
│   │   ├── leagues/               # League CRUD + join
│   │   ├── picks/                 # Pick submission (form + JSON)
│   │   ├── admin/
│   │   │   ├── tournaments/       # Tournament CRUD, players, matches
│   │   │   ├── matches/           # Result entry
│   │   │   ├── rounds/            # Lock time management
│   │   │   └── scoring/           # Manual scoring trigger
│   │   └── cron/                  # Nightly scoring
│   ├── admin/                     # Admin pages
│   │   ├── layout.tsx             # Auth guard (ADMIN role) + nav header
│   │   ├── page.tsx               # Tournament dashboard
│   │   ├── results/               # Result entry page
│   │   └── tournaments/[id]/      # Tournament detail, players, matches
│   ├── dashboard/                 # User dashboard
│   ├── league/[id]/               # League detail page
│   │   └── picks/                 # Picks page with results
│   └── page.tsx                   # Landing page
├── components/
│   ├── admin/                     # Admin client components
│   │   ├── create-tournament-form.tsx
│   │   ├── result-entry-panel.tsx  # Result entry with correction
│   │   ├── generate-round-button.tsx # Auto-bracket trigger
│   │   ├── status-controls.tsx
│   │   ├── lock-time-editor.tsx
│   │   ├── player-upload-form.tsx
│   │   └── match-upload-form.tsx
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx, card.tsx, input.tsx, label.tsx, badge.tsx, alert.tsx
│   ├── player-grid.tsx            # Searchable player grid (client)
│   └── countdown-timer.tsx        # Live countdown timer (client)
├── lib/
│   ├── services/
│   │   ├── pick-evaluation.ts     # Pure scoring logic (classifyPick, evaluatePicks)
│   │   ├── scoring.ts             # DB-backed scoring engine
│   │   ├── scoring.test.ts        # 32 scoring tests
│   │   ├── bracket.ts             # pairWinnersForNextRound()
│   │   ├── bracket.test.ts        # 7 bracket tests
│   │   ├── picks.ts               # Pick submission service
│   │   ├── league.ts              # League service
│   │   └── tournament.ts          # Tournament + match services
│   ├── validation/schemas.ts      # Zod validation schemas
│   ├── utils/
│   │   ├── csv.ts                 # CSV parsing (players, matches)
│   │   ├── dates.ts               # Date formatting
│   │   └── country.ts             # Country code mapping + flag paths
│   ├── auth.ts                    # NextAuth v5 config
│   ├── db.ts                      # Prisma client
│   └── constants.ts               # ROUND_PRESETS per tournament level
├── prisma/
│   ├── schema.prisma              # Full database schema
│   ├── migrations/                # SQL migrations
│   └── seed.ts                    # Database seed script
├── public/
│   ├── flags/                     # Country flag SVGs (16 files)
│   └── grass-court.jpg            # Background texture
├── vitest.config.ts               # Test configuration
├── tailwind.config.ts             # Tailwind + Wimbledon theme colors
└── Context Files/
    └── PROGRESS.md                # Detailed development history
```

## Admin Guide

### Tournament Lifecycle

1. **Create** tournament via admin dashboard (select level: Grand Slam, ATP 1000, etc.)
2. **Upload players** via CSV: `name,seed,country` (seed and country optional)
3. **Upload R1 matches** via CSV: `player1,player2,roundNumber[,bracketPosition]`
4. **Set lock times** per round to match the real tournament schedule
5. **Activate** tournament when ready for users
6. **Enter results** as matches complete (admin results page)
7. **Auto-generate** next round brackets once all matches in a round are done
8. **Complete** tournament when finished

### CSV Formats

**Players CSV:**
```csv
name,seed,country
Novak Djokovic,1,SRB
Carlos Alcaraz,2,ESP
Unseeded Player,,USA
```

**Matches CSV:**
```csv
player1,player2,roundNumber,bracketPosition
Novak Djokovic,Qualifier 1,1,1
Carlos Alcaraz,Qualifier 2,1,2
```

### Auto-Bracket Workflow (ATP 1000 example)
- Upload R1 CSV + R2 CSV (32 seeds have first-round byes)
- R3 through R7: click "Generate Next Round" after each round completes
- Saves 5 manual CSV uploads per tournament

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leagues` | Browse all public leagues |
| GET | `/api/leagues/[id]` | League details |
| GET | `/api/leagues/[id]/standings` | View standings |

### Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create account |
| POST | `/api/leagues` | Create league |
| POST | `/api/leagues/[id]/join` | Join league |
| POST | `/api/picks` | Submit picks (form data or JSON) |
| GET | `/api/picks?leagueId=X` | View my picks |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/tournaments` | Create tournament |
| GET | `/api/admin/tournaments/[id]` | Tournament detail |
| PUT | `/api/admin/tournaments/[id]/status` | Update status |
| POST | `/api/admin/tournaments/[id]/players` | Upload players CSV |
| GET/POST | `/api/admin/tournaments/[id]/matches` | Get/create matches |
| PUT | `/api/admin/matches/[id]/result` | Enter/correct result |
| PUT | `/api/admin/rounds/[id]/lock-time` | Update lock time |
| POST | `/api/admin/tournaments/[id]/rounds/[roundId]/generate` | Auto-generate bracket |
| POST | `/api/admin/scoring` | Manual scoring trigger |

### Cron
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cron/scoring` | Nightly scoring (requires `CRON_SECRET`) |

## Database Schema

### Models
| Model | Purpose |
|-------|---------|
| **User** | Authentication, roles (USER/ADMIN) |
| **Tournament** | Tournament instances with level (Grand Slam, ATP 1000, etc.) and status |
| **Round** | Rounds per tournament with lock times and required pick counts |
| **Player** | Tennis players (name, seed, country) scoped to tournament |
| **Match** | Matches with results, walkover/retirement flags, bracket positions |
| **League** | Public leagues tied to tournaments |
| **LeagueMembership** | User-league relationships |
| **Pick** | User picks (unique per user+league+round+player) |
| **Standings** | Calculated standings (strikes, correct picks, elimination, rank) |

### Key Constraints
- `Pick` has `@@unique([userId, leagueId, roundId, playerId])` — prevents duplicate picks
- `Match` has `@@unique([roundId, bracketPosition])` — ensures bracket integrity
- `Tournament` has `@@unique([year, gender, level])` — prevents duplicate tournaments
- `Round` has `@@unique([tournamentId, roundNumber])` — one round per number

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# TypeScript check
npx tsc --noEmit
```

### Test Coverage (39 tests)

**Scoring tests (32)**: Normal wins/losses, walkovers (bonus), retirements, bye players, partial results, multi-round scoring, final round tracking, per-pick classification (`classifyPick`), detailed evaluation (`evaluatePicksDetailed`).

**Bracket tests (7)**: Simple pairing, odd-number handling, bracket position ordering, single match, large bracket, empty input.

### Testing Strategy
- Pure functions extracted from DB-dependent code for unit testing without mocking
- `pick-evaluation.ts` (pure) is tested directly; `scoring.ts` (DB orchestration) delegates to it
- `bracket.ts` (pure) is tested directly; `tournament.ts` uses it for DB operations

## Deployment

### Production Setup (Vercel + Neon)

1. Push to GitHub (`main` branch)
2. Vercel auto-deploys on push
3. Required environment variables in Vercel:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `AUTH_SECRET` — NextAuth v5 secret key
   - `CRON_SECRET` — Secret for cron job authentication

4. Run migrations on production:
   ```bash
   npx prisma migrate deploy
   ```

5. Vercel Cron runs nightly scoring at 3 AM UTC (configured in `vercel.json`)

## Troubleshooting

### Auth Issues
- Ensure `AUTH_SECRET` (not `NEXTAUTH_SECRET`) is set — NextAuth v5 breaking change
- Check database is reachable from your environment

### CSS/Styling Issues
- Tailwind v4 requires `@config "../tailwind.config.ts"` in `globals.css`
- CSS variables must be inside `@layer base { ... }` for Tailwind v4
- Wimbledon theme colors use OKLCH format

### Database Issues
- Check `DATABASE_URL` in `.env`
- Run `npx prisma generate` after schema changes
- Use `npx prisma studio` to inspect data visually

## License

MIT
