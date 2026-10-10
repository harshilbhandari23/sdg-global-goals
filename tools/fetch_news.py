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


# keywords that identify which Global Goal a story is about (the API only says which goal it was searched for)
KEYWORDS = {
    1: ["poverty", "poorest", "extreme poverty", "social protection", "cash transfer", "livelihood", "destitut"],
    2: ["hunger", "famine", "food security", "malnutrition", "nutrition", "starvation", "agriculture", "farmers", "crop", "harvest", "wfp", "fao", "food crisis"],
    3: ["health", "disease", "vaccine", "vaccination", "hospital", "who ", "epidemic", "pandemic", "cancer", "malaria", "hiv", "tuberculosis", "mental health", "maternal", "child mortality", "medicine"],
    4: ["education", "school", "schools", "teacher", "literacy", "students", "learning", "university", "unesco", "classroom"],
    5: ["gender", "women", "girls", "female", "sexual violence", "femicide", "equality for women", "un women", "domestic violence", "child marriage"],
    6: ["water", "sanitation", "drinking water", "hygiene", "toilet", "wastewater", "drought", "sewage"],
    7: ["energy", "electricity", "renewable", "solar", "wind power", "fossil fuel", "clean cooking", "power grid", "coal", "oil and gas", "nuclear"],
    8: ["jobs", "employment", "unemployment", "labour", "labor", "workers", "decent work", "economic growth", "wages", "ilo", "gdp", "economy", "trade"],
    9: ["infrastructure", "innovation", "industry", "industrial", "technology", "internet", "broadband", "digital", "artificial intelligence", "ai ", "manufacturing", "transport", "research and development"],
    10: ["inequality", "inequalities", "discrimination", "migrants", "migration", "refugee", "refugees", "inclusion", "marginalized", "indigenous", "minorities", "disabilities"],
    11: ["city", "cities", "urban", "housing", "slum", "public transport", "heritage", "disaster risk", "earthquake", "flood", "resilient", "settlements"],
    12: ["consumption", "production", "waste", "recycling", "plastic", "circular economy", "sustainable consumption", "food waste", "supply chain", "chemicals", "pollution"],
    13: ["climate", "emissions", "greenhouse", "global warming", "carbon", "cop3", "cop2", "paris agreement", "heatwave", "sea level", "adaptation", "net zero", "unfccc"],
    14: ["ocean", "oceans", "marine", "sea ", "fish", "fishing", "fisheries", "coral", "maritime", "coastal", "plastic pollution", "high seas"],
    15: ["forest", "forests", "biodiversity", "wildlife", "species", "deforestation", "land degradation", "desertification", "ecosystem", "nature", "extinction", "poaching"],
    16: ["peace", "justice", "conflict", "war", "ceasefire", "human rights", "security council", "violence", "rule of law", "corruption", "courts", "peacekeeping", "armed", "gaza", "ukraine", "sudan", "terror", "refugee camp", "institutions"],
    17: ["partnership", "partnerships", "cooperation", "financing", "development finance", "aid", "debt", "multilateral", "sustainable development goals", "sdgs", "global goals", "funding", "investment", "donor", "united nations"],
}


def classify(article, searched):
    """Pick the Global Goal a story is about: most keyword hits in title + summary, searched goal as tie-break."""
    text = " " + ((article.get("title") or "") + " " + (article.get("description") or "")).lower() + " "
    best, best_score = searched, 0
    for goal, words in KEYWORDS.items():
        score = sum(2 if (" " + w.strip() + " ") in text or (w.endswith(" ") and w in text) else (1 if w.strip() in text else 0) for w in words)
        score += 0.5 if goal == searched else 0
        if score > best_score:
            best, best_score = goal, score
    return best


def fetch(goal):
    for attempt in range(3):
        try:
            req = urllib.request.Request(API % goal, headers={"Accept": "application/json", "User-Agent": "sdg-site-news/1.0"})
            with urllib.request.urlopen(req, timeout=90) as r:
                arts = json.load(r).get("articles", [])
            for a in arts:
                a["searched"] = goal
                a["goal"] = classify(a, goal)
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
