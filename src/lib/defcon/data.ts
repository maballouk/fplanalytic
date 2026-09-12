// Server-side reader for the DEFCON data files written by
// scripts/build-defcon-data.ts into public/data (TASKS.md 1.2/1.4).
// The home page is statically rendered, so this runs at build time; fresh data
// arrives as a commit, which triggers a rebuild. Schema and pure helpers live
// in file.ts so client components can import them without pulling in node:fs.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DefconFileSchema, type DefconFile } from './file';

const DATA_DIR = join(process.cwd(), 'public', 'data');

/** Latest defcon_gw{N}.json, or null before the first data build has run. */
export function loadLatestDefcon(): DefconFile | null {
  let files: string[];
  try {
    files = readdirSync(DATA_DIR);
  } catch {
    return null;
  }
  const gws = files
    .map((f) => f.match(/^defcon_gw(\d+)\.json$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a);
  if (gws.length === 0) return null;
  const raw = readFileSync(join(DATA_DIR, `defcon_gw${gws[0]}.json`), 'utf8');
  return DefconFileSchema.parse(JSON.parse(raw));
}
