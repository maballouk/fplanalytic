'use client';

// UCL xPts table (DESIGN.md §4.1): position filter, P(plays) with rotation
// amber, breakdown chips. Free tier shows the top 40; more behind the lock.

import { useEffect, useMemo, useState } from 'react';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import PremiumLock from '@/components/ds/PremiumLock';
import RankBadge from '@/components/ds/RankBadge';
import SegmentedTabs from '@/components/ds/SegmentedTabs';
import { club } from '@/lib/ucl/clubs';
import { uclPlayerPhotoUrl } from '@/lib/ucl/photos';
import { topContributors, type UclPlayer } from '@/lib/ucl/file';

type PositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD';

const pct = (x: number) => `${Math.round(x * 100)}%`;

function Row({ player, rank }: { player: UclPlayer; rank: number }) {
  const c = club(player.team);
  const chips = topContributors(player.breakdown);
  return (
    <tr className="border-b border-line transition-colors duration-hover hover:bg-bg-overlay">
      <td className="num px-3 py-2 text-text-muted">
        {rank <= 3 ? <RankBadge rank={rank} /> : rank}
      </td>
      <td className="px-3 py-2">
        <span className="flex items-center gap-2.5">
          <PlayerAvatar
            src={uclPlayerPhotoUrl(player.player_id)}
            name={player.name}
            ringColor={c.color}
            size={28}
          />
          <span className="text-text">{player.name}</span>
          <span className="text-xs text-text-faint">{c.code}</span>
        </span>
      </td>
      <td className="px-3 py-2 text-text-muted">{player.position}</td>
      <td className="num px-3 py-2">{player.price.toFixed(1)}</td>
      <td className="px-3 py-2 text-text-muted">
        {club(player.opponent).code} ({player.is_home ? 'H' : 'A'})
      </td>
      <td className={`num px-3 py-2 ${player.p_plays < 0.7 ? 'text-warn' : ''}`}>
        {pct(player.p_plays)}
      </td>
      <td className={`num px-3 py-2 font-bold ${rank === 1 ? 'text-accent' : ''}`}>
        {player.xpts.toFixed(2)}
      </td>
      <td className="num px-3 py-2">
        {Math.round(player.sel_per)}%
        {player.transfer_balance > 1000 && (
          <span className="ml-1 text-xs text-accent" title="Transfer momentum: managers buying">
            ▲
          </span>
        )}
      </td>
      <td className="num px-3 py-2 text-text-muted">{player.xpts_per_million.toFixed(2)}</td>
      <td className="px-3 py-2">
        <span className="flex gap-1">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="num rounded-pill bg-bg-overlay px-2 py-0.5 text-xs text-text-muted"
            >
              {chip.label} {chip.value.toFixed(1)}
            </span>
          ))}
        </span>
      </td>
    </tr>
  );
}

export default function XptsTable({
  players,
  freeLimit = 40,
}: {
  players: UclPlayer[];
  freeLimit?: number;
}) {
  const [position, setPosition] = useState<PositionFilter>('ALL');

  // URLs reflect UI state: /ucl?pos=DEF is shareable (Web Interface Guidelines)
  useEffect(() => {
    const pos = new URLSearchParams(window.location.search).get('pos');
    if (pos && ['GK', 'DEF', 'MID', 'FWD'].includes(pos)) setPosition(pos as PositionFilter);
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (position === 'ALL') q.delete('pos');
    else q.set('pos', position);
    const qs = q.toString();
    // Preserve history.state: Next's App Router keeps its internal tree there,
    // and replacing it with null crashes the router on the next interaction.
    window.history.replaceState(window.history.state, '', qs ? `?${qs}` : window.location.pathname);
  }, [position]);

  const filtered = useMemo(
    () => players.filter((p) => position === 'ALL' || p.position === position),
    [players, position]
  );
  const visible = filtered.slice(0, freeLimit);
  const locked = filtered.slice(freeLimit, freeLimit + 5);

  return (
    <section>
      <div className="mb-4">
        <SegmentedTabs
          label="Position"
          value={position}
          onChange={setPosition}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'GK', label: 'GK' },
            { value: 'DEF', label: 'DEF' },
            { value: 'MID', label: 'MID' },
            { value: 'FWD', label: 'FWD' },
          ]}
        />
      </div>
      {/* Phones get cards, not a sideways-scrolling table */}
      <ol className="space-y-2 md:hidden">
        {visible.map((p, i) => {
          const c = club(p.team);
          return (
            <li
              key={p.player_id}
              className="flex items-center gap-3 rounded-card border border-line bg-bg-raised p-3"
            >
              <span className="num w-5 shrink-0 text-center text-xs text-text-faint">{i + 1}</span>
              <PlayerAvatar
                src={uclPlayerPhotoUrl(p.player_id)}
                name={p.name}
                ringColor={c.color}
                size={40}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-text">{p.name}</span>
                <span className="mt-0.5 block text-xs text-text-muted">
                  {c.code} · {p.position} · €{p.price.toFixed(1)}m · v {club(p.opponent).code} (
                  {p.is_home ? 'H' : 'A'})
                  <span className="num text-text-faint"> · {Math.round(p.sel_per)}% picked</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="num block text-xl font-bold text-accent">{p.xpts.toFixed(1)}</span>
                <span className="num block text-[10px] uppercase tracking-wide text-text-faint">
                  xPts
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="hidden overflow-x-auto rounded-card border border-line bg-bg-raised shadow-card md:block">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-text-faint">
              <th scope="col" className="px-3 py-2">
                #
              </th>
              <th scope="col" className="px-3 py-2">
                Player
              </th>
              <th scope="col" className="px-3 py-2">
                Pos
              </th>
              <th scope="col" className="px-3 py-2">
                €m
              </th>
              <th scope="col" className="px-3 py-2">
                Opp
              </th>
              <th scope="col" className="px-3 py-2">
                P(start)
              </th>
              <th scope="col" className="px-3 py-2" aria-sort="descending">
                xPts
              </th>
              <th scope="col" className="px-3 py-2">
                Picked
              </th>
              <th scope="col" className="px-3 py-2">
                /€m
              </th>
              <th scope="col" className="px-3 py-2">
                Breakdown
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p, i) => (
              <Row key={p.player_id} player={p} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>
      {locked.length > 0 && (
        <div className="mt-4">
          <PremiumLock
            valueProp="Alerts, full history and rotation risk. £2.99/month."
            ctaLabel="Go premium"
            ctaHref="/premium"
          >
            <table className="w-full min-w-[880px] text-sm">
              <tbody>
                {locked.map((p, i) => (
                  <Row key={p.player_id} player={p} rank={freeLimit + i + 1} />
                ))}
              </tbody>
            </table>
          </PremiumLock>
        </div>
      )}
    </section>
  );
}
