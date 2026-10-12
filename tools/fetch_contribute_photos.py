#!/usr/bin/env python3
"""One-off helper: find a free-licence photo on Wikimedia Commons for each 'How can you contribute' action and save it to
assets/media/ + data/contribute/goal-N.json (the CMS then lets you swap any photo). Not run by the build."""
import html, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
UA = {"User-Agent": "sdg-global-goals-site/1.0 (educational project; contact: harshilbhandari22@gmail.com)"}
API = "https://commons.wikimedia.org/w/api.php"
STOP = set("a an the and or of to in on for with your you our their its it is are be by at as from this that these those can may will more most all any some what how why who when where over about into out up down not no do does did make makes take takes find finds use used using get gets keep keeps help helps give gives let lets try tries start starts join joins learn learns think thinks choose chooses buy buys check checks share shares talk talks tell tells ask asks look looks support supports donate donates volunteer volunteers spread spreads stay stays follow follows read reads write writes post posts send sends call calls tweet fight fights lend voice local small big every country world people day days time times thing things one two three new".split())
GOAL_TERMS = {1: "poverty", 2: "hunger food", 3: "health hospital", 4: "school education", 5: "women gender equality", 6: "clean water", 7: "solar energy", 8: "work employment", 9: "infrastructure innovation", 10: "inequality community", 11: "city community", 12: "recycling waste", 13: "climate", 14: "ocean marine", 15: "forest nature", 16: "justice peace", 17: "partnership cooperation"}
BAD = re.compile(r"logo|map|flag|icon|diagram|chart|poster|screenshot|stamp|coat of arms|banner|infographic|graph|\.svg|\.pdf|\.tif|\.gif|cartoon|drawing|illustration|painting|portrait of", re.I)
OK_LIC = re.compile(r"^(cc0|public domain|pd|cc[- ]by|cc[- ]by[- ]sa)", re.I)


def call(params):
    q = urllib.parse.urlencode(dict(params, format="json", formatversion="2"))
    for k in range(4):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(API + "?" + q, headers=UA), timeout=40))
        except Exception as e:
            time.sleep(2 + 3 * k)
    return {}


def keywords(title, n=4):
    w = [x for x in re.findall(r"[A-Za-z]+", title.lower()) if x not in STOP and len(x) > 2]
    return w[:n]


def search(q, used):
    d = call({"action": "query", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": "6", "gsrlimit": "30", "prop": "imageinfo",
              "iiprop": "url|size|mime|extmetadata", "iiurlwidth": "1400"})
    for pg in (d.get("query", {}).get("pages", []) or []):
        ii = (pg.get("imageinfo") or [{}])[0]
        t = pg.get("title", "")
        if not ii or BAD.search(t) or ii.get("mime") != "image/jpeg" or t in used:
            continue
        w, h = ii.get("width", 0), ii.get("height", 0)
        if w < 1600 or h < 900 or w / h < 1.0:
            continue
        md = ii.get("extmetadata", {})
        lic = (md.get("LicenseShortName", {}) or {}).get("value", "")
        if not OK_LIC.search(lic):
            continue
        by = re.sub(r"<[^>]+>", "", (md.get("Artist", {}) or {}).get("value", "")).strip() or "Unknown"
        return t, ii.get("thumburl"), "%s, %s, via Wikimedia Commons" % (html.unescape(by)[:80], lic)
    return None


QUERIES = json.load(open(os.environ.get("QUERIES", "queries.json")))


def main(goals):
    used = set()
    for n in goals:
        g = json.load(open(os.path.join(ROOT, "data", "goals", "goal-%d.json" % n), encoding="utf8"))
        items = [t for t in g["todo"] if re.sub(r"<[^>]+>", "", t["html"]).strip()]
        photos = []
        for i, t in enumerate(items, 1):
            text = re.sub(r"<[^>]+>", " ", t["html"])
            first = re.split(r"(?<=[.!?])\s", text.strip())[0]
            tries = [QUERIES["%d.%d" % (n, i)], GOAL_TERMS[n]]
            hit = None
            for q in tries:
                if q.strip():
                    hit = search(q, used)
                    time.sleep(1.0)
                if hit: break
            if not hit:
                print("goal %d action %d: none (%s)" % (n, i, tries[0])); continue
            title, url, credit = hit
            used.add(title)
            fn = "assets/media/contrib-g%02d-a%02d.jpg" % (n, i)
            try:
                data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
            except Exception as e:
                print("download failed", title); continue
            open(os.path.join(ROOT, fn), "wb").write(data)
            photos.append({"action": i, "image": fn, "credit": credit})
            print("goal %d action %d: %s <- %s" % (n, i, title[:60], tries[0]))
        json.dump({"goal": n, "photos": photos}, open(os.path.join(ROOT, "data", "contribute", "goal-%d.json" % n), "w"), indent=1)


if __name__ == "__main__":
    main([int(x) for x in sys.argv[1:]] or range(1, 18))
