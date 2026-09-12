# fplanalytic — approved copy

Rule (CLAUDE.md): copy is approved before it is built. This file is the register.
Voice (DESIGN.md §5): direct, expert, calm. Short sentences. Numbers before
adjectives. British football English. No em-dashes. No hype.

## Status: PROPOSED — awaiting Mohamad's approval (2026-09-12)

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
