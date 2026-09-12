"""
UCL Fantasy expected points (xPts).

HOW xPts IS BUILT (per player, per matchday)
--------------------------------------------
  xPts = P(plays) * [ appearance pts
                      + xGoals   * goal_pts(position)
                      + xAssists * assist_pts
                      + P(CS)    * cs_pts(position)            (GK/DEF/MID)
                      - P(concede >= 2) * 1                    (GK/DEF)
                      + expected saves / 3                     (GK)
                      + expected recoveries / 3                (all)
                      - expected cards ]                       (yellow -1, red -3)

  where xGoals   = team_xG * player's share of team goals (from domestic data)
        xAssists = team_xG * player's share of team assists
        P(plays) = probability of starting/playing (the rotation model)

Everything the match model produces (team xG, P(CS), P(concede 2+)) comes from
match_model.predict_match(). Everything about the individual (goal share,
assist share, minutes/rotation probability) comes from the player-profile
adapter (adapters/players.py) which blends domestic-league and UCL history.

SCORING RULES
-------------
Encoded in SCORING below. These reflect the official UEFA Champions League
Fantasy rules as understood for 2026/27. VERIFY against
https://gaming.uefa.com/en/uclfantasy/rules before each season — UEFA tweaks
rules (e.g. recoveries, player-of-the-match) periodically. Keep this dict as
the single source of truth so a rules change is a one-line edit.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, Optional

from .match_model import MatchPrediction

# --- Official-style scoring (verify each season) ---------------------------
SCORING: Dict[str, Dict[str, float] | float] = {
    "appearance_60plus": 2,
    "appearance_under_60": 1,
    "goal": {"GK": 6, "DEF": 6, "MID": 5, "FWD": 4},
    "assist": 3,
    "clean_sheet": {"GK": 4, "DEF": 4, "MID": 1, "FWD": 0},
    "goals_conceded_per_2": {"GK": -1, "DEF": -1, "MID": 0, "FWD": 0},
    "saves_per_3": 1,            # GK only
    "penalty_save": 5,           # GK only
    "penalty_miss": -2,
    "yellow": -1,
    "red": -3,
    "own_goal": -2,
    "recoveries_per_3": 1,       # ball recoveries, all positions
    "player_of_match": 3,
    # Verified against uefa.com rules 2026/27 on 2026-09-12. These three exist
    # in the official game but are not yet estimated in expected_points()
    # (small expected contributions; the feed exposes gOB / pE / pC to model
    # them later):
    "goal_outside_box": 1,
    "penalty_earned": 2,
    "penalty_conceded": -1,
}


@dataclass
class PlayerProfile:
    """Everything we know about one player that feeds xPts."""

    player_id: str
    name: str
    team: str
    position: str                 # "GK" | "DEF" | "MID" | "FWD"
    price: float                  # UCL Fantasy price (EUR m)
    goal_share: float             # share of team goals this player scores (0-1)
    assist_share: float           # share of team goals this player assists (0-1)
    p_start: float                # probability of starting (rotation model)
    p_60plus_given_start: float = 0.85
    p_sub_appearance: float = 0.10  # plays <60 as a sub when not starting
    saves_per_90: float = 0.0     # GK only
    recoveries_per_90: float = 0.0
    yellow_per_90: float = 0.10
    red_per_90: float = 0.005
    pen_taker: bool = False
    p_potm: float = 0.0           # player-of-the-match probability (usually small)


@dataclass
class PlayerXPts:
    player_id: str
    name: str
    team: str
    position: str
    price: float
    opponent: str
    is_home: bool
    p_plays: float
    xpts: float
    breakdown: Dict[str, float] = field(default_factory=dict)

    @property
    def xpts_per_million(self) -> float:
        return self.xpts / self.price if self.price else 0.0

    def to_dict(self) -> Dict:
        d = asdict(self)
        d["xpts_per_million"] = round(self.xpts_per_million, 3)
        d["xpts"] = round(self.xpts, 2)
        d["breakdown"] = {k: round(v, 3) for k, v in self.breakdown.items()}
        return d


def _team_side(pred: MatchPrediction, team: str):
    """Return (is_home, team_xg, p_cs, p_concede_2plus, opponent) for `team`."""
    if team == pred.home:
        return True, pred.xg_home, pred.p_cs_home, pred.p_home_concede_2plus, pred.away
    if team == pred.away:
        return False, pred.xg_away, pred.p_cs_away, pred.p_away_concede_2plus, pred.home
    raise ValueError(f"{team} is not in fixture {pred.home} v {pred.away}")


def expected_points(player: PlayerProfile, pred: MatchPrediction, scoring: Dict = SCORING) -> PlayerXPts:
    """Compute expected UCL Fantasy points for one player in one fixture."""
    is_home, team_xg, p_cs, p_conc2, opp = _team_side(pred, player.team)
    pos = player.position

    # --- appearance & minutes -------------------------------------------------
    p_start = player.p_start
    p_60 = p_start * player.p_60plus_given_start
    p_short = p_start * (1 - player.p_60plus_given_start) + (1 - p_start) * player.p_sub_appearance
    p_plays = p_60 + p_short
    # Fraction of a full 90 we expect this player to be on the pitch, used to
    # scale per-90 rates. 60+ ≈ 0.95 of a match, short appearance ≈ 0.35.
    minutes_factor = p_60 * 0.95 + p_short * 0.35

    b: Dict[str, float] = {}
    b["appearance"] = p_60 * scoring["appearance_60plus"] + p_short * scoring["appearance_under_60"]

    # --- attacking returns ------------------------------------------------------
    x_goals = team_xg * player.goal_share * (minutes_factor / max(p_plays, 1e-9)) * p_plays
    x_assists = team_xg * player.assist_share * (minutes_factor / max(p_plays, 1e-9)) * p_plays
    b["goals"] = x_goals * scoring["goal"][pos]
    b["assists"] = x_assists * scoring["assist"]

    # --- defensive returns (need to be on the pitch for the CS to count; UEFA
    #     awards CS to players with 60+ mins) ------------------------------------
    b["clean_sheet"] = p_60 * p_cs * scoring["clean_sheet"][pos]
    b["goals_conceded"] = p_60 * p_conc2 * scoring["goals_conceded_per_2"][pos]

    # --- GK saves ------------------------------------------------------------------
    if pos == "GK":
        b["saves"] = minutes_factor * (player.saves_per_90 / 3.0) * scoring["saves_per_3"]
    else:
        b["saves"] = 0.0

    # --- recoveries, cards, POTM --------------------------------------------------
    b["recoveries"] = minutes_factor * (player.recoveries_per_90 / 3.0) * scoring["recoveries_per_3"]
    b["cards"] = minutes_factor * (player.yellow_per_90 * scoring["yellow"] + player.red_per_90 * scoring["red"])
    b["potm"] = p_60 * player.p_potm * scoring["player_of_match"]

    total = sum(b.values())
    return PlayerXPts(
        player_id=player.player_id, name=player.name, team=player.team, position=pos,
        price=player.price, opponent=opp, is_home=is_home, p_plays=p_plays, xpts=total, breakdown=b,
    )
