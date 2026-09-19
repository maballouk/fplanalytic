// Match Centre payload (live page rebuild, 2026-09-14): everything one
// fixture's page needs — score, events, both squads with live points, the
// DEFCON race, team news and a pre-match "ones to watch" — composed from the
// free FPL API (fixtures stats + event live + bootstrap). Pure function so it
// unit-tests without the network; /api/fpl/match/[id] feeds it adapter data.

import type { Bootstrap, Fixture, Live } from './schemas';
import { thresholdFor } from '@/lib/defcon/file';

export type MatchPhase = 'pre' | 'live' | 'post';

export interface MatchTeam {
  id: number;
  name: string;
  short: string;
  code: number;
  score: number | null;
}

export interface MatchEvent {
  type: 'goal' | 'assist' | 'own_goal' | 'pen_saved' | 'pen_missed' | 'yellow' | 'red' | 'bonus';
  side: 'h' | 'a';
  name: string;
  /** goals scored / cards / bonus points, depending on type */
  value: number;
  /** match minutes detected by our own 60s tracker (~±1'); absent when the
   *  event happened before the tracker was watching */
  minutes?: number[];
}

export interface MatchPlayer {
  id: number;
  name: string;
  code: number;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
  minutes: number;
  points: number;
  goals: number;
  assists: number;
  bonus: number;
  /** DEFCON composite actions and the position threshold (0/0 for GKP) */
  actions: number;
  threshold: number;
}

export interface NewsItem {
  name: string;
  news: string;
}

export interface WatchItem {
  name: string;
  code: number;
  form: number;
  points_per_game: number;
}

export interface MatchPayload {
  gw: number | null;
  generated_at: string;
  phase: MatchPhase;
  kickoff_time: string | null;
  minutes: number;
  home: MatchTeam;
  away: MatchTeam;
  events: MatchEvent[];
  /** Players who have been on the pitch (live/post), most points first */
  squads: { h: MatchPlayer[]; a: MatchPlayer[] };
  /** Pre-match: the likeliest names to matter, by season starts + form */
  watch: { h: WatchItem[]; a: WatchItem[] };
  team_news: { h: NewsItem[]; a: NewsItem[] };
}

const POS: Record<number, MatchPlayer['position']> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

const EVENT_TYPES: Record<string, MatchEvent['type']> = {
  goals_scored: 'goal',
  assists: 'assist',
  own_goals: 'own_goal',
  penalties_saved: 'pen_saved',
  penalties_missed: 'pen_missed',
  yellow_cards: 'yellow',
  red_cards: 'red',
  bonus: 'bonus',
};

export function buildMatchPayload(
  bootstrap: Bootstrap,
  fixture: Fixture,
  live: Live | null,
  now: Date = new Date(),
  eventMinutes: Record<string, number[]> = {}
): MatchPayload {
  const teamById = new Map(bootstrap.teams.map((t) => [t.id, t]));
  const elById = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const liveById = new Map((live?.elements ?? []).map((e) => [e.id, e.stats]));

  const team = (id: number, score: number | null | undefined): MatchTeam => {
    const t = teamById.get(id);
    return {
      id,
      name: t?.name ?? String(id),
      short: t?.short_name ?? String(id),
      code: t?.code ?? 0,
      score: score ?? null,
    };
  };

  const phase: MatchPhase =
    fixture.finished || fixture.finished_provisional ? 'post' : fixture.started ? 'live' : 'pre';

  const events: MatchEvent[] = [];
  for (const stat of fixture.stats) {
    const type = EVENT_TYPES[stat.identifier];
    if (!type) continue;
    for (const side of ['h', 'a'] as const) {
      for (const row of stat[side]) {
        if (row.value <= 0) continue;
        const minutes = (eventMinutes[`${stat.identifier}:${row.element}`] ?? []).filter(
          (m) => m > 0
        );
        events.push({
          type,
          side,
          name: elById.get(row.element)?.web_name ?? String(row.element),
          value: row.value,
          ...(minutes.length > 0 ? { minutes } : {}),
        });
      }
    }
  }

  const squads: MatchPayload['squads'] = { h: [], a: [] };
  const news: MatchPayload['team_news'] = { h: [], a: [] };
  const watch: MatchPayload['watch'] = { h: [], a: [] };
  const sideOf = (teamId: number): 'h' | 'a' | null =>
    teamId === fixture.team_h ? 'h' : teamId === fixture.team_a ? 'a' : null;

  for (const el of bootstrap.elements) {
    const side = sideOf(el.team);
    if (side === null) continue;
    if (el.news) news[side].push({ name: el.web_name, news: el.news });

    const stats = liveById.get(el.id);
    if (phase !== 'pre' && stats && stats.minutes > 0) {
      const pos = POS[el.element_type] ?? 'MID';
      squads[side].push({
        id: el.id,
        name: el.web_name,
        code: el.code,
        position: pos,
        minutes: stats.minutes,
        points: stats.total_points,
        goals: stats.goals_scored,
        assists: stats.assists,
        bonus: stats.bonus,
        actions: pos === 'GKP' ? 0 : stats.defensive_contribution,
        threshold: pos === 'GKP' ? 0 : thresholdFor(pos === 'DEF' ? 'DEF' : pos),
      });
    }
  }
  squads.h.sort((x, y) => y.points - x.points || y.minutes - x.minutes);
  squads.a.sort((x, y) => y.points - x.points || y.minutes - x.minutes);

  if (phase === 'pre') {
    for (const side of ['h', 'a'] as const) {
      const teamId = side === 'h' ? fixture.team_h : fixture.team_a;
      watch[side] = bootstrap.elements
        .filter((e) => e.team === teamId && e.status === 'a' && e.starts >= 1)
        .map((e) => ({
          name: e.web_name,
          code: e.code,
          form: Number.parseFloat(e.form) || 0,
          points_per_game: 0,
          starts: e.starts,
        }))
        .sort((x, y) => y.form - x.form || y.starts - x.starts)
        .slice(0, 3)
        .map(({ name, code, form }) => ({ name, code, form, points_per_game: 0 }));
    }
  }

  return {
    gw: fixture.event,
    generated_at: now.toISOString(),
    phase,
    kickoff_time: fixture.kickoff_time,
    minutes: fixture.minutes,
    home: team(fixture.team_h, fixture.team_h_score),
    away: team(fixture.team_a, fixture.team_a_score),
    events,
    squads,
    watch,
    team_news: news,
  };
}
