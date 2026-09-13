// Shared schema, types and pure helpers for the DEFCON data files
// (public/data/defcon_gw{N}.json). Safe for client components; the fs-based
// loader lives in data.ts (server only).

import { z } from 'zod';
import type { DefconPosition } from './profile';

export const DefconFilePlayerSchema = z.object({
  rank: z.number(),
  player_id: z.string(),
  code: z.number(), // PL media id for the player photo
  team_code: z.number(), // PL media id for the club badge
  name: z.string(),
  team: z.string(),
  position: z.enum(['GK', 'DEF', 'MID', 'FWD']),
  price: z.number(),
  matches_considered: z.number(),
  hit_rate: z.number(),
  mean_actions: z.number(),
  near_miss_rate: z.number(),
  consistency: z.number(),
  defcon_xpts: z.number(),
  value_per_million: z.number(),
  last5_actions: z.array(z.number()),
  minutes: z.number(),
  ownership: z.number().default(0), // selected_by_percent, e.g. 12.3
  status: z.string(),
  // Total predicted FPL points for the NEXT gameweek (lib/fpl/xpts.ts v1)
  xpts_total: z.number().default(0),
  xpts_breakdown: z.record(z.string(), z.number()).default({}),
  p_start: z.number().default(0),
  /** Average actual FPL points over the last 5 appearances */
  form5: z.number().default(0),
  /** Share of the world's top 50 managers who own / captain this player */
  elite_own: z.number().default(0),
  elite_cap: z.number().default(0),
  next5: z.array(
    z.object({
      event: z.number().nullable(),
      opponent: z.string(),
      is_home: z.boolean(),
      difficulty: z.number(),
    })
  ),
});

export const CalendarSchema = z.object({
  gw: z.number(),
  gw_finished: z.boolean(),
  first_kickoff: z.string().nullable(),
  last_kickoff: z.string().nullable(),
  next_gw: z.number().nullable(),
  next_deadline: z.string(),
});

export const DefconFileSchema = z.object({
  schema_version: z.number(),
  gw: z.number(),
  generated_at: z.string(),
  calendar: CalendarSchema.optional(),
  players: z.array(DefconFilePlayerSchema),
});

export type Calendar = z.infer<typeof CalendarSchema>;

export type DefconFilePlayer = z.infer<typeof DefconFilePlayerSchema>;
export type DefconFile = z.infer<typeof DefconFileSchema>;

export function thresholdFor(position: DefconPosition): number {
  return position === 'DEF' ? 10 : 12;
}

export function meanNext5Fdr(player: DefconFilePlayer): number | null {
  if (player.next5.length === 0) return null;
  return player.next5.reduce((s, f) => s + f.difficulty, 0) / player.next5.length;
}

/** Next-match difficulty in the product's language (legacy card's Easy/Hard read). */
export function difficultyWord(fdr: number): 'Soft' | 'Even' | 'Tough' {
  if (fdr <= 2) return 'Soft';
  if (fdr >= 4) return 'Tough';
  return 'Even';
}
