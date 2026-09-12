import numpy as np
import pytest

from ucl_engine.dixon_coles import Match, fit_dixon_coles, scoreline_matrix, expected_goals, time_weight
from ucl_engine.elo import EloTable, elo_expected_goals, elo_to_strength_priors
from ucl_engine.match_model import predict_match
from ucl_engine.fantasy import PlayerProfile, expected_points, SCORING
from ucl_engine.defcon import DefconMatch, defcon_profile
from ucl_engine.adapters.teams import canonical, TEAM_ALIASES
from ucl_engine.adapters.fixtures import parse_matches
from ucl_engine.pipeline import run_matchday
from ucl_engine.adapters.fixtures import Fixture
from datetime import datetime, timezone, timedelta


# ---------------------------------------------------------------- Dixon-Coles
def _synthetic_league(seed=0, n_rounds=6):
    """Generate matches from known strengths so we can check the fit recovers them."""
    rng = np.random.default_rng(seed)
    teams = ["A", "B", "C", "D", "E", "F"]
    att = {"A": 0.5, "B": 0.3, "C": 0.1, "D": -0.1, "E": -0.3, "F": -0.5}
    dfn = {"A": -0.4, "B": -0.2, "C": 0.0, "D": 0.1, "E": 0.2, "F": 0.3}
    ha = 0.25
    matches = []
    for r in range(n_rounds):
        for h in teams:
            for a in teams:
                if h == a:
                    continue
                lh = np.exp(att[h] + dfn[a] + ha)
                la = np.exp(att[a] + dfn[h])
                matches.append(Match(h, a, int(rng.poisson(lh)), int(rng.poisson(la)), days_ago=r * 7))
    return matches, att, dfn, ha


def test_fit_recovers_ordering():
    matches, att, dfn, ha = _synthetic_league()
    p = fit_dixon_coles(matches, half_life_days=10_000)  # effectively no decay
    # Strongest attack should be A, weakest F
    order = sorted(p.attack, key=p.attack.get, reverse=True)
    assert order[0] == "A" and order[-1] == "F"
    # Best defence (most negative) should be A
    assert min(p.defence, key=p.defence.get) == "A"
    assert 0.05 < p.home_adv < 0.5
    assert -0.3 < p.rho < 0.2


def test_scoreline_matrix_is_distribution():
    m = scoreline_matrix(1.6, 1.1, -0.06)
    assert abs(m.sum() - 1.0) < 1e-9
    assert (m >= 0).all()


def test_dixon_coles_boosts_draws_vs_plain_poisson():
    plain = scoreline_matrix(1.2, 1.1, 0.0)
    dc = scoreline_matrix(1.2, 1.1, -0.08)
    assert dc[0, 0] > plain[0, 0]
    assert dc[1, 1] > plain[1, 1]


def test_time_weight_half_life():
    assert abs(time_weight(180, 180) - 0.5) < 1e-9
    assert time_weight(0, 180) == 1.0


def test_prior_shrinkage_handles_unseen_team():
    matches = [Match("A", "B", 2, 0, 3)]
    priors = {"A": (0.2, -0.2), "B": (0.0, 0.0), "Z": (0.6, -0.6)}
    p = fit_dixon_coles(matches, prior_strength=priors)
    assert "Z" in p.attack  # team with no matches still gets parameters
    assert p.attack["Z"] > p.attack["B"]


# ---------------------------------------------------------------------- Elo
def test_elo_update_direction():
    t = EloTable()
    t.ratings = {"X": 1500, "Y": 1500}
    t.update("X", "Y", 3, 0)
    assert t.get("X") > 1500 > t.get("Y")


def test_elo_expected_goals_favours_stronger_side():
    h, a = elo_expected_goals(1900, 1600)
    assert h > a
    h2, a2 = elo_expected_goals(1600, 1900, neutral=True)
    assert a2 > h2
    assert 2.0 < h + a < 4.5


def test_elo_priors_symmetric():
    pr = elo_to_strength_priors({"S": 1900, "W": 1500})
    assert pr["S"][0] > 0 > pr["W"][0]
    assert abs(pr["S"][0] + pr["S"][1]) < 1e-12


