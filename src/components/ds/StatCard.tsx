// DESIGN.md §2: single KPI with label, value, optional delta/trend chip.
// Value in mono 2xl. One accent element per card maximum.

export interface StatCardProps {
  label: string;
  value: string;
  /** Small line under the value, e.g. player + team */
  detail?: string;
  /** Trend chip, e.g. "+0.4" */
  delta?: string;
  deltaTone?: 'good' | 'bad' | 'neutral';
}

const DELTA_TONE = {
  good: 'text-accent',
  bad: 'text-danger',
  neutral: 'text-text-muted',
} as const;

export default function StatCard({
  label,
  value,
  detail,
  delta,
  deltaTone = 'neutral',
}: StatCardProps) {
  return (
    <div className="rounded-card border border-line bg-bg-raised p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-text-muted">{label}</span>
        {delta && (
          <span
            className={`num rounded-pill bg-bg-overlay px-2 py-0.5 text-xs ${DELTA_TONE[deltaTone]}`}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="num mt-2 text-2xl">{value}</div>
      {detail && <div className="mt-1 text-sm text-text-muted">{detail}</div>}
    </div>
  );
}
