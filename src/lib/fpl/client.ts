import {
  BootstrapSchema,
  ElementSummarySchema,
  FixturesSchema,
  LiveSchema,
  type Bootstrap,
  type ElementSummary,
  type Fixture,
  type Live,
} from './schemas';

// Single adapter for the official FPL API (CLAUDE.md: adapters, not scrapes).
// Nothing outside lib/fpl sees raw response shapes. Server-side only: the FPL
// API sends no CORS headers, so all calls go through Next.js server code.

const BASE = 'https://fantasy.premierleague.com/api';

// Caching decisions (TASKS.md 0.5): slow-moving data revalidates every 6 hours;
// the live endpoint revalidates every 60 seconds and is polled only on /live.
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
  return FixturesSchema.parse(await get('fixtures/', SIX_HOURS));
}

/** In-play stats for a gameweek. 60s cache; poll only from the /live route. */
export async function live(gw: number): Promise<Live> {
  return LiveSchema.parse(await get(`event/${gw}/live/`, SIXTY_SECONDS));
}

export { FplApiError };
