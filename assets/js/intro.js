function isVideoPath(src) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
}

function thumbFromItem(raw) {
  if (typeof raw === "string") {
    if (isVideoPath(raw)) return null;
    if (raw.includes("/full/")) return raw.replace("/full/", "/thumbs/");
    return raw;
  }
  if ((raw.type || "image") === "video") {
    const poster = raw.poster || "";
    if (!poster) return null;
    return poster.includes("/full/") ? poster.replace("/full/", "/thumbs/") : poster;
  }
  const src = raw.src || "";
  if (!src) return null;
  return src.includes("/full/") ? src.replace("/full/", "/thumbs/") : src;
}

function collectIntroThumbs(items) {
  const seen = new Set();
  const thumbs = [];
  for (const item of items || []) {
    const thumb = thumbFromItem(item);
    if (thumb && !seen.has(thumb)) {
      seen.add(thumb);
      thumbs.push(thumb);
    }
  }
  return thumbs;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function buildStripTrack(thumbs, reverse) {
  const track = document.createElement("div");
  track.className = "intro-strip-track";
  if (reverse) track.classList.add("is-reverse");

  const loop = [...thumbs, ...thumbs];
  loop.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.loading = "eager";
    img.decoding = "async";
    track.appendChild(img);
  });

  return track;
}

function initIntroBackground(config) {
  const stripWrap = document.getElementById("intro-strip-wrap");
  const stripTop = document.getElementById("intro-strip-top");
  const stripBottom = document.getElementById("intro-strip-bottom");

  if (!stripWrap || config.hero?.cover) return;

  const thumbs = collectIntroThumbs(config.items);
  if (!thumbs.length) return;

  document.getElementById("intro")?.classList.add("has-photos");

  stripTop.innerHTML = "";
  stripBottom.innerHTML = "";
  stripTop.appendChild(buildStripTrack(thumbs, false));
  stripBottom.appendChild(buildStripTrack([...thumbs].reverse(), true));

  if (prefersReducedMotion()) {
    stripWrap.querySelectorAll(".intro-strip-track").forEach((t) => {
      t.style.animation = "none";
    });
  }
}

function initIntro() {
  const scrollBtn = document.getElementById("intro-scroll");
  if (!scrollBtn) return;

  scrollBtn.addEventListener("click", () => {
    goToGallery();
  });
}