# ----------------------------------------------------------------- Match model
def test_predict_match_probabilities_consistent():
    matches, *_ = _synthetic_league()
    p = fit_dixon_coles(matches)
    pred = predict_match("A", "F", params=p)
    assert abs(pred.p_home + pred.p_draw + pred.p_away - 1.0) < 1e-6
    assert pred.p_home > pred.p_away
    assert 0 < pred.p_cs_home < 1 and 0 < pred.p_cs_away < 1
    assert pred.source == "dixon_coles"


def test_predict_match_elo_fallback():
    pred = predict_match("Q", "R", params=None, elo={"Q": 1800, "R": 1600})
    assert pred.source == "elo_fallback"
    assert pred.p_home > pred.p_away


# ------------------------------------------------------------------- Fantasy
def _pred():
    return predict_match("H", "A", elo={"H": 1850, "A": 1650})


def test_defender_cs_points_scale_with_cs_probability():
    pred = _pred()
    d_home = PlayerProfile("1", "DefH", "H", "DEF", 6.0, 0.02, 0.02, 0.95)
    d_away = PlayerProfile("2", "DefA", "A", "DEF", 6.0, 0.02, 0.02, 0.95)
    xh = expected_points(d_home, pred)
    xa = expected_points(d_away, pred)
    assert xh.breakdown["clean_sheet"] > xa.breakdown["clean_sheet"]
    assert xh.xpts > xa.xpts


def test_forward_goal_points_use_position_weight():
    pred = _pred()
    fwd = PlayerProfile("3", "F", "H", "FWD", 10.0, 0.4, 0.1, 1.0, p_60plus_given_start=1.0)
    mid = PlayerProfile("4", "M", "H", "MID", 10.0, 0.4, 0.1, 1.0, p_60plus_given_start=1.0)
    xf = expected_points(fwd, pred)
    xm = expected_points(mid, pred)
    assert xm.breakdown["goals"] / xf.breakdown["goals"] == pytest.approx(SCORING["goal"]["MID"] / SCORING["goal"]["FWD"], rel=1e-6)


def test_rotation_risk_reduces_xpts():
    pred = _pred()
    starter = PlayerProfile("5", "S", "H", "MID", 8.0, 0.2, 0.2, 0.95)
    rotated = PlayerProfile("6", "R", "H", "MID", 8.0, 0.2, 0.2, 0.40)
    assert expected_points(starter, pred).xpts > expected_points(rotated, pred).xpts


def test_gk_gets_saves_others_dont():
    pred = _pred()
    gk = PlayerProfile("7", "G", "A", "GK", 5.0, 0, 0, 0.98, saves_per_90=3.0)
    df = PlayerProfile("8", "D", "A", "DEF", 5.0, 0, 0, 0.98, saves_per_90=3.0)
    assert expected_points(gk, pred).breakdown["saves"] > 0
    assert expected_points(df, pred).breakdown["saves"] == 0


# -------------------------------------------------------------------- DEFCON
def test_defcon_defender_threshold_10_and_near_miss():
    hist = [DefconMatch(90, a) for a in [10, 12, 9, 8, 11, 9]]
    p = defcon_profile("1", "Def", "T", "DEF", 5.0, hist)
    assert p.matches_considered == 6
    assert p.hit_rate == pytest.approx(0.6 * (2 / 5) + 0.4 * (3 / 6))  # last5=[12,9,8,11,9] -> 2/5; season 3/6
    assert p.near_miss_rate == pytest.approx(3 / 6)  # 9,8,9 within 2 below 10
    assert p.defcon_xpts == pytest.approx(p.hit_rate * 2)


def test_defcon_midfielder_counts_recoveries_threshold_12():
    hist = [DefconMatch(90, cbit=7, recoveries=5), DefconMatch(90, cbit=6, recoveries=4)]
    p = defcon_profile("2", "Mid", "T", "MID", 6.0, hist)
    assert p.hit_rate == pytest.approx(0.5)


