"""
UEFA Champions League Fantasy adapter (UNOFFICIAL endpoint).

The official game front-end (gaming.uefa.com/en/uclfantasy) loads player data
from a JSON feed. It is not a documented public API and can change without
notice, which is exactly why it lives behind this adapter. If the shape
changes, fix `parse_players()` here and nothing else in the engine moves.

Known feed (2024/25–2025/26 seasons; re-verify each season by inspecting the
network tab on the game's "Transfers" page):

    https://gaming.uefa.com/en/uclfantasy/services/feeds/players/players_{MATCHDAY}_en_{N}.json

The JSON carries, per player: id, name, club, position (1=GK,2=DEF,3=MID,4=FWD),
value (price), total points, per-matchday points and stat lines (goals,
assists, clean sheets, saves, recoveries, minutes...).

Respect UEFA's terms of use: fetch once per matchday, cache the result, never
hammer the endpoint, and do not redistribute the raw feed.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, List, Optional

import requests

from ..fantasy import PlayerProfile
from .teams import canonical

FEED_URL = "https://gaming.uefa.com/en/uclfantasy/services/feeds/players/players_{md}_en_{n}.json"
POS_MAP = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD", "1": "GK", "2": "DEF", "3": "MID", "4": "FWD",
           "GK": "GK", "DEF": "DEF", "MID": "MID", "FWD": "FWD", "GOALKEEPER": "GK", "DEFENDER": "DEF",
           "MIDFIELDER": "MID", "FORWARD": "FWD"}


@dataclass
class RawPlayer:
    player_id: str
    name: str
    team: str
    position: str
    price: float
    minutes: int
    goals: int
    assists: int
    saves: int
    recoveries: int
    yellows: int
    reds: int
    appearances: int
    team_goals_when_playing: Optional[int] = None  # filled from fixtures if available


def fetch_players(matchday: int, n: int = 1, timeout: int = 20) -> List[RawPlayer]:
    r = requests.get(FEED_URL.format(md=matchday, n=n), timeout=timeout, headers={"User-Agent": "fplanalytic/1.0"})
    r.raise_for_status()
    return parse_players(r.json())


def _g(d: dict, *keys, default=0):
    """Tolerant getter: the feed has used several key spellings over the years."""
    for k in keys:
        if k in d and d[k] not in (None, ""):
            try:
                return type(default)(d[k]) if default is not None else d[k]
            except (TypeError, ValueError):
                continue
    return default


def parse_players(payload) -> List[RawPlayer]:
    # The feed has been either {"data": {"value": {"playerList": [...]}}} or a bare list.
    items = payload
    if isinstance(payload, dict):
        items = payload.get("data", payload)
        if isinstance(items, dict):
            items = items.get("value", items)
        if isinstance(items, dict):
            items = items.get("playerList") or items.get("players") or []
    out: List[RawPlayer] = []
    for p in items:
        pos = POS_MAP.get(_g(p, "skill", "position", "pos", default=""), None) or POS_MAP.get(str(_g(p, "skill", default="")), "MID")
        out.append(
            RawPlayer(
                player_id=str(_g(p, "id", "pId", "playerId", default="")),
                name=_g(p, "pDName", "pFName", "name", "webName", default=""),
                team=canonical(_g(p, "tName", "teamName", "cCode", "team", default="")),
                position=pos,
                price=float(_g(p, "value", "price", default=0.0)),
                minutes=int(_g(p, "minsPlyd", "minutesPlayed", "mins", default=0)),
                goals=int(_g(p, "gS", "goalsScored", "goals", default=0)),
                assists=int(_g(p, "assist", "assists", default=0)),
                saves=int(_g(p, "gkS", "saves", default=0)),
                recoveries=int(_g(p, "bR", "ballRecoveries", "recoveries", default=0)),
                yellows=int(_g(p, "yC", "yellowCards", default=0)),
                reds=int(_g(p, "rC", "redCards", default=0)),
                appearances=int(_g(p, "mOM", "apps", "appearances", default=0)) or 0,
            )
        )
    return out


def build_profiles(
    raw: List[RawPlayer],
    team_goals: Dict[str, int],
    domestic_shares: Optional[Dict[str, Dict[str, float]]] = None,
    matchdays_played: int = 1,
    shrink_matches: float = 4.0,
) -> List[PlayerProfile]:
    """
    Turn raw feed stats into PlayerProfiles for the xPts model.

    goal_share / assist_share: player's share of his team's goals, blended
        between UCL-to-date (noisy early) and domestic-league shares
        (`domestic_shares[player_id] = {"goal_share":..,"assist_share":..}`,
        e.g. from the FPL API for Premier League players, FBref/Understat for
        others). The blend weight moves toward UCL data as matchdays accumulate.
    p_start: crude rotation proxy from minutes per matchday; REPLACE with the
        rotation model in TASKS.md (lineup history + fixture congestion) — this
        is the biggest single source of error in UCL fantasy predictions.
    """
    domestic_shares = domestic_shares or {}
    w_ucl = matchdays_played / (matchdays_played + shrink_matches)
    profiles: List[PlayerProfile] = []
    for p in raw:
        tg = max(team_goals.get(p.team, 0), 1)
        ucl_gs = p.goals / tg
        ucl_as = p.assists / tg
        dom = domestic_shares.get(p.player_id, {})
        gs = w_ucl * ucl_gs + (1 - w_ucl) * dom.get("goal_share", ucl_gs)
        as_ = w_ucl * ucl_as + (1 - w_ucl) * dom.get("assist_share", ucl_as)
        mins_per_md = p.minutes / max(matchdays_played, 1)
        p_start = float(min(max(mins_per_md / 80.0, 0.05), 0.97))
        per90 = 90.0 / max(p.minutes, 90)
        profiles.append(
            PlayerProfile(
                player_id=p.player_id, name=p.name, team=p.team, position=p.position, price=p.price,
                goal_share=float(min(gs, 0.9)), assist_share=float(min(as_, 0.9)), p_start=p_start,
                saves_per_90=p.saves * per90 if p.position == "GK" else 0.0,
                recoveries_per_90=p.recoveries * per90,
                yellow_per_90=max(p.yellows * per90, 0.05),
                red_per_90=max(p.reds * per90, 0.003),
            )
        )
    return profiles
