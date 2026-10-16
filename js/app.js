/**
 * AddaTimes OTT Application Logic
 * Interactive engine powering Hero spotlight with Auto-Slider, trailer player, horizontal shelves,
 * live search, modals, subscription selections, countdown clock, watchlist, and conversion flows.
 */

// Application State
const AppState = {
  currentHeroIndex: 0,
  heroSoundMuted: true,
  activeTrailerId: "tr-1",
  activeGenre: "all",
  activeMovieTab: "latest",
  activeSeriesTab: "trending",
  activeReleaseTab: "just-released",
  selectedPlan: null,
  isAnnualBilling: true,
  watchlist: ["shobdo-jobdo", "feluda-sheyal-debota"] // Default pre-saved popular titles
};

let heroSliderInterval = null;
const HERO_DURATION = 5500; // 5.5 seconds per slide

// Official App Store Links & Deep Linking Configuration
const APP_LINKS = {
  android: "https://play.google.com/store/apps/details?id=com.addatimes.app&hl=en",
  ios: "https://apps.apple.com/in/app/addatimes/id1451433946",
  tv: "#app-download-section"
};

/**
 * Smart Device OS Detection
 * Detects whether the visitor is on Android, iOS, or Desktop
 */
function detectDeviceOS() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "ios";
  return "desktop";
}

/**
 * High-Conversion Smart App Redirection Engine
 * Mobile users are directly routed to their respective app store (zero-friction).
 * Desktop users open the download modal featuring QR scan code & SMS bridge.
 */
function redirectToApp(sourceTag = "generic") {
  const os = detectDeviceOS();
  console.log(`[AddaTimes Conversion] Routing to App. Source: ${sourceTag} | Detected OS: ${os}`);

  if (os === "android") {
    showToast("Launching Google Play Store...");
    setTimeout(() => {
      window.location.href = APP_LINKS.android;
    }, 350);
    return;
  }

  if (os === "ios") {
    showToast("Launching Apple App Store...");
    setTimeout(() => {
      window.location.href = APP_LINKS.ios;
    }, 350);
    return;
  }

  // Desktop / Other OS: open the download modal
  openAppDownloadModal(sourceTag);
}

// Initialize Application on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initMobileDrawer();
  initHeroSpotlight();
  initFeaturedTrailers();
  initTrendingShelf();
  initMoviesShelf();
  initSeriesShelf();
  initOriginalsGrid();
  initGenreDiscovery();
  initReleasesShowcase();
  initKeyboardShortcuts();
  initCountdownTimer();
  initFloatingBottomBar();
  updateWatchlistUI();
});

/* ==========================================================================
   1. HEADER & NAVIGATION & WATCHLIST DRAWER
   ========================================================================== */
function initHeaderScroll() {
  const header = document.getElementById("site-header");
  const floatingBar = document.getElementById("floating-bottom-bar");

  window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY;
    if (scrollPos > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    // Floating conversion bottom bar visibility
    if (floatingBar) {
      if (scrollPos > 350) {
        floatingBar.classList.add("visible");
      } else {
        floatingBar.classList.remove("visible");
      }
    }
  }, { passive: true });

  // Smooth scroll for anchor navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId !== "#") {
        const targetElem = document.querySelector(targetId);
        if (targetElem) {
          e.preventDefault();
          targetElem.scrollIntoView({ behavior: "smooth" });
          closeMobileDrawer();
        }
      }
    });
  });
}

function initMobileDrawer() {
  const toggleBtn = document.getElementById("mobile-toggle");
  const drawer = document.getElementById("mobile-drawer");
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("open");
    if (isOpen) {
      closeMobileDrawer();
    } else {
      drawer.classList.add("open");
      toggleBtn.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
    }
  });
}

