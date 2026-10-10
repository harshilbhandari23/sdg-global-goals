#!/usr/bin/env python3
"""Builds the static SDG site (plain HTML/CSS/JS) from data/*.json.

    python3 build.py        -> writes index.html, global_goals/, legal/ next to this file

All content lives in data/ (goals.json, yearwise.json, legal.json). Edit those files
(or the Decap CMS in /admin, if you enable it) and run build.py again.
"""
import html, json, os, re, time

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = str(int(time.time()))  # cache-buster for css/js so edits show up right away
D = lambda *p: os.path.join(ROOT, *p)
import glob


def load_folder(name, key=None):
    items = [json.load(open(f, encoding="utf8")) for f in sorted(glob.glob(D("data", name, "*.json")))]
    return sorted(items, key=key) if key else items


goals = load_folder("goals", key=lambda g: int(g["number"]))
legal = load_folder("legal")
yearwise = load_folder("yearwise", key=lambda y: y["year"])
json.dump(yearwise, open(D("data", "yearwise.json"), "w", encoding="utf8"), indent=1)  # read by the year wheel
hero_vars = json.load(open(D("data", "hero-vars.json"), encoding="utf8"))
esc = lambda s: html.escape(str(s or ""), quote=True)


def A(url, depth):
    """Image paths saved by the editor are relative to the site root ('assets/media/x.png')."""
    if not url or re.match(r"^(https?:|data:|//)", url):
        return url or ""
    return "../" * depth + url.lstrip("/")

SHORT = ["No Poverty", "Zero Hunger", "Good Health and Well-being", "Quality Education", "Gender Equality",
         "Clean Water and Sanitation", "Affordable and Clean Energy", "Decent Work and Economic Growth",
         "Industry, Innovation and Infrastructure", "Reduced Inequalities", "Sustainable Cities and Communities",
         "Responsible Consumption and Production", "Climate Action", "Life Below Water", "Life on Land",
         "Peace, Justice and Strong Institutions", "Partnerships for the Goals"]
MOSAIC = {  # goal icon tiles used in the home hero
    1: "qt5l2my3cby2MnrzBPGAGM8JR8o", 2: "zCGF8LMQcJ3uQvba8L4LLj4JloY", 3: "cz6WBw8Fotw0oYNID3TmAA6KVU",
    4: "AVUbfveyBZkpKevlpnlyt0eWMo", 5: "H4BYb3bhQkLjaP2Xv6bsgSaRUcg", 6: "Pnl2twotiOqkqbI0CjaJClAhe0",
    7: "7bGoHva3h2WJFtryWKeOqZ5TU", 8: "YheUgaZAsAizqSe29dCIQuTaads", 9: "oAPo7SLCHqYMnYw81HPiOpv0lQg",
    10: "0HKOSZ3lYSUK6ZGUl1M207tU", 11: "aH8hSOsjZxVOznwjp5oPgpuCIH8", 12: "UCkFko2s3PtgPr11zf53urwkag",
    13: "WLmKIOWb2kFtvBhDsSSwyUh7230", 14: "L5w7iO9VBWW1chbV6u9QmwRFGo", 15: "IkXnzHZuE7tPdGpmwgbKJ5gguA",
    16: "bSiGzmAhIyLywCPYkbAStKSHtJk", 17: "wg8yS6WRoLicU7wV6Foqoxky4"}
MOSAIC_POS = [(4, 8), (16, 3), (29, 10), (42, 4), (55, 9), (68, 3), (82, 8), (93, 5), (3, 36), (92, 34), (6, 62),
              (91, 60), (14, 84), (30, 90), (50, 92), (70, 89), (86, 84)]
FAQ = [
    ("What kind of clients do you usually work with?", "We work with early-stage brands, small teams, and creatives building something thoughtful. If you care about how things look and feel — we’ll probably get along."),
    ("Do you offer full brand packages?", "Most of our projects include strategy, identity, and visuals — everything you need to launch or refresh with clarity and consistency."),
    ("Can I hire you just for a logo or smaller piece?", "Sometimes, if it makes sense. We usually prefer to work on full systems, but if it’s the right fit, we’re open to smaller brand work."),
    ("What’s your timeline like?", "Most brand projects take 4–8 weeks, depending on scope. We’ll give you a clear schedule before anything starts — no surprises."),
    ("How do I start a project with you?", "Send us a note. If it feels like a good fit, we’ll set up a quick call, talk through your needs, and build a proposal from there."),
]


