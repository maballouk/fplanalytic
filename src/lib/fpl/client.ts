import {
  BootstrapSchema,
  ElementSummarySchema,
  EntryPicksSchema,
  EntrySchema,
  FixturesSchema,
  LiveSchema,
  type Bootstrap,
  type ElementSummary,
  type Entry,
  type EntryPicks,
  type Fixture,
  type Live,
} from './schemas';

// Single adapter for the official FPL API (CLAUDE.md: adapters, not scrapes).
// Nothing outside lib/fpl sees raw response shapes. Server-side only: the FPL
// API sends no CORS headers, so all calls go through Next.js server code.

const BASE = 'https://fantasy.premierleague.com/api';

// Caching decisions (TASKS.md 0.5, revised 2026-09-19): slow-moving data
// revalidates every 6 hours. Fixtures are NOT slow-moving — they carry live
// scores, elapsed minutes, event stats and the finished flags — so they share
// the live endpoint's 60s window. (The old 6h TTL froze a night match at
// 2-0/90' for hours: the GW5 opener bug.)
const SIX_HOURS = 6 * 60 * 60;
const SIXTY_SECONDS = 60;

class FplApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number
  ) {
    super(`FPL API ${endpoint} responded ${status}`);
    this.name = 'FplApiError';
  }
}

async function get(path: string, revalidate: number): Promise<unknown> {
  const res = await fetch(`${BASE}/${path}`, { next: { revalidate } });
  if (!res.ok) throw new FplApiError(path, res.status);
  return res.json();
}

// Live feeds skip Next's data cache: its revalidate is stale-WHILE-revalidate,
// so every consumer was served one polling window behind reality (the MCI 2-2
// vs 3-2 lag, 2026-09-20). Freshness control lives on the API responses'
// s-maxage instead, where the CDN serves fresh-first and coalesces viewers.
async function getFresh(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}/${path}`, { cache: 'no-store' });
  if (!res.ok) throw new FplApiError(path, res.status);
  return res.json();
}

/** Players, teams and gameweeks. Refreshed every 6h. */
export async function bootstrap(): Promise<Bootstrap> {
  return BootstrapSchema.parse(await get('bootstrap-static/', SIX_HOURS));
}

/** Per-match history and upcoming fixtures for one player. Refreshed every 6h. */
export async function elementSummary(id: number): Promise<ElementSummary> {
  return ElementSummarySchema.parse(await get(`element-summary/${id}/`, SIX_HOURS));
}

/** Full season fixture list. Refreshed every 6h. */
export async function fixtures(): Promise<Fixture[]> {
  return FixturesSchema.parse(await getFresh('fixtures/'));
}

/** In-play stats for a gameweek. 60s cache; poll only from the /live route. */
export async function live(gw: number): Promise<Live> {
  return LiveSchema.parse(await getFresh(`event/${gw}/live/`));
}

const FIVE_MINUTES = 5 * 60;

/** A manager's public profile (team name, overall rank). My Team feature. */
export async function entry(id: number): Promise<Entry> {
  return EntrySchema.parse(await get(`entry/${id}/`, FIVE_MINUTES));
}

/** A manager's public picks for one gameweek. My Team feature. */
export async function entryPicks(id: number, gw: number): Promise<EntryPicks> {
  return EntryPicksSchema.parse(await get(`entry/${id}/event/${gw}/picks/`, FIVE_MINUTES));
}

export { FplApiError };
