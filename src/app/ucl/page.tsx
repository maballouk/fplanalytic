// European Nights: UCL Fantasy Matchday Hub (TASKS.md 1.5.5, DESIGN.md §4.1,
// visual direction A "Broadcast dark" from the approved design canvas).
// Statically rendered from the latest public/data/ucl_md{N}.json; fresh
// predictions arrive as commits from the Mon/Thu engine cron.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import ClubBadge from '@/components/ds/ClubBadge';
import EmptyState from '@/components/ds/EmptyState';
import MethodNote from '@/components/ds/MethodNote';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import { NAV } from '@/lib/nav';
import { club, uclBadgeUrl } from '@/lib/ucl/clubs';
import { uclPlayerPhotoUrl } from '@/lib/ucl/photos';
import { topContributors, type UclFixture, type UclPlayer } from '@/lib/ucl/file';
import { loadLatestMatchday } from '@/lib/ucl/loadMatchday';
import Countdown from './Countdown';
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
            <div className="font-semibold text-text">{player.name}</div>
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
        <span className={`num text-3xl font-bold ${tone.value}`}>{player.xpts.toFixed(1)}</span>
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
    </div>
  );
}

export default function UclPage() {
  const data = loadLatestMatchday();

  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/ucl">
      {data === null ? (
        <EmptyState
          kind="empty"
          title="Predictions land once the engine has run."
          hint="The engine runs every Monday and Thursday."
        />
      ) : (
        <>
          <section className="-mx-5 -mt-8 mb-10 border-b border-line bg-gradient-to-br from-bg via-[#10182b] to-[#14204a] px-5 pb-10 pt-12">
            <div className="mx-auto flex max-w-content flex-wrap items-end justify-between gap-8">
              <div>
                <span className="mb-3 inline-block rounded-pill border border-info/30 bg-[#14204a] px-3 py-1 text-xs font-semibold text-info">
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

          <section className="mb-10">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold">Captain picks</h2>
              <span className="text-xs text-text-faint">
                Rotation model is v0: P(start) is a minutes proxy until lineups firm up
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {data.players.slice(0, 3).map((p, i) => (
                <CaptainCard key={p.player_id} player={p} rank={i + 1} />
              ))}
            </div>
          </section>

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
            <div className="mb-4 flex items-baseline justify-between">
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
                  UCL Fantasy scoring rules, plus clean sheets, saves and ball recoveries. Early in
                  the season shares are shrunk toward position averages, and domestic form is not
                  yet included: treat small gaps between players as noise.
                </p>
              </MethodNote>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
