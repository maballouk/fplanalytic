// UCL live scores (Stadium Broadcast round, 2026-09-14): free live data from
// football-data.org (competition CL, needs FOOTBALL_DATA_TOKEN in the runtime
// env), joined server-side with OUR pre-match predictions from the latest
// engine file — the hub shows the live score on top of what the model said.
// Fail-soft on every edge: no token, API down, or names that do not match
// simply mean fewer (or no) live cards, never an error page.

import { NextResponse } from 'next/server';
import { canonicalTeam } from '@/lib/ucl/canonical';
import { loadLatestMatchday } from '@/lib/ucl/loadMatchday';

export const dynamic = 'force-dynamic';

const FD = 'https://api.football-data.org/v4/competitions/CL/matches';

interface FdMatch {
  id: number;
  utcDate: string;
  status: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | ...
  minute?: number | null;
  homeTeam: { name: string; shortName?: string };
  awayTeam: { name: string; shortName?: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

export interface UclLiveMatch {
  id: number;
  kickoff_utc: string;
  status: 'live' | 'paused' | 'upcoming' | 'finished';
  minute: number | null;
  home: string; // canonical name, resolvable via lib/ucl/clubs
  away: string;
  home_score: number | null;
  away_score: number | null;
  /** Our pre-match call, when the engine predicted this fixture */
  predicted: {
    xg_home: number;
    xg_away: number;
    p_home: number;
    p_draw: number;
    p_away: number;
    most_likely_score: string;
  } | null;
}

const STATUS: Record<string, UclLiveMatch['status']> = {
  IN_PLAY: 'live',
  PAUSED: 'paused',
  FINISHED: 'finished',
  SCHEDULED: 'upcoming',
  TIMED: 'upcoming',
};

function day(offset: number): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const token = process.env.FOOTBALL_DATA_TOKEN?.trim();
  if (!token) return NextResponse.json({ matches: [], reason: 'no token configured' });

  // ?days=N widens the look-ahead window (previewing an upcoming matchday);
  // matchday defaults keep the section quiet outside ±1 day of real games.
  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get('days')) || 1, 1), 60);

  try {
    const res = await fetch(`${FD}?dateFrom=${day(-1)}&dateTo=${day(days)}`, {
      headers: { 'X-Auth-Token': token },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json({ matches: [], reason: `upstream ${res.status}` });
    const payload = (await res.json()) as { matches?: FdMatch[] };

    const md = loadLatestMatchday();
    const predByPair = new Map(
      (md?.fixtures ?? []).map((f) => [
        `${f.home}|${f.away}`,
        {
          xg_home: f.xg_home,
          xg_away: f.xg_away,
          p_home: f.p_home,
          p_draw: f.p_draw,
          p_away: f.p_away,
          most_likely_score: f.most_likely_score,
        },
      ])
    );

    const matches: UclLiveMatch[] = (payload.matches ?? []).map((m) => {
      const home = canonicalTeam(m.homeTeam.shortName || m.homeTeam.name);
      const away = canonicalTeam(m.awayTeam.shortName || m.awayTeam.name);
      return {
        id: m.id,
        kickoff_utc: m.utcDate,
        status: STATUS[m.status] ?? 'upcoming',
        minute: typeof m.minute === 'number' ? m.minute : null,
        home,
        away,
        home_score: m.score.fullTime.home,
        away_score: m.score.fullTime.away,
        predicted: predByPair.get(`${home}|${away}`) ?? null,
      };
    });
    return NextResponse.json({ matches, generated_at: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ matches: [], reason: message });
  }
}
