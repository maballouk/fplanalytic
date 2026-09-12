"""
Match-level prediction: turns model parameters into the numbers the fantasy
layer needs. Everything derives from one scoreline probability matrix so the
outputs are always mutually consistent (P(home CS) is literally the mass of
the "away scores 0" column, etc.).
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Dict, Optional, Tuple

import numpy as np

from .dixon_coles import DixonColesParams, expected_goals, scoreline_matrix
from .elo import elo_expected_goals


@dataclass
class MatchPrediction:
    home: str
    away: str
    xg_home: float
    xg_away: float
    p_home: float
    p_draw: float
    p_away: float
    p_cs_home: float          # home keeps a clean sheet (away scores 0)
    p_cs_away: float          # away keeps a clean sheet (home scores 0)
    p_home_concede_2plus: float  # for the "-1 per 2 goals conceded" rule
    p_away_concede_2plus: float
    p_over_2_5: float
    most_likely_score: Tuple[int, int]
    source: str               # "dixon_coles" | "elo_fallback"

    def to_dict(self) -> Dict:
        d = asdict(self)
        d["most_likely_score"] = f"{self.most_likely_score[0]}-{self.most_likely_score[1]}"
        return d


def _summarise(home: str, away: str, lam_h: float, lam_a: float, rho: float, source: str) -> MatchPrediction:
    m = scoreline_matrix(lam_h, lam_a, rho)
    n = m.shape[0]
    idx = np.arange(n)
    p_home = float(np.sum(np.tril(m, -1)))   # i > j  (home > away)
    p_draw = float(np.trace(m))
    p_away = float(np.sum(np.triu(m, 1)))
    p_cs_home = float(m[:, 0].sum())         # away scored 0
    p_cs_away = float(m[0, :].sum())         # home scored 0
    p_home_concede_2plus = float(m[:, 2:].sum())
    p_away_concede_2plus = float(m[2:, :].sum())
    totals = idx[:, None] + idx[None, :]
    p_over = float(m[totals >= 3].sum())
    i, j = np.unravel_index(np.argmax(m), m.shape)
    return MatchPrediction(
        home=home, away=away, xg_home=lam_h, xg_away=lam_a,
        p_home=p_home, p_draw=p_draw, p_away=p_away,
        p_cs_home=p_cs_home, p_cs_away=p_cs_away,
        p_home_concede_2plus=p_home_concede_2plus, p_away_concede_2plus=p_away_concede_2plus,
        p_over_2_5=p_over, most_likely_score=(int(i), int(j)), source=source,
    )


def predict_match(
    home: str,
    away: str,
    params: Optional[DixonColesParams] = None,
    elo: Optional[Dict[str, float]] = None,
    neutral: bool = False,
    min_matches_for_dc: int = 1,
) -> MatchPrediction:
    """
    Predict a fixture. Uses Dixon-Coles when both teams are in the fitted model,
    otherwise falls back to the Elo goal mapping. `neutral=True` for the final.
    """
    if params is not None and home in params.attack and away in params.attack and params.n_matches >= min_matches_for_dc:
        lam_h, lam_a = expected_goals(params, home, away, neutral=neutral)
        return _summarise(home, away, lam_h, lam_a, params.rho, "dixon_coles")
    if elo is None:
        raise ValueError("Need either fitted Dixon-Coles params covering both teams, or Elo ratings.")
    lam_h, lam_a = elo_expected_goals(elo.get(home, 1500.0), elo.get(away, 1500.0), neutral=neutral)
    # A typical fitted rho for top European football is ~ -0.05 to -0.08
    return _summarise(home, away, lam_h, lam_a, -0.06, "elo_fallback")