function toggleMobileNavDrawer() {
  const drawer = document.getElementById("mobile-nav-drawer");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const toggleBtn = document.querySelector(".mobile-menu-toggle-btn");
  if (!drawer) return;

  const isOpen = drawer.classList.contains("open");
  if (isOpen) {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    if (backdrop) backdrop.classList.remove("open");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  } else {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (backdrop) backdrop.classList.add("open");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
}

function closeMobileDrawer() {
  const toggleBtn = document.getElementById("mobile-toggle");
  const drawer = document.getElementById("mobile-drawer");
  if (drawer) {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", "false");
  }
}

// Watchlist slide-over drawer
function toggleWatchlistDrawer() {
  const drawer = document.getElementById("watchlist-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  if (!drawer || !backdrop) return;

  const isOpen = drawer.classList.contains("open");
  if (isOpen) {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  } else {
    renderWatchlistDrawer();
    drawer.classList.add("open");
    backdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
  }
}

function toggleItemWatchlist(id) {
  const idx = AppState.watchlist.indexOf(id);
  const all = [...OTT_DATA.heroSpotlights, ...OTT_DATA.movies, ...OTT_DATA.webSeries, ...OTT_DATA.trending];
  const item = all.find(x => x.id === id);
  const title = item ? item.title : "Title";

  if (idx > -1) {
    AppState.watchlist.splice(idx, 1);
    showToast(`Removed "${title}" from Watchlist`);
  } else {
    AppState.watchlist.push(id);
    showToast(`Added "${title}" to your Watchlist!`);
  }

  updateWatchlistUI();
  renderWatchlistDrawer();
}

function updateWatchlistUI() {
  const count = AppState.watchlist.length;
  const railBadge = document.getElementById("rail-watchlist-badge");
  const mobileTopBadge = document.getElementById("mobile-top-watchlist-badge");
  const badge = document.getElementById("header-watchlist-badge");
  const mobCount = document.querySelector(".mobile-watchlist-count");
  const totalCount = document.getElementById("watchlist-total-count");
  const heroPlusBtn = document.getElementById("hero-plus-btn");

  if (railBadge) railBadge.textContent = count;
  if (mobileTopBadge) mobileTopBadge.textContent = count;
  if (badge) badge.textContent = count;
  if (mobCount) mobCount.textContent = count;
  if (totalCount) totalCount.textContent = `${count} saved title${count === 1 ? '' : 's'}`;

  // Update hero plus button state
  const currentHero = OTT_DATA.heroSpotlights[AppState.currentHeroIndex];
  if (heroPlusBtn && currentHero) {
    if (AppState.watchlist.includes(currentHero.id)) {
      heroPlusBtn.classList.add("in-watchlist");
      heroPlusBtn.setAttribute("title", "In Watchlist (Click to remove)");
      heroPlusBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else {
      heroPlusBtn.classList.remove("in-watchlist");
      heroPlusBtn.setAttribute("title", "Add to Watchlist");
      heroPlusBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    }
  }

  // Update all card bookmark icons
  document.querySelectorAll(".card-watchlist-quick").forEach(btn => {
    const cardId = btn.getAttribute("data-id");
    if (AppState.watchlist.includes(cardId)) {
      btn.classList.add("active");
      btn.innerHTML = "✓";
      btn.setAttribute("title", "In Watchlist");
    } else {
      btn.classList.remove("active");
      btn.innerHTML = "+";
      btn.setAttribute("title", "Add to Watchlist");
    }
  });
}

function renderWatchlistDrawer() {
  const container = document.getElementById("watchlist-items-list");
  if (!container) return;

  if (AppState.watchlist.length === 0) {
    container.innerHTML = `
      <div class="empty-watchlist-state">
        <div class="empty-icon">🎬</div>
        <p>Your watchlist is empty.</p>
        <span class="text-dim">Bookmark your favorite movies, web series, and trailers to watch them anytime.</span>
      </div>
    `;
    return;
  }

  const all = [...OTT_DATA.heroSpotlights, ...OTT_DATA.movies, ...OTT_DATA.webSeries, ...OTT_DATA.trending];

  container.innerHTML = AppState.watchlist.map(id => {
    const item = all.find(x => x.id === id) || { title: id, genre: "Entertainment", duration: "HD" };
    return `
      <div class="watchlist-item">
        <div class="wl-thumb" style="background: ${item.bg || item.posterBg || 'linear-gradient(135deg, #7f1d1d, #1e1b4b)'}"></div>
        <div class="wl-info">
          <h4 class="wl-title">${item.title}</h4>
          <span class="wl-meta">${item.genre || 'Thriller'} • ${item.duration || item.seasons || 'Feature'}</span>
          <div class="mt-2">
            <button class="btn-ghost-sm" onclick="toggleWatchlistDrawer(); playTrailer('${id}')">▶ Trailer</button>
          </div>
        </div>
        <button class="wl-remove-btn" onclick="toggleItemWatchlist('${id}')" title="Remove from list">✕</button>
      </div>
    `;
  }).join("");
}

function syncWatchlistToApp() {
  toggleWatchlistDrawer();
  redirectToApp("watchlist-sync");
}

/* ==========================================================================
   2. HERO SPOTLIGHT VIDEO SLIDER (Hoichoi Reference Pattern)
   ========================================================================== */
function initHeroSpotlight() {
  // Render the 4 live thumbnail preview cards in the bottom-right dock
  const thumbsRow = document.getElementById("hero-thumbs-row");
  if (thumbsRow && OTT_DATA.heroSpotlights.length) {
    thumbsRow.innerHTML = OTT_DATA.heroSpotlights.map((item, idx) => `
      <div class="hero-thumb-card ${idx === 0 ? 'active' : ''}" 
           id="hero-thumb-${idx}" 
           onclick="switchHeroSlide(${idx})"
           role="tab"
           aria-selected="${idx === 0 ? 'true' : 'false'}"
           title="${item.title}">
        <img src="${item.thumbImg || item.posterImg}" alt="${item.title}" class="hero-thumb-img" loading="lazy">
        <div class="hero-thumb-overlay">
          <span class="hero-thumb-badge">${item.thumbBadge || 'TRAILER'}</span>
          <span class="hero-thumb-title">${item.title}</span>
        </div>
      </div>
    `).join("");
  }

  renderHeroSlide(0);
  startHeroAutoSlide();

  const heroSection = document.getElementById("hero");
  if (heroSection) {
    heroSection.addEventListener("mouseenter", pauseHeroAutoSlide);
    heroSection.addEventListener("mouseleave", startHeroAutoSlide);
    heroSection.addEventListener("touchstart", pauseHeroAutoSlide, { passive: true });
    heroSection.addEventListener("touchend", startHeroAutoSlide, { passive: true });
  }
}

function startHeroAutoSlide() {
  if (heroSliderInterval) clearInterval(heroSliderInterval);
  heroSliderInterval = setInterval(() => {
    const nextIdx = (AppState.currentHeroIndex + 1) % OTT_DATA.heroSpotlights.length;
    switchHeroSlide(nextIdx, false);
  }, 7500); // 7.5 seconds per trailer slide
}

function pauseHeroAutoSlide() {
  if (heroSliderInterval) {
    clearInterval(heroSliderInterval);
    heroSliderInterval = null;
  }
}

function advanceHeroSlide(step = 1) {
  const total = OTT_DATA.heroSpotlights.length;
  const nextIdx = (AppState.currentHeroIndex + step + total) % total;
  switchHeroSlide(nextIdx, true);
}

function switchHeroSlide(index, restartTimer = true) {
  AppState.currentHeroIndex = index;
  renderHeroSlide(index);
  if (restartTimer) {
    startHeroAutoSlide();
  }
}

function renderHeroSlide(index) {
  const item = OTT_DATA.heroSpotlights[index];
  if (!item) return;

  const ytPlayer = document.getElementById("hero-youtube-player");
  const fallback = document.getElementById("hero-video-fallback");

  const bengaliTitle = document.getElementById("hero-bengali-title");
  const title = document.getElementById("hero-title");
  const genreText = document.getElementById("hero-genre-text");
  const seasonsText = document.getElementById("hero-seasons-text");
  const yearText = document.getElementById("hero-year-text");
  const censorText = document.getElementById("hero-censor-text");

  // Fallback background image
  if (fallback) {
    if (item.posterImg) {
      fallback.style.backgroundImage = `url('${item.posterImg}')`;
      fallback.style.opacity = "1";
    } else if (item.posterBg) {
      fallback.style.background = item.posterBg;
    }
  }

  // Update YouTube background video stream
  if (ytPlayer && item.youtubeId) {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&mute=${AppState.heroSoundMuted ? 1 : 0}&controls=0&loop=1&playlist=${item.youtubeId}&modestbranding=1&rel=0&showinfo=0&disablekb=1&playsinline=1&iv_load_policy=3&enablejsapi=1`;
    if (!ytPlayer.src.includes(item.youtubeId)) {
      ytPlayer.src = embedUrl;
    }
  }

  // Update Left Lead Info
  if (bengaliTitle) bengaliTitle.textContent = item.bengaliTitle || item.title;
  if (title) title.textContent = item.title;
  if (genreText) genreText.textContent = item.genre || "Trailer";
  if (seasonsText) seasonsText.textContent = item.seasons || item.duration || "Exclusive";
  if (yearText) yearText.textContent = item.year || "2026";
  if (censorText) censorText.textContent = item.ageRating || "U/A 13+";

  // Update Thumbnail Active Highlight (Glowing Red Border)
  document.querySelectorAll(".hero-thumb-card").forEach((card, idx) => {
    if (idx === index) {
      card.classList.add("active");
      card.setAttribute("aria-selected", "true");
    } else {
      card.classList.remove("active");
      card.setAttribute("aria-selected", "false");
    }
  });

  updateWatchlistUI();
}

function handleHeroWatchNow() {
  redirectToApp("hero-watch-primary");
}

function handleHeroTrailerClick() {
  const currentHero = OTT_DATA.heroSpotlights[AppState.currentHeroIndex];
  if (currentHero) {
    playTrailer(currentHero.id);
  }
}

function handleHeroPlusClick() {
  const currentHero = OTT_DATA.heroSpotlights[AppState.currentHeroIndex];
  if (currentHero) {
    toggleItemWatchlist(currentHero.id);
  }
}

function toggleHeroSound() {
  AppState.heroSoundMuted = !AppState.heroSoundMuted;
  const ytPlayer = document.getElementById("hero-youtube-player");
  const video = document.getElementById("hero-bg-video");
  const btn = document.getElementById("hero-sound-toggle");
  const icon = document.getElementById("hero-sound-icon");

  if (ytPlayer && ytPlayer.contentWindow) {
    const command = AppState.heroSoundMuted ? 'mute' : 'unMute';
    ytPlayer.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command }), '*');
  }

  if (video) {
    video.muted = AppState.heroSoundMuted;
  }

  if (AppState.heroSoundMuted) {
    if (btn) btn.setAttribute("title", "Sound Muted (Click to Unmute)");
    if (icon) {
      icon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      `;
    }
    showToast("Audio muted");
  } else {
    if (btn) btn.setAttribute("title", "Sound Unmuted (Click to Mute)");
    if (icon) {
      icon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      `;
    }
    showToast("Ambient audio enabled");
  }
}

/* ==========================================================================
   3. FEATURED TRAILERS & SHELF
   ========================================================================== */
function initFeaturedTrailers() {
  renderTrailersShelf("all");
  setActiveFeaturedPlayer(OTT_DATA.trailers[0]);
}

function filterTrailers(category, btnElem) {
  const tabs = document.querySelectorAll(".trailer-category-filters .filter-tab");
  tabs.forEach(t => {
    t.classList.remove("active");
    t.setAttribute("aria-selected", "false");
  });
  if (btnElem) {
    btnElem.classList.add("active");
    btnElem.setAttribute("aria-selected", "true");
  }

  renderTrailersShelf(category);
}

function renderTrailersShelf(category) {
  const shelf = document.getElementById("trailers-shelf");
  if (!shelf) return;

  const filtered = category === "all"
    ? OTT_DATA.trailers
    : OTT_DATA.trailers.filter(t => t.category === category);

  shelf.innerHTML = filtered.map(t => `
    <div class="trailer-card ${t.id === AppState.activeTrailerId ? 'active-card' : ''}" onclick="selectTrailerItem('${t.id}')">
      <div class="trailer-thumb-wrap">
        <div class="trailer-thumb-art" style="background-image: url('${t.posterImg}'); background-size: cover; background-position: center;"></div>
        <div class="trailer-thumb-overlay">
          <div class="thumb-play-icon">▶</div>
        </div>
        <span class="trailer-duration-badge">${t.duration}</span>
      </div>
      <div class="trailer-card-body">
        <h4 class="trailer-card-title">${t.title}</h4>
        <div class="trailer-card-meta">
          <span>${t.genre}</span>
          <span style="color:${t.color || '#ef4444'}; font-weight:700;">${t.type}</span>
        </div>
      </div>
    </div>
  `).join("");
}

function selectTrailerItem(trailerId) {
  AppState.activeTrailerId = trailerId;
  const item = OTT_DATA.trailers.find(t => t.id === trailerId);
  if (!item) return;

  setActiveFeaturedPlayer(item);

  // If inline player was active, auto-load the selected trailer
  const ytWrap = document.getElementById("featured-youtube-wrap");
  if (ytWrap && ytWrap.style.display === "block") {
    triggerActiveTrailerPlay();
  }

  // Update active state in shelf
  document.querySelectorAll(".trailer-card").forEach(c => c.classList.remove("active-card"));
  const clickedCard = document.querySelector(`.trailer-card[onclick="selectTrailerItem('${trailerId}')"]`);
  if (clickedCard) clickedCard.classList.add("active-card");
}

function setActiveFeaturedPlayer(trailer) {
  const poster = document.getElementById("trailer-player-poster");
  const title = document.getElementById("active-trailer-title");
  const sub = document.getElementById("active-trailer-sub");
  const timeElem = document.getElementById("active-trailer-hud-time");

  if (poster) {
    poster.style.backgroundImage = `url('${trailer.posterImg}')`;
    poster.style.backgroundSize = "cover";
    poster.style.backgroundPosition = "center";
  }
  if (title) title.textContent = trailer.title;
  if (sub) {
    sub.textContent = `${trailer.genre} • ${trailer.duration} • Director: ${trailer.director} • Starring: ${trailer.starring || 'Bengal Stars'}`;
  }
  if (timeElem) {
    timeElem.textContent = `00:45 / ${trailer.duration} • Full HD 1080p • Official AddaTimes YouTube Channel`;
  }
}

function triggerActiveTrailerPlay() {
  const current = OTT_DATA.trailers.find(t => t.id === AppState.activeTrailerId) || OTT_DATA.trailers[0];
  const ytWrap = document.getElementById("featured-youtube-wrap");
  if (ytWrap && current.youtubeId) {
    ytWrap.style.display = "block";
    ytWrap.innerHTML = `
      <button class="featured-close-inline" onclick="closeInlineTrailerPlayer()" title="Close Player" aria-label="Close inline video">✕</button>
      <iframe 
        width="100%" 
        height="100%" 
        src="https://www.youtube-nocookie.com/embed/${current.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1" 
        title="${current.title} Official Trailer" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen
        style="width: 100%; height: 100%; border: 0;">
      </iframe>
    `;
    showToast(`Streaming ${current.title}`);
  } else {
    playTrailer(current.id);
  }
}

function closeInlineTrailerPlayer() {
  const ytWrap = document.getElementById("featured-youtube-wrap");
  if (ytWrap) {
    ytWrap.style.display = "none";
    ytWrap.innerHTML = "";
  }
}

function exploreAllTrailers() {
  redirectToApp("explore-trailers");
}

/* ==========================================================================
   4. TRENDING NOW (#1 to #10 Badges)
   ========================================================================== */
let trendingAutoSliderTimer = null;
let isTrendingHovered = false;

function initTrendingShelf() {
  const shelf = document.getElementById("trending-shelf");
  if (!shelf) return;

  shelf.innerHTML = OTT_DATA.trending.map(item => `
    <div class="trending-card" onclick="openContentDetail('${item.id}', 'trending')">
      <div class="trending-rank-num">${item.rank}</div>
      <div class="trending-poster-box">
        <div class="poster-art-full" style="background: ${item.bg}"></div>
        <button class="card-watchlist-quick" data-id="${item.id}" onclick="event.stopPropagation(); toggleItemWatchlist('${item.id}')" title="Add to Watchlist">+</button>
        <div class="poster-gradient-bottom">
          <span class="card-badge-pill">${item.badgeType}</span>
          <h4 class="trending-title">${item.title}</h4>
          <span class="trending-sub">${item.genre} • ${item.duration}</span>
        </div>
      </div>
    </div>
  `).join("");

  startTrendingAutoSlider();
}

function startTrendingAutoSlider() {
  const shelf = document.getElementById("trending-shelf");
  if (!shelf) return;

  if (trendingAutoSliderTimer) {
    clearInterval(trendingAutoSliderTimer);
  }

  const wrapper = shelf.closest(".horizontal-shelf-wrapper") || shelf;

  if (!shelf.dataset.autoSliderInit) {
    shelf.dataset.autoSliderInit = "true";

    // Pause auto-sliding on hover / user interaction
    wrapper.addEventListener("mouseenter", () => {
      isTrendingHovered = true;
    });
    wrapper.addEventListener("mouseleave", () => {
      isTrendingHovered = false;
    });

    // Touch support for mobile / tablet
    wrapper.addEventListener("touchstart", () => {
      isTrendingHovered = true;
    }, { passive: true });
    wrapper.addEventListener("touchend", () => {
      setTimeout(() => {
        isTrendingHovered = false;
      }, 2500);
    }, { passive: true });
  }

  // Smooth periodic auto-sliding every 2.8 seconds
  trendingAutoSliderTimer = setInterval(() => {
    if (isTrendingHovered) return;

    const card = shelf.querySelector(".trending-card");
    const step = card ? (card.offsetWidth + 20) : 280;
    const maxScroll = shelf.scrollWidth - shelf.clientWidth;

    if (shelf.scrollLeft >= maxScroll - 25) {
      shelf.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      shelf.scrollBy({ left: step, behavior: "smooth" });
    }
  }, 2800);
}

function showAllTrending() {
  redirectToApp("trending-all");
}

/* ==========================================================================
   5. MOVIES SHELF & TABS (FILLED WITH HIGH DENSITY!)
   ========================================================================== */
function initMoviesShelf() {
  renderMoviesShelf("latest");
}

function filterMoviesCategory(cat, btnElem) {
  AppState.activeMovieTab = cat;
  const tabs = document.querySelectorAll("#movies .sub-tab");
  tabs.forEach(t => t.classList.remove("active"));
  if (btnElem) btnElem.classList.add("active");

  renderMoviesShelf(cat);
}

function renderMoviesShelf(category) {
  const shelf = document.getElementById("movies-shelf");
  if (!shelf) return;

  const filtered = OTT_DATA.movies.filter(m => 
    (m.categories && m.categories.includes(category)) || 
    m.category === category || 
    category === "all"
  );
  const listToRender = filtered.length > 0 ? filtered : OTT_DATA.movies;

  shelf.innerHTML = listToRender.map(m => `
    <div class="movie-card" onclick="openContentDetail('${m.id}', 'movie')">
      <div class="card-poster-wrap">
        <div class="card-poster-art" style="background: ${m.bg}"></div>
        <span class="card-badge-top">${m.badge}</span>
        <button class="card-watchlist-quick" data-id="${m.id}" onclick="event.stopPropagation(); toggleItemWatchlist('${m.id}')" title="Add to Watchlist">+</button>
        <div class="card-quick-overlay">
          <h4 class="card-title">${m.title}</h4>
          <div class="card-meta-row">
            <span>${m.genre}</span>
            <span class="rating-gold">${m.rating}</span>
          </div>
          <div class="card-actions-hover">
            <button class="btn-card-action btn-card-trailer" onclick="event.stopPropagation(); playTrailer('${m.id}')">Trailer</button>
            <button class="btn-card-action btn-card-app" onclick="event.stopPropagation(); redirectToApp('movie-card')">Watch App</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  updateWatchlistUI();
}

/* ==========================================================================
   6. WEB SERIES SHELF & TABS (FILLED WITH HIGH DENSITY!)
   ========================================================================== */
function initSeriesShelf() {
  renderSeriesShelf("trending");
}

function filterSeriesCategory(cat, btnElem) {
  AppState.activeSeriesTab = cat;
  const tabs = document.querySelectorAll("#web-series .sub-tab");
  tabs.forEach(t => t.classList.remove("active"));
  if (btnElem) btnElem.classList.add("active");

  renderSeriesShelf(cat);
}

function renderSeriesShelf(category) {
  const shelf = document.getElementById("series-shelf");
  if (!shelf) return;

  const filtered = OTT_DATA.webSeries.filter(s => 
    (s.categories && s.categories.includes(category)) || 
    s.category === category || 
    category === "all"
  );
  const listToRender = filtered.length > 0 ? filtered : OTT_DATA.webSeries;

  shelf.innerHTML = listToRender.map(s => `
    <div class="movie-card" onclick="openContentDetail('${s.id}', 'series')">
      <div class="card-poster-wrap">
        <div class="card-poster-art" style="background: ${s.bg}"></div>
        <span class="card-badge-top">${s.badge}</span>
        <button class="card-watchlist-quick" data-id="${s.id}" onclick="event.stopPropagation(); toggleItemWatchlist('${s.id}')" title="Add to Watchlist">+</button>
        <div class="card-quick-overlay">
          <h4 class="card-title">${s.title}</h4>
          <div class="card-meta-row">
            <span>${s.genre}</span>
            <span class="rating-gold">${s.rating}</span>
          </div>
          <div class="card-actions-hover">
            <button class="btn-card-action btn-card-trailer" onclick="event.stopPropagation(); playTrailer('${s.id}')">Trailer</button>
            <button class="btn-card-action btn-card-app" onclick="event.stopPropagation(); redirectToApp('series-card')">Watch App</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  updateWatchlistUI();
}

function exploreAllCategory(type) {
  redirectToApp(`explore-${type}`);
}

/* ==========================================================================
   7. OTT ORIGINALS SHOWCASE GRID
   ========================================================================== */
function initOriginalsGrid() {
  const grid = document.getElementById("originals-grid");
  if (!grid) return;

  const quotes = [
    "“The most gripping psychological thriller produced in Bengal.” — Film Companion",
    "“Feluda has never looked sharper or more majestic in 4K.” — Times of India",
    "“Unapologetic, stylish, and utterly binge-worthy noir.” — Ananda Bazaar"
  ];

  grid.innerHTML = OTT_DATA.originals.map((orig, i) => `
    <div class="original-feature-card" onclick="openContentDetail('${orig.id}', 'original')">
      <div class="orig-poster-banner">
        <div class="orig-art" style="background: ${orig.bg}"></div>
        <div class="orig-overlay">
          <span class="orig-eyebrow-badge">${orig.eyebrow}</span>
          <span class="orig-rating-pill">${orig.rating}</span>
        </div>
      </div>
      <div class="orig-card-body">
        <h3 class="orig-title">${orig.title}</h3>
        <p class="orig-tagline">${orig.tagline}</p>
        <p class="orig-synopsis">${orig.synopsis}</p>
        <div class="orig-critics-quote">${quotes[i % quotes.length]}</div>
        <div class="orig-award-strip">🏆 ${orig.award}</div>
        <div class="orig-actions-row">
          <button class="btn-primary w-full pulse-btn" onclick="event.stopPropagation(); redirectToApp('original-spotlight')">
            <span>Stream Ep 1 Free</span>
          </button>
          <button class="btn-secondary" onclick="event.stopPropagation(); playTrailer('${orig.id}')">
            <span>Trailer</span>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

/* ==========================================================================
   8. GENRE DISCOVERY SYSTEM
   ========================================================================== */
function initGenreDiscovery() {
  renderGenreShowcase("all");
}

function selectGenre(genre, chipElem) {
  AppState.activeGenre = genre;
  const chips = document.querySelectorAll(".genre-chip");
  chips.forEach(c => c.classList.remove("active"));
  if (chipElem) chipElem.classList.add("active");

  renderGenreShowcase(genre);
}

function renderGenreShowcase(genre) {
  const shelf = document.getElementById("genre-shelf");
  const countLabel = document.getElementById("genre-results-count");
  if (!shelf) return;

  const allContent = [...OTT_DATA.movies, ...OTT_DATA.webSeries];
  const filtered = genre === "all"
    ? allContent
    : allContent.filter(item => {
        const itemGenre = (item.genre + " " + (item.subGenre || "")).toLowerCase();
        return itemGenre.includes(genre.toLowerCase());
      });

  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} handpicked titles for ${genre === 'all' ? 'All Genres' : genre.toUpperCase()}`;
  }

  shelf.innerHTML = filtered.map(item => `
    <div class="movie-card" onclick="openContentDetail('${item.id}', 'genre')">
      <div class="card-poster-wrap">
        <div class="card-poster-art" style="background: ${item.bg}"></div>
        <span class="card-badge-top">${item.badge || 'HD'}</span>
        <button class="card-watchlist-quick" data-id="${item.id}" onclick="event.stopPropagation(); toggleItemWatchlist('${item.id}')" title="Add to Watchlist">+</button>
        <div class="card-quick-overlay">
          <h4 class="card-title">${item.title}</h4>
          <div class="card-meta-row">
            <span>${item.genre}</span>
            <span class="rating-gold">${item.rating}</span>
          </div>
          <div class="card-actions-hover">
            <button class="btn-card-action btn-card-trailer" onclick="event.stopPropagation(); playTrailer('${item.id}')">Trailer</button>
            <button class="btn-card-action btn-card-app" onclick="event.stopPropagation(); redirectToApp('genre-card')">Watch App</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  updateWatchlistUI();
}

/* ==========================================================================
   9. NEW RELEASES & COMING SOON + LIVE COUNTDOWN
   ========================================================================== */
function initReleasesShowcase() {
  renderReleaseList("just-released");
}

function switchReleaseTab(tabType, btnElem) {
  AppState.activeReleaseTab = tabType;
  const btns = document.querySelectorAll(".segmented-control .segment-btn");
  btns.forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });
  if (btnElem) {
    btnElem.classList.add("active");
    btnElem.setAttribute("aria-selected", "true");
  }

  renderReleaseList(tabType);
}

function renderReleaseList(type) {
  const container = document.getElementById("releases-container");
  if (!container) return;

  let items = OTT_DATA.newReleases.justReleased;
  if (type === "this-friday") {
    items = OTT_DATA.newReleases.thisFriday;
  } else if (type === "coming-soon") {
    items = OTT_DATA.newReleases.comingSoon;
  }

  const isComing = type !== "just-released";

  container.innerHTML = items.map(item => `
    <div class="release-item-card">
      <div class="release-header-art">
        <div class="release-art-bg" style="background: ${item.bg}"></div>
        <span class="release-date-badge">${item.releaseDate}</span>
      </div>
      <div class="release-card-body">
        <h4 class="release-title">${item.title}</h4>
        <span class="release-genre">${item.genre} • ${item.type}</span>
        <p class="release-desc">${item.synopsis}</p>
        <div class="release-card-actions">
          ${isComing 
            ? `<button class="btn-secondary w-full" onclick="setReleaseReminder('${item.title}')">🔔 Remind Me</button>`
            : `<button class="btn-primary w-full pulse-btn" onclick="redirectToApp('release-item')">Stream in App</button>`
          }
        </div>
      </div>
    </div>
  `).join("");
}

function setReleaseReminder(title) {
  showToast(`Reminder set for "${title}"! We'll notify you on premiere day.`);
}

function initCountdownTimer() {
  // Target premiere date: Nov 14, 2026
  let secondsLeft = (3 * 86400) + (14 * 3600) + (28 * 60) + 45;

  setInterval(() => {
    if (secondsLeft > 0) {
      secondsLeft--;
      const d = Math.floor(secondsLeft / 86400);
      const h = Math.floor((secondsLeft % 86400) / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;

      const dElem = document.getElementById("cd-days");
      const hElem = document.getElementById("cd-hours");
      const mElem = document.getElementById("cd-mins");
      const sElem = document.getElementById("cd-secs");

      if (dElem) dElem.textContent = String(d).padStart(2, '0');
      if (hElem) hElem.textContent = String(h).padStart(2, '0');
      if (mElem) mElem.textContent = String(m).padStart(2, '0');
      if (sElem) sElem.textContent = String(s).padStart(2, '0');
    }
  }, 1000);
}

/* ==========================================================================
   10. APP DOWNLOAD LEAD MAGNET & SMS
   ========================================================================== */
function triggerDownload(platform) {
  let targetUrl = APP_LINKS.android;
  let platformLabel = "Google Play Store";

  if (platform === "ios") {
    targetUrl = APP_LINKS.ios;
    platformLabel = "Apple App Store";
  } else if (platform === "android-tv" || platform === "apple-tv") {
    showToast("Search 'AddaTimes' on your Smart TV / FireStick App Store");
    return;
  }

  showToast(`Opening ${platformLabel}...`);
  setTimeout(() => {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }, 300);
}

function handleSendAppSMS(e) {
  e.preventDefault();
  const input = document.getElementById("mobile-phone-input");
  const feedback = document.getElementById("sms-feedback");
  if (!input) return;

  const phone = input.value.trim();
  if (phone.length === 10) {
    feedback.textContent = `✓ Instant download link sent to +91 ${phone}! Check SMS.`;
    showToast(`SMS sent to +91 ${phone}`);
    input.value = "";
    setTimeout(() => {
      feedback.textContent = "";
    }, 5000);
  }
}

function handleModalSMS(e) {
  e.preventDefault();
  const input = document.getElementById("modal-phone-input");
  const feedback = document.getElementById("modal-sms-feedback");
  if (!input) return;

  const phone = input.value.trim();
  if (phone.length === 10) {
    feedback.textContent = `✓ Link sent to +91 ${phone}!`;
    showToast(`Download link sent to +91 ${phone}`);
    input.value = "";
    setTimeout(() => {
      feedback.textContent = "";
      closeAppDownloadModal();
    }, 2000);
  }
}

/* ==========================================================================
   11. SUBSCRIPTION PLANS & BILLING TOGGLE
   ========================================================================== */
function toggleBillingCycle() {
  AppState.isAnnualBilling = !AppState.isAnnualBilling;
  const switchBtn = document.getElementById("billing-switch");
  const lblMonthly = document.getElementById("lbl-monthly");
  const lblAnnual = document.getElementById("lbl-annual");
  const priceYearly = document.getElementById("price-yearly");

  if (AppState.isAnnualBilling) {
    if (switchBtn) {
      switchBtn.classList.add("active");
      switchBtn.setAttribute("aria-checked", "true");
    }
    if (lblMonthly) lblMonthly.classList.remove("active");
    if (lblAnnual) lblAnnual.classList.add("active");
    if (priceYearly) priceYearly.textContent = "899";
    showToast("Annual VIP billing selected — Save 50%!");
  } else {
    if (switchBtn) {
      switchBtn.classList.remove("active");
      switchBtn.setAttribute("aria-checked", "false");
    }
    if (lblMonthly) lblMonthly.classList.add("active");
    if (lblAnnual) lblAnnual.classList.remove("active");
    if (priceYearly) priceYearly.textContent = "1,788";
    showToast("Monthly cycle selected");
  }
}

function selectPlan(planName, price) {
  AppState.selectedPlan = { name: planName, price: price };
  showToast(`Selected ${planName} Plan (₹${price}). Opening secure subscription...`);
  setTimeout(() => {
    redirectToApp(`pricing-${planName.toLowerCase()}`);
  }, 800);
}

/* ==========================================================================
   12. FLOATING BOTTOM BAR
   ========================================================================== */
function initFloatingBottomBar() {
  // Handled inside initHeaderScroll for seamless performance
}

/* ==========================================================================
   13. FAQ ACCORDION
   ========================================================================== */
function toggleFaq(button) {
  const item = button.closest(".faq-item");
  const isActive = item.classList.contains("active");

  document.querySelectorAll(".faq-item").forEach(el => {
    el.classList.remove("active");
    const btn = el.querySelector(".faq-question");
    if (btn) btn.setAttribute("aria-expanded", "false");
  });

  if (!isActive) {
    item.classList.add("active");
    button.setAttribute("aria-expanded", "true");
  }
}

/* ==========================================================================
   14. HORIZONTAL SHELF SCROLLER (ARROWS < and >)
   ========================================================================== */
function scrollShelf(shelfId, direction) {
  const shelf = document.getElementById(shelfId);
  if (!shelf) return;
  const card = shelf.querySelector(".trending-card, .movie-card");
  const cardWidth = card ? (card.offsetWidth + 20) : 280;
  const scrollAmount = (shelf.clientWidth > 600 ? cardWidth * 2 : cardWidth) * direction;
  shelf.scrollBy({ left: scrollAmount, behavior: "smooth" });

  if (shelfId === "trending-shelf") {
    startTrendingAutoSlider();
  }
}

function scrollToSection(sectionId) {
  const elem = document.getElementById(sectionId);
  if (elem) {
    elem.scrollIntoView({ behavior: "smooth" });
  }
}

/* ==========================================================================
   15. MODALS & DIALOG ENGINE
   ========================================================================== */
function playTrailer(idOrSlug) {
  const modal = document.getElementById("trailer-modal");
  const titleElem = document.getElementById("modal-trailer-title");
  const catElem = document.getElementById("modal-trailer-category");
  const synElem = document.getElementById("modal-trailer-synopsis");
  const videoContainer = document.getElementById("modal-video-container");

  let found = OTT_DATA.heroSpotlights.find(s => s.id === idOrSlug) ||
              OTT_DATA.trailers.find(t => t.id === idOrSlug) ||
              OTT_DATA.movies.find(m => m.id === idOrSlug) ||
              OTT_DATA.webSeries.find(s => s.id === idOrSlug) ||
              OTT_DATA.originals.find(o => o.id === idOrSlug);

  if (!found) {
    found = OTT_DATA.heroSpotlights[0] || OTT_DATA.trailers[0];
  }

  if (titleElem) titleElem.textContent = found.title;
  if (catElem) catElem.textContent = `${found.genre || 'OFFICIAL TRAILER'} • UNCUT PREVIEW`;
  if (synElem) synElem.textContent = found.synopsis || "Stream the complete movie or web series uncut in 4K on the AddaTimes App.";

  if (modal) {
    if (videoContainer) {
      if (found.youtubeId) {
        // Embed official YouTube trailer in HD with controls and autoplay
        videoContainer.innerHTML = `
          <iframe 
            id="modal-youtube-iframe"
            width="100%" 
            height="100%" 
            src="https://www.youtube-nocookie.com/embed/${found.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1" 
            title="${found.title} Trailer" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen
            style="width: 100%; height: 100%; aspect-ratio: 16/9; min-height: 380px; border: 0; border-radius: 8px;">
          </iframe>
        `;
      } else {
        videoContainer.innerHTML = `
          <video id="modal-video-player" controls preload="metadata" playsinline style="width: 100%; height: 100%; border-radius: 8px;">
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" type="video/mp4">
            Your browser does not support HTML5 video.
          </video>
        `;
        const videoElem = document.getElementById("modal-video-player");
        if (videoElem) {
          videoElem.currentTime = 0;
          videoElem.play().catch(() => {});
        }
      }
    }
    modal.showModal();
  }
}

function closeTrailerModal() {
  const modal = document.getElementById("trailer-modal");
  const videoContainer = document.getElementById("modal-video-container");
  if (videoContainer) {
    // Clearing the container immediately stops YouTube video and audio
    videoContainer.innerHTML = '';
  }
  if (modal) {
    modal.close();
  }
}

function openContentDetail(id, context) {
  const modal = document.getElementById("content-detail-modal");
  if (!modal) return;

  const all = [
    ...OTT_DATA.heroSpotlights,
    ...OTT_DATA.trending,
    ...OTT_DATA.movies,
    ...OTT_DATA.webSeries,
    ...OTT_DATA.originals
  ];

  const item = all.find(x => x.id === id) || all[0];

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-genre").textContent = item.genre || "Drama";
  document.getElementById("detail-duration").textContent = item.duration || "2h";
  document.getElementById("detail-rating").textContent = item.rating || "⭐ 9.0";
  document.getElementById("detail-year").textContent = item.year || "2026";
  document.getElementById("detail-synopsis").textContent = item.synopsis || "Detailed synopsis unavailable.";
  document.getElementById("detail-cast").textContent = item.cast || item.starring || "Leading Bengali Cast";
  document.getElementById("detail-director").textContent = item.director || "AddaTimes Signature Directors";

  const backdrop = document.getElementById("detail-backdrop");
  if (backdrop) backdrop.style.background = item.bg || item.posterBg || "linear-gradient(135deg, #7f1d1d, #1e1b4b)";

  const trailerBtn = document.getElementById("detail-watch-trailer-btn");
  if (trailerBtn) {
    trailerBtn.onclick = () => {
      closeDetailModal();
      playTrailer(item.id);
    };
  }

  const wlBtn = document.getElementById("detail-watchlist-btn");
  if (wlBtn) {
    const inList = AppState.watchlist.includes(item.id);
    wlBtn.textContent = inList ? "✓ In Watchlist" : "+ Add to Watchlist";
    wlBtn.onclick = () => {
      toggleItemWatchlist(item.id);
      wlBtn.textContent = AppState.watchlist.includes(item.id) ? "✓ In Watchlist" : "+ Add to Watchlist";
    };
  }

  modal.showModal();
}

function closeDetailModal() {
  const modal = document.getElementById("content-detail-modal");
  if (modal) modal.close();
}

function openAppDownloadModal(sourceTag = "generic") {
  const modal = document.getElementById("download-modal");
  if (modal) {
    modal.showModal();
  }
}

function closeAppDownloadModal() {
  const modal = document.getElementById("download-modal");
  if (modal) modal.close();
}

function openSearchModal() {
  const modal = document.getElementById("search-modal");
  const input = document.getElementById("global-search-input");
  if (modal) {
    modal.showModal();
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }
}

function closeSearchModal() {
  const modal = document.getElementById("search-modal");
  if (modal) modal.close();
}

function executeQuickSearch(query) {
  const input = document.getElementById("global-search-input");
  if (input) {
    input.value = query;
    performSearch(query);
  }
}

function performSearch(query) {
  const resultsContainer = document.getElementById("search-results-container");
  if (!resultsContainer) return;

  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) {
    resultsContainer.innerHTML = `
      <div class="search-initial-state">
        <span class="hint-label">TOP SEARCHES TODAY</span>
        <div class="popular-search-tags">
          <button class="tag-search" onclick="executeQuickSearch('Feluda')">Feluda</button>
          <button class="tag-search" onclick="executeQuickSearch('Shobdo Jobdo')">Shobdo Jobdo</button>
          <button class="tag-search" onclick="executeQuickSearch('Crime')">Crime Thriller</button>
          <button class="tag-search" onclick="executeQuickSearch('Sin')">Sin</button>
          <button class="tag-search" onclick="executeQuickSearch('Byomkesh')">Byomkesh</button>
          <button class="tag-search" onclick="executeQuickSearch('Khyapa')">Khyapa</button>
        </div>
      </div>
    `;
    return;
  }

  const allItems = [...OTT_DATA.movies, ...OTT_DATA.webSeries, ...OTT_DATA.originals];
  const hits = allItems.filter(item => {
    const haystack = `${item.title} ${item.genre} ${item.cast || ''} ${item.director || ''}`.toLowerCase();
    return haystack.includes(cleanQuery);
  });

  if (hits.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center" style="padding: 2.5rem 0;">
        <p style="color:var(--text-muted); margin-bottom:1rem;">No direct matches found for "<strong>${query}</strong>"</p>
        <button class="btn-primary-sm" onclick="redirectToApp('search-fallback')">Search full 500+ catalogue on App</button>
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = hits.map(hit => `
    <div class="search-hit-item" onclick="closeSearchModal(); openContentDetail('${hit.id}', 'search')">
      <div class="hit-thumb" style="background: ${hit.bg}"></div>
      <div class="hit-info">
        <div class="hit-title">${hit.title}</div>
        <div class="hit-desc">${hit.genre} • ${hit.duration || 'Feature'} • Rating: ${hit.rating}</div>
      </div>
    </div>
  `).join("");
}

function openLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.showModal();
}

function closeLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.close();
}

function handleUserLogin(e) {
  e.preventDefault();
  showToast("Signing in to AddaTimes account...");
  setTimeout(() => {
    showToast("Signed in successfully! Enjoy your watchlist.");
    closeLoginModal();
  }, 1200);
}

function simulateOAuth(provider) {
  showToast(`Authenticating with ${provider}...`);
  setTimeout(() => {
    showToast(`Signed in with ${provider}!`);
    closeLoginModal();
  }, 1000);
}

function openModal(modalId) {
  showToast("Opening requested information modal...");
}

function initKeyboardShortcuts() {
  const searchBtn = document.getElementById("search-btn");
  const loginBtn = document.getElementById("login-btn");
  const headerDownloadBtn = document.getElementById("header-download-btn");

  if (searchBtn) searchBtn.addEventListener("click", openSearchModal);
  if (loginBtn) loginBtn.addEventListener("click", openLoginModal);
  if (headerDownloadBtn) headerDownloadBtn.addEventListener("click", () => redirectToApp("header-cta"));

  const searchInput = document.getElementById("global-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => performSearch(e.target.value));
  }

  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === "Escape") {
      const mobDrawer = document.getElementById("mobile-nav-drawer");
      if (mobDrawer && mobDrawer.classList.contains("open")) {
        toggleMobileNavDrawer();
      }
      const wlDrawer = document.getElementById("watchlist-drawer");
      if (wlDrawer && wlDrawer.classList.contains("open")) {
        toggleWatchlistDrawer();
      }
    }
  });

  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.addEventListener("click", (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        if (dialog.id === "trailer-modal") {
          closeTrailerModal();
        } else {
          dialog.close();
        }
      }
    });
  });
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

function openPricingModalOrScroll() {
  const pricingSection = document.getElementById("pricing");
  if (pricingSection) {
    pricingSection.scrollIntoView({ behavior: "smooth" });
    showToast("Select your VIP subscription plan");
  } else {
    redirectToApp("subscribe-cta");
  }
}

