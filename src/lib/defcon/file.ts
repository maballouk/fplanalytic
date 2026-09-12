// Shared schema, types and pure helpers for the DEFCON data files
// (public/data/defcon_gw{N}.json). Safe for client components; the fs-based
// loader lives in data.ts (server only).

import { z } from 'zod';
import type { DefconPosition } from './profile';

export const DefconFilePlayerSchema = z.object({
  rank: z.number(),
  player_id: z.string(),
  name: z.string(),
  team: z.string(),
  position: z.enum(['DEF', 'MID', 'FWD']),
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
  status: z.string(),
  next5: z.array(
    z.object({
      event: z.number().nullable(),
      opponent: z.string(),
      is_home: z.boolean(),
      difficulty: z.number(),
    })
  ),
});

export const DefconFileSchema = z.object({
  schema_version: z.number(),
  gw: z.number(),
  generated_at: z.string(),
  players: z.array(DefconFilePlayerSchema),
});

export type DefconFilePlayer = z.infer<typeof DefconFilePlayerSchema>;
export type DefconFile = z.infer<typeof DefconFileSchema>;

export function thresholdFor(position: DefconPosition): number {
  return position === 'DEF' ? 10 : 12;
}

export function meanNext5Fdr(player: DefconFilePlayer): number | null {
  if (player.next5.length === 0) return null;
  return player.next5.reduce((s, f) => s + f.difficulty, 0) / player.next5.length;
}
