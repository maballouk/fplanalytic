"""
Pipeline: data -> team model -> match predictions -> player xPts -> JSON.

Runs once per matchday (cron / GitHub Action) and writes a static JSON the
Next.js site reads. Static JSON keeps hosting free and the site fast; nothing
in the front end needs to call Python at request time.

    python -m ucl_engine.cli predict --matchday 3 --out public/data/ucl_md3.json
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional

from .dixon_coles import Match, DixonColesParams, fit_dixon_coles
from .elo import elo_to_strength_priors
from .fantasy import PlayerProfile, expected_points, PlayerXPts
from .match_model import predict_match, MatchPrediction
from .adapters.fixtures import Fixture


@dataclass
class MatchdayOutput:
    matchday: Optional[int]
    generated_at: str
    model: Dict
    fixtures: List[Dict]
    players: List[Dict]
    notes: List[str] = field(default_factory=list)


def fit_team_model(
    matches: List[Match],
    elo: Optional[Dict[str, float]] = None,
    half_life_days: float = 180.0,
    prior_weight: float = 2.0,
) -> Optional[DixonColesParams]:
    """Fit Dixon-Coles with Elo priors. Returns None if there is nothing to fit yet."""
    if not matches:
        return None
    priors = elo_to_strength_priors(elo) if elo else None
    return fit_dixon_coles(matches, half_life_days=half_life_days, prior_strength=priors, prior_weight=prior_weight)


def predict_fixtures(fixtures: List[Fixture], params: Optional[DixonColesParams], elo: Optional[Dict[str, float]]) -> List[MatchPrediction]:
    return [predict_match(f.home, f.away, params=params, elo=elo, neutral=f.neutral) for f in fixtures]


def rank_players(profiles: List[PlayerProfile], preds: List[MatchPrediction]) -> List[PlayerXPts]:
    by_team: Dict[str, MatchPrediction] = {}
    for p in preds:
        by_team[p.home] = p
        by_team[p.away] = p
    out: List[PlayerXPts] = []
    for pr in profiles:
        pred = by_team.get(pr.team)
        if pred is None:
            continue  # team not playing this matchday (or name mismatch — check adapters/teams.py)
        out.append(expected_points(pr, pred))
    out.sort(key=lambda x: x.xpts, reverse=True)
    return out


def run_matchday(
    matchday: Optional[int],
    completed: List[Match],
    fixtures: List[Fixture],
    profiles: List[PlayerProfile],
    elo: Optional[Dict[str, float]] = None,
    notes: Optional[List[str]] = None,
) -> MatchdayOutput:
    params = fit_team_model(completed, elo=elo)
    preds = predict_fixtures(fixtures, params, elo)
    ranked = rank_players(profiles, preds)
    model_info = {
        # Honest label: "+elo_prior" only when Elo priors actually informed the fit
        "type": ("dixon_coles+elo_prior" if elo else "dixon_coles_shrunk") if params else "elo_fallback",
        "n_matches_fit": params.n_matches if params else 0,
        "home_adv": round(params.home_adv, 4) if params else None,
        "rho": round(params.rho, 4) if params else None,
        "half_life_days": 180,
    }
    return MatchdayOutput(
        matchday=matchday,
        generated_at=datetime.now(timezone.utc).isoformat(),
        model=model_info,
        fixtures=[p.to_dict() for p in preds],
        players=[x.to_dict() for x in ranked],
        notes=notes or [],
    )


def write_json(out: MatchdayOutput, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(asdict(out), f, ensure_ascii=False, indent=2)
