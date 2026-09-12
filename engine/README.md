# fplanalytic prediction engine

Python package behind two features:

* **UCL Fantasy xPts** — Elo team ratings → Dixon-Coles time-weighted Poisson match model →
  scoreline matrix → team xG, 1X2, clean-sheet odds → per-player expected points under the
  official UCL Fantasy scoring rules.
* **FPL DEFCON analytics** — hit rate, near-miss rate, consistency, DEFCON xPts and value per £m.

All data sources are free and each lives behind an adapter in `ucl_engine/adapters/`.

## Install & test

```bash
cd engine
pip install -e . && pip install pytest
pytest                     # 21 tests
python -m ucl_engine.cli demo --out demo.json   # offline, synthetic data
```

## Live run (per matchday)

```bash
export FOOTBALL_DATA_TOKEN=...   # free key: football-data.org
python -m ucl_engine.cli predict --matchday 3 --out ../public/data/ucl_md3.json
```

ClubElo needs no key. The UEFA Fantasy feed is unofficial: verify the URL and JSON shape each
season in the game's network tab and adjust `adapters/uefa_fantasy.py` only.

## Output schema (`ucl_md{N}.json`)

```
matchday, generated_at, model{type, n_matches_fit, home_adv, rho},
fixtures[{home, away, xg_home, xg_away, p_home, p_draw, p_away, p_cs_home, p_cs_away,
          p_home_concede_2plus, p_away_concede_2plus, p_over_2_5, most_likely_score, source}],
players[{player_id, name, team, position, price, opponent, is_home, p_plays, xpts,
         xpts_per_million, breakdown{appearance, goals, assists, clean_sheet, goals_conceded,
         saves, recoveries, cards, potm}}]
```

## Model notes

* Dixon-Coles corrects plain Poisson's under-count of 0-0 / 1-1; `rho` is regularised toward -0.06
  and bounded to [-0.2, 0.1] because with few matches it is poorly identified.
* Time decay: half-life 180 days (a match six months old counts half).
* Cold start: Elo → (attack, defence) priors; the fit shrinks toward them with weight ≈ 2 matches.
* Biggest remaining error source: **rotation** (P(start)). `build_profiles` uses a crude
  minutes proxy; replace with the rotation model in `TASKS.md 1.5.3`.
* Re-verify `fantasy.py::SCORING` and `defcon.py::THRESHOLD` every season.
