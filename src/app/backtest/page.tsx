// Backtest page (TASKS.md 1.5.7): we grade our own predictions in public.
// One row per finished gameweek — mean error, how many of our top 10 landed,
// the best call and the worst miss, names included. Transparency is brand.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import EmptyState from '@/components/ds/EmptyState';
import MethodNote from '@/components/ds/MethodNote';
import { loadBacktest, type BacktestResult } from '@/lib/defcon/backtest';
import { loadLatestDefcon } from '@/lib/defcon/data';
import { BOTTOM_NAV, NAV } from '@/lib/nav';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Backtest: how good are the predictions? · fplanalytic',
  description:
    'Every gameweek we grade our own FPL predictions against what actually happened: mean error, hits, the best call and the worst miss. Names included.',
};

function ResultCard({ r }: { r: BacktestResult }) {
  return (
    <div className="rounded-card border border-line bg-bg-raised p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">GW{r.gw}</h2>
        <span className="num text-xs text-text-faint">{r.n} players scored</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-card border border-line bg-bg-overlay p-3">
          <dt className="text-xs text-text-muted">Mean error</dt>
          <dd className="num mt-1 text-lg">{r.mae.toFixed(2)} pts</dd>
        </div>
        <div className="rounded-card border border-line bg-bg-overlay p-3">
          <dt className="text-xs text-text-muted">Bias</dt>
          <dd className="num mt-1 text-lg">
            {r.bias > 0 ? '+' : ''}
            {r.bias.toFixed(2)}
          </dd>
        </div>
        <div className="rounded-card border border-line bg-bg-overlay p-3">
          <dt className="text-xs text-text-muted">Top 10 → top 20</dt>
          <dd className="num mt-1 text-lg">{r.top10_in_top20}/10</dd>
        </div>
      </dl>
      <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
        {r.best_call && (
          <p>
            <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
              BEST CALL
            </span>{' '}
            {r.best_call.name} ({r.best_call.team}): predicted{' '}
            <span className="num">{r.best_call.predicted}</span>, scored{' '}
            <span className="num text-accent">{r.best_call.actual}</span>
          </p>
        )}
        {r.worst_miss && (
          <p>
            <span className="rounded-pill bg-tint-danger px-2 py-0.5 text-xs font-semibold text-danger">
              WORST MISS
            </span>{' '}
            {r.worst_miss.name} ({r.worst_miss.team}): predicted{' '}
            <span className="num">{r.worst_miss.predicted}</span>, scored{' '}
            <span className="num text-danger">{r.worst_miss.actual}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function BacktestPage() {
  const bt = loadBacktest();
  const gw = loadLatestDefcon()?.calendar?.next_gw ?? null;
  const results = [...(bt?.results ?? [])].sort((a, b) => b.gw - a.gw);

  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/backtest" bottomNav={BOTTOM_NAV}>
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-black tracking-tight">
            How good are the predictions?
          </h1>
          <p className="mt-2 text-text-muted">
            Every gameweek we lock the final pre-deadline predictions and grade them against what
            actually happened. Wins and misses, names included.
          </p>
        </header>

        {results.length === 0 ? (
          <EmptyState
            kind="empty"
            title={
              bt?.pending
                ? `GW${bt.pending.gw} predictions are locked. The first report card lands when the gameweek finishes.`
                : 'The first report card lands after the next gameweek finishes.'
            }
            hint="Scored automatically by the twice-daily data build."
          />
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
              <ResultCard key={r.gw} r={r} />
            ))}
          </div>
        )}

        {bt?.pending && results.length > 0 && (
          <p className="num mt-4 text-xs text-text-faint">
            GW{bt.pending.gw} predictions locked · scored when the gameweek finishes
          </p>
        )}
        {gw !== null && (
          <div className="mt-6">
            <MethodNote
              summary="How we compute this"
              methodologyHref="/methodology"
              methodologyLabel="Full methodology"
            >
              <p>
                We score every player we backed to play (P(start) 50%+) who got minutes: mean
                absolute error between predicted and actual points, the bias (positive means we
                over-promise), and how many of our predicted top 10 finished in the actual top 20.
                Players who got zero minutes are excluded — that is a rotation miss, tracked by the
                minutes model, not a scoring miss.
              </p>
            </MethodNote>
          </div>
        )}
      </div>
    </AppShell>
  );
}
