'use client';

// Kickoff countdown for the hub hero (DESIGN.md §4.1). Renders the absolute
// time on the server; hydrates into a live countdown, updating every minute.

import { useEffect, useState } from 'react';

function remaining(target: Date): string | null {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `${days}d ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export default function Countdown({ firstKickoffUtc }: { firstKickoffUtc: string }) {
  const target = new Date(firstKickoffUtc);
  const [left, setLeft] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLeft(remaining(target));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstKickoffUtc]);

  return (
    <div className="rounded-card border border-line bg-bg-raised/80 px-5 py-4 text-center">
      <div className="text-xs uppercase tracking-wider text-text-faint">First kickoff</div>
      <div className="num mt-1 text-2xl font-bold" suppressHydrationWarning>
        {left ??
          target.toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
          })}
      </div>
      <div className="mt-0.5 text-xs text-text-muted">
        {target.toLocaleString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        })}{' '}
        UTC
      </div>
    </div>
  );
}
