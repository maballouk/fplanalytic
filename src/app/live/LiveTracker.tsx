'use client';

// Matchday grid (live page rebuild, owner direction 2026-09-14): matches
// first — score, minute, status — grouped live / upcoming / full-time. Each
// card links to its Match Centre (/match/[id]); the DEFCON race that used to
// fill this page is now a per-card expander. 60s polling on this route only.

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import EmptyState from '@/components/ds/EmptyState';
import TeamBadge from '@/components/ds/TeamBadge';
import ThresholdBar from '@/components/ds/ThresholdBar';
import { track } from '@/lib/analytics';
import { teamBadgeUrl } from '@/lib/fpl/photos';
import type { LiveFixture, LivePayload, LivePlayer, TickerItem } from '@/lib/defcon/live';

const POLL_MS = 60_000;

function kickoffLabel(iso: string | null): string {
  if (!iso) return 'TBC';
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Broadcast lower-third: goals and reds loop across the strip; hover pauses. */
function Ticker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;
  const line = (item: TickerItem, i: number) => (
    <span key={i} className="flex shrink-0 items-center gap-2 px-5">
      <span aria-hidden>{item.type === 'goal' ? '⚽' : '🟥'}</span>
      <span className="font-semibold text-text">{item.name}</span>
      <span className="num text-xs text-text-muted">{item.score}</span>
    </span>
  );
  return (
    <div
      className="relative -mx-5 overflow-hidden border-y border-line bg-bg-raised py-2 md:mx-0 md:rounded-card md:border-x"
      aria-label="Latest goals and red cards"
    >
      <div className="ticker-track flex w-max motion-reduce:w-full motion-reduce:flex-wrap">
        {items.map(line)}
        {/* duplicated content makes the loop seamless; hidden from readers */}
        <span aria-hidden className="flex motion-reduce:hidden">
          {items.map((item, i) => line(item, i + items.length))}
        </span>
      </div>
    </div>
  );
}

function LiveBeacon() {
  return (
    <span className="flex items-center gap-1.5 rounded-pill bg-danger/10 px-2 py-0.5 text-[11px] font-bold tracking-widest text-danger">
      <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-danger" aria-hidden />
      LIVE
    </span>
  );
}

function StatusChip({ fixture }: { fixture: LiveFixture }) {
  if (fixture.finished) {
    return (
      <span className="rounded-pill border border-line px-2 py-0.5 text-xs font-semibold text-text-faint">
        FT
      </span>
    );
  }
  if (fixture.started) {
    return (
      <span className="flex items-center gap-1.5 rounded-pill border border-accent-dim/60 bg-tint-accent px-2 py-0.5 text-xs font-semibold text-accent">
        <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-accent" aria-hidden />
        {fixture.minutes > 0 ? `${fixture.minutes}'` : 'LIVE'}
      </span>
    );
  }
  return (
    <span className="num rounded-pill border border-line px-2 py-0.5 text-xs text-text-muted">
      {kickoffLabel(fixture.kickoff_time)}
    </span>
  );
}

