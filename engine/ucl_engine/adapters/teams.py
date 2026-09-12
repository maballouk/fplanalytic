"""
Team-name canonicalisation.

Every data source spells clubs differently. All adapters call `canonical()` so
the rest of the engine only ever sees one name per club. Extend TEAM_ALIASES as
new spellings appear; the tests assert there are no duplicate canonical keys.
"""

from __future__ import annotations

import re
from typing import Dict

# alias (lowercased, stripped) -> canonical
TEAM_ALIASES: Dict[str, str] = {
    # England
    "man city": "Manchester City", "manchester city fc": "Manchester City",
    "man united": "Manchester United", "manchester utd": "Manchester United", "manchester united fc": "Manchester United",
    "liverpool fc": "Liverpool", "arsenal fc": "Arsenal", "chelsea fc": "Chelsea",
    "tottenham": "Tottenham Hotspur", "spurs": "Tottenham Hotspur", "tottenham hotspur fc": "Tottenham Hotspur",
    "newcastle": "Newcastle United", "newcastle utd": "Newcastle United", "newcastle united fc": "Newcastle United",
    "aston villa fc": "Aston Villa",
    # Spain
    "real madrid cf": "Real Madrid", "fc barcelona": "Barcelona", "barcelona fc": "Barcelona",
    "atletico": "Atlético Madrid", "atletico madrid": "Atlético Madrid", "club atletico de madrid": "Atlético Madrid",
    "athletic bilbao": "Athletic Club", "athletic club bilbao": "Athletic Club",
    "villarreal cf": "Villarreal",
    # Germany
    "bayern": "Bayern Munich", "fc bayern munchen": "Bayern Munich", "bayern munchen": "Bayern Munich", "fc bayern münchen": "Bayern Munich",
    "dortmund": "Borussia Dortmund", "bvb": "Borussia Dortmund",
    "leverkusen": "Bayer Leverkusen", "bayer 04 leverkusen": "Bayer Leverkusen",
    "rb leipzig": "RB Leipzig", "leipzig": "RB Leipzig",
    "frankfurt": "Eintracht Frankfurt", "eintracht frankfurt": "Eintracht Frankfurt",
    "stuttgart": "VfB Stuttgart", "vfb stuttgart": "VfB Stuttgart",
    # Italy
    "inter": "Inter Milan", "inter milan": "Inter Milan", "fc internazionale milano": "Inter Milan", "internazionale": "Inter Milan",
    "milan": "AC Milan", "ac milan": "AC Milan",
    "juventus fc": "Juventus", "napoli": "Napoli", "ssc napoli": "Napoli",
    "atalanta bc": "Atalanta", "atalanta": "Atalanta",
    # France
    "psg": "Paris Saint-Germain", "paris sg": "Paris Saint-Germain", "paris saint germain": "Paris Saint-Germain", "paris saint-germain fc": "Paris Saint-Germain",
    "marseille": "Marseille", "olympique de marseille": "Marseille", "olympique marseille": "Marseille",
    "monaco": "Monaco", "as monaco": "Monaco", "as monaco fc": "Monaco",
    "lille": "Lille", "losc lille": "Lille", "losc": "Lille",
    # Portugal / Netherlands / others
    "sporting cp": "Sporting CP", "sporting lisbon": "Sporting CP", "sporting": "Sporting CP",
    "benfica": "Benfica", "sl benfica": "Benfica",
    "porto": "Porto", "fc porto": "Porto",
    "psv": "PSV Eindhoven", "psv eindhoven": "PSV Eindhoven",
    "ajax": "Ajax", "afc ajax": "Ajax", "feyenoord": "Feyenoord",
    "club brugge": "Club Brugge", "club brugge kv": "Club Brugge", "brugge": "Club Brugge",
    "galatasaray": "Galatasaray", "galatasaray sk": "Galatasaray",
    "celtic": "Celtic", "celtic fc": "Celtic",
    "olympiacos": "Olympiacos", "olympiakos": "Olympiacos", "olympiacos piraeus": "Olympiacos",
    "slavia praha": "Slavia Prague", "slavia prague": "Slavia Prague", "sk slavia praha": "Slavia Prague",
    "bodo/glimt": "Bodø/Glimt", "bodo glimt": "Bodø/Glimt", "bodø/glimt": "Bodø/Glimt",
    "copenhagen": "Copenhagen", "fc copenhagen": "Copenhagen", "fc kobenhavn": "Copenhagen",
    "union sg": "Union Saint-Gilloise", "union saint-gilloise": "Union Saint-Gilloise", "royale union saint-gilloise": "Union Saint-Gilloise",
    "qarabag": "Qarabağ", "qarabag fk": "Qarabağ", "qarabağ": "Qarabağ",
    "kairat": "Kairat Almaty", "kairat almaty": "Kairat Almaty",
    "pafos": "Pafos", "pafos fc": "Pafos",
    # 2026/27 league phase: UEFA fantasy feed vs football-data shortName spellings
    # (mismatches found on the 2026-09-12 live run; both sides converge here)
    "pae aek": "AEK Athens", "aek athens": "AEK Athens", "aek": "AEK Athens",
    "b dortmund": "Borussia Dortmund",
    "barcelona": "Barcelona", "barça": "Barcelona", "barca": "Barcelona",
    "bayern münchen": "Bayern Munich",
    "como 1907": "Como", "como": "Como",
    "rc lens": "Lens", "lens": "Lens",
    "man utd": "Manchester United",
    "paris": "Paris Saint-Germain",
    "s bratislava": "Slovan Bratislava", "sl bratislava": "Slovan Bratislava",
    "slovan bratislava": "Slovan Bratislava",
    "sabah": "Sabah FK", "sabah fk": "Sabah FK",
    "shakhtar": "Shakhtar Donetsk", "shaktar": "Shakhtar Donetsk",
    "shakhtar donetsk": "Shakhtar Donetsk", "fc shakhtar donetsk": "Shakhtar Donetsk",
}


def _norm(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[.\u2019']", "", s)
    s = re.sub(r"\s+", " ", s)
    return s


def canonical(name: str) -> str:
    """Map any known spelling to the canonical club name; unknown names pass through unchanged."""
    if not name:
        return name
    n = _norm(name)
    if n in TEAM_ALIASES:
        return TEAM_ALIASES[n]
    # Try again without common suffixes
    for suffix in (" fc", " cf", " sc", " bc", " sk", " kv"):
        if n.endswith(suffix) and n[: -len(suffix)] in TEAM_ALIASES:
            return TEAM_ALIASES[n[: -len(suffix)]]
    return name.strip()
