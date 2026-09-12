// Methodology page (TASKS.md 1.5, DESIGN.md §3.4). Plain English, linked from
// every MethodNote. Transparency is brand: it ends with what we do not do.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import { NAV } from '@/lib/nav';

export const metadata: Metadata = {
  title: 'Methodology · fplanalytic',
  description: 'How fplanalytic computes DEFCON hit rates, near misses and expected points.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/methodology">
      <div className="mx-auto max-w-2xl space-y-10">
        <header>
          <h1 className="text-3xl font-semibold">Methodology</h1>
          <p className="mt-2 text-lg text-text-muted">
            Every number on this site is explained here. No black boxes.
          </p>
        </header>

        <Section title="The DEFCON rule">
          <p>
            Since 2025/26, FPL awards 2 points for defensive contribution, at most once per match.
            Defenders need 10 or more combined clearances, blocks, interceptions and tackles.
            Midfielders and forwards need 12 or more, and their count also includes ball recoveries.
          </p>
        </Section>

        <Section title="Hit rate">
          <p>
            A hit is a match where the player reached the threshold. We only count matches with 60
            or more minutes played; a short cameo says nothing about a player&apos;s engine. The
            headline hit rate blends recent form with the season: 60% weight on the last 5
            qualifying matches, 40% on the whole season. With fewer than 5 qualifying matches we use
            the season rate alone.
          </p>
        </Section>

        <Section title="Near miss">
          <p>
            A near miss is a match finishing 1 or 2 actions short of the threshold. A defender who
            keeps landing on 9 is closer to points than his hit rate suggests. High near-miss rates
            are a buy signal, not a flaw.
          </p>
        </Section>

        <Section title="Expected points and value">
          <p>
            DEFCON xPts per match is the blended hit probability times 2. Value is xPts divided by
            price in millions. Consistency is 1 minus the coefficient of variation of the
            player&apos;s actions: steadier engines score closer to their average every week.
          </p>
        </Section>

        <Section title="Decisions">
          <p>
            The Buy, Hold and Avoid calls follow fixed rules. Buy needs a hit rate of at least 60%
            and a next-5 fixture run averaging difficulty 3 or easier. Below a 40% hit rate, or with
            an injury, suspension or availability flag, the call is Avoid. Everything else is Hold.
            The one-line reason always shows the numbers behind the call.
          </p>
        </Section>

        <Section title="Data source and refresh">
          <p>
            All data comes from the official FPL API. Profiles are rebuilt twice a day, at 06:10 and
            18:10 UTC. Each page shows the gameweek and time of its last update.
          </p>
        </Section>

        <Section title="Known limitations">
          <ul className="list-disc space-y-2 pl-5 text-text-muted">
            <li>
              Early in a season the sample is small; hit rates move a lot until roughly gameweek 6.
            </li>
            <li>
              Fixture difficulty uses FPL&apos;s own FDR, which is a blunt instrument against
              low-block opponents.
            </li>
            <li>Minutes risk uses FPL status flags, which can lag press-conference news.</li>
          </ul>
        </Section>

        <Section title="What we do not do">
          <p>
            No black-box machine learning. No hidden weightings. No paid boosts to rankings. If a
            number cannot be explained on this page in plain English, it does not ship.
          </p>
        </Section>
      </div>
    </AppShell>
  );
}
