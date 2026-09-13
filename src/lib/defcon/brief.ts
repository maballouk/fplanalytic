// The weekly brief and the state-aware home (canvas-approved flow):
// three calls for the gameweek, and one home page that knows what week it is.
// Pure functions, unit-tested; the page only renders what these return.

import { meanNext5Fdr, type Calendar, type DefconFilePlayer } from './file';
import { thresholdFor } from './file';

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

/** Pick the gameweek's three calls, totals-first (owner direction 2026-09-13). */
export function pickBrief(players: DefconFilePlayer[]): Brief {
  // One-match wonders make embarrassing headline calls; ask for a sample.
  const pool = players.filter((p) => p.status === 'a' && p.matches_considered >= 2);

  const note = (p: DefconFilePlayer): string => {
    const fdr = meanNext5Fdr(p);
    if (fdr === null) return 'No upcoming fixtures.';
    if (fdr <= 2.5) return 'Soft run next.';
    if (fdr <= 3.2) return 'Even run next.';
    return 'Tough run next.';
  };

  const buyPlayer = pool.find((p) => (meanNext5Fdr(p) ?? 5) <= 3 && p.p_start >= 0.7) ?? null;
  const buy: BriefCall | null = buyPlayer && {
    player: buyPlayer,
    tag: 'THE BUY',
    verdict: 'BUY',
    reason: `Predicted ${buyPlayer.xpts_total.toFixed(1)} pts next GW, form ${buyPlayer.form5.toFixed(1)}. ${note(buyPlayer)}`,
  };

  const diffPlayer =
    pool
      .filter((p) => p !== buyPlayer && p.elite_own <= 0.1 && p.ownership < 10 && p.p_start >= 0.7)
      .sort((a, b) => b.xpts_total - a.xpts_total)[0] ?? null;
  const differential: BriefCall | null = diffPlayer && {
    player: diffPlayer,
    tag: 'THE DIFFERENTIAL',
    reason: `Predicted ${diffPlayer.xpts_total.toFixed(1)} pts, owned by ${Math.round(diffPlayer.elite_own * 100)}% of the top 50 and ${diffPlayer.ownership.toFixed(1)}% overall.`,
  };

  const trapPlayer =
    pool
      .filter((p) => p !== buyPlayer && p !== diffPlayer && p.elite_own >= 0.3)
      .filter((p) => (meanNext5Fdr(p) ?? 0) >= 3.4 || p.p_start < 0.7)
      .sort((a, b) => b.elite_own - a.elite_own)[0] ?? null;
  const trap: BriefCall | null = trapPlayer && {
    player: trapPlayer,
    tag: 'THE TRAP',
    verdict: 'HOLD',
    reason: `Owned by ${Math.round(trapPlayer.elite_own * 100)}% of the top 50, but ${
      (meanNext5Fdr(trapPlayer) ?? 0) >= 3.4
        ? `${trapPlayer.next5.filter((f) => f.difficulty >= 4).length} of the next ${trapPlayer.next5.length} are rated 4 or worse`
        : `P(start) is only ${Math.round(trapPlayer.p_start * 100)}%`
    }. Wait.`,
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
