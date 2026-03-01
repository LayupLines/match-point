# Deployment Checklist — Indian Wells Prep

> Changes from Phase 1 work: scoring fixes, result correction, auto-bracket generation.

---

## Pre-Deploy Verification (local)

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx vitest run` — 27 tests pass (20 scoring + 7 bracket)

---

## Database Migration

One migration needs to run on Neon production:

**Migration:** `prisma/migrations/20260301000000_add_bracket_position/migration.sql`

```sql
ALTER TABLE "Match" ADD COLUMN "bracketPosition" INTEGER;
CREATE UNIQUE INDEX "Match_roundId_bracketPosition_key" ON "Match"("roundId", "bracketPosition");
```

**To apply:**
```bash
DATABASE_URL="<neon-connection-string>" npx prisma migrate deploy
```

This is additive (new nullable column + new index) — safe to run with the app live. No existing data is affected.

---

## Files Changed

### New files
| File | Purpose |
|------|---------|
| `lib/services/pick-evaluation.ts` | Pure scoring logic extracted from scoring.ts (bug fix: round-aware match lookup) |
| `lib/services/scoring.test.ts` | 20 tests covering scoring edge cases |
| `lib/services/bracket.ts` | Pure bracket pairing function |
| `lib/services/bracket.test.ts` | 7 tests for bracket pairing |
| `vitest.config.ts` | Test framework configuration |
| `prisma/migrations/20260301000000_add_bracket_position/migration.sql` | Schema migration |
| `app/api/admin/tournaments/[id]/rounds/[roundId]/generate/route.ts` | API endpoint for auto-generating next round matches |
| `components/admin/generate-round-button.tsx` | UI button to trigger bracket generation |

### Modified files
| File | What changed |
|------|--------------|
| `package.json` | Added vitest devDependency + test/test:watch scripts |
| `prisma/schema.prisma` | Added `bracketPosition Int?` + unique constraint on Match |
| `lib/services/scoring.ts` | Now delegates to `evaluatePicks()` from pick-evaluation.ts |
| `lib/services/tournament.ts` | `addMatch()` accepts bracketPosition; added `generateNextRoundMatches()` |
| `lib/utils/csv.ts` | Match CSV supports optional 4th column (bracketPosition) |
| `app/api/admin/tournaments/[id]/matches/route.ts` | GET returns completedMatches; POST auto-assigns bracketPosition |
| `components/admin/result-entry-panel.tsx` | Added completed matches section, correction capability, confirmation dialogs |
| `app/admin/tournaments/[id]/matches/page.tsx` | Shows "Generate [Next Round]" button on eligible completed rounds |

---

## Deploy to Vercel

- [ ] Push all files to the repo
- [ ] Vercel auto-deploys (or trigger manual deploy)
- [ ] Build succeeds (DATABASE_URL is set in Vercel env vars)

---

## Post-Deploy Verification

### Scoring fix
- [ ] The scoring cron (`/api/cron/scoring`, runs daily at 3am) will use the fixed round-aware match lookup
- [ ] No action needed — fix is automatic

### Result correction
- [ ] Navigate to admin tournament detail → Enter Results panel
- [ ] Enter a result for any match → confirm dialog appears
- [ ] After entering, match moves to "Completed Matches" section
- [ ] Click "Correct" on a completed match → can re-enter the result

### Auto-bracket generation
- [ ] Upload a match CSV with bracket positions (4th column): `roundNumber,player1,player2,bracketPosition`
- [ ] Enter results for all matches in a round
- [ ] Green "Generate [Next Round Name]" button appears next to the completed round header
- [ ] Click it → confirmation dialog → next round matches are created
- [ ] Verify matches page shows the newly created matches as pending

---

## Indian Wells Setup (after deploy)

### Create tournaments
- [ ] Admin → Create Tournament: "BNP Paribas Open" / 2026 / MEN / ATP_1000
- [ ] Admin → Create Tournament: "BNP Paribas Open" / 2026 / WOMEN / WTA_1000
- [ ] Set lock times per round to match actual tournament schedule

### Prepare data (once draws are published)
- [ ] ATP 1000 Men: Upload players CSV, R1 match CSV (with bracket positions), R2 match CSV
- [ ] WTA 1000 Women: Upload players CSV, R1 match CSV (with bracket positions)
- [ ] R3 onward: use auto-generate after entering results

### Test leagues
- [ ] Create 1-2 test leagues for each tournament
- [ ] Share invite links with test users (2-5 people)

---

## CSV Format Reference

**Players:** `name,seed,country`
```
Jannik Sinner,1,ITA
Carlos Alcaraz,2,ESP
```

**Matches (with bracket position):** `roundNumber,player1Name,player2Name,bracketPosition`
```
1,Qualifier 1,Qualifier 2,1
1,Qualifier 3,Qualifier 4,2
```

If bracketPosition is omitted, it auto-assigns sequentially (1, 2, 3, ...) within the round.

---

## Known Limitations

- **ATP 1000 R1→R2 transition:** 32 seeds have byes (no R1 match), so R2 must be uploaded manually via CSV. Auto-generation works from R2 onward.
- **WTA 1000:** No byes, auto-generation works from R1 onward.
- **No local DATABASE_URL:** `npm run build` fails locally (Prisma needs DB). TypeScript check (`tsc --noEmit`) works. Build succeeds on Vercel where env vars are configured.
