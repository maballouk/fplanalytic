// Home = state-aware DEFCON hub (canvas-approved flow). The weekly brief is
// the permanent hero; StateBanner adds the moment (deadline / live / review);
// the asset finder table follows. Statically rendered from the latest
// public/data/defcon_gw{N}.json; the twice-daily data commit rebuilds it.
// Copy from docs/COPY.md.

import AppShell from '@/components/ds/AppShell';
import EmptyState from '@/components/ds/EmptyState';
import MethodNote from '@/components/ds/MethodNote';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import TeamBadge from '@/components/ds/TeamBadge';
import type { Metadata } from 'next';
import { buildLedger, pickBrief, type BriefCall } from '@/lib/defcon/brief';
import { loadLatestDefcon } from '@/lib/defcon/data';
import { playerPhotoUrl, teamBadgeUrl } from '@/lib/fpl/photos';
import { NAV } from '@/lib/nav';
import AssetFinder from './AssetFinder';
import FirstVisit from './FirstVisit';
import StateBanner from './StateBanner';

export const dynamic = 'force-static';

// Target queries (TASKS.md 1.8): "FPL DEFCON", "defensive contribution stats",
// "best defensive assets FPL".
export const metadata: Metadata = {
  title: 'fplanalytic: FPL DEFCON asset finder',
  description:
    'Defensive contribution stats for FPL: DEFCON hit rates, near misses and the best defensive assets, updated twice daily.',
};

const TAG_TONE: Record<BriefCall['tag'], string> = {
  'THE BUY': 'bg-accent/10 text-accent',
  'THE DIFFERENTIAL': 'bg-[#14204a] text-info',
  'THE TRAP': 'bg-[#2b1616] text-danger',
};

function BriefCard({ call, lead = false }: { call: BriefCall; lead?: boolean }) {
  const p = call.player;
  return (
    <div
      className={`relative overflow-hidden rounded-card border p-5 ${
        lead ? 'border-line-strong bg-bg-raised' : 'border-line bg-bg-raised'
      }`}
    >
      {lead && (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent to-transparent" />
      )}
      <div className="flex items-center justify-between">
        <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${TAG_TONE[call.tag]}`}>
          {call.tag}
        </span>
        {call.verdict ? (
          <span className="rounded-pill bg-bg-overlay px-2.5 py-0.5 text-xs font-semibold text-text-muted">
            {call.verdict}
          </span>
        ) : (
          <span className="num text-xs text-text-faint">{p.ownership.toFixed(1)}% owned</span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <PlayerAvatar src={playerPhotoUrl(p.code)} name={p.name} size={46} />
        <div className="min-w-0">
          <div className="truncate font-semibold text-text">{p.name}</div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <TeamBadge src={teamBadgeUrl(p.team_code)} alt={p.team} size={14} />
            {p.team} · {p.position} · £{p.price.toFixed(1)}m
          </div>
        </div>
        <span className={`num ml-auto text-2xl font-bold ${lead ? 'text-accent' : ''}`}>
          {call.tag === 'THE DIFFERENTIAL'
            ? p.value_per_million.toFixed(2)
            : p.defcon_xpts.toFixed(2)}
        </span>
      </div>
      <p className="mt-4 border-t border-line pt-3 text-sm text-text">{call.reason}</p>
    </div>
  );
}

export default function Home() {
  const data = loadLatestDefcon();
  const brief = data ? pickBrief(data.players) : null;
  const ledger = data ? buildLedger(data.players) : { banked: [], nearMissed: [] };
  const updated = data ? new Date(data.generated_at).toISOString().slice(11, 16) : null;

  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/">
      <div className="-mx-5 -mt-8">
        <FirstVisit />
        {data && <StateBanner calendar={data.calendar} ledger={ledger} />}
        <section className="border-b border-line bg-gradient-to-b from-bg to-[#0d1a15] px-5 pb-10 pt-10">
          <div className="mx-auto max-w-content">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="rounded-pill border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  GW{data ? (data.calendar?.next_gw ?? data.gw) : ''} brief
                </span>
                <h1 className="mt-3 font-display text-4xl font-black tracking-tight">
                  Defensive Contribution, decoded.
                </h1>
                <p className="mt-2 text-lg text-text-muted">
                  Hit rates, live threshold tracking and value. Built for the DEFCON era.
                </p>
              </div>
              {data && (
                <p className="num text-sm text-text-faint">
                  Updated GW {data.gw} · {updated}
                </p>
              )}
            </div>

            {brief && (brief.buy || brief.differential || brief.trap) && (
              <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
                {brief.buy && <BriefCard call={brief.buy} lead />}
                {brief.differential && <BriefCard call={brief.differential} />}
                {brief.trap && <BriefCard call={brief.trap} />}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="pt-8">
        {data === null ? (
          <EmptyState
            kind="empty"
            title="GW data lands after the first matches finish."
            hint="The tracker updates twice a day."
          />
        ) : (
          <>
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
                  including recoveries. xPts is the hit probability times 2. The brief applies the
                  same Buy, Hold and Avoid rules as every player drawer.
                </p>
              </MethodNote>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
