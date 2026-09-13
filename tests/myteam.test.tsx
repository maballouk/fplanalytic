import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyTeam from '@/app/my-team/MyTeam';
import {
  bestUpgrade,
  pickPredictedTeam,
  squadPredictedTotal,
  type EntryPickView,
} from '@/lib/defcon/myteam';
import type { DefconFilePlayer } from '@/lib/defcon/file';

function player(over: Partial<DefconFilePlayer>): DefconFilePlayer {
  return {
    rank: 1,
    player_id: '1',
    code: 199798,
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

// Enough eligible players in every position for every formation attempt
const POOL: DefconFilePlayer[] = [
  player({ player_id: 'g0', name: 'Keeper0', team: 'GA', position: 'GK', xpts_total: 4.5 }),
  player({ player_id: 'g1', name: 'Keeper1', team: 'GB', position: 'GK', xpts_total: 4.0 }),
  ...Array.from({ length: 6 }, (_, i) =>
    player({ player_id: `d${i}`, name: `Def${i}`, team: `T${i}`, xpts_total: 5 - i * 0.1 })
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    player({
      player_id: `m${i}`,
      name: `Mid${i}`,
      team: `T${i}`,
      position: 'MID',
      xpts_total: 4.8 - i * 0.1,
    })
  ),
  ...Array.from({ length: 3 }, (_, i) =>
    player({
      player_id: `f${i}`,
      name: `Fwd${i}`,
      team: `U${i}`,
      position: 'FWD',
      xpts_total: 3.5 - i * 0.1,
    })
  ),
];

const pick = (over: Partial<EntryPickView>): EntryPickView => ({
  id: 1,
  name: 'Mine',
  code: 199798,
  team: 'ARS',
  team_code: 3,
  position: 'DEF',
  pick_position: 2,
  is_captain: false,
  status: 'a',
  ...over,
});

describe('pickPredictedTeam', () => {
  it('fields a goalkeeper plus ten outfielders; injured and rotation risks excluded', () => {
    const team = pickPredictedTeam([
      ...POOL,
      player({ player_id: 'hurt', xpts_total: 9, status: 'i' }),
      player({ player_id: 'benchwarmer', xpts_total: 9, p_start: 0.3 }),
    ]);
    expect(team).not.toBeNull();
    expect(team!.gk.position).toBe('GK');
    expect(team!.gk.name).toBe('Keeper0'); // higher predicted of the two
    const [d, m, f] = team!.formation.split('-').map(Number);
    expect(d + m + f).toBe(10);
    expect(d).toBeGreaterThanOrEqual(3);
    expect(f).toBeGreaterThanOrEqual(1);
    const ids = [team!.gk, ...team!.def, ...team!.mid, ...team!.fwd].map((p) => p.player_id);
    expect(ids).not.toContain('hurt');
    expect(ids).not.toContain('benchwarmer');
    expect(ids).toHaveLength(11);
  });
});

describe('squadPredictedTotal / bestUpgrade', () => {
  const byId = new Map(POOL.map((p) => [p.player_id, p]));

  it('sums starters only, goalkeeper included', () => {
    const picks = [
      pick({ id: 999, position: 'GKP', pick_position: 1 }),
      pick({ id: 1, name: 'Def0', pick_position: 2 }),
      pick({ id: 2, name: 'BenchGuy', pick_position: 12 }),
    ];
    const map = new Map([
      ['999', player({ player_id: '999', position: 'GK', xpts_total: 4 })],
      ['1', player({ player_id: '1', xpts_total: 4.2 })],
      ['2', player({ player_id: '2', xpts_total: 5 })],
    ]);
    expect(squadPredictedTotal(picks, map)).toBeCloseTo(8.2);
  });

  it('suggests the biggest like-for-like upgrade among unowned likely starters', () => {
    const picks = [pick({ id: 42, name: 'WeakDef', pick_position: 2 })]; // not in data: 0 pts
    const up = bestUpgrade(picks, byId, POOL);
    expect(up).not.toBeNull();
    expect(up!.in.name).toBe('Def0'); // best unowned DEF
    expect(up!.gain).toBeCloseTo(5);
  });

  it('can upgrade the goalkeeper too', () => {
    const picks = [pick({ id: 43, name: 'WeakKeeper', position: 'GKP', pick_position: 1 })];
    const up = bestUpgrade(picks, byId, POOL);
    expect(up).not.toBeNull();
    expect(up!.in.name).toBe('Keeper0');
  });
});

describe('MyTeam component', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('loads a saved team automatically and renders both pitches', async () => {
    localStorage.setItem('fpla_team_id', '123');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          gw: 4,
          entry: { id: 123, team_name: 'Elmaestro XI', manager: 'Mo B', overall_rank: 5000 },
          picks: [
            pick({ id: 900, name: 'Keeper', position: 'GKP', pick_position: 1 }),
            pick({ id: 901, name: 'MyDef', pick_position: 2, is_captain: true }),
            pick({ id: 902, name: 'Benchy', pick_position: 12 }),
          ],
        }),
      }))
    );
    render(<MyTeam players={POOL} defconTeam={pickPredictedTeam(POOL)} />);
    await waitFor(() => expect(screen.getByText('Elmaestro XI')).toBeInTheDocument());
    expect(screen.getByText('Your XI')).toBeInTheDocument();
    expect(screen.getByText('The predicted XI')).toBeInTheDocument();
    expect(screen.getByText('Keeper0')).toBeInTheDocument(); // GK on the tool's pitch
    expect(screen.getByText('MyDef')).toBeInTheDocument();
    expect(screen.getByTitle('Captain')).toBeInTheDocument();
    expect(screen.getByText('Benchy')).toBeInTheDocument();
    expect(screen.getByText('BIGGEST UPGRADE')).toBeInTheDocument();
  });

  it('shows the not-found state for a bad ID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    );
    render(<MyTeam players={POOL} defconTeam={null} />);
    fireEvent.change(screen.getByLabelText('Your FPL team ID'), { target: { value: '99999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyse my team' }));
    await waitFor(() => expect(screen.getByText('No team with that ID.')).toBeInTheDocument());
  });
});
