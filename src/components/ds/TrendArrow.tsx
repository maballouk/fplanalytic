// Movement arrow: did this prediction rise or fall since the previous data
// build? Silent when the move is small or there is no previous value.

export default function TrendArrow({
  now,
  prev,
  threshold = 0.3,
}: {
  now: number;
  prev?: number;
  threshold?: number;
}) {
  if (prev === undefined) return null;
  const delta = now - prev;
  if (Math.abs(delta) < threshold) return null;
  const up = delta > 0;
  return (
    <span
      className={`ml-1 text-xs ${up ? 'text-accent' : 'text-danger'}`}
      title={`${up ? '+' : ''}${delta.toFixed(1)} since the last update`}
    >
      {up ? '▲' : '▼'}
    </span>
  );
}
