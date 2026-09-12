'use client';

// Composite drawer for a DEFCON profile: stats grid, last-5 threshold bars,
// next-5 fixtures and the Decision block. Shared by the Asset Finder (home)
// and the Value Lens (TASKS.md 1.4/1.7).

import FixtureStrip from '@/components/ds/FixtureStrip';
import PlayerDrawer from '@/components/ds/PlayerDrawer';
import ThresholdBar from '@/components/ds/ThresholdBar';
import { meanNext5Fdr, thresholdFor, type DefconFilePlayer } from '@/lib/defcon/file';
import { decide } from '@/lib/defcon/decision';

const pct = (x: number) => `${Math.round(x * 100)}%`;

export interface PlayerProfileDrawerProps {
  player: DefconFilePlayer;
  onClose: () => void;
}

export default function PlayerProfileDrawer({ player, onClose }: PlayerProfileDrawerProps) {
  const decision = decide({
    hitRate: player.hit_rate,
    threshold: thresholdFor(player.position),
    last5Actions: player.last5_actions,
    meanNext5Fdr: meanNext5Fdr(player),
    status: player.status,
  });

  return (
    <PlayerDrawer
      open
      onClose={onClose}
      title={player.name}
      subtitle={`${player.team} · ${player.position} · £${player.price.toFixed(1)}m`}
      decision={decision}
      decisionLabel="Decision"
      closeLabel="Close"
    >
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {(
          [
            ['Hit rate', pct(player.hit_rate)],
            ['Avg actions', player.mean_actions.toFixed(1)],
            ['Near miss', pct(player.near_miss_rate)],
            ['Consistency', pct(player.consistency)],
            ['DEFCON xPts', player.defcon_xpts.toFixed(2)],
            ['Value /£m', player.value_per_million.toFixed(3)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-card border border-line bg-bg-overlay p-3">
            <dt className="text-xs text-text-muted">{label}</dt>
            <dd className="num mt-1 text-lg">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="mb-2 text-sm text-text-muted">Last 5 matches</h3>
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
