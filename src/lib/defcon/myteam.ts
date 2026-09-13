// My Team (FPL): compare a manager's real XI with the tool's DEFCON XI.
// Pure functions; the /my-team page renders what these return.
//
// The comparison is deliberately on ONE axis: expected defensive-contribution
// points. Goalkeepers cannot earn DEFCON, so the tool's XI is 10 outfielders
// under FPL's formation rules (3-5 DEF, 2-5 MID, 1-3 FWD, max 3 per club) and
// the manager's GK counts 0. The page says all of this out loud.

import type { DefconFilePlayer } from './file';

export interface EntryPickView {
  id: number;
  name: string;
  code: number;
  team: string;
  team_code: number;
  position: 'GKP' | 'DEF' | 'MID' | 'FWD';
  pick_position: number; // 1-11 starters, 12-15 bench
  is_captain: boolean;
  status: string;
}

const FPL_FORMATIONS: [number, number, number][] = [
  [5, 4, 1],
  [5, 3, 2],
  [5, 2, 3],
  [4, 5, 1],
  [4, 4, 2],
  [4, 3, 3],
  [3, 5, 2],
  [3, 4, 3],
];
const MAX_PER_CLUB = 3;

export interface DefconTeam {
  formation: string;
  def: DefconFilePlayer[];
  mid: DefconFilePlayer[];
  fwd: DefconFilePlayer[];
  total: number;
}

/** The tool's best outfield XI by DEFCON xPts under FPL rules. */
export function pickDefconTeam(players: DefconFilePlayer[]): DefconTeam | null {
  const byPos = {
    DEF: players.filter((p) => p.position === 'DEF' && p.status === 'a'),
    MID: players.filter((p) => p.position === 'MID' && p.status === 'a'),
    FWD: players.filter((p) => p.position === 'FWD' && p.status === 'a'),
  };
  let best: DefconTeam | null = null;
  for (const [d, m, f] of FPL_FORMATIONS) {
    const clubCount = new Map<string, number>();
    const take = (list: DefconFilePlayer[], n: number): DefconFilePlayer[] | null => {
      const out: DefconFilePlayer[] = [];
      for (const p of list) {
        if (out.length === n) break;
        if ((clubCount.get(p.team) ?? 0) >= MAX_PER_CLUB) continue;
        out.push(p);
        clubCount.set(p.team, (clubCount.get(p.team) ?? 0) + 1);
      }
      return out.length === n ? out : null;
    };
    const def = take(byPos.DEF, d);
    const mid = def && take(byPos.MID, m);
    const fwd = mid && take(byPos.FWD, f);
    if (!def || !mid || !fwd) continue;
    const total = [...def, ...mid, ...fwd].reduce((s, p) => s + p.defcon_xpts, 0);
    if (best === null || total > best.total) {
      best = { formation: `${d}-${m}-${f}`, def, mid, fwd, total };
    }
  }
  return best;
}

/** Sum of DEFCON xPts for a manager's starting XI (GK counts 0). */
export function squadDefconTotal(
  picks: EntryPickView[],
  byElementId: Map<string, DefconFilePlayer>
): number {
  return picks
    .filter((p) => p.pick_position <= 11)
    .reduce((s, p) => s + (byElementId.get(String(p.id))?.defcon_xpts ?? 0), 0);
}

export interface UpgradeSuggestion {
  out: EntryPickView;
  in: DefconFilePlayer;
  gain: number;
}

/**
 * The single biggest like-for-like upgrade: the manager's weakest outfield
 * starter against the best same-position player they do not own.
 */
export function bestUpgrade(
  picks: EntryPickView[],
  byElementId: Map<string, DefconFilePlayer>,
  all: DefconFilePlayer[]
): UpgradeSuggestion | null {
  const owned = new Set(picks.map((p) => String(p.id)));
  let best: UpgradeSuggestion | null = null;
  for (const pick of picks.filter((p) => p.pick_position <= 11 && p.position !== 'GKP')) {
    const currentXpts = byElementId.get(String(pick.id))?.defcon_xpts ?? 0;
    const candidate = all.find(
      (c) => c.position === pick.position && c.status === 'a' && !owned.has(c.player_id)
    );
    if (!candidate) continue;
    const gain = candidate.defcon_xpts - currentXpts;
    if (gain > 0.05 && (best === null || gain > best.gain)) {
      best = { out: pick, in: candidate, gain };
    }
  }
  return best;
}
