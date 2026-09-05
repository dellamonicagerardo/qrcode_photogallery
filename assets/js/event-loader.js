/**
 * Caricamento eventi da eventi/*.json
 *
 * Selezione: ?event=nascita | ?event=matrimonio
 * Colori JSON: theme.colors (+ override opzionali da URL)
 *   ?bg=%23faf6f2&accent=%23c9a99a&text=%233d2f2a
 *   (camelCase o kebab-case: bgWarm / bg-warm)
 */

const COLOR_KEYS = [
  "bg", "bgWarm", "surface", "text", "textSoft",
  "accent", "accentLight", "gold", "gradient1", "gradient2",
];

function cssVarName(key) {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/** Override colori da query string (sopra il JSON evento) */
function colorOverridesFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const colors = {};
  COLOR_KEYS.forEach((key) => {
    const value = params.get(key) || params.get(cssVarName(key));
    if (value) colors[key] = value;
  });
  return colors;
}

function loadStylesheet(href, id) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function applyTheme(theme, urlColors = {}) {
  const root = document.documentElement;
  const colors = { ...(theme?.colors || {}), ...urlColors };

  COLOR_KEYS.forEach((key) => {
    const value = colors[key];
    if (value) root.style.setProperty(`--${cssVarName(key)}`, value);
  });

  if (urlColors.bg || colors.bg) {
    const el = document.querySelector('meta[name="theme-color"]');
    if (el) el.content = urlColors.bg || colors.bg;
  }

  if (theme?.fonts) {
    if (theme.fonts.googleUrl) {
      loadStylesheet(theme.fonts.googleUrl, "event-fonts");
    }
    if (theme.fonts.display) {
      root.style.setProperty("--font-display", `"${theme.fonts.display}", Georgia, serif`);
    }
    if (theme.fonts.body) {
      root.style.setProperty("--font-body", `"${theme.fonts.body}", system-ui, sans-serif`);
    }
  }
}

function applyMeta(meta) {
  if (!meta) return;
  if (meta.title) document.title = meta.title;
  if (meta.description) {
    const el = document.querySelector('meta[name="description"]');
    if (el) el.content = meta.description;
  }
  if (meta.themeColor) {
    const el = document.querySelector('meta[name="theme-color"]');
    if (el) el.content = meta.themeColor;
  }
}

function applyHero(hero) {
  if (!hero) return;

  const intro = document.getElementById("intro");
  const introBg = document.getElementById("intro-bg");
  const introOverlay = document.getElementById("intro-overlay");
  const eyebrow = document.getElementById("hero-eyebrow");
  const title = document.getElementById("hero-title");
  const subtitle = document.getElementById("hero-subtitle");
  const scrollLabel = document.getElementById("hero-scroll-label");

  if (eyebrow) eyebrow.textContent = hero.eyebrow || "";
  if (subtitle) subtitle.textContent = hero.subtitle || "";
  if (scrollLabel) scrollLabel.textContent = hero.scrollLabel || "Scorri";

  if (title) {
    const before = hero.titleBefore || "";
    const highlight = hero.titleHighlight || "";
    if (highlight) {
      title.innerHTML = `${escapeHtml(before)}<br><em>${escapeHtml(highlight)}</em>`;
    } else {
      title.textContent = before;
    }
  }

  if (hero.cover && introBg) {
    introBg.style.backgroundImage = `url("${hero.cover}")`;
    intro?.classList.add("has-cover");
    const opacity = hero.overlay ?? 0.5;
    if (introOverlay) introOverlay.style.opacity = String(opacity);
  } else {
    intro?.classList.remove("has-cover");
    if (introBg) introBg.style.backgroundImage = "";
    if (introOverlay) introOverlay.style.opacity = "0";
  }
}

function applyFooter(footer) {
  if (!footer) return;
  const symbol = document.getElementById("footer-symbol");
  const text = document.getElementById("footer-text");
  if (symbol) symbol.textContent = footer.symbol || "♥";
  if (text) text.textContent = footer.text || "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveEventId(manifest) {
  const fromUrl = new URLSearchParams(window.location.search).get("event");
  if (fromUrl) return fromUrl;
  return manifest.defaultEvent || manifest.events?.[0]?.id || null;
}

async function loadManifest() {
  const res = await fetch("eventi/manifest.json");
  if (!res.ok) throw new Error("Impossibile caricare eventi/manifest.json");
  return res.json();
}

async function loadEventConfig(manifest, eventId) {
  const entry = manifest.events?.find((e) => e.id === eventId);
  if (!entry) throw new Error(`Evento "${eventId}" non trovato`);

  const res = await fetch(`eventi/${entry.file}`);
  if (!res.ok) throw new Error(`Impossibile caricare eventi/${entry.file}`);
  return res.json();
}

function showBootError(message) {
  document.body.innerHTML = `
    <p style="padding:2rem;margin:0;color:#fff;background:#4a1515;font-family:sans-serif;line-height:1.6">
      ${escapeHtml(message)}<br><br>
      <small>Esempio: ?event=nascita</small>
    </p>`;
}

async function bootEvent() {
  const manifest = await loadManifest();
  const eventId = resolveEventId(manifest);
  if (!eventId) throw new Error("Nessun evento configurato");

  const config = await loadEventConfig(manifest, eventId);
  config.id = config.id || eventId;
  applyMeta(config.meta);
  applyTheme(config.theme, colorOverridesFromUrl());
  applyHero(config.hero);
  applyFooter(config.footer);

  return config;
}
