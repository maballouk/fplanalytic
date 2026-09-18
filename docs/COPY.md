# fplanalytic — approved copy

Rule (CLAUDE.md): copy is approved before it is built. This file is the register.
Voice (DESIGN.md §5): direct, expert, calm. Short sentences. Numbers before
adjectives. British football English. No em-dashes. No hype.

## Status: APPROVED by Mohamad, 2026-09-12

## Additions after approval: APPROVED by Mohamad, 2026-09-14 (موافق — covers every entry below)

- Decision fixture notes: "Soft run next." / "Even run next." / "Tough run next." /
  "No upcoming fixtures." (mean next-5 FDR ≤ 2.5 / ≤ 3.2 / above / none)
- Decision minutes risk: "Minutes risk: doubtful|injured|suspended|unavailable."
- Decision low rate: "Hit rate too low."
- Home MethodNote body: "Hit rate blends the last 5 matches (60%) with the season (40%),
  counting only matches with 60+ minutes. DEF need 10+ CBIT and tackles; MID and FWD need
  12+ including recoveries. xPts is the hit probability times 2."
- Premium page: "Premium launches later this season. The free tier stays complete."
- Methodology page: full prose at /methodology (src/app/methodology/page.tsx)
- /ucl hub (approved via the design canvas "Build A" pick, 2026-09-12): "European Nights" /
  "Matchday {N}", sub "Match predictions and expected points for every squad, built for your
  captain call.", "Captain picks", "Match predictions", "Expected points · all positions",
  "First kickoff", "Model fit", "most likely {score}", rotation caveat "Rotation model is v0:
  P(start) is a minutes proxy until lineups firm up", empty state "Predictions land once the
  engine has run." / "The engine runs every Monday and Thursday.", MethodNote bodies (Elo +
  Dixon-Coles fit note; xPts shares note ending "treat small gaps between players as noise")
- Live page: title "Live DEFCON tracker", sub "Every player on the pitch, sorted by who is
  closest to the threshold.", fixture chip "Live" / "FT", fixture line with no players yet:
  "No DEFCON-relevant minutes yet."
- My Team (requested by Mohamad 2026-09-13): page sub "Your squad through DEFCON eyes, next to
  the XI the numbers would field."; input label "Your FPL team ID"; button "Analyse my team";
  hint "Find it in the FPL site URL: /entry/ID/event/…"; headings "Your XI" / "The DEFCON XI" /
  "Bench"; GK note "Goalkeepers cannot earn DEFCON, so this XI fields ten outfielders.";
  "BIGGEST UPGRADE" + "{out} → {in}" + "+{x} DEFCON xPts per GW"; not-found "No team with that
  ID." / "Check the number in your FPL URL: fantasy.premierleague.com/entry/ID/…"; MethodNote
  body (public by team ID, no login; GK counts zero; captain doubling not included)
- Predicted XI pitch (requested by Mohamad 2026-09-12, Scout-Picks benchmark): "The predicted
  XI", "{formation} · {x} xPts combined", "The captain call", "xPts doubled", captain badge "C",
  MethodNote body (max three per club, ignores the budget on purpose)
- Game clarity (requested by Mohamad 2026-09-12): nav group labels "FPL" / "UCL Fantasy";
  page tag chips "FPL" on /live and /value; home chip "FPL · GW{N} brief"; methodology section
  "Two games, one site" (prose in src/app/methodology/page.tsx); /picks banner "This is the
  old dashboard, kept for reference." + link "The new fplanalytic lives here"
- State-aware home (approved via the flow canvas "ok", 2026-09-12): first-visit strip
  "DEFCON is the new +2 for defensive work" / "We track who hits it, twice a day and live on
  matchdays" / "Every number links to how it is computed"; brief chip "GW{N} brief"; card tags
  "THE BUY" / "THE DIFFERENTIAL" / "THE TRAP"; differential reason "{pct} hit rate at £{m},
  {pct} owned."; trap reason "{pct} hit rate, but {n} of the next {m} are rated 4 or worse.
  Wait."; deadline banner "GW{N} deadline in {t}" + "Final checks below"; live banner "Closest
  to the +2 right now" + "Open the live tracker"; review "GW{N} full time: the +2 ledger" +
  "Players who keep landing one short are buys, not duds" + "missed by {n}"
