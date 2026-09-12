// The weekly brief and the state-aware home (canvas-approved flow):
// three calls for the gameweek, and one home page that knows what week it is.
// Pure functions, unit-tested; the page only renders what these return.

import { decide } from './decision';
import { meanNext5Fdr, thresholdFor, type Calendar, type DefconFilePlayer } from './file';

export interface BriefCall {
  player: DefconFilePlayer;
  reason: string;
  tag: 'THE BUY' | 'THE DIFFERENTIAL' | 'THE TRAP';
  verdict?: string;
}

export interface Brief {
  buy: BriefCall | null;
  differential: BriefCall | null;
  trap: BriefCall | null;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Pick the gameweek's three calls from ranked profiles (already xPts-sorted). */
export function pickBrief(players: DefconFilePlayer[]): Brief {
  // One-match wonders make embarrassing headline calls; ask for a sample.
  const pool = players.filter((p) => p.status === 'a' && p.matches_considered >= 2);

  const buyPlayer = pool.find((p) => p.hit_rate >= 0.6 && (meanNext5Fdr(p) ?? 5) <= 3) ?? null;
  const buy: BriefCall | null = buyPlayer && {
    player: buyPlayer,
    tag: 'THE BUY',
    verdict: 'BUY',
    reason: decide({
      hitRate: buyPlayer.hit_rate,
      threshold: thresholdFor(buyPlayer.position),
      last5Actions: buyPlayer.last5_actions,
      meanNext5Fdr: meanNext5Fdr(buyPlayer),
      status: buyPlayer.status,
    }).reason,
  };

  const diffPlayer =
    pool
      .filter((p) => p !== buyPlayer && p.ownership < 10 && p.hit_rate >= 0.6)
      .sort((a, b) => b.value_per_million - a.value_per_million)[0] ?? null;
  const differential: BriefCall | null = diffPlayer && {
    player: diffPlayer,
    tag: 'THE DIFFERENTIAL',
    reason: `${pct(diffPlayer.hit_rate)} hit rate at £${diffPlayer.price.toFixed(1)}m, ${diffPlayer.ownership.toFixed(1)}% owned.`,
  };

  const trapPlayer =
    pool
      .filter((p) => p !== buyPlayer && p !== diffPlayer && p.hit_rate >= 0.75)
      .filter((p) => (meanNext5Fdr(p) ?? 0) >= 3.4)
      .sort((a, b) => b.hit_rate - a.hit_rate || b.defcon_xpts - a.defcon_xpts)[0] ?? null;
  const trap: BriefCall | null = trapPlayer && {
    player: trapPlayer,
    tag: 'THE TRAP',
    verdict: 'HOLD',
    reason: `${pct(trapPlayer.hit_rate)} hit rate, but ${
      trapPlayer.next5.filter((f) => f.difficulty >= 4).length
    } of the next ${trapPlayer.next5.length} are rated 4 or worse. Wait.`,
  };

  return { buy, differential, trap };
}

export type HomeState = 'planning' | 'deadline' | 'live' | 'review';

const HOUR = 3_600_000;

/**
 * Which face the home page wears. `liveActive` comes from the live endpoint
 * (any started, unfinished fixture); everything else is the calendar.
 */
export function pickState(
  calendar: Calendar | undefined,
  now: number,
  liveActive: boolean
): HomeState {
  if (liveActive) return 'live';
  if (!calendar) return 'planning';
  const deadline = Date.parse(calendar.next_deadline);
  if (deadline > now && deadline - now <= 24 * HOUR) return 'deadline';
  const lastKickoff = calendar.last_kickoff ? Date.parse(calendar.last_kickoff) : 0;
  if (calendar.gw_finished && now > lastKickoff && now - lastKickoff <= 48 * HOUR) return 'review';
  return 'planning';
}

/** Whether it is worth asking the live endpoint at all right now. */
export function inLiveWindow(calendar: Calendar | undefined, now: number): boolean {
  if (!calendar?.first_kickoff || !calendar.last_kickoff) return false;
  return (
    now >= Date.parse(calendar.first_kickoff) - 15 * 60_000 &&
    now <= Date.parse(calendar.last_kickoff) + 3 * HOUR
  );
}

export interface ReviewLedger {
  banked: { player: DefconFilePlayer; actions: number }[];
  nearMissed: { player: DefconFilePlayer; actions: number }[];
}

/** Post-GW ledger from each player's most recent qualifying match. */
export function buildLedger(players: DefconFilePlayer[], top = 3): ReviewLedger {
  const banked: ReviewLedger['banked'] = [];
  const nearMissed: ReviewLedger['nearMissed'] = [];
  for (const p of players) {
    const last = p.last5_actions[p.last5_actions.length - 1];
    if (last === undefined) continue;
    const thr = thresholdFor(p.position);
    if (last >= thr) banked.push({ player: p, actions: last });
    else if (last >= thr - 2) nearMissed.push({ player: p, actions: last });
  }
  banked.sort((a, b) => b.actions - a.actions);
  nearMissed.sort((a, b) => b.actions - a.actions);
  return { banked: banked.slice(0, top), nearMissed: nearMissed.slice(0, top) };
}
