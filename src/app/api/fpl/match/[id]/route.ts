// Match Centre endpoint: one fixture's score, events, squads, DEFCON race and
// team news. The /match/[id] page polls this every 60s while the game is on;
// upstream FPL calls are cached by the adapter (live 60s, bootstrap 6h).

import { NextResponse } from 'next/server';
import { bootstrap, fixtures, live } from '@/lib/fpl/client';
import { buildMatchPayload } from '@/lib/fpl/match';
import { minutesForFixture, recordAndGetEvents } from '@/lib/fpl/eventLedger';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid fixture id' }, { status: 400 });
  }
  try {
    const [boot, fix] = await Promise.all([bootstrap(), fixtures()]);
    const fixture = fix.find((f) => f.id === id);
    if (!fixture) {
      return NextResponse.json({ error: 'fixture not found' }, { status: 404 });
    }
    const liveData = fixture.event !== null && fixture.started ? await live(fixture.event) : null;
    // Detect/refresh event minutes across the whole GW while we are here, then
    // hand this fixture's map to the payload builder.
    const gwFixtures = fixture.event !== null ? fix.filter((f) => f.event === fixture.event) : [];
    const ledger =
      fixture.event !== null ? await recordAndGetEvents(fixture.event, gwFixtures) : [];
    return NextResponse.json(
      buildMatchPayload(boot, fixture, liveData, new Date(), minutesForFixture(ledger, fixture.id)),
      {
        headers: {
          'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
