# fplanalytic — Architecture

Written for TASKS.md 0.1 (repo audit) and 0.6 (DEFCON field verification).
First drafted 2026-09-12 against the wrong repo; corrected the same day after
confirming fplanalytic.com deploys from THIS repo (`D:\Projects\fpl-analytics`,
GitHub `maballouk/fplanalytic` → Netlify build on push to `main`).

## 1. Audit of the deployed app (pre-Phase-0)

- **Router type:** Next.js 14 **App Router** with the `src/` layout. React 18, TypeScript
  strict, Tailwind v3.
- **Deploy:** push to `main` on GitHub → Netlify builds (`npm run build`, publishes `.next`,
  Node 18.17, `netlify.toml`). DNS via Cloudflare (proxied, SSL "Full").
- **Data fetching:** client components call same-origin API routes with axios (`src/lib/api.ts`):
  - `src/app/api/fpl/route.ts` — generic proxy to the FPL API (`?endpoint=...`) with
    `next: { revalidate: 43200 }` (12 h).
  - `src/app/api/fpl/live-fixtures/route.ts` — fixtures + live data, `revalidate: 30`.
  - `src/app/api/fpl/consensus/route.ts` — consensus picks.
- **"Twice Daily" updates, solved:** there is no build hook or cron. "Twice daily" is simply
  the 12-hour ISR cache (`revalidate: 43200`) on the FPL proxy route. The marketing copy on
  the page reflects that cache window.
- **Mixed content, solved:** repo source has zero insecure `http://` URLs, and so do the
  deployed HTML and JS bundles (the only `http://localhost` match is dead axios-internal
  fallback code). The historic "Not secure" flag was resolved by the 2026-06 Cloudflare
  SSL change (see TASKS.md decisions log); CI now guards against regressions.
- **Screens/components:** one dashboard page (`src/app/page.tsx`) with `PlayerCard`,
  `PlayerCardSkeleton`, `MatchFixtures`, `ConsensusPanel`, chart.js charts. Light theme,
  purple/green Premier League branding. This UI is replaced screen-by-screen in Phase 1;
  its content moves to `/picks` at task 1.10.

Note: `D:\Projects\fantasy-predictor` is an unrelated older prototype (vanilla Express +
static HTML) that was never the deployed site. Phase 0 was first built there by mistake
and then migrated here; the prototype repo stays untouched as an archive.

## 2. Current structure

```
/src/app                 Next.js App Router routes
  layout.tsx             legacy light shell + Inter/JetBrains Mono CSS variables
  page.tsx               legacy dashboard (becomes DEFCON Asset Finder at 1.4)
  design/page.tsx        dev-only token gallery; 404 in production
  api/fpl/*              legacy FPL proxy routes (replaced by lib/fpl during Phase 1)
/src/components          legacy dashboard components; DESIGN.md §2 set lands at 1.3
/src/lib/fpl             FPL API adapter: client.ts (fetchers) + schemas.ts (zod)
/src/lib/api.ts          legacy axios client (retired with the old screens)
/public/data             static JSON written by the engine (ucl_demo.json checked in)
/engine                  Python prediction engine (own README + 21 tests)
/tests                   Vitest suites (unit + render)
/scripts/check-http.mjs  fails on http:// in source (localhost exempt)
/docs                    ARCHITECTURE.md, DESIGN.md, TASKS.md, documentation.md (legacy)
/.github/workflows/ci.yml  npm run check + engine pytest on PR and main
```

- **Checks:** `npm run check` = check:http → lint (next/core-web-vitals + a
  no-restricted-syntax ban on non-localhost `http://` literals) → typecheck → vitest → build.
- **Tokens:** every DESIGN.md §1 token lives in `tailwind.config.js` under `theme.extend`,
  alongside clearly-marked legacy values that die with the old screens. Fonts come from
  `next/font` CSS variables set on `<html>`.

## 3. Data flow

```
FPL API (https, no CORS) ──> src/lib/fpl/client.ts (server only, zod-validated)
                                   │  bootstrap/fixtures/element-summary: revalidate 6h
                                   │  event/{gw}/live: revalidate 60s, polled on /live only
                                   ▼
                             route components / server jobs ──> public/data/defcon_gw{N}.json (task 1.2)

engine/ (Python, scheduled) ──> public/data/ucl_md{N}.json ──> lib/ucl readers (Phase 1.5)

Legacy path (until Phase 1 screens land): browser ──axios──> /api/fpl* ──> FPL API (12h / 30s ISR)
```

Rules (CLAUDE.md): every external source has exactly one adapter module; the site never
calls Python at request time; the browser never calls UEFA or FPL directly.

## 4. Engine

`pip install -e engine`; `python -m pytest engine` → 21 tests pass (verified locally, also
in CI). `python -m ucl_engine.cli demo --out public/data/ucl_demo.json` produces
`{matchday, generated_at, model, fixtures[], players[], notes}`.

## 5. DEFCON fields — verified against the live API (2026-09-12, GW1-3 played)

Checked `bootstrap-static` plus `element-summary/{id}` for two defenders
(Gabriel id 4, White id 10) and one midfielder (Kamara id 47). Exact field names:

| Field | bootstrap `elements[]` | element-summary `history[]` | live `elements[].stats` |
|---|---|---|---|
| `clearances_blocks_interceptions` | season total | per match | in-play |
| `tackles` | season total | per match | in-play |
| `recoveries` | season total | per match | in-play |
| `defensive_contribution` | season total | per match | in-play |
| `defensive_contribution_per_90` | yes | no | no |

**Semantics that must not be gotten wrong:** `defensive_contribution` is the
position-aware composite **count** for the match, not the points awarded.

- DEF: `defensive_contribution = clearances_blocks_interceptions + tackles`
  (Gabriel GW2: 8 + 2 = 10 ✓; recoveries are excluded — his 5 recoveries did not count).
- MID/FWD: `defensive_contribution = clearances_blocks_interceptions + tackles + recoveries`
  (Kamara GW1: 3 + 2 + 2 = 7 ✓; GW3: 3 + 1 + 6 = 10 ✓, below the MID threshold of 12 so no +2).

Thresholds for the +2 points: DEF ≥ 10, MID/FWD ≥ 12, max once per match.
These example rows are frozen in `tests/fpl-schemas.test.ts` as schema fixtures.

## 6. Deliberate trade-offs

- The DESIGN.md type scale and card shadow now own the shared Tailwind keys (`text-base`,
  `shadow-card`, …), so the legacy light screens render with slightly different sizes and
  shadows until Phase 1 replaces them. Accepted: the tokens are the system of record and
  nothing deploys until the branch is merged and pushed.
- The legacy `/api/fpl*` routes stay untouched so the live dashboard keeps working; each
  Phase 1 screen switches to `src/lib/fpl` server-side, and the routes are retired with the
  old dashboard at task 1.10.