def head(title, depth, desc="", extra_css=""):
    r = "../" * depth
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@500;600;700;800&family=Host+Grotesk:wght@500;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{r}assets/styles.css?v={BUILD}">{extra_css}
<script>window.SITE_ROOT="{r}";try{{var w=sessionStorage.getItem("sdgWipe");if(w){{sessionStorage.removeItem("sdgWipe");document.documentElement.className+=" wipe-in";document.documentElement.style.setProperty("--wipe",w)}}}}catch(e){{}}</script></head><body><div id="wipe" aria-hidden="true"><i></i></div>"""


def nav(depth, current=""):
    r = "../" * depth
    items = [("Home", f"{r}index.html", "home"), ("Goals", f"{r}global_goals/", "goals"), ("Progress", f"{r}index.html#years", ""),
             ("Map", f"{r}index.html#map", ""), ("News", f"{r}index.html#news", ""), ("Quiz", f"{r}index.html#quiz", "")]
    links = "".join(f'<a href="{h}"{" aria-current=page" if k and k == current else ""}>{t}</a>' for t, h, k in items)
    return f'<nav class="nav" aria-label="Main">{links}</nav>'


def fab():
    return ('<div class="sdg-fab"><div class="sdg-pop" role="dialog" aria-label="Choose a goal"><div class="wheel-links"></div><button class="pop-x" type="button" aria-label="Close">&times;</button></div>'
            '<button class="toggle" type="button" aria-label="Open the goals wheel" aria-expanded="false"></button></div>')


def footer(depth):
    r = "../" * depth
    return (f'<footer class="site"><div class="row"><div class="h3" style="color:#fff">Global Goals</div><div style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start">'
            f'<a href="{r}global_goals/">All goals</a><a href="{r}legal/privacy-policy/">Privacy policy</a><a href="{r}legal/terms-of-use/">Terms of use</a></div></div>'
            f'<p class="copy">© Global Goals. Content for educational use.</p></footer>')


def scripts(depth, extra="", wheel=True):
    r = "../" * depth
    wheel = f'<script src="{r}assets/wheel-data.js?v={BUILD}"></script>' if wheel else ""
    return (f'<script src="{r}assets/sdg-data.js?v={BUILD}"></script>{wheel}<script src="{r}assets/ui.js?v={BUILD}"></script><script src="{r}assets/vendor/qrcode.min.js"></script><script src="{r}assets/widgets.js?v={BUILD}"></script>{extra}</body></html>')


def news_block(feed, limit=10, title="Live SDG News", ident="news"):
    return f"""<section class="news" id="{ident}" data-feed="{esc(feed)}" data-limit="{limit}" aria-label="{esc(title)}">
