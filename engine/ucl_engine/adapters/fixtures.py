"""
Fixtures & results adapter — football-data.org (free tier).

Docs: https://www.football-data.org/documentation/quickstart
Competition code for the Champions League: "CL". Free tier: 10 requests/min,
current season, scores + fixtures (no xG). Set FOOTBALL_DATA_TOKEN in env.

Returns engine `Match` objects (completed games) and a list of upcoming
fixtures. Swap this file for BALLDONTLIE or another source without touching
the models — that is the whole point of the adapter layer.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import requests

from ..dixon_coles import Match
from .teams import canonical

BASE = "https://api.football-data.org/v4"


@dataclass
class Fixture:
    home: str
    away: str
    kickoff_utc: datetime
    matchday: Optional[int]
    stage: str
    neutral: bool = False   # True only for the final


def _headers() -> dict:
    token = os.environ.get("FOOTBALL_DATA_TOKEN")
    if not token:
        raise RuntimeError("Set FOOTBALL_DATA_TOKEN (free key from football-data.org)")
    return {"X-Auth-Token": token}


def fetch_ucl_matches(season: Optional[int] = None, timeout: int = 20) -> Tuple[List[Match], List[Fixture]]:
    """
    Fetch this season's Champions League matches.
    Returns (completed_matches_for_fitting, upcoming_fixtures).
    """
    params = {}
    if season:
        params["season"] = season
    r = requests.get(f"{BASE}/competitions/CL/matches", headers=_headers(), params=params, timeout=timeout)
    r.raise_for_status()
    return parse_matches(r.json())


def parse_matches(payload: dict, now: Optional[datetime] = None) -> Tuple[List[Match], List[Fixture]]:
    now = now or datetime.now(timezone.utc)
    done: List[Match] = []
    upcoming: List[Fixture] = []
    for m in payload.get("matches", []):
        home = canonical(m["homeTeam"].get("shortName") or m["homeTeam"]["name"])
        away = canonical(m["awayTeam"].get("shortName") or m["awayTeam"]["name"])
        ko = datetime.fromisoformat(m["utcDate"].replace("Z", "+00:00"))
        stage = m.get("stage", "")
        if m.get("status") == "FINISHED":
            ft = m["score"]["fullTime"]
            done.append(
                Match(
                    home=home, away=away,
                    home_goals=int(ft["home"]), away_goals=int(ft["away"]),
                    days_ago=max((now - ko).total_seconds() / 86400.0, 0.0),
                )
            )
        elif m.get("status") in {"SCHEDULED", "TIMED"}:
            upcoming.append(Fixture(home=home, away=away, kickoff_utc=ko, matchday=m.get("matchday"), stage=stage, neutral=(stage == "FINAL")))
    return done, upcoming
