// Server-side reader for the latest engine prediction file (TASKS.md 1.5.5).
// Statically rendered pages call this at build time; fresh predictions arrive
// as a commit from .github/workflows/ucl-data.yml, which triggers a rebuild.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UclMatchdaySchema, type UclMatchday } from './file';

const DATA_DIR = join(process.cwd(), 'public', 'data');

/** Latest ucl_md{N}.json, or null before the first engine run. */
export function loadLatestMatchday(): UclMatchday | null {
  let files: string[];
  try {
    files = readdirSync(DATA_DIR);
  } catch {
    return null;
  }
  const mds = files
    .map((f) => f.match(/^ucl_md(\d+)\.json$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a);
  if (mds.length === 0) return null;
  const raw = readFileSync(join(DATA_DIR, `ucl_md${mds[0]}.json`), 'utf8');
  return UclMatchdaySchema.parse(JSON.parse(raw));
}
