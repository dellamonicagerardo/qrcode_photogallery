const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|$)/i;

let galleryItems = [];

/* ── DOM refs ── */
const grid = document.getElementById("gallery-grid");
const lightbox = document.getElementById("lightbox");
const lightboxMedia = document.getElementById("lightbox-media");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxVideo = document.getElementById("lightbox-video");
const lightboxCounter = document.getElementById("lightbox-counter");
const lightboxThumbsTrack = document.getElementById("lightbox-thumbs-track");
const btnClose = document.getElementById("lightbox-close");
const btnPrev = document.getElementById("lightbox-prev");
const btnNext = document.getElementById("lightbox-next");

let currentIndex = 0;
let touchStartX = 0;
let thumbsBuilt = false;

function normalizeItem(raw) {
  if (typeof raw === "string") {
    if (VIDEO_EXT.test(raw)) return { type: "video", src: raw };
    return { type: "image", src: raw, ...imageVariants(raw) };
  }
  const src = raw.src || "";
  return {
    type: raw.type || "image",
    src,
    poster: raw.poster || "",
    thumb: raw.thumb || "",
    ...(raw.type === "video" ? {} : imageVariants(raw.thumb || src)),
  };
}

/** Da images/<evento>/full/foo.jpg → thumb in griglia */
function imageVariants(src) {
  if (src.includes("/full/")) {
    return {
      gridSrc: src.replace("/full/", "/thumbs/"),
      fullSrc: src,
    };
  }
  return { gridSrc: src, fullSrc: src };
}

function createImage(className, src, { lazy = false } = {}) {
  const img = document.createElement("img");
  img.className = className;
  img.src = src;
  img.alt = "";
  if (lazy) {
    img.loading = "lazy";
    img.decoding = "async";
  }
  return img;
}

function getItems() {
  return galleryItems.map(normalizeItem);
}

function itemLabel(item, index) {
  return item.type === "video" ? `Video ${index + 1}` : `Foto ${index + 1}`;
}

function initGallery(config) {
  galleryItems = config.items || [];
  grid.innerHTML = "";
  thumbsBuilt = false;
  buildGallery();
}

function isLightboxOpen() {
  return !lightbox.hidden && lightbox.classList.contains("open");
}

/* ── Build grid ── */
function buildGallery() {
  const items = getItems();

  items.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "gallery-item";
    el.role = "listitem";

    const btn = document.createElement("button");
    btn.className = "gallery-card";
    btn.type = "button";
    btn.setAttribute("aria-label", itemLabel(item, index));

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "gallery-media";

    if (item.type === "video") {
      mediaWrap.classList.add("is-video");

      const thumb = document.createElement("video");
      thumb.className = "gallery-thumb-video";
      thumb.src = item.src;
      thumb.preload = "metadata";
      thumb.muted = true;
      thumb.playsInline = true;
      thumb.setAttribute("aria-hidden", "true");
      if (item.poster) thumb.poster = item.poster;

      const badge = document.createElement("span");
      badge.className = "gallery-play-badge";
      badge.setAttribute("aria-hidden", "true");
      badge.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

      mediaWrap.append(thumb, badge);
    } else {
      mediaWrap.appendChild(
        createImage("gallery-thumb-img", item.gridSrc, { lazy: true })
      );
    }

    btn.appendChild(mediaWrap);
    btn.addEventListener("click", () => goToFoto(index));
    el.appendChild(btn);
    grid.appendChild(el);
  });

  observeItems();
}

