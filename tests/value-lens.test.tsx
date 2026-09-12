import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ValueLens from '@/app/value/ValueLens';
import type { DefconFilePlayer } from '@/lib/defcon/file';

function player(over: Partial<DefconFilePlayer>): DefconFilePlayer {
  return {
    rank: 1,
    player_id: '1',
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
    status: 'a',
    next5: [{ event: 4, opponent: 'SUN', is_home: true, difficulty: 2 }],
    ...over,
  };
}

const PLAYERS = [
  player({ player_id: '1', name: 'Konsa', value_per_million: 0.44, price: 4.5 }),
  player({
    player_id: '2',
    name: 'Adams',
    team: 'BOU',
    position: 'MID',
    value_per_million: 0.4,
    price: 5.0,
  }),
  player({
    player_id: '3',
    name: 'Wood',
    team: 'NFO',
    position: 'FWD',
    value_per_million: 0.1,
    price: 7.5,
  }),
];

describe('ValueLens', () => {
  it('renders quadrant labels and the position legend', () => {
    render(<ValueLens players={PLAYERS} />);
    expect(screen.getByText('Underpriced engines')).toBeInTheDocument();
    expect(screen.getByText('Premium but earned')).toBeInTheDocument();
    const legend = screen.getByRole('list', { name: 'Positions' });
    expect(legend).toHaveTextContent('DEF');
    expect(legend).toHaveTextContent('FWD');
  });

  it('lists the top 10 by value with one-line reasons, drawer on click', () => {
    render(<ValueLens players={PLAYERS} />);
    expect(screen.getByText('70% hit rate at £4.5m.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Konsa/ }));
    expect(screen.getByTestId('decision-block')).toBeInTheDocument();
  });
});
