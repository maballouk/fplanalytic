// Sitemap (TASKS.md 1.8). Static; regenerated on every data-commit build.

import type { MetadataRoute } from 'next';
import { loadLatestDefcon } from '@/lib/defcon/data';

const BASE = 'https://fplanalytic.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = loadLatestDefcon()?.generated_at ?? new Date().toISOString();
  return [
    { url: `${BASE}/`, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/live`, lastModified, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/value`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/methodology`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/picks`, lastModified, changeFrequency: 'daily', priority: 0.3 },
    { url: `${BASE}/premium`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
