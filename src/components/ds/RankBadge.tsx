// DESIGN.md §2: medal-style pill for ranks 1-3 only, never beyond.

export interface RankBadgeProps {
  rank: number;
}

const TONE: Record<number, string> = {
  1: 'border-accent text-accent',
  2: 'border-info text-info',
  3: 'border-warn text-warn',
};

export default function RankBadge({ rank }: RankBadgeProps) {
  if (rank < 1 || rank > 3) return null;
  return (
    <span
      className={`num inline-flex h-6 w-6 items-center justify-center rounded-pill border bg-bg-overlay text-xs ${TONE[rank]}`}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}
