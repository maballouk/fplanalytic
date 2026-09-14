// Placeholder premium page: PremiumLock CTAs land here until Paddle arrives in
// Phase 2 (TASKS.md 2.1). States what premium adds, once; the free tier stays
// complete (CLAUDE.md).

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import { BOTTOM_NAV, NAV } from '@/lib/nav';

export const metadata: Metadata = {
  title: 'Premium · fplanalytic',
  description: 'Alerts, full history and rotation risk. £2.99/month.',
};

export default function PremiumPage() {
  return (
    <AppShell brand="fplanalytic" nav={NAV} bottomNav={BOTTOM_NAV}>
      <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
        <h1 className="text-3xl font-semibold">Premium</h1>
        <p className="text-lg text-text-muted">
          Alerts, full history and rotation risk. £2.99/month.
        </p>
        <p className="rounded-card border border-line bg-bg-raised p-5 text-sm text-text-muted">
          Premium launches later this season. The free tier stays complete.
        </p>
      </div>
    </AppShell>
  );
}
