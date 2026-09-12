// Decision logic for the PlayerDrawer (TASKS.md 1.4):
//   Buy   if blended hit_rate >= 0.6 AND next-5 mean FDR <= 3
//   Avoid if hit_rate < 0.4 OR minutes risk (FPL status flag not "a")
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
  if (input.hitRate < 0.4) {
    return {
      verdict: 'Avoid',
      reason: `${engineSentence(input)} Hit rate too low. ${fixtureNote(input.meanNext5Fdr)}`,
    };
  }
  if (input.hitRate >= 0.6 && input.meanNext5Fdr !== null && input.meanNext5Fdr <= 3) {
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
