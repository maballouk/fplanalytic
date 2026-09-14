// European Nights: UCL Fantasy Matchday Hub (TASKS.md 1.5.5, DESIGN.md §4.1,
// visual direction A "Broadcast dark" from the approved design canvas).
// Statically rendered from the latest public/data/ucl_md{N}.json; fresh
// predictions arrive as commits from the Mon/Thu engine cron.

import type { Metadata } from 'next';
import Link from 'next/link';
import AppShell from '@/components/ds/AppShell';
import ClubBadge from '@/components/ds/ClubBadge';
import CountUp from '@/components/ds/CountUp';
import EmptyState from '@/components/ds/EmptyState';
import MethodNote from '@/components/ds/MethodNote';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import { BOTTOM_NAV, NAV } from '@/lib/nav';
import { club, uclBadgeUrl } from '@/lib/ucl/clubs';
import { uclPlayerPhotoUrl } from '@/lib/ucl/photos';
import { topContributors, type UclFixture, type UclPlayer } from '@/lib/ucl/file';
import { loadLatestMatchday } from '@/lib/ucl/loadMatchday';
import { pickXI } from '@/lib/ucl/xi';
import Countdown from './Countdown';
import UclLive from './UclLive';
import PitchXI from './PitchXI';
import XptsTable from './XptsTable';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'European Nights · UCL Fantasy predictions · fplanalytic',
  description:
    'UCL Fantasy expected points, match predictions and captain picks for every matchday.',
};

const pct = (x: number) => `${Math.round(x * 100)}%`;

function Crest({ team, size = 40 }: { team: string; size?: number }) {
  const c = club(team);
  return (
    <ClubBadge src={uclBadgeUrl(team)} code={c.code} ringColor={c.color} size={size} title={team} />
  );
}

function FixtureCard({ fixture, nFit }: { fixture: UclFixture; nFit: number }) {
  const home = club(fixture.home);
  const away = club(fixture.away);
  const kickoff = new Date(fixture.kickoff_utc);
  return (
    <div className="overflow-hidden rounded-card border border-line bg-bg-raised">
      <div
        className="h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${home.color} 0%, ${home.color} 48%, ${away.color} 52%, ${away.color} 100%)`,
        }}
      />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Crest team={fixture.home} />
            <span className="num text-xl font-bold">
              {fixture.xg_home.toFixed(1)} <span className="font-medium text-text-faint">–</span>{' '}
              {fixture.xg_away.toFixed(1)}
            </span>
            <Crest team={fixture.away} />
          </div>
          <div className="text-right">
            <div className="num text-xs text-text-muted">
              {kickoff.toLocaleString('en-GB', {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
              })}{' '}
              UTC
            </div>
            <span className="mt-1 inline-block rounded-pill bg-bg-overlay px-2 py-0.5 text-xs text-text-muted">
              most likely {fixture.most_likely_score.replace('-', '–')}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-pill bg-bg">
            <div style={{ width: pct(fixture.p_home) }} className="bg-accent-dim" />
            <div style={{ width: pct(fixture.p_draw) }} className="bg-line-strong" />
            <div style={{ width: pct(fixture.p_away) }} className="bg-info/40" />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-text-muted">
            <span>
              {home.code} <span className="num text-text">{pct(fixture.p_home)}</span>
            </span>
            <span>
              draw <span className="num text-text">{pct(fixture.p_draw)}</span>
            </span>
            <span>
              {away.code} <span className="num text-text">{pct(fixture.p_away)}</span>
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-text-muted">
          <span>
            Clean sheet: {home.code} <span className="num text-text">{pct(fixture.p_cs_home)}</span>{' '}
            · {away.code} <span className="num text-text">{pct(fixture.p_cs_away)}</span>
          </span>
        </div>
        <div className="mt-3">
          <MethodNote
            summary="How we compute this"
            methodologyHref="/methodology"
            methodologyLabel="Full methodology"
          >
            <p>
              Elo plus a Dixon-Coles goals model, fitted on {nFit} Champions League matches with
              early-season shrinkage. Probabilities come from the full scoreline matrix.
            </p>
          </MethodNote>
        </div>
      </div>
    </div>
  );
}

