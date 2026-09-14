"""
Mirror UEFA player headshots and club crests into public/img/ucl/.

img.uefa.com refuses hotlinking from other origins (verified 2026-09-13: all
player photos and crests 404/blocked on fplanalytic.com while identical URLs
load on gaming.uefa.com), so the site serves self-hosted copies instead.

Runs after each prediction build (.github/workflows/ucl-data.yml):
    python scripts/mirror_ucl_images.py

Downloads only what the hub can show (top N per position from the latest
ucl_md{N}.json, plus the 36 club crests), skips files already present, and
deletes player images that fell out of the set so the repo stays lean.
Fetched once per matchday via curl_cffi with the game referer; be polite.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

from curl_cffi import requests as cr

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
PLAYER_DIR = ROOT / "public" / "img" / "ucl" / "players"
CLUB_DIR = ROOT / "public" / "img" / "ucl" / "clubs"

PER_POSITION = 70  # table shows top 40 per position + 5 locked previews; headroom for rank churn between runs (ux-audit 2026-09-14: a visible player 404'd)
PLAYER_URL = "https://img.uefa.com/imgml/TP/players/1/2027/324x324/{id}.jpg"
CLUB_URL = "https://img.uefa.com/imgml/TP/teams/logos/70x70/{id}.png"
HEADERS = {"Referer": "https://gaming.uefa.com/en/uclfantasy"}

# Same season mapping as src/lib/ucl/clubs.ts; update both each season.
CLUB_IDS = [
    "50129", "52280", "52683", "50124", "50080", "50037", "59333", "52758",
    "50043", "79946", "52692", "52749", "50067", "50138", "63405", "52277",
    "75797", "7889", "52919", "52682", "50136", "50062", "52747", "50064",
    "2603790", "52265", "50051", "50137", "2609356", "52707", "52498",
    "52797", "50149", "50107", "52319", "70691",
]


def latest_matchday_file() -> Path | None:
    files = sorted(
        (p for p in DATA_DIR.glob("ucl_md*.json") if re.match(r"ucl_md\d+\.json$", p.name)),
        key=lambda p: int(re.search(r"\d+", p.name).group()),
    )
    return files[-1] if files else None


def wanted_player_ids(payload: dict) -> list[str]:
    by_pos: dict[str, list[str]] = {}
    for p in payload["players"]:  # already sorted by xPts
        ids = by_pos.setdefault(p["position"], [])
        if len(ids) < PER_POSITION:
            ids.append(p["player_id"])
    return [i for ids in by_pos.values() for i in ids]


def fetch(url: str, dest: Path) -> bool:
    r = cr.get(url, impersonate="chrome", timeout=25, headers=HEADERS)
    if r.status_code == 200 and r.content[:3] != b"<ht":
        dest.write_bytes(r.content)
        return True
    return False


def main() -> None:
    md_file = latest_matchday_file()
    if md_file is None:
        print("no ucl_md*.json yet; nothing to mirror")
        return
    payload = json.loads(md_file.read_text(encoding="utf-8"))

    PLAYER_DIR.mkdir(parents=True, exist_ok=True)
    CLUB_DIR.mkdir(parents=True, exist_ok=True)

    fetched = skipped = missing = 0
    wanted = wanted_player_ids(payload)
    for pid in wanted:
        dest = PLAYER_DIR / f"{pid}.jpg"
        if dest.exists():
            skipped += 1
            continue
        if fetch(PLAYER_URL.format(id=pid), dest):
            fetched += 1
        else:
            missing += 1  # no photo published for this player; UI falls back to initials
        time.sleep(0.15)

    removed = 0
    keep = {f"{pid}.jpg" for pid in wanted}
    for f in PLAYER_DIR.glob("*.jpg"):
        if f.name not in keep:
            f.unlink()
            removed += 1

    club_fetched = 0
    for cid in CLUB_IDS:
        dest = CLUB_DIR / f"{cid}.png"
        if dest.exists():
            continue
        if fetch(CLUB_URL.format(id=cid), dest):
            club_fetched += 1
        time.sleep(0.15)

    print(
        f"players: {fetched} fetched, {skipped} cached, {missing} unavailable, "
        f"{removed} removed · clubs: {club_fetched} fetched ({md_file.name})"
    )


if __name__ == "__main__":
    main()
