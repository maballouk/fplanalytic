// DESIGN.md §2: collapsible "How we compute this". Every model output has one;
// transparency is brand. Native <details> keeps it JS-free.

export interface MethodNoteProps {
  /** Summary label; copy approved via docs/COPY.md */
  summary: string;
  children: React.ReactNode;
  /** Link target for the full methodology page (TASKS.md 1.5) */
  methodologyHref?: string;
  methodologyLabel?: string;
}

export default function MethodNote({
  summary,
  children,
  methodologyHref,
  methodologyLabel,
}: MethodNoteProps) {
  return (
    <details className="rounded-card border border-line bg-bg-raised text-sm text-text-muted">
      <summary className="cursor-pointer select-none px-4 py-2 text-text-muted transition-colors duration-hover hover:text-text">
        {summary}
      </summary>
      <div className="space-y-2 border-t border-line px-4 py-3">
        {children}
        {methodologyHref && (
          <p>
            <a href={methodologyHref} className="text-info underline-offset-2 hover:underline">
              {methodologyLabel ?? methodologyHref}
            </a>
          </p>
        )}
      </div>
    </details>
  );
}
