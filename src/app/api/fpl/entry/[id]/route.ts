// My Team endpoint: a manager's public FPL squad, enriched with names, media
// codes and status from bootstrap (the browser cannot call the FPL API
// directly). Picks are public on the FPL API by design; we never see a login.

import { NextResponse } from 'next/server';
import { bootstrap, entry, entryPicks, FplApiError } from '@/lib/fpl/client';
import type { EntryPickView } from '@/lib/defcon/myteam';

export const dynamic = 'force-dynamic';

const POSITION: Record<number, EntryPickView['position']> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const teamId = Number(params.id);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return NextResponse.json({ error: 'invalid team id' }, { status: 400 });
  }
  try {
    const boot = await bootstrap();
    const gw =
      boot.events.find((e) => e.is_current)?.id ?? boot.events.find((e) => e.is_next)?.id ?? 1;
    const [meta, picksData] = await Promise.all([entry(teamId), entryPicks(teamId, gw)]);

    const teamById = new Map(boot.teams.map((t) => [t.id, t]));
    const elementById = new Map(boot.elements.map((e) => [e.id, e]));
    const picks: EntryPickView[] = picksData.picks.map((p) => {
      const el = elementById.get(p.element);
      const team = el ? teamById.get(el.team) : undefined;
      return {
        id: p.element,
        name: el?.web_name ?? String(p.element),
        code: el?.code ?? 0,
        team: team?.short_name ?? '',
        team_code: team?.code ?? 0,
        position: POSITION[el?.element_type ?? 0] ?? 'MID',
        pick_position: p.position,
        is_captain: p.is_captain,
        status: el?.status ?? 'a',
      };
    });

    return NextResponse.json({
      gw,
      entry: {
        id: meta.id,
        team_name: meta.name,
        manager: `${meta.player_first_name} ${meta.player_last_name}`,
        overall_rank: meta.summary_overall_rank,
      },
      picks,
    });
  } catch (err) {
    if (err instanceof FplApiError && err.status === 404) {
      return NextResponse.json({ error: 'team not found' }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
