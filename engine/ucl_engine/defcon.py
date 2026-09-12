"""
FPL Defensive Contribution (DEFCON) analytics — Phase 1 beachhead logic.

RULE (2025/26 onward; verify at the start of each FPL season)
-------------------------------------------------------------
  Defenders:            +2 pts when clearances+blocks+interceptions+tackles (CBIT) >= 10 in a match
  Midfielders/Forwards: +2 pts when CBIT + ball recoveries >= 12 in a match
  Awarded at most once per match.

The FPL API exposes per-match `clearances_blocks_interceptions`, `tackles`,
`recoveries` and `defensive_contribution` in element-summary history (field
names as of 2025/26 — confirm in TASKS.md step 1.2 before wiring up).

WHAT THIS MODULE ANSWERS
------------------------
  * hit_rate:        share of matches (>=60 min) where the player earned DEFCON
  * mean_actions:    average defensive actions per match (his "engine size")
  * near_miss_rate:  share of matches finishing 1-2 actions short of the threshold
                     (a player who keeps landing on 9 is a buy signal, not a dud)
  * consistency:     1 - coefficient of variation of actions (steadier = better)
  * defcon_xpts:     expected DEFCON points per match = P(hit) * 2
  * value:           defcon_xpts per £m — the "defensive value lens"
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from statistics import mean, pstdev
from typing import Dict, List, Optional

THRESHOLD = {"DEF": 10, "MID": 12, "FWD": 12, "GK": None}
DEFCON_POINTS = 2


@dataclass
class DefconMatch:
    minutes: int
    cbit: int                   # clearances + blocks + interceptions + tackles
    recoveries: int = 0
    opponent: Optional[str] = None
    was_home: Optional[bool] = None


def actions_for_position(m: DefconMatch, position: str) -> int:
    """Defenders count CBIT only; MID/FWD add recoveries."""
    return m.cbit if position == "DEF" else m.cbit + m.recoveries


@dataclass
class DefconProfile:
    player_id: str
    name: str
    team: str
    position: str
    price: float
    matches_considered: int
    hit_rate: float
    mean_actions: float
    near_miss_rate: float
    consistency: float
    defcon_xpts: float
    value_per_million: float
    last5_actions: List[int]

    def to_dict(self) -> Dict:
        d = asdict(self)
        for k in ("hit_rate", "mean_actions", "near_miss_rate", "consistency", "defcon_xpts", "value_per_million"):
            d[k] = round(d[k], 3)
        return d


def defcon_profile(
    player_id: str,
    name: str,
    team: str,
    position: str,
    price: float,
    history: List[DefconMatch],
    min_minutes: int = 60,
    near_miss_margin: int = 2,
    recency_weight: float = 0.6,
) -> Optional[DefconProfile]:
    """
    Build a DEFCON profile from match history. Only matches with >= min_minutes
    count (a 15-minute cameo tells you nothing about a player's engine).
    `recency_weight` blends last-5-match hit rate with season hit rate so the
    number reacts to role changes without being whipsawed by one game.
    """
    thr = THRESHOLD.get(position)
    if thr is None:
        return None
    games = [m for m in history if m.minutes >= min_minutes]
    if not games:
        return None
    acts = [actions_for_position(m, position) for m in games]
    hits = [a >= thr for a in acts]
    near = [(thr - near_miss_margin) <= a < thr for a in acts]

    season_hit = mean(hits)
    last5 = acts[-5:]
    last5_hit = mean(a >= thr for a in last5)
    blended_hit = recency_weight * last5_hit + (1 - recency_weight) * season_hit if len(games) >= 5 else season_hit

    mu = mean(acts)
    sd = pstdev(acts) if len(acts) > 1 else 0.0
    consistency = max(0.0, 1.0 - (sd / mu if mu else 1.0))
    xpts = blended_hit * DEFCON_POINTS
    return DefconProfile(
        player_id=player_id, name=name, team=team, position=position, price=price,
        matches_considered=len(games), hit_rate=blended_hit, mean_actions=mu,
        near_miss_rate=mean(near), consistency=consistency, defcon_xpts=xpts,
        value_per_million=(xpts / price) if price else 0.0, last5_actions=last5,
    )


def rank_defcon(profiles: List[DefconProfile], by: str = "defcon_xpts") -> List[DefconProfile]:
    return sorted(profiles, key=lambda p: getattr(p, by), reverse=True)
