/* Mounts the animated goal banner (a React component exported from the Framer project).
   Starts when the tab is visible so the animation plays from the beginning. */
const art = document.querySelector(".art[data-goal]");
function mount() {
  const n = String(art.dataset.goal).padStart(2, "0");
  import("./heroes/goal" + n + ".mjs").then(function (m) {
    window.ReactDOM.createRoot(art).render(window.React.createElement(m.default, {}));
  }).catch(function (e) { console.warn("Hero animation failed, showing static artwork", e); });
}
if (art && window.React && window.ReactDOM) {
  if (document.visibilityState === "visible") mount();
  else document.addEventListener("visibilitychange", function once() {
    if (document.visibilityState !== "visible") return;
    document.removeEventListener("visibilitychange", once); mount();
  });
}
