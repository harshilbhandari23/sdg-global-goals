/* Kiosk analytics settings. Fill in the IDs below to switch the tools on; leave one empty to switch it off.
   - clarityId:   project ID from https://clarity.microsoft.com (session replays + touch heatmaps)
   - posthogKey:  project API key from https://posthog.com (journeys, funnels, event counts). Use the EU host if your project is in the EU.
   - idleSeconds: seconds without a touch before a visit ends and the kiosk goes back to the home page (0 = never reset). */
window.SDG_ANALYTICS = {
  clarityId: "",
  posthogKey: "",
  posthogHost: "https://us.i.posthog.com",
  idleSeconds: 75
};
