// Decision logic for the PlayerDrawer (TASKS.md 1.4, thresholds recalibrated
// 2026-09-13 when hit rates gained league-prior shrinkage; the original
// 0.6/0.4 cutoffs were set for raw rates and left everything on Hold):
//   Buy   if shrunk hit_rate >= BUY_MIN AND next-5 mean FDR <= 3
//   Avoid if shrunk hit_rate < AVOID_MAX OR minutes risk (status not "a")
//   Hold  otherwise (including a strong engine facing a tough run)
// Reason strings follow the approved pattern in docs/COPY.md:
//   "{hits} of last {n} with {threshold}+ actions. {fixture note}"

import type { Verdict } from '@/components/ds/PlayerDrawer';

export interface DecisionInput {
  hitRate: number; // blended, 0-1
  threshold: number; // 10 DEF, 12 MID/FWD
  last5Actions: number[];
  /** Mean FDR of the next 5 fixtures; null when no fixtures remain */
  meanNext5Fdr: number | null;
  /** FPL status flag: a=available, d=doubtful, i=injured, s=suspended, u=unavailable */
  status: string;
}

// ~1.7x the league DEF prior; a genuinely bankable profile after shrinkage
export const BUY_MIN = 0.45;
export const AVOID_MAX = 0.25;

export interface Decision {
  verdict: Verdict;
  reason: string;
}

const STATUS_WORD: Record<string, string> = {
  d: 'doubtful',
  i: 'injured',
  s: 'suspended',
  u: 'unavailable',
};

export function hasMinutesRisk(status: string): boolean {
  return status !== 'a';
}

function engineSentence(input: DecisionInput): string {
  const hits = input.last5Actions.filter((a) => a >= input.threshold).length;
  const n = input.last5Actions.length;
  return `${hits} of last ${n} with ${input.threshold}+ actions.`;
}

function fixtureNote(meanFdr: number | null): string {
  if (meanFdr === null) return 'No upcoming fixtures.';
  if (meanFdr <= 2.5) return 'Soft run next.';
  if (meanFdr <= 3.2) return 'Even run next.';
  return 'Tough run next.';
}

export function decide(input: DecisionInput): Decision {
  if (hasMinutesRisk(input.status)) {
    const word = STATUS_WORD[input.status] ?? 'flagged';
    return {
      verdict: 'Avoid',
      reason: `Minutes risk: ${word}. ${engineSentence(input)}`,
    };
  }
  if (input.hitRate < AVOID_MAX) {
    return {
      verdict: 'Avoid',
      reason: `${engineSentence(input)} Hit rate too low. ${fixtureNote(input.meanNext5Fdr)}`,
    };
  }
  if (input.hitRate >= BUY_MIN && input.meanNext5Fdr !== null && input.meanNext5Fdr <= 3) {
    return {
      verdict: 'Buy',
      reason: `${engineSentence(input)} ${fixtureNote(input.meanNext5Fdr)}`,
    };
  }
  return {
    verdict: 'Hold',
    reason: `${engineSentence(input)} ${fixtureNote(input.meanNext5Fdr)}`,
  };
}
