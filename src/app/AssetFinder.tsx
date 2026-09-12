'use client';

// DEFCON Asset Finder table (DESIGN.md §3.1): filters, sortable numeric
// columns, drawer with the Decision block. Free tier: full table, top 30 rows;
// the rest sits behind an inline PremiumLock. Copy from docs/COPY.md.

import { useMemo, useState } from 'react';
import EmptyState from '@/components/ds/EmptyState';
import FixtureStrip from '@/components/ds/FixtureStrip';
import PlayerRow from '@/components/ds/PlayerRow';
import PremiumLock from '@/components/ds/PremiumLock';
import SegmentedTabs from '@/components/ds/SegmentedTabs';
import ThresholdBar from '@/components/ds/ThresholdBar';
import PlayerProfileDrawer from '@/components/PlayerProfileDrawer';
import { thresholdFor, type DefconFilePlayer } from '@/lib/defcon/file';

type PositionFilter = 'ALL' | 'DEF' | 'MID' | 'FWD';
type SortKey = 'hit_rate' | 'mean_actions' | 'near_miss_rate' | 'defcon_xpts' | 'value_per_million';

const SORTABLE: { key: SortKey; label: string }[] = [
  { key: 'hit_rate', label: 'Hit rate' },
  { key: 'mean_actions', label: 'Avg actions' },
  { key: 'near_miss_rate', label: 'Near miss' },
  { key: 'defcon_xpts', label: 'xPts' },
  { key: 'value_per_million', label: 'Value /£m' },
];

export interface AssetFinderProps {
  players: DefconFilePlayer[];
  freeLimit?: number;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function AssetFinder({ players, freeLimit = 30 }: AssetFinderProps) {
  const [position, setPosition] = useState<PositionFilter>('ALL');
  const [maxPrice, setMaxPrice] = useState('');
  const [minMinutes, setMinMinutes] = useState('');
  const [team, setTeam] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('defcon_xpts');
  const [selected, setSelected] = useState<DefconFilePlayer | null>(null);

  const teams = useMemo(() => Array.from(new Set(players.map((p) => p.team))).sort(), [players]);

  const filtered = useMemo(() => {
    const price = maxPrice === '' ? Infinity : Number(maxPrice);
    const minutes = minMinutes === '' ? 0 : Number(minMinutes);
    return players
      .filter(
        (p) =>
          (position === 'ALL' || p.position === position) &&
          p.price <= price &&
          p.minutes >= minutes &&
          (team === 'ALL' || p.team === team)
      )
      .sort((a, b) => b[sortBy] - a[sortBy]);
  }, [players, position, maxPrice, minMinutes, team, sortBy]);

  const visible = filtered.slice(0, freeLimit);
  const locked = filtered.slice(freeLimit, freeLimit + 5);

  const inputClass =
    'w-24 rounded-pill border border-line bg-bg-raised px-3 py-1 text-sm text-text placeholder:text-text-faint';

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedTabs
          label="Position"
          value={position}
          onChange={setPosition}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'DEF', label: 'DEF' },
            { value: 'MID', label: 'MID' },
            { value: 'FWD', label: 'FWD' },
          ]}
        />
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Price ≤
          <input
            type="number"
            step="0.5"
            min="3.5"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="any"
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Min minutes
          <input
            type="number"
            step="90"
            min="0"
            value={minMinutes}
            onChange={(e) => setMinMinutes(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Team
          <select value={team} onChange={(e) => setTeam(e.target.value)} className={inputClass}>
            <option value="ALL">All</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          kind="empty"
          title="No players match these filters."
          hint="Loosen the price cap or minutes floor."
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-bg-raised shadow-card">
          <table className="w-full min-w-[900px] text-sm">
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
                  £m
                </th>
                {SORTABLE.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={sortBy === c.key ? 'descending' : 'none'}
                    className="px-3 py-2"
                  >
                    <button
                      onClick={() => setSortBy(c.key)}
                      className={`transition-colors duration-hover hover:text-text ${
                        sortBy === c.key ? 'text-text' : ''
                      }`}
                    >
                      {c.label}
                    </button>
                  </th>
                ))}
                <th scope="col" className="px-3 py-2">
                  Next 5
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => (
                <PlayerRow
                  key={p.player_id}
                  rank={i + 1}
                  name={p.name}
                  team={p.team}
                  position={p.position}
                  price={p.price}
                  onClick={() => setSelected(p)}
                >
                  <td className="num px-3 py-2">{pct(p.hit_rate)}</td>
                  <td className="px-3 py-2">
                    <ThresholdBar
                      actions={Math.round(p.mean_actions)}
                      threshold={thresholdFor(p.position)}
                      label={`${p.mean_actions.toFixed(1)} of ${thresholdFor(p.position)} defensive actions on average`}
                    />
                  </td>
                  <td className="num px-3 py-2">{pct(p.near_miss_rate)}</td>
                  <td className="num px-3 py-2">{p.defcon_xpts.toFixed(2)}</td>
                  <td className="num px-3 py-2">{p.value_per_million.toFixed(3)}</td>
                  <td className="px-3 py-2">
                    <FixtureStrip
                      fixtures={p.next5.map((f) => ({
                        opponent: f.opponent,
                        isHome: f.is_home,
                        difficulty: f.difficulty,
                      }))}
                    />
                  </td>
                </PlayerRow>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {locked.length > 0 && (
        <div className="mt-4">
          <PremiumLock
            valueProp="Alerts, full history and rotation risk. £2.99/month."
            ctaLabel="Go premium"
            ctaHref="/premium"
          >
            <table className="w-full min-w-[900px] text-sm">
              <tbody>
                {locked.map((p, i) => (
                  <PlayerRow
                    key={p.player_id}
                    rank={freeLimit + i + 1}
                    name={p.name}
                    team={p.team}
                    position={p.position}
                    price={p.price}
                  />
                ))}
              </tbody>
            </table>
          </PremiumLock>
        </div>
      )}

      {selected && <PlayerProfileDrawer player={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
