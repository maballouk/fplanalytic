'use client';

// The Match Centre client: polls /api/fpl/match/[id] every 60s while the
// match is live (once otherwise) and renders the phase-aware view:
//   pre  — kickoff countdown, ones to watch, team news
//   live — score + minute, events, DEFCON race, both squads with points
//   post — FT score, events + bonus, top performers, DEFCON earners

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import CountUp from '@/components/ds/CountUp';
import EmptyState from '@/components/ds/EmptyState';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import TeamBadge from '@/components/ds/TeamBadge';
import ThresholdBar from '@/components/ds/ThresholdBar';
import { playerPhotoUrl, teamBadgeUrl } from '@/lib/fpl/photos';
import type { MatchEvent, MatchPayload, MatchPlayer } from '@/lib/fpl/match';

const POLL_LIVE_MS = 30_000;
const POLL_IDLE_MS = 90_000;

const EVENT_ICON: Record<MatchEvent['type'], string> = {
  goal: '⚽',
  assist: '🅰️',
  own_goal: '⚽ (og)',
  pen_saved: '🧤 pen saved',
  pen_missed: '❌ pen missed',
  yellow: '🟨',
  red: '🟥',
  bonus: '★',
};
// Bonus only settles after full time; while live it is provisional noise.
const LIVE_EVENT_ORDER: MatchEvent['type'][] = [
  'goal',
  'own_goal',
  'assist',
  'pen_saved',
  'pen_missed',
  'red',
  'yellow',
];

function EventLine({ e }: { e: MatchEvent }) {
  return (
    <li className="flex items-baseline gap-2 text-sm">
      <span aria-hidden className="shrink-0">
        {EVENT_ICON[e.type]}
      </span>
      <span className="text-text">
        {e.name}
        {e.type === 'goal' && e.value > 1 && <span className="num"> ×{e.value}</span>}
        {e.type === 'bonus' && <span className="num text-warn"> +{e.value}</span>}
        {e.minutes && e.minutes.length > 0 && (
          <span className="num ml-1.5 text-xs text-text-faint">
            {e.minutes.map((m) => `${m}'`).join(' ')}
          </span>
        )}
      </span>
    </li>
  );
}

function EventsPanel({ payload }: { payload: MatchPayload }) {
  const order =
    payload.phase === 'post' ? [...LIVE_EVENT_ORDER, 'bonus' as const] : LIVE_EVENT_ORDER;
  const side = (s: 'h' | 'a') =>
    order.flatMap((t) => payload.events.filter((e) => e.side === s && e.type === t));
  const h = side('h');
  const a = side('a');
  if (h.length + a.length === 0) return null;
  return (
    <section className="rounded-card border border-line bg-bg-raised p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-faint">
        Events{payload.phase === 'post' ? ' & bonus' : ''}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <ul className="space-y-1.5">
          {h.map((e, i) => (
            <EventLine key={i} e={e} />
          ))}
        </ul>
        <ul className="space-y-1.5 text-right [&_li]:justify-end">
          {a.map((e, i) => (
            <EventLine key={i} e={e} />
          ))}
        </ul>
      </div>
      {payload.events.some((e) => e.minutes && e.minutes.length > 0) && (
        <p className="mt-3 border-t border-line pt-2 text-xs text-text-faint">
          Minutes are detected by our own tracker as events land (±1&apos;); FPL publishes none.
        </p>
      )}
    </section>
  );
}

