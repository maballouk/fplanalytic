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
    xpts_total: 4.5,
    xpts_breakdown: {},
    p_start: 0.9,
    form5: 4,
    elite_own: 0.2,
    elite_cap: 0,
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
  // The data file arrives sorted by predicted points, so array order is rank
  const players = [
    player({ player_id: 'buy', name: 'Haaland', xpts_total: 6.4, form5: 8.2 }),
    player({
      player_id: 'diff',
      name: 'Mendy',
      xpts_total: 5.1,
      ownership: 3.1,
      elite_own: 0.05,
      price: 4.1,
    }),
    player({
      player_id: 'trap',
      name: 'Senesi',
      xpts_total: 4.9,
      elite_own: 0.4,
      next5: [
        { event: 5, opponent: 'LIV', is_home: false, difficulty: 4 },
        { event: 6, opponent: 'MCI', is_home: true, difficulty: 5 },
      ],
    }),
    player({ player_id: 'rookie', name: 'OneGame', matches_considered: 1, xpts_total: 9 }),
    player({ player_id: 'injured', name: 'Crocked', status: 'i', xpts_total: 9 }),
  ];
  const brief = pickBrief(players);

  it('picks the top eligible player as the buy, skipping small samples and flags', () => {
    expect(brief.buy?.player.name).toBe('Haaland');
    expect(brief.buy?.reason).toBe('Predicted 6.4 pts next GW, form 8.2. Soft run next.');
  });

  it('picks a differential the top 50 have not caught yet', () => {
    expect(brief.differential?.player.name).toBe('Mendy');
    expect(brief.differential?.reason).toBe(
      'Predicted 5.1 pts, owned by 5% of the top 50 and 3.1% overall.'
    );
  });

  it('picks an elite favourite with a tough run as the trap', () => {
    expect(brief.trap?.player.name).toBe('Senesi');
    expect(brief.trap?.reason).toContain('Owned by 40% of the top 50');
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
