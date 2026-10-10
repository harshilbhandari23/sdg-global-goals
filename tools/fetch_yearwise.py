#!/usr/bin/env python3
"""Keep the "Progress over the years" wheel in step with the SDSN Sustainable Development Report.

SDSN (the group behind the SDG Index) publishes one spreadsheet per edition on https://dashboards.sdgindex.org/downloads/
(database_<year>.xlsx). Its "Backdated SDG Index" sheet holds every country's normalised indicator scores (0-100) for each
year. For each goal we average that goal's indicators per country, then average the countries -> one 0-100 score per goal per year.

This script finds the newest edition on the downloads page, skips the download when the file has not changed since last
time (ETag / Last-Modified in data/yearwise-meta.json), and rewrites data/yearwise.json. When SDSN publishes a new edition
with a new year, that year appears on the wheel by itself. If anything looks wrong the existing files are kept.
Standard library only; GitHub Actions runs it before building (.github/workflows/pages.yml).
"""
import json, os, re, sys, tempfile, urllib.request, zipfile, collections
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
PAGE = "https://dashboards.sdgindex.org/downloads/"
BASE = "https://dashboards.sdgindex.org"
FIRST_YEAR = 2015
SHEET = "Backdated SDG Index"
UA = {"User-Agent": "Mozilla/5.0 (sdg-site yearwise updater)"}
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
M = "{%s}" % NS["m"]
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def get(url, method="GET", timeout=120):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA, method=method), timeout=timeout)


def col(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1


def read_sheet(path):
    z = zipfile.ZipFile(path)
    ss = ["".join(t.text or "" for t in si.iter(M + "t")) for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
    rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    target = None
    for s in ET.fromstring(z.read("xl/workbook.xml")).find("m:sheets", NS):
        if s.get("name") == SHEET:
            target = rels[s.get(RNS)]
    if not target:
        raise RuntimeError("sheet '%s' not found" % SHEET)
    hdr, rows = None, []
    for _, el in ET.iterparse(z.open("xl/" + target.replace("/xl/", "").lstrip("/"))):
        if el.tag == M + "row":
            r = {}
            for c in el:
                v = c.find("m:v", NS)
                if v is not None:
                    r[col(c.get("r"))] = ss[int(v.text)] if c.get("t") == "s" else v.text
            if hdr is None:
                hdr = r
            else:
                rows.append(r)
            el.clear()
    return hdr, rows


def compute(hdr, rows):
    year_i = next(i for i, n in hdr.items() if n == "year")
    goal_cols = collections.defaultdict(list)
    for i, n in hdr.items():
        m = re.match(r"n_sdg(\d+)_", n)
        if m:
            goal_cols[int(m.group(1))].append(i)
    if sorted(goal_cols) != list(range(1, 18)):
        raise RuntimeError("expected indicators for goals 1-17, got %s" % sorted(goal_cols))
    acc = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in rows:
        y = r.get(year_i)
        if not y:
            continue
        for g, cs in goal_cols.items():
            v = [float(r[c]) for c in cs if c in r]
            if v:
                acc[int(float(y))][g].append(sum(v) / len(v))
    out = []
    for y in sorted(acc):
        if y < FIRST_YEAR:
            continue
        if any(len(acc[y][g]) < 100 for g in range(1, 18)):   # too few countries reporting: not a finished year
            continue
        out.append({"year": str(y), "values": [round(sum(acc[y][g]) / len(acc[y][g]), 1) for g in range(1, 18)]})
    return out


def main():
    meta_path = os.path.join(ROOT, "yearwise-meta.json")
    try:
        meta = json.load(open(meta_path))
    except Exception:
        meta = {}
    try:
        page = get(PAGE, timeout=60).read().decode("utf8", "replace")
        files = sorted(set(re.findall(r"/static/downloads/database_(\d{4})\.xlsx", page)))
        if not files:
            raise RuntimeError("no database_<year>.xlsx link on the downloads page")
        edition = files[-1]
        url = "%s/static/downloads/database_%s.xlsx" % (BASE, edition)
        h = get(url, "HEAD", 60).headers
        sig = [edition, h.get("ETag"), h.get("Last-Modified"), h.get("Content-Length")]
        if meta.get("signature") == sig and os.path.exists(os.path.join(ROOT, "yearwise.json")):
            print("yearwise: SDSN %s unchanged, nothing to do" % edition); return
        tmp = os.path.join(tempfile.mkdtemp(), "db.xlsx")
        with get(url, timeout=300) as r, open(tmp, "wb") as f:
            while True:
                b = r.read(1 << 20)
                if not b: break
                f.write(b)
        out = compute(*read_sheet(tmp))
        if len(out) < 5 or out[0]["year"] != str(FIRST_YEAR):
            raise RuntimeError("only %d usable years" % len(out))
    except Exception as e:
        print("yearwise: kept existing data (%s)" % e); return
    json.dump(out, open(os.path.join(ROOT, "yearwise.json"), "w"), indent=1)
    os.makedirs(os.path.join(ROOT, "yearwise"), exist_ok=True)
    for d in out:
        json.dump(d, open(os.path.join(ROOT, "yearwise", d["year"] + ".json"), "w"), indent=1)
    json.dump({"signature": sig, "edition": edition, "latest_year": out[-1]["year"], "source": url,
               "method": "Average of SDSN indicator scores (0-100) per goal, then average across countries",
               "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d")}, open(meta_path, "w"), indent=1)
    print("yearwise: SDSN %s -> %d years (%s-%s)" % (edition, len(out), out[0]["year"], out[-1]["year"]))


if __name__ == "__main__":
    main()
