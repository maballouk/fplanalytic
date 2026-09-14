"""
Domestic-league goal/assist shares (TASKS.md 1.5.2).

The single biggest early-season bias in the UCL xPts model: with only 1-2 UCL
matchdays, star attackers who have not scored YET get shrunk toward "average
forward" while a centre-back who scored on MD1 keeps an inflated share. The
fix is the player's real scoring record in his domestic league:

  goal_share   = domestic goals   / team's domestic goals
  assist_share = domestic assists / team's domestic goals

Sources (both fail-soft — a missing source just means fewer overrides):
  * FPL API (no key): full per-player goals/assists for every Premier League
    club, so PL clubs get complete coverage.
  * football-data.org (FOOTBALL_DATA_TOKEN, free tier): the scorers list +
    standings (for team goals) of the other big leagues. Scorers only covers
    players who have scored — exactly the attackers the bias hurts.

Matching to the UEFA feed is by (canonical team, accent-stripped surname);
an ambiguous surname within one club is dropped rather than guessed.
"""

from __future__ import annotations

import os
import time
import unicodedata
from typing import Dict, List, Optional

import requests

from .teams import canonical
from .uefa_fantasy import RawPlayer

FPL_BOOTSTRAP = "https://fantasy.premierleague.com/api/bootstrap-static/"
FD_BASE = "https://api.football-data.org/v4"
# Big-league competition codes on football-data.org's free tier
FD_COMPETITIONS = ["PD", "BL1", "SA", "FL1", "DED", "PPL"]
# Free tier allows 10 requests/minute; 2 requests per competition
FD_PAUSE_SECONDS = 7.0
HEADERS = {"User-Agent": "fplanalytic/1.0 (ucl engine)"}


def _norm(s: str) -> str:
    """Lowercase and strip accents so 'Guéhi' matches 'Guehi'."""
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)).lower().strip()


def _surname(name: str) -> str:
    parts = _norm(name).replace(".", " ").split()
    return parts[-1] if parts else ""


def _initial(name: str) -> str:
    parts = _norm(name).replace(".", " ").split()
    return parts[0][0] if parts and parts[0] else ""


# Early-season domestic samples are noisy too (a team that has scored once
# makes its lone assister a "100% share" player). Pretend every team has
# scored at least this many, and cap the resulting shares.
MIN_TEAM_GOALS = 6
GOAL_SHARE_CAP = 0.55
ASSIST_SHARE_CAP = 0.45


def _entry(goals: int, assists: int, team_goals: int, initial: str) -> Dict[str, float]:
    tg = max(team_goals, MIN_TEAM_GOALS)
    return {
        "goal_share": min(goals / tg, GOAL_SHARE_CAP),
        "assist_share": min(assists / tg, ASSIST_SHARE_CAP),
        "initial": initial,
    }


def fetch_fpl_shares(timeout: int = 30) -> Dict[tuple, Dict[str, float]]:
    """(canonical team, surname) -> shares for every Premier League player."""
    r = requests.get(FPL_BOOTSTRAP, timeout=timeout, headers=HEADERS)
    r.raise_for_status()
    data = r.json()
    team_name = {t["id"]: canonical(t["name"]) for t in data["teams"]}
    # Rotation signal (1.5.3): a player's share of possible starts. Every PL
    # club has played the same number of finished gameweeks, near enough.
    played = max(sum(1 for ev in data.get("events", []) if ev.get("finished")), 1)
    team_goals: Dict[str, int] = {}
    for e in data["elements"]:
        team_goals[team_name[e["team"]]] = team_goals.get(team_name[e["team"]], 0) + e["goals_scored"]
    out: Dict[tuple, Dict[str, float]] = {}
    seen_twice = set()
    for e in data["elements"]:
        if e.get("element_type") == 1:
            continue  # goalkeepers never take attacking shares
        team = team_name[e["team"]]
        key = (team, _surname(e["second_name"] or e["web_name"]))
        if key in out:
            seen_twice.add(key)  # two same-surname players in one club: don't guess
            continue
        entry = _entry(e["goals_scored"], e["assists"], team_goals.get(team, 0),
                       _initial(e.get("first_name") or ""))
        entry["start_share"] = min(e.get("starts", 0) / played, 1.0)
        out[key] = entry
    for key in seen_twice:
        out.pop(key, None)
    return out


