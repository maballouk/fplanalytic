// Static UCL player pages (TASKS.md 1.5.6): a shareable, indexable URL per
// player with the xPts story — headline number, breakdown, start odds, the
// crowd's take, and his club's fixture prediction. Params are pinned to the
// top slice of the latest engine file to keep builds quick; rebuilt with
// every engine commit.

import type { Metadata } from 'next';
import Link from 'next/link';
import AppShell from '@/components/ds/AppShell';
import ClubBadge from '@/components/ds/ClubBadge';
import CountUp from '@/components/ds/CountUp';
import MethodNote from '@/components/ds/MethodNote';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import { BOTTOM_NAV, NAV } from '@/lib/nav';
import { club, uclBadgeUrl } from '@/lib/ucl/clubs';
import { uclPlayerPhotoUrl } from '@/lib/ucl/photos';
import { topContributors, type UclFixture, type UclPlayer } from '@/lib/ucl/file';
import { loadLatestMatchday } from '@/lib/ucl/loadMatchday';

export const dynamic = 'force-static';
export const dynamicParams = false;

// Keep static generation bounded: the deep bench adds pages, not value.
const PAGE_LIMIT = 500;

const pct = (x: number) => `${Math.round(x * 100)}%`;

function find(id: string): { player: UclPlayer; fixture: UclFixture | null; md: number } | null {
  const data = loadLatestMatchday();
  if (!data) return null;
  const player = data.players.find((p) => p.player_id === id);
  if (!player) return null;
  const fixture =
    data.fixtures.find((f) => f.home === player.team || f.away === player.team) ?? null;
  return { player, fixture, md: data.matchday };
}

export function generateStaticParams() {
  const data = loadLatestMatchday();
  return (data?.players ?? []).slice(0, PAGE_LIMIT).map((p) => ({ id: p.player_id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const hit = find(params.id);
  if (!hit) return { title: 'UCL player · fplanalytic' };
  const { player, md } = hit;
  return {
    title: `${player.name}: ${player.xpts.toFixed(1)} xPts, UCL Fantasy MD${md} · fplanalytic`,
    description: `${player.name} (${player.team}, ${player.position}, €${player.price.toFixed(1)}m): ${player.xpts.toFixed(1)} expected UCL Fantasy points on matchday ${md}, picked by ${Math.round(player.sel_per)}% of all managers.`,
  };
}

export default function UclPlayerPage({ params }: { params: { id: string } }) {
  const hit = find(params.id);
  if (!hit) return null; // dynamicParams=false: unknown ids 404 first
  const { player, fixture, md } = hit;
  const c = club(player.team);
  const chips = topContributors(player.breakdown, 6);

  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/ucl" bottomNav={BOTTOM_NAV}>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/ucl"
          className="text-sm text-text-muted transition-colors duration-hover hover:text-text"
        >
          ← European Nights
        </Link>

        <div className="mt-4 overflow-hidden rounded-card border border-line bg-bg-raised">
          <div className="h-[4px]" style={{ background: c.color }} />
          <div className="flex items-center gap-4 p-5">
            <PlayerAvatar
              src={uclPlayerPhotoUrl(player.player_id)}
              name={player.name}
              ringColor={c.color}
              size={72}
            />
            <div className="min-w-0">
              <h1 className="truncate font-display text-3xl font-black tracking-tight">
                {player.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                <ClubBadge
                  src={uclBadgeUrl(player.team)}
                  code={c.code}
                  ringColor={c.color}
                  size={18}
                />
                {player.team} · {player.position} · €{player.price.toFixed(1)}m
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-card border border-info/20 bg-tint-info p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-text-faint">
              Expected points · MD{md}
            </span>
            <span className="num text-xs text-text-muted">P(start) {pct(player.p_plays)}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-4xl font-bold text-accent">
              <CountUp value={player.xpts} />
            </span>
            <span className="text-sm text-text-muted">xPts</span>
            <span className="num ml-auto text-sm text-text-muted">
              {player.xpts_per_million.toFixed(2)} /€m
            </span>
          </div>
          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className="num rounded-pill bg-bg-raised/70 px-2 py-0.5 text-xs text-text-muted"
                >
                  {chip.label} {chip.value.toFixed(1)}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-line pt-2 text-sm text-text">
            Picked by <span className="num text-info">{Math.round(player.sel_per)}%</span> of all
            UCL Fantasy managers
            {player.transfer_balance > 1000 && (
              <span className="ml-1 text-accent">· being bought right now ▲</span>
            )}
          </p>
        </div>

        {fixture && (
          <div className="mt-4 rounded-card border border-line bg-bg-raised p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-faint">
              His match this matchday
            </h2>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold">
                <ClubBadge
                  src={uclBadgeUrl(fixture.home)}
                  code={club(fixture.home).code}
                  ringColor={club(fixture.home).color}
                  size={24}
                />
                {club(fixture.home).code}
              </span>
              <span className="num text-lg font-bold">
                {fixture.xg_home.toFixed(1)}
                <span className="mx-1 text-text-faint">–</span>
                {fixture.xg_away.toFixed(1)}
              </span>
              <span className="flex items-center gap-2 font-semibold">
                {club(fixture.away).code}
                <ClubBadge
                  src={uclBadgeUrl(fixture.away)}
                  code={club(fixture.away).code}
                  ringColor={club(fixture.away).color}
                  size={24}
                />
              </span>
            </div>
            <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-pill bg-bg">
              <div style={{ width: pct(fixture.p_home) }} className="bg-accent-dim" />
              <div style={{ width: pct(fixture.p_draw) }} className="bg-line-strong" />
              <div style={{ width: pct(fixture.p_away) }} className="bg-info/40" />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {club(fixture.home).code} <span className="num text-text">{pct(fixture.p_home)}</span>{' '}
              · draw <span className="num text-text">{pct(fixture.p_draw)}</span> ·{' '}
              {club(fixture.away).code} <span className="num text-text">{pct(fixture.p_away)}</span>{' '}
              · most likely{' '}
              <span className="num text-text">{fixture.most_likely_score.replace('-', '–')}</span>
            </p>
          </div>
        )}

        <div className="mt-6">
          <MethodNote
            summary="How we compute this"
            methodologyHref="/methodology"
            methodologyLabel="Full methodology"
          >
            <p>
              xPts multiplies this player&apos;s share of his team&apos;s predicted goals by the UCL
              Fantasy scoring rules, plus clean sheets, saves and ball recoveries. His shares blend
              his UCL record with his domestic-league season; P(start) blends his UCL minutes with
              his domestic starting record and his squad standing, times UEFA&apos;s own
              availability flags.
            </p>
          </MethodNote>
        </div>
      </div>
    </AppShell>
  );
}
