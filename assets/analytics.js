/* Kiosk visit tracking. Every visit (first touch until 75 s of no touching) gets its own anonymous id, so each person's path through the
   kiosk can be followed. Nothing personal is collected: no names, no text typed, no cookies of our own. Events go to Microsoft Clarity and/or
   PostHog when their IDs are set in analytics-config.js; the page works the same with both switched off.
   Use SDG.track(name, props) to record an action; ?track=debug in the address bar prints every event to the console. */
(function () {
  var S = window.SDG = window.SDG || {}, C = window.SDG_ANALYTICS || {};
  var ROOT = window.SITE_ROOT || "", IDLE = (C.idleSeconds == null ? 75 : +C.idleSeconds) * 1000;
  var DEBUG = /[?&]track=debug\b/.test(location.search);
  var KEY = "sdgVisit";

  function store(get, set) { try { return get ? sessionStorage.getItem(KEY) : sessionStorage.setItem(KEY, set); } catch (e) { return null; } }
  function uid() { var a = new Uint8Array(8); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; }); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }

  /* ---- the current visit ---- */
  var visit = null;
  try { visit = JSON.parse(store(true)); } catch (e) {}
  var fresh = !visit;
  if (!visit) visit = { id: uid(), t0: Date.now(), n: 0, touched: false };
  function save() { store(false, JSON.stringify(visit)); }

  /* ---- Microsoft Clarity (session replays, heatmaps) ---- */
  if (C.clarityId) {
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", C.clarityId);
    try { window.clarity("set", "kiosk_visit", visit.id); } catch (e) {}
  }

  function pageInfo() {
    var p = location.pathname, m = p.match(/global_goals\/goal-(\d+)/);
    if (m) return { page: "goal", goal: +m[1] };
    if (/global_goals\/?$/.test(p) || /global_goals\/index/.test(p)) return { page: "goals_index" };
    if (/\/legal\//.test(p)) return { page: "legal" };
    return { page: "home" };
  }
  var PI = pageInfo();

  /* ---- sending ---- */
  function send(name, props) {
    var body = Object.assign({ visit_n: ++visit.n, secs: Math.round((Date.now() - visit.t0) / 1000), page: PI.page }, PI.goal ? { goal: PI.goal } : {}, props || {});
    save();
    if (DEBUG) console.log("[track]", name, body);
    if (C.clarityId && window.clarity) { try { window.clarity("event", name); if (PI.goal) window.clarity("set", "goal", String(PI.goal)); window.clarity("set", "page", PI.page); } catch (e) {} }
    if (C.posthogKey) {
      var payload = JSON.stringify({ api_key: C.posthogKey, event: name, distinct_id: visit.id, timestamp: new Date().toISOString(),
        properties: Object.assign({ $process_person_profile: false, $current_url: location.href, kiosk_visit: visit.id }, body) });
      var url = (C.posthogHost || "https://us.i.posthog.com").replace(/\/$/, "") + "/capture/";
      try { if (!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([payload], { type: "text/plain" })))) fetch(url, { method: "POST", body: payload, keepalive: true, mode: "no-cors" }); } catch (e) {}
    }
  }
  S.track = send;

  if (fresh) send("visit_start", { page: PI.page });
  send("page_view", { path: location.pathname.replace(/^.*?(global_goals|legal)/, "$1") || "home" });

  /* ---- idle: end the visit and go back to the home page ---- */
  var last = Date.now();
  function touch() { last = Date.now(); if (!visit.touched) { visit.touched = true; save(); } }
  ["pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach(function (ev) { window.addEventListener(ev, touch, { passive: true, capture: true }); });
  if (IDLE > 0) setInterval(function () {
    if (Date.now() - last < IDLE || !visit.touched) return;
    send("visit_end", { reason: "idle", events: visit.n });
    store(false, "");  // next page load starts a new visit
    location.replace(new URL(ROOT + "index.html", location.href).href.split("#")[0]);
  }, 1000);

  /* ---- automatic events ---- */
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var a = t.closest("a[href]");
    if (a) {
      var m = a.getAttribute("href").match(/global_goals\/goal-(\d+)/);
      if (m) {
        var src = t.closest(".wheel-links") ? "wheel" : t.closest(".sdg-pop") ? "goals_button" : t.closest(".related") ? "explore_other" : t.closest(".goal-card") ? "goals_list" : t.closest(".rt") ? "quiz_result" : t.closest(".nav") ? "menu" : "link";
        send("goal_open", { to_goal: +m[1], source: src });
      }
    }
    if (t.closest(".sdg-fab .toggle")) send("goals_button_open");
  }, true);
  var seenYw = false;
  document.addEventListener("pointerdown", function (e) { if (!seenYw && e.target.closest && e.target.closest(".yw")) { seenYw = true; send("year_wheel_touch"); } }, true);
})();
