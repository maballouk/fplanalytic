// My Team (FPL): enter your team ID once, and every visit fetches your real
// squad and compares it with the tool's DEFCON XI on two pitches. No account:
// FPL picks are public by team ID, and the ID lives in your browser.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import MethodNote from '@/components/ds/MethodNote';
import { loadLatestDefcon } from '@/lib/defcon/data';
import { pickDefconTeam } from '@/lib/defcon/myteam';
import { NAV } from '@/lib/nav';
import MyTeam from './MyTeam';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'My Team · fplanalytic',
  description: 'Your real FPL squad against the DEFCON XI, side by side.',
};

export default function MyTeamPage() {
  const data = loadLatestDefcon();
  const defconTeam = data ? pickDefconTeam(data.players) : null;

  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/my-team">
      <header className="mb-6">
        <span className="rounded-pill border border-line-strong bg-bg-raised px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest text-text-muted">
          FPL
        </span>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight">My Team</h1>
        <p className="mt-1 text-text-muted">
          Your squad through DEFCON eyes, next to the XI the numbers would field.
        </p>
      </header>

      <MyTeam players={data?.players ?? []} defconTeam={defconTeam} />

      <div className="mt-8">
        <MethodNote
          summary="How we compute this"
          methodologyHref="/methodology"
          methodologyLabel="Full methodology"
        >
          <p>
            Your picks come from the official FPL API, which makes every squad public by team ID; we
            never ask for a login. The comparison counts expected defensive-contribution points
            only: goalkeepers cannot earn DEFCON, so your keeper counts zero and the DEFCON XI
            fields ten outfielders under FPL formation rules. Captain doubling is not included.
          </p>
        </MethodNote>
      </div>
    </AppShell>
  );
}
