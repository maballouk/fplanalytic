"""
CLI.

  # Live run (needs FOOTBALL_DATA_TOKEN in env; ClubElo needs no key):
  python -m ucl_engine.cli predict --matchday 3 --out ../public/data/ucl_md3.json

  # Offline demo with synthetic data (no network) to see the output shape:
  python -m ucl_engine.cli demo --out demo_output.json
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict
from datetime import datetime, timedelta, timezone

from .pipeline import run_matchday, write_json
from .fantasy import PlayerProfile
from .dixon_coles import Match
from .adapters.fixtures import Fixture


def _demo_data():
    """Small synthetic universe so the pipeline can be exercised offline."""
    elo = {"Real Madrid": 1990, "Manchester City": 1975, "Bayern Munich": 1940, "Inter Milan": 1900,
           "Paris Saint-Germain": 1930, "Arsenal": 1935, "Sporting CP": 1760, "Celtic": 1650,
           "Club Brugge": 1720, "Galatasaray": 1700}
    completed = [
        Match("Real Madrid", "Celtic", 4, 0, days_ago=7),
        Match("Manchester City", "Club Brugge", 3, 1, days_ago=7),
        Match("Sporting CP", "Bayern Munich", 1, 2, days_ago=7),
        Match("Galatasaray", "Inter Milan", 1, 1, days_ago=7),
        Match("Arsenal", "Paris Saint-Germain", 2, 0, days_ago=7),
    ]
    fixtures = [
        Fixture("Bayern Munich", "Real Madrid", datetime.now(timezone.utc) + timedelta(days=4), 2, "LEAGUE_STAGE"),
        Fixture("Celtic", "Manchester City", datetime.now(timezone.utc) + timedelta(days=4), 2, "LEAGUE_STAGE"),
        Fixture("Inter Milan", "Arsenal", datetime.now(timezone.utc) + timedelta(days=5), 2, "LEAGUE_STAGE"),
        Fixture("Paris Saint-Germain", "Sporting CP", datetime.now(timezone.utc) + timedelta(days=5), 2, "LEAGUE_STAGE"),
    ]
    profiles = [
        PlayerProfile("1", "Vinícius Jr", "Real Madrid", "FWD", 11.0, 0.30, 0.20, 0.92),
        PlayerProfile("2", "Harry Kane", "Bayern Munich", "FWD", 11.5, 0.40, 0.12, 0.95, pen_taker=True),
        PlayerProfile("3", "Erling Haaland", "Manchester City", "FWD", 12.0, 0.45, 0.05, 0.90),
        PlayerProfile("4", "Bukayo Saka", "Arsenal", "MID", 9.5, 0.20, 0.25, 0.88, recoveries_per_90=4.0),
        PlayerProfile("5", "Thibaut Courtois", "Real Madrid", "GK", 6.0, 0.0, 0.0, 0.97, saves_per_90=2.8),
        PlayerProfile("6", "Gabriel Magalhães", "Arsenal", "DEF", 6.5, 0.06, 0.02, 0.93, recoveries_per_90=5.5),
        PlayerProfile("7", "Alessandro Bastoni", "Inter Milan", "DEF", 6.0, 0.03, 0.06, 0.90, recoveries_per_90=6.0),
        PlayerProfile("8", "Rúben Dias", "Manchester City", "DEF", 6.0, 0.03, 0.02, 0.80, recoveries_per_90=6.5),
        PlayerProfile("9", "Ousmane Dembélé", "Paris Saint-Germain", "FWD", 10.0, 0.30, 0.20, 0.85),
        PlayerProfile("10", "Viktor Gyökeres", "Sporting CP", "FWD", 9.0, 0.45, 0.10, 0.95),
    ]
    return elo, completed, fixtures, profiles


def cmd_demo(args):
    elo, completed, fixtures, profiles = _demo_data()
    out = run_matchday(2, completed, fixtures, profiles, elo=elo, notes=["synthetic demo data"])
    if args.out:
        write_json(out, args.out)
        print(f"wrote {args.out}")
    else:
        print(json.dumps(asdict(out), indent=2, ensure_ascii=False))


def cmd_predict(args):
    from .adapters.clubelo import fetch_clubelo
    from .adapters.fixtures import fetch_ucl_matches
    from .adapters.uefa_fantasy import fetch_players, build_profiles

    elo = fetch_clubelo()
    completed, upcoming = fetch_ucl_matches()
    fixtures = [f for f in upcoming if args.matchday is None or f.matchday == args.matchday]
    raw = fetch_players(args.matchday or 1)
    team_goals = {}
    for m in completed:
        team_goals[m.home] = team_goals.get(m.home, 0) + m.home_goals
        team_goals[m.away] = team_goals.get(m.away, 0) + m.away_goals
    profiles = build_profiles(raw, team_goals, matchdays_played=max((args.matchday or 1) - 1, 0))
    out = run_matchday(args.matchday, completed, fixtures, profiles, elo=elo)
    write_json(out, args.out)
    print(f"wrote {args.out}  ({len(out.fixtures)} fixtures, {len(out.players)} players, model={out.model['type']})")


def main(argv=None):
    ap = argparse.ArgumentParser(prog="ucl_engine")
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("demo", help="offline synthetic run")
    d.add_argument("--out", default=None)
    d.set_defaults(func=cmd_demo)
    p = sub.add_parser("predict", help="live run for a matchday")
    p.add_argument("--matchday", type=int, default=None)
    p.add_argument("--out", required=True)
    p.set_defaults(func=cmd_predict)
    args = ap.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    sys.exit(main())
