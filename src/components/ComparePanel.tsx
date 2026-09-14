'use client';

// Side-by-side comparison of two players (look & feel round, 2026-09-14).
// Every row shows both values; the better one carries the accent.

import { useEffect } from 'react';
import CountUp from '@/components/ds/CountUp';
import FixtureStrip from '@/components/ds/FixtureStrip';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import TeamBadge from '@/components/ds/TeamBadge';
import { track } from '@/lib/analytics';
import { meanNext5Fdr, type DefconFilePlayer } from '@/lib/defcon/file';
import { playerPhotoUrl, teamBadgeUrl } from '@/lib/fpl/photos';

const pct = (x: number) => `${Math.round(x * 100)}%`;

interface MetricRow {
  label: string;
  value: (p: DefconFilePlayer) => number | null;
  format: (v: number) => string;
  /** true when a HIGHER value is the better one */
  higherIsBetter: boolean;
}

const ROWS: MetricRow[] = [
  {
    label: 'Predicted pts',
    value: (p) => p.xpts_total,
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: 'Form (last 5)',
    value: (p) => p.form5,
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  { label: 'P(start)', value: (p) => p.p_start, format: pct, higherIsBetter: true },
  { label: 'Top-50 own', value: (p) => p.elite_own, format: pct, higherIsBetter: true },
  {
    label: 'Overall own',
    value: (p) => p.ownership,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  { label: 'Price £m', value: (p) => p.price, format: (v) => v.toFixed(1), higherIsBetter: false },
  {
    label: 'DEFCON xPts',
    value: (p) => (p.position === 'GK' ? null : p.defcon_xpts),
    format: (v) => v.toFixed(2),
    higherIsBetter: true,
  },
  {
    label: 'Next-5 difficulty',
    value: (p) => meanNext5Fdr(p),
    format: (v) => v.toFixed(1),
    higherIsBetter: false,
  },
];

export default function ComparePanel({
  a,
  b,
  onClose,
}: {
  a: DefconFilePlayer;
  b: DefconFilePlayer;
  onClose: () => void;
}) {
  useEffect(() => {
    track('compare_view', { a: a.name, b: b.name });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [a.name, b.name, onClose]);

  const head = (p: DefconFilePlayer) => (
    <div className="flex flex-col items-center gap-2 text-center">
      <PlayerAvatar src={playerPhotoUrl(p.code)} name={p.name} size={56} />
      <div>
        <div className="font-semibold text-text">{p.name}</div>
        <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-text-muted">
          <TeamBadge src={teamBadgeUrl(p.team_code)} alt={p.team} size={13} />
          {p.team} · {p.position}
        </div>
      </div>
      <div className="num text-3xl font-bold text-accent">
        <CountUp value={p.xpts_total} />
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Compare players"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-bg/70"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-card border border-line bg-bg-raised p-5 shadow-card">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-faint">
            Head to head
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-pill px-2 py-1 text-text-muted transition-colors duration-hover hover:bg-bg-overlay hover:text-text"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 border-b border-line pb-4">
          {head(a)}
          {head(b)}
        </div>
        <dl className="mt-3 space-y-1">
          {ROWS.map((row) => {
            const va = row.value(a);
            const vb = row.value(b);
            const aWins =
              va !== null && vb !== null && va !== vb && (row.higherIsBetter ? va > vb : va < vb);
            const bWins =
              va !== null && vb !== null && va !== vb && (row.higherIsBetter ? vb > va : vb < va);
            return (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-card px-2 py-1.5 odd:bg-bg-overlay/50"
              >
                <dd className={`num text-sm ${aWins ? 'font-bold text-accent' : 'text-text'}`}>
                  {va === null ? '—' : row.format(va)}
                </dd>
                <dt className="text-center text-xs text-text-muted">{row.label}</dt>
                <dd
                  className={`num text-right text-sm ${bWins ? 'font-bold text-accent' : 'text-text'}`}
                >
                  {vb === null ? '—' : row.format(vb)}
                </dd>
              </div>
            );
          })}
        </dl>
        <div className="mt-3 grid grid-cols-2 gap-4">
          {[a, b].map((p) => (
            <FixtureStrip
              key={p.player_id}
              fixtures={p.next5.map((f) => ({
                opponent: f.opponent,
                isHome: f.is_home,
                difficulty: f.difficulty,
              }))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
