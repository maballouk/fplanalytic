# fplanalytic — approved copy

Rule (CLAUDE.md): copy is approved before it is built. This file is the register.
Voice (DESIGN.md §5): direct, expert, calm. Short sentences. Numbers before
adjectives. British football English. No em-dashes. No hype.

## Status: APPROVED by Mohamad, 2026-09-12

## Additions after approval: PROPOSED (flag to Mohamad)

- Decision fixture notes: "Soft run next." / "Even run next." / "Tough run next." /
  "No upcoming fixtures." (mean next-5 FDR ≤ 2.5 / ≤ 3.2 / above / none)
- Decision minutes risk: "Minutes risk: doubtful|injured|suspended|unavailable."
- Decision low rate: "Hit rate too low."
- Home MethodNote body: "Hit rate blends the last 5 matches (60%) with the season (40%),
  counting only matches with 60+ minutes. DEF need 10+ CBIT and tackles; MID and FWD need
  12+ including recoveries. xPts is the hit probability times 2."
- Premium page: "Premium launches later this season. The free tier stays complete."
- Methodology page: full prose at /methodology (src/app/methodology/page.tsx)
- Live page: title "Live DEFCON tracker", sub "Every player on the pitch, sorted by who is
  closest to the threshold.", fixture chip "Live" / "FT", fixture line with no players yet:
  "No DEFCON-relevant minutes yet."
- Value page: title "Defensive value lens", sub "Price against DEFCON expected points. Up and
  left is where the value lives.", quadrants "Underpriced engines" / "Premium but earned" /
  "Cheap for a reason" / "Paying for attack", sidebar heading "Top 10 by value",
  reason line "{pct} hit rate at £{price}m.", MethodNote note that clean-sheet xPts joins
  when the engine goes live

### Hero (home, §3.1)

- Title: "Defensive Contribution, decoded."
- Promise line: "Hit rates, live threshold tracking and value. Built for the DEFCON era."
- Updated stamp format: "Updated GW {N} · {HH:mm}"

### Stat cards (home)

- "Top DEFCON DEF this GW"
- "Top DEFCON MID this GW"
- "Best value (xPts/£m)"

### Empty / loading / error states

- Loading (any table): skeleton rows, no text.
- Empty after filters: "No players match these filters." / hint: "Loosen the price cap or minutes floor."
- Data not yet available for a new GW: "GW {N} data lands after the first matches finish." / hint: "The tracker updates twice a day."
- Error: "Could not load the data." / hint: "Refresh in a minute. If it keeps failing, the FPL API is having a moment."
- Live tracker, no live fixtures: "No matches in play right now." / hint: "Next kickoff: {fixture} at {time}."

### MethodNote

- Summary label (everywhere): "How we compute this"
- Link label: "Full methodology"

### Decision block (PlayerDrawer)

- Block label: "Decision"
- Verdicts: "Buy" / "Hold" / "Avoid"
- Reason sentence pattern: "{hits} of last {n} with {threshold}+ actions. {fixture note}."
  Example: "7 of last 8 with 10+ actions. Two soft fixtures next."

### Premium lock

- Value prop: "Alerts, full history and rotation risk. £2.99/month."
- CTA: "Go premium"

### Navigation

- Brand: "fplanalytic"
- Items: "DEFCON" (/) · "Live" (/live) · "Value" (/value) · "European Nights" (/ucl) · "Methodology" (/methodology)

### Footer / stamps

- Live tracker refresh stamp: "Last refreshed {HH:mm:ss}"
- Data source line: "Data: official FPL API. Updated twice daily."
