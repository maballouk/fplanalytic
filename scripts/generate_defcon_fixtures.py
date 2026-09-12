"""
Generate tests/fixtures/defcon_cases.json from the Python engine (TASKS.md 1.1).

The Python implementation (engine/ucl_engine/defcon.py) is the oracle; the
TypeScript port (src/lib/defcon/profile.ts) must reproduce every expected value
to within 1e-9. Re-run after any change to either implementation:

    python scripts/generate_defcon_fixtures.py
"""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

from ucl_engine.defcon import DefconMatch, defcon_profile

# Each case: label, profile args, history rows, optional keyword options.
# Covers: both thresholds, recoveries, cameo filtering, GK, empty-after-filter,
# blend on/off around the 5-game boundary, zero-action degenerate stats,
# single-game sd=0, price 0, exact-60-minute boundary and non-default options.
CASES = [
    {
        "label": "defender mixed hits and near misses (engine test case)",
        "args": ("1", "Def", "T", "DEF", 5.0),
        "history": [{"minutes": 90, "cbit": a} for a in [10, 12, 9, 8, 11, 9]],
    },
    {
        "label": "midfielder counts recoveries, threshold 12 (engine test case)",
        "args": ("2", "Mid", "T", "MID", 6.0),
        "history": [
            {"minutes": 90, "cbit": 7, "recoveries": 5},
            {"minutes": 90, "cbit": 6, "recoveries": 4},
        ],
    },
    {
        "label": "short cameo filtered out (engine test case)",
        "args": ("3", "Def", "T", "DEF", 5.0),
        "history": [{"minutes": 20, "cbit": 11}, {"minutes": 90, "cbit": 11}],
    },
    {
        "label": "goalkeeper has no DEFCON profile",
        "args": ("4", "GK", "T", "GK", 5.0),
        "history": [{"minutes": 90, "cbit": 11}],
    },
    {
        "label": "all matches below minute floor -> no profile",
        "args": ("5", "Def", "T", "DEF", 4.5),
        "history": [{"minutes": 45, "cbit": 12}, {"minutes": 59, "cbit": 14}],
    },
    {
        "label": "fewer than 5 games: season rate only, no blend",
        "args": ("6", "Def", "T", "DEF", 5.5),
        "history": [{"minutes": 90, "cbit": a} for a in [9, 10, 11]],
    },
    {
        "label": "exactly 5 games: blend kicks in",
        "args": ("7", "Def", "T", "DEF", 4.0),
        "history": [{"minutes": 90, "cbit": a} for a in [10, 9, 10, 8, 12]],
    },
    {
        "label": "role change over 10 games: last5 dominates via 0.6 weight",
        "args": ("8", "Def", "T", "DEF", 4.5),
        "history": [{"minutes": 90, "cbit": a} for a in [4, 5, 6, 5, 4, 10, 11, 12, 10, 11]],
    },
    {
        "label": "forward with recoveries around threshold 12",
        "args": ("9", "Fwd", "T", "FWD", 7.5),
        "history": [
            {"minutes": 90, "cbit": 5, "recoveries": 7},
            {"minutes": 90, "cbit": 4, "recoveries": 7},
            {"minutes": 75, "cbit": 8, "recoveries": 5},
            {"minutes": 90, "cbit": 3, "recoveries": 6},
        ],
    },
    {
        "label": "zero actions every match: mu=0 degenerate consistency",
        "args": ("10", "Def", "T", "DEF", 4.0),
        "history": [{"minutes": 90, "cbit": 0} for _ in range(3)],
    },
    {
        "label": "price zero: value guard",
        "args": ("11", "Def", "T", "DEF", 0.0),
        "history": [{"minutes": 90, "cbit": 10}, {"minutes": 90, "cbit": 12}],
    },
    {
        "label": "single qualifying game: sd=0, consistency 1",
        "args": ("12", "Mid", "T", "MID", 5.0),
        "history": [{"minutes": 60, "cbit": 9, "recoveries": 4}],
    },
    {
        "label": "non-default options: min 45, margin 3, weight 0.5",
        "args": ("13", "Def", "T", "DEF", 5.0),
        "history": [{"minutes": 50, "cbit": a} for a in [7, 8, 9, 10, 11, 6]],
        "options": {"min_minutes": 45, "near_miss_margin": 3, "recency_weight": 0.5},
    },
]


def main() -> None:
    out = {"generated_by": "scripts/generate_defcon_fixtures.py (Python engine is the oracle)", "cases": []}
    for case in CASES:
        history = [DefconMatch(**row) for row in case["history"]]
        options = case.get("options", {})
        profile = defcon_profile(*case["args"], history, **options)
        # Full precision on purpose: the TS side compares within 1e-9, so we do
        # not use to_dict()'s 3-decimal rounding here.
        expected = None if profile is None else asdict(profile)
        pid, name, team, position, price = case["args"]
        out["cases"].append(
            {
                "label": case["label"],
                "input": {
                    "player_id": pid,
                    "name": name,
                    "team": team,
                    "position": position,
                    "price": price,
                    "history": case["history"],
                    "options": options,
                },
                "expected": expected,
            }
        )

    path = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "defcon_cases.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {path} ({len(out['cases'])} cases)")


if __name__ == "__main__":
    main()
