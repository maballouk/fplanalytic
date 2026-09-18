'use client';

// Broadcast kickoff countdown (Mohamad, 2026-09-18): between matches the live
// page should feel like the minutes before kickoff, not an empty room. Ticks
// every second; the ping ring is pure CSS and dies with
// prefers-reduced-motion (global rule in globals.css).

import { useEffect, useState } from 'react';
import TeamBadge from './TeamBadge';
import { teamBadgeUrl } from '@/lib/fpl/photos';

export interface KickoffFixture {
  home: string;
  away: string;
  home_code: number;
  away_code: number;
  kickoff_time: string;
}

function parts(msLeft: number): { d: number; h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(total / 86_400);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    d,
    h: pad(Math.floor((total % 86_400) / 3600)),
    m: pad(Math.floor((total % 3600) / 60)),
    s: pad(total % 60),
  };
}

export default function KickoffCountdown({
  fixture,
  label,
}: {
  fixture: KickoffFixture;
  label: string;
}) {
  // Client-only ticking: a server-rendered countdown would mismatch on hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;

  const ko = Date.parse(fixture.kickoff_time);
  const left = ko - now;
  const { d, h, m, s } = parts(left);
  const kicking = left <= 0;

  return (
    <section className="overflow-hidden rounded-card border border-line bg-gradient-to-b from-bg-raised to-tint-accent p-6 text-center">
      <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-faint">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-kickoff-ping rounded-pill bg-accent" />
          <span className="relative inline-flex h-2 w-2 rounded-pill bg-accent" />
        </span>
        {kicking ? 'Kicking off' : label}
      </p>
      <p className="num mt-3 text-4xl font-black tracking-tight sm:text-5xl" role="timer">
        {kicking ? (
          <span className="animate-pulse text-accent">…</span>
        ) : (
          <>
            {d > 0 && <span>{d}d </span>}
            {h}
            <span className="animate-pulse text-text-faint">:</span>
            {m}
            <span className="animate-pulse text-text-faint">:</span>
            {s}
          </>
        )}
      </p>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold">
        <TeamBadge src={teamBadgeUrl(fixture.home_code)} alt={fixture.home} size={22} />
        {fixture.home}
        <span className="text-text-faint">v</span>
        {fixture.away}
        <TeamBadge src={teamBadgeUrl(fixture.away_code)} alt={fixture.away} size={22} />
      </p>
      <p className="num mt-1 text-xs text-text-muted">
        {new Date(fixture.kickoff_time).toLocaleString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </section>
  );
}
