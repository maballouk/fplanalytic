// Shared schema/types/helpers for the engine's UCL prediction files
// (public/data/ucl_md{N}.json, written by engine/ per TASKS.md 1.5.1/1.5.4).
// Client-safe: the fs loader lives in loadMatchday.ts.

import { z } from 'zod';

export const UclFixtureSchema = z.object({
  home: z.string(),
  away: z.string(),
  xg_home: z.number(),
  xg_away: z.number(),
  p_home: z.number(),
  p_draw: z.number(),
  p_away: z.number(),
  p_cs_home: z.number(),
  p_cs_away: z.number(),
  most_likely_score: z.string(),
  kickoff_utc: z.string(),
});

export const UclPlayerSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  team: z.string(),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
  price: z.number(),
  opponent: z.string(),
  is_home: z.boolean(),
  p_plays: z.number(),
  xpts: z.number(),
  xpts_per_million: z.number(),
  // Consensus from UEFA's own game: % of ALL managers holding the player and
  // this matchday's transfer balance (in minus out). Older files lack them.
  sel_per: z.number().default(0),
  transfer_balance: z.number().default(0),
  breakdown: z.record(z.string(), z.number()),
});

export const UclMatchdaySchema = z.object({
  matchday: z.number(),
  generated_at: z.string(),
  model: z.object({
    type: z.string(),
    n_matches_fit: z.number(),
  }),
  fixtures: z.array(UclFixtureSchema),
  players: z.array(UclPlayerSchema),
  notes: z.array(z.string()),
});

export type UclFixture = z.infer<typeof UclFixtureSchema>;
export type UclPlayer = z.infer<typeof UclPlayerSchema>;
export type UclMatchday = z.infer<typeof UclMatchdaySchema>;

/** Top breakdown contributors for the chips, largest first, noise filtered. */
export function topContributors(
  breakdown: Record<string, number>,
  limit = 3
): { label: string; value: number }[] {
  const LABELS: Record<string, string> = {
    goals: 'G',
    assists: 'A',
    clean_sheet: 'CS',
    saves: 'SAV',
    recoveries: 'REC',
    potm: 'POTM',
  };
  return Object.entries(breakdown)
    .filter(([k, v]) => LABELS[k] !== undefined && v >= 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k, v]) => ({ label: LABELS[k], value: v }));
}
