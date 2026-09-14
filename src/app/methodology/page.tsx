// Methodology page (TASKS.md 1.5, DESIGN.md §3.4). Plain English, linked from
// every MethodNote. Transparency is brand: it ends with what we do not do.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import { BOTTOM_NAV, NAV } from '@/lib/nav';

export const metadata: Metadata = {
  title: 'Methodology · fplanalytic',
  description:
    'How fplanalytic predicts FPL points: match-record rates, fixture difficulty, top-50 manager consensus and the DEFCON detail.',
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
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/methodology" bottomNav={BOTTOM_NAV}>
      <div className="mx-auto max-w-2xl space-y-10">
        <header>
          <h1 className="text-3xl font-semibold">Methodology</h1>
          <p className="mt-2 text-lg text-text-muted">
            Every number on this site is explained here. No black boxes.
          </p>
        </header>

        <Section title="Two games, one site">
          <p>
            fplanalytic covers two separate fantasy games. <strong>DEFCON, Live and Value</strong>{' '}
            serve the official Premier League game (FPL), where defensive contribution is a scoring
            rule. <strong>European Nights</strong> serves UEFA&apos;s Champions League Fantasy, a
            different game with its own scoring; it has no DEFCON rule, though it does award a point
            per three ball recoveries. Nothing you read on one game&apos;s pages applies to the
            other.
          </p>
        </Section>

        <Section title="Predicted points (v1)">
          <p>
            The headline number for every player is his predicted FPL points for the next gameweek,
            built only from his own match record. We turn his goals, assists, clean sheets, saves,
            bonus and defensive contribution into per-90-minute rates, shrink each rate toward the
            league average for his position (three virtual matches, so a hot two-game start does not
            read as certainty), then scale by the next fixture: easier opponents raise attacking
            returns and clean-sheet odds, harder ones lower them, with a small boost at home. A
            minutes model estimates the chance he starts and how long he plays; every component is
            multiplied by expected minutes. The breakdown in each player&apos;s profile shows
            exactly where the number comes from — minutes, goals, assists, clean sheet, saves, bonus
            and DEFCON, in points.
          </p>
        </Section>

        <Section title="What the world's best managers think">
          <p>
            Prediction models miss things humans catch: press conferences, eye tests, price
            momentum. So next to every prediction we show the consensus of the top 50 managers in
            the world — the current leaders of FPL&apos;s overall ranking, whose squads are public
            through the official API. &ldquo;Top-50 own&rdquo; is the share of those 50 squads
            holding the player; the C badge is how many captain him. A player our model rates highly
            whom the elite ignore is a genuine differential; one the elite pile into despite a tough
            run is flagged as a trap. Their picks refresh with every data build.
          </p>
        </Section>

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
            the season rate alone. The blend is then shrunk toward the league rate for the position
            with four virtual matches, so a perfect two-match start reads as roughly 50%, not
            certainty.
          </p>
        </Section>

        <Section title="Near miss">
          <p>
            A near miss is a match finishing 1 or 2 actions short of the threshold. A defender who
            keeps landing on 9 is closer to points than his hit rate suggests. High near-miss rates
            are a buy signal, not a flaw.
          </p>
        </Section>

        <Section title="DEFCON xPts and value">
          <p>
            DEFCON xPts per match is the blended hit probability times 2 — it is the defensive slice
            of the total prediction, kept visible on its own because it is this site&apos;s
            specialty. Value is DEFCON xPts divided by price in millions. Consistency is 1 minus the
            coefficient of variation of the player&apos;s actions: steadier engines score closer to
            their average every week.
          </p>
        </Section>

        <Section title="Decisions">
          <p>
            The Buy, Hold and Avoid calls follow one fixed rule for every position, on the same
            predicted-points number the page shows. Buy needs 4+ predicted points, a 75%+ chance of
            starting and a next-5 run that is not brutal (average difficulty 3.5 or easier). An
            injury, suspension or availability flag, a starting chance under 50%, or fewer than 2.5
            predicted points is Avoid. Everything else is Hold. The one-line reason always shows the
            numbers behind the call.
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
