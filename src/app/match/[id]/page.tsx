// Match Centre (owner direction 2026-09-14): one page per fixture — score,
// events, both squads with live points, the DEFCON race and team news, with a
// pre-match view (kickoff, ones to watch) and a post-match one (FT, bonus).
// Server-rendered for metadata; MatchCenter polls the API while play is on.

import type { Metadata } from 'next';
import AppShell from '@/components/ds/AppShell';
import { BOTTOM_NAV, NAV } from '@/lib/nav';
import { bootstrap, fixtures } from '@/lib/fpl/client';
import MatchCenter from './MatchCenter';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const [boot, fix] = await Promise.all([bootstrap(), fixtures()]);
    const fixture = fix.find((f) => f.id === Number(params.id));
    if (!fixture) return { title: 'Match Centre · fplanalytic' };
    const name = (id: number) => boot.teams.find((t) => t.id === id)?.name ?? '';
    return {
      title: `${name(fixture.team_h)} v ${name(fixture.team_a)} · Match Centre · fplanalytic`,
      description: `Live score, events, squads and the DEFCON race for ${name(fixture.team_h)} v ${name(fixture.team_a)} (GW${fixture.event}).`,
    };
  } catch {
    return { title: 'Match Centre · fplanalytic' };
  }
}

export default function MatchPage({ params }: { params: { id: string } }) {
  return (
    <AppShell brand="fplanalytic" nav={NAV} activeHref="/live" bottomNav={BOTTOM_NAV}>
      <MatchCenter fixtureId={params.id} />
    </AppShell>
  );
}
