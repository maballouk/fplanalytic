// Fails the build if any source file contains an insecure http:// URL.
// Mixed content broke the padlock on the live site once; never again (TASKS.md 0.2).
// localhost/127.0.0.1 are allowed (dev logs), and so are www.w3.org XML namespace
// identifiers (never fetched); everything else must be https://.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SCAN_DIRS = ['src', 'scripts', 'public'];
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|css|html|svg|json)$/;
const INSECURE = /http:\/\/(?!localhost|127\.0\.0\.1|www\.w3\.org)/;

const hits = [];

function scan(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // directory does not exist yet
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (entry === 'node_modules' || entry === 'data') continue; // public/data is engine output
      scan(full);
    } else if (EXTENSIONS.test(entry) && entry !== 'check-http.mjs') {
      const lines = readFileSync(full, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (INSECURE.test(line)) {
          hits.push(`${relative(ROOT, full)}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

for (const dir of SCAN_DIRS) scan(join(ROOT, dir));

if (hits.length > 0) {
  console.error('Insecure http:// URLs found (use https://):');
  for (const hit of hits) console.error('  ' + hit);
  process.exit(1);
}
console.log('check:http OK — no insecure http:// URLs in source.');
