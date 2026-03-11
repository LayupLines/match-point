// ABOUTME: Fetches live win-probability odds from Polymarket for tennis matches.
// ABOUTME: Constructs match slugs, batch-fetches via Gamma API, caches results in memory.

type OddsResult = {
  player1Name: string
  player2Name: string
  player1Pct: number
  player2Pct: number
}

// In-memory cache: key = "MEN" | "WOMEN", value = { data, fetchedAt }
const oddsCache = new Map<string, { data: Map<string, OddsResult>; fetchedAt: number }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Abbreviates a player's last name for Polymarket slug construction.
 * Pattern: last word of full name, lowercased, max 7 chars.
 * For very short names (≤2 chars), combines all name parts.
 */
function abbreviateForSlug(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  const lastName = parts[parts.length - 1]

  // For very short last names (e.g. "Ann Li" → "annli"), combine all parts
  if (lastName.length <= 2) {
    return parts.join('').toLowerCase().slice(0, 7)
  }

  return lastName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 7)
}

/**
 * Constructs a Polymarket slug for a tennis match.
 * Format: {league}-{p1abbr}-{p2abbr}-{YYYY-MM-DD}
 */
function buildMatchSlug(
  league: 'atp' | 'wta',
  player1Name: string,
  player2Name: string,
  dateStr: string,
): string {
  const p1 = abbreviateForSlug(player1Name)
  const p2 = abbreviateForSlug(player2Name)
  return `${league}-${p1}-${p2}-${dateStr}`
}

/** Outcomes that indicate a non-match-winner market (Over/Under, Yes/No, etc.) */
const NON_WINNER_OUTCOMES = /^(over|under|yes|no)\b/i

/**
 * Finds the match winner market from an event's markets array.
 * Skips Over/Under and Yes/No markets by checking outcome names.
 */
function findMatchWinnerMarket(
  markets: Array<{ outcomes?: string; outcomePrices?: string }>,
): { outcomes: string[]; prices: string[] } | null {
  let fallback: { outcomes: string[]; prices: string[] } | null = null

  for (const market of markets) {
    const outcomes: string[] = JSON.parse(market.outcomes || '[]')
    const prices: string[] = JSON.parse(market.outcomePrices || '[]')

    if (outcomes.length < 2 || prices.length < 2) continue

    // Match winner markets have player names, not "Over"/"Under"/"Yes"/"No"
    const isNonWinner = outcomes.some(o => NON_WINNER_OUTCOMES.test(o.trim()))
    if (isNonWinner) continue

    // Prefer markets with full names (contain spaces = "First Last") for reliable matching
    const hasFullNames = outcomes.every(o => o.trim().includes(' '))
    if (hasFullNames) {
      return { outcomes, prices }
    }

    // Keep first last-name-only market as fallback
    if (!fallback) {
      fallback = { outcomes, prices }
    }
  }
  return fallback
}

/**
 * Fetches odds for a single match slug from Polymarket Gamma API.
 * Returns null if market not found or on error.
 */
async function fetchSlugOdds(slug: string): Promise<OddsResult | null> {
  try {
    const res = await fetch(`https://gamma-api.polymarket.com/events/slug/${slug}`, {
      next: { revalidate: 600 },
    })
    if (!res.ok) return null

    const event = await res.json()
    const markets = event?.markets
    if (!Array.isArray(markets) || markets.length === 0) return null

    const winnerMarket = findMatchWinnerMarket(markets)
    if (!winnerMarket) return null

    return {
      player1Name: winnerMarket.outcomes[0],
      player2Name: winnerMarket.outcomes[1],
      player1Pct: Math.round(parseFloat(winnerMarket.prices[0]) * 100),
      player2Pct: Math.round(parseFloat(winnerMarket.prices[1]) * 100),
    }
  } catch {
    return null
  }
}

type MatchInput = {
  id: string
  player1Name: string
  player2Name: string
}

/**
 * Fetches win probabilities for a set of matches from Polymarket.
 * Returns a Map from matchId to odds for each player.
 * Matches without Polymarket markets are silently omitted.
 */
export async function fetchMatchOdds(
  gender: 'MEN' | 'WOMEN',
  matches: MatchInput[],
): Promise<Map<string, { player1Pct: number; player2Pct: number }>> {
  const cacheKey = gender
  const cached = oddsCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    // Re-map cached odds to match IDs using player names
    return mapOddsToMatches(cached.data, matches)
  }

  const league = gender === 'MEN' ? 'atp' : 'wta'

  // Try today + next 2 days for slug construction (Polymarket uses match date, not listing date)
  const datesToTry: string[] = []
  for (let d = 0; d <= 2; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d)
    datesToTry.push(date.toISOString().split('T')[0])
  }

  // Build slugs for each match × each date, fetch in parallel
  type SlugEntry = { slug: string; matchId: string }
  const slugEntries: SlugEntry[] = []

  for (const match of matches) {
    for (const dateStr of datesToTry) {
      slugEntries.push({
        slug: buildMatchSlug(league, match.player1Name, match.player2Name, dateStr),
        matchId: match.id,
      })
    }
  }

  const results = await Promise.allSettled(
    slugEntries.map(e => fetchSlugOdds(e.slug))
  )

  // Build odds map keyed by a normalized player name pair for flexible matching
  // First successful hit per match wins (avoids duplicates from multi-date attempts)
  const oddsData = new Map<string, OddsResult>()
  const seenMatches = new Set<string>()
  slugEntries.forEach((entry, i) => {
    if (seenMatches.has(entry.matchId)) return // already found odds for this match
    const result = results[i]
    if (result.status === 'fulfilled' && result.value) {
      const odds = result.value
      seenMatches.add(entry.matchId)
      // Key by normalized player names from the API response (most reliable)
      const key = normalizeOddsKey(odds.player1Name, odds.player2Name)
      oddsData.set(key, odds)
    }
  })

  // Cache the results
  oddsCache.set(cacheKey, { data: oddsData, fetchedAt: Date.now() })

  return mapOddsToMatches(oddsData, matches)
}

/** Normalize a name for matching: lowercase, strip accents, remove punctuation */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim()
}

/** Create a stable key from two player names (order-independent) */
function normalizeOddsKey(name1: string, name2: string): string {
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)
  return [n1, n2].sort().join('|')
}

/** Map cached odds data to match IDs by matching player names */
function mapOddsToMatches(
  oddsData: Map<string, OddsResult>,
  matches: MatchInput[],
): Map<string, { player1Pct: number; player2Pct: number }> {
  const result = new Map<string, { player1Pct: number; player2Pct: number }>()

  for (const match of matches) {
    const key = normalizeOddsKey(match.player1Name, match.player2Name)
    const odds = oddsData.get(key)
    if (!odds) continue

    // Determine which API player maps to which match player
    const matchP1Norm = normalizeName(match.player1Name)
    const oddsP1Norm = normalizeName(odds.player1Name)

    if (matchP1Norm === oddsP1Norm) {
      // Same order
      result.set(match.id, { player1Pct: odds.player1Pct, player2Pct: odds.player2Pct })
    } else {
      // Swapped order
      result.set(match.id, { player1Pct: odds.player2Pct, player2Pct: odds.player1Pct })
    }
  }

  return result
}
