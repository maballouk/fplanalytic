import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import UclPage from '@/app/ucl/page';
import XptsTable from '@/app/ucl/XptsTable';
import { loadLatestMatchday } from '@/lib/ucl/loadMatchday';
import { topContributors, type UclPlayer } from '@/lib/ucl/file';

// The page reads the real public/data/ucl_md{N}.json, so these tests also
// guard the engine output schema against the site's expectations.

describe('loadLatestMatchday', () => {
  it('parses the checked-in engine output', () => {
    const data = loadLatestMatchday();
    expect(data).not.toBeNull();
    expect(data!.fixtures.length).toBeGreaterThan(0);
    expect(data!.players.length).toBeGreaterThan(100);
    expect(data!.fixtures[0].kickoff_utc).toMatch(/^\d{4}-/);
  });
});

describe('UCL Matchday Hub page', () => {
  it('renders hero, captain picks, fixtures and the table', () => {
    render(<UclPage />);
    expect(screen.getByRole('heading', { name: 'European Nights' })).toBeInTheDocument();
    expect(screen.getByText(/Matchday \d+/)).toBeInTheDocument();
    expect(screen.getByText('Captain picks')).toBeInTheDocument();
    expect(screen.getByText('Match predictions')).toBeInTheDocument();
    expect(screen.getAllByText('How we compute this').length).toBeGreaterThan(1);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(20);
  });
});

describe('XptsTable', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'));

  const player = (over: Partial<UclPlayer>): UclPlayer => ({
    player_id: '1',
    name: 'Haaland',
    team: 'Manchester City',
    position: 'FWD',
    price: 11,
    opponent: 'Paris Saint-Germain',
    is_home: true,
    p_plays: 0.93,
    xpts: 8.4,
    xpts_per_million: 0.76,
    breakdown: { goals: 4.9, assists: 0.6, appearance: 1.9 },
    ...over,
  });

  it('filters by position and flags rotation risk in amber', () => {
    render(
      <XptsTable
        players={[
          player({ player_id: '1' }),
          player({
            player_id: '2',
            name: 'Courtois',
            team: 'Real Madrid',
            position: 'GK',
            p_plays: 0.55,
          }),
        ]}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: 'GK' }));
    expect(screen.getByText('Courtois')).toBeInTheDocument();
    expect(screen.queryByText('Haaland')).not.toBeInTheDocument();
    expect(screen.getByText('55%')).toHaveClass('text-warn');
  });

  it('locks rows beyond the free limit', () => {
    const many = Array.from({ length: 45 }, (_, i) =>
      player({ player_id: String(i), name: `P${i}` })
    );
    render(<XptsTable players={many} freeLimit={40} />);
    const lock = screen.getByTestId('premium-lock');
    expect(within(lock).getByText('P40')).toBeInTheDocument();
  });
});

describe('topContributors', () => {
  it('orders chips by contribution and drops noise', () => {
    const chips = topContributors({ goals: 2.1, recoveries: 0.9, saves: 0.1, appearance: 1.9 });
    expect(chips.map((c) => c.label)).toEqual(['G', 'REC']);
  });
});
