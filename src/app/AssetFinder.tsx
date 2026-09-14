'use client';

// FPL player table, totals-first (owner direction 2026-09-13): predicted
// points lead, with form and top-50 ownership beside them; DEFCON stays as
// one column and the drawer keeps its detail. Filters live in the URL.

import { useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/ds/EmptyState';
import FixtureStrip from '@/components/ds/FixtureStrip';
import PlayerAvatar from '@/components/ds/PlayerAvatar';
import PlayerRow from '@/components/ds/PlayerRow';
import TeamBadge from '@/components/ds/TeamBadge';
import PremiumLock from '@/components/ds/PremiumLock';
import SegmentedTabs from '@/components/ds/SegmentedTabs';
import ComparePanel from '@/components/ComparePanel';
import PlayerProfileDrawer from '@/components/PlayerProfileDrawer';
import TrendArrow from '@/components/ds/TrendArrow';
import { track } from '@/lib/analytics';
import { playerPhotoUrl, teamBadgeUrl } from '@/lib/fpl/photos';
import type { DefconFilePlayer } from '@/lib/defcon/file';

type PositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD';
type SortKey = 'xpts_total' | 'form5' | 'elite_own' | 'defcon_xpts' | 'value_per_million';

const SORTABLE: { key: SortKey; label: string }[] = [
  { key: 'xpts_total', label: 'Predicted pts' },
  { key: 'form5', label: 'Form' },
  { key: 'elite_own', label: 'Top-50 own' },
  { key: 'defcon_xpts', label: 'DEFCON' },
  { key: 'value_per_million', label: 'DEFCON /£m' },
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
  const [sortBy, setSortBy] = useState<SortKey>('xpts_total');
  const [selected, setSelected] = useState<DefconFilePlayer | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSel, setCompareSel] = useState<DefconFilePlayer[]>([]);

  const teams = useMemo(() => Array.from(new Set(players.map((p) => p.team))).sort(), [players]);

  // URLs reflect UI state (Web Interface Guidelines)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const pos = q.get('pos');
    if (pos && ['GK', 'DEF', 'MID', 'FWD'].includes(pos)) setPosition(pos as PositionFilter);
    if (q.get('price')) setMaxPrice(q.get('price') as string);
    if (q.get('min')) setMinMinutes(q.get('min') as string);
    if (q.get('team')) setTeam(q.get('team') as string);
    const sort = q.get('sort');
    if (sort && SORTABLE.some((c) => c.key === sort)) setSortBy(sort as SortKey);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const setOrDelete = (key: string, value: string, isDefault: boolean) =>
      isDefault ? q.delete(key) : q.set(key, value);
    setOrDelete('pos', position, position === 'ALL');
    setOrDelete('price', maxPrice, maxPrice === '');
    setOrDelete('min', minMinutes, minMinutes === '');
    setOrDelete('team', team, team === 'ALL');
    setOrDelete('sort', sortBy, sortBy === 'xpts_total');
    const qs = q.toString();
    // Preserve history.state: Next's App Router keeps its internal tree there,
    // and replacing it with null crashes the router on the next interaction.
    window.history.replaceState(window.history.state, '', qs ? `?${qs}` : window.location.pathname);
  }, [position, maxPrice, minMinutes, team, sortBy]);

  // TASKS.md 1.9 funnel events
  const changeFilter = <T,>(name: string, setter: (v: T) => void) => {
    return (value: T) => {
      setter(value);
      track('filter_change', { filter: name });
    };
  };
  const openPlayer = (p: DefconFilePlayer) => {
    if (compareMode) {
      setCompareSel((sel) => {
        if (sel.some((s) => s.player_id === p.player_id)) {
          return sel.filter((s) => s.player_id !== p.player_id);
        }
        return sel.length < 2 ? [...sel, p] : [sel[0], p];
      });
      return;
    }
    track('row_click', { player: p.name });
    setSelected(p);
  };

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
          onChange={changeFilter('position', setPosition)}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'GK', label: 'GK' },
            { value: 'DEF', label: 'DEF' },
            { value: 'MID', label: 'MID' },
            { value: 'FWD', label: 'FWD' },
          ]}
        />
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Price ≤
          <input
            type="number"
            name="max_price"
            autoComplete="off"
            step="0.5"
            min="3.5"
            value={maxPrice}
            onChange={(e) => changeFilter('max_price', setMaxPrice)(e.target.value)}
            placeholder="any"
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Min minutes
          <input
            type="number"
            name="min_minutes"
            autoComplete="off"
            step="90"
            min="0"
            value={minMinutes}
            onChange={(e) => changeFilter('min_minutes', setMinMinutes)(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Team
          <select
            name="team"
            value={team}
            onChange={(e) => changeFilter('team', setTeam)(e.target.value)}
            className={inputClass}
          >
            <option value="ALL">All</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => {
            setCompareMode((m) => !m);
            setCompareSel([]);
          }}
          aria-pressed={compareMode}
          className={`rounded-pill border px-3.5 py-1 text-sm transition-colors duration-hover ${
            compareMode
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-line bg-bg-raised text-text-muted hover:text-text'
          }`}
        >
          Compare
        </button>
        {compareMode && (
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            {compareSel.length === 0 && 'Pick two players'}
            {compareSel.map((p) => (
              <span
                key={p.player_id}
                className="rounded-pill bg-bg-overlay px-2 py-0.5 text-xs text-text"
              >
                {p.name}
              </span>
            ))}
            {compareSel.length === 1 && 'and one more…'}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          kind="empty"
          title="No players match these filters."
          hint="Loosen the price cap or minutes floor."
        />
      ) : (
        <>
          {/* Phones get cards, not a sideways-scrolling table */}
          <ol className="space-y-2 md:hidden">
            {visible.map((p, i) => (
              <li key={p.player_id}>
                <button
                  onClick={() => openPlayer(p)}
                  className="flex w-full items-center gap-3 rounded-card border border-line bg-bg-raised p-3 text-left transition-colors duration-hover active:bg-bg-overlay"
                >
                  <span className="num w-5 shrink-0 text-center text-xs text-text-faint">
                    {i + 1}
                  </span>
                  <PlayerAvatar src={playerPhotoUrl(p.code)} name={p.name} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-text">{p.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                      <TeamBadge src={teamBadgeUrl(p.team_code)} alt={p.team} size={13} />
                      <span className="truncate">
                        {p.team} · {p.position} · £{p.price.toFixed(1)}m
                        {p.elite_own >= 0.2 && (
                          <span className="num text-text-faint"> · top-50 {pct(p.elite_own)}</span>
                        )}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="num block text-xl font-bold text-accent">
                      {p.xpts_total.toFixed(1)}
                      <TrendArrow now={p.xpts_total} prev={p.xpts_prev} />
                    </span>
                    <span className="num block text-[10px] uppercase tracking-wide text-text-faint">
                      pred pts
                    </span>
                  </span>
                </button>
              </li>
            ))}
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
                    avatar={<PlayerAvatar src={playerPhotoUrl(p.code)} name={p.name} size={28} />}
                    teamBadge={<TeamBadge src={teamBadgeUrl(p.team_code)} alt={p.team} size={16} />}
                    onClick={() => openPlayer(p)}
                  >
                    <td className="num px-3 py-2 text-base font-bold text-accent">
                      {p.xpts_total.toFixed(1)}
                      <TrendArrow now={p.xpts_total} prev={p.xpts_prev} />
                    </td>
                    <td className="num px-3 py-2">{p.form5.toFixed(1)}</td>
                    <td className="num px-3 py-2">
                      {pct(p.elite_own)}
                      {p.elite_cap >= 0.1 && (
                        <span className="ml-1 text-xs text-warn" title="Captained by the top 50">
                          C {pct(p.elite_cap)}
                        </span>
                      )}
                    </td>
                    <td className="num px-3 py-2 text-text-muted">
                      {p.position === 'GK' ? '—' : p.defcon_xpts.toFixed(2)}
                    </td>
                    <td className="num px-3 py-2 text-text-muted">
                      {p.position === 'GK' ? '—' : p.value_per_million.toFixed(3)}
                    </td>
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
        </>
      )}

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
      {compareMode && compareSel.length === 2 && (
        <ComparePanel a={compareSel[0]} b={compareSel[1]} onClose={() => setCompareSel([])} />
      )}
    </section>
  );
}
