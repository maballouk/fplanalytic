// Shared dark pitch surface (markings in faint accent) used by the UCL
// predicted XI and the FPL My Team comparison.

export default function PitchFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-gradient-to-b from-[#0d1a15] via-[#0c1712] to-[#0B0F1A] shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 rounded-[10px] border border-accent/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-4 h-16 w-44 -translate-x-1/2 rounded-b-[10px] border border-t-0 border-accent/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-14 left-1/2 h-28 w-28 -translate-x-1/2 rounded-pill border border-accent/10"
      />
      <div className="relative flex flex-col gap-6 px-4 py-8">{children}</div>
    </div>
  );
}
