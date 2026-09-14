// DEFCON data build (TASKS.md 1.2): pulls bootstrap + element summaries for all
// DEF/MID/FWD with >= 1 start, computes DEFCON profiles, writes
// public/data/defcon_gw{N}.json and keeps the last 3 gameweeks.
//
// Runs twice daily via .github/workflows/defcon-data.yml (the successor of the
// old "Twice Daily" ISR cache); the commit it pushes triggers the Netlify deploy.
// Run locally with: npx tsx scripts/build-defcon-data.ts

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defconProfile, type DefconMatch } from '../src/lib/defcon/profile';
import { computeXpts, type FplPosition } from '../src/lib/fpl/xpts';
import {
  BootstrapSchema,
  ElementSummarySchema,
  FixturesSchema,
  type Bootstrap,
  type ElementSummary,
} from '../src/lib/fpl/schemas';

const BASE = 'https://fantasy.premierleague.com/api';
const OUT_DIR = join(__dirname, '..', 'public', 'data');
const CONCURRENCY = 5; // be polite to element-summary (TASKS.md 1.2 trace note)
const KEEP_GWS = 3;
const MAX_FAILURE_SHARE = 0.05; // fail the run rather than publish a thin file

const POSITION: Record<number, FplPosition> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
const ELITE_LEAGUE = 314; // the overall FPL league; page 1 = the world's top 50
const ELITE_SAMPLE = 50;
type DefconPositionKey = FplPosition;

async function getJson(path: string, retries = 2): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${BASE}/${path}`, {
        headers: { 'user-agent': 'fplanalytic-data-build' },
      });
      if (!res.ok) throw new Error(`${path} responded ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