<div class="news-head"><h2>{esc(title)}</h2><div class="news-arrows" hidden><button class="prev" type="button" aria-label="Previous news cards">←</button><button class="next" type="button" aria-label="Next news cards">→</button></div></div>
<p class="news-loading" style="margin:0;opacity:.8">Loading live feed…</p><p class="news-msg" hidden></p>
<div class="news-view"><div class="news-track"></div></div></section>"""


def goal_card(g, depth):
    r = "../" * depth
    n = g["number"]
    return (f'<a class="goal-card" style="--c:{esc(g["color"])}" href="{r}global_goals/goal-{n}/"><div class="img" style="background-image:url(\'{esc(A(g["brandImage"], depth))}\')"></div>'
            f'<div class="t"><span>Goal {n}</span><i></i></div></a>')


def write(path, content):
    full = D(path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf8").write(content)




# Framer "Main Prototype Section" canvas (1734 x 1787): decorative coloured squares and goal tiles around the text and wheel
WS_SQUARES = [(1061,0,98,96,"#FCC30B"),(290,194,96,96,"#E5243B"),(1,290,96,96,"#DDA83A"),(97,194,97,96,"#FD6925"),(194,97,96,97,"#4C9F38"),(97,0,97,96,"#BF8B2E"),(767,0,96,96,"#FD9D24"),(964,95,97,98,"#FD6925"),(97,482,97,97,"#56C02B"),(1159,0,97,96,"#E5243B"),(1256,0,97,96,"#3F7E44"),(1449,0,96,96,"#A21942"),(1541,1,97,96,"#26BDE2"),(1,386,96,96,"#FF3A21"),(1541,608,97,97,"#00689D"),(1349,705,96,96,"#4C9F38"),(1638,705,96,96,"#E5243B"),(1443,897,97,96,"#FD6925"),(1347,801,96,96,"#E5243B"),(1636,897,96,96,"#DD1367"),(1155,801,96,96,"#19486A"),(962,801,97,96,"#FD9D24"),(1636,993,96,97,"#56C02B"),(0,1691,97,96,"#FCC30B"),(193,1691,96,96,"#56C02B"),(289,1691,96,96,"#26BDE2"),(1540,1595,96,96,"#DDA83A"),(478,0,97,96,"#DD1367")]
WS_TILES = [(386,1,96,96,17),(1253,97,96,97,14),(867,1,97,96,15),(1,97,96,97,16),(97,290,97,96,8),(1156,705,97,96,10),(1445,705,96,96,11),(97,1596,96,96,9),(1636,1691,96,96,8),(1059,801,96,96,5),(1251,801,96,96,6),(1251,897,96,96,13),(1540,801,96,96,7),(382,0,96,96,17)]


def wheel_tiles():
    # snap every tile to one 18-column square grid so the edges line up exactly
    U = 1734 / 18
    cell = lambda x, y: (int(round(x / U)), int(round(y / U)) + (2 if int(round(y / U)) >= 11 else 0))  # bottom rows move down 2 with the wheel
    box = lambda c, r: (int(round(c * U)), int(round(r * U)), int(round((c + 1) * U)) - int(round(c * U)), int(round((r + 1) * U)) - int(round(r * U)))
    used, out = set(), []
    for (x, y, w, h, g) in WS_TILES:
        c, r = cell(x, y)
        if (c, r) in used:
            continue
        used.add((c, r)); l, t, ww, hh = box(c, r)
        out.append('<a class="ws-t ws-g" href="global_goals/goal-%d/" aria-label="Goal %d" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx"><img src="assets/hero/goal-%02d.png" alt="" draggable="false"></a>' % (g, g, l, t, ww, hh, g))
    for (x, y, w, h, col) in WS_SQUARES:
        c, r = cell(x, y)
        if (c, r) in used:
            continue
        used.add((c, r)); l, t, ww, hh = box(c, r)
        out.append('<i class="ws-t" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;background:%s" aria-hidden="true"></i>' % (l, t, ww, hh, col))
    return "".join(out)

# ---------------------------------------------------------------- home hero (Figma: "Sustainable Development Goals- 1.0", 1440 x 820)
HERO_W, HERO_H = 1440, 820
HERO_IMAGE_TILES = {  # goal -> (left, top) of the icon tiles
    1: (0, 740), 2: (160, 740), 3: (400, 740), 4: (560, 740), 5: (880, 740), 6: (1040, 740), 7: (1280, 740),
    8: (240, 660), 9: (480, 660), 10: (800, 660), 11: (1200, 660), 12: (80, 580), 13: (1040, 580), 14: (160, 420),
    15: (1280, 340), 16: (1120, 100), 17: (160, 20)}
HERO_COLOR_TILES = [  # (colour, left, top) plain goal-colour squares
    ("#26bde2", 80, 740), ("#26bde2", 1120, 420), ("#fcc30b", 0, 660), ("#3f7e44", 80, 660), ("#3f7e44", 1200, 340),
    ("#e5243b", 320, 660), ("#a21942", 1280, 500), ("#56c02b", 560, 660), ("#56c02b", 0, 500), ("#dda83a", 880, 660),
    ("#dda83a", 1360, 500), ("#00689d", 160, 660), ("#0a97d9", 400, 660), ("#a21942", 640, 660), ("#a21942", 80, 180),
    ("#c5192d", 960, 660), ("#fd6925", 720, 660), ("#fd6925", 1200, 580), ("#ff3a21", 1040, 660), ("#ff3a21", 1280, 260),
    ("#ff3a21", 320, 580), ("#00689d", 1280, 660), ("#4c9f38", 1120, 660), ("#4c9f38", 0, 260), ("#e5243b", 1360, 660),
    ("#56c02b", 240, 740), ("#dd1367", 480, 740), ("#00689d", 640, 740), ("#00689d", 0, 340), ("#00689d", 1360, 420),
    ("#fcc30b", 720, 740), ("#fcc30b", 1360, 580), ("#fcc30b", 240, 500), ("#e5243b", 1120, 740), ("#e5243b", 0, 420),
    ("#26bde2", 800, 740), ("#0a97d9", 960, 580), ("#dd1367", 1360, 740), ("#dd1367", 160, 500), ("#dd1367", 1280, 20),
    ("#bf8b2e", 1200, 740), ("#bf8b2e", 400, 580), ("#19486a", 960, 740), ("#19486a", 80, 420), ("#fd9d24", 320, 740),
    ("#fd9d24", 1360, 260)]
UN_PATHS = [("un-path929", 16, 48.43, 81.5, 48.95), ("un-path931", 13.83, 48.43, 82.01, 48.28),
            ("un-path933", 13.92, 49.37, 83.98, 49.41), ("un-path935", 13.66, 48.92, 82.31, 48.78)]  # top,right,bottom,left (%)


def yw_note():
    try:
        m = json.load(open(D("data", "yearwise-meta.json"), encoding="utf8"))
    except Exception:
        return ""
    return f'<p class="yw-note">Average score across countries per goal (0-100), from the SDSN Sustainable Development Report {m["edition"]} data. Updates automatically when new data is published.</p>'


def hero_html():
    pos = lambda x, y: f"left:{x / HERO_W * 100:.4f}%;top:{y / HERO_H * 100:.4f}%"
    tiles = "".join(f'<i class="t" style="{pos(x, y)};background:{c}" aria-hidden="true"></i>' for c, x, y in HERO_COLOR_TILES)
    tiles += "".join(
        f'<a class="t" href="global_goals/goal-{n}/" style="{pos(x, y)}" aria-label="Goal {n}: {esc(SHORT[n - 1])}"><img src="assets/hero/goal-{n:02d}.png" alt="" draggable="false"></a>'
        for n, (x, y) in HERO_IMAGE_TILES.items())
    un = "".join(f'<img class="un-p" src="assets/hero/{f}.svg" alt="" style="left:{l}%;top:{t}%;width:{100 - l - r:.3f}%;height:{100 - t - b:.3f}%">' for f, t, r, b, l in UN_PATHS)
    return f"""<header class="fh" id="top"><div class="fh-canvas" aria-hidden="false">{tiles}
