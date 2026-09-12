// Live DEFCON endpoint for the /live tracker (TASKS.md 1.6). The browser polls
// this every 60s; upstream FPL calls are cached by the adapter (live 60s,
// bootstrap/fixtures 6h), so polling clients share one upstream request.

import { NextResponse } from 'next/server';
import { bootstrap, fixtures, live } from '@/lib/fpl/client';
import { buildLivePayload } from '@/lib/defcon/live';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [boot, fix] = await Promise.all([bootstrap(), fixtures()]);
    const currentGw = boot.events.find((e) => e.is_current)?.id ?? null;
    const liveData = currentGw !== null ? await live(currentGw) : null;
    return NextResponse.json(buildLivePayload(boot, fix, liveData));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
