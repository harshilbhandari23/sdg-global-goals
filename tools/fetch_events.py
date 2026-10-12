#!/usr/bin/env python3
"""Copy the 'Events' block from each goal page on https://sdgs.un.org/goals/goalN (the UN's own list of events related to
that goal) into data/events/goal-N.json. The site shows this list in a popup. No API key needed; GitHub Actions runs it every
3 hours before building (.github/workflows/pages.yml). If a page cannot be read, the previous file is kept."""
import html, json, os, re, urllib.request
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "events")
UA = {"User-Agent": "Mozilla/5.0 (sdg-global-goals site; contact harshilbhandari22@gmail.com)"}


def text(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or ""))).strip()


def parse(page):
    out = []
    for blk in re.findall(r'<div class="card card-events.*?(?=<div class="card card-events|</div>\s*</div>\s*<footer|$)', page, re.S):
        href = re.search(r'<a href="(/events/[^"]+)"', blk)
        title = re.search(r'class="event-title">(.*?)</h4>', blk, re.S)
        if not (href and title):
            continue
        g = lambda c: text((re.search(r'class="%s">(.*?)</(?:span|p)>' % c, blk, re.S) or [None, ""])[1])
        out.append({"title": text(title.group(1)), "url": "https://sdgs.un.org" + href.group(1), "day": g("event-day"), "month": g("event-date"),
                    "range": g("event-range"), "place": text((re.search(r'class="room">(.*?)</span>', blk, re.S) or [None, ""])[1])})
    return out


def main():
    os.makedirs(ROOT, exist_ok=True)
    ok = 0
    for n in range(1, 18):
        try:
            page = urllib.request.urlopen(urllib.request.Request("https://sdgs.un.org/goals/goal%d" % n, headers=UA), timeout=40).read().decode("utf8", "replace")
            ev = parse(page)
            if not ev:
                raise RuntimeError("no events found")
        except Exception as e:
            print("events: goal %d kept existing (%s)" % (n, e)); continue
        json.dump({"updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"), "goal": n, "events": ev}, open(os.path.join(ROOT, "goal-%d.json" % n), "w"), indent=1, ensure_ascii=False)
        ok += 1
    print("events: updated %d of 17 goals" % ok)


if __name__ == "__main__":
    main()
