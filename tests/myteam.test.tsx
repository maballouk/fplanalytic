import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MyTeam from '@/app/my-team/MyTeam';
import {
  bestUpgrade,
  pickDefconTeam,
  squadDefconTotal,
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
    next5: [{ event: 5, opponent: 'SUN', is_home: true, difficulty: 2 }],
    ...over,
  };
}

// Enough eligible outfielders for every formation attempt
const POOL: DefconFilePlayer[] = [
  ...Array.from({ length: 6 }, (_, i) =>
    player({ player_id: `d${i}`, name: `Def${i}`, team: `T${i}`, defcon_xpts: 2 - i * 0.1 })
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    player({
      player_id: `m${i}`,
      name: `Mid${i}`,
      team: `T${i}`,
      position: 'MID',
      defcon_xpts: 1.8 - i * 0.1,
    })
  ),
  ...Array.from({ length: 3 }, (_, i) =>
    player({
      player_id: `f${i}`,
      name: `Fwd${i}`,
      team: `U${i}`,
      position: 'FWD',
      defcon_xpts: 0.5 - i * 0.1,
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

describe('pickDefconTeam', () => {
  it('fields ten outfielders in a legal FPL formation, injured players excluded', () => {
    const team = pickDefconTeam([
      ...POOL,
      player({ player_id: 'hurt', defcon_xpts: 9, status: 'i' }),
    ]);
    expect(team).not.toBeNull();
    const [d, m, f] = team!.formation.split('-').map(Number);
    expect(d + m + f).toBe(10);
    expect(d).toBeGreaterThanOrEqual(3);
    expect(f).toBeGreaterThanOrEqual(1);
    const names = [...team!.def, ...team!.mid, ...team!.fwd].map((p) => p.player_id);
    expect(names).not.toContain('hurt');
  });
});

describe('squadDefconTotal / bestUpgrade', () => {
  const byId = new Map(POOL.map((p) => [p.player_id, p]));

  it('sums starters only, GK counts zero', () => {
    const picks = [
      pick({ id: 999, position: 'GKP', pick_position: 1 }),
      pick({ id: 1, name: 'Def0', pick_position: 2 }),
      pick({ id: 2, name: 'BenchGuy', pick_position: 12 }),
    ];
    const map = new Map([
      ['1', player({ player_id: '1', defcon_xpts: 1.5 })],
      ['2', player({ player_id: '2', defcon_xpts: 2 })],
    ]);
    expect(squadDefconTotal(picks, map)).toBeCloseTo(1.5);
  });

  it('suggests the biggest like-for-like upgrade among unowned players', () => {
    const picks = [pick({ id: 42, name: 'WeakDef', pick_position: 2 })]; // not in data: 0 xPts
    const up = bestUpgrade(picks, byId, POOL);
    expect(up).not.toBeNull();
    expect(up!.in.name).toBe('Def0'); // best unowned DEF
    expect(up!.gain).toBeCloseTo(2);
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
    render(<MyTeam players={POOL} defconTeam={pickDefconTeam(POOL)} />);
    await waitFor(() => expect(screen.getByText('Elmaestro XI')).toBeInTheDocument());
    expect(screen.getByText('Your XI')).toBeInTheDocument();
    expect(screen.getByText('The DEFCON XI')).toBeInTheDocument();
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
