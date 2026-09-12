import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LiveTracker from '@/app/live/LiveTracker';
import type { LivePayload } from '@/lib/defcon/live';

function mockFetch(payload: LivePayload | null, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, json: async () => payload }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const LIVE: LivePayload = {
  gw: 3,
  generated_at: '2026-09-12T15:00:00Z',
  fixtures: [
    {
      id: 100,
      home: 'ARS',
      away: 'LIV',
      home_code: 3,
      away_code: 14,
      home_score: 1,
      away_score: 0,
      finished: false,
    },
  ],
  players: [
    {
      id: 11,
      name: 'Rice',
      team: 'ARS',
      team_code: 3,
      position: 'MID',
      threshold: 12,
      actions: 11,
      minutes: 60,
      fixture_id: 100,
    },
    {
      id: 10,
      name: 'Gabriel',
      team: 'ARS',
      team_code: 3,
      position: 'DEF',
      threshold: 10,
      actions: 8,
      minutes: 60,
      fixture_id: 100,
    },
  ],
  next_kickoff: null,
};

describe('LiveTracker', () => {
  it('renders fixtures with threshold bars and a refreshed stamp', async () => {
    mockFetch(LIVE);
    render(<LiveTracker />);
    await waitFor(() => expect(screen.getByText(/Rice/)).toBeInTheDocument());
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText(/Last refreshed/)).toBeInTheDocument();
    const meters = screen.getAllByRole('meter');
    expect(meters[0]).toHaveAccessibleName('Rice: 11 of 12 defensive actions');
  });

  it('shows the empty state with the next kickoff when nothing is live', async () => {
    mockFetch({
      gw: 3,
      generated_at: '2026-09-12T15:00:00Z',
      fixtures: [],
      players: [],
      next_kickoff: { label: 'BOU v ARS', kickoff_time: '2026-09-13T15:30:00Z' },
    });
    render(<LiveTracker />);
    await waitFor(() =>
      expect(screen.getByText('No matches in play right now.')).toBeInTheDocument()
    );
    expect(screen.getByText(/Next kickoff: BOU v ARS/)).toBeInTheDocument();
  });

  it('shows the approved error state when the endpoint fails', async () => {
    mockFetch(null, false);
    render(<LiveTracker />);
    await waitFor(() => expect(screen.getByText('Could not load the data.')).toBeInTheDocument());
  });
});
