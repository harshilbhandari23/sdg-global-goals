/* UI behaviour: nav, SDG wheel button, FAQ, scroll text, counters. */
(function () {
  var S = window.SDG;

  /* ---- home hero: keep the 1440 x 820 Figma canvas scaled to cover its box ---- */
  var fh = document.querySelector(".fh"), fc = fh && fh.querySelector(".fh-canvas");
  if (fc) { var fit = function () { fc.style.setProperty("--s", Math.max(fh.clientWidth / 1440, fh.clientHeight / 820)); }; fit(); window.addEventListener("resize", fit);
    /* the Figma hero has no floating menu or goals button over it: show them once you scroll past the hero */
    var chrome = document.querySelectorAll(".nav, .sdg-fab");
    var toggleChrome = function () { var off = window.scrollY < fh.offsetHeight - 120; chrome.forEach(function (c) { c.classList.toggle("chrome-off", off); }); };
    toggleChrome(); window.addEventListener("scroll", toggleChrome, { passive: true });
  }

  /* ---- floating nav: hides on scroll down, shows on scroll up ---- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var last = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y > last + 6 && y > 200) nav.classList.add("hide");
      else if (y < last - 6) nav.classList.remove("hide");
      last = y;
    }, { passive: true });
  }

  /* ---- clickable SDG wheel (exact pie slices, each a real link) ---- */
  function pt(r, deg) { var a = deg * Math.PI / 180; return [160 + r * Math.cos(a), 160 + r * Math.sin(a)]; }
  var order = Object.keys(S.angles).map(Number).sort(function (a, b) { return S.angles[a] - S.angles[b]; });
  function bounds(g) {
    var i = order.indexOf(g), a = S.angles[g];
    var p = S.angles[order[(i - 1 + 17) % 17]], n = S.angles[order[(i + 1) % 17]];
    var d = (((a - p) % 360) + 360) % 360, u = (((n - a) % 360) + 360) % 360;
    return [a - d / 2, a + u / 2];
  }
  function buildWheel(el) {
    var rIn = 52, rOut = 158, html = '<svg viewBox="0 0 320 320" role="navigation" aria-label="Sustainable Development Goals">';
    order.forEach(function (g) {
      var b = bounds(g), p0 = pt(rOut, b[0]), p1 = pt(rOut, b[1]), p2 = pt(rIn, b[1]), p3 = pt(rIn, b[0]);
      var d = "M" + p0 + " A" + rOut + " " + rOut + " 0 0 1 " + p1 + " L" + p2 + " A" + rIn + " " + rIn + " 0 0 0 " + p3 + " Z";
      var mid = pt((rIn + rOut) / 2 + 4, (b[0] + b[1]) / 2);
      html += '<a href="' + S.goalPath(g) + '" aria-label="Goal ' + g + ": " + S.names[g - 1] + '">' +
        '<path class="slice" style="--c:' + S.colors[g - 1] + '" d="' + d + '"/>' +
        '<text x="' + mid[0] + '" y="' + mid[1] + '">' + g + '</text></a>';
    });
    html += '<circle cx="160" cy="160" r="48" fill="#fff" pointer-events="none"/>' +
      '<image href="' + S.logo + '" x="118" y="118" width="84" height="84" pointer-events="none"/></svg>';
    el.innerHTML = html;
  }
  /* ---- big home wheel (Framer "SDG Wheel" style): number, pictogram and name inside every petal ---- */
  function buildBigWheel(el, auto) {
    var W = window.SDG_WHEEL, SIZE = 769, C = SIZE / 2, R_OUT = C, R_IN = 150;
    var ang = {}, ord = [];
    for (var g = 1; g <= 17; g++) { ang[g] = (((90 + W.rot[g]) % 360) + 360) % 360; ord.push(g); }
    ord.sort(function (a, b) { return ang[a] - ang[b]; });
    function P(r, d) { var a = d * Math.PI / 180; return [(C + r * Math.cos(a)).toFixed(2), (C + r * Math.sin(a)).toFixed(2)]; }
    function bnd(g) {
      var i = ord.indexOf(g), a = ang[g], p = ang[ord[(i + 16) % 17]], n = ang[ord[(i + 1) % 17]];
      return [a - ((((a - p) % 360) + 360) % 360) / 2, a + ((((n - a) % 360) + 360) % 360) / 2];
    }
    function wrap(name) {
      var words = name.toUpperCase().split(" "), lines = [], cur = "";
      words.forEach(function (w) { if ((cur + " " + w).trim().length > 16 && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); });
      if (cur) lines.push(cur); return lines;
    }
    var out = '<svg viewBox="0 0 ' + SIZE + " " + SIZE + '" role="navigation" aria-label="Sustainable Development Goals">';
    out += '<g class="spin">';
    ord.forEach(function (g) {
      var b = bnd(g), a0 = P(R_OUT, b[0]), a1 = P(R_OUT, b[1]), i1 = P(R_IN, b[1]), i0 = P(R_IN, b[0]);
      var d = "M" + a0 + " A" + R_OUT + " " + R_OUT + " 0 0 1 " + a1 + " L" + i1 + " A" + R_IN + " " + R_IN + " 0 0 0 " + i0 + " Z";
      var ic = W.icons[g], icon = "";
      if (ic) {
        icon = '<svg x="' + (-ic.w / 2) + '" y="' + (286.5 + (ic.cy - 53) * 1.66 - ic.h / 2 - 0) + '" width="' + ic.w + '" height="' + ic.h + '" viewBox="' + ic.vb + '" preserveAspectRatio="xMidYMid meet">' + ic.svg + "</svg>";
      } else {  // pictogram cropped from the official tile (same colour as the petal, so it blends in)
        var CROP = { 1: { vb: "125 655 1185 530", w: 70, h: 31 }, 4: { vb: "320 585 870 685", w: 52, h: 41 }, 8: { vb: "365 540 750 800", w: 46, h: 49 } }[g];
        icon = '<svg x="' + (-CROP.w / 2) + '" y="' + (286.5 - CROP.h / 2) + '" width="' + CROP.w + '" height="' + CROP.h + '" viewBox="' + CROP.vb + '" preserveAspectRatio="xMidYMid meet"><image href="' + (window.SITE_ROOT || "") + "assets/hero/goal-" + String(g).padStart(2, "0") + '.png" width="1500" height="1500"/></svg>';
      }
      var lines = wrap(S.names[g - 1]), lh = 13, y0 = 352.5 - lines.length * lh + 10;
      var name = lines.map(function (l, k) { return '<tspan x="0" y="' + (y0 + k * lh) + '">' + l.replace("&", "&amp;") + "</tspan>"; }).join("");
      out += '<a href="' + S.goalPath(g) + '" aria-label="Goal ' + g + ": " + S.names[g - 1] + '"><path class="slice" style="--c:' + S.colors[g - 1] + '" d="' + d + '"/>' +
        '<g class="pt" transform="translate(' + C + " " + C + ") rotate(" + W.rot[g] + ')"><text class="n" x="0" y="234.5">' + g + "</text>" + icon + '<text class="nm">' + name + "</text></g></a>";
    });
    out += "</g>";
    out += '<circle cx="' + C + '" cy="' + C + '" r="' + (R_IN - 2) + '" fill="#fff" pointer-events="none"/><image href="' + S.logo + '" x="' + (C - 100) + '" y="' + (C - 94) + '" width="200" height="188" pointer-events="none"/></svg>';
    el.innerHTML = out;
    spin(el, C, auto !== false);
  }

  /* slow clockwise auto-rotation + drag to rotate (with a little momentum) */
  function spin(el, C, auto) {
    var svg = el.querySelector("svg"), g = svg.querySelector(".spin");
    var SPEED = 5;                       // degrees per second, clockwise
    var angle = 0, vel = 0, dragging = false, moved = false, hover = false, last = 0, lastT = 0;
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function draw() { g.setAttribute("transform", "rotate(" + angle.toFixed(2) + " " + C + " " + C + ")"); }
    function ptr(e) {
      var r = svg.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    }
    svg.addEventListener("pointerdown", function (e) { if (e.button > 0) return; dragging = true; moved = false; vel = 0; last = ptr(e); lastT = performance.now(); });
    svg.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var a = ptr(e), d = a - last; if (d > 180) d -= 360; if (d < -180) d += 360; last = a;
      if (!moved && Math.abs(d) < 0.4) return;
      if (!moved) { moved = true; svg.classList.add("grab"); try { svg.setPointerCapture(e.pointerId); } catch (_) {} }
      var now = performance.now(), dt = Math.max(1, now - lastT) / 1000; lastT = now;
      angle += d; vel = d / dt; draw();
    });
    function end() { if (!dragging) return; dragging = false; svg.classList.remove("grab"); if (moved) setTimeout(function () { moved = false; }, 0); }
    svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
    svg.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    svg.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hover = true; });
    svg.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hover = false; });
    var prev = 0;
    function tick(t) {
      var dt = prev ? Math.min(0.1, (t - prev) / 1000) : 0; prev = t;
      if (!dragging) {
        if (Math.abs(vel) > SPEED) { angle += vel * dt; vel *= Math.pow(0.04, dt); }   // momentum after a flick
        else { vel = 0; if (auto && !still && !hover) angle += SPEED * dt; }
        draw();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  document.querySelectorAll(".wheel-links").forEach(function (el) {
    if (window.SDG_WHEEL) { buildBigWheel(el, !!el.closest(".wheel-wrap")); el.classList.add("big"); }  // popup wheel: same style, no auto-spin
    else buildWheel(el);
  });

  var fab = document.querySelector(".sdg-fab");
  if (fab) {
    var tog = fab.querySelector(".toggle");
    var pop = fab.querySelector(".sdg-pop"), dragged = false;
    /* keep the popup on screen wherever the button has been dragged to */
    var place = function () {
      var b = tog.getBoundingClientRect(), P = pop.offsetWidth, m = 8, fr = fab.getBoundingClientRect();
      var cx = b.left + b.width / 2, cy = b.top + b.height / 2;   // wheel opens centred on the button
      var l = Math.min(Math.max(cx - P / 2, m), window.innerWidth - P - m);
      var t = Math.min(Math.max(cy - P / 2, m), window.innerHeight - P - m);
      pop.style.right = "auto"; pop.style.bottom = "auto"; pop.style.left = (l - fr.left) + "px"; pop.style.top = (t - fr.top) + "px";
      pop.style.transformOrigin = (b.left + b.width / 2 - l) + "px " + (b.top + b.height / 2 - t) + "px";
    };
    var setPos = function (x, y) {
      var w = tog.offsetWidth, h = tog.offsetHeight;
      x = Math.min(Math.max(x, 6), window.innerWidth - w - 6); y = Math.min(Math.max(y, 6), window.innerHeight - h - 6);
      fab.style.left = x + "px"; fab.style.top = y + "px"; fab.style.right = "auto"; fab.style.bottom = "auto";
      return [x, y];
    };
    try { var sv = JSON.parse(localStorage.getItem("sdgFab")); if (sv) setPos(sv[0] * (window.innerWidth - tog.offsetWidth), sv[1] * (window.innerHeight - tog.offsetHeight)); } catch (x) {}
    window.addEventListener("resize", function () { if (fab.style.left) { var r = fab.getBoundingClientRect(); setPos(r.left, r.top); } });
    var dx, dy, sx, sy, down = false;
    tog.style.touchAction = "none"; tog.style.cursor = "grab";
    tog.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button) return;
      var r = fab.getBoundingClientRect(); down = true; dragged = false; sx = e.clientX; sy = e.clientY; dx = e.clientX - r.left; dy = e.clientY - r.top;
      try { tog.setPointerCapture(e.pointerId); } catch (x) {}
    });
    tog.addEventListener("pointermove", function (e) {
      if (!down) return;
      if (!dragged && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
      dragged = true; tog.style.cursor = "grabbing"; fab.classList.remove("open"); setPos(e.clientX - dx, e.clientY - dy);
    });
    var end = function () {
      if (!down) return; down = false; tog.style.cursor = "grab";
      if (dragged) { var r = fab.getBoundingClientRect(); try { localStorage.setItem("sdgFab", JSON.stringify([r.left / (window.innerWidth - r.width), r.top / (window.innerHeight - r.height)])); } catch (x) {} }
    };
    tog.addEventListener("pointerup", end); tog.addEventListener("pointercancel", end);
    tog.addEventListener("click", function (e) {
      e.stopPropagation();
      if (dragged) { dragged = false; return; }
      if (!fab.classList.contains("open")) place();
      fab.classList.toggle("open"); tog.setAttribute("aria-expanded", fab.classList.contains("open"));
    });
    document.addEventListener("click", function (e) { if (!fab.contains(e.target)) fab.classList.remove("open"); });
    var px = fab.querySelector(".pop-x"); if (px) px.addEventListener("click", function (e) { e.stopPropagation(); fab.classList.remove("open"); tog.setAttribute("aria-expanded", "false"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fab.classList.remove("open"); });
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll(".faq-card").forEach(function (card) {
    card.addEventListener("click", function () {
      var open = card.classList.toggle("open"), a = card.querySelector(".a");
      a.style.maxHeight = open ? a.scrollHeight + "px" : 0;
    });
  });

  /* ---- scroll colour-change text: letters fade from start to end colour ---- */
  document.querySelectorAll(".scroll-text").forEach(function (el) {
    var start = el.dataset.start || "rgba(9,9,9,.56)", end = el.dataset.end || "#080a07";
    var text = el.textContent.trim(), words = text.split(/\s+/), total = text.replace(/\s/g, "").length, idx = 0, letters = [];
    el.setAttribute("aria-label", text);
    el.innerHTML = words.map(function (w) {
      return '<span class="w" aria-hidden="true">' + w.split("").map(function (c) {
        var i = idx++; return '<span class="l" data-i="' + i + '" style="color:' + start + '">' + c.replace("&", "&amp;") + "</span>";
      }).join("") + "</span> ";
    }).join("");
    letters = el.querySelectorAll(".l");
    function mix(a, b, t) { return a + (b - a) * t; }
    function rgb(c) { var d = document.createElement("canvas").getContext("2d"); d.fillStyle = c; d.fillRect(0, 0, 1, 1); var p = d.getImageData(0, 0, 1, 1).data; return [p[0], p[1], p[2], p[3] / 255]; }
    var cs = rgb(start), ce = rgb(end);
    function update() {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (vh * 0.6)));
      for (var k = 0; k < letters.length; k++) {
        var s = k / total, t = Math.min(1, Math.max(0, (p - s) / (1 / total)));
        letters[k].style.opacity = mix(0.2, 1, t);
        letters[k].style.color = "rgba(" + Math.round(mix(cs[0], ce[0], t)) + "," + Math.round(mix(cs[1], ce[1], t)) + "," + Math.round(mix(cs[2], ce[2], t)) + "," + mix(cs[3], ce[3], t) + ")";
      }
    }
    window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update); update();
  });

  /* ---- count-up numbers ---- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = null;
        function f(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(f); }
        requestAnimationFrame(f);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  }


  /* ---- home section: scale the 1734 x 1787 Framer canvas to the page width ---- */
  var ws = document.querySelector(".ws");
  if (ws) { var wfit = function () { ws.style.setProperty("--s", ws.clientWidth / 1734); }; wfit(); window.addEventListener("resize", wfit); }


  /* ---- targets: one line, slowly drifting left to right (seamless loop) ---- */
  var tg = document.querySelector(".t-grid");
  if (tg && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var wrap = document.createElement("div"); wrap.className = "t-wrap"; tg.parentNode.insertBefore(wrap, tg); wrap.appendChild(tg);
    var orig = Array.prototype.slice.call(tg.children);
    orig.forEach(function (c) { var d = c.cloneNode(true); d.setAttribute("aria-hidden", "true"); Array.prototype.forEach.call(d.querySelectorAll("img"), function (i) { i.alt = ""; }); tg.appendChild(d); });
    tg.classList.add("run");
    /* JS-driven drift (right to left, ~35px/s) so the strip can also be dragged; loops seamlessly */
    var pos = 0, half = 0, drag = false, moved = 0, sx = 0, sp = 0, hov = false, last = 0;
    var measure = function () { half = tg.scrollWidth / 2; };
    measure(); window.addEventListener("load", measure); window.addEventListener("resize", measure);
    var norm = function () { if (half) { while (pos <= -half) pos += half; while (pos > 0) pos -= half; } };
    var tick = function (t) {
      var dt = last ? Math.min(t - last, 100) : 0; last = t;
      if (!drag && !hov) pos -= 35 * dt / 1000;
      norm(); tg.style.transform = "translate3d(" + pos + "px,0,0)";
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    wrap.addEventListener("mouseenter", function () { hov = true; });
    wrap.addEventListener("mouseleave", function () { hov = false; });
    wrap.addEventListener("dragstart", function (e) { e.preventDefault(); });
    wrap.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button) return;
      drag = true; moved = 0; sx = e.clientX; sp = pos; wrap.classList.add("grab");
      try { wrap.setPointerCapture(e.pointerId); } catch (x) {}
    });
    wrap.addEventListener("pointermove", function (e) { if (!drag) return; var d = e.clientX - sx; moved = Math.max(moved, Math.abs(d)); pos = sp + d; });
    var up = function () { if (!drag) return; drag = false; wrap.classList.remove("grab"); };
    wrap.addEventListener("pointerup", up); wrap.addEventListener("pointercancel", up);
    wrap.addEventListener("click", function (e) { if (moved > 5) { e.preventDefault(); e.stopPropagation(); } }, true);
  }


  /* ---- load animation (after the reference site): colour screen with the title, it lifts away, then the hero text blurs in line by line ---- */
  (function () {
    var d = document.documentElement, pre = document.getElementById("pre");
    var reveal = function () { d.classList.remove("hold", "intro"); d.classList.add("revealed"); if (pre) pre.style.display = "none"; };
    if (!d.classList.contains("hold")) return;
    if (document.querySelectorAll(".fh .t").length) Array.prototype.forEach.call(document.querySelectorAll(".fh .t"), function (t) { t.style.setProperty("--d", Math.round(Math.random() * 900)); });
    if (d.classList.contains("intro") && pre) {
      requestAnimationFrame(function () { pre.classList.add("in"); });
      setTimeout(function () { pre.classList.add("out"); d.classList.add("revealed"); d.classList.remove("hold"); }, 1700);
      setTimeout(function () { d.classList.remove("intro"); pre.style.display = "none"; }, 2600);
    } else setTimeout(reveal, 350);
  })();

  /* ---- contribute cards: text blurs in line by line as each card slides in ---- */
  (function () {
    var st = document.querySelector(".todo-stack"); if (!st || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    st.classList.add("rv");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.3 });
    Array.prototype.forEach.call(st.children, function (c) { io.observe(c); });
  })();

  /* ---- contribute cards: full-screen stack; the card underneath settles back (smaller, darker) as the next one covers it ---- */
  (function () {
    var st = document.querySelector(".todo-stack"); if (!st || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cards = Array.prototype.slice.call(st.children), ticking = false;
    var update = function () {
      ticking = false; var vh = window.innerHeight;
      cards.forEach(function (c, i) {
        var n = cards[i + 1], p = 0;
        if (n) p = Math.min(1, Math.max(0, (vh - n.getBoundingClientRect().top) / vh));
        c.style.setProperty("--p", p.toFixed(3));
      });
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", req, { passive: true }); window.addEventListener("resize", req); update();
  })();

  /* ---- contribute (desktop): scroll-pinned slider, the next action slides in from the right over the current one ---- */
  (function () {
    var hs = document.querySelector(".hs"); if (!hs) return;
    var panels = Array.prototype.slice.call(hs.querySelectorAll(".hs-p")), n = panels.length, cur = hs.querySelector(".hs-cur"), bar = hs.querySelector(".hs-line b"), ticking = false;
    var STRIP = 64;
    var update = function () {
      ticking = false;
      var W = hs.querySelector(".hs-right").clientWidth, r = hs.getBoundingClientRect(), total = hs.offsetHeight - window.innerHeight;
      var sp = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0, t = sp * (n - 1);
      panels.forEach(function (p, i) {
        var d = i - t, x, dim = 0, px = 0;
        if (d >= 1) x = W - STRIP * Math.max(0, 4 - d);
        else if (d > 0) x = (W - STRIP * 3) * d;
        else { x = d * W * 0.28; dim = Math.min(1, -d); }
        if (i === 0 && d >= 1) x = W - STRIP * 3;
        p.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
        p.style.setProperty("--dim", dim.toFixed(3));
        p.style.setProperty("--d", Math.max(-1, Math.min(1, d)).toFixed(3));
      });
      var idx = Math.min(n, Math.round(t) + 1); cur.textContent = (idx < 10 ? "0" : "") + idx;
      bar.style.transform = "scaleX(" + (n > 1 ? t / (n - 1) : 1).toFixed(3) + ")";
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", req, { passive: true }); window.addEventListener("resize", req); update();
  })();

  /* ---- events / publications popups: the UN's own lists for this goal (data/events|publications/goal-N.json, refreshed by GitHub Actions); links open a QR code ---- */
  (function () {
    var sec = document.getElementById("numbers"), btns = document.querySelectorAll("[data-popup]"); if (!sec || !btns.length) return;
    var goal = sec.dataset.goal, modals = {}, cache = {};
    var esc = function (s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var CFG = {
      events: { title: "Events related to this goal", all: ["See all events", "https://sdgs.un.org/events"], none: "No upcoming events are listed for this goal right now.",
        row: function (e) { return '<a class="ev-item" href="' + esc(e.url) + '"><span class="ev-date"><b>' + esc(e.day) + "</b><i>" + esc(e.month) + '</i></span><span class="ev-body"><strong>' + esc(e.title) + "</strong><small>" + esc(e.range) + (e.place ? " &middot; " + esc(e.place) : "") + '</small></span><span class="ev-go" aria-hidden="true"></span></a>'; } },
      publications: { title: "Publications related to this goal", all: ["See all publications", "https://sdgs.un.org/publications"], none: "No publications are listed for this goal right now.",
        row: function (e) { return '<a class="ev-item" href="' + esc(e.url) + '">' + (e.image ? '<span class="ev-cover" style="background-image:url(\'' + esc(e.image) + '\')"></span>' : '<span class="ev-cover"></span>') + '<span class="ev-body"><strong>' + esc(e.title) + "</strong><small>Read the document</small></span>" + '<span class="ev-go" aria-hidden="true"></span></a>'; } }
    };
    var closeAll = function () { Object.keys(modals).forEach(function (k) { modals[k].classList.remove("on"); }); document.documentElement.classList.remove("ev-open"); };
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeAll(); });
    var make = function (type) {
      var c = CFG[type], m = document.createElement("div"); m.className = "ev-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", c.title);
      m.innerHTML = '<div class="ev-panel"><div class="ev-head"><div><span>Goal ' + goal + '</span><h3>' + c.title + '</h3></div><button class="ev-x" type="button" aria-label="Close">&times;</button></div><div class="ev-list"><p class="ev-empty">Loading&hellip;</p></div><div class="ev-foot"><a href="https://sdgs.un.org/goals/goal' + goal + '">See this goal on sdgs.un.org</a><a href="' + c.all[1] + '">' + c.all[0] + '</a></div></div>';
      document.body.appendChild(m);
      m.addEventListener("click", function (ev) {
        if (ev.target === m || ev.target.closest(".ev-x")) { closeAll(); return; }
        var a = ev.target.closest("a[href^='http']");   // links show a QR code instead of leaving the page
        if (a && window.SDG && window.SDG.openQr) {
          ev.preventDefault(); var t = a.querySelector("strong");
          window.SDG.openQr({ url: a.href, title: t ? t.textContent : a.textContent.trim(), goal: +goal });
        }
      });
      return m;
    };
    btns.forEach(function (btn) {
      var type = btn.dataset.popup; if (!CFG[type]) return;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var m = modals[type] || (modals[type] = make(type));
        m.style.setProperty("--goal", getComputedStyle(sec).getPropertyValue("--goal") || "#009edb");
        document.documentElement.classList.add("ev-open"); m.classList.add("on");
        if (!cache[type]) fetch((window.SITE_ROOT || "") + "data/" + type + "/goal-" + goal + ".json").then(function (r) { return r.json(); }).then(function (d) { cache[type] = d; m.querySelector(".ev-list").innerHTML = (d[type] || []).map(CFG[type].row).join("") || '<p class="ev-empty">' + CFG[type].none + "</p>"; }).catch(function () { m.querySelector(".ev-list").innerHTML = '<p class="ev-empty">' + CFG[type].none + "</p>"; });
        m.querySelector(".ev-x").focus();
      });
    });
  })();

  /* ---- page transition: colour wipe from bottom to top ---- */
  (function () {
    var w = document.getElementById("wipe"); if (!w) return;
    if (document.documentElement.classList.contains("wipe-in")) {   // arriving: the colour is simply gone, no second sweep
      w.classList.add("instant");
      requestAnimationFrame(function () { document.documentElement.classList.remove("wipe-in"); requestAnimationFrame(function () { w.classList.remove("instant"); }); });
    }
    window.addEventListener("pageshow", function (e) { if (e.persisted) { w.classList.remove("go"); document.documentElement.classList.remove("wipe-in"); } });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var tg = a.getAttribute("target"); if (tg && tg !== "_self") return;
      if (a.hasAttribute("download")) return;
      var href = a.getAttribute("href") || a.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (!href || href.charAt(0) === "#" || /^(mailto|tel|javascript):/i.test(href)) return;
      var u; try { u = new URL(href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search) return;
      e.preventDefault();
      var m = u.pathname.match(/goal-(\d+)/), C = (S && S.colors) || ["#009edb"],
        col = m ? C[+m[1] - 1] : (getComputedStyle(document.documentElement).getPropertyValue("--goal").trim() || C[Math.floor(Math.random() * C.length)]);
      w.style.setProperty("--wipe", col);
      try { sessionStorage.setItem("sdgWipe", col); } catch (x) {}
      w.classList.add("go");
      setTimeout(function () { location.href = u.href; }, 680);
    });
  })();
})();
