// Live DEFCON tracker route (TASKS.md 1.6, DESIGN.md §3.2). The client
// component polls /api/defcon/live every 60s; this route only frames it.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import { BOTTOM_NAV, NAV } from '@/lib/nav';
import LiveTracker from './LiveTracker';

export const metadata: Metadata = {
  title: 'Matchday live · fplanalytic',
  description:
    'Every Premier League match this gameweek: live scores, kickoffs and each Match Centre with events, squads and the DEFCON race.',
};

export default function LivePage() {
  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/live" bottomNav={BOTTOM_NAV}>
      <header className="mb-6">
        <span className="rounded-pill border border-line-strong bg-bg-raised px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest text-text-muted">
          FPL
        </span>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight">Matchday live</h1>
        <p className="mt-1 text-text-muted">
          Scores and kickoffs for the whole gameweek. Open a match for events, squads and the DEFCON
          race.
        </p>
      </header>
      <LiveTracker />
    </AppShell>
  );
}
