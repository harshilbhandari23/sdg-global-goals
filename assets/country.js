/* Country kiosk: A-Z picker, country outline, score and rank, 17-goal trend dashboard (from the Framer SdgKiosk component). */
(function () {
  var root = document.querySelector(".cx");
  if (!root || !window.d3 || !window.topojson) return;
  var API = "https://sdg-middleware.vercel.app/api/score-change?country=";
  var TOPO = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
  var COUNTRIES = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua & Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Brazil","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic","DR Congo","Denmark","Djibouti","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Samoa","San Marino","São Tomé & Príncipe","Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad & Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];
  /* names in the world atlas that differ from the list above */
  var ATLAS = { "Antigua & Barbuda": "Antigua and Barb.", "Bosnia & Herzegovina": "Bosnia and Herz.", "Brunei Darussalam": "Brunei", "Central African Republic": "Central African Rep.", "Czech Republic": "Czechia", "DR Congo": "Dem. Rep. Congo", "Dominican Republic": "Dominican Rep.", "Equatorial Guinea": "Eq. Guinea", "Eswatini": "eSwatini", "Solomon Islands": "Solomon Is.", "South Sudan": "S. Sudan", "São Tomé & Príncipe": "São Tomé and Principe", "Trinidad & Tobago": "Trinidad and Tobago", "United States": "United States of America", "Marshall Islands": "Marshall Is.", "Timor-Leste": "Timor-Leste", "North Macedonia": "North Macedonia" };
  var TREND = { "↑": ["#3aa746", "On Track"], "↓": ["#db1a36", "Decreasing"], "→": ["#e87c1e", "Stagnating"], "➚": ["#ebc011", "Moderately Improving"], "?": ["#939598", "Unknown"] };
  var $ = function (s) { return root.querySelector(s); };
  var nav = $(".cx-az"), drop = $(".cx-drop"), nameEl = $(".cx-name"), regionEl = $(".cx-region"), svg = $(".cx-map svg"), scoreEl = $(".cx-score"), rankEl = $(".cx-rank"), dash = $(".cx-goals");
  var current = root.dataset.country || "Afghanistan", active = null, features = null, cache = {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* A-Z letters */
  var letters = {}; COUNTRIES.forEach(function (c) { letters[c[0].toUpperCase()] = 1; });
  nav.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(function (l) { return '<button type="button" data-l="' + l + '"' + (letters[l] ? "" : " disabled") + ' aria-label="Countries starting with ' + l + '">' + l + "</button>"; }).join("");
  function closeDrop() { active = null; drop.hidden = true; Array.prototype.forEach.call(nav.children, function (b) { b.classList.remove("on"); }); }
  nav.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || b.disabled) return;
    if (active === b.dataset.l) return closeDrop();
    closeDrop(); active = b.dataset.l; b.classList.add("on");
    drop.innerHTML = COUNTRIES.filter(function (c) { return c[0].toUpperCase() === active; }).map(function (c) { return '<button type="button" role="option"' + (c === current ? ' class="sel"' : "") + ' data-c="' + esc(c) + '">' + esc(c) + "</button>"; }).join("");
    drop.hidden = false;
  });
  drop.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { closeDrop(); show(b.dataset.c); } });
  document.addEventListener("mousedown", function (e) { if (active && !root.querySelector(".cx-pick").contains(e.target)) closeDrop(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrop(); });

  /* dashboard tiles */
  var base = window.SITE_ROOT || "";
  dash.innerHTML = Array.apply(null, Array(17)).map(function (_, i) { var n = i + 1; return '<div class="cx-g" data-g="' + n + '"><img src="' + base + "assets/tiles/goal-" + String(n).padStart(2, "0") + '.jpg" alt="SDG ' + n + '" loading="lazy"><span class="tr" aria-label="Unknown">•</span></div>'; }).join("");

  /* world outline */
  fetch(TOPO).then(function (r) { return r.json(); }).then(function (w) { features = topojson.feature(w, w.objects.countries).features; drawMap(); }).catch(function () { drawMap(); });
  function find(name) {
    if (!features) return null;
    var want = (ATLAS[name] || name).toLowerCase();
    return features.filter(function (f) { return (f.properties.name || "").toLowerCase() === want; })[0] ||
      features.filter(function (f) { var n = (f.properties.name || "").toLowerCase(); return n.indexOf(want) === 0 || want.indexOf(n) === 0; })[0] || null;
  }
  function drawMap() {
    var f = find(current);
    if (!features) { svg.innerHTML = '<text x="350" y="250" text-anchor="middle" fill="#9aa">Loading map…</text>'; return; }
    if (!f) { svg.innerHTML = '<text x="350" y="250" text-anchor="middle" fill="#8a96a3" font-size="18">Too small to show on this map</text>'; return; }
    var proj = d3.geoNaturalEarth1().fitExtent([[24, 24], [676, 476]], f);
    svg.innerHTML = '<path d="' + d3.geoPath(proj)(f) + '" fill="#009edb"/>';
  }

  /* data */
  function setNum(el, v) { el.textContent = v; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  function paint(d) {
    regionEl.textContent = d.region || "";
    setNum(scoreEl, d.overallScore != null ? Number(d.overallScore).toFixed(1) : "—");
    setNum(rankEl, d.overallRank != null ? d.overallRank : "—");
    var byGoal = {}; (d.goalTrends || []).forEach(function (g) { byGoal[g.goal] = g.trend; });
    Array.prototype.forEach.call(dash.children, function (el, i) {
      var t = TREND[byGoal[i + 1]] ? byGoal[i + 1] : "?", span = el.querySelector(".tr");
      span.textContent = t === "?" ? "•" : t; span.style.color = TREND[t][0]; span.setAttribute("aria-label", TREND[t][1]);
    });
  }
  function show(name) {
    current = name; nameEl.textContent = name; regionEl.textContent = "Loading…"; drawMap();
    var tok = show.tok = (show.tok || 0) + 1;
    (cache[name] ? Promise.resolve(cache[name]) : fetch(API + encodeURIComponent(name)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { cache[name] = d; return d; }))
      .then(function (d) { if (tok === show.tok) paint(d); })
      .catch(function () { if (tok !== show.tok) return; regionEl.textContent = "Data not available."; scoreEl.textContent = rankEl.textContent = "—"; });
  }
  show(current);
})();
