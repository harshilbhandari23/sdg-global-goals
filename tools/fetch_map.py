#!/usr/bin/env python3
"""Keep the "Progress across nations" map on the newest SDSN Sustainable Development Report.

SDSN publishes one spreadsheet per edition on https://dashboards.sdgindex.org/downloads/ (database_<year>.xlsx). Its
"SDR<year> Data" sheet has, for every country and goal, the goal score, the dashboard colour (green / yellow / orange / red) and the
trend arrow. This script finds the newest edition, skips the download when the file has not changed (ETag / Last-Modified in
data/map/meta.json), and writes data/map/goal-1.json ... goal-17.json in the same shape the map used to get from the old API
(countries[], noData[], source) plus data/country/countries.json (score, rank, region and the 17 trend arrows per country, for the
"See where your country stands" section). The pages read these files first. If anything looks wrong the existing files are kept.
Standard library only; GitHub Actions runs it before building (.github/workflows/pages.yml).
"""
import json, os, re, sys, tempfile
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_yearwise as fy  # noqa: E402  (shares the downloader and the spreadsheet reader)

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "map")
CROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "country")
LEVEL = {"green": "On Track", "yellow": "Challenges Remain", "orange": "Significant Challenges", "red": "Major Challenges"}
TREND = {"↑": "Improving", "➚": "Moderately Improving", "→": "Stagnating", "↓": "Decreasing"}


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def build(hdr, rows, edition):
    idx = {n: i for i, n in hdr.items()}
    need = ["Country Code ISO3", "country", "Regions used for the SDR"] + ["Goal %d %s" % (g, k) for g in range(1, 18) for k in ("Score", "Dash", "Trend")]
    missing = [n for n in need if n not in idx]
    if missing:
        raise RuntimeError("columns missing: %s" % missing[:4])
    score_i = next((i for n, i in idx.items() if re.match(r"\d{4} SDG Index Score$", n)), None)
    rank_i = next((i for n, i in idx.items() if re.match(r"\d{4} SDG Index Rank$", n)), None)
    if score_i is None or rank_i is None:
        raise RuntimeError("overall score / rank columns not found")
    out = {}
    for g in range(1, 18):
        have, nodata = [], []
        for r in rows:
            name, iso = r.get(idx["country"]), r.get(idx["Country Code ISO3"]) or ""
            if not name or not re.match(r"[A-Z]{3}$", iso):   # skips the region / income-group rows (codes start with "_")
                continue
            region = r.get(idx["Regions used for the SDR"]) or ""
            sc = num(r.get(idx["Goal %d Score" % g]))
            dash = (r.get(idx["Goal %d Dash" % g]) or "").lower()
            if sc is None or dash not in LEVEL:
                nodata.append({"country": name, "region": region, "note": "No data available"})
                continue
            tr = r.get(idx["Goal %d Trend" % g]) or ""
            have.append({"country": name, "region": region,
                         "overallRank": int(num(r.get(rank_i))) if num(r.get(rank_i)) is not None else None,
                         "overallScore": round(num(r.get(score_i)) or 0, 2),
                         "development": {"goalScore": round(sc, 2), "goalRating": dash, "developmentLevel": LEVEL[dash],
                                         "trend": tr, "trendLabel": TREND.get(tr, "Unknown")}})
        have.sort(key=lambda c: -c["development"]["goalScore"])
        for k, c in enumerate(have, 1):
            c["goalRank"] = k
        if len(have) < 100:
            raise RuntimeError("goal %d: only %d countries with data" % (g, len(have)))
        out[g] = {"goal": g, "totalRanked": len(have), "totalNoData": len(nodata), "countries": have, "noData": nodata,
                  "source": "SDSN Sustainable Development Report %s" % edition}
    # one record per country for the "See where your country stands" section
    countries = []
    for r in rows:
        name, iso = r.get(idx["country"]), r.get(idx["Country Code ISO3"]) or ""
        if not name or not re.match(r"[A-Z]{3}$", iso):
            continue
        sc, rk = num(r.get(score_i)), num(r.get(rank_i))
        if sc is None or rk is None:
            continue
        countries.append({"country": name, "region": r.get(idx["Regions used for the SDR"]) or "", "score": round(sc, 1), "rank": int(rk),
                          "trends": [(r.get(idx["Goal %d Trend" % g]) or "?") for g in range(1, 18)]})
    countries.sort(key=lambda c: c["rank"])
    out["countries"] = {"edition": edition, "total": len(countries), "countries": countries}
    return out


def main():
    meta_path = os.path.join(ROOT, "meta.json")
    try:
        meta = json.load(open(meta_path))
    except Exception:
        meta = {}
    try:
        page = fy.get(fy.PAGE, timeout=60).read().decode("utf8", "replace")
        files = sorted(set(re.findall(r"/static/downloads/database_(\d{4})\.xlsx", page)))
        if not files:
            raise RuntimeError("no database_<year>.xlsx link on the downloads page")
        edition = files[-1]
        url = "%s/static/downloads/database_%s.xlsx" % (fy.BASE, edition)
        h = fy.get(url, "HEAD", 60).headers
        sig = [edition, h.get("ETag"), h.get("Last-Modified"), h.get("Content-Length")]
        if meta.get("signature") == sig and os.path.exists(os.path.join(ROOT, "goal-1.json")) and os.path.exists(os.path.join(CROOT, "countries.json")):
            print("map: SDSN %s unchanged, nothing to do" % edition); return
        tmp = os.path.join(tempfile.mkdtemp(), "db.xlsx")
        with fy.get(url, timeout=300) as r, open(tmp, "wb") as f:
            while True:
                b = r.read(1 << 20)
                if not b: break
                f.write(b)
        fy.SHEET = "SDR%s Data" % edition
        out = build(*fy.read_sheet(tmp), edition)
    except Exception as e:  # noqa: BLE001
        print("map: kept existing data (%s)" % e); return
    os.makedirs(ROOT, exist_ok=True)
    cdata = out.pop("countries")
    os.makedirs(CROOT, exist_ok=True)
    json.dump(cdata, open(os.path.join(CROOT, "countries.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    for g, d in out.items():
        json.dump(d, open(os.path.join(ROOT, "goal-%d.json" % g), "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"signature": sig, "edition": edition, "source": url, "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d")}, open(meta_path, "w"), indent=1)
    print("map: SDSN %s -> 17 goals, %d countries on goal 1, %d ranked countries" % (edition, out[1]["totalRanked"], cdata["total"]))


if __name__ == "__main__":
    main()
