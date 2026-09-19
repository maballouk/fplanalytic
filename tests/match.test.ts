import { describe, expect, it } from 'vitest';
import { buildMatchPayload } from '@/lib/fpl/match';
import type { Bootstrap, Fixture, Live } from '@/lib/fpl/schemas';

// Pure Match Centre builder: phases, event extraction, squads and team news.

const bootstrap = {
  events: [
    { id: 3, name: 'GW3', is_current: true, is_next: false, finished: false, deadline_time: '' },
  ],
  teams: [
    { id: 1, code: 3, short_name: 'ARS', name: 'Arsenal' },
    { id: 2, code: 14, short_name: 'LIV', name: 'Liverpool' },
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
    { id: 10, web_name: 'Gabriel', team: 1, element_type: 2, news: '', form: '6.0', starts: 3 },
    { id: 11, web_name: 'Rice', team: 1, element_type: 3, news: '', form: '5.1', starts: 3 },
    {
      id: 20,
      web_name: 'Salah',
      team: 2,
      element_type: 3,
      news: 'Knock - 75% chance of playing',
      form: '8.2',
      starts: 3,
    },
    { id: 21, web_name: 'Alisson', team: 2, element_type: 1, news: '', form: '4.0', starts: 3 },
  ].map((e) => ({
    ...e,
    code: e.id,
    first_name: '',
    second_name: '',
    now_cost: 50,
    cost_change_event: 0,
    minutes: 0,
    selected_by_percent: '0',
    status: 'a',
    chance_of_playing_next_round: null,
    clearances_blocks_interceptions: 0,
    tackles: 0,
    recoveries: 0,
    defensive_contribution: 0,
  })),
} as unknown as Bootstrap;

const baseFixture = {
  id: 100,
  event: 3,
  kickoff_time: '2026-09-12T14:00:00Z',
  team_h: 1,
  team_a: 2,
  team_h_score: 2,
  team_a_score: 1,
  team_h_difficulty: 3,
  team_a_difficulty: 3,
  minutes: 63,
  stats: [
    {
      identifier: 'goals_scored',
      h: [{ value: 2, element: 10 }],
      a: [{ value: 1, element: 20 }],
    },
    { identifier: 'assists', h: [{ value: 1, element: 11 }], a: [] },
    { identifier: 'yellow_cards', h: [], a: [{ value: 1, element: 20 }] },
    { identifier: 'bonus', h: [{ value: 3, element: 10 }], a: [] },
  ],
} as unknown as Fixture;

const live: Live = {
  elements: [10, 11, 20].map((id) => ({
    id,
    stats: {
      minutes: 63,
      total_points: id === 10 ? 15 : 5,
      clearances_blocks_interceptions: 6,
      tackles: 2,
      recoveries: 3,
      defensive_contribution: id === 10 ? 8 : 11,
      goals_scored: id === 10 ? 2 : id === 20 ? 1 : 0,
      assists: id === 11 ? 1 : 0,
      bonus: 0,
    },
  })),
};

describe('buildMatchPayload', () => {
  it('live phase: score, minute, events without bonus ordering concerns, squads by points', () => {
    const p = buildMatchPayload(
      bootstrap,
      { ...baseFixture, started: true, finished: false } as Fixture,
      live
    );
    expect(p.phase).toBe('live');
    expect(p.home.score).toBe(2);
    expect(p.minutes).toBe(63);
    expect(p.events).toContainEqual({ type: 'goal', side: 'h', name: 'Gabriel', value: 2 });
    expect(p.events).toContainEqual({ type: 'yellow', side: 'a', name: 'Salah', value: 1 });
    expect(p.squads.h[0].name).toBe('Gabriel'); // most points first
    expect(p.squads.h[0].threshold).toBe(10);
    expect(p.team_news.a).toEqual([{ name: 'Salah', news: 'Knock - 75% chance of playing' }]);
  });

  it('pre phase: no squads, ones to watch by form', () => {
    const p = buildMatchPayload(
      bootstrap,
      { ...baseFixture, started: false, finished: false, stats: [], minutes: 0 } as Fixture,
      null
    );
    expect(p.phase).toBe('pre');
    expect(p.squads.h).toEqual([]);
    expect(p.watch.a[0].name).toBe('Salah'); // 8.2 form leads
    expect(p.watch.h[0].name).toBe('Gabriel');
  });

  it('post phase: the provisional whistle is enough (bonus lag must not read as live)', () => {
    const p = buildMatchPayload(
      bootstrap,
      { ...baseFixture, started: true, finished: false, finished_provisional: true } as Fixture,
      live
    );
    expect(p.phase).toBe('post');
  });

  it('post phase: finished flag wins and bonus events survive', () => {
    const p = buildMatchPayload(
      bootstrap,
      { ...baseFixture, started: true, finished: true } as Fixture,
      live
    );
    expect(p.phase).toBe('post');
    expect(p.events).toContainEqual({ type: 'bonus', side: 'h', name: 'Gabriel', value: 3 });
  });
});
