// DESIGN.md §2: blur + lock + one-line value prop + CTA. Never hides the
// EXISTENCE of data, only detail. Inline, never a modal wall (§6).

export interface PremiumLockProps {
  /** The locked content, rendered blurred and inert behind the lock */
  children: React.ReactNode;
  /** One-line value prop; copy approved via docs/COPY.md */
  valueProp: string;
  ctaLabel: string;
  ctaHref: string;
}

export default function PremiumLock({ children, valueProp, ctaLabel, ctaHref }: PremiumLockProps) {
  return (
    <div className="relative overflow-hidden rounded-card" data-testid="premium-lock">
      <div aria-hidden className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/60 px-4 text-center">
        <span aria-hidden className="text-premium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 016 0v3H9z" />
          </svg>
        </span>
        <p className="text-sm text-text">{valueProp}</p>
        <a
          href={ctaHref}
          className="rounded-pill border border-premium px-4 py-1 text-sm text-premium transition-colors duration-hover hover:bg-bg-overlay"
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
