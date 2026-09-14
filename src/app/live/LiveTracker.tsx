'use client';

// Matchday grid (live page rebuild, owner direction 2026-09-14): matches
// first — score, minute, status — grouped live / upcoming / full-time. Each
// card links to its Match Centre (/match/[id]); the DEFCON race that used to
// fill this page is now a per-card expander. 60s polling on this route only.

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EmptyState from '@/components/ds/EmptyState';
import TeamBadge from '@/components/ds/TeamBadge';
import ThresholdBar from '@/components/ds/ThresholdBar';
import { track } from '@/lib/analytics';
import { teamBadgeUrl } from '@/lib/fpl/photos';
import type { LiveFixture, LivePayload, LivePlayer } from '@/lib/defcon/live';

const POLL_MS = 60_000;

function kickoffLabel(iso: string | null): string {
  if (!iso) return 'TBC';
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function MatchCard({ fixture, players }: { fixture: LiveFixture; players: LivePlayer[] }) {
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
          <span className="num shrink-0 text-2xl font-bold">
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
  fixtures,
  players,
}: {
  title: string;
  fixtures: LiveFixture[];
  players: LivePlayer[];
}) {
  if (fixtures.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-faint">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {fixtures.map((f) => (
          <MatchCard
            key={f.id}
            fixture={f}
            players={players.filter((p) => p.fixture_id === f.id)}
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

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/defcon/live');
      if (!res.ok) throw new Error(`live endpoint ${res.status}`);
      setPayload((await res.json()) as LivePayload);
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
      <Group title="Live now" fixtures={liveNow} players={payload.players} />
      <Group title="Upcoming" fixtures={upcoming} players={payload.players} />
      <Group title="Full time" fixtures={done} players={payload.players} />
    </div>
  );
}
