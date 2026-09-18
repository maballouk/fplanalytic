// Live DEFCON payload builder (TASKS.md 1.6). Pure function so it unit-tests
// without the network; the /api/defcon/live route feeds it adapter data.
// `defensive_contribution` from the live endpoint is already the position-aware
// composite count (docs/ARCHITECTURE.md §5), so actions come straight from it.

import type { Bootstrap, Fixture, Live } from '@/lib/fpl/schemas';
import { thresholdFor } from './file';
import type { DefconPosition } from './profile';

const POSITION: Record<number, DefconPosition> = { 2: 'DEF', 3: 'MID', 4: 'FWD' };

export interface LiveFixture {
  id: number;
  home: string;
  away: string;
  home_code: number; // PL media id for the club badge
  away_code: number;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
  started: boolean;
  kickoff_time: string | null;
  minutes: number;
}

export interface LivePlayer {
  id: number;
  name: string;
  team: string;
  team_code: number;
  position: DefconPosition;
  threshold: number;
  actions: number;
  minutes: number;
  fixture_id: number;
}

/** One line of the broadcast ticker: goals and reds across live matches. */
export interface TickerItem {
  fixture_id: number;
  type: 'goal' | 'red';
  name: string;
  /** e.g. "AVL 1–2 NFO" at the moment of rendering */
  score: string;
}

export interface LivePayload {
  gw: number | null;
  generated_at: string;
  fixtures: LiveFixture[];
  players: LivePlayer[];
  ticker: TickerItem[];
  /** The next fixture to kick off anywhere in the season: powers the
   *  between-matches countdown and the empty state. */
  next_kickoff: {
    label: string;
    kickoff_time: string;
    home: string;
    away: string;
    home_code: number;
    away_code: number;
  } | null;
}

export function buildLivePayload(
  bootstrap: Bootstrap,
  fixtures: Fixture[],
  live: Live | null,
  now: Date = new Date()
): LivePayload {
  const teamShort = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const teamCode = new Map(bootstrap.teams.map((t) => [t.id, t.code]));
  const currentGw = bootstrap.events.find((e) => e.is_current)?.id ?? null;

  const upcoming = fixtures
    .filter((f) => f.kickoff_time !== null && !f.started && new Date(f.kickoff_time) > now)
    .sort((a, b) => a.kickoff_time!.localeCompare(b.kickoff_time!));
  const nextKickoff = upcoming[0]
    ? {
        label: `${teamShort.get(upcoming[0].team_h)} v ${teamShort.get(upcoming[0].team_a)}`,
        kickoff_time: upcoming[0].kickoff_time!,
        home: teamShort.get(upcoming[0].team_h) ?? String(upcoming[0].team_h),
        away: teamShort.get(upcoming[0].team_a) ?? String(upcoming[0].team_a),
        home_code: teamCode.get(upcoming[0].team_h) ?? 0,
        away_code: teamCode.get(upcoming[0].team_a) ?? 0,
      }
    : null;

  // The whole current gameweek: the match grid groups live / upcoming / done.
  const allGwFixtures = fixtures
    .filter((f) => currentGw !== null && f.event === currentGw)
    .sort((a, b) => (a.kickoff_time ?? '').localeCompare(b.kickoff_time ?? ''));
  const gwFixtures = allGwFixtures.filter((f) => f.started === true);
  const liveFixtures: LiveFixture[] = allGwFixtures.map((f) => ({
    id: f.id,
    home: teamShort.get(f.team_h) ?? String(f.team_h),
    away: teamShort.get(f.team_a) ?? String(f.team_a),
    home_code: teamCode.get(f.team_h) ?? 0,
    away_code: teamCode.get(f.team_a) ?? 0,
    home_score: f.team_h_score ?? null,
    away_score: f.team_a_score ?? null,
    finished: f.finished,
    started: f.started === true,
    kickoff_time: f.kickoff_time,
    minutes: f.minutes,
  }));

  // Broadcast ticker: goals and red cards from every started fixture, newest
  // fixtures first. FPL publishes no per-event minute, so each line carries
  // the current score for context instead of a timestamp.
  const elName = new Map(bootstrap.elements.map((e) => [e.id, e.web_name]));
  const ticker: TickerItem[] = [];
  for (const f of [...gwFixtures].reverse()) {
    const score = `${teamShort.get(f.team_h)} ${f.team_h_score ?? 0}–${f.team_a_score ?? 0} ${teamShort.get(f.team_a)}`;
    for (const stat of f.stats ?? []) {
      if (stat.identifier !== 'goals_scored' && stat.identifier !== 'red_cards') continue;
      const type = stat.identifier === 'goals_scored' ? ('goal' as const) : ('red' as const);
      for (const row of [...stat.h, ...stat.a]) {
        if (row.value <= 0) continue;
        ticker.push({
          fixture_id: f.id,
          type,
          name:
            row.value > 1
              ? `${elName.get(row.element) ?? row.element} ×${row.value}`
              : `${elName.get(row.element) ?? String(row.element)}`,
          score,
        });
      }
    }
  }

  const fixtureByTeam = new Map<number, number>();
  for (const f of gwFixtures) {
    fixtureByTeam.set(f.team_h, f.id);
    fixtureByTeam.set(f.team_a, f.id);
  }

  const statsById = new Map((live?.elements ?? []).map((e) => [e.id, e.stats]));

  const players: LivePlayer[] = [];
  for (const el of bootstrap.elements) {
    const position = POSITION[el.element_type];
    const fixtureId = fixtureByTeam.get(el.team);
    const stats = statsById.get(el.id);
    if (!position || fixtureId === undefined || !stats || stats.minutes === 0) continue;
    players.push({
      id: el.id,
      name: el.web_name,
      team: teamShort.get(el.team) ?? String(el.team),
      team_code: teamCode.get(el.team) ?? 0,
      position,
      threshold: thresholdFor(position),
      actions: stats.defensive_contribution,
      minutes: stats.minutes,
      fixture_id: fixtureId,
    });
  }

  // "Closest to threshold" first: smallest remaining gap, hits at the top,
  // ties broken by more actions (DESIGN.md §3.2).
  players.sort((a, b) => {
    const ra = Math.max(0, a.threshold - a.actions);
    const rb = Math.max(0, b.threshold - b.actions);
    return ra - rb || b.actions - a.actions;
  });

  return {
    gw: currentGw,
    generated_at: now.toISOString(),
    fixtures: liveFixtures,
    players,
    ticker,
    next_kickoff: nextKickoff,
  };
}
