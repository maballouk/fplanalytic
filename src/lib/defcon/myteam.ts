// My Team (FPL): compare a manager's real XI with the tool's predicted XI on
// TOTAL predicted points (owner direction 2026-09-13), goalkeeper included.
// Pure functions; the /my-team page renders what these return.

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

export interface PredictedTeam {
  formation: string;
  gk: DefconFilePlayer;
  def: DefconFilePlayer[];
  mid: DefconFilePlayer[];
  fwd: DefconFilePlayer[];
  total: number;
}

/** The tool's best full XI (GK included) by total predicted points. */
export function pickPredictedTeam(players: DefconFilePlayer[]): PredictedTeam | null {
  const eligible = players.filter((p) => p.status === 'a' && p.p_start >= 0.5);
  const byPos = {
    GK: eligible.filter((p) => p.position === 'GK'),
    DEF: eligible.filter((p) => p.position === 'DEF'),
    MID: eligible.filter((p) => p.position === 'MID'),
    FWD: eligible.filter((p) => p.position === 'FWD'),
  };
  for (const list of Object.values(byPos)) list.sort((a, b) => b.xpts_total - a.xpts_total);

  let best: PredictedTeam | null = null;
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
    const gk = take(byPos.GK, 1);
    const def = gk && take(byPos.DEF, d);
    const mid = def && take(byPos.MID, m);
    const fwd = mid && take(byPos.FWD, f);
    if (!gk || !def || !mid || !fwd) continue;
    const total = [...gk, ...def, ...mid, ...fwd].reduce((s, p) => s + p.xpts_total, 0);
    if (best === null || total > best.total) {
      best = { formation: `${d}-${m}-${f}`, gk: gk[0], def, mid, fwd, total };
    }
  }
  return best;
}

/** Sum of predicted points for a manager's starting XI. */
export function squadPredictedTotal(
  picks: EntryPickView[],
  byElementId: Map<string, DefconFilePlayer>
): number {
  return picks
    .filter((p) => p.pick_position <= 11)
    .reduce((s, p) => s + (byElementId.get(String(p.id))?.xpts_total ?? 0), 0);
}

export interface UpgradeSuggestion {
  out: EntryPickView;
  in: DefconFilePlayer;
  gain: number;
}

/**
 * The single biggest like-for-like upgrade on total predicted points:
 * the manager's weakest starter against the best same-position player
 * they do not own (goalkeepers included).
 */
export function bestUpgrade(
  picks: EntryPickView[],
  byElementId: Map<string, DefconFilePlayer>,
  all: DefconFilePlayer[]
): UpgradeSuggestion | null {
  const owned = new Set(picks.map((p) => String(p.id)));
  const sorted = [...all].sort((a, b) => b.xpts_total - a.xpts_total);
  let best: UpgradeSuggestion | null = null;
  for (const pick of picks.filter((p) => p.pick_position <= 11)) {
    const dataPos = pick.position === 'GKP' ? 'GK' : pick.position;
    const currentXpts = byElementId.get(String(pick.id))?.xpts_total ?? 0;
    const candidate = sorted.find(
      (c) =>
        c.position === dataPos && c.status === 'a' && c.p_start >= 0.7 && !owned.has(c.player_id)
    );
    if (!candidate) continue;
    const gain = candidate.xpts_total - currentXpts;
    if (gain > 0.2 && (best === null || gain > best.gain)) {
      best = { out: pick, in: candidate, gain };
    }
  }
  return best;
}