function DefconRace({ payload }: { payload: MatchPayload }) {
  const racers = [...payload.squads.h, ...payload.squads.a]
    .filter((p) => p.position !== 'GKP')
    .sort((x, y) => {
      const rx = Math.max(0, x.threshold - x.actions);
      const ry = Math.max(0, y.threshold - y.actions);
      return rx - ry || y.actions - x.actions;
    })
    .slice(0, 8);
  if (racers.length === 0) return null;
  return (
    <section className="rounded-card border border-line bg-bg-raised p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-faint">
        The DEFCON race · closest to the +2
      </h2>
      <ul className="space-y-2">
        {racers.map((p) => (
          <li key={p.id} className="grid grid-cols-[minmax(0,12rem)_1fr] items-center gap-3">
            <span className="flex items-center gap-2 truncate text-sm">
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 text-xs text-text-faint">
                {p.position} · {p.minutes}&apos;
              </span>
            </span>
            <ThresholdBar
              actions={p.actions}
              threshold={p.threshold}
              label={`${p.name}: ${p.actions} of ${p.threshold} defensive actions`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SquadColumn({
  title,
  code,
  players,
}: {
  title: string;
  code: number;
  players: MatchPlayer[];
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <TeamBadge src={teamBadgeUrl(code)} alt={title} size={18} />
        {title}
      </h3>
      <ul className="space-y-1">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-card px-2 py-1 text-sm odd:bg-bg-overlay/60"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 text-xs text-text-faint">{p.minutes}&apos;</span>
              {p.goals > 0 && (
                <span aria-label={`${p.goals} goals`}>⚽{p.goals > 1 ? p.goals : ''}</span>
              )}
              {p.assists > 0 && <span aria-label={`${p.assists} assists`}>🅰️</span>}
              {p.bonus > 0 && <span className="num text-xs text-warn">+{p.bonus}</span>}
            </span>
            <span className="num shrink-0 font-bold text-accent">{p.points}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MatchCenter({ fixtureId }: { fixtureId: string }) {
  const [payload, setPayload] = useState<MatchPayload | null>(null);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/fpl/match/${fixtureId}`);
      if (!res.ok) throw new Error(String(res.status));
      const next = (await res.json()) as MatchPayload;
      setPayload(next);
      setFailed(false);
      return next;
    } catch {
      setFailed(true);
      return null;
    }
  }, [fixtureId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const tick = async () => {
      const next = await refresh();
      if (cancelled) return;
      timer = setTimeout(tick, next?.phase === 'live' ? POLL_LIVE_MS : POLL_IDLE_MS);
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refresh]);

  if (failed && payload === null) {
    return (
      <EmptyState
        kind="error"
        title="Could not load the match."
        hint="Refresh in a minute. If it keeps failing, the FPL API is having a moment."
      />
    );
  }
  if (payload === null) return <EmptyState kind="loading" rows={8} title="Loading" />;

  const { home, away, phase } = payload;
  const kickoff = payload.kickoff_time
    ? new Date(payload.kickoff_time).toLocaleString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBC';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/live"
        className="text-sm text-text-muted transition-colors duration-hover hover:text-text"
      >
        ← Matchday live
      </Link>

      {/* Scoreboard */}
      <section className="overflow-hidden rounded-card border border-line bg-gradient-to-b from-bg-raised to-tint-accent p-6">
        <p className="mb-4 text-center text-xs text-text-muted">
          GW{payload.gw} · {kickoff}
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <TeamBadge src={teamBadgeUrl(home.code)} alt={home.name} size={52} />
            <span className="font-display text-lg font-bold leading-tight">{home.name}</span>
          </div>
          <div className="shrink-0 text-center">
            {phase === 'pre' ? (
              <span className="num text-2xl text-text-faint">v</span>
            ) : (
              <span className="num text-5xl font-black">
                <CountUp value={home.score ?? 0} decimals={0} />
                <span className="mx-2 text-text-faint">–</span>
                <CountUp value={away.score ?? 0} decimals={0} />
              </span>
            )}
            <div className="mt-2">
              {phase === 'live' && (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-dim/60 bg-bg-raised px-2.5 py-0.5 text-xs font-semibold text-accent">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-accent" aria-hidden />
                  {payload.minutes > 0 ? `${payload.minutes}'` : 'LIVE'}
                </span>
              )}
              {phase === 'post' && (
                <span className="rounded-pill border border-line bg-bg-raised px-2.5 py-0.5 text-xs font-semibold text-text-muted">
                  Full time
                </span>
              )}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <TeamBadge src={teamBadgeUrl(away.code)} alt={away.name} size={52} />
            <span className="font-display text-lg font-bold leading-tight">{away.name}</span>
          </div>
        </div>
      </section>

      <EventsPanel payload={payload} />

      {phase === 'pre' && (payload.watch.h.length > 0 || payload.watch.a.length > 0) && (
        <section className="rounded-card border border-line bg-bg-raised p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-faint">
            Ones to watch · form this season
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['h', 'a'] as const).map((side) => (
              <ul key={side} className="space-y-2">
                {payload.watch[side].map((w) => (
                  <li key={w.name} className="flex items-center gap-2.5 text-sm">
                    <PlayerAvatar src={playerPhotoUrl(w.code)} name={w.name} size={30} />
                    <span className="truncate">{w.name}</span>
                    <span className="num ml-auto text-accent">{w.form.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>
      )}

      {phase !== 'pre' && <DefconRace payload={payload} />}

      {phase !== 'pre' && (payload.squads.h.length > 0 || payload.squads.a.length > 0) && (
        <section className="rounded-card border border-line bg-bg-raised p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-faint">
            On the pitch · FPL points
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SquadColumn title={home.name} code={home.code} players={payload.squads.h} />
            <SquadColumn title={away.name} code={away.code} players={payload.squads.a} />
          </div>
        </section>
      )}

      {(payload.team_news.h.length > 0 || payload.team_news.a.length > 0) && (
        <section className="rounded-card border border-line bg-bg-raised p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-faint">
            Team news · from the official FPL feed
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['h', 'a'] as const).map((side) => (
              <ul key={side} className="space-y-2">
                {payload.team_news[side].slice(0, 6).map((n) => (
                  <li key={n.name} className="text-sm">
                    <span className="font-semibold">{n.name}</span>{' '}
                    <span className="text-text-muted">{n.news}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
