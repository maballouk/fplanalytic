"""
Elo ratings: the cross-league backbone.

WHY ELO HERE
------------
The Champions League mixes 36 clubs from many leagues. Domestic form alone
cannot tell you how a Portuguese champion compares with a 4th-placed Bundesliga
side. Elo ratings, updated from every competitive result across Europe, give a
single comparable strength scale. ClubElo (clubelo.com) publishes exactly this
for free and updates daily, so in production we LOAD ratings from ClubElo
(see adapters/clubelo.py) rather than recompute from scratch.

This module provides:
  1. A standard Elo updater (for our own maintenance / backtests).
  2. `elo_to_strength_priors()` — the bridge into the Dixon-Coles fitter, so a
     team with zero UCL matches still has a sensible attack/defence estimate.
  3. `elo_expected_goals()` — a self-contained fallback that maps a rating gap
     to expected goals when we cannot fit Dixon-Coles at all (very early season).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Tuple

import numpy as np


@dataclass
class EloTable:
    ratings: Dict[str, float] = field(default_factory=dict)
    default: float = 1500.0
    k: float = 20.0
    home_adv: float = 65.0  # Elo points; ClubElo uses a similar magnitude

    def get(self, team: str) -> float:
        return self.ratings.get(team, self.default)

    def expected_score(self, home: str, away: str, neutral: bool = False) -> float:
        """P(home wins) with draws counted as half, standard Elo logistic."""
        diff = self.get(home) - self.get(away) + (0.0 if neutral else self.home_adv)
        return 1.0 / (1.0 + 10 ** (-diff / 400.0))

    def update(self, home: str, away: str, home_goals: int, away_goals: int, neutral: bool = False) -> None:
        """Standard update with a goal-difference multiplier (as in World Football Elo)."""
        exp_h = self.expected_score(home, away, neutral)
        if home_goals > away_goals:
            act_h = 1.0
        elif home_goals == away_goals:
            act_h = 0.5
        else:
            act_h = 0.0
        gd = abs(home_goals - away_goals)
        g = 1.0 if gd <= 1 else 1.5 if gd == 2 else (11 + gd) / 8.0
        delta = self.k * g * (act_h - exp_h)
        self.ratings[home] = self.get(home) + delta
        self.ratings[away] = self.get(away) - delta


def elo_expected_goals(
    elo_home: float,
    elo_away: float,
    neutral: bool = False,
    home_adv: float = 65.0,
    base_total_goals: float = 2.9,
    sensitivity: float = 0.0018,
) -> Tuple[float, float]:
    """
    Fallback mapping from an Elo gap to expected goals.

    Approach: keep total goals near the UCL average (~2.9 in the league-phase
    era) and split them by a logistic function of the rating gap. `sensitivity`
    controls how sharply a rating gap translates into goal dominance; 0.0018
    means a 400-point gap gives roughly 70/30 goal share, which matches
    historical UCL mismatches reasonably well. Tune on backtests.
    """
    diff = elo_home - elo_away + (0.0 if neutral else home_adv)
    share_home = 1.0 / (1.0 + np.exp(-sensitivity * diff))
    # Stronger favourites also raise the total slightly (more open games)
    total = base_total_goals * (1.0 + 0.15 * abs(2 * share_home - 1))
    return float(total * share_home), float(total * (1.0 - share_home))


def elo_to_strength_priors(
    elo: Dict[str, float],
    league_mean: float | None = None,
    scale: float = 400.0,
    strength_per_scale: float = 0.55,
) -> Dict[str, Tuple[float, float]]:
    """
    Convert Elo ratings into (attack, defence) log-scale priors for Dixon-Coles.

    A team `scale` Elo points above the field gets +strength_per_scale attack and
    -strength_per_scale defence (defence is "goals conceded" so negative = good).
    The split is symmetric because Elo does not separate attack from defence;
    the Dixon-Coles fit then learns the asymmetry from real matches.
    """
    if not elo:
        return {}
    mean = league_mean if league_mean is not None else float(np.mean(list(elo.values())))
    priors: Dict[str, Tuple[float, float]] = {}
    for team, r in elo.items():
        z = (r - mean) / scale * strength_per_scale
        priors[team] = (z, -z)
    return priors
