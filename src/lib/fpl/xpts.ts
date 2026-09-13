// Total FPL expected points, v1 (owner direction 2026-09-13: one number a
// manager understands - "predicted points next GW" - with DEFCON as one part
// of it, not the whole story). Transparent by design: every term is a plain
// rate from the player's match history, shrunk toward a position prior, and
// scaled by next-fixture difficulty. No black box; documented on /methodology.

export type FplPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface PlayerAggregates {
  position: FplPosition;
  /** Season starts (bootstrap) */
  starts: number;
  /** Appearances with > 0 minutes */
  appearances: number;
  /** Appearances with >= 60 minutes */
  sixtyPlus: number;
  minutes: number;
  goals: number;
  assists: number;
  saves: number;
  bonus: number;
  /** Matches the player's TEAM has completed */
  teamGames: number;
  /** Already-shrunk DEFCON expected points per match (0 for GK) */
  defconXpts: number;
}

export interface NextFixture {
  difficulty: number; // FPL FDR 1-5
  is_home: boolean;
}

export interface XptsBreakdown {
  appearance: number;
  goals: number;
  assists: number;
  clean_sheet: number;
  conceded: number;
  saves: number;
  bonus: number;
  defcon: number;
}

export interface XptsResult {
  total: number;
  p_start: number;
  breakdown: XptsBreakdown;
}

// FPL scoring (2025/26 rules)
const GOAL_PTS: Record<FplPosition, number> = { GK: 6, DEF: 6, MID: 5, FWD: 4 };
const CS_PTS: Record<FplPosition, number> = { GK: 4, DEF: 4, MID: 1, FWD: 0 };

// Position priors per 90 (league-typical rates); 3 virtual 90s of shrinkage.
const PRIOR_GOALS90: Record<FplPosition, number> = { GK: 0, DEF: 0.05, MID: 0.13, FWD: 0.38 };
const PRIOR_ASSISTS90: Record<FplPosition, number> = { GK: 0.01, DEF: 0.05, MID: 0.14, FWD: 0.16 };
const PRIOR_SAVES90 = 3.0;
const PRIOR_BONUS_PER_APP = 0.25;
const SHRINK_90S = 3;
const SHRINK_APPS = 3;

// League-average fixture effects by FDR (v1 heuristics, stated on /methodology;
// replaced by a fitted model once the season provides enough matches).
const ATTACK_MULT: Record<number, number> = { 1: 1.25, 2: 1.15, 3: 1.0, 4: 0.85, 5: 0.7 };
const CS_PROB: Record<number, number> = { 1: 0.45, 2: 0.4, 3: 0.29, 4: 0.21, 5: 0.14 };
const EXP_CONCEDED: Record<number, number> = { 1: 0.8, 2: 0.9, 3: 1.2, 4: 1.5, 5: 1.8 };
const HOME_ATTACK_BONUS = 1.08;

function shrunkRate(sum: number, exposure: number, prior: number, k: number): number {
  return (sum + prior * k) / (exposure + k);
}

export function computeXpts(agg: PlayerAggregates, next: NextFixture[]): XptsResult {
  const teamGames = Math.max(agg.teamGames, 1);
  const pStart = Math.min(Math.max(agg.starts / teamGames, 0.02), 0.97);
  const pPlay = Math.min(Math.max(agg.appearances / teamGames, pStart), 0.98);
  const p60 = Math.min(agg.sixtyPlus / teamGames, pStart);
  // Expected fraction of 90 minutes on the pitch per fixture
  const exp90s = p60 * 0.92 + (pPlay - p60) * 0.3;

  const nineties = agg.minutes / 90;
  const goals90 = shrunkRate(agg.goals, nineties, PRIOR_GOALS90[agg.position], SHRINK_90S);
  const assists90 = shrunkRate(agg.assists, nineties, PRIOR_ASSISTS90[agg.position], SHRINK_90S);
  const saves90 =
    agg.position === 'GK' ? shrunkRate(agg.saves, nineties, PRIOR_SAVES90, SHRINK_90S) : 0;
  const bonusPerApp = shrunkRate(agg.bonus, agg.appearances, PRIOR_BONUS_PER_APP, SHRINK_APPS);

  const b: XptsBreakdown = {
    appearance: 0,
    goals: 0,
    assists: 0,
    clean_sheet: 0,
    conceded: 0,
    saves: 0,
    bonus: 0,
    defcon: 0,
  };

  for (const f of next) {
    const d = Math.min(Math.max(f.difficulty, 1), 5);
    const att = ATTACK_MULT[d] * (f.is_home ? HOME_ATTACK_BONUS : 1);
    b.appearance += p60 * 2 + (pPlay - p60) * 1;
    b.goals += goals90 * exp90s * att * GOAL_PTS[agg.position];
    b.assists += assists90 * exp90s * att * 3;
    b.clean_sheet += p60 * CS_PROB[d] * CS_PTS[agg.position];
    if (agg.position === 'GK' || agg.position === 'DEF') {
      b.conceded -= p60 * (EXP_CONCEDED[d] / 2);
    }
    b.saves += (saves90 * exp90s) / 3;
    b.bonus += bonusPerApp * pPlay;
    b.defcon += agg.defconXpts * pPlay;
  }

  const total = Object.values(b).reduce((s, x) => s + x, 0);
  return {
    total: Math.max(total, 0),
    p_start: pStart,
    breakdown: b,
  };
}