/** Run tasks over items with a fixed concurrency; nulls mark failed items. */
async function pool<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await task(items[i]);
      } catch {
        results[i] = null; // counted against MAX_FAILURE_SHARE below
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const bootstrap: Bootstrap = BootstrapSchema.parse(await getJson('bootstrap-static/'));

  const currentGw =
    bootstrap.events.find((e) => e.is_current) ?? bootstrap.events.find((e) => e.is_next);
  if (!currentGw) throw new Error('No current or next gameweek in bootstrap');
  const gw = currentGw.id;

  // Calendar block for the state-aware home (planning / deadline / live / review)
  const allFixtures = FixturesSchema.parse(await getJson('fixtures/'));
  const gwKickoffs = allFixtures
    .filter((f) => f.event === gw && f.kickoff_time !== null)
    .map((f) => f.kickoff_time as string)
    .sort();
  const nextEvent = bootstrap.events.find((e) => e.is_next);
  const calendar = {
    gw,
    gw_finished: currentGw.finished,
    first_kickoff: gwKickoffs[0] ?? null,
    last_kickoff: gwKickoffs[gwKickoffs.length - 1] ?? null,
    next_gw: nextEvent?.id ?? null,
    next_deadline: nextEvent?.deadline_time ?? currentGw.deadline_time,
  };

  const teamById = new Map(bootstrap.teams.map((t) => [t.id, t]));
  const candidates = bootstrap.elements.filter(
    (e) => POSITION[e.element_type] !== undefined && e.starts >= 1
  );
  console.log(`GW ${gw}: building profiles for ${candidates.length} players`);

  const summaries = await pool(candidates, CONCURRENCY, async (el) => {
    const summary: ElementSummary = ElementSummarySchema.parse(
      await getJson(`element-summary/${el.id}/`)
    );
    return { el, summary };
  });

  const failed = summaries.filter((s) => s === null).length;
  if (failed / candidates.length > MAX_FAILURE_SHARE) {
    throw new Error(`${failed}/${candidates.length} element-summary fetches failed; aborting`);
  }
  if (failed > 0) console.warn(`skipped ${failed} players after fetch failures`);

  const profiles: {
    profile: NonNullable<ReturnType<typeof defconProfile>>;
    next5: { event: number | null; opponent: string; is_home: boolean; difficulty: number }[];
    status: string;
    minutes: number;
    code: number;
    team_code: number;
    ownership: number;
    xpts_total: number;
    xpts_breakdown: Record<string, number>;
    p_start: number;
    form5: number;
    price_change: number;
  }[] = [];
  // Pass 1: histories plus the league-wide hit rate per position, which
  // shrinks small samples so a 3-of-3 start does not read as certainty.
  const prepared: {
    el: NonNullable<(typeof summaries)[number]>['el'];
    position: DefconPositionKey;
    history: DefconMatch[];
    summary: ElementSummary;
  }[] = [];
  const leagueHits: Record<string, { hits: number; games: number }> = {
    DEF: { hits: 0, games: 0 },
    MID: { hits: 0, games: 0 },
    FWD: { hits: 0, games: 0 },
  };
  for (const s of summaries) {
    if (s === null) continue;
    const { el, summary } = s;
    const position = POSITION[el.element_type];
    const history: DefconMatch[] = summary.history.map((h) => ({
      minutes: h.minutes,
      // Engine semantics: cbit includes tackles; the FPL field does not.
      cbit: h.clearances_blocks_interceptions + h.tackles,
      recoveries: h.recoveries,
      opponent: teamById.get(h.opponent_team)?.short_name ?? String(h.opponent_team),
      was_home: h.was_home,
    }));
    if (position !== 'GK') {
      const threshold = position === 'DEF' ? 10 : 12;
      for (const m of history) {
        if (m.minutes < 60) continue;
        const actions = position === 'DEF' ? m.cbit : m.cbit + (m.recoveries ?? 0);
        leagueHits[position].games += 1;
        if (actions >= threshold) leagueHits[position].hits += 1;
      }
    }
    prepared.push({ el, position, history, summary });
  }
  const priorFor = (position: string): number => {
    const { hits, games } = leagueHits[position];
    return games > 0 ? hits / games : 0.2;
  };
  console.log(
    'position priors:',
    Object.fromEntries(Object.keys(leagueHits).map((k) => [k, priorFor(k).toFixed(3)]))
  );

  // Completed games per team, for start-share estimates
  const teamGamesPlayed = new Map<number, number>();
  for (const f of allFixtures) {
    if (!f.finished) continue;
    teamGamesPlayed.set(f.team_h, (teamGamesPlayed.get(f.team_h) ?? 0) + 1);
    teamGamesPlayed.set(f.team_a, (teamGamesPlayed.get(f.team_a) ?? 0) + 1);
  }

  for (const { el, position, history, summary } of prepared) {
    const shortName = teamById.get(el.team)?.short_name ?? String(el.team);
    const profile =
      position === 'GK'
        ? {
            player_id: String(el.id),
            name: el.web_name,
            team: shortName,
            position: 'GK' as const,
            price: el.now_cost / 10,
            matches_considered: history.filter((m) => m.minutes >= 60).length,
            hit_rate: 0,
            mean_actions: 0,
            near_miss_rate: 0,
            consistency: 0,
            defcon_xpts: 0,
            value_per_million: 0,
            last5_actions: [] as number[],
          }
        : defconProfile(
            String(el.id),
            el.web_name,
            shortName,
            position,
            el.now_cost / 10,
            history,
            {
              priorHitRate: priorFor(position),
            }
          );
    if (profile === null) continue; // no qualifying matches yet

    // Aggregates for the total-points model
    const played = summary.history.filter((h) => h.minutes > 0);
    const agg = {
      position,
      starts: el.starts,
      appearances: played.length,
      sixtyPlus: played.filter((h) => h.minutes >= 60).length,
      minutes: played.reduce((s, h) => s + h.minutes, 0),
      goals: played.reduce((s, h) => s + h.goals_scored, 0),
      assists: played.reduce((s, h) => s + h.assists, 0),
      saves: played.reduce((s, h) => s + h.saves, 0),
      bonus: played.reduce((s, h) => s + h.bonus, 0),
      teamGames: teamGamesPlayed.get(el.team) ?? 1,
      defconXpts: profile.defcon_xpts,
    };
    const nextGwFixtures = summary.fixtures
      .filter((f) => f.event !== null && f.event === calendar.next_gw)
      .map((f) => ({ difficulty: f.difficulty, is_home: f.is_home }));
    const xp = computeXpts(agg, nextGwFixtures);
    const form5 = played.slice(-5);
    const form = form5.length ? form5.reduce((s, h) => s + h.total_points, 0) / form5.length : 0;

    const next5 = summary.fixtures.slice(0, 5).map((f) => ({
      event: f.event,
      opponent:
        teamById.get(f.is_home ? f.team_a : f.team_h)?.short_name ??
        String(f.is_home ? f.team_a : f.team_h),
      is_home: f.is_home,
      difficulty: f.difficulty,
    }));
    profiles.push({
      profile,
      next5,
      status: el.status,
      minutes: el.minutes,
      code: el.code,
      team_code: teamById.get(el.team)?.code ?? 0,
      ownership: Number.parseFloat(el.selected_by_percent) || 0,
      price_change: el.cost_change_event / 10,
      xpts_total: Number(xp.total.toFixed(3)),
      xpts_breakdown: Object.fromEntries(
        Object.entries(xp.breakdown).map(([k, v]) => [k, Number(v.toFixed(3))])
      ),
      p_start: Number(xp.p_start.toFixed(3)),
      form5: Number(form.toFixed(2)),
    });
  }

  // Elite consensus: what the world's top 50 managers own and captain.
  const eliteOwn = new Map<number, number>();
  const eliteCap = new Map<number, number>();
  let eliteSampled = 0;
  try {
    const standings = (await getJson(`leagues-classic/${ELITE_LEAGUE}/standings/`)) as {
      standings: { results: { entry: number }[] };
    };
    const entries = standings.standings.results.slice(0, ELITE_SAMPLE).map((r) => r.entry);
    const elitePicks = await pool(entries, CONCURRENCY, async (entryId) => {
      return (await getJson(`entry/${entryId}/event/${gw}/picks/`)) as {
        picks: { element: number; multiplier: number; is_captain: boolean }[];
      };
    });
    for (const res of elitePicks) {
      if (res === null) continue;
      eliteSampled += 1;
      for (const pk of res.picks) {
        eliteOwn.set(pk.element, (eliteOwn.get(pk.element) ?? 0) + 1);
        if (pk.is_captain) eliteCap.set(pk.element, (eliteCap.get(pk.element) ?? 0) + 1);
      }
    }
    console.log(`elite consensus: sampled ${eliteSampled} of the top ${ELITE_SAMPLE} managers`);
  } catch (err) {
    console.warn('elite consensus unavailable this run:', (err as Error).message);
  }

  // Previous build's predictions, so the UI can show movement arrows.
  const prevXpts = new Map<string, number>();
  try {
    const prev = JSON.parse(readFileSync(join(OUT_DIR, 'defcon_latest.json'), 'utf-8')) as {
      players?: { player_id: string; xpts_total?: number }[];
    };
    for (const p of prev.players ?? []) {
      if (typeof p.xpts_total === 'number') prevXpts.set(p.player_id, p.xpts_total);
    }
  } catch {
    // first run, or an old file without totals: no arrows this build
  }

  const ranked = [...profiles]
    .sort((a, b) => b.xpts_total - a.xpts_total)
    .map((extra, i) => ({
      rank: i + 1,
      ...extra.profile,
      code: extra.code,
      team_code: extra.team_code,
      minutes: extra.minutes,
      ownership: extra.ownership,
      xpts_total: extra.xpts_total,
      xpts_prev: prevXpts.get(extra.profile.player_id),
      price_change: extra.price_change,
      xpts_breakdown: extra.xpts_breakdown,
      p_start: extra.p_start,
      form5: extra.form5,
      elite_own: eliteSampled
        ? Number(((eliteOwn.get(Number(extra.profile.player_id)) ?? 0) / eliteSampled).toFixed(3))
        : 0,
      elite_cap: eliteSampled
        ? Number(((eliteCap.get(Number(extra.profile.player_id)) ?? 0) / eliteSampled).toFixed(3))
        : 0,
      next5: extra.next5,
      status: extra.status,
    }));

  mkdirSync(OUT_DIR, { recursive: true });
  const payload =
    JSON.stringify(
      { schema_version: 1, gw, generated_at: new Date().toISOString(), calendar, players: ranked },
      null,
      1
    ) + '\n';
  const outPath = join(OUT_DIR, `defcon_gw${gw}.json`);
  writeFileSync(outPath, payload);
  // Stable alias so runtime consumers (e.g. the OG image) need no directory listing.
  writeFileSync(join(OUT_DIR, 'defcon_latest.json'), payload);
  console.log(`wrote ${outPath} (${ranked.length} profiles)`);

  // Keep the last KEEP_GWS gameweeks only (TASKS.md 1.2)
  for (const file of readdirSync(OUT_DIR)) {
    const m = file.match(/^defcon_gw(\d+)\.json$/);
    if (m && Number(m[1]) <= gw - KEEP_GWS) {
      rmSync(join(OUT_DIR, file));
      console.log(`removed stale ${file}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
