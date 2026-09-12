import { describe, expect, it } from 'vitest';
import { buildLedger, inLiveWindow, pickBrief, pickState } from '@/lib/defcon/brief';
import type { Calendar, DefconFilePlayer } from '@/lib/defcon/file';

function player(over: Partial<DefconFilePlayer>): DefconFilePlayer {
  return {
    rank: 1,
    player_id: '1',
    code: 1,
    team_code: 3,
    name: 'Player',
    team: 'ARS',
    position: 'DEF',
    price: 5,
    matches_considered: 3,
    hit_rate: 0.7,
    mean_actions: 10,
    near_miss_rate: 0.2,
    consistency: 0.8,
    defcon_xpts: 1.4,
    value_per_million: 0.28,
    last5_actions: [10, 11, 9],
    minutes: 270,
    ownership: 15,
    status: 'a',
    next5: [{ event: 5, opponent: 'SUN', is_home: true, difficulty: 2 }],
    ...over,
  };
}

const CAL: Calendar = {
  gw: 4,
  gw_finished: false,
  first_kickoff: '2026-09-12T14:00:00Z',
  last_kickoff: '2026-09-14T19:00:00Z',
  next_gw: 5,
  next_deadline: '2026-09-18T17:30:00Z',
};

describe('pickBrief', () => {
  const players = [
    player({ player_id: 'buy', name: 'Gabriel', hit_rate: 0.8 }),
    player({
      player_id: 'diff',
      name: 'Mendy',
      ownership: 3.1,
      value_per_million: 0.49,
      price: 4.1,
    }),
    player({
      player_id: 'trap',
      name: 'Senesi',
      hit_rate: 0.9,
      next5: [
        { event: 5, opponent: 'LIV', is_home: false, difficulty: 4 },
        { event: 6, opponent: 'MCI', is_home: true, difficulty: 5 },
      ],
    }),
    player({ player_id: 'rookie', name: 'OneGame', matches_considered: 1, hit_rate: 1 }),
    player({ player_id: 'injured', name: 'Crocked', status: 'i', hit_rate: 1 }),
  ];
  const brief = pickBrief(players);

  it('picks the top eligible buy, skipping small samples and flags', () => {
    expect(brief.buy?.player.name).toBe('Gabriel');
    expect(brief.buy?.reason).toContain('10+ actions');
  });

  it('picks a low-ownership differential with the value reason', () => {
    expect(brief.differential?.player.name).toBe('Mendy');
    expect(brief.differential?.reason).toBe('70% hit rate at £4.1m, 3.1% owned.');
  });

  it('picks a strong profile with a tough run as the trap', () => {
    expect(brief.trap?.player.name).toBe('Senesi');
    expect(brief.trap?.reason).toContain('2 of the next 2 are rated 4 or worse. Wait.');
  });

  it('returns nulls rather than bad calls when nothing qualifies', () => {
    const thin = pickBrief([player({ matches_considered: 1 })]);
    expect(thin.buy).toBeNull();
    expect(thin.differential).toBeNull();
    expect(thin.trap).toBeNull();
  });
});

describe('pickState', () => {
  const t = (iso: string) => Date.parse(iso);

  it('live beats everything', () => {
    expect(pickState(CAL, t('2026-09-18T17:00:00Z'), true)).toBe('live');
  });

  it('deadline inside 24 hours', () => {
    expect(pickState(CAL, t('2026-09-18T10:00:00Z'), false)).toBe('deadline');
    expect(pickState(CAL, t('2026-09-16T10:00:00Z'), false)).toBe('planning');
  });

  it('review within 48h of a finished gameweek', () => {
    const done = { ...CAL, gw_finished: true };
    expect(pickState(done, t('2026-09-15T10:00:00Z'), false)).toBe('review');
    expect(pickState(done, t('2026-09-17T10:00:00Z'), false)).toBe('planning'); // >48h
  });

  it('planning without a calendar', () => {
    expect(pickState(undefined, Date.now(), false)).toBe('planning');
  });
});

describe('inLiveWindow', () => {
  const t = (iso: string) => Date.parse(iso);
  it('opens 15 minutes before first kickoff, closes 3h after the last', () => {
    expect(inLiveWindow(CAL, t('2026-09-12T13:50:00Z'))).toBe(true);
    expect(inLiveWindow(CAL, t('2026-09-12T13:40:00Z'))).toBe(false);
    expect(inLiveWindow(CAL, t('2026-09-14T21:30:00Z'))).toBe(true);
    expect(inLiveWindow(CAL, t('2026-09-14T22:30:00Z'))).toBe(false);
  });
});

describe('buildLedger', () => {
  it('splits banked and near-missed by the last qualifying match', () => {
    const ledger = buildLedger([
      player({ player_id: 'a', name: 'Banked', last5_actions: [8, 14] }),
      player({ player_id: 'b', name: 'Near', last5_actions: [12, 9] }),
      player({ player_id: 'c', name: 'Quiet', last5_actions: [4] }),
    ]);
    expect(ledger.banked.map((x) => x.player.name)).toEqual(['Banked']);
    expect(ledger.nearMissed.map((x) => x.player.name)).toEqual(['Near']);
  });
});
