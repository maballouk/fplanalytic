// DESIGN.md §2: next 5 fixtures as difficulty chips. FDR colour ramp, muted.

export interface FixtureChip {
  opponent: string; // short name, e.g. "ARS"
  isHome: boolean;
  difficulty: number; // FPL FDR 1-5
}

export interface FixtureStripProps {
  fixtures: FixtureChip[];
}

// Muted FDR ramp on tokens only: easy leans accent, hard leans danger.
function fdrClasses(difficulty: number): string {
  if (difficulty <= 2) return 'text-accent-dim border-line';
  if (difficulty === 3) return 'text-text-muted border-line';
  if (difficulty === 4) return 'text-warn border-line';
  return 'text-danger border-line-strong';
}

export default function FixtureStrip({ fixtures }: FixtureStripProps) {
  return (
    <ul className="flex items-center gap-1" aria-label="Next fixtures">
      {fixtures.map((f, i) => (
        <li
          key={`${f.opponent}-${i}`}
          data-difficulty={f.difficulty}
          className={`rounded-pill border bg-bg-overlay px-1.5 py-0.5 text-xs ${fdrClasses(f.difficulty)}`}
          title={`${f.opponent} (${f.isHome ? 'H' : 'A'}), difficulty ${f.difficulty}`}
        >
          {f.opponent} {f.isHome ? '(H)' : '(A)'}
        </li>
      ))}
    </ul>
  );
}