<div class="fh-un" aria-label="United Nations">{un}<span class="fh-un-t">United Nations</span></div>
<h1 class="fh-title"><span>SUSTAINABLE </span><span>DEVELOPMENT </span><span>GOALS</span></h1>
<p class="fh-sub1">Your lens into</p><p class="fh-sub2">Global progression</p></div></header>"""


CX_DECOR = [("t", "r", 0, 0, "#FCC30B"), ("t", "r", 1, 0, "#E5243B"), ("t", "r", 0, 1, "#26BDE2"), ("t", "r", 2, 0, "#3F7E44"), ("t", "r", 1, 1, "#DD1367"), ("t", "r", 3, 0, "#FD6925"),
            ("b", "l", 0, 0, "#4C9F38"), ("b", "l", 1, 0, "#A21942"), ("b", "l", 0, 1, "#FD9D24"), ("b", "l", 2, 0, "#0A97D9"), ("b", "l", 1, 1, "#BF8B2E")]


def cx_decor():
    return "".join('<i class="cx-d" aria-hidden="true" style="%s:calc(%d * var(--sq));%s:calc(%d * var(--sq));background:%s"></i>' % ("top" if v == "t" else "bottom", row, "right" if h == "r" else "left", col, color) for (v, h, col, row, color) in CX_DECOR)


MO_COLORS = ["#E5243B", "#DDA63A", "#4C9F38", "#C5192D", "#FF3A21", "#26BDE2", "#FCC30B", "#A21942", "#FD6925", "#DD1367", "#FD9D24", "#BF8B2E", "#3F7E44", "#0A97D9", "#56C02B", "#00689D", "#19486A"]


def mosaic(seed, where, rows=2, cols=26):
    """A strip of goal-colour squares and goal tiles (the home page tile pattern) for the top or bottom edge of a section."""
    import random
    r = random.Random(seed)
    cells = []
    for _ in range(rows * cols):
        v = r.random()
        if v < 0.5:
            cells.append("<b></b>")
        elif v < 0.86:
            cells.append('<i style="background:%s"></i>' % r.choice(MO_COLORS))
        else:
            g = r.randint(1, 17)
            cells.append('<a class="mo-g" href="global_goals/goal-%d/" aria-label="Goal %d"><img src="assets/tiles/goal-%02d.jpg" alt="" draggable="false"></a>' % (g, g, g))
    return '<div class="mo %s">%s</div>' % (where, "".join(cells))

# ---------------------------------------------------------------- home
def build_home():
    p = head("Sustainable Development Goals", 0, "Your lens into the 17 Sustainable Development Goals.")
    p += nav(0, "home")
    p += hero_html() + "\n\n"
    p += f"""<section class="wheel-section" id="explore"><div class="ws"><div class="ws-c">{wheel_tiles()}<h2 class="ws-title">TAP AND EXPLORE THE GOAL</h2><div class="wheel-wrap"><div class="wheel-links"></div></div>
