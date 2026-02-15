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

## Current Status
- ✅ App deployed and accessible at https://match-point-delta.vercel.app
- ✅ Database seeded with test data
- ✅ Authentication working
- ✅ Modern UI with animations and responsive design
- ✅ Grass court background texture on all pages
- ✅ Country flag graphics on player selection
- ✅ All build and deployment issues resolved

## Next Steps
TBD - Awaiting direction from Jeremy
