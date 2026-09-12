// DESIGN.md §2: friendly empty/loading/error. Skeletons for loading,
// never spinners in tables. Copy comes in via props (docs/COPY.md).

export interface EmptyStateProps {
  kind: 'empty' | 'loading' | 'error';
  title?: string;
  hint?: string;
  /** Number of skeleton rows when kind is "loading" */
  rows?: number;
}

export default function EmptyState({ kind, title, hint, rows = 6 }: EmptyStateProps) {
  if (kind === 'loading') {
    return (
      <div role="status" aria-label={title ?? 'Loading'} className="space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-card bg-bg-overlay" />
        ))}
      </div>
    );
  }
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className="rounded-card border border-line bg-bg-raised px-6 py-10 text-center"
    >
      <p className={kind === 'error' ? 'text-danger' : 'text-text'}>{title}</p>
      {hint && <p className="mt-2 text-sm text-text-muted">{hint}</p>}
    </div>
  );
}