function CaptainCard({ player, rank }: { player: UclPlayer; rank: number }) {
  const c = club(player.team);
  const chips = topContributors(player.breakdown);
  const tone =
    rank === 1
      ? { badge: 'bg-accent/10 text-accent border-accent/25', value: 'text-accent' }
      : rank === 2
        ? { badge: 'bg-bg-overlay text-info border-info/40', value: 'text-text' }
        : { badge: 'bg-bg-overlay text-warn border-warn/40', value: 'text-text' };
  return (
    <div
      className={`relative overflow-hidden rounded-card border p-5 ${
        rank === 1
          ? 'border-line-strong bg-gradient-to-b from-bg-raised to-bg-overlay'
          : 'border-line bg-bg-raised'
      }`}
    >
      {rank === 1 && (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent to-transparent" />
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <PlayerAvatar
            src={uclPlayerPhotoUrl(player.player_id)}
            name={player.name}
            ringColor={c.color}
            size={48}
          />
          <div>
            <Link
              href={`/ucl/player/${player.player_id}`}
              className="font-semibold text-text underline-offset-2 hover:underline"
            >
              {player.name}
            </Link>
            <div className="text-xs text-text-muted">
              {c.code} · {player.position} · €{player.price.toFixed(1)}m · v{' '}
              {club(player.opponent).code} ({player.is_home ? 'H' : 'A'})
            </div>
          </div>
        </div>
        <span className={`rounded-pill border px-2.5 py-0.5 text-xs font-semibold ${tone.badge}`}>
          {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className={`num text-3xl font-bold ${tone.value}`}>
          <CountUp value={player.xpts} />
        </span>
        <span className="text-sm text-text-muted">xPts</span>
        <span className="num ml-auto text-sm text-text-muted">P(start) {pct(player.p_plays)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="num rounded-pill bg-bg-overlay px-2.5 py-0.5 text-xs text-text-muted"
          >
            {chip.label} {chip.value.toFixed(1)}
          </span>
        ))}
      </div>
      <p className="mt-3 border-t border-line pt-2.5 text-xs text-text-muted">
        Picked by <span className="num text-text">{Math.round(player.sel_per)}%</span> of all
        managers
        {player.transfer_balance > 1000 && <span className="ml-1 text-accent">· buying now ▲</span>}
      </p>
    </div>
  );
}

export default function UclPage() {
  const data = loadLatestMatchday();
  const xi = data ? pickXI(data.players) : null;

  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/ucl" bottomNav={BOTTOM_NAV}>
      {data === null ? (
        <EmptyState
          kind="empty"
          title="Predictions land once the engine has run."
          hint="The engine runs every Monday and Thursday."
        />
      ) : (
        <>
          <section className="-mx-5 -mt-8 mb-10 border-b border-line bg-gradient-to-br from-bg via-tint-info to-tint-info px-5 pb-10 pt-12">
            <div className="mx-auto flex max-w-content flex-wrap items-end justify-between gap-8">
              <div>
                <span className="mb-3 inline-block rounded-pill border border-info/30 bg-tint-info px-3 py-1 text-xs font-semibold text-info">
                  Champions League Fantasy · league phase
                </span>
                <h1 className="font-display text-5xl font-black leading-none tracking-tight text-text">
                  European Nights
                </h1>
                <p className="font-display text-5xl font-black leading-tight tracking-tight text-accent">
                  Matchday {data.matchday}
                </p>
                <p className="mt-3 max-w-md text-lg text-text-muted">
                  Match predictions and expected points for every squad, built for your captain
                  call.
                </p>
              </div>
              <div className="flex gap-3">
                <Countdown firstKickoffUtc={data.fixtures.map((f) => f.kickoff_utc).sort()[0]} />
                <div className="rounded-card border border-line bg-bg-raised/80 px-5 py-4 text-center">
                  <div className="text-xs uppercase tracking-wider text-text-faint">Model fit</div>
                  <div className="num mt-1 text-2xl font-bold">{data.model.n_matches_fit}</div>
                  <div className="mt-0.5 text-xs text-text-muted">matches · Elo + Dixon-Coles</div>
                </div>
              </div>
            </div>
          </section>

          <UclLive />

          <section className="mb-10">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-display text-xl font-bold">Captain picks</h2>
              <span className="text-xs text-text-faint">
                P(start) blends minutes with UEFA&apos;s own availability flags; lineups can still
                surprise
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {data.players.slice(0, 3).map((p, i) => (
                <CaptainCard key={p.player_id} player={p} rank={i + 1} />
              ))}
            </div>
            {(() => {
              // Consensus check: when the managers' favourite is not in our
              // top three, say so instead of pretending the crowd agrees.
              const crowd = [...data.players].sort((a, b) => b.sel_per - a.sel_per)[0];
              if (!crowd || crowd.sel_per < 20) return null;
              if (data.players.slice(0, 3).some((p) => p.player_id === crowd.player_id))
                return null;
              return (
                <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-card border border-line bg-bg-raised px-4 py-3 text-sm">
                  <span className="rounded-pill bg-tint-info px-2.5 py-0.5 text-xs font-semibold text-info">
                    THE CROWD&apos;S CALL
                  </span>
                  <span className="text-text">
                    {crowd.name} is the most-picked player —{' '}
                    <span className="num">{Math.round(crowd.sel_per)}%</span> of all managers own
                    him.
                  </span>
                  <span className="text-text-muted">
                    Our model has him at <span className="num">{crowd.xpts.toFixed(1)}</span> xPts v{' '}
                    {club(crowd.opponent).code} ({crowd.is_home ? 'H' : 'A'}).
                  </span>
                </div>
              );
            })()}
          </section>

          {xi && (
            <section className="mb-10">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-xl font-bold">The predicted XI</h2>
                <span className="num text-xs text-text-faint">
                  {xi.formation} · {xi.totalXpts.toFixed(1)} xPts combined
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                <PitchXI xi={xi} />
                <div className="flex flex-col gap-4">
                  <div className="rounded-card border border-line bg-bg-raised p-5">
                    <div className="text-xs uppercase tracking-wider text-text-faint">
                      The captain call
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold">{xi.captain.name}</span>
                      <span className="num text-lg text-accent">
                        {(xi.captain.xpts * 2).toFixed(1)}
                      </span>
                      <span className="text-xs text-text-muted">xPts doubled</span>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">
                      {club(xi.captain.team).code} v {club(xi.captain.opponent).code} (
                      {xi.captain.is_home ? 'H' : 'A'}) · P(start){' '}
                      <span className="num">{Math.round(xi.captain.p_plays * 100)}%</span>
                    </p>
                  </div>
                  <MethodNote
                    summary="How we compute this"
                    methodologyHref="/methodology"
                    methodologyLabel="Full methodology"
                  >
                    <p>
                      The highest combined xPts across valid formations, with UCL Fantasy&apos;s
                      maximum of three players per club. It ignores the budget on purpose: this is
                      the XI we would field, not a purchasable squad.
                    </p>
                  </MethodNote>
                </div>
              </div>
            </section>
          )}

          <section className="mb-10">
            <h2 className="mb-4 font-display text-xl font-bold">Match predictions</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[...data.fixtures]
                .sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))
                .map((f) => (
                  <FixtureCard
                    key={`${f.home}-${f.away}`}
                    fixture={f}
                    nFit={data.model.n_matches_fit}
                  />
                ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-display text-xl font-bold">Expected points · all positions</h2>
              <span className="num text-xs text-text-faint">
                Updated {new Date(data.generated_at).toISOString().slice(0, 16).replace('T', ' ')}{' '}
                UTC
              </span>
            </div>
            <XptsTable players={data.players} />
            <div className="mt-6">
              <MethodNote
                summary="How we compute this"
                methodologyHref="/methodology"
                methodologyLabel="Full methodology"
              >
                <p>
                  xPts multiplies each player&apos;s share of his team&apos;s predicted goals by the
                  UCL Fantasy scoring rules, plus clean sheets, saves and ball recoveries. Goal and
                  assist shares blend his UCL record with his domestic-league record this season;
                  recoveries and cards are shrunk toward position averages. Picked is the share of
                  all UCL Fantasy managers holding him. Treat small gaps between players as noise.
                </p>
              </MethodNote>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
