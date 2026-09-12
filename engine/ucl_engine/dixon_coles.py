"""
Dixon-Coles time-weighted Poisson model.

WHY THIS MODEL
--------------
Plain Poisson treats home and away goals as independent, which systematically
under-counts low-scoring draws (0-0, 1-1). Dixon & Coles (1997) add a single
dependence parameter `rho` that corrects exactly those four scorelines while
leaving the marginal distributions Poisson-shaped. We also add exponential
time-decay so recent matches count more than old ones (form, injuries,
managerial changes). This is the transparent, auditable baseline used by most
serious public football models and it is competitive with bookmaker accuracy.

WHAT IT PRODUCES
----------------
For every team: an attack strength and a defence strength (log-scale), plus a
shared home-advantage term and rho. From those, `predict()` returns expected
goals for both sides and a full scoreline probability matrix, from which the
caller derives 1X2 odds, clean-sheet probabilities, etc. (see match_model.py).

COLD START
----------
Early in a UCL season a team may have 0-2 UCL matches. The fitter therefore
accepts an optional `prior_strength` dict (e.g. derived from Elo ratings, see
elo.py) and shrinks each team's parameters toward that prior. The prior weight
fades automatically as real matches accumulate.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
from scipy.optimize import minimize
from scipy.stats import poisson


@dataclass
class Match:
    """One completed fixture. `days_ago` drives the time-decay weight."""

    home: str
    away: str
    home_goals: int
    away_goals: int
    days_ago: float = 0.0
    # Optional: use xG instead of actual goals for a less noisy signal.
    # If provided, the fitter uses these as the observed values (they are
    # rounded to the nearest int for the Poisson likelihood).
    home_xg: Optional[float] = None
    away_xg: Optional[float] = None


@dataclass
class DixonColesParams:
    attack: Dict[str, float]
    defence: Dict[str, float]
    home_adv: float
    rho: float
    teams: List[str] = field(default_factory=list)
    log_likelihood: float = 0.0
    n_matches: int = 0


def _rho_correction(hg: int, ag: int, lam_h: float, lam_a: float, rho: float) -> float:
    """Dixon-Coles adjustment factor tau for the four low-scoring cells."""
    if hg == 0 and ag == 0:
        return 1.0 - lam_h * lam_a * rho
    if hg == 0 and ag == 1:
        return 1.0 + lam_h * rho
    if hg == 1 and ag == 0:
        return 1.0 + lam_a * rho
    if hg == 1 and ag == 1:
        return 1.0 - rho
    return 1.0


def time_weight(days_ago: float, half_life_days: float = 180.0) -> float:
    """Exponential decay: a match `half_life_days` old counts half as much."""
    if half_life_days <= 0:
        return 1.0
    xi = np.log(2.0) / half_life_days
    return float(np.exp(-xi * max(days_ago, 0.0)))


def fit_dixon_coles(
    matches: Iterable[Match],
    half_life_days: float = 180.0,
    prior_strength: Optional[Dict[str, Tuple[float, float]]] = None,
    prior_weight: float = 2.0,
    use_xg: bool = False,
    rho_shrink: float = 20.0,
) -> DixonColesParams:
    """
    Fit attack/defence strengths, home advantage and rho by maximum likelihood.

    prior_strength: {team: (attack_prior, defence_prior)} on the log scale.
                    Typically produced by elo.elo_to_strength_priors().
    prior_weight:   how many "virtual matches" the prior is worth. With 0 real
                    matches the team sits on its prior; after ~5-8 matches the
                    data dominates. 2.0 is a sensible default for the UCL.
    rho_shrink:     strength of the pull of rho toward -0.06. 20 means it takes
                    dozens of matches for the data to move rho far from the
                    literature value, which is the right behaviour for a
                    36-team competition with only 8 league-phase rounds.
    """
    matches = list(matches)
    if not matches:
        raise ValueError("No matches supplied to fit_dixon_coles")

    teams = sorted({m.home for m in matches} | {m.away for m in matches})
    if prior_strength:
        teams = sorted(set(teams) | set(prior_strength.keys()))
    idx = {t: i for i, t in enumerate(teams)}
    n = len(teams)

    # Observed goals (or rounded xG) and per-match time weights
    hg = np.array(
        [int(round(m.home_xg)) if (use_xg and m.home_xg is not None) else m.home_goals for m in matches]
    )
    ag = np.array(
        [int(round(m.away_xg)) if (use_xg and m.away_xg is not None) else m.away_goals for m in matches]
    )
    hi = np.array([idx[m.home] for m in matches])
    ai = np.array([idx[m.away] for m in matches])
    w = np.array([time_weight(m.days_ago, half_life_days) for m in matches])

    # Parameter vector: [attack(n), defence(n), home_adv, rho]
    def unpack(theta):
        att = theta[:n]
        dfn = theta[n : 2 * n]
        return att, dfn, theta[2 * n], theta[2 * n + 1]

    prior_att = np.zeros(n)
    prior_def = np.zeros(n)
    if prior_strength:
        for t, (a, d) in prior_strength.items():
            prior_att[idx[t]] = a
            prior_def[idx[t]] = d

    def neg_log_lik(theta):
        att, dfn, home_adv, rho = unpack(theta)
        lam_h = np.exp(att[hi] + dfn[ai] + home_adv)
        lam_a = np.exp(att[ai] + dfn[hi])
        ll = (
            poisson.logpmf(hg, lam_h)
            + poisson.logpmf(ag, lam_a)
            + np.log(
                np.clip(
                    np.array([_rho_correction(h, a, lh, la, rho) for h, a, lh, la in zip(hg, ag, lam_h, lam_a)]),
                    1e-9,
                    None,
                )
            )
        )
        total = -np.sum(w * ll)
        # Gaussian shrinkage toward the prior (acts like `prior_weight` virtual matches)
        if prior_strength:
            total += 0.5 * prior_weight * (np.sum((att - prior_att) ** 2) + np.sum((dfn - prior_def) ** 2))
        # Identifiability: mean attack = 0 (soft constraint)
        total += 100.0 * np.mean(att) ** 2
        # Regularise rho toward the literature value (~ -0.06 for top European
        # football). With few matches rho is poorly identified and will otherwise
        # run to its bound and force every prediction toward 1-1.
        total += 0.5 * rho_shrink * (rho + 0.06) ** 2
        return total

    theta0 = np.concatenate([prior_att, prior_def, [0.25], [-0.05]])
    bounds = [(-3, 3)] * (2 * n) + [(-1, 1), (-0.2, 0.1)]
    res = minimize(neg_log_lik, theta0, method="L-BFGS-B", bounds=bounds, options={"maxiter": 500})

    att, dfn, home_adv, rho = unpack(res.x)
    return DixonColesParams(
        attack={t: float(att[idx[t]]) for t in teams},
        defence={t: float(dfn[idx[t]]) for t in teams},
        home_adv=float(home_adv),
        rho=float(rho),
        teams=teams,
        log_likelihood=float(-res.fun),
        n_matches=len(matches),
    )


def expected_goals(params: DixonColesParams, home: str, away: str, neutral: bool = False) -> Tuple[float, float]:
    """Expected goals (lambda) for home and away sides. `neutral` drops home advantage (finals)."""
    ha = 0.0 if neutral else params.home_adv
    lam_h = float(np.exp(params.attack[home] + params.defence[away] + ha))
    lam_a = float(np.exp(params.attack[away] + params.defence[home]))
    return lam_h, lam_a


def scoreline_matrix(lam_h: float, lam_a: float, rho: float, max_goals: int = 8) -> np.ndarray:
    """P(home=i, away=j) for i,j in 0..max_goals, with the Dixon-Coles correction applied."""
    ph = poisson.pmf(np.arange(max_goals + 1), lam_h)
    pa = poisson.pmf(np.arange(max_goals + 1), lam_a)
    m = np.outer(ph, pa)
    for i in range(2):
        for j in range(2):
            m[i, j] *= _rho_correction(i, j, lam_h, lam_a, rho)
    return m / m.sum()  # renormalise (truncation + correction)
