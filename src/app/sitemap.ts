// Sitemap (TASKS.md 1.8). Static; regenerated on every data-commit build.

import type { MetadataRoute } from 'next';
import { loadLatestDefcon } from '@/lib/defcon/data';
import { loadLatestMatchday } from '@/lib/ucl/loadMatchday';

const BASE = 'https://fplanalytic.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const data = loadLatestDefcon();
  const lastModified = data?.generated_at ?? new Date().toISOString();
  const playerPages: MetadataRoute.Sitemap = (data?.players ?? []).map((p) => ({
    url: `${BASE}/player/${p.player_id}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));
  const uclPlayerPages: MetadataRoute.Sitemap = (loadLatestMatchday()?.players ?? [])
    .slice(0, 500)
    .map((p) => ({
      url: `${BASE}/ucl/player/${p.player_id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  return [
    { url: `${BASE}/`, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/live`, lastModified, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/value`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/my-team`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/ucl`, lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/methodology`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/backtest`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/picks`, lastModified, changeFrequency: 'daily', priority: 0.3 },
    { url: `${BASE}/premium`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
    ...playerPages,
    ...uclPlayerPages,
  ];
}
