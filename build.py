#!/usr/bin/env python3
"""Builds the static SDG site (plain HTML/CSS/JS) from data/*.json.

    python3 build.py        -> writes index.html, global_goals/, legal/ next to this file

All content lives in data/ (goals.json, yearwise.json, legal.json). Edit those files
(or the Decap CMS in /admin, if you enable it) and run build.py again.
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
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
<link rel="stylesheet" href="{r}assets/styles.css">{extra_css}
<script>window.SITE_ROOT="{r}";</script></head><body>"""


def nav(depth, current=""):
    r = "../" * depth
    items = [("Home", f"{r}index.html", "home"), ("Goals", f"{r}global_goals/", "goals"), ("Progress", f"{r}index.html#years", ""),
             ("Map", f"{r}index.html#map", ""), ("News", f"{r}index.html#news", ""), ("Quiz", f"{r}index.html#quiz", "")]
    links = "".join(f'<a href="{h}"{" aria-current=page" if k and k == current else ""}>{t}</a>' for t, h, k in items)
    return f'<nav class="nav" aria-label="Main">{links}</nav>'


def fab():
    return ('<div class="sdg-fab"><div class="sdg-pop" role="dialog" aria-label="Choose a goal"><div class="wheel-links"></div></div>'
            '<button class="toggle" type="button" aria-label="Open the goals wheel" aria-expanded="false"></button></div>')


def footer(depth):
    r = "../" * depth
    return (f'<footer class="site"><div class="row"><div class="h3" style="color:#fff">Global Goals</div><div style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start">'
            f'<a href="{r}global_goals/">All goals</a><a href="{r}legal/privacy-policy/">Privacy policy</a><a href="{r}legal/terms-of-use/">Terms of use</a></div></div>'
            f'<p class="copy">© Global Goals. Content for educational use.</p></footer>')


def scripts(depth, extra=""):
    r = "../" * depth
    return (f'<script src="{r}assets/sdg-data.js"></script><script src="{r}assets/ui.js"></script><script src="{r}assets/widgets.js"></script>{extra}</body></html>')


def news_block(endpoint, limit=5, title="Live SDG News", ident="news"):
    return f"""<section class="news" id="{ident}" data-endpoint="{esc(endpoint)}" data-limit="{limit}" aria-label="{esc(title)}">
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


# ---------------------------------------------------------------- home
def build_home():
    mosaic = "".join(
        f'<img src="assets/media/{MOSAIC[n]}.png" alt="" style="left:{x}%;top:{y}%;animation-delay:{(n * 0.7) % 6:.1f}s">'
        for n, (x, y) in zip(range(1, 18), MOSAIC_POS))
    p = head("Sustainable Development Goals", 0, "Your lens into the 17 Sustainable Development Goals.")
    p += nav(0, "home")
    p += f"""<header class="home-hero"><div class="mosaic" aria-hidden="true">{mosaic}</div>
<div class="hero-copy"><p class="kicker">Global progression</p><h1 class="h1">Sustainable<br>Development<br>Goals</h1>
<p class="body-24" style="margin:0 0 28px">Your lens into the 17 goals that shape our shared future.</p>
<a class="btn" href="#explore">Let's Explore ↓</a><div class="un-mark">United Nations</div></div></header>

<section class="wheel-section" id="explore"><div class="wheel-wrap"><div class="wheel-links"></div></div>
<p class="scroll-text" data-start="rgba(9,9,9,.56)" data-end="#080a07">The United Nations brings countries together to work on shared global challenges through cooperation, research and collective action. It supports peace, fairness and long-term development, while helping define how progress is measured across the world. At its core, it creates a common direction for nations to move forward together and stay accountable to shared priorities</p></section>

<section class="years-section" id="years" style="background-image:url('assets/media/fhz7HQj75koriiRE2riVt1GtXQ8.png')">
<h2 class="h2">progress over the years</h2><div class="yw" data-start="2020" role="group" aria-label="SDG progress by year. Drag the wheel or use the arrow keys."></div>
<p class="hint">Drag the wheel to change the year ›</p></section>

<section class="map-section" id="map"><h2 class="h2">See where your country stands</h2>
<div class="kiosk" data-idle="60"><div class="mapwrap"><svg viewBox="0 0 914.55 603" preserveAspectRatio="xMidYMid meet" aria-label="World map"></svg>
<div class="mapmsg" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#666">Loading map…</div><div class="info" hidden></div></div>
<p class="prompt">Tap a goal below to see it on the map.</p><div class="goalrow"></div>
<div class="legend"><span><i style="background:#5cb85c"></i>On track / achieved</span><span><i style="background:#f0ab00"></i>Challenges remain</span><span><i style="background:#ef7d00"></i>Significant challenges</span><span><i style="background:#c0392b"></i>Major challenges</span><span><i style="background:#c8c8c8"></i>Information unavailable</span></div></div></section>

<section class="section" id="news"><div class="container">{news_block("https://sdg-middleware.vercel.app/api/news-goal?goal=1&limit=10", 8, "Live SDG News", "livenews")}</div></section>

<section class="section" id="quiz" style="background:#fff"><div class="container"><h2 class="h2" style="text-align:center;margin-bottom:32px">Create your world's to-do list</h2>
<div class="quiz"><div class="bgL"></div><div class="bgR"></div><div class="qhead"><h4>Create Your World's To-Do List</h4><p class="qcount" style="margin:0;font-weight:600"></p></div><div class="stage"></div></div></div></section>
"""
    p += footer(0) + fab()
    p += scripts(0, '<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script><script src="https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js"></script><script src="assets/map.js"></script>')
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
<main class="section" style="padding:96px 0"><div class="goal-grid" style="max-width:1400px;margin:0 auto">{cards}</div></main>
<section class="section"><div class="container" style="max-width:var(--max)"><h2 class="h2" style="margin-bottom:40px">faq</h2>{faq}</div></section>"""
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
<section class="intro"><div class="container"><span class="pill" style="align-self:flex-start"><span class="pill-20">ABOUT THE GOAL</span></span>
<p class="scroll-text body-56" data-start="rgba(9,9,9,.56)" data-end="{esc(c)}">{esc(g['intro'])}</p></div></section>
<section class="metrics"><div class="inner"><hr class="divider"><p class="body-32" style="max-width:1200px">We work best with people who have taste, opinions, and a clear sense of where they’re going. We’re here to shape that into a brand that feels polished without losing its edge.</p>
<div class="row"><div class="metric"><div class="num" data-count="{len(g['targets'])}">0</div><div class="lab">Targets</div></div><div class="metric"><div class="num" data-count="319">0</div><div class="lab">Events</div></div><div class="metric"><div class="num" data-count="38">0</div><div class="lab">Publications</div></div><div class="metric"><div class="num" data-count="1927">0</div><div class="lab">Actions</div></div></div></div></section>
<section class="targets"><h2 class="h2">The targets</h2><div class="t-grid">{targets}</div></section>
<section class="contribute"><h2 class="h2">How can you contribute to this goal</h2><hr class="divider"><div class="todo-wrap">{todos}</div></section>
<section class="related"><div class="container"><h2 class="h3">EXPLORE OTHER GOALS &gt;&gt;</h2><hr class="divider"><div class="grid">{''.join(goal_card(x, 2) for x in rel)}</div>
<div class="related-news">{news_block(f"https://sdg-middleware.vercel.app/api/news-goal?goal={n}&limit=10", 5, "Live SDG News", "news")}</div></div></section>"""
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
