// Static per-player pages (look & feel round, 2026-09-14): every player gets
// a shareable, indexable URL with the same totals-first story as the drawer.
// Rebuilt with each data commit; params are pinned to the current data file.

import type { Metadata } from 'next';
import Link from 'next/link';
import AppShell from '@/components/ds/AppShell';
import CountUp from '@/components/ds/CountUp';
import FixtureStrip from '@/components/ds/FixtureStrip';
import MethodNote from '@/components/ds/MethodNote';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import TeamBadge from '@/components/ds/TeamBadge';
import ThresholdBar from '@/components/ds/ThresholdBar';
import TrendArrow from '@/components/ds/TrendArrow';
import { callPlayer } from '@/lib/defcon/call';
import { loadLatestDefcon } from '@/lib/defcon/data';
import { difficultyWord, thresholdFor, type DefconFilePlayer } from '@/lib/defcon/file';
import { playerPhotoUrl, teamBadgeUrl } from '@/lib/fpl/photos';
import { BOTTOM_NAV, NAV } from '@/lib/nav';

export const dynamic = 'force-static';
export const dynamicParams = false;

const pct = (x: number) => `${Math.round(x * 100)}%`;

const BREAKDOWN_LABELS: Record<string, string> = {
  appearance: 'Minutes',
  goals: 'Goals',
  assists: 'Assists',
  clean_sheet: 'Clean sheet',
  saves: 'Saves',
  bonus: 'Bonus',
  defcon: 'DEFCON',
  conceded: 'Conceded',
};

const VERDICT_TONE: Record<string, string> = {
  Buy: 'border-accent text-accent',
  Hold: 'border-warn text-warn',
  Avoid: 'border-danger text-danger',
};

function find(id: string): { player: DefconFilePlayer; gw: number | null } | null {
  const data = loadLatestDefcon();
  if (!data) return null;
  const player = data.players.find((p) => p.player_id === id);
  return player ? { player, gw: data.calendar?.next_gw ?? data.gw } : null;
}

export function generateStaticParams() {
  const data = loadLatestDefcon();
  return (data?.players ?? []).map((p) => ({ id: p.player_id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const hit = find(params.id);
  if (!hit) return { title: 'Player · fplanalytic' };
  const { player, gw } = hit;
  return {
    title: `${player.name}: ${player.xpts_total.toFixed(1)} predicted points GW${gw} · fplanalytic`,
    description: `${player.name} (${player.team}, ${player.position}, £${player.price.toFixed(1)}m): predicted ${player.xpts_total.toFixed(1)} FPL points next gameweek, owned by ${Math.round(player.elite_own * 100)}% of the world's top 50 managers.`,
  };
}

export default function PlayerPage({ params }: { params: { id: string } }) {
  const hit = find(params.id);
  if (!hit) return null; // dynamicParams=false: unknown ids 404 before reaching here
  const { player, gw } = hit;
  const decision = callPlayer(player);
  const breakdown = Object.entries(player.xpts_breakdown)
    .filter(([, v]) => Math.abs(v) >= 0.15)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return (
    <AppShell brand="fplanalytic" nav={NAV} bottomNav={BOTTOM_NAV}>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-text-muted transition-colors duration-hover hover:text-text"
        >
          ← All players
        </Link>

        <header className="mt-4 flex items-center gap-4">
          <PlayerAvatar src={playerPhotoUrl(player.code)} name={player.name} size={72} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-black tracking-tight">
              {player.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
              <TeamBadge src={teamBadgeUrl(player.team_code)} alt={player.team} size={16} />
              {player.team} · {player.position} · £{player.price.toFixed(1)}m
              {player.price_change !== undefined && player.price_change !== 0 && (
                <span className={player.price_change > 0 ? 'text-accent' : 'text-danger'}>
                  {player.price_change > 0 ? '▲' : '▼'}
                  {Math.abs(player.price_change).toFixed(1)}
                </span>
              )}
            </p>
          </div>
        </header>

        <div className="mt-6 rounded-card border border-accent/20 bg-[#0d1a15] p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-text-faint">
              Predicted GW{gw}
            </span>
            <span className="num text-xs text-text-muted">
              form {player.form5.toFixed(1)} · P(start) {pct(player.p_start)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-4xl font-bold text-accent">
              <CountUp value={player.xpts_total} />
            </span>
            <span className="text-sm text-text-muted">points</span>
            <TrendArrow now={player.xpts_total} prev={player.xpts_prev} />
          </div>
          {breakdown.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {breakdown.map(([k, v]) => (
                <span
                  key={k}
                  className="num rounded-pill bg-bg-overlay px-2 py-0.5 text-xs text-text-muted"
                >
                  {BREAKDOWN_LABELS[k] ?? k} {v.toFixed(1)}
                </span>
              ))}
            </div>
          )}
          {(player.elite_own > 0 || player.elite_cap > 0) && (
            <p className="mt-3 border-t border-line pt-2 text-sm text-text">
              Owned by <span className="num text-accent">{pct(player.elite_own)}</span> of the
              world&apos;s top 50 managers
              {player.elite_cap > 0 && (
                <>
                  {' '}
                  · captained by <span className="num text-warn">{pct(player.elite_cap)}</span>
                </>
              )}
            </p>
          )}
        </div>

        <div className="mt-4 rounded-card border border-line bg-bg-raised p-4">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-pill border px-3 py-1 text-sm ${VERDICT_TONE[decision.verdict]}`}
            >
              {decision.verdict}
            </span>
            <span className="text-xs uppercase tracking-wide text-text-faint">Decision</span>
          </div>
          <p className="mt-2 text-sm text-text">{decision.reason}</p>
        </div>

        {player.position !== 'GK' && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm text-text-muted">DEFCON detail</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {(
                [
                  ['Hit rate', pct(player.hit_rate)],
                  ['Avg actions', player.mean_actions.toFixed(1)],
                  ['Near miss', pct(player.near_miss_rate)],
                  ['DEFCON xPts', player.defcon_xpts.toFixed(2)],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-card border border-line bg-bg-overlay p-3">
                  <dt className="text-xs text-text-muted">{label}</dt>
                  <dd className="num mt-1 text-lg">{value}</dd>
                </div>
              ))}
            </dl>
            {player.last5_actions.length > 0 && (
              <div className="mt-4 space-y-1">
                {player.last5_actions.map((a, i) => (
                  <ThresholdBar
                    key={i}
                    actions={a}
                    threshold={thresholdFor(player.position)}
                    label={`${a} of ${thresholdFor(player.position)} defensive actions`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 text-sm text-text-muted">
            Next 5
            {player.next5[0] &&
              ` · first: ${player.next5[0].opponent} (${player.next5[0].is_home ? 'H' : 'A'}), ${difficultyWord(player.next5[0].difficulty)}`}
          </h2>
          <FixtureStrip
            fixtures={player.next5.map((f) => ({
              opponent: f.opponent,
              isHome: f.is_home,
              difficulty: f.difficulty,
            }))}
          />
        </div>

        <div className="mt-8">
          <MethodNote
            summary="How we compute this"
            methodologyHref="/methodology"
            methodologyLabel="Full methodology"
          >
            <p>
              Predicted points come from this player&apos;s own match record — per-90 rates shrunk
              toward league rates, scaled by next-fixture difficulty and expected minutes. Top-50
              ownership is read from the public squads of the current leaders of FPL&apos;s overall
              ranking.
            </p>
          </MethodNote>
        </div>
      </div>
    </AppShell>
  );
}
