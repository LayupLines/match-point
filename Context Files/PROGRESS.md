# Match Point - Development Progress

## Project Overview
Wimbledon Survivor tennis game built with Next.js 15, Prisma 7, NextAuth v5, and TailwindCSS v4.

## Completed Work

### Initial Deployment (Feb 1, 2026)
- **Deployment Setup**: Deployed to Vercel with Neon PostgreSQL database
- **GitHub Repository**: Created and pushed initial codebase to https://github.com/LayupLines/match-point
- **Production URL**: https://match-point-delta.vercel.app
- **Database**: Configured Neon PostgreSQL with connection pooling
- **Environment Variables**: Set up DATABASE_URL, NEXTAUTH_SECRET, CRON_SECRET in Vercel

### TypeScript Build Fixes (Feb 1, 2026)
**Issue**: Build failing on Vercel with TypeScript errors
**Fixed**:
- Zod v4 API change: Updated all API routes from `error.errors[0]` to `error.issues[0]`
- Auth role type casting: Fixed `lib/auth.ts` to cast as `'USER' | 'ADMIN'`
- Scoring service: Added type annotations to sort function
- Next.js config: Removed deprecated eslint configuration

### Database Architecture (Feb 1, 2026)
**Decision**: Support both local Prisma dev and production PostgreSQL
**Implementation**:
- Created URL detection logic in `lib/db.ts` and `prisma/seed.ts`
- Decodes Prisma dev API key or uses standard PostgreSQL URL
- Same codebase works seamlessly in both environments

### Database Seeding (Feb 1, 2026)
**Data Created**:
- 3 test users (admin + 2 regular users)
- 2 tournaments (Men's and Women's Wimbledon 2026)
- 14 rounds total (7 per tournament)
- 256 players (128 men + 128 women)
- Sample leagues for testing

**Test Accounts**:
- Admin: admin@matchpoint.com / admin123
- User 1: user1@example.com / password123
- User 2: user2@example.com / password123

