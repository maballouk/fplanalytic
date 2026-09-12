# fplanalytic — Design System & Screen Specs

Direction: **dark, sporty, premium.** Think a modern stats app on matchnight: deep dark surfaces,
one electric accent for "good", restrained typography, dense but breathable data. Nothing playful,
nothing generic-SaaS. The product should feel like an edge.

---

## 1. Design tokens (Tailwind `theme.extend`)

```ts
colors: {
  bg:        { DEFAULT: '#0B0F1A', raised: '#111827', overlay: '#161E2E' },   // page, card, popover
  line:      { DEFAULT: '#1F2937', strong: '#374151' },                      // borders/dividers
  text:      { DEFAULT: '#E5E7EB', muted: '#9CA3AF', faint: '#6B7280' },
  accent:    { DEFAULT: '#00FF87', dim: '#00C96B' },   // "good" — FPL-green energy, use sparingly
  warn:      '#FBBF24',                                // rotation risk, near-miss
  danger:    '#F87171',                                // sell / injured / red card
  info:      '#60A5FA',                                // neutral highlight, links
  premium:   '#C084FC',                                // premium-only badges and locks
}
fontFamily: {
  sans:  ['Inter', 'system-ui', 'sans-serif'],
  mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],   // all numbers in tables
}
borderRadius: { card: '14px', pill: '999px' }
boxShadow:   { card: '0 1px 0 0 #1F2937 inset, 0 10px 30px -18px rgba(0,0,0,.8)' }
```

