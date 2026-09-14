// UCL OG image: the matchday's captain picks, with the crowd's ownership —
// what a shared /ucl link shows in Twitter/WhatsApp cards. Edge-rendered from
// the latest engine output (same pattern as the home OG).

import { ImageResponse } from 'next/og';
import { UclMatchdaySchema, type UclMatchday } from '@/lib/ucl/file';

export const alt = 'UCL Fantasy captain picks';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

// The engine writes ucl_md{N}.json per matchday with no "latest" alias, so
// probe recent matchdays newest-first.
async function getData(): Promise<UclMatchday | null> {
  const base = process.env.URL ?? 'http://localhost:3000';
  for (let md = 17; md >= 1; md--) {
    try {
      const res = await fetch(`${base}/data/ucl_md${md}.json`, { next: { revalidate: 3600 } });
      if (res.ok) return UclMatchdaySchema.parse(await res.json());
    } catch {
      // keep probing
    }
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
        backgroundImage: 'linear-gradient(160deg, #0B0F1A 45%, #14204a 100%)',
        color: '#E5E7EB',
        fontSize: 32,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700 }}>
          <span style={{ color: '#E5E7EB' }}>fpl</span>
          <span style={{ color: '#00FF87' }}>analytic</span>
          <span style={{ color: '#60A5FA', marginLeft: 18 }}>European Nights</span>
        </div>
        <div style={{ fontSize: 62, fontWeight: 700, marginTop: 20, display: 'flex' }}>
          {data ? `Matchday ${data.matchday} captain picks` : 'UCL Fantasy, predicted.'}
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
              {i + 1}. {p.name} · {p.team} v {p.opponent}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <span style={{ fontSize: 24, color: '#9CA3AF' }}>
                picked by {Math.round(p.sel_per)}%
              </span>
              <span style={{ color: '#00FF87', fontWeight: 700 }}>{p.xpts.toFixed(1)} xPts</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 24, color: '#9CA3AF', display: 'flex' }}>
        Match predictions and expected points for every squad · fplanalytic.com/ucl
      </div>
    </div>,
    size
  );
}
