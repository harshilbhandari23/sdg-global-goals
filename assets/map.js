/* World map kiosk: pick a goal, see every country coloured by its SDSN rating.
   Areas without an SDSN rating fall back to the UN SDG API indicator for that goal. */
(function () {
  var root = document.querySelector(".kiosk");
  if (!root || !window.d3 || !window.topojson) return;
  var S = window.SDG;
  var API = root.dataset.api || "https://sdg-middleware.vercel.app/api/goal-rankings";
  var TOPO = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
  var UN_API = "https://unstats.un.org/SDGAPI/v1/sdg/Series/Data";
  var IDLE = +(root.dataset.idle || 60) * 1000;

  var ALIASES = {"United States of America":"United States","Dem. Rep. Congo":"Congo, Dem. Rep.","Congo":"Congo, Rep.","Dominican Rep.":"Dominican Republic","Russia":"Russian Federation","Bahamas":"Bahamas, The","Venezuela":"Venezuela, RB","Côte d'Ivoire":"Cote d'Ivoire","Central African Rep.":"Central African Republic","Eq. Guinea":"Equatorial Guinea","Gambia":"Gambia, The","Laos":"Lao PDR","North Korea":"Korea, Dem. Rep.","South Korea":"Korea, Rep.","Kyrgyzstan":"Kyrgyz Republic","Iran":"Iran, Islamic Rep.","Syria":"Syrian Arab Republic","Turkey":"Türkiye","Solomon Is.":"Solomon Islands","Brunei":"Brunei Darussalam","Slovakia":"Slovak Republic","Yemen":"Yemen, Rep.","Egypt":"Egypt, Arab Rep.","Bosnia and Herz.":"Bosnia and Herzegovina","Macedonia":"North Macedonia","S. Sudan":"South Sudan","W. Sahara":"Western Sahara","Antigua and Barb.":"Antigua and Barbuda","Saint Lucia":"St. Lucia","St. Vin. and Gren.":"St. Vincent and the Grenadines","São Tomé and Principe":"Sao Tome and Principe","Marshall Is.":"Marshall Islands","Cabo Verde":"Cabo Verde"};
  var PARENT = {"Greenland":"Denmark","Puerto Rico":"United States","Falkland Is.":"United Kingdom","New Caledonia":"France","Fr. S. Antarctic Lands":"France","Somaliland":"Somalia"};
  var NOT_RANKED = {"W. Sahara":"Disputed territory. Not ranked.","Kosovo":"Not included in the SDSN ranking.","Antarctica":"No permanent population. Not ranked.","Taiwan":"Not included in the SDSN ranking.","Palestine":"Not included in the SDSN ranking.","Libya":"No data available in the SDSN report.","Eritrea":"No data available in the SDSN report.","N. Cyprus":"Not ranked separately."};
  var AREA_CODES = {"Kosovo":412,"W. Sahara":732};
  var RATING = {green:"#5cb85c",yellow:"#f0ab00",orange:"#ef7d00",red:"#c0392b"};
  var NO_DATA = "#e8e8e8", UNAVAILABLE = "#c8c8c8";
  var UN = {
    1:{code:"SI_COV_BENFTS",label:"Population covered by social protection",unit:"%",dims:{Sex:"BOTHSEX"}},
    3:{code:"SH_DYN_MORT",label:"Under-5 mortality",unit:" per 1,000 live births",dims:{Age:"<5Y",Sex:"BOTHSEX"}},
    4:{code:"SE_PRE_PARTN",label:"Pre-primary participation",unit:"%",dims:{Sex:"BOTHSEX"}},
    5:{code:"SG_GEN_PARL",label:"Seats held by women in parliament",unit:"%",dims:{Sex:"FEMALE"}},
    6:{code:"SH_SAN_SAFE",label:"Safely managed sanitation",unit:"%",dims:{Location:"ALLAREA"}},
    7:{code:"EG_ACS_ELEC",label:"Population with electricity",unit:"%",dims:{Location:"ALLAREA"}},
    8:{code:"NY_GDP_PCAP",label:"GDP per capita growth",unit:"% a year",dims:{}},
    9:{code:"IT_NET_BBND",label:"Fixed broadband subscriptions",unit:" per 100 people",dims:{"Type of speed":"ANYS"}},
    10:{code:"SI_RMT_COST",label:"Cost of sending remittances",unit:"% of amount",dims:{}},
    11:{code:"EN_ATM_PM25",label:"Fine particulate (PM2.5) pollution",unit:" µg/m³",dims:{Location:"ALLAREA"}},
    13:{code:"EN_ATM_CO2MVA",label:"CO₂ per unit of manufacturing value added",unit:" kg per USD",dims:{Activity:"ISIC4_C"}},
    14:{code:"ER_MRN_MPA",label:"Marine area protected",unit:"%",dims:{}},
    15:{code:"AG_LND_FRST",label:"Forest area",unit:"% of land",dims:{}},
    16:{code:"VC_IHR_PSRC",label:"Homicide rate",unit:" per 100,000",dims:{Sex:"BOTHSEX"}},
    17:{code:"IT_USE_ii99",label:"Individuals using the internet",unit:"%",dims:{Sex:"BOTHSEX"}}
  };
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function fetchJSON(url, n) {
    n = n || 3;
    return fetch(url).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).catch(function (e) {
      if (n <= 1) throw e; return new Promise(function (res) { setTimeout(res, 600); }).then(function () { return fetchJSON(url, n - 1); });
    });
  }

  var svg = root.querySelector("svg"), info = root.querySelector(".info"), prompt = root.querySelector(".prompt"), row = root.querySelector(".goalrow");
  var proj = d3.geoNaturalEarth1().scale(160).translate([457, 285]), gen = d3.geoPath(proj);
  var active = null, status = "idle", countryMap = new Map(), features = [], paths = [], selected = null, hovered = null, last = Date.now();
  var dataCache = {}, unCache = {}, unToken = 0;

  S.names.forEach(function (n, i) {
    var b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", "SDG " + (i + 1) + ": " + n); b.setAttribute("aria-pressed", "false");
    b.innerHTML = '<img src="' + S.tile(i + 1) + '" alt="" draggable="false">';
    b.addEventListener("click", function () { touch(); selected = null; if (active === i + 1 && status !== "error") setGoal(null); else setGoal(i + 1); });
    row.appendChild(b);
  });
  var btns = row.querySelectorAll("button");

  function resolve(name) {
    var d = countryMap.get(norm(name)) || (ALIASES[name] ? countryMap.get(norm(ALIASES[name])) : null);
    if (d) return { rec: d, parent: null };
    if (PARENT[name]) { var p = countryMap.get(norm(PARENT[name])); if (p) return { rec: p, parent: PARENT[name] }; }
    return { rec: null, parent: null };
  }
  function colorOf(rec) {
    if (!rec) return UNAVAILABLE;
    var r = (rec.development && rec.development.goalRating || rec.goalRating || "").toLowerCase();
    return RATING[r] || NO_DATA;
  }
  function textOf(rec) {
    var dev = rec.development;
    if (dev && dev.developmentLevel) {
      var s = typeof dev.goalScore === "number" ? " · Score " + Math.round(dev.goalScore * 10) / 10 : "";
      var t = dev.trendLabel && dev.trendLabel !== "Unknown" ? " · " + dev.trendLabel : "";
      return dev.developmentLevel + s + t + (rec.goalRank ? " · Rank #" + rec.goalRank : "");
    }
    return "Data available";
  }
  function paint() {
    paths.forEach(function (p, i) {
      p.setAttribute("fill", active && status === "ready" ? colorOf(resolve(features[i].properties.name).rec) : NO_DATA);
      p.classList.toggle("sel", selected === features[i]);
    });
    prompt.textContent = status === "error" ? "Couldn't load SDG " + active + ". Tap the goal again to retry." : status === "loading" ? "Loading SDG " + active + "…" : active ? "SDG " + active + ": " + S.names[active - 1] : "Tap a goal below to see it on the map.";
    btns.forEach(function (b, i) { var a = active === i + 1; b.classList.toggle("active", a); b.setAttribute("aria-pressed", a); b.style.opacity = active && !a ? 0.55 : 1; });
    showInfo();
  }
  function pickUN(rows, cfg) {
    var ok = rows.filter(function (r) { var v = parseFloat(r && r.value); if (isNaN(v)) return false; var d = r.dimensions || {}; return Object.keys(cfg.dims).every(function (k) { return d[k] === cfg.dims[k]; }); })
      .sort(function (a, b) { return parseFloat(b.timePeriodStart) - parseFloat(a.timePeriodStart); });
    if (!ok.length) return null; var n = parseFloat(ok[0].value);
    return { label: cfg.label, value: (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10) + cfg.unit, year: Math.round(parseFloat(ok[0].timePeriodStart)) };
  }
  function showInfo() {
    var f = selected || hovered; if (!f) { info.hidden = true; return; }
    info.hidden = false; var name = f.properties.name, txt, color = NO_DATA;
    if (!active) txt = "Select a goal to see its status";
    else if (status === "loading") txt = "Loading…";
    else if (status !== "ready") txt = "Data unavailable";
    else {
      var r = resolve(name); color = colorOf(r.rec);
      if (r.rec) txt = (r.parent ? "Shown with " + r.parent + "'s rating · " : "") + textOf(r.rec);
      else {
        var note = NOT_RANKED[name] || "Information unavailable", cfg = UN[active];
        var area = AREA_CODES[name] != null ? AREA_CODES[name] : (f.id != null && !isNaN(+f.id) ? +f.id : null);
        txt = note;
        if (cfg && area != null) {
          var key = active + "|" + area;
          if (unCache[key] !== undefined) txt = note + (unCache[key] ? " · UN data: " + unCache[key].label + " " + unCache[key].value + " (" + unCache[key].year + ")" : " · UN data not available");
          else {
            txt = note + " · Loading UN data…"; var tok = ++unToken;
            fetchJSON(UN_API + "?seriesCode=" + cfg.code + "&areaCode=" + area + "&pageSize=500", 2).then(function (d) { unCache[key] = pickUN(d.data || [], cfg); }).catch(function () { unCache[key] = null; }).then(function () { if (tok === unToken) showInfo(); });
          }
        }
      }
    }
    info.innerHTML = '<div class="c"></div><div class="s"><span class="dot"></span><span class="t"></span></div>';
    info.querySelector(".c").textContent = name; info.querySelector(".dot").style.background = color; info.querySelector(".t").textContent = txt;
  }
  function setGoal(n) {
    active = n; selected = null; hovered = null;
    if (!n) { status = "idle"; countryMap = new Map(); paint(); return; }
    var key = API + "|" + n;
    function apply(list) {
      countryMap = new Map();
      list.forEach(function (it) { var nm = it.country || it.name || it.countryName; if (nm) countryMap.set(norm(nm), it); });
      status = "ready"; paint();
    }
    if (dataCache[key]) return apply(dataCache[key]);
    status = "loading"; paint();
    fetchJSON(API + "?goal=" + n).then(function (d) {
      if (active !== n) return; var list = Array.isArray(d) ? d : (d.countries || d.data || d.rankings || d.results || []); dataCache[key] = list; apply(list);
    }).catch(function () { if (active !== n) return; status = "error"; paint(); });
  }
  function touch() { last = Date.now(); }
  root.addEventListener("pointerdown", touch); root.addEventListener("pointermove", touch);
  /* a tap or click anywhere outside the map section resets it (goal and country selection cleared) */
  document.addEventListener("click", function (e) { if ((active || selected) && !root.contains(e.target)) setGoal(null); });
  if (IDLE > 0) setInterval(function () { if (Date.now() - last > IDLE && active) { setGoal(null); } }, 1000);

  fetchJSON(TOPO).then(function (world) {
    features = topojson.feature(world, world.objects.countries).features.map(function (f) { f.properties = Object.assign({}, f.properties, { name: f.properties && f.properties.name || "Unknown" }); return f; });
    features.forEach(function (f) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", gen(f) || ""); p.setAttribute("fill", NO_DATA);
      p.addEventListener("pointerdown", function (e) { e.stopPropagation(); touch(); selected = selected === f ? null : f; paint(); });
      p.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { hovered = f; showInfo(); } });
      p.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { hovered = null; showInfo(); } });
      svg.appendChild(p); paths.push(p);
    });
    root.querySelector(".mapmsg").style.display = "none"; paint();
  }).catch(function () { var m = root.querySelector(".mapmsg"); m.innerHTML = '<button class="btn" type="button">Map unavailable. Tap to retry</button>'; m.firstChild.onclick = function () { location.reload(); }; });
  svg.addEventListener("pointerdown", function (e) { if (e.target === svg) { selected = null; paint(); } });
  paint();
})();
