import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import AssetFinder from '@/app/AssetFinder';
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
    next5: [{ event: 4, opponent: 'SUN', is_home: true, difficulty: 2 }],
    ...over,
  };
}

const PLAYERS = [
  player({ player_id: '1', name: 'Konsa', position: 'DEF', hit_rate: 0.9, defcon_xpts: 1.8 }),
  player({ player_id: '2', name: 'Adams', team: 'BOU', position: 'MID', defcon_xpts: 1.5 }),
  player({
    player_id: '3',
    name: 'Wood',
    team: 'NFO',
    position: 'FWD',
    defcon_xpts: 0.4,
    hit_rate: 0.2,
    last5_actions: [4, 5, 6],
  }),
];

describe('AssetFinder', () => {
  // Filters write to the URL; jsdom shares location across tests
  beforeEach(() => window.history.replaceState(null, '', '/'));

  it('renders all players sorted by xPts by default', () => {
    render(<AssetFinder players={PLAYERS} />);
    const rows = screen.getAllByRole('row').slice(1); // skip header
    expect(within(rows[0]).getByText('Konsa')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Adams')).toBeInTheDocument();
  });

  it('filters by position', () => {
    render(<AssetFinder players={PLAYERS} />);
    fireEvent.click(screen.getByRole('tab', { name: 'MID' }));
    expect(screen.getByText('Adams')).toBeInTheDocument();
    expect(screen.queryByText('Konsa')).not.toBeInTheDocument();
  });

  it('shows the approved empty state when filters exclude everyone', () => {
    render(<AssetFinder players={PLAYERS} />);
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '4' } });
    expect(screen.getByText('No players match these filters.')).toBeInTheDocument();
    expect(screen.getByText('Loosen the price cap or minutes floor.')).toBeInTheDocument();
  });

  it('opens the drawer with a decision on row click', () => {
    render(<AssetFinder players={PLAYERS} />);
    fireEvent.click(screen.getByText('Konsa'));
    const block = screen.getByTestId('decision-block');
    expect(block).toHaveTextContent('Buy');
    expect(block).toHaveTextContent('Predicted 4.5 pts next GW. P(start) 90%.');
  });

  it('locks rows beyond the free limit behind PremiumLock', () => {
    render(<AssetFinder players={PLAYERS} freeLimit={2} />);
    const lock = screen.getByTestId('premium-lock');
    expect(within(lock).getByText('Wood')).toBeInTheDocument(); // existence visible
    expect(screen.getByRole('link', { name: 'Go premium' })).toHaveAttribute('href', '/premium');
  });
});
