// Self-detected event minutes (2026-09-19). Neither the FPL API nor
// football-data's free tier publishes the minute an event happened (verified
// against both), so we detect it ourselves: the live surfaces already poll
// fixtures every 60s, and each snapshot carries the fixture's elapsed
// `minutes`. Whenever a stat count rises between snapshots, that snapshot's
// minute IS the event's minute, give or take the polling window (~±1').
//
// The ledger persists in Netlify Blobs (free tier) keyed per gameweek; local
// dev falls back to a process-level map so the feature is testable with
// `next dev`. Events that happened before the tracker was watching (deploys,
// nobody polling) simply have no minute — the UI shows them without one.

import type { Fixture } from './schemas';

/** identifiers worth a timeline minute (assists share the goal's minute) */
const TRACKED = new Set([
  'goals_scored',
  'own_goals',
  'penalties_missed',
  'penalties_saved',
  'yellow_cards',
  'red_cards',
]);

export interface LedgerEvent {
  fixture_id: number;
  identifier: string;
  element: number;
  /** the nth occurrence for this player+stat (1-based), so doubles get two minutes */
  n: number;
  minute: number;
}

interface LedgerDoc {
  /** key: `${fixture_id}:${identifier}:${element}:${n}` — set semantics kill
   *  duplicates when two pollers race between read and write. */
  events: Record<string, LedgerEvent>;
  /** fixtures we have watched from (near) kickoff or baselined mid-match */
  baseline?: Record<string, true>;
}

interface KV {
  get(key: string): Promise<LedgerDoc | null>;
  set(key: string, value: LedgerDoc): Promise<void>;
}

// Local-dev fallback: one dev server process, so a Map is fine.
const devStore = new Map<string, LedgerDoc>();

async function kv(): Promise<KV> {
  try {
    // Netlify injects its Blobs context in production functions; anywhere else
    // this throws and we fall back to the in-process map.
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('match-event-minutes');
    return {
      get: async (key) => ((await store.get(key, { type: 'json' })) as LedgerDoc | null) ?? null,
      set: async (key, value) => {
        await store.setJSON(key, value);
      },
    };
  } catch {
    return {
      get: async (key) => devStore.get(key) ?? null,
      set: async (key, value) => {
        devStore.set(key, value);
      },
    };
  }
}

/** Pure diff: which (player, stat, nth) occurrences exist in these fixtures. */
export function occurrences(fixtures: Fixture[]): Map<string, Omit<LedgerEvent, 'minute'>> {
  const out = new Map<string, Omit<LedgerEvent, 'minute'>>();
  for (const f of fixtures) {
    if (f.started !== true) continue;
    for (const stat of f.stats ?? []) {
      if (!TRACKED.has(stat.identifier)) continue;
      for (const row of [...stat.h, ...stat.a]) {
        for (let n = 1; n <= row.value; n++) {
          out.set(`${f.id}:${stat.identifier}:${row.element}:${n}`, {
            fixture_id: f.id,
            identifier: stat.identifier,
            element: row.element,
            n,
          });
        }
      }
    }
  }
  return out;
}

/**
 * Record any newly-appeared events at the fixtures' current minute and return
 * the full ledger for the gameweek. Fail-soft: on any storage error the
 * caller gets whatever could be read (possibly nothing) and the site works.
 */
export async function recordAndGetEvents(gw: number, fixtures: Fixture[]): Promise<LedgerEvent[]> {
  try {
    const store = await kv();
    const key = `gw${gw}`;
    const doc = (await store.get(key)) ?? { events: {} };
    const minuteByFixture = new Map(fixtures.map((f) => [f.id, f.minutes]));

    // Honesty rule: on the FIRST sighting of an in-progress match (we joined
    // late — a deploy, or nobody was polling), its existing events get minute
    // 0 = unknown rather than a false "now" stamp. Only fixtures caught from
    // (near) kickoff, and every event that appears AFTER the baseline, get a
    // real minute.
    doc.baseline ??= {};
    let dirty = false;
    const firstSight = new Set<number>();
    for (const f of fixtures) {
      if (f.started === true && !doc.baseline[String(f.id)]) {
        doc.baseline[String(f.id)] = true;
        if (f.minutes > 2) firstSight.add(f.id);
        dirty = true;
      }
    }
    occurrences(fixtures).forEach((ev, k) => {
      if (doc.events[k]) return;
      doc.events[k] = {
        ...ev,
        minute: firstSight.has(ev.fixture_id) ? 0 : (minuteByFixture.get(ev.fixture_id) ?? 0),
      };
      dirty = true;
    });
    if (dirty) await store.set(key, doc);
    return Object.values(doc.events);
  } catch {
    return [];
  }
}

/** minutes for one fixture, keyed `${identifier}:${element}` in event order */
export function minutesForFixture(
  events: LedgerEvent[],
  fixtureId: number
): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const ev of events.filter((e) => e.fixture_id === fixtureId).sort((a, b) => a.n - b.n)) {
    const k = `${ev.identifier}:${ev.element}`;
    (out[k] ??= []).push(ev.minute);
  }
  return out;
}
