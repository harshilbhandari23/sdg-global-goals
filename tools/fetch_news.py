#!/usr/bin/env python3
"""Collect the latest news for every Global Goal from Bing News (photos, summaries) and Google News (more headlines) - free RSS searches, no API key.

Writes data/news/goal-1.json ... goal-17.json (stories about that one goal, newest first) and data/news.json
(the 10 newest stories across all goals, each labelled with its goal). The site reads these files, so pages stay fast.
GitHub Actions runs this every 3 hours before building the site (.github/workflows/pages.yml). If the feed is
unreachable the existing files are kept.
"""
import email.utils, html, json, os, re, sys, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
PER_GOAL, HOME = 10, 10
WINDOW = "when:60d"

# search terms that keep each feed on its own goal (quoted phrases; "SDG n" always included)
QUERIES = {
    1: ['"extreme poverty"', '"poverty reduction"', '"fight poverty"'],
    2: ['"zero hunger"', '"food security"', '"famine"', '"malnutrition"'],
    3: ['"universal health coverage"', '"global health"', '"vaccination"', '"maternal health"'],
    4: ['"quality education"', '"education for all"', '"out-of-school children"', '"literacy"'],
    5: ['"gender equality"', '"women and girls"', '"violence against women"', '"women\'s rights"'],
    6: ['"clean water"', '"sanitation"', '"safe drinking water"', '"water scarcity"'],
    7: ['"clean energy"', '"renewable energy"', '"energy access"', '"energy transition"'],
    8: ['"decent work"', '"youth employment"', '"labour rights"', '"inclusive growth"'],
    9: ['"sustainable infrastructure"', '"industry innovation"', '"digital divide"', '"resilient infrastructure"'],
    10: ['"reduce inequality"', '"inequalities"', '"social inclusion"', '"migrants rights"'],
    11: ['"sustainable cities"', '"urban resilience"', '"affordable housing"', '"slum upgrading"'],
    12: ['"responsible consumption"', '"circular economy"', '"food waste"', '"plastic waste"'],
    13: ['"climate action"', '"climate change"', '"cop31"', '"carbon emissions"'],
    14: ['"ocean conservation"', '"marine life"', '"overfishing"', '"coral reefs"'],
    15: ['"biodiversity"', '"deforestation"', '"protect forests"', '"wildlife"'],
    16: ['"peace and justice"', '"rule of law"', '"human rights"', '"peacebuilding"'],
    17: ['"global partnerships"', '"development finance"', '"sustainable development goals"', '"debt relief"'],
}


def feed_url(goal):
    terms = ['"SDG %d"' % goal, '"Sustainable Development Goal %d"' % goal] + QUERIES[goal]
    q = "(" + " OR ".join(terms) + ") " + WINDOW
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q, "hl": "en-US", "gl": "US", "ceid": "US:en"})


def bing_url(goal, term=None):
    q = term or " OR ".join(['"SDG %d"' % goal] + QUERIES[goal])
    return "https://www.bing.com/news/search?" + urllib.parse.urlencode({"q": q, "format": "rss", "setlang": "en-US", "qft": 'sortbydate="1"'})


def parse_bing(raw, goal):
    out = []
    for it in ET.fromstring(raw).findall(".//item"):
        g = {c.tag.split("}")[-1]: (c.text or "").strip() for c in it}
        link = urllib.parse.parse_qs(urllib.parse.urlparse(g.get("link", "")).query).get("url", [""])[0] or g.get("link", "")
        try:
            when = email.utils.parsedate_to_datetime(g["pubDate"]).astimezone(timezone.utc).isoformat(timespec="seconds")
        except Exception:  # noqa: BLE001
            continue
        img = g.get("Image", "")
        if img:
            img = img.replace("http://", "https://") + "&w=560&h=340&c=14"
        title = html.unescape(g.get("title", ""))
        if title and link:
            out.append({"title": title, "url": link, "description": html.unescape(g.get("description", "")), "image": img,
                        "publishedAt": when, "source": g.get("Source", ""), "goal": goal})
    return out


def get(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (sdg-site-news)"})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            print("fetch failed (%d): %s" % (attempt + 1, e), file=sys.stderr)
            time.sleep(3)
    return None


def parse(raw, goal):
    out = []
    for it in ET.fromstring(raw).findall(".//item"):
        title = html.unescape((it.findtext("title") or "").strip())
        src = it.find("source")
        source = (src.text or "").strip() if src is not None else ""
        if source and title.endswith(" - " + source):
            title = title[: -len(source) - 3]
        try:
            when = email.utils.parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone.utc).isoformat(timespec="seconds")
        except Exception:  # noqa: BLE001
            continue
        link = (it.findtext("link") or "").strip()
        if title and link:
            out.append({"title": title, "url": link, "publishedAt": when, "source": source, "goal": goal})
    return out


GENERIC = {"global", "goal", "goals", "sustainable", "development", "access", "inclusive", "growth", "transition", "reduce", "fight", "protect", "safe", "rights", "rule", "life", "decent", "quality", "relief", "social"}
NOISE = re.compile(r"bond yield|stock price|share price|finra|nasdaq|nyse|price target|etf\b|\bcrypto|casino|betting|horoscope", re.I)


