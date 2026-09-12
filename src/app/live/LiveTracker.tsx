'use client';

// Live DEFCON tracker (DESIGN.md §3.2): fixtures with per-player threshold
// bars, sorted "closest to threshold" (done server-side), 60s polling on this
// route only, a last-refreshed stamp, and no auto-scroll. Notifications are
// premium and arrive in Phase 2. Copy from docs/COPY.md.

import { useCallback, useEffect, useState } from 'react';
import EmptyState from '@/components/ds/EmptyState';
import ThresholdBar from '@/components/ds/ThresholdBar';
import type { LivePayload } from '@/lib/defcon/live';

const POLL_MS = 60_000;

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
      ? `Next kickoff: ${next.label} at ${new Date(next.kickoff_time).toLocaleString('en-GB', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}.`
      : undefined;
    return <EmptyState kind="empty" title="No matches in play right now." hint={hint} />;
  }

  return (
    <div className="space-y-6">
      {refreshedAt && (
        <p className="num text-xs text-text-faint" role="status">
          Last refreshed {refreshedAt.toLocaleTimeString('en-GB')}
        </p>
      )}
      {payload.fixtures.map((fixture) => {
        const players = payload.players.filter((p) => p.fixture_id === fixture.id);
        return (
          <section
            key={fixture.id}
            className="rounded-card border border-line bg-bg-raised p-5 shadow-card"
          >
            <header className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg">
                {fixture.home}{' '}
                <span className="num">
                  {fixture.home_score ?? ''}–{fixture.away_score ?? ''}
                </span>{' '}
                {fixture.away}
              </h2>
              <span
                className={`rounded-pill border px-2 py-0.5 text-xs ${
                  fixture.finished ? 'border-line text-text-faint' : 'border-accent-dim text-accent'
                }`}
              >
                {fixture.finished ? 'FT' : 'Live'}
              </span>
            </header>
            {players.length === 0 ? (
              <p className="text-sm text-text-muted">No DEFCON-relevant minutes yet.</p>
            ) : (
              <ul className="space-y-2">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-[minmax(0,14rem)_1fr] items-center gap-3"
                  >
                    <span className="truncate text-sm">
                      {p.name}
                      <span className="ml-2 text-xs text-text-faint">
                        {p.team} · {p.position} · {p.minutes}&apos;
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
            )}
          </section>
        );
      })}
    </div>
  );
}
