import { z } from 'zod';

// Minimal, typed views of the official FPL API. We validate only the fields the
// app consumes; unknown fields are ignored so upstream additions never break us.
// DEFCON field names verified against the live API on 2026-09-12 (docs/ARCHITECTURE.md §5):
// clearances_blocks_interceptions, tackles, recoveries, defensive_contribution.

export const ElementSchema = z.object({
  id: z.number(),
  code: z.number(), // stable photo id: resources.premierleague.com .../p{code}.png
  web_name: z.string(),
  first_name: z.string(),
  second_name: z.string(),
  team: z.number(),
  element_type: z.number(), // 1 GKP · 2 DEF · 3 MID · 4 FWD (map via bootstrap element_types)
  now_cost: z.number(), // price * 10
  minutes: z.number(),
  starts: z.number(),
  form: z.string(),
  selected_by_percent: z.string(),
  status: z.string(), // a=available, d=doubtful, i=injured, s=suspended, u=unavailable
  chance_of_playing_next_round: z.number().nullable(),
  // Season DEFCON totals (per-match values live in element-summary history)
  clearances_blocks_interceptions: z.number(),
  tackles: z.number(),
  recoveries: z.number(),
  defensive_contribution: z.number(),
});

export const TeamSchema = z.object({
  id: z.number(),
  code: z.number(), // stable badge id: resources.premierleague.com .../t{code}.png
  name: z.string(),
  short_name: z.string(),
  strength_overall_home: z.number(),
  strength_overall_away: z.number(),
  strength_attack_home: z.number(),
  strength_attack_away: z.number(),
  strength_defence_home: z.number(),
  strength_defence_away: z.number(),
});

export const EventSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_current: z.boolean(),
  is_next: z.boolean(),
  finished: z.boolean(),
  deadline_time: z.string(),
});

export const BootstrapSchema = z.object({
  events: z.array(EventSchema),
  teams: z.array(TeamSchema),
  elements: z.array(ElementSchema),
});

export const FixtureSchema = z.object({
  id: z.number(),
  event: z.number().nullable(),
  kickoff_time: z.string().nullable(),
  team_h: z.number(),
  team_a: z.number(),
  team_h_score: z.number().nullable().optional(),
  team_a_score: z.number().nullable().optional(),
  team_h_difficulty: z.number(),
  team_a_difficulty: z.number(),
  finished: z.boolean(),
  started: z.boolean().nullable().optional(),
});

export const FixturesSchema = z.array(FixtureSchema);

// element-summary/{id}: per-match history. `defensive_contribution` here is the
// position-aware composite for the match (DEF: CBIT+tackles; MID/FWD: +recoveries),
// NOT the points awarded.
export const ElementHistorySchema = z.object({
  element: z.number(),
  round: z.number(),
  minutes: z.number(),
  total_points: z.number(),
  opponent_team: z.number(),
  was_home: z.boolean(),
  goals_scored: z.number(),
  assists: z.number(),
  clean_sheets: z.number(),
  saves: z.number(),
  bonus: z.number(),
  clearances_blocks_interceptions: z.number(),
  tackles: z.number(),
  recoveries: z.number(),
  defensive_contribution: z.number(),
});

export const ElementSummarySchema = z.object({
  history: z.array(ElementHistorySchema),
  fixtures: z.array(
    z.object({
      event: z.number().nullable(),
      is_home: z.boolean(),
      difficulty: z.number(),
      team_h: z.number(),
      team_a: z.number(),
    })
  ),
});

// event/{gw}/live: per-player in-play stats for the live DEFCON tracker.
export const LiveElementSchema = z.object({
  id: z.number(),
  stats: z.object({
    minutes: z.number(),
    total_points: z.number(),
    clearances_blocks_interceptions: z.number(),
    tackles: z.number(),
    recoveries: z.number(),
    defensive_contribution: z.number(),
  }),
});

export const LiveSchema = z.object({
  elements: z.array(LiveElementSchema),
});

// entry/{id}/ and entry/{id}/event/{gw}/picks/: a manager's public team.
export const EntrySchema = z.object({
  id: z.number(),
  name: z.string(), // team name
  player_first_name: z.string(),
  player_last_name: z.string(),
  summary_overall_points: z.number().nullable(),
  summary_overall_rank: z.number().nullable(),
});

export const EntryPicksSchema = z.object({
  picks: z.array(
    z.object({
      element: z.number(),
      position: z.number(), // 1-11 starters, 12-15 bench
      multiplier: z.number(), // 0 benched, 1, 2 captain, 3 triple captain
      is_captain: z.boolean(),
      is_vice_captain: z.boolean(),
    })
  ),
});

export type Entry = z.infer<typeof EntrySchema>;
export type EntryPicks = z.infer<typeof EntryPicksSchema>;

export type Element = z.infer<typeof ElementSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Bootstrap = z.infer<typeof BootstrapSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
export type ElementHistory = z.infer<typeof ElementHistorySchema>;
export type ElementSummary = z.infer<typeof ElementSummarySchema>;
export type Live = z.infer<typeof LiveSchema>;
