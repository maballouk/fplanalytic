// Backtest ledger (TASKS.md 1.5.7): we grade our own predictions in public.
// The data build keeps public/data/backtest.json — the final pre-deadline
// predictions for the coming GW ("pending") and one scored row per finished
// GW. Scoring is a pure function so it unit-tests without the network.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const BacktestPredictionSchema = z.object({
  name: z.string(),
  team: z.string(),
  position: z.string(),
  xpts: z.number(),
});

export const BacktestResultSchema = z.object({
  gw: z.number(),
  scored_at: z.string(),
  /** players with a prediction and any actual minutes */
  n: z.number(),
  /** mean absolute error, predicted vs actual points */
  mae: z.number(),
  /** mean (predicted - actual): positive = we over-promise */
  bias: z.number(),
  /** of our predicted top 10, how many finished in the actual top 20 */
  top10_in_top20: z.number(),
  best_call: z
    .object({ name: z.string(), team: z.string(), predicted: z.number(), actual: z.number() })
    .nullable(),
  worst_miss: z
    .object({ name: z.string(), team: z.string(), predicted: z.number(), actual: z.number() })
    .nullable(),
});

export const BacktestFileSchema = z.object({
  schema_version: z.literal(1),
  pending: z
    .object({
      gw: z.number(),
      generated_at: z.string(),
      predictions: z.record(z.string(), BacktestPredictionSchema),
    })
    .nullable(),
  results: z.array(BacktestResultSchema),
});

export type BacktestPrediction = z.infer<typeof BacktestPredictionSchema>;
export type BacktestResult = z.infer<typeof BacktestResultSchema>;
export type BacktestFile = z.infer<typeof BacktestFileSchema>;

/** Grade one gameweek: predictions vs actual FPL points (players who played). */
export function scoreGw(
  gw: number,
  predictions: Record<string, BacktestPrediction>,
  actuals: Map<string, { points: number; minutes: number }>,
  scoredAt: string
): BacktestResult {
  const rows: { id: string; p: BacktestPrediction; actual: number }[] = [];
  for (const [id, p] of Object.entries(predictions)) {
    const a = actuals.get(id);
    if (!a || a.minutes === 0) continue; // no minutes: rotation, not model error
    rows.push({ id, p, actual: a.points });
  }
  const n = rows.length;
  const mae = n ? rows.reduce((s, r) => s + Math.abs(r.p.xpts - r.actual), 0) / n : 0;
  const bias = n ? rows.reduce((s, r) => s + (r.p.xpts - r.actual), 0) / n : 0;

  const byPredicted = [...rows].sort((a, b) => b.p.xpts - a.p.xpts);
  const byActual = [...rows].sort((a, b) => b.actual - a.actual);
  const actualTop20 = new Set(byActual.slice(0, 20).map((r) => r.id));
  const top10 = byPredicted.slice(0, 10);
  const top10InTop20 = top10.filter((r) => actualTop20.has(r.id)).length;

  const bestCall = [...top10].sort((a, b) => b.actual - a.actual)[0] ?? null;
  const worstMiss =
    [...rows].sort((a, b) => b.p.xpts - b.actual - (a.p.xpts - a.actual))[0] ?? null;

  const brief = (r: { p: BacktestPrediction; actual: number } | null) =>
    r
      ? {
          name: r.p.name,
          team: r.p.team,
          predicted: Number(r.p.xpts.toFixed(1)),
          actual: r.actual,
        }
      : null;

  return {
    gw,
    scored_at: scoredAt,
    n,
    mae: Number(mae.toFixed(2)),
    bias: Number(bias.toFixed(2)),
    top10_in_top20: top10InTop20,
    best_call: brief(bestCall),
    worst_miss: brief(worstMiss),
  };
}

/** Server-side loader for the /backtest page (static render). */
export function loadBacktest(): BacktestFile | null {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'data', 'backtest.json'), 'utf-8');
    return BacktestFileSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
