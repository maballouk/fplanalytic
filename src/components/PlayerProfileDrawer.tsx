'use client';

// Player drawer: totals first (predicted points with a breakdown a manager
// can read), elite consensus, then the DEFCON detail for outfielders.

import { useEffect } from 'react';
import CountUp from '@/components/ds/CountUp';
import TrendArrow from '@/components/ds/TrendArrow';
import FixtureStrip from '@/components/ds/FixtureStrip';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import PlayerDrawer from '@/components/ds/PlayerDrawer';
import ThresholdBar from '@/components/ds/ThresholdBar';
import { track } from '@/lib/analytics';
import { playerPhotoUrl } from '@/lib/fpl/photos';
import { difficultyWord, thresholdFor, type DefconFilePlayer } from '@/lib/defcon/file';
import { callPlayer } from '@/lib/defcon/call';

const pct = (x: number) => `${Math.round(x * 100)}%`;

const BREAKDOWN_LABELS: Record<string, string> = {
  appearance: 'Minutes',
  goals: 'Goals',
  assists: 'Assists',
  clean_sheet: 'Clean sheet',
  saves: 'Saves',
  bonus: 'Bonus',
  defcon: 'DEFCON',
  conceded: 'Conceded',
};

export interface PlayerProfileDrawerProps {
  player: DefconFilePlayer;
  onClose: () => void;
}

// One rule for every position, on the number the headline shows (shared with
// the /player pages): lib/defcon/call.ts.

export default function PlayerProfileDrawer({ player, onClose }: PlayerProfileDrawerProps) {
  const decision = callPlayer(player);

  useEffect(() => {
    track('drawer_decision_view', { player: player.name, verdict: decision.verdict });
  }, [player.name, decision.verdict]);

  const next = player.next5[0];
  const NEXT_TONE = {
    Soft: 'border-accent-dim/50 text-accent',
    Even: 'border-line-strong text-text-muted',
    Tough: 'border-danger/50 text-danger',
  } as const;

  const breakdown = Object.entries(player.xpts_breakdown)
    .filter(([, v]) => Math.abs(v) >= 0.15)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return (
    <PlayerDrawer
      open
      onClose={onClose}
      title={player.name}
      subtitle={`${player.team} · ${player.position} · £${player.price.toFixed(1)}m${
        player.price_change
          ? ` (${player.price_change > 0 ? '▲' : '▼'}${Math.abs(player.price_change).toFixed(1)})`
          : ''
      }`}
      leading={<PlayerAvatar src={playerPhotoUrl(player.code)} name={player.name} size={48} />}
      decision={decision}
      decisionLabel="Decision"
      closeLabel="Close"
    >
      {/* Totals first: the number a manager understands */}
      <div className="rounded-card border border-accent/20 bg-[#0d1a15] p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-text-faint">
            Predicted next GW
          </span>
          <span className="num text-xs text-text-muted">
            form {player.form5.toFixed(1)} · P(start) {pct(player.p_start)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="num text-3xl font-bold text-accent">
            <CountUp value={player.xpts_total} />
          </span>
          <span className="text-sm text-text-muted">points</span>
          <TrendArrow now={player.xpts_total} prev={player.xpts_prev} />
        </div>
        {breakdown.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {breakdown.map(([k, v]) => (
              <span
                key={k}
                className="num rounded-pill bg-bg-overlay px-2 py-0.5 text-xs text-text-muted"
              >
                {BREAKDOWN_LABELS[k] ?? k} {v > 0 ? v.toFixed(1) : v.toFixed(1)}
              </span>
            ))}
          </div>
        )}
        {(player.elite_own > 0 || player.elite_cap > 0) && (
          <p className="mt-3 border-t border-line pt-2 text-sm text-text">
            Owned by <span className="num text-accent">{pct(player.elite_own)}</span> of the
            world&apos;s top 50 managers
            {player.elite_cap > 0 && (
              <>
                {' '}
                · captained by <span className="num text-warn">{pct(player.elite_cap)}</span>
              </>
            )}
          </p>
        )}
        <a
          href={`/player/${player.player_id}`}
          className="mt-3 inline-block text-xs text-text-muted underline-offset-2 transition-colors duration-hover hover:text-text hover:underline"
        >
          Full profile page →
        </a>
      </div>

      {next && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Next match:</span>
          <span className="text-text">
            {next.opponent} ({next.is_home ? 'H' : 'A'})
          </span>
          <span
            className={`rounded-pill border px-2 py-0.5 text-xs font-semibold ${NEXT_TONE[difficultyWord(next.difficulty)]}`}
          >
            {difficultyWord(next.difficulty)}
          </span>
        </div>
      )}

      {player.position !== 'GK' && (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {(
              [
                ['DEFCON hit rate', pct(player.hit_rate)],
                ['Avg actions', player.mean_actions.toFixed(1)],
                ['Near miss', pct(player.near_miss_rate)],
                ['DEFCON xPts', player.defcon_xpts.toFixed(2)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-card border border-line bg-bg-overlay p-3">
                <dt className="text-xs text-text-muted">{label}</dt>
                <dd className="num mt-1 text-lg">{value}</dd>
              </div>
            ))}
          </dl>
          {player.last5_actions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm text-text-muted">Last 5 matches · defensive actions</h3>
              <div className="space-y-1">
                {player.last5_actions.map((a, i) => (
                  <ThresholdBar
                    key={i}
                    actions={a}
                    threshold={thresholdFor(player.position)}
                    label={`${a} of ${thresholdFor(player.position)} defensive actions`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div>
        <h3 className="mb-2 text-sm text-text-muted">Next 5</h3>
        <FixtureStrip
          fixtures={player.next5.map((f) => ({
            opponent: f.opponent,
            isHome: f.is_home,
            difficulty: f.difficulty,
          }))}
        />
      </div>
    </PlayerDrawer>
  );
}
