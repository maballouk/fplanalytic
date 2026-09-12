'use client';

// DESIGN.md §2: right-side panel with the full profile and "Why this player".
// Always ends with a Decision block: Buy / Hold / Avoid + one sentence.

import { useEffect } from 'react';

export type Verdict = 'Buy' | 'Hold' | 'Avoid';

export interface PlayerDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Optional element before the title, e.g. a PlayerAvatar */
  leading?: React.ReactNode;
  children: React.ReactNode;
  decision: { verdict: Verdict; reason: string };
  /** Heading of the decision block; copy approved via docs/COPY.md */
  decisionLabel: string;
  closeLabel: string;
}

const VERDICT_TONE: Record<Verdict, string> = {
  Buy: 'border-accent text-accent',
  Hold: 'border-warn text-warn',
  Avoid: 'border-danger text-danger',
};

export default function PlayerDrawer({
  open,
  onClose,
  title,
  subtitle,
  leading,
  children,
  decision,
  decisionLabel,
  closeLabel,
}: PlayerDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-bg/70"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-bg-raised shadow-card transition-transform duration-panel">
        <header className="flex items-start justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            {leading}
            <div>
              <h2 className="text-lg text-text">{title}</h2>
              {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-pill px-2 py-1 text-text-muted transition-colors duration-hover hover:bg-bg-overlay hover:text-text"
          >
            ×
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
        <footer className="border-t border-line px-5 py-4" data-testid="decision-block">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-pill border px-3 py-1 text-sm ${VERDICT_TONE[decision.verdict]}`}
            >
              {decision.verdict}
            </span>
            <span className="text-xs uppercase tracking-wide text-text-faint">{decisionLabel}</span>
          </div>
          <p className="mt-2 text-sm text-text">{decision.reason}</p>
        </footer>
      </aside>
    </div>
  );
}
