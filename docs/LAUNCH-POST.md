# r/FantasyPL launch post — DRAFT for approval (release gate 1)

Status: PROPOSED, awaiting Mohamad. Post only after the deploy is live and checked.
Voice rules apply: numbers before adjectives, no hype, no em-dashes.

---

**Title:**
I built a free DEFCON tracker: hit rates, near misses and live threshold bars for every DEF/MID/FWD

**Body:**

Defensive contribution changed how I pick my back line, but the official site only
shows season totals. I wanted to know who actually hits 10+ (or 12+ for MID/FWD)
week after week, and who keeps landing one action short. So I built it.

fplanalytic.com, free:

- **Asset finder.** Every DEF/MID/FWD with a start, ranked by DEFCON expected
  points. Hit rate blends the last 5 matches with the season so role changes show
  up fast. Near-miss rate is there too: a defender who keeps finishing on 9 is
  closer to points than his totals suggest.
- **Live tracker.** On matchdays, a threshold bar for every player on the pitch,
  sorted by who is closest to the bonus. Refreshes every minute.
- **Value lens.** Price against DEFCON xPts, so you can see who earns their
  defensive points at 4.5 and who you are overpaying.

Every number has a "How we compute this" note and a plain-English methodology
page. No black-box ML, and the limitations are listed there honestly (small
samples early season, FDR is blunt, status flags lag press conferences).

Data is from the official FPL API, rebuilt twice a day. Would genuinely
appreciate feedback on what is missing, especially from anyone who watches
DEFCON closely.

---

Notes for Mohamad:

- Check current r/FantasyPL self-promotion rules before posting (flair, thread, day).
- Post after at least one full GW of data on the live site so the tracker has been
  seen working.
