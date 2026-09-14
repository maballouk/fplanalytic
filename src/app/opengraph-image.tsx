// Per-GW OG image (TASKS.md 1.8, totals-first since 2026-09-13): the top 3 by
// predicted points with top-50 ownership. Rendered at request time from the
// latest data file, so it refreshes with every twice-daily data commit.

import { ImageResponse } from 'next/og';
import { DefconFileSchema, type DefconFile } from '@/lib/defcon/file';

export const alt = 'FPL predicted points';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// Edge runtime: rendered on demand, never prerendered (next/og cannot
// prerender on a Windows build host), and free of node:fs so it bundles.
export const runtime = 'edge';

async function getData(): Promise<DefconFile | null> {
  try {
    // Netlify sets URL to the site origin at build; the data build writes the
    // defcon_latest.json alias exactly for consumers like this one.
    const base = process.env.URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/data/defcon_latest.json`, { next: { revalidate: 3600 } });
    if (res.ok) return DefconFileSchema.parse(await res.json());
  } catch {
    // fall through to the brand-only image
  }
  return null;
}

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          backgroundColor: '#161E2E',
          borderRadius: 10,
          padding: 8,
        }}
      >
        <div style={{ width: 7, height: 12, backgroundColor: '#6B7280', borderRadius: 2 }} />
        <div style={{ width: 7, height: 20, backgroundColor: '#9CA3AF', borderRadius: 2 }} />
        <div style={{ width: 7, height: 28, backgroundColor: '#00FF87', borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', fontSize: 30, fontWeight: 700 }}>
        <span style={{ color: '#E5E7EB' }}>fpl</span>
        <span style={{ color: '#00FF87' }}>analytic</span>
      </div>
    </div>
  );
}

export default async function OgImage() {
  const data = await getData();
  const gw = data?.calendar?.next_gw ?? data?.gw;
  const top3 = data?.players.slice(0, 3) ?? [];

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        backgroundColor: '#0B0F1A',
        backgroundImage: 'linear-gradient(160deg, #0B0F1A 55%, #0d1a15 100%)',
        color: '#E5E7EB',
        fontSize: 32,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Brand />
        <div style={{ fontSize: 62, fontWeight: 700, marginTop: 20, display: 'flex' }}>
          {data ? `GW${gw}, in predicted points.` : 'Every gameweek, in predicted points.'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {top3.map((p, i) => (
          <div
            key={p.player_id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 28px',
              backgroundColor: '#111827',
              border: i === 0 ? '1px solid #00C96B' : '1px solid #1F2937',
              borderRadius: 14,
            }}
          >
            <span style={{ display: 'flex' }}>
              {i + 1}. {p.name} · {p.team} · {p.position}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <span style={{ fontSize: 24, color: '#9CA3AF' }}>
                top-50 own {Math.round(p.elite_own * 100)}%
              </span>
              <span style={{ color: '#00FF87', fontWeight: 700 }}>
                {p.xpts_total.toFixed(1)} pts
              </span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 24, color: '#9CA3AF', display: 'flex' }}>
        Predicted points, top-50 manager consensus and DEFCON · fplanalytic.com
      </div>
    </div>,
    size
  );
}
