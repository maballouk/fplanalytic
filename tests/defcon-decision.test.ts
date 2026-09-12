import { describe, expect, it } from 'vitest';
import { decide, hasMinutesRisk } from '@/lib/defcon/decision';

// TASKS.md 1.4: Buy if hit_rate >= 0.6 and next-5 mean FDR <= 3;
// Hold if 0.4-0.6; Avoid if < 0.4 or minutes risk.

const base = {
  threshold: 10,
  last5Actions: [10, 12, 9, 11, 10],
  meanNext5Fdr: 2.8,
  status: 'a',
};

describe('decide', () => {
  it('Buy: strong hit rate and soft run', () => {
    const d = decide({ ...base, hitRate: 0.7 });
    expect(d.verdict).toBe('Buy');
    expect(d.reason).toBe('4 of last 5 with 10+ actions. Even run next.');
  });

  it('Buy boundary: exactly 0.6 and FDR exactly 3', () => {
    expect(decide({ ...base, hitRate: 0.6, meanNext5Fdr: 3 }).verdict).toBe('Buy');
  });

  it('Hold: middling hit rate', () => {
    expect(decide({ ...base, hitRate: 0.5 }).verdict).toBe('Hold');
  });

  it('Hold: strong engine but tough run', () => {
    const d = decide({ ...base, hitRate: 0.8, meanNext5Fdr: 3.8 });
    expect(d.verdict).toBe('Hold');
    expect(d.reason).toContain('Tough run next.');
  });

  it('Avoid: hit rate below 0.4', () => {
    const d = decide({ ...base, hitRate: 0.3, last5Actions: [5, 6, 4, 7, 5] });
    expect(d.verdict).toBe('Avoid');
    expect(d.reason).toContain('Hit rate too low.');
  });

  it('Avoid: minutes risk beats a strong profile', () => {
    const d = decide({ ...base, hitRate: 0.9, status: 'i' });
    expect(d.verdict).toBe('Avoid');
    expect(d.reason).toContain('Minutes risk: injured.');
  });

  it('handles a player with no upcoming fixtures', () => {
    const d = decide({ ...base, hitRate: 0.7, meanNext5Fdr: null });
    expect(d.verdict).toBe('Hold'); // cannot be a Buy without a run to judge
    expect(d.reason).toContain('No upcoming fixtures.');
  });
});

describe('hasMinutesRisk', () => {
  it('flags every non-available status', () => {
    expect(hasMinutesRisk('a')).toBe(false);
    for (const s of ['d', 'i', 's', 'u']) expect(hasMinutesRisk(s)).toBe(true);
  });
});