<p class="scroll-text" data-start="rgba(9,9,9,.56)" data-end="#080a07">The United Nations brings countries together to work on shared global challenges through cooperation, research and collective action. It supports peace, fairness and long-term development, while helping define how progress is measured across the world. At its core, it creates a common direction for nations to move forward together and stay accountable to shared priorities</p></div></div></section>

<section class="years-section" id="years" style="background-image:url('assets/media/fhz7HQj75koriiRE2riVt1GtXQ8.png')">
<h2 class="h2">progress over the years</h2><div class="yw" data-start="2020" role="group" aria-label="SDG progress by year. Drag the wheel or use the arrow keys."></div>{yw_note()}
<p class="hint">Drag the wheel to change the year ›</p></section>

<section class="map-section" id="map">{mosaic(11, "top")}{mosaic(12, "bottom")}<h2 class="h2">Progress Across Nations</h2>
<div class="kiosk" data-idle="60"><div class="mapwrap"><svg viewBox="0 0 914.55 603" preserveAspectRatio="xMidYMid meet" aria-label="World map"></svg>
<div class="mapmsg" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#666">Loading map…</div><div class="info" hidden></div></div>
<p class="prompt">Tap a goal below to see it on the map.</p><div class="goalrow"></div>
<div class="legend"><span><i style="background:#5cb85c"></i>On track / achieved</span><span><i style="background:#f0ab00"></i>Challenges remain</span><span><i style="background:#ef7d00"></i>Significant challenges</span><span><i style="background:#c0392b"></i>Major challenges</span><span><i style="background:#c8c8c8"></i>Information unavailable</span></div></div></section>

<section class="cx-section" id="country">{mosaic(21, "top")}{mosaic(22, "bottom")}<h2 class="h2">See where your country stands</h2>
<div class="cx" data-country="Afghanistan"><div class="cx-pick"><div class="cx-az" role="group" aria-label="Pick a country by first letter"></div><div class="cx-drop" role="listbox" hidden></div></div>
<div class="cx-main"><div class="cx-left"><h3 class="cx-name">Afghanistan</h3><p class="cx-region">Loading…</p><div class="cx-map"><svg viewBox="0 0 700 500" preserveAspectRatio="xMidYMid meet" aria-label="Country outline"></svg></div></div>
<div class="cx-stats"><div class="cx-stat navy"><b class="cx-score">—</b><span>Country score</span></div><div class="cx-stat blue"><b><i class="cx-rank">—</i><em>/ 167</em></b><span>Country rank</span></div></div></div>
<h3 class="cx-h3">SDG dashboard and trends</h3><div class="cx-goals"></div>
<div class="cx-legend"><span><b style="color:#db1a36">↓</b>Decreasing</span><span><b style="color:#e87c1e">→</b>Stagnating</span><span><b style="color:#ebc011">➚</b>Moderately improving</span><span><b style="color:#3aa746">↑</b>On track</span><span><b style="color:#939598">•</b>Unknown</span></div></div></section>

