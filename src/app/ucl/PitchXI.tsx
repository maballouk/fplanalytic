// The predicted XI on a pitch (Scout-Picks-style, in the Broadcast dark
// direction): GK at the top, rows per line, captain badged, xPts per player.
// Server component; selection comes from lib/ucl/xi.ts.

import PitchFrame from '@/components/ds/PitchFrame';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import { club } from '@/lib/ucl/clubs';
import { uclPlayerPhotoUrl } from '@/lib/ucl/photos';
import type { UclPlayer } from '@/lib/ucl/file';
import type { PredictedXI } from '@/lib/ucl/xi';

function PitchPlayer({ player, isCaptain }: { player: UclPlayer; isCaptain: boolean }) {
  const c = club(player.team);
  return (
    <div className="flex w-20 flex-col items-center gap-1 text-center">
      <div className="relative">
        <PlayerAvatar
          src={uclPlayerPhotoUrl(player.player_id)}
          name={player.name}
          ringColor={c.color}
          size={52}
        />
        {isCaptain && (
          <span
            className="num absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-pill bg-accent text-[11px] font-bold text-[#06281a]"
            title="Captain"
          >
            C
          </span>
        )}
      </div>
      <span className="w-full truncate rounded-pill bg-bg/80 px-1.5 py-0.5 text-xs font-medium text-text">
        {player.name}
      </span>
      <span className="num text-[11px] text-accent">{player.xpts.toFixed(1)}</span>
    </div>
  );
}

export default function PitchXI({ xi }: { xi: PredictedXI }) {
  const rows: UclPlayer[][] = [[xi.gk], xi.def, xi.mid, xi.fwd];
  return (
    <PitchFrame>
      {rows.map((row, i) => (
        <div key={i} className="flex items-start justify-center gap-3 sm:gap-6">
          {row.map((p) => (
            <PitchPlayer key={p.player_id} player={p} isCaptain={p === xi.captain} />
          ))}
        </div>
      ))}
    </PitchFrame>
  );
}
