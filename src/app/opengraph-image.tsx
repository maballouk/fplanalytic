// Per-GW OG image (TASKS.md 1.8): "Top DEFCON picks GW N" with the top 3.
// Rendered at build time from the latest data file, so it refreshes with
// every twice-daily data commit.

import { ImageResponse } from 'next/og';
import { DefconFileSchema, type DefconFile } from '@/lib/defcon/file';

export const alt = 'Top DEFCON picks';
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

export default async function OgImage() {
  const data = await getData();
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
        backgroundImage: 'linear-gradient(180deg, #0B0F1A 0%, #111827 100%)',
        color: '#E5E7EB',
        fontSize: 32,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 28, color: '#00FF87' }}>fplanalytic</div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 16 }}>
          {data ? `Top DEFCON picks GW ${data.gw}` : 'Defensive Contribution, decoded.'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {top3.map((p, i) => (
          <div
            key={p.player_id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 28px',
              backgroundColor: '#111827',
              border: '1px solid #1F2937',
              borderRadius: 14,
            }}
          >
            <span>
              {i + 1}. {p.name} · {p.team} · {p.position}
            </span>
            <span style={{ color: '#00FF87' }}>{p.defcon_xpts.toFixed(2)} xPts</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 24, color: '#9CA3AF' }}>
        Hit rates, live threshold tracking and value · fplanalytic.com
      </div>
    </div>,
    size
  );
}