def test_defcon_ignores_short_cameos_and_gk():
    hist = [DefconMatch(20, 11), DefconMatch(90, 11)]
    p = defcon_profile("3", "Def", "T", "DEF", 5.0, hist)
    assert p.matches_considered == 1
    assert defcon_profile("4", "GK", "T", "GK", 5.0, hist) is None


# ------------------------------------------------------------------- Adapters
def test_canonical_names():
    assert canonical("Man City") == "Manchester City"
    assert canonical("FC Bayern München") == "Bayern Munich"
    assert canonical("Paris SG") == "Paris Saint-Germain"
    assert canonical("Unknown Club XI") == "Unknown Club XI"


def test_no_alias_maps_to_two_canonicals():
    # every canonical should itself resolve to itself (no alias == canonical mis-mapping)
    for canon in set(TEAM_ALIASES.values()):
        assert canonical(canon) == canon


def test_parse_football_data_payload():
    now = datetime(2026, 9, 12, tzinfo=timezone.utc)
    payload = {"matches": [
        {"utcDate": "2026-09-09T19:00:00Z", "status": "FINISHED", "stage": "LEAGUE_STAGE", "matchday": 1,
         "homeTeam": {"name": "Real Madrid CF", "shortName": "Real Madrid"}, "awayTeam": {"name": "Celtic FC", "shortName": "Celtic"},
         "score": {"fullTime": {"home": 3, "away": 0}}},
        {"utcDate": "2026-09-30T19:00:00Z", "status": "TIMED", "stage": "LEAGUE_STAGE", "matchday": 2,
         "homeTeam": {"name": "FC Bayern München", "shortName": "Bayern"}, "awayTeam": {"name": "Inter", "shortName": "Inter"},
         "score": {"fullTime": {"home": None, "away": None}}},
    ]}
    done, up = parse_matches(payload, now=now)
    assert len(done) == 1 and done[0].home == "Real Madrid" and done[0].home_goals == 3
    assert abs(done[0].days_ago - 2.21) < 0.05  # 12 Sep 00:00 - 9 Sep 19:00
    assert len(up) == 1 and up[0].home == "Bayern Munich" and up[0].away == "Inter Milan"


# ------------------------------------------------------------------ Pipeline
def test_pipeline_end_to_end_json_shape():
    elo = {"A": 1900, "B": 1700}
    completed = [Match("A", "B", 2, 1, 7)]
    fixtures = [Fixture("B", "A", datetime.now(timezone.utc) + timedelta(days=3), 2, "LEAGUE_STAGE")]
    profiles = [PlayerProfile("1", "P", "A", "FWD", 10.0, 0.4, 0.1, 0.9),
                PlayerProfile("2", "Q", "B", "DEF", 5.0, 0.02, 0.02, 0.9)]
    out = run_matchday(2, completed, fixtures, profiles, elo=elo)
    assert out.matchday == 2
    assert len(out.fixtures) == 1 and len(out.players) == 2
    assert out.players[0]["xpts"] >= out.players[1]["xpts"]
    assert "xpts_per_million" in out.players[0]
    assert out.model["type"].startswith("dixon_coles")

# ------------------------------------------------- early-season regularisation
def test_one_round_fit_without_priors_stays_sane():
    """
    2026-09-12 regression: with one match per team and NO Elo priors, the fit
    used to leave team strengths unshrunk (a 6-0 winner got explosive attack)
    and home advantage ran to its -1 bound, producing 0.6-6.7 xG fixtures and
    "most likely 0-6" scorelines. Flat shrinkage + home-adv regularisation must
    keep expected goals within football reality.
    """
    matches = [
        Match("A", "B", 6, 0, days_ago=3),
        Match("C", "D", 0, 3, days_ago=3),
        Match("E", "F", 1, 1, days_ago=3),
    ]
    params = fit_dixon_coles(matches)
    assert 0.0 < params.home_adv < 0.6  # near the 0.25 literature value
    lam_h, lam_a = expected_goals(params, "B", "A")  # loser hosts winner
    assert 0.3 < lam_h < 3.5
    assert 0.3 < lam_a < 3.5
