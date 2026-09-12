// Defensive Value Lens route (TASKS.md 1.7, DESIGN.md §3.3). Statically
// rendered from the latest DEFCON data file, like the home page.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import EmptyState from '@/components/ds/EmptyState';
import MethodNote from '@/components/ds/MethodNote';
import { loadLatestDefcon } from '@/lib/defcon/data';
import { NAV } from '@/lib/nav';
import ValueLens from './ValueLens';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Defensive value lens · fplanalytic',
  description: 'Price against DEFCON expected points, with the top 10 value picks.',
};

export default function ValuePage() {
  const data = loadLatestDefcon();

  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/value">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Defensive value lens</h1>
        <p className="mt-1 text-text-muted">
          Price against DEFCON expected points. Up and left is where the value lives.
        </p>
        {data && (
          <p className="num mt-1 text-xs text-text-faint">
            Updated GW {data.gw} · {new Date(data.generated_at).toISOString().slice(11, 16)}
          </p>
        )}
      </header>

      {data === null ? (
        <EmptyState
          kind="empty"
          title="GW data lands after the first matches finish."
          hint="The tracker updates twice a day."
        />
      ) : (
        <>
          <ValueLens players={data.players} />
          <div className="mt-6">
            <MethodNote
              summary="How we compute this"
              methodologyHref="/methodology"
              methodologyLabel="Full methodology"
            >
              <p>
                The vertical axis is DEFCON xPts only for now; clean-sheet expected points join when
                the prediction engine goes live. Bubble size is minutes played. The same data as a
                sortable table lives on the home page.
              </p>
            </MethodNote>
          </div>
        </>
      )}
    </AppShell>
  );
}
