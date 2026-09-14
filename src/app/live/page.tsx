// Live DEFCON tracker route (TASKS.md 1.6, DESIGN.md §3.2). The client
// component polls /api/defcon/live every 60s; this route only frames it.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import { BOTTOM_NAV, NAV } from '@/lib/nav';
import LiveTracker from './LiveTracker';

export const metadata: Metadata = {
  title: 'Live DEFCON tracker · fplanalytic',
  description: 'Threshold bars for every player on the pitch, refreshed every minute.',
};

export default function LivePage() {
  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/live" bottomNav={BOTTOM_NAV}>
      <header className="mb-6">
        <span className="rounded-pill border border-line-strong bg-bg-raised px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest text-text-muted">
          FPL
        </span>
        <h1 className="mt-2 text-2xl font-semibold">Live DEFCON tracker</h1>
        <p className="mt-1 text-text-muted">
          Every player on the pitch, sorted by who is closest to the threshold.
        </p>
      </header>
      <LiveTracker />
    </AppShell>
  );
}
