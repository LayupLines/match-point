# Match Point - Quick Start Guide

## Overview

Match Point is a tennis survivor game where users pick players each round and compete to avoid elimination. Supports Grand Slams, ATP 1000/500/250, and WTA 1000/500/250 tournaments.

**Production URL**: https://match-point-delta.vercel.app
**GitHub**: https://github.com/LayupLines/match-point

## Running Locally

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)

### 1. Install Dependencies

```bash
cd "/Users/jeremyceille/Vaults/Match Point"
npm install
```

### 2. Environment Setup

Create a `.env` file with:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/matchpoint"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
CRON_SECRET="your-cron-secret-here"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

> **Note**: NextAuth v5 (beta) uses `AUTH_SECRET`, not `NEXTAUTH_SECRET`.

### 3. Database Setup

```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Start the Dev Server

```bash
npm run dev
```

Open http://localhost:3000

## Test Accounts (After Seeding)

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@matchpoint.com | admin123 |
| User 1 | user1@example.com | password123 |
| User 2 | user2@example.com | password123 |

## What You Can Do

### As a Regular User
1. Register or login
2. Browse and join public leagues
3. Create your own league
4. Submit picks for upcoming rounds (search/filter 96+ players)
5. See live countdown timers to round lock times
6. View per-pick results after rounds lock (win/loss/pending with reasons)
7. View standings and track strikes

### As an Admin (admin@matchpoint.com)
1. Create tournaments of any level (Grand Slam, ATP/WTA 1000/500/250)
2. Upload players via CSV
3. Upload matches via CSV (with optional bracket positions)
4. Auto-generate next-round bracket matches from completed rounds
5. Enter and correct match results (wins, walkovers, retirements)
6. Manage round lock times
7. Transition tournament status (Upcoming -> Active -> Completed)

## Common Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# TypeScript type check
npx tsc --noEmit

# Prisma Studio (visual database editor)
npx prisma studio

# Reset database (deletes all data)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## Project Structure

```
Match Point/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (picks, leagues, admin, cron)
│   ├── admin/                    # Admin pages (tournaments, players, matches, results)
│   ├── dashboard/                # User dashboard
│   ├── league/[id]/              # League detail + picks pages
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── admin/                    # Admin client components (forms, panels, buttons)
│   ├── ui/                       # shadcn/ui components (Button, Card, Badge, etc.)
│   ├── player-grid.tsx           # Player search/filter grid (client)
│   └── countdown-timer.tsx       # Live countdown timer (client)
├── lib/                          # Core business logic
│   ├── services/                 # Business logic (scoring, picks, brackets, tournaments)
│   │   ├── pick-evaluation.ts    # Pure scoring logic (no DB dependency)
│   │   ├── scoring.ts            # Scoring engine (DB orchestration)
│   │   ├── scoring.test.ts       # 32 scoring tests
│   │   ├── bracket.ts            # Auto-bracket generation
│   │   └── bracket.test.ts       # 7 bracket tests
│   ├── validation/               # Zod schemas
│   ├── utils/                    # Utilities (CSV, dates, country flags)
│   ├── auth.ts                   # NextAuth v5 config
│   ├── db.ts                     # Prisma client
│   └── constants.ts              # Round presets per tournament level
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Seed script
├── public/
│   ├── flags/                    # Country flag SVGs
│   └── grass-court.jpg           # Background texture
└── Context Files/                # Development documentation
    └── PROGRESS.md               # Detailed development history
```

## Troubleshooting

### "Invalid email or password" on login
- Check that `AUTH_SECRET` (not `NEXTAUTH_SECRET`) is set in your environment
- Verify the database is seeded: `npx prisma db seed`

### Database connection errors
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Try `npx prisma generate` if you get client errors

### Build errors
- Run `npx tsc --noEmit` to find TypeScript issues
- Run `npm run build` to check the full build
- Ensure `@config "../tailwind.config.ts"` is in `app/globals.css` (Tailwind v4 requirement)

### Port already in use
```bash
lsof -ti:3000 | xargs kill -9
# Or use a different port:
npm run dev -- -p 3001
```

## Full Documentation

See `README.md` for complete documentation including:
- Game rules and scoring details
- API endpoint reference
- Admin operations guide
- CSV format specifications
- Deployment instructions
