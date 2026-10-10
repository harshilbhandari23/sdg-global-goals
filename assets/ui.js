/* UI behaviour: nav, SDG wheel button, FAQ, scroll text, counters. */
(function () {
  var S = window.SDG;

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
  document.querySelectorAll(".wheel-links").forEach(buildWheel);

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
})();