Rules: numbers in **mono, tabular-nums**; accent green is for positive signals only (never decoration);
one accent element per card maximum; no gradients except the hero strip; no pure white (#FFF) text.

Type scale: `text-xs 12 / sm 14 / base 15 / lg 18 / xl 22 / 2xl 28 / 3xl 36`. Body 15px, line-height 1.5.
Spacing: 4px grid. Card padding 20px. Section gap 32px. Max content width 1200px.

Motion: 150ms ease-out on hover/focus, 250ms on panel open. No bouncing, no confetti. Respect
`prefers-reduced-motion`.

Accessibility: contrast ≥ 4.5:1 for text (accent on dark passes), focus rings visible (`ring-2 ring-info`),
every icon-only control has an `aria-label`, tables have real `<th scope>`.

---

## 2. Components (`/components`)

| Component | Purpose | Notes |
|---|---|---|
| `AppShell` | Top nav + content container | Nav: DEFCON · Live · Value · European Nights · (Premium). Sticky, blurred bg. |
| `StatCard` | Single KPI with label, value, delta | Value in mono 2xl. Optional trend chip. |
| `PlayerRow` | Dense table row: shirt/badge, name, team, price, key stats, action chip | Hover raises `bg.overlay`. Click opens `PlayerDrawer`. |
| `PlayerDrawer` | Right-side panel with full profile + "Why this player" | Always ends with a **Decision** block (Buy / Hold / Avoid + one sentence). |
| `Threshold Bar` | Horizontal bar 0→threshold showing actions in a match | Fill green at/over threshold, amber within 2, grey otherwise. Used everywhere DEFCON is shown. |
| `FixtureStrip` | Next 5 fixtures as difficulty chips | Reuse FDR colour ramp but muted. |
| `RankBadge` | 1/2/3 medal-style pill | Only top 3, never beyond. |
| `PremiumLock` | Blur + lock + one-line value prop + CTA | Never hides the *existence* of data, only detail. |
| `MethodNote` | Collapsible "How we compute this" | Every model output has one. Transparency is brand. |
| `EmptyState` | Friendly empty/loading/error | Skeletons for loading, never spinners in tables. |
| `SegmentedTabs` | Pill tabs | Used for position filters and view switching. |

All components: dark-only, typed props, no inline colours, storybook-free but each has a render test.

---

## 3. Screens — Phase 1 (DEFCON)

### 3.1 `/` Home = DEFCON Asset Finder (the beachhead)
Hero strip (subtle gradient `bg → bg.raised`): title *"Defensive Contribution, decoded."* + one-line
promise + "Updated GW N · 12:41". Below, three `StatCard`s: *Top DEFCON DEF this GW*, *Top DEFCON MID*,
*Best value (xPts/£m)*.

Main table (`PlayerRow`): Rank · Player · Team · Pos · Price · **Hit rate** (season, blended) ·
**Avg actions** with `ThresholdBar` · **Near-miss %** · **DEFCON xPts/GW** · **Value /£m** · Next 5 (`FixtureStrip`).
Default sort: DEFCON xPts. Filters: position (DEF/MID/FWD), price ≤, min minutes, team.
Every row's `PlayerDrawer` ends with a Decision: e.g. *"Buy — 7 of last 8 with 10+ actions, two soft
fixtures next."* Free tier: full table, top-30 rows; premium: unlimited rows + history chart + alerts toggle.

### 3.2 `/live` Live DEFCON Tracker (matchday)
List of live/finished fixtures. For each: players on the pitch with a `ThresholdBar` that updates as
actions accrue; sort by "closest to threshold". Colour: green = hit, amber = 1–2 away, grey otherwise.
Premium: browser notifications when a watched player reaches threshold-2 and threshold.
Polling interval 60s from the FPL live endpoint; show "last refreshed" and never auto-scroll.

### 3.3 `/value` Defensive Value Lens
Scatter (x = price, y = DEFCON xPts + clean-sheet xPts), bubbles sized by minutes, coloured by position.
Quadrant labels ("Underpriced engines", "Premium but earned", …). Click bubble → `PlayerDrawer`.
Sidebar: top 10 by value with one-line reasons. Premium: price-change context and ownership overlay.

### 3.4 `/methodology`
Plain-English page: the DEFCON rule, how hit rate is blended (last 5 vs season), what near-miss means,
data source and refresh cadence, known limitations. Ends with "What we do not do" (no black-box ML).

---

## 4. Screens — Phase 1.5 (European Nights)

### 4.1 `/ucl` Matchday Hub
Header: *"European Nights · Matchday N"* + kickoff countdown. Fixture cards (2-col): badges, kickoff,
**xG 1.6 – 1.1**, 1X2 bar (three segments), **Clean-sheet odds** for each side, "Most likely 1-1".
Each card has a `MethodNote` ("Elo + Dixon-Coles, fitted on N matches").

Below: **xPts table** (`PlayerRow`): Player · Team · Pos · Price · Opp (H/A) · **P(plays)** ·
**xPts** · **/€m** · breakdown chips (goals · assists · CS · saves · recoveries). Filters as in 3.1.
Free: fixtures + xPts top 40. Premium: full list, rotation risk column (amber when P(plays) < 0.7),
progression odds tab (Monte Carlo, later), alerts.

### 4.2 `/ucl/player/[id]`
Profile, xPts by remaining matchdays (bar), share-of-team-goals vs price, decision block.

Data source: `public/data/ucl_md{N}.json` written by `engine/` (schema: `fixtures[]`, `players[]`,
`model{}`, `generated_at`). Read via `/lib/ucl/loadMatchday.ts`; never fetch UEFA from the browser.

---

## 5. Copy voice

Direct, expert, calm. Short sentences. Numbers before adjectives. British football English
("fixture", "clean sheet", "matchday"). Never hype. Examples:

- Good: *"Gabriel hit 10+ actions in 7 of 8. Two low-block opponents next. Buy."*
- Bad: *"Gabriel is an absolute must-have this week!!!"*

Premium copy states what you get, once: *"Alerts, full history and rotation risk. £2.99/month."*

---

## 6. Do-not list

- No light theme. No pastel. No stock photos. No emoji in UI.
- No charts without axes labels and a `MethodNote`.
- No modal walls; premium locks are inline (`PremiumLock`).
- No table without a default sort that answers the user's question.
- No em-dashes in copy.
