import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '@/app/page';
import MethodologyPage from '@/app/methodology/page';
import PremiumPage from '@/app/premium/page';

// Render test per screen (CLAUDE.md). Home reads the real
// public/data/defcon_gw{N}.json from disk, so this also guards the file schema.

describe('Home (state-aware DEFCON hub)', () => {
  it('renders the brief hero and the table from the data file', () => {
    render(<Home />);
    expect(screen.getByText("Every player's next gameweek, in points.")).toBeInTheDocument();
    expect(screen.getByText(/GW\d+ brief/)).toBeInTheDocument();
    expect(screen.getByText('THE BUY')).toBeInTheDocument();
    expect(screen.getByText(/Updated GW \d+/)).toBeInTheDocument();
    expect(screen.getByText('How we compute this')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(10);
  });
});

describe('Methodology', () => {
  it('explains the rule and ends with what we do not do', () => {
    render(<MethodologyPage />);
    expect(screen.getByText('The DEFCON rule')).toBeInTheDocument();
    expect(screen.getByText('What we do not do')).toBeInTheDocument();
  });
});

describe('Premium placeholder', () => {
  it('states the value prop once', () => {
    render(<PremiumPage />);
    expect(
      screen.getByText('Alerts, full history and rotation risk. £2.99/month.')
    ).toBeInTheDocument();
  });
});
