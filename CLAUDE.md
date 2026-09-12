# fplanalytic — Claude Code project context

Read this first in every session. Then read `DESIGN.md` for anything visual and
`TASKS.md` for what to do next. Do not start coding before you have read the
task's "Trace dependencies" step.

## What this product is

fplanalytic.com is an analytics tool for **serious Fantasy Premier League managers**.
Strategy (see `docs/fplanalytic-strategic-plan.docx`): win one thing first, then expand.

1. **Phase 1 — DEFCON beachhead (ship free).** The best-designed Defensive Contribution
   analytics in FPL: DEFCON asset finder, live tracker, defensive value lens, fixture-aware view.
2. **Phase 1.5 — "European Nights".** UCL Fantasy expected-points predictor, powered by the
   Python engine in `engine/` (Elo → Dixon-Coles → player xPts). Starts only after Phase 1 is live.
3. **Phase 2 — Decisions layer + paid tier (Paddle).** Transfer helper, chip timing, watchlists, alerts.
4. **Phase 3 — Smart all-rounder.**

Positioning: *decisions over data, fast and clean, transparent methodology, premium feel with a
genuinely good free tier.* Target user pays for edge; casual users are not the priority.

## Stack

- **Front end:** Next.js (App Router preferred; check what the repo uses), TypeScript, Tailwind CSS.
  Deployed on Netlify at `fplanalytic.com` (DNS via Cloudflare, proxied, SSL mode "Full").
- **Data:** official FPL API (free, JSON) is the spine for Phase 1. UCL data comes from the engine's
  adapters (ClubElo, football-data.org, UEFA Fantasy unofficial feed).
- **Engine:** `engine/` — Python 3.10+, numpy/scipy/requests. Runs on a schedule and writes static
  JSON into `public/data/`. The site never calls Python at request time.
- **Payments (Phase 2):** Paddle (merchant of record). Not Stripe — Stripe does not serve Saudi-based
  businesses natively. Nothing in Phase 1 needs payments.

## Working rules (non-negotiable)

- **Trace before you change.** Before modifying any shared component, hook, data-fetching function
  or type, list every file that imports it and state the downstream impact. Then change.
- **No hardcoded `http://`.** All resource and API URLs are `https://` (mixed content caused a
  "Not secure" flag on the live site). Grep for `http://` before every PR.
- **Adapters, not scrapes.** Every external data source is wrapped in one module; the rest of the
  code never sees raw source shapes. If a source changes, exactly one file changes.
- **Design system first.** Use the tokens and components in `DESIGN.md`. Do not invent ad-hoc
  colours, spacings or card styles. Dark / sporty-premium is the only theme.
- **Every screen answers "so what should I do?"** If a view only shows numbers with no
  recommendation, decision hint or ranking, it is not finished.
- **No em-dashes in user-facing copy.**
- **Copy is approved before it is built.** For new user-facing text, show the strings first.
- **Comments explain why and what**, in clear English. Variable names follow standard conventions.
- **Tests for logic.** Data transforms, scoring and ranking functions get unit tests. UI gets at
  least a render test per screen.
- **Free tier stays polished.** Never degrade free screens to push premium; premium adds, free is complete.

## Domain facts you must not get wrong

- **DEFCON rule (2025/26+):** DEF earn +2 when clearances+blocks+interceptions+tackles ≥ 10 in a match;
  MID/FWD earn +2 when that total plus recoveries ≥ 12. Max once per match. Verify field names in the
  FPL API before wiring: `clearances_blocks_interceptions`, `tackles`, `recoveries`, `defensive_contribution`.
- **UCL Fantasy 2026/27:** 17 matchdays (8 league phase + knockouts), Tue/Wed cadence, budget €100m
  rising to €105m after the league phase. Scoring rules live in `engine/ucl_engine/fantasy.py::SCORING`
  and must be re-verified against gaming.uefa.com each season.
- **Two-chip FPL system:** managers now get two of each chip across a split season.

## Repo layout (target)

```
/app or /pages        Next.js routes
/components           design-system components (see DESIGN.md)
/lib/fpl              FPL API adapter + types
/lib/defcon           DEFCON transforms (TypeScript port of engine/ucl_engine/defcon.py logic)
/lib/ucl              readers for engine JSON in public/data
/public/data          static JSON written by the engine
/engine               Python prediction engine (own README, tests)
/docs                 strategic plan, DESIGN.md, TASKS.md
```

## How a session should go

1. `git status`, read `TASKS.md`, pick the next unchecked task in order.
2. Ask: strict adherence to the task as written, or is a broader improvement welcome? (Default: strict.)
3. Trace dependencies for anything you will touch. Write them down in the PR description.
4. Implement, test, `npm run build`, grep for `http://`, then commit with a clear message.
5. Tick the task in `TASKS.md`, note anything learned under "Decisions & learnings".