- Totals pivot (owner direction 2026-09-13, supersedes the DEFCON-first strings below where they
  conflict): hero "Every player's next gameweek, in points." / "Predicted points from each
  player's match record, checked against the world's top 50 managers. DEFCON detail included.";
  table columns "Predicted pts" (default sort) / "Form" / "Top-50 own" (+ "C {pct}" captain
  badge) / "DEFCON" / "DEFCON /£m"; drawer panel "Predicted next GW" + "{x} points" + breakdown
  chips (Minutes/Goals/Assists/Clean sheet/Saves/Bonus/DEFCON/Conceded) + "Owned by {pct} of the
  world's top 50 managers · captained by {pct}"; brief reasons — buy "Predicted {x} pts next GW,
  form {f}. {Soft|Even|Tough} run next.", differential "Predicted {x} pts, owned by {pct} of the
  top 50 and {pct} overall.", trap "Owned by {pct} of the top 50, but {…}. Wait."; My Team sub
  "Your real squad, its predicted points, and the XI the numbers would field.", heading "The
  predicted XI" (GK included), totals "{x} predicted pts", upgrade "+{x} predicted pts per GW",
  GK note replaced by "Best available XI by predicted points, max three per club, likely
  starters only."; GK drawer reason "Predicted {x} pts next GW. P(start) {pct}."
- UCL consensus (owner direction 2026-09-13): captain cards line "Picked by {pct}% of all
  managers" + "· buying now ▲" on positive transfer balance; table column "Picked"; strip
  "THE CROWD'S CALL" + "{name} is the most-picked player — {pct}% of all managers own him." +
  "Our model has him at {x} xPts v {OPP} ({H|A})."; captains caveat "P(start) blends minutes
  with UEFA's own availability flags; lineups can still surprise"
- Light mode (requested 2026-09-14): toggle aria-labels "Switch to light mode" / "Switch to
  dark mode", titles "Light mode" / "Dark mode"; umami event theme_toggle
- Match Centre (owner direction 2026-09-14): /live title "Matchday live", sub "Scores and
  kickoffs for the whole gameweek. Open a match for events, squads and the DEFCON race.";
  groups "Live now" / "Upcoming" / "Full time"; card link "Match Centre →"; expander
  "Closest to the +2"; match page sections "Events" (+ " & bonus" post), "The DEFCON race ·
  closest to the +2", "On the pitch · FPL points", "Ones to watch · form this season",
  "Team news · from the official FPL feed"; status chips "LIVE"/"{n}'"/"FT"/"Full time";
  back link "← Matchday live"
- Kickoff countdown (Mohamad 2026-09-18): "First kickoff of the gameweek in" / "Next
  kickoff in" / "Kicking off"; soon-chip "KO in {m}m"
- Look & feel round (owner approval 2026-09-14): bottom nav labels "DEFCON" / "Live" /
  "My Team" / "UCL" / "Value"; header countdown chip "GW{N} · {2d 4h}"; mobile card unit
  label "PRED PTS"; compare button "Compare" + helper "Pick two players" / "and one more…" +
  panel heading "HEAD TO HEAD" with rows Predicted pts / Form (last 5) / P(start) / Top-50
  own / Overall own / Price £m / DEFCON xPts / Next-5 difficulty; My Team button "Share as
  image" / "Rendering…"; share card footer "fplanalytic.com/my-team"; player page back link
  "← All players", section "DEFCON detail"; drawer link "Full profile page →"; OG footers
  "Predicted points, top-50 manager consensus and DEFCON · fplanalytic.com" and "Match
  predictions and expected points for every squad · fplanalytic.com/ucl"
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
