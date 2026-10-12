/* Year wheel, live news carousel, goal quiz. */
(function () {
  var S = window.SDG;
  var TILE_POS = [[80,0],[240,0],[80,80],[160,80],[320,80],[0,160],[80,160],[160,160],[240,160],[80,240],[160,240],[240,240],[320,240],[0,320],[80,320],[240,320],[160,400]];
  var TILE_COLORS = ["#EB1D2C","#D3A02A","#2D9B48","#C22033","#EF402A","#00ADD8","#FDB714","#8F1737","#F36D23","#E01483","#F99D25","#CF8D2A","#48773D","#027DBB","#3EAF49","#02558A","#193667"];
  var NAMEBOX = [[42,null],[43,null],[54,5],[49,10],[49,10],[54,5],[49,10],[49,10],[57,2],[49,10],[49,10],[57,2],[49,10],[49,10],[49,10],[49,10],[49,10]];
  var ICON17 = '<svg viewBox="0 0 161 158" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:30px;height:29px;left:50%;top:50%;transform:translate(-50%,-50%)"><path d="M160.95 70.35C160.95 47.58 142.84 28.98 120.28 28.16C114.48 11.77 98.82 0 80.47 0C62.12 0 46.47 11.78 40.66 28.16C18.1 28.98 0 47.59 0 70.35C0 83.86 6.37992 95.9 16.2899 103.63C15.2199 107.35 14.62 111.28 14.62 115.35C14.62 138.62 33.56 157.56 56.84 157.56C65.68 157.56 73.8799 154.83 80.6699 150.17C87.3799 154.66 95.44 157.28 104.09 157.28C127.37 157.28 146.31 138.34 146.31 115.06C146.31 111.08 145.74 107.23 144.71 103.57C154.58 95.8299 160.94 83.81 160.94 70.34M114.2 42.22C114.2 59.12 101.69 73.11 85.45 75.53C85.19 73.84 85.01 72.11 85.01 70.35C85.01 53.45 97.52 39.45 113.76 37.04C114.02 38.73 114.2 40.46 114.2 42.22ZM80.63 139.22C74.32 133.09 70.38 124.53 70.38 115.07C70.38 105.61 74.19 97.3 80.32 91.19C86.63 97.32 90.57 105.88 90.57 115.35C90.57 124.82 86.77 133.11 80.63 139.22ZM47.19 37.03C63.43 39.44 75.94 53.44 75.94 70.34C75.94 72.1 75.76 73.83 75.5 75.52C59.26 73.1 46.75 59.11 46.75 42.21C46.75 40.44 46.93 38.72 47.19 37.03ZM72.33 85.43C66.78 96.46 55.38 104.07 42.21 104.07C36.63 104.07 31.36 102.68 26.72 100.27C32.27 89.24 43.67 81.63 56.84 81.63C62.43 81.63 67.68 83.02 72.33 85.43ZM88.5 85.2C93.17 82.75 98.47 81.35 104.1 81.35C117.36 81.35 128.82 89.06 134.33 100.21C129.65 102.66 124.35 104.07 118.73 104.07C105.47 104.07 94 96.36 88.5 85.2ZM80.47 8.49C94.29 8.49 106.17 16.85 111.38 28.77C97.66 31.19 86.21 40.24 80.47 52.5C74.73 40.25 63.28 31.19 49.56 28.77C54.76 16.85 66.65 8.49 80.47 8.49ZM8.5 70.35C8.5 52.97 21.71 38.63 38.61 36.82C38.39 38.59 38.26 40.39 38.26 42.22C38.26 54.56 43.59 65.68 52.05 73.41C38.04 75.01 26.1 83.47 19.68 95.35C12.84 89.17 8.51 80.27 8.51 70.34M23.13 115.35C23.13 112.95 23.38 110.62 23.86 108.36C29.42 111.05 35.64 112.56 42.22 112.56C49.62 112.56 56.56 110.64 62.61 107.3C62.14 109.82 61.88 112.41 61.88 115.07C61.88 126.48 66.44 136.83 73.82 144.44C68.83 147.36 63.04 149.07 56.86 149.07C38.26 149.07 23.14 133.94 23.14 115.36M137.82 115.07C137.82 133.66 122.69 148.79 104.1 148.79C98.05 148.79 92.38 147.17 87.47 144.37C94.64 136.8 99.06 126.58 99.06 115.36C99.06 112.6 98.78 109.9 98.28 107.28C104.34 110.65 111.31 112.58 118.73 112.58C125.32 112.58 131.58 111.06 137.14 108.34C137.59 110.52 137.82 112.77 137.82 115.08M109.16 73.16C117.48 65.44 122.69 54.43 122.69 42.22C122.69 40.39 122.56 38.59 122.34 36.82C139.24 38.63 152.45 52.97 152.45 70.35C152.45 80.22 148.16 89.09 141.37 95.26C135.01 83.35 123.13 74.84 109.16 73.16Z" fill="white"/></svg>';
  /* white goal pictogram centred in each tile (goal 17 uses the Framer tile vector; the others reuse the wheel icons) */
  function tileIcon(g) {
    if (g === 17) return ICON17;
    var W = window.SDG_WHEEL, ic = W && W.icons[g], st = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);";
    if (ic) return '<svg viewBox="' + ic.vb + '" style="' + st + "width:" + (ic.w * 0.5).toFixed(1) + "px;height:" + (ic.h * 0.5).toFixed(1) + 'px">' + ic.svg + "</svg>";
    var C = { 1: { vb: "125 655 1185 530", w: 70, h: 31 }, 4: { vb: "320 585 870 685", w: 52, h: 41 }, 8: { vb: "365 540 750 800", w: 46, h: 49 } }[g];
    return '<svg viewBox="' + C.vb + '" style="' + st + "width:" + (C.w * 0.5).toFixed(1) + "px;height:" + (C.h * 0.5).toFixed(1) + 'px;filter:grayscale(1) contrast(20);mix-blend-mode:lighten"><image href="' + (window.SITE_ROOT || "") + "assets/hero/goal-" + String(g).padStart(2, "0") + '.png" width="1500" height="1500"/></svg>';
  }
  var SHORT = ["NO POVERTY","ZERO HUNGER","GOOD HEALTH AND WELL-BEING","QUALITY EDUCATION","GENDER EQUALITY","CLEAN WATER AND SANITATION","AFFORDABLE AND CLEAN ENERGY","DECENT WORK AND ECONOMIC GROWTH","INDUSTRY, INNOVATION AND INFRASTRUCTURE","REDUCED INEQUALITIES","SUSTAINABLE CITIES AND COMMUNITIES","RESPONSIBLE CONSUMPTION AND PRODUCTION","CLIMATE ACTION","LIFE BELOW WATER","LIFE ON LAND","PEACE, JUSTICE AND STRONG INSTITUTIONS","PARTNERSHIPS FOR THE GOALS"];

  /* ===== year wheel: drag the ring like a dial, snaps to the nearest year ===== */
  var yw = document.querySelector(".yw");
  if (yw) fetch((window.SITE_ROOT || "") + "data/yearwise.json").then(function (r) { return r.json(); }).then(function (data) {
    var UPCOMING = [];  // years up to 2030 that have no data yet: greyed out, not selectable (a new SDSN edition fills them in by itself)
    for (var uy = +data[data.length - 1].year + 1; uy <= 2030; uy++) UPCOMING.push(String(uy));
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
    var tileEls = TILE_POS.map(function (p, i) { var t = document.createElement("div"); t.className = "tile"; t.style.cssText = "left:" + p[0] + "px;top:" + p[1] + "px;background:" + TILE_COLORS[i]; var nb = NAMEBOX[i], ns = "width:" + nb[0] + "px;" + (nb[1] == null ? "left:53%;transform:translateX(-50%)" : "right:" + nb[1] + "px"); t.innerHTML = "<b>" + (i + 1) + "</b><i style=\"" + ns + "\">" + SHORT[i] + "</i><u></u>" + tileIcon(i + 1); tiles.appendChild(t); return t; });
    stage.appendChild(tiles); yw.appendChild(stage);
    var live = document.createElement("div"); live.className = "visually-hidden"; live.setAttribute("aria-live", "polite"); yw.appendChild(live);

    function fit() { var s = yw.clientWidth / BASE; stage.style.transform = "scale(" + s + ")"; stage.style.left = (-43.2 * s) + "px"; }  /* the ring is centred on x=583 of the 1080 stage: pull the stage left so the ring sits in the middle of the section */
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

  /* ===== "Scan to read more" popup with a QR code for the story ===== */
  var qrModal;
  function openQr(a) {
    if (!a || !a.url || typeof qrcode === "undefined") return;
    if (!qrModal) {
      qrModal = document.createElement("div"); qrModal.className = "qr-modal"; qrModal.setAttribute("role", "dialog"); qrModal.setAttribute("aria-modal", "true"); qrModal.setAttribute("aria-label", "Scan to read more"); qrModal.hidden = true;
      qrModal.innerHTML = '<div class="qr-card"><div class="qr-top"><b></b><span></span></div><button class="qr-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button><h2>Scan to read more</h2><p class="qr-sub">Use your phone\u2019s camera to read the full story from the original publisher.</p><div class="qr-ring"><div class="qr-box"></div></div><p class="qr-title"></p></div>';
      document.body.appendChild(qrModal);
      var close = function () { qrModal.hidden = true; document.documentElement.classList.remove("qr-open"); };
      qrModal.addEventListener("click", function (e) { if (e.target === qrModal || e.target.closest(".qr-close")) close(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !qrModal.hidden) close(); });
    }
    var q = qrcode(0, "L"); q.addData(a.url); q.make();
    qrModal.querySelector(".qr-box").innerHTML = q.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
    qrModal.querySelector(".qr-title").textContent = a.title || "";
    var top = qrModal.querySelector(".qr-top"), gc = a.goal ? S.colors[a.goal - 1] : "";
    qrModal.querySelector(".qr-card").style.setProperty("--qc", gc || "#0a2c61");
    top.querySelector("b").textContent = a.goal || ""; top.querySelector("span").textContent = a.goal ? S.names[a.goal - 1] : "SDG News"; top.classList.toggle("nogoal", !a.goal);
    qrModal.hidden = false; document.documentElement.classList.add("qr-open");
    qrModal.querySelector(".qr-close").focus();
  }

  S.openQr = openQr;   // reused by the events popup

  /* ===== live news carousel ===== */
  document.querySelectorAll(".news").forEach(function (box) {
    var limit = +(box.dataset.limit || 5), idx = 0, pages = 1, items = [];
    var track = box.querySelector(".news-track"), view = box.querySelector(".news-view"), prev = box.querySelector(".prev"), next = box.querySelector(".next"), msg = box.querySelector(".news-msg"), loading = box.querySelector(".news-loading"), count = box.querySelector(".news-count");
    var pal = ["#E5243B", "#DDA63A", "#4C9F38", "#C5192D", "#E5243B"], PER = 4;
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function when(v) { var d = new Date(v); return isNaN(d) ? "Recent" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    function show() {
      idx = Math.max(0, Math.min(pages - 1, idx));
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      prev.disabled = idx === 0; next.disabled = idx >= pages - 1;
      if (count) count.textContent = String(idx + 1).padStart(2, "0") + " / " + String(pages).padStart(2, "0");
    }
    function go(d) { idx += d; show(); rearm(); }
    /* auto-advance every few seconds; loops back to the first page, pauses while hovered, touched or off-screen */
    var timer = null, hover = false, seen = true, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function tick() { if (hover || !seen || document.hidden || pages < 2) return; idx = idx >= pages - 1 ? 0 : idx + 1; show(); }
    function rearm() { clearInterval(timer); if (!reduce) timer = setInterval(tick, 5000); }
    box.addEventListener("mouseenter", function () { hover = true; }); box.addEventListener("mouseleave", function () { hover = false; });
    box.addEventListener("focusin", function () { hover = true; }); box.addEventListener("focusout", function () { hover = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; }, { threshold: .2 }).observe(box);
    rearm();
    prev.addEventListener("click", function () { go(-1); }); next.addEventListener("click", function () { go(1); });
    var sx = null; view.addEventListener("touchstart", function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    view.addEventListener("touchend", function (e) { if (sx == null) return; var dx = sx - e.changedTouches[0].clientX; if (dx > 40) go(1); else if (dx < -40) go(-1); sx = null; });
    /* mouse / pen drag: the page follows the pointer, release past a threshold changes page (touch swipe is handled above) */
    var drag = null, moved = false;
    view.addEventListener("dragstart", function (e) { e.preventDefault(); });
    view.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch" || e.button) return;
      drag = { x: e.clientX, id: e.pointerId, w: view.clientWidth }; moved = false;
    });
    view.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) > 6) { moved = true; try { view.setPointerCapture(e.pointerId); } catch (_) {} track.style.transition = "none"; view.classList.add("dragging"); }
      if (moved) { var edge = (idx === 0 && dx > 0) || (idx >= pages - 1 && dx < 0); track.style.transform = "translateX(calc(" + (-idx * 100) + "% + " + (edge ? dx / 3 : dx) + "px))"; }
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, w = drag.w; drag = null;
      if (!moved) return;
      track.style.transition = ""; view.classList.remove("dragging");
      if (Math.abs(dx) > Math.min(90, w * .15)) go(dx < 0 ? 1 : -1); else show();
      setTimeout(function () { moved = false; }, 0);
    }
    view.addEventListener("pointerup", endDrag); view.addEventListener("pointercancel", endDrag);
    view.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    function card(a, i) {
      var c1 = a.goal ? S.colors[a.goal - 1] : pal[i % 5];
      var pic = a.image || (a.goal ? (window.SITE_ROOT || "") + "assets/tiles/goal-" + String(a.goal).padStart(2, "0") + ".jpg" : "");  // no photo in the feed: show the official goal tile
      return '<a class="news-card' + (a.image ? "" : " has-tile") + '" data-i="' + i + '" href="' + esc(a.url || "#") + '" target="_blank" rel="noreferrer noopener">' +
        (pic ? '<img src="' + esc(pic) + '" alt="' + esc(a.image ? a.title : "Goal " + a.goal + ": " + S.names[a.goal - 1]) + '" loading="lazy">' : "") +
        '<div class="cap">' + (a.goal ? '<span class="gt" style="background:' + c1 + '"><b>' + a.goal + "</b>" + esc(S.names[a.goal - 1]) + "</span>" : "") +
        '<p class="m">' + esc((a.source || "News") + " · " + when(a.publishedAt)) + "</p><h3>" + esc(a.title || "Untitled story") + "</h3></div></a>";
    }
    function draw() {
      loading.hidden = true;
      if (!items.length) { msg.hidden = false; msg.textContent = "No stories available right now. Please try again shortly."; return; }
      msg.hidden = true; pages = Math.ceil(items.length / PER);
      var h = ""; for (var p = 0; p < pages; p++) { h += '<div class="news-page">'; for (var k = p * PER; k < Math.min(items.length, (p + 1) * PER); k++) h += card(items[k], k); h += "</div>"; }
      track.innerHTML = h; show(); box.querySelector(".news-arrows").hidden = false;
      /* a photo that fails to load (blocked or removed) falls back to the official goal tile */
      Array.prototype.forEach.call(track.querySelectorAll("a.news-card img"), function (im) {
        var a = items[+im.closest("a").dataset.i];
        im.addEventListener("error", function () { if (!a || !a.goal) { im.style.visibility = "hidden"; return; } im.closest("a").classList.add("has-tile"); im.src = (window.SITE_ROOT || "") + "assets/tiles/goal-" + String(a.goal).padStart(2, "0") + ".jpg"; }, { once: true });
      });
    }
    /* tapping a card opens a QR code for that story (nothing navigates away from the kiosk) */
    track.addEventListener("click", function (e) {
      var card = e.target.closest && e.target.closest("a.news-card"); if (!card) return;
      e.preventDefault(); openQr(items[+card.dataset.i]);
    });
    /* stories come from data/news*.json, refreshed every few hours by tools/fetch_news.py (Google News search per goal) */
    function load() {
      return fetch((window.SITE_ROOT || "") + box.dataset.feed + "?ts=" + Date.now()).then(function (r) { if (!r.ok) throw new Error("Unable to load stories (" + r.status + ")"); return r.json(); })
        .then(function (d) { var l = d.articles || []; if (l.length || !items.length) { items = l.slice(0, limit); draw(); } });
    }
    load().catch(function (e) { loading.hidden = true; msg.hidden = false; msg.textContent = e.message || "Unable to load stories right now."; });
    setInterval(function () { load().catch(function () {}); }, 10 * 60 * 1000);  // pick up new stories without a reload
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
