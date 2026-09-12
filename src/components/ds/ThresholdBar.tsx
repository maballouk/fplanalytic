// DESIGN.md §2: horizontal bar 0 -> threshold showing defensive actions in a
// match. Fill accent at/over threshold, warn within 2, grey otherwise.
// Used everywhere DEFCON is shown.

export interface ThresholdBarProps {
  actions: number;
  threshold: number;
  nearMissMargin?: number;
  /** Accessible description, e.g. "8 of 10 defensive actions" */
  label: string;
}

export type ThresholdState = 'hit' | 'near' | 'below';

export function thresholdState(
  actions: number,
  threshold: number,
  nearMissMargin = 2
): ThresholdState {
  if (actions >= threshold) return 'hit';
  if (actions >= threshold - nearMissMargin) return 'near';
  return 'below';
}

const FILL: Record<ThresholdState, string> = {
  hit: 'bg-accent',
  near: 'bg-warn',
  below: 'bg-line-strong',
};

export default function ThresholdBar({
  actions,
  threshold,
  nearMissMargin = 2,
  label,
}: ThresholdBarProps) {
  const state = thresholdState(actions, threshold, nearMissMargin);
  const pct = Math.min(actions / threshold, 1) * 100;
  return (
    <div className="flex items-center gap-2">
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={actions}
        aria-valuemin={0}
        aria-valuemax={threshold}
        data-state={state}
        className="h-2 w-full min-w-16 overflow-hidden rounded-pill bg-line"
      >
        <div
          className={`h-full rounded-pill transition-[width] duration-hover ${FILL[state]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="num text-xs text-text-muted">{actions}</span>
    </div>
  );
}
