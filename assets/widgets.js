/* Year wheel, live news carousel, goal quiz. */
(function () {
  var S = window.SDG;
  var TILE_POS = [[80,0],[240,0],[80,80],[160,80],[320,80],[0,160],[80,160],[160,160],[240,160],[80,240],[160,240],[240,240],[320,240],[0,320],[80,320],[240,320],[160,400]];
  var TILE_COLORS = ["#EB1D2C","#D3A02A","#2D9B48","#C22033","#EF402A","#00ADD8","#FDB714","#8F1737","#F36D23","#E01483","#F99D25","#CF8D2A","#48773D","#027DBB","#3EAF49","#02558A","#193667"];
  var SHORT = ["NO POVERTY","ZERO HUNGER","GOOD HEALTH AND WELL-BEING","QUALITY EDUCATION","GENDER EQUALITY","CLEAN WATER AND SANITATION","AFFORDABLE AND CLEAN ENERGY","DECENT WORK AND ECONOMIC GROWTH","INDUSTRY, INNOVATION AND INFRASTRUCTURE","REDUCED INEQUALITIES","SUSTAINABLE CITIES AND COMMUNITIES","RESPONSIBLE CONSUMPTION AND PRODUCTION","CLIMATE ACTION","LIFE BELOW WATER","LIFE ON LAND","PEACE, JUSTICE AND STRONG INSTITUTIONS","PARTNERSHIPS FOR THE GOALS"];

  /* ===== year wheel: drag the ring like a dial, snaps to the nearest year ===== */
  var yw = document.querySelector(".yw");
  if (yw) fetch((window.SITE_ROOT || "") + "data/yearwise.json").then(function (r) { return r.json(); }).then(function (data) {
    var UPCOMING = ["2026", "2027", "2028", "2029", "2030"];  // shown greyed out: no data yet, not selectable
    var STEP = 360 / (data.length + UPCOMING.length), BASE = 1080, R = 370, cx = BASE * 0.54, cy = BASE * 0.5;
    var pos = Math.max(0, data.findIndex(function (d) { return d.year === (yw.dataset.start || "2020"); }));
    var stage = document.createElement("div"); stage.className = "yw-stage";
    var ring = '<svg width="640" height="640" viewBox="0 0 638 638" style="position:absolute;left:' + (cx - 320) + "px;top:" + (cy - 320) + 'px"><defs><linearGradient id="rg" x1="638" y1="285" x2="0" y2="352" gradientUnits="userSpaceOnUse"><stop offset=".95" stop-color="#E8E8E8"/><stop offset="1" stop-color="#009EDB"/></linearGradient></defs><circle cx="319" cy="319" r="318" fill="none" stroke="url(#rg)" stroke-width="2"/></svg>' +
      '<svg width="206" height="54" viewBox="0 0 206 54" style="position:absolute;left:' + (cx - R - 94) + "px;top:" + (cy - 27) + 'px"><defs><linearGradient id="pg" x1="0" y1="27" x2="206" y2="27" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset="1" stop-color="#009EDB"/></linearGradient></defs><rect x="1" y="1" width="204" height="52" rx="26" fill="none" stroke="url(#pg)" stroke-width="2"/></svg>';
    stage.innerHTML = ring;
    var labels = data.concat(UPCOMING.map(function (y) { return { year: y, off: true }; })).map(function (d, i) {
      var e = document.createElement("div"); e.className = "yr" + (d.off ? " off" : ""); e.textContent = d.year;
      if (d.off) { e.setAttribute("aria-disabled", "true"); e.title = "No data yet"; }
      else e.addEventListener("click", function () { if (!moved) { pos = i; render(); } });
      stage.appendChild(e); return e;
    });
    var tiles = document.createElement("div"); tiles.className = "tiles"; tiles.style.cssText = "left:" + (cx - 200) + "px;top:" + (cy - 240) + "px;width:400px;height:480px";
    var tileEls = TILE_POS.map(function (p, i) { var t = document.createElement("div"); t.className = "tile"; t.style.cssText = "left:" + p[0] + "px;top:" + p[1] + "px;background:" + TILE_COLORS[i]; t.innerHTML = "<b>" + (i + 1) + "</b><i>" + SHORT[i] + "</i><u></u>"; tiles.appendChild(t); return t; });
    stage.appendChild(tiles); yw.appendChild(stage);
    var live = document.createElement("div"); live.className = "visually-hidden"; live.setAttribute("aria-live", "polite"); yw.appendChild(live);

    function fit() { stage.style.transform = "scale(" + (yw.clientWidth / BASE) + ")"; }
    function clamp(p) { return Math.max(0, Math.min(data.length - 1, p)); }
    var lastSel = -1;
    function render() {
      var sel = clamp(Math.round(pos));
      labels.forEach(function (e, i) {
        var th = 180 + (i - pos) * STEP, rad = th * Math.PI / 180, near = Math.abs(i - pos);
        e.style.left = (cx + Math.cos(rad) * R) + "px"; e.style.top = (cy + Math.sin(rad) * R) + "px";
        e.style.transform = "translate(-50%,-50%) rotate(" + (th - 180) + "deg)";
        e.style.opacity = i >= data.length ? 0.2 : i === sel ? 1 : Math.max(0.25, 0.8 - near * 0.12);
      });
      if (sel !== lastSel) {
        lastSel = sel;
        tileEls.forEach(function (t, i) { t.querySelector("u").textContent = data[sel].values[i] != null ? data[sel].values[i] + " %" : ""; });
        live.textContent = "Year " + data[sel].year;
      }
    }
    var dragging = false, moved = false, last = 0;
    function ang(x, y) { var r = yw.getBoundingClientRect(); return Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * 180 / Math.PI; }
    yw.addEventListener("pointerdown", function (e) { dragging = true; moved = false; last = ang(e.clientX, e.clientY); });
    yw.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var a = ang(e.clientX, e.clientY), d = a - last; if (d > 180) d -= 360; if (d < -180) d += 360; last = a;
      if (!moved && Math.abs(d) < 0.5) return;
      if (!moved) { moved = true; yw.classList.add("drag"); try { yw.setPointerCapture(e.pointerId); } catch (_) {} }
      pos = clamp(pos - d / STEP); render();
    });
    function up() { if (!dragging) return; dragging = false; if (moved) { yw.classList.remove("drag"); pos = clamp(Math.round(pos)); render(); setTimeout(function () { moved = false; }, 0); } }
    yw.addEventListener("pointerup", up); yw.addEventListener("pointercancel", up);
    yw.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") { pos = clamp(Math.round(pos) - 1); render(); } if (e.key === "ArrowRight") { pos = clamp(Math.round(pos) + 1); render(); } });
    yw.tabIndex = 0;
    window.addEventListener("resize", fit); fit(); render();
  });

  /* ===== live news carousel ===== */
  document.querySelectorAll(".news").forEach(function (box) {
    var endpoint = box.dataset.endpoint, limit = +(box.dataset.limit || 5), idx = 0, vis = 4, items = [];
    var track = box.querySelector(".news-track"), view = box.querySelector(".news-view"), prev = box.querySelector(".prev"), next = box.querySelector(".next"), msg = box.querySelector(".news-msg"), loading = box.querySelector(".news-loading");
    var pal = ["#E5243B", "#DDA63A", "#4C9F38", "#C5192D", "#E5243B"];
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function when(v) { var d = new Date(v); return isNaN(d) ? "Recent" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    function size() { var w = view.clientWidth; vis = w >= 1100 ? 4 : w >= 800 ? 3 : w >= 540 ? 2 : 1; }
    function show() {
      var max = Math.max(0, items.length - vis); idx = Math.min(idx, max);
      var card = track.children[0]; if (card) { var step = card.getBoundingClientRect().width + 14; track.style.transform = "translateX(" + (-idx * step) + "px)"; }
      prev.disabled = idx === 0; next.disabled = idx >= max;
    }
    function go(d) { idx = Math.max(0, Math.min(Math.max(0, items.length - vis), idx + d)); show(); }
    prev.addEventListener("click", function () { go(-1); }); next.addEventListener("click", function () { go(1); });
    var sx = null; view.addEventListener("touchstart", function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    view.addEventListener("touchend", function (e) { if (sx == null) return; var dx = sx - e.changedTouches[0].clientX; if (dx > 40) go(1); else if (dx < -40) go(-1); sx = null; });
    window.addEventListener("resize", function () { size(); show(); });
    var url; try { url = new URL(endpoint); url.searchParams.set("limit", limit); url = url.toString(); } catch (_) { url = endpoint; }
    fetch(url, { headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error("Unable to load stories (" + r.status + ")"); return r.json(); }).then(function (d) {
      items = (d.articles || []).slice(0, limit); loading.hidden = true;
      if (!items.length) { msg.hidden = false; msg.textContent = "No stories available right now. Please try again shortly."; return; }
      track.innerHTML = items.map(function (a, i) {
        return '<a class="news-card" href="' + esc(a.url || "#") + '" target="_blank" rel="noreferrer noopener"><div class="bar" style="background:linear-gradient(90deg,' + pal[i % 5] + "," + pal[(i + 1) % 5] + ')"></div>' +
          (a.image ? '<img src="' + esc(a.image) + '" alt="' + esc(a.title || "News story image") + '" loading="lazy">' : '<div class="ph"></div>') +
          '<div class="b"><p class="m">' + esc((a.source || "Global Desk") + " · " + when(a.publishedAt)) + "</p><h3>" + esc(a.title || "Untitled story") + "</h3><p>" + esc(a.description || "Open to read the full article.") + "</p></div></a>";
      }).join(""); size(); show(); box.querySelector(".news-arrows").hidden = false;
    }).catch(function (e) { loading.hidden = true; msg.hidden = false; msg.textContent = e.message || "Unable to load stories right now."; });
  });

  /* ===== quiz ===== */
  var qz = document.querySelector(".quiz");
  if (qz) {
    var Q = [["What change needs to happen more urgently in your city?","Car-free roads",11,"Low-cost homes",1],["What matters most to people's wellbeing?","Good mental health care",3,"A nutritious meal",2],["If you ruled the world what would you do first?","Give everyone free healthcare",3,"Ensure access to a toilet",6],["What would most help the environment?","Banning plastic bottles",14,"Planting more trees",15],["What contributes more to people's happiness?","Equal job opportunities",10,"A fair wage",8],["If you could commit to one thing today it would be...?","Reducing how much you waste",12,"Being kind to the planet",13],["What do you feel more passionate about?","Everyone's basic needs being met",1,"Empowering girls and women",5],["What difference would you most like to make?","End LGBTQ+ discrimination",10,"Equal access to education",4],["If you could make one thing come true, it would be?","A world without wars",16,"A world without poverty",1],["What gets you most excited?","Technological innovation",9,"People working for Justice",16],["If you could implement one rule, it would be….?","Free soap for those without",6,"Everyone becoming vegetarian",13],["If you could grant this tomorrow, it would be...?","A woman leading your country",5,"Solar energy powering country",7],["What are you more likely to sign a petition about?","Free vaccines for less wealthy",3,"Saving natural habitats",15],["What makes you more optimistic?","Employment for young people",8,"Working towards the Goals",17],["What do people need more of?","More relaxation and headspace",3,"Outdoors in green spaces",11],["If you were fundraising, it would be for...?","A charity educating children",4,"A human rights charity",16],["What would you most like to stop?","The gap between rich and poor",10,"Food going to landfill",12]];
    var qi = 0, picks = [], bgL = qz.querySelector(".bgL"), bgR = qz.querySelector(".bgR"), body = qz.querySelector(".stage"), counter = qz.querySelector(".qcount");
    function render() {
      if (qi >= Q.length) return done();
      var q = Q[qi], lc = S.colors[q[2] - 1], rc = S.colors[q[4] - 1];
      bgL.style.background = lc; bgR.style.background = rc; bgL.style.opacity = bgR.style.opacity = 0;
      counter.textContent = "Action " + (qi + 1) + " of " + Q.length;
      body.innerHTML = '<div class="card"><h2></h2><div class="choices"><button class="choice" data-s="l" style="background:' + lc + '"></button><div class="sep">← →</div><button class="choice" data-s="r" style="background:' + rc + '"></button></div><p class="help">Swipe the card or tap a choice</p></div>';
      body.querySelector("h2").textContent = q[0]; var ch = body.querySelectorAll(".choice"); ch[0].textContent = q[1]; ch[1].textContent = q[3];
      ch[0].onclick = function () { pick(q[2]); }; ch[1].onclick = function () { pick(q[4]); };
      var card = body.querySelector(".card"), sx = null, dx = 0;
      card.addEventListener("pointerdown", function (e) { if (e.target.closest(".choice")) return; sx = e.clientX; card.setPointerCapture(e.pointerId); });
      card.addEventListener("pointermove", function (e) { if (sx == null) return; dx = e.clientX - sx; card.style.transform = "translateX(" + dx + "px) rotate(" + dx / 40 + "deg)"; (dx > 0 ? bgL : bgR).style.opacity = Math.min(1, Math.abs(dx) / 150); (dx > 0 ? bgR : bgL).style.opacity = 0; });
      card.addEventListener("pointerup", function () { if (sx == null) return; sx = null; if (dx > 180) pick(q[2]); else if (dx < -180) pick(q[4]); else { card.style.transform = ""; bgL.style.opacity = bgR.style.opacity = 0; } dx = 0; });
    }
    function pick(g) { picks.push(g); qi++; render(); }
    function done() {
      counter.textContent = ""; bgL.style.opacity = bgR.style.opacity = 0;
      var c = {}; picks.forEach(function (g) { c[g] = (c[g] || 0) + 1; });
      var top = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 3).map(Number);
      body.innerHTML = '<div class="card" style="cursor:default;text-align:center"><h2 style="margin-bottom:10px">Your Top Goals</h2><p style="color:#666;margin:0 0 32px;max-width:600px">Based on your choices, you are most inclined toward these Sustainable Development Goals.</p><div class="results">' +
        top.map(function (g) { return '<a class="rt" href="' + S.goalPath(g) + '" style="background:' + S.colors[g - 1] + '"><b>' + g + "</b><span>" + S.names[g - 1].toUpperCase() + "</span></a>"; }).join("") + '</div><button class="retake">Retake Quiz</button></div>';
      body.querySelector(".retake").onclick = function () { qi = 0; picks = []; render(); };
      // Optional: send results to your own endpoint by setting data-webhook on the .quiz element.
      var hook = qz.dataset.webhook; if (hook) fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timestamp: new Date().toISOString(), top_goals: top.map(function (g) { return S.names[g - 1]; }).join(" | "), raw_selections: picks.join(",") }) }).catch(function () {});
    }
    render();
  }
})();