/* ── Scroll reveal ── */
function observeItems() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".gallery-item").forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.07}s`;
    observer.observe(el);
  });
}

function thumbSrc(item) {
  if (item.type === "video") return item.poster || "";
  return item.gridSrc || item.thumb || item.src;
}

function buildLightboxThumbs() {
  const items = getItems();
  lightboxThumbsTrack.innerHTML = "";

  items.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lightbox-thumb";
    if (item.type === "video") btn.classList.add("is-video");
    btn.setAttribute("aria-label", itemLabel(item, index));

    const src = thumbSrc(item);
    if (src) {
      btn.appendChild(createImage("lightbox-thumb-img", src, { lazy: true }));
    }

    if (item.type === "video") {
      const badge = document.createElement("span");
      badge.className = "lightbox-thumb-play";
      badge.setAttribute("aria-hidden", "true");
      badge.innerHTML =
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      btn.appendChild(badge);
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentIndex === index) return;
      goToFoto(index, { replace: true });
    });

    lightboxThumbsTrack.appendChild(btn);
  });

  thumbsBuilt = true;
}

function updateLightboxThumbs() {
  if (!thumbsBuilt) buildLightboxThumbs();

  const buttons = lightboxThumbsTrack.querySelectorAll(".lightbox-thumb");
  buttons.forEach((btn, index) => {
    const isActive = index === currentIndex;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-current", isActive ? "true" : "false");
  });

  const active = buttons[currentIndex];
  if (active) {
    active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
}

/* ── Lightbox ── */
function resetLightboxVideo() {
  lightboxVideo.pause();
  lightboxVideo.removeAttribute("src");
  lightboxVideo.removeAttribute("poster");
  lightboxVideo.load();
}

/** Apre UI lightbox (chiamato dal router) */
function showLightbox(index) {
  currentIndex = index;
  updateLightbox();
  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add("open"));
  document.body.style.overflow = "hidden";
  btnClose.focus();
}

/** Chiude UI lightbox senza toccare history */
function hideLightbox() {
  resetLightboxVideo();
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
  setTimeout(() => {
    if (lightbox.classList.contains("open")) return;
    lightbox.hidden = true;
    lightboxImg.hidden = true;
    lightboxImg.removeAttribute("src");
    lightboxVideo.hidden = true;
    lightboxMedia.classList.remove("is-video", "is-landscape", "is-portrait");
  }, 300);
}

function updateLightbox() {
  const items = getItems();
  if (!items.length) return;
  const item = items[currentIndex];
  if (!item) return;

  if (item.type === "video") {
    lightboxImg.hidden = true;
    lightboxImg.removeAttribute("src");
    lightboxVideo.hidden = false;
    lightboxVideo.src = item.src;
    if (item.poster) lightboxVideo.poster = item.poster;
    else lightboxVideo.removeAttribute("poster");
    lightboxMedia.classList.add("is-video");
    lightboxMedia.classList.remove("is-landscape", "is-portrait");

    lightboxVideo.onloadedmetadata = () => {
      const { videoWidth: w, videoHeight: h } = lightboxVideo;
      lightboxMedia.classList.toggle("is-landscape", w >= h);
      lightboxMedia.classList.toggle("is-portrait", w < h);
    };
    if (lightboxVideo.readyState >= 1) {
      lightboxVideo.onloadedmetadata();
    }
  } else {
    resetLightboxVideo();
    lightboxVideo.hidden = true;
    lightboxImg.hidden = false;
    lightboxMedia.classList.remove("is-video");

    const img = lightboxImg;
    const fullSrc = item.fullSrc || item.src;
    img.src = fullSrc;

    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      lightboxMedia.classList.toggle("is-landscape", w >= h);
      lightboxMedia.classList.toggle("is-portrait", w < h);
    };
    if (img.complete) img.onload();
  }

  lightboxCounter.textContent = `${currentIndex + 1} / ${items.length}`;
  updateLightboxThumbs();
}

function navigate(dir) {
  const items = getItems();
  if (!items.length) return;
  const next = (currentIndex + dir + items.length) % items.length;
  goToFoto(next, { replace: true });
}

/* ── Events ── */
btnClose.addEventListener("click", () => closeFotoViaHistory());
btnPrev.addEventListener("click", () => navigate(-1));
btnNext.addEventListener("click", () => navigate(1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeFotoViaHistory();
});

document.addEventListener("keydown", (e) => {
  if (!isLightboxOpen()) return;
  if (e.key === "Escape") closeFotoViaHistory();
  if (e.key === "ArrowLeft") navigate(-1);
  if (e.key === "ArrowRight") navigate(1);
});

lightbox.addEventListener("touchstart", (e) => {
  if (e.target.closest(".lightbox-thumbs")) return;
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

lightbox.addEventListener("touchend", (e) => {
  if (e.target.closest(".lightbox-thumbs")) return;
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(diff) > 50) navigate(diff > 0 ? -1 : 1);
}, { passive: true });
