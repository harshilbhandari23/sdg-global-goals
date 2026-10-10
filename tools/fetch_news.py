#!/usr/bin/env python3
"""Collect the latest SDG stories from the SDG news API (all 17 goals) into data/news.json.

The home page reads this file, so visitors get the 10 newest stories instantly. GitHub Actions runs this
every few hours before building the site (see .github/workflows/pages.yml). If the API is down the
existing file is kept.
"""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

API = "https://sdg-middleware.vercel.app/api/news-goal?goal=%d&limit=10"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "news.json")
KEEP = 10


def fetch(goal):
    for attempt in range(3):
        try:
            req = urllib.request.Request(API % goal, headers={"Accept": "application/json", "User-Agent": "sdg-site-news/1.0"})
            with urllib.request.urlopen(req, timeout=90) as r:
                arts = json.load(r).get("articles", [])
            for a in arts:
                a["goal"] = goal
            return arts
        except Exception as e:  # noqa: BLE001
            print(f"goal {goal} attempt {attempt + 1} failed: {e}", file=sys.stderr)
            time.sleep(8)
    return []


def main():
    old = []
    try:
        old = json.load(open(OUT)).get("articles", [])
    except Exception:  # noqa: BLE001
        pass
    with ThreadPoolExecutor(max_workers=1) as ex:
        fresh = [a for lst in ex.map(fetch, range(1, 18)) for a in lst]
    if not fresh and old:
        print("no new stories fetched; keeping the existing file")
        return
    seen, merged = set(), []
    for a in sorted(fresh + old, key=lambda a: a.get("publishedAt") or "", reverse=True):
        k = a.get("url") or a.get("title")
        if not k or k in seen or not a.get("title"):
            continue
        seen.add(k)
        merged.append({k2: a.get(k2) for k2 in ("title", "url", "description", "publishedAt", "image", "source", "sourceCountry", "goal")})
    out = {"updated": datetime.now(timezone.utc).isoformat(timespec="seconds"), "articles": merged[:KEEP]}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w"), indent=1, ensure_ascii=False)
    print(f"wrote {len(out['articles'])} stories")


if __name__ == "__main__":
    main()
