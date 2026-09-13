"""
UEFA Champions League Fantasy adapter (UNOFFICIAL endpoint).

The official game front-end (gaming.uefa.com/en/uclfantasy) loads player data
from a JSON feed. It is not a documented public API and can change without
notice, which is exactly why it lives behind this adapter. If the shape
changes, fix `parse_players()` here and nothing else in the engine moves.

Known feed (verified 2026-09-12 for the 2026/27 season in the browser network
tab; re-verify each season):

    https://gaming.uefa.com/en/uclfantasy/services/feeds/players/players_{TOUR}_en_{MATCHDAY}.json

where TOUR is a per-season internal id (90 for 2026/27; override with the
UCL_TOUR_ID env var when a new season starts) and MATCHDAY is 1..17. Shape:
{"data": {"value": {"playerList": [...]}}} with per-player id, pDName, tName,
skill (1=GK..4=FWD), value (price), minsPlyd, gS, assist, saves, bR, yC, rC, mOM.

The endpoint sits behind a TLS-fingerprinting WAF that times out plain Python
clients, so we fetch with curl_cffi's Chrome impersonation (falling back to
requests if curl_cffi is missing). A local file can stand in for the feed via
fetch_players(path=...) / the CLI's --players-file for manual runs.

Respect UEFA's terms of use: fetch once per matchday, cache the result, never
hammer the endpoint, and do not redistribute the raw feed.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Dict, List, Optional

import requests

from ..fantasy import PlayerProfile
from .teams import canonical

FEED_URL = "https://gaming.uefa.com/en/uclfantasy/services/feeds/players/players_{tour}_en_{md}.json"
DEFAULT_TOUR_ID = "90"  # 2026/27 league phase; changes each season
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
    mom: int = 0                   # man-of-the-match awards to date (feed mOM)
    sel_per: float = 0.0           # % of all managers holding him (feed selPer)
    transfers_in: int = 0
    transfers_out: int = 0
    status: str = ""               # feed pStatus: I injured, S suspended, D doubtful, NIS not in squad
    trained: str = ""              # e.g. "Unlikely to start next game"
    team_goals_when_playing: Optional[int] = None  # filled from fixtures if available


def fetch_players(matchday: int, timeout: int = 30, path: Optional[str] = None) -> List[RawPlayer]:
    """Fetch the player feed for a matchday, or parse a local copy via `path`."""
    if path:
        with open(path, encoding="utf-8") as f:
            return parse_players(json.load(f))
    tour = os.environ.get("UCL_TOUR_ID", DEFAULT_TOUR_ID)
    url = FEED_URL.format(tour=tour, md=matchday)
    try:
        from curl_cffi import requests as curl_requests

        r = curl_requests.get(url, impersonate="chrome", timeout=timeout)
    except ImportError:
        r = requests.get(url, timeout=timeout, headers={"User-Agent": "fplanalytic/1.0"})
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
                appearances=int(_g(p, "apps", "appearances", default=0)) or 0,
                mom=int(_g(p, "mOM", default=0)),
                sel_per=float(_g(p, "selPer", default=0.0)),
                transfers_in=int(_g(p, "mTransferIn", default=0)),
                transfers_out=int(_g(p, "mTransferOut", default=0)),
                status=str(_g(p, "pStatus", default="") or ""),
                trained=str(_g(p, "trained", default="") or ""),
            )
        )
    return out


# Every per-90 rate estimated from a couple of matches is shrunk toward the
# league mean for the position with this many virtual 90s. Same lesson as the
# FPL hit rate, DC strengths, rho and home_adv: regularise everything fitted
# from a handful of matches (TASKS.md decisions log).
SHRINK_90S = 3.0

# Caps on goal/assist shares while a player has NO domestic-league data. A
# centre-back who scored his team's only MD1 goal is not a 22%-share scorer;
# defender goals are worth 6 pts, so this noise decided the captain list.
SHARE_CAP = {
    "GK": (0.02, 0.03),
    "DEF": (0.10, 0.10),
    "MID": (0.35, 0.35),
    "FWD": (0.50, 0.35),
}

# Availability from the feed (pStatus + trained text): the first cut of the
# rotation model. Multiplies the minutes-based start probability.
STATUS_FACTOR = {"I": 0.05, "S": 0.0, "NIS": 0.05, "D": 0.5}


def _position_mean_per90(raw: List[RawPlayer], attr: str) -> Dict[str, float]:
    """League mean of a per-90 rate per position, from players with 60+ minutes."""
    totals: Dict[str, List[float]] = {}
    for p in raw:
        if p.minutes >= 60:
            totals.setdefault(p.position, []).append(getattr(p, attr) * 90.0 / p.minutes)
    return {pos: (sum(v) / len(v) if v else 0.0) for pos, v in totals.items()}


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
        from the FPL API for Premier League players and football-data.org
        scorers for the other big leagues — adapters/domestic.py). The blend
        weight moves toward UCL data as matchdays accumulate. Without domestic
        data the fallback is a position prior, and the result is capped
        (SHARE_CAP) so one lucky matchday cannot make a centre-back the top
        projected scorer.
    Per-90 volume rates (recoveries, saves, cards) are shrunk toward the
        league mean for the position with SHRINK_90S virtual 90s — computed
        from the feed itself, not hardcoded.
    p_start: minutes-based proxy times an availability factor from the feed's
        own flags (injured/suspended/doubtful/not-in-squad, "unlikely to
        start"). Still v0.5 — the full rotation model is TASKS.md 1.5.3.
    """
    domestic_shares = domestic_shares or {}
    w_ucl = matchdays_played / (matchdays_played + shrink_matches)
    position_prior = {
        "GK": (0.0, 0.01),
        "DEF": (0.03, 0.04),
        "MID": (0.10, 0.12),
        "FWD": (0.22, 0.12),
    }
    rec_mean = _position_mean_per90(raw, "recoveries")
    save_mean = _position_mean_per90(raw, "saves")
    yel_mean = _position_mean_per90(raw, "yellows")

    def shrunk(total: float, minutes: int, prior: float) -> float:
        n90 = minutes / 90.0
        return (total + prior * SHRINK_90S) / (n90 + SHRINK_90S)

    profiles: List[PlayerProfile] = []
    for p in raw:
        tg = max(team_goals.get(p.team, 0), 1)
        ucl_gs = p.goals / tg
        ucl_as = p.assists / tg
        prior_gs, prior_as = position_prior.get(p.position, (0.08, 0.08))
        dom = domestic_shares.get(p.player_id, {})
        gs = w_ucl * ucl_gs + (1 - w_ucl) * dom.get("goal_share", prior_gs)
        as_ = w_ucl * ucl_as + (1 - w_ucl) * dom.get("assist_share", prior_as)
        cap_gs, cap_as = SHARE_CAP.get(p.position, (0.5, 0.35))
        if "goal_share" not in dom:
            gs = min(gs, cap_gs)
        if "assist_share" not in dom:
            as_ = min(as_, cap_as)

        mins_per_md = p.minutes / max(matchdays_played, 1)
        p_start = float(min(max(mins_per_md / 80.0, 0.05), 0.97))
        factor = STATUS_FACTOR.get(p.status)
        if factor is not None:
            p_start *= factor
        elif "unlikely" in p.trained.lower():
            p_start *= 0.4

        md = max(matchdays_played, 1)
        p_potm = min((p.mom + 0.02 * 4.0) / (md + 4.0), 0.35)

        profiles.append(
            PlayerProfile(
                player_id=p.player_id, name=p.name, team=p.team, position=p.position, price=p.price,
                goal_share=float(min(gs, 0.9)), assist_share=float(min(as_, 0.9)), p_start=p_start,
                saves_per_90=shrunk(p.saves, p.minutes, save_mean.get("GK", 3.0)) if p.position == "GK" else 0.0,
                recoveries_per_90=shrunk(p.recoveries, p.minutes, rec_mean.get(p.position, 4.0)),
                yellow_per_90=max(shrunk(p.yellows, p.minutes, yel_mean.get(p.position, 0.12)), 0.05),
                red_per_90=max(shrunk(p.reds, p.minutes, 0.004), 0.003),
                p_potm=p_potm,
                sel_per=p.sel_per,
                transfer_balance=p.transfers_in - p.transfers_out,
            )
        )
    return profiles
