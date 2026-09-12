// DEFCON data build (TASKS.md 1.2): pulls bootstrap + element summaries for all
// DEF/MID/FWD with >= 1 start, computes DEFCON profiles, writes
// public/data/defcon_gw{N}.json and keeps the last 3 gameweeks.
//
// Runs twice daily via .github/workflows/defcon-data.yml (the successor of the
// old "Twice Daily" ISR cache); the commit it pushes triggers the Netlify deploy.
// Run locally with: npx tsx scripts/build-defcon-data.ts

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  defconProfile,
  rankDefcon,
  type DefconMatch,
  type DefconPosition,
} from '../src/lib/defcon/profile';
import {
  BootstrapSchema,
  ElementSummarySchema,
  type Bootstrap,
  type ElementSummary,
} from '../src/lib/fpl/schemas';

const BASE = 'https://fantasy.premierleague.com/api';
const OUT_DIR = join(__dirname, '..', 'public', 'data');
const CONCURRENCY = 5; // be polite to element-summary (TASKS.md 1.2 trace note)
const KEEP_GWS = 3;
const MAX_FAILURE_SHARE = 0.05; // fail the run rather than publish a thin file

const POSITION: Record<number, DefconPosition> = { 2: 'DEF', 3: 'MID', 4: 'FWD' };

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
  }[] = [];
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
    const profile = defconProfile(
      String(el.id),
      el.web_name,
      teamById.get(el.team)?.short_name ?? String(el.team),
      position,
      el.now_cost / 10,
      history
    );
    if (profile === null) continue; // no qualifying matches yet

    const next5 = summary.fixtures.slice(0, 5).map((f) => ({
      event: f.event,
      opponent:
        teamById.get(f.is_home ? f.team_a : f.team_h)?.short_name ??
        String(f.is_home ? f.team_a : f.team_h),
      is_home: f.is_home,
      difficulty: f.difficulty,
    }));
    profiles.push({ profile, next5, status: el.status, minutes: el.minutes });
  }

  const ranked = rankDefcon(profiles.map((p) => p.profile)).map((profile, i) => {
    const extra = profiles.find((p) => p.profile === profile)!;
    return {
      rank: i + 1,
      ...profile,
      minutes: extra.minutes,
      next5: extra.next5,
      status: extra.status,
    };
  });

  mkdirSync(OUT_DIR, { recursive: true });
  const payload =
    JSON.stringify(
      { schema_version: 1, gw, generated_at: new Date().toISOString(), players: ranked },
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
