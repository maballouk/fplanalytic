'use client';

// Compact live countdown for the header: "GW6 · 2d 4h". Ticks once a minute;
// renders nothing after the deadline passes (the StateBanner owns that story).

import { useEffect, useState } from 'react';

function remaining(iso: string, now: number): string | null {
  const ms = Date.parse(iso) - now;
  if (Number.isNaN(ms) || ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DeadlineChip({
  label,
  deadlineUtc,
}: {
  label: string;
  deadlineUtc: string;
}) {
  // Render on the client only: the countdown depends on the viewer's clock,
  // and a server-rendered value would mismatch on hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const left = remaining(deadlineUtc, now);
  if (left === null) return null;
  const urgent = Date.parse(deadlineUtc) - now < 24 * 3600 * 1000;
  return (
    <span
      className={`num rounded-pill border px-2.5 py-1 text-xs font-semibold ${
        urgent ? 'border-warn/40 bg-warn/10 text-warn' : 'border-line bg-bg-raised text-text-muted'
      }`}
      title={`${label} deadline`}
    >
      {label} · {left}
    </span>
  );
}
