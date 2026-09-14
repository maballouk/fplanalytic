import { describe, expect, it } from 'vitest';
import { scoreGw, type BacktestPrediction } from '@/lib/defcon/backtest';

// Pure grading logic for the public report card (TASKS.md 1.5.7).

const pred = (name: string, xpts: number): BacktestPrediction => ({
  name,
  team: 'ARS',
  position: 'MID',
  xpts,
});

describe('scoreGw', () => {
  const predictions = {
    '1': pred('Big', 8),
    '2': pred('Mid', 5),
    '3': pred('Small', 3),
    '4': pred('Benched', 6), // 0 minutes: excluded
  };
  const actuals = new Map([
    ['1', { points: 10, minutes: 90 }],
    ['2', { points: 2, minutes: 90 }],
    ['3', { points: 3, minutes: 60 }],
    ['4', { points: 0, minutes: 0 }],
  ]);
  const r = scoreGw(5, predictions, actuals, '2026-09-20T00:00:00Z');

  it('excludes zero-minute players and computes MAE and bias', () => {
    expect(r.n).toBe(3);
    // errors: |8-10|=2, |5-2|=3, |3-3|=0 -> MAE 5/3
    expect(r.mae).toBeCloseTo(1.67, 2);
    // bias: (-2 + 3 + 0)/3
    expect(r.bias).toBeCloseTo(0.33, 2);
  });

  it('names the best call from our top picks and the worst over-promise', () => {
    expect(r.best_call?.name).toBe('Big'); // top-predicted, scored 10
    expect(r.best_call?.actual).toBe(10);
    expect(r.worst_miss?.name).toBe('Mid'); // predicted 5, scored 2
  });

  it('counts our predicted top 10 landing in the actual top 20', () => {
    expect(r.top10_in_top20).toBe(3); // tiny sample: everyone is in both
  });
});
