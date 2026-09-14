// Brand wordmark: three rising threshold bars (the DEFCON motif) + the name.
// Pure inline SVG so it costs nothing and stays crisp at any size.

export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="24" height="24" rx="6" className="fill-bg-overlay" />
        <rect x="5" y="13" width="3.4" height="6" rx="1.2" className="fill-text-faint" />
        <rect x="10.3" y="9" width="3.4" height="10" rx="1.2" className="fill-text-muted" />
        <rect x="15.6" y="5" width="3.4" height="14" rx="1.2" className="fill-accent" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight text-text">
        fpl<span className="text-accent">analytic</span>
      </span>
    </span>
  );
}
