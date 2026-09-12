"""
ClubElo adapter (free). http://clubelo.com/API

Endpoint: http://api.clubelo.com/YYYY-MM-DD  -> CSV of every club's Elo on that date.
Columns: Rank,Club,Country,Level,Elo,From,To

Club names on ClubElo differ from UEFA/other feeds (e.g. "Man City" vs
"Manchester City"). Resolve them through `TEAM_ALIASES` in adapters/teams.py —
never hard-code a mapping inside a model.
"""

from __future__ import annotations

import csv
import io
from datetime import date
from typing import Dict, Optional

import requests

from .teams import canonical

CLUBELO_URL = "http://api.clubelo.com/{d}"


def fetch_clubelo(on: Optional[date] = None, timeout: int = 20) -> Dict[str, float]:
    """Return {canonical_team_name: elo} for the given date (default today)."""
    d = (on or date.today()).isoformat()
    r = requests.get(CLUBELO_URL.format(d=d), timeout=timeout)
    r.raise_for_status()
    return parse_clubelo_csv(r.text)


def parse_clubelo_csv(text: str) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for row in csv.DictReader(io.StringIO(text)):
        try:
            out[canonical(row["Club"])] = float(row["Elo"])
        except (KeyError, ValueError):
            continue
    return out