<section class="section news-band" id="news"><div class="container">{news_block("data/news.json", 20, "Live SDG News", "livenews")}</div></section>

<section class="section" id="quiz" style="background:#fff"><div class="container"><h2 class="h2" style="text-align:center;margin-bottom:32px">Create your world's to-do list</h2>
<div class="quiz"><div class="bgL"></div><div class="bgR"></div><div class="qhead"><h4>Create Your World's To-Do List</h4><p class="qcount" style="margin:0;font-weight:600"></p></div><div class="stage"></div></div></div></section>
"""
    p += footer(0) + fab()
    p += scripts(0, wheel=True, extra='<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script><script src="https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js"></script><script src="assets/map.js?v=' + BUILD + '"></script><script src="assets/country.js?v=' + BUILD + '"></script>')
    write("index.html", p)


# ---------------------------------------------------------------- goals list
def build_goals_list():
    cards = "".join(goal_card(g, 1) for g in goals)
    faq = "".join(
        f'<div class="faq-card" role="button" tabindex="0"><div class="q"><span class="n">{i:02d}</span><h3>{esc(q)}</h3><span class="x">+</span></div><div class="a"><p>{esc(a)}</p></div></div>'
        for i, (q, a) in enumerate(FAQ, 1))
    p = head("The 17 Goals", 1, "Explore the 17 Global Goals.")
    p += nav(1, "goals")
    p += f"""<header class="page-hero" style="background-image:url('../assets/media/GzwS540sdntbYYofPRQrkBW9BpI.png')"><div class="container">
<span class="pill" style="align-self:center"><b class="pill-14" style="font-size:16px">GOALS</b></span><div class="plus" aria-hidden="true">+ + + + + + +</div>
<h1 class="h2" style="font-size:clamp(40px,7vw,96px);text-align:center">THE 17 GOALS</h1><hr><p class="body-24" style="color:#fff">Explore every goal, its targets and how you can help.</p></div></header>
<main class="section" style="padding:96px 0"><div class="goal-grid" style="max-width:1400px;margin:0 auto">{cards}</div></main>"""
    p += footer(1) + fab() + scripts(1)
    write("global_goals/index.html", p)


# ---------------------------------------------------------------- goal pages
def hero_art(n):
    css = os.path.exists(D("assets", "heroes", f"g{n:02d}.css"))
    art = open(D("assets", "heroes", f"g{n:02d}.html"), encoding="utf8").read() if css else ""
    shade = hero_vars.get(f"goal{n}Shaded", "#00000033")
    style = (f'--color-goal-{n}-shaded:{shade};--ease:cubic-bezier(.4,0,.2,1);--ease-in:cubic-bezier(.4,0,1,1);'
             f'--ease-out:cubic-bezier(0,0,.2,1);--white-0:#fff')
    importmap = ('<script type="importmap">{"imports":{"react":"../../assets/vendor/shims/react.js",'
                 '"react/jsx-runtime":"../../assets/vendor/shims/jsx-runtime.js","framer":"../../assets/vendor/shims/framer.js"}}</script>')
    return (f'<link rel="stylesheet" href="../../assets/heroes/g{n:02d}.css">' + importmap,
            f'<div class="art" data-goal="{n}" aria-hidden="true" style="{style}"><div class="Hero-bg">{art}</div></div>')


def build_goal(g):
    n, c = g["number"], g["color"]
    link_css, art = hero_art(n)
    related = [x for x in goals if x["number"] != n]
    start = n % 17
    rel = (goals[start:] + goals[:start])
    rel = [x for x in rel if x["number"] != n][:4]
    targets = "".join(
        f'<div class="t-card"><div class="n">{esc(t["n"])}</div><div class="ti pill-20">{esc(t["title"])}</div><div class="de pill-14">{esc(t["detail"])}</div>'
        + (f'<img src="{esc(A(t["image"], 2))}" alt="" loading="lazy">' if t.get("image") else "<span style=\"width:120px\"></span>") + "</div>"
        for t in g["targets"])
    todos = "".join(
        f'<div class="todo">' + (f'<img src="{esc(A(t["image"], 2))}" alt="" loading="lazy">' if t.get("image") else "") + f'<div class="cms" style="font-size:15px">{t["html"]}</div></div>'
        for t in g["todo"] if re.sub(r"<[^>]+>", "", t["html"]).strip())
    p = head(f"Goal {n}: {g['title']}", 2, g["intro"][:150], link_css)
    p += nav(2, "goals").replace("<nav", f'<nav style="--goal:{c}"', 1)
    p += f"""<style>:root{{--goal:{esc(c)}}}</style>