def title_words(goal):
    words = set()
    for phrase in QUERIES[goal] + ['"SDG %d"' % goal]:
        for w in re.findall(r"[a-z]{4,}", phrase.lower()):
            if w not in GENERIC:
                words.add(w)
    words.add("sdg %d" % goal)
    return words


def relevant(a, words):
    t = a["title"].lower()
    return any(w in t for w in words)


OG = re.compile(r'<meta[^>]+(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image)["\'][^>]*>', re.I)
OGC = re.compile(r'content=["\']([^"\']+)["\']', re.I)


def og_image(url):
    """The article's own preview picture (og:image), or ''."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; sdg-site-news)", "Accept": "text/html"})
        with urllib.request.urlopen(req, timeout=8) as r:
            page = r.read(250000).decode("utf-8", "ignore")
        for tag in OG.findall(page):
            m = OGC.search(tag)
            if m and m.group(1).startswith(("http://", "https://")) and not m.group(1).lower().endswith((".svg", ".ico")):
                return html.unescape(m.group(1)).replace("http://", "https://")
    except Exception:  # noqa: BLE001
        pass
    return ""


def add_images(arts, cache):
    """Fill missing photos from the article pages (reusing earlier lookups)."""
    from concurrent.futures import ThreadPoolExecutor
    todo = [a for a in arts if not a.get("image")]
    for a in todo:
        if cache.get(a["url"]):
            a["image"] = cache[a["url"]]
    todo = [a for a in todo if not a.get("image") and a["url"] not in cache and "news.google.com" not in a["url"]]
    with ThreadPoolExecutor(max_workers=8) as ex:
        for a, img in zip(todo, ex.map(lambda a: og_image(a["url"]), todo)):
            cache[a["url"]] = img
            if img:
                a["image"] = img


def key(a):
    return re.sub(r"\W+", " ", a["title"].lower()).strip()


def main():
    os.makedirs(os.path.join(ROOT, "news"), exist_ok=True)
    everything, got, cache = [], 0, {}
    for goal in range(1, 18):  # reuse picture lookups from the previous run
        try:
            for a in json.load(open(os.path.join(ROOT, "news", "goal-%d.json" % goal)))["articles"]:
                if a.get("image"):
                    cache[a["url"]] = a["image"]
        except Exception:  # noqa: BLE001
            pass
    for goal in range(1, 18):
        found = []
        # Bing first (photos + summaries): the combined search plus one search per key phrase for a bigger pool; then Google for more headlines
        sources = [(parse_bing, bing_url(goal))] + [(parse_bing, bing_url(goal, t + " OR \"SDG %d\"" % goal)) for t in QUERIES[goal]] + [(parse, feed_url(goal))]
        for fetcher, url in sources:
            raw = get(url)
            time.sleep(0.5)
            if raw:
                try:
                    found += fetcher(raw, goal)
                except ET.ParseError:
                    pass
        if not found:
            continue
        seen, arts, words = set(), [], title_words(goal)
        for a in sorted(found, key=lambda a: (a["publishedAt"][:10], bool(a.get("image"))), reverse=True):
            if key(a) in seen or NOISE.search(a["title"]) or len(a["title"]) < 25:
                continue
            seen.add(key(a)); a["_on"] = relevant(a, words); arts.append(a)
        # every card must be complete (photo + headline + summary): keep only stories that have all three.
        # Headline-on-topic stories come first; weaker matches only top the list up to 6.
        arts.sort(key=lambda a: a["publishedAt"], reverse=True)
        add_images([a for a in arts if a["_on"] or not a.get("image")], cache)
        done = lambda a: bool(a.get("image")) and len(a.get("description") or "") >= 40  # noqa: E731
        on, rest = [a for a in arts if a["_on"] and done(a)], [a for a in arts if not a["_on"] and done(a)]
        arts = on[:PER_GOAL]
        if len(arts) < 6:
            arts += rest[: 6 - len(arts)]
        arts.sort(key=lambda a: a["publishedAt"], reverse=True)
        for a in arts:
            a.pop("_on", None)
        if arts:
            got += 1
            json.dump({"updated": datetime.now(timezone.utc).isoformat(timespec="seconds"), "goal": goal, "articles": arts},
                      open(os.path.join(ROOT, "news", "goal-%d.json" % goal), "w"), indent=1, ensure_ascii=False)
            everything += arts
        time.sleep(1)
    if not got:
        print("nothing fetched; keeping the existing files")
        return
    seen, home = set(), []
    for a in sorted(everything, key=lambda a: a["publishedAt"], reverse=True):
        if key(a) in seen:
            continue
        seen.add(key(a)); home.append(a)
    json.dump({"updated": datetime.now(timezone.utc).isoformat(timespec="seconds"), "articles": home[:HOME]},
              open(os.path.join(ROOT, "news.json"), "w"), indent=1, ensure_ascii=False)
    print("goals with news: %d/17, home stories: %d" % (got, min(HOME, len(home))))


if __name__ == "__main__":
    main()
