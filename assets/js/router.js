/**
 * Routing SPA (come qrcode_demo):
 *   ?event=<id>              → intro
 *   ?event=<id>#gallery      → gallery
 *   ?event=<id>#foto/3       → lightbox (1-based, condivisibile)
 *
 * Indietro smartphone / swipe / Esc / X → history.back()
 */

let ACTIVE_EVENT_ID = null;
let routeApplying = false;
let lightboxHistoryOpen = false;

function makeRoute(partial = {}) {
  return {
    spa: true,
    event: ACTIVE_EVENT_ID,
    view: "intro",
    index: null,
    depth: 0,
    ...partial,
  };
}

function routeDepth(route) {
  if (route.view === "foto") return 2;
  if (route.view === "gallery") return 1;
  return 0;
}

function withDepth(route) {
  return { ...route, depth: routeDepth(route) };
}

function routeHash(route) {
  if (route.view === "foto" && route.index != null) {
    return `#foto/${route.index + 1}`;
  }
  if (route.view === "gallery") return "#gallery";
  return "";
}

function parseHashRoute() {
  const raw = (window.location.hash || "").replace(/^#/, "").trim();
  if (!raw || raw === "intro") return makeRoute({ view: "intro" });

  if (raw === "gallery") return makeRoute({ view: "gallery" });

  const fotoMatch = raw.match(/^foto\/(\d+)$/i);
  if (fotoMatch) {
    const n = parseInt(fotoMatch[1], 10);
    if (n >= 1) return makeRoute({ view: "foto", index: n - 1 });
  }

  return makeRoute({ view: "intro" });
}

function eventUrl(route) {
  const url = new URL(window.location.href);
  if (ACTIVE_EVENT_ID) url.searchParams.set("event", ACTIVE_EVENT_ID);
  const hash = routeHash(route || currentSpaState() || makeRoute({ view: "intro" }));
  return `${url.pathname}${url.search}${hash}`;
}

function currentSpaState() {
  return history.state?.spa ? history.state : null;
}

function pushRoute(route) {
  history.pushState(withDepth(route), "", eventUrl(route));
}

function replaceRoute(route) {
  history.replaceState(withDepth(route), "", eventUrl(route));
}

function commitRoute(partial, mode = "push") {
  const route = withDepth(makeRoute({ ...currentSpaState(), ...partial }));
  applyRoute(route);
  if (mode === "push") pushRoute(route);
  else replaceRoute(route);
}

function scrollToIntro({ instant = false } = {}) {
  const intro = document.getElementById("intro");
  if (!intro) return;
  intro.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
}

function scrollToGallery({ instant = false } = {}) {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;
  gallery.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
}

function applyRoute(route) {
  routeApplying = true;
  try {
    if (route.view === "foto") {
      const items = typeof getItems === "function" ? getItems() : [];
      const max = Math.max(items.length - 1, 0);
      const index = Math.min(Math.max(route.index ?? 0, 0), max);
      showLightbox(index);
      scrollToGallery({ instant: true });
      lightboxHistoryOpen = true;
      return;
    }

    if (lightboxHistoryOpen || (typeof isLightboxOpen === "function" && isLightboxOpen())) {
      hideLightbox();
      lightboxHistoryOpen = false;
    }

    if (route.view === "gallery") {
      scrollToGallery({ instant: false });
    } else {
      scrollToIntro({ instant: false });
    }
  } finally {
    requestAnimationFrame(() => {
      routeApplying = false;
    });
  }
}

function goToGallery() {
  if (routeApplying) return;
  const state = currentSpaState();
  if (state?.view === "gallery" || state?.view === "foto") {
    scrollToGallery();
    return;
  }
  commitRoute({ view: "gallery", index: null }, "push");
}

function goToFoto(index, { replace = false } = {}) {
  if (routeApplying) return;
  const state = currentSpaState();
  const alreadyOpen = state?.view === "foto";

  if (alreadyOpen && replace) {
    commitRoute({ view: "foto", index }, "replace");
    return;
  }

  if (!alreadyOpen && state?.view !== "gallery") {
    // Seed gallery under foto so Back closes lightbox → gallery
    replaceRoute(makeRoute({ view: "gallery", index: null }));
  }

  commitRoute({ view: "foto", index }, alreadyOpen ? "replace" : "push");
}

function closeFotoViaHistory() {
  if (routeApplying) return;
  const state = currentSpaState();
  if (state?.view === "foto" && (state.depth || 0) > 0) {
    history.back();
    return;
  }
  hideLightbox();
  lightboxHistoryOpen = false;
  replaceRoute(makeRoute({ view: "gallery", index: null }));
}

function initRouter(eventId) {
  ACTIVE_EVENT_ID = eventId;

  // Normalizza ?event= per link condivisibili
  const url = new URL(window.location.href);
  if (url.searchParams.get("event") !== eventId) {
    url.searchParams.set("event", eventId);
    history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  window.addEventListener("popstate", (event) => {
    if (!ACTIVE_EVENT_ID) return;
    if (event.state?.spa) {
      applyRoute(event.state);
      return;
    }
    const route = parseHashRoute();
    applyRoute(route);
    replaceRoute(route);
  });

  const boot = withDepth(parseHashRoute());
  if (boot.view === "foto") {
    replaceRoute(makeRoute({ view: "gallery", index: null }));
    applyRoute(boot);
    pushRoute(boot);
  } else if (boot.view === "gallery") {
    replaceRoute(makeRoute({ view: "intro" }));
    applyRoute(boot);
    pushRoute(boot);
  } else {
    applyRoute(boot);
    replaceRoute(boot);
  }
}
