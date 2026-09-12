'use client';

// Defensive Value Lens (DESIGN.md §3.3): Recharts scatter of price vs DEFCON
// xPts, bubbles sized by minutes, position encoded by colour AND marker shape
// (validated palette; shape keeps identity off colour alone). Quadrant labels
// split at the medians. Click a bubble or a sidebar row for the drawer.

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import PlayerProfileDrawer from '@/components/PlayerProfileDrawer';
import type { DefconFilePlayer } from '@/lib/defcon/file';

// Categorical trio from the design tokens, CVD-validated on bg.raised
// (blue/amber/red, worst adjacent pair ΔE 15.4 deutan). Shapes are the
// secondary encoding so identity never rides on colour alone.
const SERIES: {
  position: 'DEF' | 'MID' | 'FWD';
  color: string;
  shape: 'circle' | 'triangle' | 'diamond';
}[] = [
  { position: 'DEF', color: '#60A5FA', shape: 'circle' },
  { position: 'MID', color: '#FBBF24', shape: 'triangle' },
  { position: 'FWD', color: '#F87171', shape: 'diamond' },
];

const pct = (x: number) => `${Math.round(x * 100)}%`;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

interface Datum {
  x: number; // price
  y: number; // defcon xpts
  z: number; // minutes
  player: DefconFilePlayer;
}

function LensTooltip({ active, payload }: { active?: boolean; payload?: { payload: Datum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-card border border-line bg-bg-overlay px-3 py-2 text-xs shadow-card">
      <p className="text-text">
        {d.player.name} <span className="text-text-faint">{d.player.team}</span>
      </p>
      <p className="num mt-1 text-text-muted">
        £{d.x.toFixed(1)}m · {d.y.toFixed(2)} xPts · {d.z}&apos; played
      </p>
    </div>
  );
}

export default function ValueLens({ players }: { players: DefconFilePlayer[] }) {
  const [selected, setSelected] = useState<DefconFilePlayer | null>(null);

  const data = useMemo(
    () =>
      SERIES.map((s) => ({
        ...s,
        points: players
          .filter((p) => p.position === s.position)
          .map<Datum>((p) => ({ x: p.price, y: p.defcon_xpts, z: p.minutes, player: p })),
      })),
    [players]
  );
  const midPrice = useMemo(() => median(players.map((p) => p.price)), [players]);
  const midXpts = useMemo(() => median(players.map((p) => p.defcon_xpts)), [players]);

  const top10 = useMemo(
    () => [...players].sort((a, b) => b.value_per_million - a.value_per_million).slice(0, 10),
    [players]
  );

  const quadrantLabel = 'pointer-events-none absolute text-xs text-text-faint';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-card border border-line bg-bg-raised p-5 shadow-card">
        <div className="relative h-[440px]">
          <span className={`${quadrantLabel} left-14 top-2`}>Underpriced engines</span>
          <span className={`${quadrantLabel} right-2 top-2`}>Premium but earned</span>
          <span className={`${quadrantLabel} bottom-10 left-14`}>Cheap for a reason</span>
          <span className={`${quadrantLabel} bottom-10 right-2`}>Paying for attack</span>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#1F2937" strokeDasharray="2 4" />
              <XAxis
                type="number"
                dataKey="x"
                name="Price"
                domain={['dataMin - 0.2', 'dataMax + 0.2']}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                stroke="#374151"
                label={{
                  value: 'Price (£m)',
                  position: 'insideBottom',
                  offset: -4,
                  fill: '#9CA3AF',
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="DEFCON xPts"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                stroke="#374151"
                label={{
                  value: 'DEFCON xPts',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#9CA3AF',
                  fontSize: 12,
                }}
              />
              <ZAxis type="number" dataKey="z" range={[30, 300]} name="Minutes" />
              <ReferenceLine x={midPrice} stroke="#374151" />
              <ReferenceLine y={midXpts} stroke="#374151" />
              <Tooltip
                content={<LensTooltip />}
                cursor={{ strokeDasharray: '3 3', stroke: '#374151' }}
              />
              {data.map((s) => (
                <Scatter
                  key={s.position}
                  name={s.position}
                  data={s.points}
                  fill={s.color}
                  fillOpacity={0.75}
                  shape={s.shape}
                  onClick={(d) => {
                    // Recharts types the point loosely; our datum carries the player.
                    const datum = d as unknown as Datum;
                    if (datum.player) setSelected(datum.player);
                  }}
                  cursor="pointer"
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 flex gap-4 text-xs text-text-muted" aria-label="Positions">
          {SERIES.map((s) => (
            <li key={s.position} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={`inline-block h-2.5 w-2.5 ${s.shape === 'circle' ? 'rounded-pill' : s.shape === 'diamond' ? 'rotate-45' : ''}`}
                style={{
                  backgroundColor: s.shape === 'triangle' ? 'transparent' : s.color,
                  ...(s.shape === 'triangle' && {
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: `10px solid ${s.color}`,
                  }),
                }}
              />
              {s.position}
            </li>
          ))}
        </ul>
      </div>

      <aside className="rounded-card border border-line bg-bg-raised p-5 shadow-card">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-text-faint">Top 10 by value</h2>
        <ol className="space-y-2">
          {top10.map((p, i) => (
            <li key={p.player_id}>
              <button
                onClick={() => setSelected(p)}
                className="w-full rounded-card px-2 py-1.5 text-left transition-colors duration-hover hover:bg-bg-overlay"
              >
                <span className="num mr-2 text-text-faint">{i + 1}</span>
                <span className="text-sm">{p.name}</span>
                <span className="ml-1 text-xs text-text-faint">{p.team}</span>
                <span className="block pl-6 text-xs text-text-muted">
                  {pct(p.hit_rate)} hit rate at £{p.price.toFixed(1)}m.
                </span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      {selected && <PlayerProfileDrawer player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
