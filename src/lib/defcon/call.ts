// The Buy / Hold / Avoid call on a player, computed from the same predicted
// points the page shows (one rule for every position — owner direction
// 2026-09-13). Shared by the profile drawer and the /player pages.

import type { Decision } from './decision';
import { meanNext5Fdr, type DefconFilePlayer } from './file';

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function callPlayer(player: DefconFilePlayer): Decision {
  const line = `Predicted ${player.xpts_total.toFixed(1)} pts next GW. P(start) ${pct(player.p_start)}.`;
  if (player.status !== 'a') {
    return {
      verdict: 'Avoid',
      reason: `Flagged by FPL. Predicted ${player.xpts_total.toFixed(1)} pts next GW.`,
    };
  }
  const fdr = meanNext5Fdr(player);
  if (player.xpts_total >= 4 && player.p_start >= 0.75 && (fdr === null || fdr <= 3.5)) {
    return { verdict: 'Buy', reason: line };
  }
  if (player.p_start < 0.5 || player.xpts_total < 2.5) {
    return { verdict: 'Avoid', reason: line };
  }
  return { verdict: 'Hold', reason: line };
}