function MatchCard({
  fixture,
  players,
  flash,
}: {
  fixture: LiveFixture;
  players: LivePlayer[];
  flash: boolean;
}) {
  const closest = players.slice(0, 5);
  return (
    <div className="overflow-hidden rounded-card border border-line bg-bg-raised shadow-card transition-colors duration-hover hover:border-line-strong">
      <Link
        href={`/match/${fixture.id}`}
        className="block p-4"
        onClick={() => track('match_open', { fixture: `${fixture.home}-${fixture.away}` })}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <TeamBadge src={teamBadgeUrl(fixture.home_code)} alt={fixture.home} size={26} />
            <span className="truncate font-semibold">{fixture.home}</span>
          </span>
          <span
            className={`num shrink-0 rounded-card px-1.5 text-2xl font-bold ${flash ? 'animate-scoreflash' : ''}`}
          >
            {fixture.started ? (
              <>
                {fixture.home_score ?? 0}
                <span className="mx-1 text-text-faint">–</span>
                {fixture.away_score ?? 0}
              </>
            ) : (
              <span className="text-base text-text-faint">v</span>
            )}
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <span className="truncate text-right font-semibold">{fixture.away}</span>
            <TeamBadge src={teamBadgeUrl(fixture.away_code)} alt={fixture.away} size={26} />
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StatusChip fixture={fixture} />
          <span className="text-xs text-text-muted">Match Centre →</span>
        </div>
      </Link>
      {closest.length > 0 && (
        <details className="group border-t border-line">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-2 text-xs text-text-muted transition-colors duration-hover hover:bg-bg-overlay hover:text-text [&::-webkit-details-marker]:hidden">
            Closest to the +2
            <span aria-hidden className="transition-transform duration-hover group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <ul className="space-y-2 px-4 pb-4">
            {closest.map((p) => (
              <li key={p.id} className="grid grid-cols-[minmax(0,11rem)_1fr] items-center gap-3">
                <span className="flex items-center gap-2 truncate text-sm">
                  <TeamBadge src={teamBadgeUrl(p.team_code)} alt={p.team} size={15} />
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-xs text-text-faint">{p.minutes}&apos;</span>
                </span>
                <ThresholdBar
                  actions={p.actions}
                  threshold={p.threshold}
                  label={`${p.name}: ${p.actions} of ${p.threshold} defensive actions`}
                />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Group({
  title,
  live = false,
  fixtures,
  players,
  flashes,
}: {
  title: string;
  live?: boolean;
  fixtures: LiveFixture[];
  players: LivePlayer[];
  flashes: Set<number>;
}) {
  if (fixtures.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-faint">
        {live && <LiveBeacon />}
        <span>{title}</span>
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {fixtures.map((f) => (
          <MatchCard
            key={f.id}
            fixture={f}
            players={players.filter((p) => p.fixture_id === f.id)}
            flash={flashes.has(f.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default function LiveTracker() {
  const [payload, setPayload] = useState<LivePayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [flashes, setFlashes] = useState<Set<number>>(new Set());
  const prevScores = useRef(new Map<number, string>());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/defcon/live');
      if (!res.ok) throw new Error(`live endpoint ${res.status}`);
      const next = (await res.json()) as LivePayload;
      // A goal landed between polls: flash that card's score for a moment.
      const changed = new Set<number>();
      for (const f of next.fixtures) {
        const key = `${f.home_score}-${f.away_score}`;
        const prev = prevScores.current.get(f.id);
        if (prev !== undefined && prev !== key && f.started) changed.add(f.id);
        prevScores.current.set(f.id, key);
      }
      if (changed.size > 0) {
        setFlashes(changed);
        setTimeout(() => setFlashes(new Set()), 3000);
      }
      setPayload(next);
      setFailed(false);
      setRefreshedAt(new Date());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  if (failed && payload === null) {
    return (
      <EmptyState
        kind="error"
        title="Could not load the data."
        hint="Refresh in a minute. If it keeps failing, the FPL API is having a moment."
      />
    );
  }
  if (payload === null) {
    return <EmptyState kind="loading" rows={8} title="Loading" />;
  }

  if (payload.fixtures.length === 0) {
    const next = payload.next_kickoff;
    const hint = next
      ? `Next kickoff: ${next.label} at ${kickoffLabel(next.kickoff_time)}.`
      : undefined;
    return <EmptyState kind="empty" title="No matches in play right now." hint={hint} />;
  }

  const liveNow = payload.fixtures.filter((f) => f.started && !f.finished);
  const upcoming = payload.fixtures.filter((f) => !f.started);
  const done = payload.fixtures.filter((f) => f.finished);

  return (
    <div className="space-y-8">
      {refreshedAt && (
        <p className="num text-xs text-text-faint" role="status">
          GW{payload.gw} · last refreshed {refreshedAt.toLocaleTimeString('en-GB')}
        </p>
      )}
      {liveNow.length > 0 && <Ticker items={payload.ticker} />}
      <Group title="Live now" live fixtures={liveNow} players={payload.players} flashes={flashes} />
      <Group title="Upcoming" fixtures={upcoming} players={payload.players} flashes={flashes} />
      <Group title="Full time" fixtures={done} players={payload.players} flashes={flashes} />
    </div>
  );
}