### UI/UX Improvements (Feb 5, 2026)
**First Iteration** - Colorful Design:
- Added Wimbledon brand colors (purple #6B46C1, green #00A86B)
- Enhanced shadows and hover effects
- Added status colors for round states
- Improved card designs with gradients
- Added icons throughout

**Refinement Attempt** - Authentic Wimbledon Style:
- Updated colors to official Wimbledon palette (deep purple #2E1A47, green #006633)
- Minimalist, elegant design aesthetic
- Subtle shadows and interactions
- **Reverted**: Not the desired direction

**Final Design** - Modern & Interactive (Feb 5, 2026):
- **Visual Interest**: Dynamic gradients, glassmorphism effects, animated transitions
- **Information Hierarchy**: Improved typography scale, better spacing, clearer sections
- **Interactivity**: Smooth hover states (300ms), scale transforms, animated progress bars
- **Mobile Responsive**: Responsive grids (1→2→3→4 columns), flexible layouts, touch-friendly targets

### Build Error Resolution (Feb 5, 2026)
**Issue**: Vercel build failing with styled-jsx errors
**Root Cause**: `<style jsx>` blocks incompatible with Next.js server components
**Fixed**:
- Removed all styled-jsx blocks from dashboard, league, and picks pages
- Replaced custom CSS animations with Tailwind's native `animate-in` utilities
- Fixed duplicate closing tags in picks page
- Verified local build success before deployment

### Authentication Bug Fix (Feb 5, 2026)
**Issue**: "Invalid email or password" error on login
**Root Cause**: DATABASE_URL in Vercel had newline character (`\n`) at end, breaking database connections
**Fixed**:
- Removed corrupted DATABASE_URL from Vercel production environment
- Re-added DATABASE_URL properly using `printf` (no newline)
- Redeployed application to production
- Verified authentication working with test accounts

## Technical Decisions

### Color Palette
**Decision**: Use Wimbledon-inspired colors with modern gradients
**Rationale**: Authentic Wimbledon colors too subtle; opted for vibrant purple/green with gradient effects for better visual engagement

### Animation Strategy
**Decision**: Use Tailwind's built-in animate-in utilities over custom CSS
**Rationale**: Avoids styled-jsx compatibility issues with server components, more performant, easier to maintain

### Database Connection
**Decision**: Support both Prisma dev (local) and direct PostgreSQL (production)
**Rationale**: Allows seamless development locally while using Neon in production

### Testing Strategy
**Decision**: Start writing tests for new features going forward using TDD
**Rationale**: Build test coverage incrementally as we add features

### Grass Court Background (Feb 15, 2026)
**Feature**: Replace gradient background with grass tennis court texture
**Implementation**:
- Downloaded grass court photo (istockphoto-177020637-612x612.jpg)
- Moved to `/public/grass-court.jpg` for Next.js static serving
- Applied to all main pages (dashboard, league detail, picks) using fixed positioning
- Added semi-transparent white overlay (75% opacity) for text readability
- Used CSS `background-size: cover` and `background-position: center` for full coverage
- Set `z-index: -10` on background layers to keep content above

**Files Modified**:
- `/app/dashboard/page.tsx` - Added grass background with overlay
- `/app/league/[id]/page.tsx` - Added grass background with overlay
- `/app/league/[id]/picks/page.tsx` - Added grass background with overlay
- `/public/grass-court.jpg` - New background image asset

### Country Flag Graphics (Feb 15, 2026)
**Feature**: Display country flags alongside player names on picks page
**Requirements**:
- Download and host flag images locally (no CDN)
- Compute flag from existing country codes (no database changes)
- Match tennis broadcast coverage style

**Implementation**:
- **Package**: Installed `country-flag-icons` npm package for flag SVGs
- **Assets**: Copied 15 country flag SVGs to `/public/flags/` (rs.svg, es.svg, it.svg, ru.svg, de.svg, gr.svg, no.svg, us.svg, bg.svg, pl.svg, by.svg, kz.svg, tn.svg, cn.svg, cz.svg)
- **Placeholder**: Created custom gray flag (`xx.svg`) for unknown/placeholder countries
- **Utility**: Created `/lib/utils/country.ts` with:
  - `COUNTRY_CODE_MAP`: Maps ISO 3166-1 alpha-3 (SRB, ESP, ITA) to alpha-2 (rs, es, it)
  - `getFlagPath()`: Returns flag image path with fallback to placeholder
  - `getCountryName()`: Converts country codes to full names (Serbia, Spain, etc.)
- **UI Updates**: Modified picks page to display:
  - Flag images (16x12px SVG) next to player names
  - Full country names instead of 3-letter codes
  - Rounded corners, subtle borders, and shadows for visual polish
  - Applied to both active player cards and locked picks sections

**Server Component Compatibility Fix**:
- **Issue**: Runtime error "Event handlers cannot be passed to Client Component props"
- **Root Cause**: Used `onError` event handler in Server Component
- **Solution**: Removed `onError` handler (YAGNI principle - all flags exist, edge case won't occur)
- **Fallback**: Browser shows alt text (country name) if image fails

**Files Created**:
- `/lib/utils/country.ts` - Country code mapping utility
- `/public/flags/*.svg` - 16 flag SVG files (15 countries + placeholder)

**Files Modified**:
- `/app/league/[id]/picks/page.tsx` - Added flag graphics and country names
- `/package.json` - Added country-flag-icons dependency

**Technical Details**:
- SVG format chosen for scalability and tiny file size (~1-2KB each)
- Standard `<img>` tags (no Next.js Image component needed for SVGs)
- Total bundle impact: ~22.5KB (negligible)
- All flags cached by browser for performance

### shadcn/ui Component Library Integration (Feb 15, 2026)
**Feature**: Add shadcn/ui component library for consistent, accessible UI components
**Goal**: Improve UI consistency and developer experience while preserving Wimbledon theme

**Implementation**:
- **Initialization**: Ran `npx shadcn@latest init` with New York style preset
- **Theme Customization**: Customized CSS variables in `app/globals.css` to use Wimbledon colors:
  - Primary: Wimbledon Purple (#2E1A47) in OKLCH format `oklch(0.25 0.08 300)`
  - Secondary: Wimbledon Green (#006633) in OKLCH format `oklch(0.35 0.12 150)`
  - Accent: Wimbledon Green Light (#007A3D) in OKLCH format `oklch(0.42 0.14 155)`
  - Ring/Focus: Matches primary purple for focus states
- **Components Installed**:
  - Tier 1: Button, Card, Input, Label (core UI elements)
  - Tier 2: Badge, Alert (status indicators and messages)
- **Test Page**: Created `/test-components` page to showcase all components with Wimbledon theme
- **Tailwind v4 Compatibility**: Fixed build error by removing invalid `@import "tw-animate-css"` line

**Package Dependencies Added**:
- `class-variance-authority` v0.7.1 - Component variant management
- `clsx` v2.1.1 - Conditional class names
- `tailwind-merge` v3.4.1 - Merge Tailwind classes without conflicts
- `tailwindcss-animate` v1.0.7 - Animation utilities

**Files Created**:
- `/components/ui/button.tsx` - Button component with variants
- `/components/ui/card.tsx` - Card component (Header, Content, Footer, Title, Description)
- `/components/ui/input.tsx` - Form input component
- `/components/ui/label.tsx` - Form label component
- `/components/ui/badge.tsx` - Badge component for status indicators
- `/components/ui/alert.tsx` - Alert component for messages
- `/lib/utils.ts` - `cn()` utility function for merging classes
- `/app/test-components/page.tsx` - Component showcase page
- `components.json` - shadcn configuration file

**Files Modified**:
- `/app/globals.css` - Added shadcn CSS variables with Wimbledon color customization
- `/package.json` - Added component library dependencies

**Technical Details**:
- Uses OKLCH color format (more modern than HSL)
- All components automatically use Wimbledon purple for primary actions
- CSS variables system allows global theme changes
- Components are just TypeScript files - fully customizable
- No CSS-in-JS or runtime overhead
- Works seamlessly with existing Tailwind utilities

**Usage Example**:
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Button>Primary Action</Button>  // Uses Wimbledon purple
<Button variant="secondary">Secondary</Button>  // Uses Wimbledon green
```

**Future Migration Strategy**:
- Phase 1: Login/Register pages (simple forms)
- Phase 2: Dashboard (many cards)
- Phase 3: Picks page (complex layouts)

### Variable-Size Tournament Support (Feb 15, 2026)
**Feature**: Make the system support tournaments of any size, not just 128-player Grand Slams
**Motivation**: Need to support smaller events like ATP 500 (32 players, 5 rounds) alongside Grand Slams

**Problem**: System had hardcoded assumptions for 7-round, 128-player Grand Slam format in 6 files:
- `ROUND_CONFIGS` constant locked to 7 rounds
- Scoring tiebreaker hardcoded `roundNumber === 7` for final round detection
- Tournament unique constraint `[year, gender]` blocked multiple tournaments per year
- Validation schemas capped picks at 4 and seeds at 128

**Implementation**:
- **Prisma Schema**: Added `TournamentLevel` enum (`GRAND_SLAM`, `ATP_1000`, `ATP_500`, `ATP_250`, `WTA_1000`, `WTA_500`, `WTA_250`), added `level` field to Tournament model, changed unique constraint to `[year, gender, level]`
- **Round Presets**: Replaced single `ROUND_CONFIGS` with `ROUND_PRESETS` map keyed by tournament level:
  - Grand Slam: 7 rounds, picks 4/3/2/2/1/1/1 (unchanged)
  - ATP 1000: 7 rounds, picks 3/2/2/1/1/1/1
  - ATP 500 / ATP 250: 5 rounds, picks 2/2/1/1/1
  - WTA 1000: 6 rounds, picks 3/2/1/1/1/1
  - WTA 500 / WTA 250: 5 rounds, picks 2/2/1/1/1
- **Scoring**: Dynamic final round detection — queries max `roundNumber` per tournament instead of assuming 7
- **Tournament Service**: `createTournament()` accepts `level` parameter, looks up correct preset
- **Validation**: Relaxed pick max (4→16) and seed max (128→256); added `level` to tournament creation schema
- **API**: Admin tournament creation endpoint passes `level` through
- **Migration**: Applied `20260215000000_add_tournament_level` to production Neon DB

**Files Modified**:
- `prisma/schema.prisma` — Added `TournamentLevel` enum and `level` field
- `lib/constants.ts` — `ROUND_PRESETS` map with `RoundConfig` type
- `lib/services/tournament.ts` — `level` parameter in `createTournament()`
- `lib/services/scoring.ts` — Dynamic `finalRoundNumber` in scoring and rankings
- `lib/validation/schemas.ts` — Relaxed limits, added `level` field
- `app/api/admin/tournaments/route.ts` — Passes `level` to service
- `prisma/seed.ts` — Updated composite keys and imports

**No UI changes needed** — pages already read round config from database dynamically.

## Technical Decisions

### Tournament Level System
**Decision**: Use a `TournamentLevel` enum rather than a generic draw size
**Rationale**: ATP 500 and ATP 250 both have 32-player draws but are distinct tournament categories. The level captures the tournament's identity, not just its size. Pick presets can differ per level even when draw sizes match.

### Round Presets vs Custom Configuration
**Decision**: Use presets keyed by tournament level, not fully custom per-tournament round configs
**Rationale**: Presets provide sensible defaults with zero admin effort. Pick counts per round are a game balance decision that should be consistent across tournaments of the same level. Values are easy to adjust in the constants file.

### Tournament Operations Admin UI (Feb 15, 2026)
**Feature**: Full admin UI for running tournaments end-to-end (create → players → matches → activate → enter results)
**Motivation**: Backend had working APIs but no admin interface — needed operational tooling to run a Doha ATP 500 test tournament

**Architecture**:
- Server components for pages (auth + data fetching), following the dashboard pattern
- Client components for forms (extracted to `components/admin/`), following the login page pattern
- Client-side `fetch()` to existing API routes for form submissions (not server actions)
- No new shadcn components — plain HTML `<select>` for dropdowns
- Admin layout with auth guard, nav, and grass court background

**New API Routes (4 files)**:
- `app/api/admin/tournaments/[id]/route.ts` — GET tournament detail with rounds and players
- `app/api/admin/tournaments/[id]/status/route.ts` — PUT status transitions (UPCOMING→ACTIVE→COMPLETED)
- `app/api/admin/tournaments/[id]/matches/route.ts` — GET pending matches, POST CSV to create matches (resolves player names to IDs, round numbers to round IDs)
- `app/api/admin/rounds/[id]/lock-time/route.ts` — PUT lock time update per round

**Admin Pages (5 files)**:
- `app/admin/layout.tsx` — Auth guard (redirects non-admin to `/dashboard`), grass court background, purple "MATCH POINT ADMIN" header, nav links
- `app/admin/page.tsx` — Dashboard with tournament cards (status badges, player/league counts) + create tournament form
- `app/admin/tournaments/[id]/page.tsx` — Tournament detail with info card, status controls, round lock time editors, links to players/matches sub-pages
- `app/admin/tournaments/[id]/players/page.tsx` — Player list table (name, seed, country) + CSV upload form
- `app/admin/tournaments/[id]/matches/page.tsx` — Matches grouped by round (pending + completed) + CSV upload form
- `app/admin/results/page.tsx` — Result entry page (most-used page during live tournament)

**Client Components (6 files in `components/admin/`)**:
- `create-tournament-form.tsx` — Name, year, gender, level form → POST `/api/admin/tournaments`
- `status-controls.tsx` — UPCOMING→ACTIVE→COMPLETED buttons → PUT `.../status`
- `lock-time-editor.tsx` — Inline datetime editor per round → PUT `.../lock-time`
- `player-upload-form.tsx` — CSV textarea → POST `.../players`
- `match-upload-form.tsx` — CSV textarea → POST `.../matches`
- `result-entry-panel.tsx` — Tournament selector + pending match list + large winner buttons per match + walkover/retirement toggles. Matches disappear from list on successful result entry (client-side state update). Includes `matchId` in request body to satisfy `enterResultSchema` Zod validation quirk.

**Key Design Decisions**:
- Result entry panel uses client-side state removal (no full page refresh) for fast workflow during live tournaments
- Match CSV upload resolves player names case-insensitively and maps round numbers to round IDs server-side
- `parseMatchesCSV` utility (previously built but unwired) is now connected via the matches POST endpoint
- Status controls enforce linear progression: UPCOMING → ACTIVE → COMPLETED (no backward transitions)

**Verification**: `npm run build` passes with zero TypeScript errors, all routes visible in build output.

### Admin UI Deploy to Production (Feb 21, 2026)
**Task**: Deploy the completed admin UI to production
**Work Done**:
- **ABOUTME compliance**: Added 2-line `// ABOUTME:` comment headers to all 22 new/modified files per project convention (admin pages, admin components, API routes, services, validation schemas, seed file) using `sed` batch prepend
- **Build verification**: `npm run build` passed with zero TypeScript errors; all 12 admin API routes visible in build output
- **End-to-end verification** via dev server:
  - Login as admin@matchpoint.com → admin dashboard loads correctly
  - Created ATP 500 tournament → 5 rounds auto-created with correct pick presets
  - Uploaded 8 players via CSV → player list updated
  - Uploaded 4 matches via CSV → matches grouped by round
  - Transitioned status UPCOMING → ACTIVE
  - Entered match result → match disappeared client-side (no full reload)
  - Scoring cron returns 401 (expected — requires CRON_SECRET header)
- **PR #1**: Opened and merged `feature/shadcn-ui-integration` → `main` (38 files, 2617 insertions)
- **Production migration**: Ran `prisma migrate deploy` against Neon — confirmed `add_tournament_level` migration already applied; no pending migrations
- **Vercel deployment**: Triggered automatically by main branch merge

**Key Fix**: Edit tool requires the target file to be Read in the **same response turn** before editing; batch file updates were done via `sed -i '' '1s/^/...\n/'` after this limitation was discovered.

### Tailwind v4 CSS Variable Fixes (Feb 22, 2026)
**Task**: Fix two silent bugs discovered during web app review that broke shadcn/ui and Wimbledon custom colors in production.

**Bug 1 — shadcn/ui CSS variables stripped by Tailwind v4**:
- **Symptom**: All shadcn card/component backgrounds were transparent; text was near-invisible
- **Root Cause**: Tailwind v4 silently drops bare `:root` and `.dark` blocks that appear outside a `@layer` directive. The CSS variable declarations never reached the browser.
- **Fix**: Wrapped the entire `:root { ... }` and `.dark { ... }` blocks inside `@layer base { ... }` in `app/globals.css`
- **Verification**: `preview_inspect` on `.bg-card` changed from `background-color: rgba(0,0,0,0)` → `lab(100 0 0)` (white)

**Bug 2 — Wimbledon custom colors not loading**:
- **Symptom**: `bg-wimbledon-purple`, `bg-wimbledon-green`, and all other custom classes generated no CSS output
- **Root Cause**: Tailwind v4 no longer auto-discovers `tailwind.config.ts`. The file was present but never loaded.
- **Fix**: Added `@config "../tailwind.config.ts"` to `app/globals.css` immediately after `@import "tailwindcss"`
- **Verification**: `preview_inspect` on admin nav buttons showed `background-color: rgb(46, 26, 71)` (#2E1A47 Wimbledon purple)

**Files Modified**:
- `app/globals.css` — two-line fix (added `@config` directive + wrapped variables in `@layer base`)

**Deployment**:
- Committed as `dae9306` on branch `fix/css-variable-fixes`
- PR #2 opened and merged into `main` (commit `c11d52b`)
- Vercel auto-deployed

### Phase 1: Indian Wells Prep (Mar 1, 2026)
**Goal**: Prepare the app for a full end-to-end test during the Indian Wells BNP Paribas Open (ATP 1000 + WTA 1000) with 2-5 test users.

#### Task 1: Scoring Edge Case Verification (TDD)
**Work Done**:
- Set up Vitest test framework (no test framework existed previously)
- Extracted pure scoring logic into `lib/services/pick-evaluation.ts` (no database dependency) for testability
- **Found real bug**: match lookup in `scoring.ts` didn't filter by `roundId` — if a player appeared in multiple rounds, scoring would evaluate against the wrong match. Fixed by adding `m.roundId === pick.roundId` to match finding logic.
- Wrote 20 tests covering: normal wins/losses, walkovers (bonus point), retirements (opponent gets credit), bye players (silent skip, no strike), partial results, multi-round scoring, final round tracking
- Updated `scoring.ts` to delegate to the new `evaluatePicks()` function

**Files Created**:
- `vitest.config.ts` — Test framework config with path aliases
- `lib/services/pick-evaluation.ts` — Pure scoring logic (evaluatePicks function)
- `lib/services/scoring.test.ts` — 20 scoring tests

**Files Modified**:
- `package.json` — Added vitest devDependency, test/test:watch scripts
- `lib/services/scoring.ts` — Uses evaluatePicks() from pick-evaluation.ts

#### Task 2: Result Correction Capability
**Work Done**:
- Verified existing API already supports updating results (uses `db.match.update`)
- Added `getCompletedMatches()` to the matches API GET response
- Rewrote `result-entry-panel.tsx` with:
  - Confirmation dialogs before entering/correcting results
  - Collapsible "Completed Matches" section showing matches with results
  - "Correct" button on each completed match to re-enter results
  - Matches move between pending/completed sections in-place (no page reload)

**Files Modified**:
- `app/api/admin/tournaments/[id]/matches/route.ts` — GET returns `completedMatches`, POST auto-assigns bracketPosition
- `components/admin/result-entry-panel.tsx` — Rewritten with correction capability

#### Task 3: Auto-Generate Bracket Matches
**Motivation**: Manually creating 7 CSV files during a live tournament is error-prone. Auto-generation reduces this to 2 uploads (ATP 1000: R1 + R2 due to byes) or 1 upload (WTA 1000: R1 only).

**Work Done**:
- Added `bracketPosition Int?` to Match model with `@@unique([roundId, bracketPosition])` constraint
- Created migration SQL manually (no local DATABASE_URL)
- Updated CSV parser to support optional 4th column for bracket position
- Created pure function `pairWinnersForNextRound()` that sorts completed matches by bracket position and pairs consecutive winners
- Created `generateNextRoundMatches()` service function that validates round state, generates pairings, and creates matches in the next round
- Created API endpoint `POST /api/admin/tournaments/[id]/rounds/[roundId]/generate`
- Created `GenerateRoundButton` client component with confirmation dialog
- Integrated button into matches page — appears next to completed round headers when eligible (all matches done, next round exists and is empty)
- 7 bracket tests all passing

**Files Created**:
- `prisma/migrations/20260301000000_add_bracket_position/migration.sql`
- `lib/services/bracket.ts` — Pure bracket pairing function
- `lib/services/bracket.test.ts` — 7 bracket tests
- `app/api/admin/tournaments/[id]/rounds/[roundId]/generate/route.ts`
- `components/admin/generate-round-button.tsx`

**Files Modified**:
- `prisma/schema.prisma` — Added bracketPosition field + unique constraint
- `lib/utils/csv.ts` — Optional 4th column support
- `lib/services/tournament.ts` — addMatch() accepts bracketPosition, added generateNextRoundMatches()
- `app/admin/tournaments/[id]/matches/page.tsx` — Generation eligibility logic + button

**Bracket Workflow**:
- ATP 1000: Upload R1 CSV + R2 CSV (32 seeds have byes), R3-R7 auto-generate (5 rounds saved)
- WTA 1000: Upload R1 CSV, R2-R6 auto-generate (5 rounds saved)

#### Deployment (Mar 1, 2026)
- Initialized git repo in project directory (was not a git repo previously)
- Connected to existing GitHub remote `LayupLines/match-point`
- Removed `.env.production` from tracking (contained real secrets — DATABASE_URL, NEXTAUTH_SECRET, OIDC token)
- Added all Prisma migrations to version control (were never committed)
- Moved docs to `Context Files/` directory
- Ran `prisma migrate deploy` on Neon production DB — migration `20260301000000_add_bracket_position` applied
- Pushed to GitHub, Vercel auto-deployed (build succeeded in 37s)
- **Fixed pre-existing auth bug**: Vercel had `NEXTAUTH_SECRET` but NextAuth v5 beta expects `AUTH_SECRET`. Added correct env var and redeployed.

**Smoke Test Results**:
- ✅ Login working (admin@matchpoint.com)
- ✅ Tournaments API returns data
- ✅ Matches API returns both `matches` and `completedMatches` keys
- ✅ `bracketPosition` field present (null for existing matches)
- ✅ Admin matches page renders Pending + Completed sections
- ✅ All new routes visible in build output including `/generate` endpoint
- ✅ 27 tests passing (20 scoring + 7 bracket)
- ✅ TypeScript clean (`tsc --noEmit` zero errors)

### Phase 2: Polish for Test Users (Mar 1, 2026)
**Goal**: Improve the picks experience before inviting 2-5 test users for Indian Wells.

#### Player Search/Filter
**Problem**: ATP 1000 has 96 players — finding a specific player means scrolling through a 4-column grid.

**Work Done**:
- Extracted the inline player grid from the picks page server component into a `PlayerGrid` client component
- Added search input that filters by player name or country (case-insensitive)
- Shows "Showing X of Y players" when filtering, with a clear button
- Empty state with "No players match" message and clear link

**Files Created**:
- `components/player-grid.tsx` — Client component with search, player cards, and form submissions

**Files Modified**:
- `app/league/[id]/picks/page.tsx` — Replaced ~100 lines of inline grid with `<PlayerGrid>` component

#### Pick Save Feedback
**Problem**: After clicking Select/Remove, the page silently reloads with no confirmation.

**Work Done**:
- Added `feedback=added` or `feedback=removed` query param to the API redirect URL
- `PlayerGrid` reads the feedback param and shows a green/gray banner at top
- Banner auto-dismisses after 3 seconds via `useEffect` + `setTimeout`

**Files Modified**:
- `app/api/picks/route.ts` — Added feedback param to redirect URL
- `components/player-grid.tsx` — Feedback banner display and auto-dismiss

#### Countdown Timers
**Problem**: Lock times shown as raw dates ("Mar 10, 2026") with no urgency signal.

**Work Done**:
- Created reusable `CountdownTimer` client component
- Displays: "2d 5h remaining" (>24h), "3h 12m remaining" (<24h, orange), "45m remaining" (<1h, red+pulse), "Locked" (past)
- Updates every 60 seconds via `setInterval`
- Integrated into picks page header and league page round cards

**Files Created**:
- `components/countdown-timer.tsx` — Reusable countdown client component

**Files Modified**:
- `app/league/[id]/picks/page.tsx` — Replaced static lock date with `<CountdownTimer>` in header
- `app/league/[id]/page.tsx` — Replaced static lock time with `<CountdownTimer>` in round cards

#### Deployment (Mar 1, 2026)
- No database migration needed (UI-only changes)
- Pushed to GitHub, Vercel auto-deployed (build succeeded in 36s)
- 27 tests passing, TypeScript clean

### Phase 3: Results & Mobile Polish (Mar 1, 2026)
**Goal**: Show per-pick results after rounds lock, make locked rounds browsable, improve mobile UX.

#### Per-Pick Results (classifyPick + evaluatePicksDetailed)
**Problem**: Locked picks view just showed player names with a 🎾 emoji — no indication of win/loss/pending.

**Work Done**:
- Added `classifyPick()` function to `pick-evaluation.ts` — classifies a single pick as win/loss/pending with a reason string (Won match, Won by walkover, Opponent retired, Lost match, Retired from match, Lost by walkover, Awaiting result)
- Added `evaluatePicksDetailed()` — maps `classifyPick` over all picks, returns `PickOutcome[]`
- TDD: 12 new tests covering all outcome types
- Updated picks page server component to query matches when round is locked and compute outcomes
- Replaced plain locked picks view with color-coded result cards:
  - Green border + ✅ for wins, with "Correct Pick" badge and reason
  - Red border + ❌ for losses, with "Strike" badge and reason
  - Gray border + ⏳ for pending, with "Pending" badge
- Summary bar shows total correct/strikes when all results are in

**Files Modified**:
- `lib/services/pick-evaluation.ts` — Added `PickOutcome` type, `classifyPick()`, `evaluatePicksDetailed()`
- `lib/services/scoring.test.ts` — 12 new tests (39 total)
- `app/league/[id]/picks/page.tsx` — Match query, outcome computation, result cards UI

#### Clickable Locked Rounds
**Problem**: Locked rounds on league page showed a static "🔒 Locked" div — no way to view past picks.

**Work Done**:
- Replaced static locked div with a `<Link>` to the picks page: "📊 View Results"
- Hover effect transitions to purple theme color

**Files Modified**:
- `app/league/[id]/page.tsx` — Locked round button → View Results link

#### Mobile Improvements
**Problem**: Hero text overflows on small screens, standings table too wide, player buttons too small for touch.

**Work Done**:
- Hero title: `text-6xl` → `text-4xl sm:text-5xl md:text-6xl`
- Hero subtitle: `text-2xl` → `text-xl sm:text-2xl`
- Feature cards grid: `md:grid-cols-3` → `sm:grid-cols-2 md:grid-cols-3`
- Standings "Correct" column: hidden on mobile (`hidden sm:table-cell`)
- Player grid buttons: `py-2.5` → `py-3` for larger touch targets

**Files Modified**:
- `app/page.tsx` — Responsive text sizes and grid breakpoint
- `app/league/[id]/page.tsx` — Hidden Correct column on mobile
- `components/player-grid.tsx` — Larger touch targets

#### Deployment (Mar 1, 2026)
- No database migration needed
- 39 tests passing, TypeScript clean
- Pushed to GitHub, Vercel auto-deployed

### Code Review & Fixes (Mar 1, 2026)
**Goal**: Comprehensive review of all Phase 1–3 changes before inviting test users.

#### Critical Fix: Pick API Form Path Validation
**Problem**: The form-based pick add/remove path (`POST /api/picks` with form data) had no server-side validation — no lock-time check, no membership check, no elimination check, no player reuse check, no pick count limit. A user could submit picks after lock, reuse players, or exceed limits.

**Work Done**:
- Added lock-time check (redirects with `feedback=locked` if round is past lock time)
- Added league membership verification
- Added elimination status check
- Added player tournament membership validation (on add)
- Added player reuse check across prior rounds (on add)
- Added pick count limit check against `round.requiredPicks` (on add)

**Files Modified**:
- `app/api/picks/route.ts` — Full validation chain before pick create/delete

#### Medium Fix: Walkover Bonus Consistency
**Problem**: `evaluatePicks()` awarded 2 correct picks for a walkover win (1 normal + 1 bonus), but `classifyPick()` returned a single "win" status. The UI result cards would show 1 correct pick while standings reflected 2.

**Work Done**:
- Added `bonus: boolean` field to `PickOutcome` type
- `classifyPick()` now returns `bonus: true` for walkover wins
- UI result badge shows "Correct Pick +1 Bonus" for walkover wins
- Updated tests to verify bonus field

**Files Modified**:
- `lib/services/pick-evaluation.ts` — `bonus` field on `PickOutcome`
- `lib/services/scoring.test.ts` — Updated tests for bonus field
- `app/league/[id]/picks/page.tsx` — Bonus display in result badge

#### Minor Fixes
- **Countdown timer dead branch**: `hours < 1` was unreachable when `hours > 0`. Changed to `hours < 2` so urgent (red+pulse) state triggers at <2 hours.
- **Division by zero**: Progress bar guarded against `requiredPicks === 0`.
- **Dead import**: Removed unused `redirect` import from picks API route.
- **Admin auth**: Verified admin layout already enforces ADMIN role on all `/admin/*` pages — no additional check needed.

**Files Modified**:
- `components/countdown-timer.tsx` — Fixed urgency threshold
- `app/league/[id]/picks/page.tsx` — Division by zero guard
- `app/api/picks/route.ts` — Removed dead import

### Second Code Review & Fixes (Mar 1, 2026)
**Goal**: Address remaining findings from the second comprehensive review of all Phase 1–3 changes.

#### Fix: Dead Branch in evaluatePicks
**Problem**: The loss branch in `evaluatePicks()` had an unreachable `else if (match.retiredPlayerId)` path. If the picked player lost (`didPlayerWin === false`) and didn't retire themselves, the `retiredPlayerId` being set would mean the winner retired — a contradiction. This dead branch awarded a `correctPick` for impossible data.

**Work Done**:
- Simplified loss branch to unconditionally increment `strikes` — if the player didn't win, it's always a strike regardless of retirement/walkover details
- `classifyPick()` retains full granularity for the UI (distinguishing "Retired from match", "Lost by walkover", "Lost match")
- All existing tests pass unchanged — the dead branch was never exercised by valid test data

**Files Modified**:
- `lib/services/pick-evaluation.ts` — Simplified loss handling in `evaluatePicks()`

#### Fix: Action Validation in Pick Form Handler
**Problem**: If the form `action` field was neither `'add'` nor `'remove'`, the code fell through silently and returned a redirect with misleading `feedback=undefined`.

**Work Done**:
- Added early validation after field extraction: returns 400 `"Invalid action"` for anything other than `'add'` or `'remove'`

**Files Modified**:
- `app/api/picks/route.ts` — Action validation before DB operations

#### Fix: Race Condition & Duplicate Pick Handling
**Problem (TOCTOU)**: The pick count check (`db.pick.count`) and pick creation (`db.pick.create`) were separate queries. Two concurrent requests could both pass the count check and exceed `requiredPicks`.

**Problem (Duplicate)**: The `@@unique([userId, leagueId, roundId, playerId])` constraint would throw a Prisma `P2002` error on duplicate picks, surfacing as a cryptic 500 to the user.

**Work Done**:
- Wrapped count check + create inside `db.$transaction()` for atomic execution
- Added `try/catch` around the transaction to handle:
  - `P2002` unique constraint violations → 400 `"Player already selected for this round"`
  - Max picks exceeded → 400 `"Maximum picks reached"`
  - Other errors → re-thrown to outer handler

**Files Modified**:
- `app/api/picks/route.ts` — Transaction for atomicity, P2002 error handling

#### Fix: Walkover Bonus in Summary Count
**Problem**: The summary pill showed `pickOutcomes.filter(o => o.status === 'win').length` as "correct" count, but didn't include walkover bonuses. The standings engine counts walkovers as +2 (1 normal + 1 bonus), so the summary was inconsistent.

**Work Done**:
- Summary now computes `correctTotal = wins + bonuses` to match the standings engine
- Displays "3 correct (incl. 1 bonus)" when walkover bonuses are present
- Uses an IIFE in JSX for intermediate variable computation

**Files Modified**:
- `app/league/[id]/picks/page.tsx` — Summary pill calculates wins + bonuses

#### Fix: Countdown Timer Edge Case
**Problem**: When less than 60 seconds remained, `Math.floor(diff / 60000)` produced 0, displaying "0m remaining".

**Work Done**:
- Shows `"< 1m remaining"` when minutes is 0 but the timer hasn't crossed to "Locked"

**Files Modified**:
- `components/countdown-timer.tsx` — Edge case for sub-minute display

#### Noted for Future (Not Fixed)
- `round.requiredPicks` fetched outside pick transaction (safe — static config value)
- "Player already used in a prior round" check outside transaction (low risk with <5 concurrent users)
- 60-second timer interval means "< 1m remaining" could display for up to ~2 min before "Locked"
- Redundant retirement win test in scoring.test.ts (harmless duplicate)
- `toLocaleString()` server-side timezone (acceptable for same-timezone test users)
- `session.user.id!` non-null assertions (functional with current auth)
- Sequential DB queries on picks page (premature to optimize)
- `img` tags instead of `next/image` (no perf concern at current scale)
- Standings rank ties (acceptable for test phase)

## Current Status
- ✅ App deployed and accessible at https://match-point-delta.vercel.app
- ✅ Database seeded with test data
- ✅ Authentication working (AUTH_SECRET env var fixed)
- ✅ User registration enabled (any user can create an account at /register)
- ✅ Modern UI with animations and responsive design
- ✅ Grass court background texture on all pages
- ✅ Country flag graphics on player selection (40+ country flags)
- ✅ shadcn/ui component library integrated with Wimbledon theme (CSS variables fixed)
- ✅ Variable-size tournament support (Grand Slam, ATP/WTA 1000/500/250)
- ✅ Tournament operations admin UI (create, manage players/matches, enter results)
- ✅ Scoring engine bug fixed (multi-round match lookup) with 20 tests
- ✅ Result correction capability for admin
- ✅ Auto-bracket generation (reduces manual CSV work from 7 to 1-2 per tournament)
- ✅ Player search/filter on picks page
- ✅ Pick save feedback banners (auto-dismiss)
- ✅ Live countdown timers on picks and league pages
- ✅ Per-pick result cards with win/loss/pending status, explanations, and walkover bonus
- ✅ Clickable locked rounds ("View Results" link)
- ✅ Future round locking — only current round open for picks; future rounds show "Not Yet Open"
- ✅ Mobile-responsive hero text, hidden Correct column, larger touch targets
- ✅ Pick API fully validated (lock time, membership, elimination, player reuse, pick limits, future round rejection)
- ✅ Pick API race condition fixed (atomic transaction for count+create)
- ✅ Duplicate pick handling (P2002 → friendly 400 instead of 500)
- ✅ Walkover bonus correctly reflected in both result cards and summary counts
- ✅ Countdown timer urgency thresholds corrected (<2h = urgent) and sub-minute edge case fixed
- ✅ Vitest test framework with 39 passing tests
- ✅ Indian Wells 2026 ATP + WTA tournaments created, configured, and activated with real draw data
- ✅ Two test leagues created and ready for users
- ✅ All code deployed and smoke-tested on production
- ✅ Two full code reviews completed — all critical, medium, and low issues resolved
- ✅ QUICKSTART.md and README.md updated to reflect current project state

### Documentation Update (Mar 1, 2026)
**Goal**: Bring QUICKSTART.md and README.md up to date with all Phase 1–3 changes.

**QUICKSTART.md** — was heavily outdated (wrong project path, missing features, old env var names):
- Fixed project path (was `/Users/jeremyceille/Desktop/match-point/`)
- Added production URL and GitHub link
- Updated env var from `NEXTAUTH_SECRET` to `AUTH_SECRET` (NextAuth v5)
- Expanded admin capabilities (auto-bracket, result correction, tournament levels)
- Added test commands (`npm test`, `npx tsc --noEmit`)
- Updated project structure to match current codebase
- Improved troubleshooting (Tailwind v4 `@config` requirement)

**README.md** — was written for the initial build and missing most features:
- Updated title from "Wimbledon Survivor" to "Tennis Survivor Game" (multi-tournament support)
- Added full feature lists (player search, countdown timers, per-pick results, walkover bonus)
- Updated tech stack (shadcn/ui, Vitest, Prisma 7, OKLCH colors)
- Added round structure table for all tournament levels
- Added scoring rules table with all scenarios including walkover bonus
- Comprehensive project structure reflecting all current files
- Full admin guide with tournament lifecycle, CSV formats, auto-bracket workflow
- Complete API endpoint tables including all admin routes
- Database schema section with key constraints
- Testing section with coverage details and strategy
- Updated deployment and troubleshooting sections

**Files Modified**:
- `QUICKSTART.md` — Full rewrite
- `README.md` — Full rewrite

### Indian Wells 2026 Tournament Setup (Mar 2, 2026)
**Goal**: Full end-to-end setup for the 2026 BNP Paribas Open (Indian Wells) — both ATP 1000 and WTA 1000 draws.

#### Code Changes
- **WTA_1000 preset**: Updated from 6 rounds to 7 rounds in `lib/constants.ts` to support Indian Wells/Miami/Beijing 96-player draws (32 byes, same structure as ATP 1000)
- **Country code mappings**: Added 25 new codes to `lib/utils/country.ts`: FRA, ARG, NED, MON, POR, GBR, HUN, CAN, AUS, BRA, BEL, CRO, BIH, CHI, UKR, SUI, JPN, DEN, ROU, COL, TUR, INA, LAT, PHI, AUT
- **Flag SVGs**: Created 25 new flag files in `public/flags/` for all new country codes

#### Tournament Creation & Configuration
- Created **ATP BNP Paribas Open** (MEN, ATP_1000, 2026) — 7 rounds, 96 players, 32 R1 matches
- Created **WTA BNP Paribas Open** (WOMEN, WTA_1000, 2026) — 7 rounds, 96 players, 32 R1 matches
- Set lock times for all 14 rounds (R1: Mar 4 18:00 UTC through Final: Mar 15 20:00 UTC)
- Lock times account for DST transition on March 9 (PST→PDT)

#### Data Uploads
- **ATP players**: 96 players (32 seeds + 52 named unseeded + 12 qualifiers) from atptour.com draw
- **WTA players**: 96 players (32 seeds + 27 named unseeded + 37 qualifier placeholders) — partial draw
- **ATP R1 matches**: 32 matches with bracket positions 1-32
- **WTA R1 matches**: 32 matches with bracket positions 1-32

#### Leagues & Activation
- Created "Indian Wells ATP League" and "Indian Wells WTA League"
- Activated both tournaments (UPCOMING → ACTIVE)

#### Key IDs
- ATP tournament: `cmma1wmsw00008uujj5u77alz`
- WTA tournament: `cmma1xsji00088uuju4lwwiv9`
- ATP league: `cmma2nhuq007k8uuj374nwwaf`
- WTA league: `cmma2ni41007n8uujreoy7dfw`

**Deployment**: Committed and pushed to GitHub (commit `954e383`), Vercel auto-deployed.

### Future Round Locking (Mar 2, 2026)
**Goal**: Only allow picks for the current round — future rounds should appear locked.

**Problem**: All unlocked rounds showed "Make Picks" buttons, letting users navigate to and potentially submit picks for any future round.

**Implementation**:
- **League page** (`app/league/[id]/page.tsx`): Computes `currentRoundIndex` (first unlocked round). Future rounds show grayed-out "Not Yet Open" label with lock icon, reduced opacity, no pulse dot. Current round uses green color scheme; "Closing Soon" text stays orange.
- **Picks page** (`app/league/[id]/picks/page.tsx`): Fetches all tournament rounds to determine if the requested round is the current one. Future rounds show a "Not Yet Open" block with a "Back to League" link instead of the player grid.
- **Picks API** (`app/api/picks/route.ts`): Server-side guard queries all tournament rounds, identifies the current round, and rejects submissions to future rounds with a redirect (`feedback=not-open`).

**Definition**: "Current round" = the round with the lowest `roundNumber` where `lockTime > now`.

**Files Modified**:
- `app/league/[id]/page.tsx` — Three round states: locked (View Results), current (Make Picks), future (Not Yet Open)
- `app/league/[id]/picks/page.tsx` — Future round detection + block UI
- `app/api/picks/route.ts` — Server-side future round rejection

**Deployment**: Committed and pushed to GitHub (commit `92aa57e`), Vercel auto-deployed. TypeScript clean, 39 tests passing.

## Next Steps
- Update WTA qualifier placeholders with real player names once full draw is published
- R2 match setup after R1 completes (Mar 4-5): create R2 CSVs pairing seeds with R1 winners, then auto-bracket from R3 onward
- Share league join links with 2-5 test users
- Enter match results via admin as tournament progresses
