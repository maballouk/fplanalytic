import { describe, expect, it } from 'vitest';
import { buildLivePayload } from '@/lib/defcon/live';
import type { Bootstrap, Fixture, Live } from '@/lib/fpl/schemas';

// Minimal fixtures for the pure payload builder (TASKS.md 1.6).

const bootstrap = {
  events: [
    {
      id: 3,
      name: 'Gameweek 3',
      is_current: true,
      is_next: false,
      finished: false,
      deadline_time: '',
    },
  ],
  teams: [
    { id: 1, code: 3, short_name: 'ARS', name: 'Arsenal' },
    { id: 2, code: 14, short_name: 'LIV', name: 'Liverpool' },
    { id: 3, code: 91, short_name: 'BOU', name: 'Bournemouth' },
  ].map((t) => ({
    ...t,
    strength_overall_home: 0,
    strength_overall_away: 0,
    strength_attack_home: 0,
    strength_attack_away: 0,
    strength_defence_home: 0,
    strength_defence_away: 0,
  })),
  elements: [
    { id: 10, web_name: 'Gabriel', team: 1, element_type: 2 }, // DEF, playing
    { id: 11, web_name: 'Rice', team: 1, element_type: 3 }, // MID, playing
    { id: 12, web_name: 'Bench', team: 1, element_type: 2 }, // 0 minutes
    { id: 13, web_name: 'Kepa', team: 1, element_type: 1 }, // GK, excluded
    { id: 14, web_name: 'Brooks', team: 3, element_type: 3 }, // team not playing
  ].map((e) => ({
    ...e,
    first_name: '',
    second_name: '',
    now_cost: 50,
    minutes: 0,
    starts: 1,
    form: '0',
    selected_by_percent: '0',
    status: 'a',
    chance_of_playing_next_round: null,
    clearances_blocks_interceptions: 0,
    tackles: 0,
    recoveries: 0,
    defensive_contribution: 0,
  })),
} as unknown as Bootstrap;

const fixtures = [
  {
    id: 100,
    event: 3,
    kickoff_time: '2026-09-12T14:00:00Z',
    team_h: 1,
    team_a: 2,
    team_h_score: 1,
    team_a_score: 0,
    team_h_difficulty: 3,
    team_a_difficulty: 3,
    finished: false,
    started: true,
  },
  {
    id: 101,
    event: 3,
    kickoff_time: '2026-09-13T15:30:00Z',
    team_h: 3,
    team_a: 1,
    team_h_difficulty: 3,
    team_a_difficulty: 3,
    finished: false,
    started: false,
  },
] as unknown as Fixture[];

const live: Live = {
  elements: [
    {
      id: 10,
      stats: {
        minutes: 60,
        total_points: 2,
        clearances_blocks_interceptions: 6,
        tackles: 2,
        recoveries: 3,
        defensive_contribution: 8,
        goals_scored: 0,
        assists: 0,
        bonus: 0,
      },
    },
    {
      id: 11,
      stats: {
        minutes: 60,
        total_points: 2,
        clearances_blocks_interceptions: 5,
        tackles: 2,
        recoveries: 4,
        defensive_contribution: 11,
        goals_scored: 1,
        assists: 0,
        bonus: 0,
      },
    },
    {
      id: 12,
      stats: {
        minutes: 0,
        total_points: 0,
        clearances_blocks_interceptions: 0,
        tackles: 0,
        recoveries: 0,
        defensive_contribution: 0,
        goals_scored: 0,
        assists: 0,
        bonus: 0,
      },
    },
  ],
};

const NOW = new Date('2026-09-12T15:00:00Z');

describe('buildLivePayload', () => {
  const payload = buildLivePayload(bootstrap, fixtures, live, NOW);

  it('includes the whole current GW: started with scores, upcoming with kickoff', () => {
    expect(payload.gw).toBe(3);
    expect(payload.fixtures).toHaveLength(2); // the match grid shows both
    expect(payload.fixtures[0]).toMatchObject({
      id: 100,
      home: 'ARS',
      away: 'LIV',
      home_score: 1,
      away_score: 0,
      started: true,
      finished: false,
    });
    expect(payload.fixtures[1]).toMatchObject({
      id: 101,
      started: false,
      kickoff_time: '2026-09-13T15:30:00Z',
    });
  });

  it('includes only outfielders with minutes in a live fixture', () => {
    expect(payload.players.map((p) => p.name).sort()).toEqual(['Gabriel', 'Rice']);
  });

  it('sorts closest to threshold first (MID 11/12 beats DEF 8/10)', () => {
    expect(payload.players[0].name).toBe('Rice'); // 1 away
    expect(payload.players[0].actions).toBe(11);
    expect(payload.players[1].name).toBe('Gabriel'); // 2 away
  });

  it('reports the next kickoff for the empty state', () => {
    expect(payload.next_kickoff).toMatchObject({
      label: 'BOU v ARS',
      kickoff_time: '2026-09-13T15:30:00Z',
      home: 'BOU',
      away: 'ARS',
    });
  });

  it('final whistle (finished_provisional) reads as FT even before bonus confirms', () => {
    // 2026-09-19 regression: the GW5 opener ran past midnight and sat on
    // "LIVE 90'" — a provisionally finished fixture must group as full time.
    const provisional = [
      { ...fixtures[0], finished: false, finished_provisional: true },
    ] as unknown as Fixture[];
    const p = buildLivePayload(bootstrap, provisional, live, NOW);
    expect(p.fixtures[0].finished).toBe(true);
  });

  it('handles no live data at all', () => {
    const empty = buildLivePayload(bootstrap, [], null, NOW);
    expect(empty.fixtures).toEqual([]);
    expect(empty.players).toEqual([]);
    expect(empty.next_kickoff).toBeNull();
  });
});
