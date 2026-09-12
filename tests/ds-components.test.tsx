import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AppShell from '@/components/ds/AppShell';
import EmptyState from '@/components/ds/EmptyState';
import FixtureStrip from '@/components/ds/FixtureStrip';
import MethodNote from '@/components/ds/MethodNote';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import PlayerDrawer from '@/components/ds/PlayerDrawer';
import PlayerRow from '@/components/ds/PlayerRow';
import PremiumLock from '@/components/ds/PremiumLock';
import RankBadge from '@/components/ds/RankBadge';
import SegmentedTabs from '@/components/ds/SegmentedTabs';
import StatCard from '@/components/ds/StatCard';
import ThresholdBar, { thresholdState } from '@/components/ds/ThresholdBar';

describe('ThresholdBar', () => {
  it('classifies hit / near / below at DEF threshold 10', () => {
    expect(thresholdState(10, 10)).toBe('hit');
    expect(thresholdState(12, 10)).toBe('hit');
    expect(thresholdState(9, 10)).toBe('near');
    expect(thresholdState(8, 10)).toBe('near');
    expect(thresholdState(7, 10)).toBe('below');
  });

  it('renders an accessible meter with the actions value', () => {
    render(<ThresholdBar actions={8} threshold={10} label="8 of 10 defensive actions" />);
    const meter = screen.getByRole('meter', { name: '8 of 10 defensive actions' });
    expect(meter).toHaveAttribute('aria-valuenow', '8');
    expect(meter).toHaveAttribute('data-state', 'near');
  });
});

describe('StatCard', () => {
  it('renders label, value, detail and delta', () => {
    render(
      <StatCard
        label="Top DEFCON DEF"
        value="2.0"
        detail="Konsa · ARS"
        delta="+0.4"
        deltaTone="good"
      />
    );
    expect(screen.getByText('Top DEFCON DEF')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
    expect(screen.getByText('Konsa · ARS')).toBeInTheDocument();
    expect(screen.getByText('+0.4')).toBeInTheDocument();
  });
});

describe('RankBadge', () => {
  it('renders ranks 1-3 and nothing beyond', () => {
    const { rerender, container } = render(<RankBadge rank={1} />);
    expect(screen.getByLabelText('Rank 1')).toBeInTheDocument();
    rerender(<RankBadge rank={4} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('FixtureStrip', () => {
  it('renders a chip per fixture with difficulty data', () => {
    render(
      <FixtureStrip
        fixtures={[
          { opponent: 'SUN', isHome: true, difficulty: 2 },
          { opponent: 'LIV', isHome: false, difficulty: 5 },
        ]}
      />
    );
    const list = screen.getByRole('list', { name: 'Next fixtures' });
    const chips = list.querySelectorAll('li');
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveAttribute('data-difficulty', '2');
    expect(chips[1]).toHaveTextContent('LIV (A)');
  });
});

describe('MethodNote', () => {
  it('is collapsed by default and carries the methodology link', () => {
    render(
      <MethodNote
        summary="How we compute this"
        methodologyHref="/methodology"
        methodologyLabel="Full methodology"
      >
        <p>Blended hit rate.</p>
      </MethodNote>
    );
    expect(screen.getByText('How we compute this')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Full methodology' })).toHaveAttribute(
      'href',
      '/methodology'
    );
  });
});

describe('EmptyState', () => {
  it('renders skeleton rows when loading, never a spinner', () => {
    const { container } = render(<EmptyState kind="loading" rows={3} title="Loading" />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('renders error as an alert', () => {
    render(<EmptyState kind="error" title="Could not load data" hint="Try again in a minute" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load data');
  });
});

describe('PremiumLock', () => {
  it('keeps content visible (blurred) and shows value prop + CTA', () => {
    render(
      <PremiumLock
        valueProp="Alerts, full history and rotation risk."
        ctaLabel="Go premium"
        ctaHref="/premium"
      >
        <p>Hidden detail</p>
      </PremiumLock>
    );
    expect(screen.getByText('Hidden detail')).toBeInTheDocument(); // existence never hidden
    expect(screen.getByRole('link', { name: 'Go premium' })).toHaveAttribute('href', '/premium');
  });
});

describe('SegmentedTabs', () => {
  it('marks the active tab and fires onChange', () => {
    const onChange = vi.fn();
    render(
      <SegmentedTabs
        label="Position"
        value="DEF"
        onChange={onChange}
        options={[
          { value: 'DEF', label: 'DEF' },
          { value: 'MID', label: 'MID' },
        ]}
      />
    );
    expect(screen.getByRole('tab', { name: 'DEF' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'MID' }));
    expect(onChange).toHaveBeenCalledWith('MID');
  });
});

describe('PlayerRow', () => {
  it('renders core cells and fires onClick', () => {
    const onClick = vi.fn();
    render(
      <table>
        <tbody>
          <PlayerRow
            rank={5}
            name="Gabriel"
            team="ARS"
            position="DEF"
            price={6.2}
            onClick={onClick}
          >
            <td>extra</td>
          </PlayerRow>
        </tbody>
      </table>
    );
    expect(screen.getByText('Gabriel')).toBeInTheDocument();
    expect(screen.getByText('6.2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Gabriel'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows a RankBadge for top 3', () => {
    render(
      <table>
        <tbody>
          <PlayerRow rank={1} name="Konsa" team="ARS" position="DEF" price={4.5} />
        </tbody>
      </table>
    );
    expect(screen.getByLabelText('Rank 1')).toBeInTheDocument();
  });
});

describe('PlayerDrawer', () => {
  const props = {
    onClose: vi.fn(),
    title: 'Gabriel',
    subtitle: 'ARS · DEF · £6.2m',
    decision: { verdict: 'Buy' as const, reason: '7 of last 8 with 10+ actions.' },
    decisionLabel: 'Decision',
    closeLabel: 'Close',
  };

  it('renders nothing when closed', () => {
    const { container } = render(
      <PlayerDrawer open={false} {...props}>
        <p>profile</p>
      </PlayerDrawer>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('always ends with the decision block', () => {
    render(
      <PlayerDrawer open {...props}>
        <p>profile</p>
      </PlayerDrawer>
    );
    const block = screen.getByTestId('decision-block');
    expect(block).toHaveTextContent('Buy');
    expect(block).toHaveTextContent('7 of last 8 with 10+ actions.');
  });
});

describe('AppShell', () => {
  it('renders brand, nav and active state', () => {
    render(
      <AppShell
        brand="fplanalytic"
        activeHref="/live"
        nav={[
          { href: '/', label: 'DEFCON' },
          { href: '/live', label: 'Live' },
          { href: '/premium', label: 'Premium', premium: true },
        ]}
      >
        <p>content</p>
      </AppShell>
    );
    expect(screen.getByText('fplanalytic')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Live' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});

describe('PlayerAvatar', () => {
  it('falls back to initials when the photo fails to load', () => {
    render(<PlayerAvatar src="https://resources.premierleague.com/x.png" name="Ezri Konsa" />);
    const img = screen.getByRole('img', { name: 'Ezri Konsa' });
    fireEvent.error(img);
    expect(screen.getByText('EK')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