def fetch_fd_shares(token: str, competitions: Optional[List[str]] = None, timeout: int = 30) -> Dict[tuple, Dict[str, float]]:
    """(canonical team, surname) -> shares from football-data.org scorers."""
    headers = dict(HEADERS, **{"X-Auth-Token": token})
    out: Dict[tuple, Dict[str, float]] = {}
    for i, comp in enumerate(competitions or FD_COMPETITIONS):
        if i:
            time.sleep(FD_PAUSE_SECONDS)  # free tier: 10 requests/minute
        try:
            st = requests.get(f"{FD_BASE}/competitions/{comp}/standings", headers=headers, timeout=timeout)
            st.raise_for_status()
            goals_for: Dict[str, int] = {}
            played_games: Dict[str, int] = {}
            for table in st.json().get("standings", []):
                for row in table.get("table", []):
                    goals_for[canonical(row["team"]["name"])] = row.get("goalsFor", 0)
                    played_games[canonical(row["team"]["name"])] = row.get("playedGames", 0)
            time.sleep(FD_PAUSE_SECONDS)
            sc = requests.get(f"{FD_BASE}/competitions/{comp}/scorers", headers=headers,
                              params={"limit": 60}, timeout=timeout)
            sc.raise_for_status()
            for row in sc.json().get("scorers", []):
                team = canonical(row["team"]["name"])
                key = (team, _surname(row["player"]["name"]))
                if key in out:
                    continue
                entry = _entry(row.get("goals") or 0, row.get("assists") or 0,
                               goals_for.get(team, 0), _initial(row["player"]["name"]))
                # playedMatches counts appearances, not starts; damp it a bit
                tp = max(played_games.get(team, 0), 1)
                pm = row.get("playedMatches")
                if isinstance(pm, int) and pm > 0:
                    entry["start_share"] = min(0.9 * pm / tp, 1.0)
                out[key] = entry
        except Exception:  # noqa: BLE001 - one broken league must not sink the rest
            continue
    return out


def collect_domestic_shares(raw: List[RawPlayer], notes: Optional[List[str]] = None) -> Dict[str, Dict[str, float]]:
    """
    Map UEFA-feed player_id -> {"goal_share", "assist_share"} wherever a
    domestic record can be matched. Fail-soft: on any source error the model
    simply keeps its position priors for those players.
    """
    shares: Dict[tuple, Dict[str, float]] = {}
    try:
        shares.update(fetch_fpl_shares())
    except Exception as exc:  # noqa: BLE001
        if notes is not None:
            notes.append(f"FPL domestic shares unavailable ({type(exc).__name__})")
    token = os.environ.get("FOOTBALL_DATA_TOKEN", "").strip()
    if token:
        fd = fetch_fd_shares(token)
        if fd:
            for k, v in fd.items():
                shares.setdefault(k, v)
        elif notes is not None:
            notes.append("football-data scorers returned nothing")
    elif notes is not None:
        notes.append("FOOTBALL_DATA_TOKEN not set; domestic shares limited to PL clubs")

    out: Dict[str, Dict[str, float]] = {}
    matched = 0
    for p in raw:
        if p.position == "GK":
            continue
        hit = shares.get((p.team, _surname(p.name)))
        if not hit:
            continue
        # Same surname, same club, different first initial = different player
        # ("J. Martínez" must not inherit "L. Martínez"'s record).
        ini_feed, ini_dom = _initial(p.name), hit.get("initial", "")
        if ini_feed and ini_dom and ini_feed != ini_dom:
            continue
        out[p.player_id] = {"goal_share": hit["goal_share"], "assist_share": hit["assist_share"]}
        if "start_share" in hit:
            out[p.player_id]["start_share"] = hit["start_share"]
        matched += 1
    if notes is not None:
        notes.append(f"domestic shares matched for {matched} players")
    return out
