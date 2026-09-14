# r/FantasyPL launch post

Status: APPROVED by Mohamad, 2026-09-14 ("موافق"), refreshed the same day to match the
shipped totals-first product before posting. Voice rules apply: numbers before
adjectives, no hype, no em-dashes.

---

**Title:**
I built a free FPL tool: predicted points for every player, checked against the world's top 50 managers

**Body:**

I wanted one number per player: how many points is he likely to score next
gameweek, built from his own match record rather than gut feel. The official
site does not show that, so I built it.

fplanalytic.com, free:

- **Predicted points.** Every player with a start, ranked by predicted points
  for the next GW. The number is built from his own goals, assists, clean
  sheets, saves, bonus and defensive contribution per 90, shrunk toward league
  rates so a hot two-game start does not read as certainty, then scaled by
  fixture difficulty and expected minutes. Every player page shows the exact
  breakdown.
- **Top-50 consensus.** Next to every prediction: how many of the current top
  50 managers in the world own the player, and how many captain him. A player
  the model rates that the elite ignore is a differential; one they pile into
  before a tough run gets flagged.
- **DEFCON detail.** Hit rates blending the last 5 matches with the season,
  near-miss rates (a defender who keeps landing on 9 is closer to points than
  his totals suggest), and on matchdays a Match Centre per fixture: live
  score, events, and a threshold bar for every player on the pitch, sorted by
  who is closest to the +2. Refreshes every minute.
- **My Team.** Paste your team ID (no login) and see your XI's predicted
  points next to the XI the numbers would field, plus your single biggest
  like-for-like upgrade.

Every number has a "How we compute this" note and a plain-English methodology
page. No black-box ML, and the limitations are listed there honestly (small
samples early season, FDR is blunt, status flags lag press conferences).

Data is from the official FPL API, rebuilt twice a day. There is a Champions
League Fantasy side too (fplanalytic.com/ucl) if you play that. Would
genuinely appreciate feedback on what is missing.

---

Notes for Mohamad:

- Check current r/FantasyPL self-promotion rules before posting (flair, thread, day).
- The live tracker has now run through a full gameweek (GW4) in production, so
  the "post after one full GW" condition is met. Post whenever it suits.
