// Home = DEFCON Asset Finder (TASKS.md 1.4, DESIGN.md §3.1). Statically
// rendered from the latest public/data/defcon_gw{N}.json; the twice-daily data
// commit triggers a rebuild. All copy from docs/COPY.md (approved 2026-09-12).

import AppShell from '@/components/ds/AppShell';
import EmptyState from '@/components/ds/EmptyState';
import MethodNote from '@/components/ds/MethodNote';
import StatCard from '@/components/ds/StatCard';
import type { Metadata } from 'next';
import { loadLatestDefcon } from '@/lib/defcon/data';
import { NAV } from '@/lib/nav';
import AssetFinder from './AssetFinder';

export const dynamic = 'force-static';

// Target queries (TASKS.md 1.8): "FPL DEFCON", "defensive contribution stats",
// "best defensive assets FPL".
export const metadata: Metadata = {
  title: 'fplanalytic: FPL DEFCON asset finder',
  description:
    'Defensive contribution stats for FPL: DEFCON hit rates, near misses and the best defensive assets, updated twice daily.',
};

export default function Home() {
  const data = loadLatestDefcon();

  const topDef = data?.players.find((p) => p.position === 'DEF');
  const topMid = data?.players.find((p) => p.position === 'MID');
  const bestValue = data
    ? [...data.players].sort((a, b) => b.value_per_million - a.value_per_million)[0]
    : undefined;

  const updated = data ? new Date(data.generated_at).toISOString().slice(11, 16) : null;

  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/">
      <section className="-mx-5 -mt-8 mb-8 bg-gradient-to-b from-bg to-bg-raised px-5 pb-8 pt-10">
        <div className="mx-auto max-w-content">
          <h1 className="text-3xl font-semibold">Defensive Contribution, decoded.</h1>
          <p className="mt-2 text-lg text-text-muted">
            Hit rates, live threshold tracking and value. Built for the DEFCON era.
          </p>
          {data && (
            <p className="num mt-2 text-sm text-text-faint">
              Updated GW {data.gw} · {updated}
            </p>
          )}
        </div>
      </section>

      {data === null ? (
        <EmptyState
          kind="empty"
          title="GW data lands after the first matches finish."
          hint="The tracker updates twice a day."
        />
      ) : (
        <>
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {topDef && (
              <StatCard
                label="Top DEFCON DEF this GW"
                value={topDef.defcon_xpts.toFixed(2)}
                detail={`${topDef.name} · ${topDef.team}`}
              />
            )}
            {topMid && (
              <StatCard
                label="Top DEFCON MID this GW"
                value={topMid.defcon_xpts.toFixed(2)}
                detail={`${topMid.name} · ${topMid.team}`}
              />
            )}
            {bestValue && (
              <StatCard
                label="Best value (xPts/£m)"
                value={bestValue.value_per_million.toFixed(3)}
                detail={`${bestValue.name} · ${bestValue.team}`}
              />
            )}
          </section>

          <AssetFinder players={data.players} />

          <div className="mt-6">
            <MethodNote
              summary="How we compute this"
              methodologyHref="/methodology"
              methodologyLabel="Full methodology"
            >
              <p>
                Hit rate blends the last 5 matches (60%) with the season (40%), counting only
                matches with 60+ minutes. DEF need 10+ CBIT and tackles; MID and FWD need 12+
                including recoveries. xPts is the hit probability times 2.
              </p>
            </MethodNote>
          </div>
        </>
      )}
    </AppShell>
  );
}
