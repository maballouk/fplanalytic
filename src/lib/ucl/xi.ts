// Predicted XI selection for the Matchday Hub's pitch (Scout-Picks-style).
// Greedy pick per formation under UCL Fantasy's max-3-per-club rule, best
// total xPts wins. Deliberately ignores the budget: this is the "who would we
// field" XI, not a purchasable squad (the MethodNote says so).

import type { UclPlayer } from './file';

const FORMATIONS: [number, number, number][] = [
  [3, 4, 3],
  [3, 5, 2],
  [4, 3, 3],
  [4, 4, 2],
  [4, 5, 1],
  [5, 3, 2],
  [5, 4, 1],
];

const MAX_PER_CLUB = 3;

export interface PredictedXI {
  formation: string;
  gk: UclPlayer;
  def: UclPlayer[];
  mid: UclPlayer[];
  fwd: UclPlayer[];
  captain: UclPlayer;
  totalXpts: number;
}

export function pickXI(players: UclPlayer[]): PredictedXI | null {
  const byPos = {
    GK: players.filter((p) => p.position === 'GK'),
    DEF: players.filter((p) => p.position === 'DEF'),
    MID: players.filter((p) => p.position === 'MID'),
    FWD: players.filter((p) => p.position === 'FWD'),
  };
  for (const list of Object.values(byPos)) list.sort((a, b) => b.xpts - a.xpts);

  let best: PredictedXI | null = null;
  for (const [d, m, f] of FORMATIONS) {
    const clubCount = new Map<string, number>();
    const take = (list: UclPlayer[], n: number): UclPlayer[] | null => {
      const out: UclPlayer[] = [];
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

    const eleven = [...gk, ...def, ...mid, ...fwd];
    const totalXpts = eleven.reduce((s, p) => s + p.xpts, 0);
    if (best === null || totalXpts > best.totalXpts) {
      best = {
        formation: `${d}-${m}-${f}`,
        gk: gk[0],
        def,
        mid,
        fwd,
        captain: eleven.reduce((a, b) => (b.xpts > a.xpts ? b : a)),
        totalXpts,
      };
    }
  }
  return best;
}
