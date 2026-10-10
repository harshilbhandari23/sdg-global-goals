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
    tog.addEventListener("click", function (e) { e.stopPropagation(); fab.classList.toggle("open"); tog.setAttribute("aria-expanded", fab.classList.contains("open")); });
    document.addEventListener("click", function (e) { if (!fab.contains(e.target)) fab.classList.remove("open"); });
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

  /* ---- page transition: colour wipe from bottom to top ---- */
  (function () {
    var w = document.getElementById("wipe"); if (!w) return;
    if (document.documentElement.classList.contains("wipe-in")) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add("out"); }); });
      setTimeout(function () { document.documentElement.classList.remove("wipe-in"); w.classList.remove("out"); }, 900);
    }
    window.addEventListener("pageshow", function (e) { if (e.persisted) { w.classList.remove("go"); document.documentElement.classList.remove("wipe-in"); } });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin) return;
      if (u.pathname === location.pathname && u.search === location.search) return;
      e.preventDefault();
      var m = u.pathname.match(/goal-(\d+)/), C = (S && S.colors) || ["#009edb"],
        col = m ? C[+m[1] - 1] : (getComputedStyle(document.documentElement).getPropertyValue("--goal").trim() || C[Math.floor(Math.random() * C.length)]);
      w.style.setProperty("--wipe", col);
      try { sessionStorage.setItem("sdgWipe", col); } catch (x) {}
      w.classList.add("go");
      setTimeout(function () { location.href = u.href; }, 560);
    });
  })();
})();