<header class="banner" style="--goal:{esc(c)}">{art}<div class="titles"><h1 class="h2">{esc(g['title'])}</h1><div class="h2 gn">Goal {n}</div></div></header>
<section class="intro"><div class="container"><span class="pill" style="align-self:center"><span class="pill-20">ABOUT THE GOAL</span></span>
<p class="scroll-text body-56" data-start="rgba(9,9,9,.56)" data-end="{esc(c)}">{esc(g['intro'])}</p></div></section>
<section class="metrics"><div class="inner"><hr class="divider"><p class="body-32" style="max-width:1200px">We work best with people who have taste, opinions, and a clear sense of where they’re going. We’re here to shape that into a brand that feels polished without losing its edge.</p>
<div class="row"><div class="metric"><svg class="ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="3" fill="currentColor"/><path d="M24 3v7M24 38v7M3 24h7M38 24h7"/></svg><div class="num" data-count="{len(g['targets'])}">0</div><div class="lab">Targets</div></div><div class="metric"><svg class="ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="9" width="36" height="33" rx="3"/><path d="M6 19h36M15 4v9M33 4v9"/><circle cx="16" cy="28" r="1.8" fill="currentColor"/><circle cx="24" cy="28" r="1.8" fill="currentColor"/><circle cx="32" cy="28" r="1.8" fill="currentColor"/><circle cx="16" cy="35" r="1.8" fill="currentColor"/><circle cx="24" cy="35" r="1.8" fill="currentColor"/></svg><div class="num" data-count="319">0</div><div class="lab">Events</div></div><div class="metric"><svg class="ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 10c6-2 13-2 18 2 5-4 12-4 18-2v28c-6-2-13-2-18 2-5-4-12-4-18-2z"/><path d="M24 12v28"/></svg><div class="num" data-count="38">0</div><div class="lab">Publications</div></div><div class="metric"><svg class="ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M27 4 11 27h12l-2 17 16-24H25z"/></svg><div class="num" data-count="1927">0</div><div class="lab">Actions</div></div></div></div></section>
<section class="targets"><h2 class="h2">The targets</h2><div class="t-grid">{targets}</div></section>
<section class="contribute"><h2 class="h2">How can you contribute to this goal</h2><hr class="divider"><div class="todo-wrap">{todos}</div></section>
<section class="related"><div class="container"><h2 class="h3">EXPLORE OTHER GOALS &gt;&gt;</h2><hr class="divider"><div class="grid">{''.join(goal_card(x, 2) for x in rel)}</div>
</div></section>
<section class="section news-band"><div class="container">{news_block(f"data/news/goal-{n}.json", 20, "Live SDG News", "news")}</div></section>"""
    p += footer(2) + fab() + scripts(2, '<script src="../../assets/vendor/react.min.js"></script><script src="../../assets/vendor/react-dom.min.js"></script><script type="module" src="../../assets/hero-mount.js"></script>')
    write(f"global_goals/goal-{n}/index.html", p)


# ---------------------------------------------------------------- legal
def build_legal():
    for it in legal:
        date = ""
        if it.get("date"):
            from datetime import datetime
            date = datetime.fromisoformat(it["date"].replace("Z", "+00:00")).strftime("%B %-d, %Y")
        p = head(it["title"], 2, it["title"]) + nav(2)
        p += f'<main class="legal"><h1 class="h2" style="font-size:clamp(36px,6vw,72px)">{esc(it["title"])}</h1><p class="date">Last updated: {esc(date)}</p><div class="cms">{it["content"]}</div></main>'
        p += footer(2) + scripts(2)
        write(f"legal/{it['slug']}/index.html", p)


if __name__ == "__main__":
    build_home()
    build_goals_list()
    for g in goals:
        build_goal(g)
    build_legal()
    print("built", len(goals), "goal pages")
