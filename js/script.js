/**
 * Main JavaScript for Michal Lauer's Research Website
 * Optimized and simplified version
 */

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Small helpers to avoid repeating overflow toggles and arrow enabling
const setPageOverflow = (hidden) => {
  document.documentElement.style.overflow = hidden ? 'hidden' : '';
  document.body.style.overflow = hidden ? 'hidden' : '';
};

// Tooltip functionality for abbreviations
function initTooltips() {
  $$('abbr[title]').forEach(el => {
    const tooltipText = el.getAttribute('title');
    if (!tooltipText) return;

    let tooltip = null;

    const createTooltip = () => {
      tooltip = document.createElement('div');
      tooltip.className = 'floating-tooltip';
      tooltip.textContent = tooltipText;
      document.body.appendChild(tooltip);
      return tooltip;
    };

    const positionTooltip = () => {
      if (!tooltip) return;

      // The tooltip is position: fixed, so viewport coordinates are used directly.
      const rect = el.getBoundingClientRect();
      const ttRect = tooltip.getBoundingClientRect();
      const top = Math.max(10, rect.top - ttRect.height - 10);
      const left = Math.max(10, Math.min(
        rect.left + (rect.width - ttRect.width) / 2,
        window.innerWidth - ttRect.width - 10
      ));

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    };

    const showTooltip = () => {
      // Only one tooltip can be open at a time
      document.querySelectorAll('.floating-tooltip').forEach(t => t.remove());
      el.setAttribute('title', '');
      tooltip = createTooltip();
      positionTooltip();
    };

    const hideTooltip = () => {
      el.setAttribute('title', tooltipText);
      if (tooltip) { tooltip.remove(); tooltip = null; }
    };

    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mousemove', positionTooltip);
    el.addEventListener('mouseleave', hideTooltip);
    // Touch devices fire no mouseleave after the native title tooltip opens
    el.addEventListener('touchstart', hideTooltip, { passive: true });
  });
}

// Sidebar submenu functionality
function initSidebar() {
  const sidebar = $('.sidebar');
  if (!sidebar) return;

  const menuItems = sidebar.querySelectorAll('li');

  // Add indicators (chevrons) to items that contain submenus.
  function addIndicators() {
    menuItems.forEach(li => {
      const sub = li.querySelector('ul');
      if (!sub) return;

      const anchor = li.querySelector('a');
      if (!anchor) return;

      // Avoid adding duplicate indicators
      if (anchor.querySelector('.submenu-indicator')) return;

      const indicator = document.createElement('span');
      indicator.className = 'submenu-indicator';
      indicator.setAttribute('role', 'button');
      indicator.setAttribute('tabindex', '0');
      indicator.setAttribute('aria-expanded', 'false');
      indicator.setAttribute('aria-label', 'Toggle submenu');
      indicator.innerHTML = '<svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true" focusable="false"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      // Place indicator inside the anchor but keep it non-interactive to the anchor by stopping propagation
      anchor.appendChild(indicator);

      // A <span role="button"> inside an <a> is announced as a nested control,
      // so the chevron is hidden from assistive tech and the submenu state is
      // exposed on the link itself via aria-expanded.
      indicator.setAttribute('aria-hidden', 'true');
      indicator.removeAttribute('tabindex');
      anchor.setAttribute('aria-expanded', 'false');

      const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        li.classList.toggle('open');
        const isOpen = li.classList.contains('open');
        indicator.setAttribute('aria-expanded', String(!!isOpen));
        anchor.setAttribute('aria-expanded', String(isOpen));
      };

      indicator.addEventListener('click', toggle);
      indicator.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle(e); }
      });
    });
  }

  // Ensure indicators exist immediately
  addIndicators();

  // We'll enable hover behavior only on desktop-sized viewports and
  // remove it for small screens so click/tap toggles work reliably.
  const hoverHandlers = new Map();

  function enableHover() {
    menuItems.forEach(li => {
      if (hoverHandlers.has(li)) return; // already added
      const onEnter = () => li.classList.add('open');
      const onLeave = () => li.classList.remove('open');
      li.addEventListener('mouseenter', onEnter);
      li.addEventListener('mouseleave', onLeave);
      hoverHandlers.set(li, { onEnter, onLeave });
    });

    if (!sidebar._desktopMouseLeave) {
      sidebar._desktopMouseLeave = () => menuItems.forEach(li => li.classList.remove('open'));
      sidebar.addEventListener('mouseleave', sidebar._desktopMouseLeave);
    }
  }

  function disableHover() {
    hoverHandlers.forEach((h, li) => {
      li.removeEventListener('mouseenter', h.onEnter);
      li.removeEventListener('mouseleave', h.onLeave);
    });
    hoverHandlers.clear();
    if (sidebar._desktopMouseLeave) {
      sidebar.removeEventListener('mouseleave', sidebar._desktopMouseLeave);
      delete sidebar._desktopMouseLeave;
    }
    // Ensure no submenu remains accidentally open when switching modes
    menuItems.forEach(li => {
      li.classList.remove('open');
      const ind = li.querySelector('.submenu-indicator');
      if (ind) ind.setAttribute('aria-expanded', 'false');
    });
  }

  function updateSidebarMode() {
    if (window.innerWidth > 768) enableHover();
    else disableHover();
  }

  // Initialize based on current viewport and keep in sync on resize
  updateSidebarMode();
  window.addEventListener('resize', () => {
    // Simple throttle to avoid toggling too often
    clearTimeout(sidebar._resizeTimeout);
    sidebar._resizeTimeout = setTimeout(updateSidebarMode, 120);
  });

  // Mobile: allow clicking parent links to toggle submenu
  // Use event delegation for simplicity
  sidebar.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (!target) return;

    // Only on small screens
    if (window.innerWidth > 768) return;

    const li = target.closest('li');
    if (!li) return;

    const sub = li.querySelector('ul');
    if (sub) {
      // Prevent navigation and toggle submenu
      e.preventDefault();
      li.classList.toggle('open');
      // Update the aria-expanded state (both places it is exposed)
      const ind = li.querySelector('.submenu-indicator');
      const open = String(li.classList.contains('open'));
      if (ind) ind.setAttribute('aria-expanded', open);
      target.setAttribute('aria-expanded', open);
    } else {
      // A plain link: close the mobile menu and let the click through.
      // (The overlay/scroll-lock are cleaned up, so the link navigates normally.)
      if (window.closeMobileMenu) window.closeMobileMenu();
    }
  });
}

// Mobile menu toggle: burger button, overlay, close handlers
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar) return;

  // Make non-button toggle keyboard-accessible (Enter / Space)
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle.click(); }
  });

  const ensureOverlay = () => {
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'menu-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', closeMenu);
    }
    return overlay;
  };

  // central close function to ensure overflow and overlay are cleaned up
  function closeMenu() {
    document.body.classList.remove('menu-open');
    try { toggle.setAttribute('aria-expanded', 'false'); } catch (e) {}
    const overlay = document.querySelector('.menu-overlay'); if (overlay) overlay.remove();
    setPageOverflow(false);
  }

  // expose for other modules / handlers
  window.closeMobileMenu = closeMenu;

  toggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) { ensureOverlay(); setPageOverflow(true); }
    else { closeMenu(); }
  });

  // Close on escape
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) closeMenu(); });

  // Close when clicking outside the sidebar or the toggle (capture phase).
  // This handles cases where the overlay doesn't receive the click because of
  // stacking contexts or other elements covering it.
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('menu-open')) return;
    const clickedInsideSidebar = !!e.target.closest && e.target.closest('.sidebar');
    const clickedToggle = !!e.target.closest && e.target.closest('.menu-toggle');
    if (!clickedInsideSidebar && !clickedToggle) {
      // click outside -> close menu
      // Prevent the click from reaching underlying elements (anchors, images, etc.)
      // which would otherwise trigger navigation or other actions.
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (err) {
        // ignore if the event is not cancellable in some environments
      }
      closeMenu();
    }
  }, true);

  // If the window is resized to desktop while menu open, close mobile menu
  window.addEventListener('resize', () => { if (window.innerWidth > 768 && document.body.classList.contains('menu-open')) closeMenu(); });
}

// Smooth scrolling for anchor links
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const targetId = href.slice(1);
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();

        // On small screens the burger/menu and floating button cover part of the
        // viewport. Apply a 50px offset so the target isn't hidden under them.
        const offset = (window.innerWidth <= 768) ? 40 : 0;
        const targetTop = target.getBoundingClientRect().top + window.scrollY;
        const scrollTo = Math.max(0, targetTop - offset);

        window.scrollTo({ top: scrollTo, behavior: 'smooth' });

        // Update URL without jumping
        if (history.pushState) {
          history.pushState(null, '', `#${targetId}`);
        }
      }
    });
  });
}

// Lightbox functionality
function initLightbox() {
  const galleryLinks = $$('.gallery-link');
  const lightbox = $('#lightbox');
  
  if (!galleryLinks.length || !lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const thumbContainer = lightbox.querySelector('.lightbox-thumbnails');
  const captionLink = lightbox.querySelector('.lightbox-caption a');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  let currentIndex = 0;
  let lastFocused = null;

  // The services page uses a wrapper that inherits <base target="_blank">,
  // and the document <base> makes lightbox images report an absolute URL.
  // Relative URLs keep the gallery images on the same origin as the page.
  const sameOriginSrc = (url) => {
    try {
      const parsed = new URL(url, document.baseURI);
      return parsed.origin === window.location.origin
        ? parsed.pathname + parsed.search + parsed.hash
        : url;
    } catch (e) {
      return url;
    }
  };

  const updateLightbox = () => {
    const linkEl = galleryLinks[currentIndex];
    const imgEl = linkEl.querySelector('img');

    lightboxImg.src = sameOriginSrc(imgEl.currentSrc || imgEl.src);
    lightboxImg.alt = imgEl.alt;
    captionLink.href = imgEl.dataset.source || imgEl.src;

    // Update thumbnails
    thumbContainer.querySelectorAll('img').forEach((img, idx) => {
      const active = idx === currentIndex;
      img.classList.toggle('active', active);
      img.setAttribute('aria-current', active ? 'true' : 'false');
    });
  };

  // Build thumbnails
  galleryLinks.forEach((link, idx) => {
    const img = link.querySelector('img');
    const thumb = document.createElement('img');
    thumb.src = sameOriginSrc(img.currentSrc || img.src);
    thumb.alt = img.alt;
    thumb.dataset.index = idx;
    // Clickable, so give it button semantics: focusable and Enter/Space aware
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('tabindex', '0');
    const show = () => { currentIndex = idx; updateLightbox(); };
    thumb.addEventListener('click', show);
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        show();
      }
    });
    thumbContainer.appendChild(thumb);

    // Gallery link click handler
    link.addEventListener('click', () => {
      currentIndex = idx;
      updateLightbox();
      lastFocused = link;
      lightbox.classList.add('show');
      setPageOverflow(true);
      lightboxImg.focus({ preventScroll: true });
    });
  });

  // Navigation handlers
  prevBtn?.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + galleryLinks.length) % galleryLinks.length;
    updateLightbox();
  });

  nextBtn?.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % galleryLinks.length;
    updateLightbox();
  });

  // Close handlers
  const closeLightbox = () => {
    lightbox.classList.remove('show');
    setPageOverflow(false);
    if (lastFocused) {
      lastFocused.focus({ preventScroll: true });
      lastFocused = null;
    }
  };

  closeBtn?.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('show')) return;

    switch(e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        prevBtn?.click();
        break;
      case 'ArrowRight':
        nextBtn?.click();
        break;
    }
  });
}

// Email placeholders and click-to-open-mailto behaviour
// Keep user/domain only in JS to avoid exposing in markup
const EMAIL_USER = 'hello';
const EMAIL_DOMAIN = 'lauer.cz';
const EMAIL_FULL = EMAIL_USER + '@' + EMAIL_DOMAIN;

function revealEmail(container, triggerBtn) {
  // Do NOT insert the email into the page. Open the user's mail client instead.
  let mailto = 'mailto:' + EMAIL_FULL;
  // Optional pre-filled subject, e.g. "Poptávka – Doučování"
  const subject = container && container.dataset ? (container.dataset.subject || '') : '';
  if (subject) mailto += '?subject=' + encodeURIComponent(subject);
  try {
    // Use location change which typically triggers the mail client
    window.location.href = mailto;
  } catch (e) {
    // Fallback to open in new window/tab
    window.open(mailto);
  }
}

function initEmailPlaceholders() {
  document.querySelectorAll('.mail-placeholder').forEach(ph => {
    // Avoid initializing twice
    if (ph.dataset.initialized) return; ph.dataset.initialized = '1';

    const text = ph.dataset.text || 'Contact';
    const variant = ph.dataset.variant || '';

    // If the variant explicitly asks for a navbar-contact, create a <button>
    // to satisfy the requirement that navbar element be a button. Otherwise
    // create an anchor so existing CSS targeting anchors (e.g. sidebar-contact)
    // still works. Do NOT include any icon/emoji in the text.
    const useButton = /\bnavbar-contact\b/.test(variant);
    let el;
    if (useButton) {
      el = document.createElement('button');
      el.type = 'button';
      el.className = 'reveal-email-btn';
      if (variant) variant.split(/\s+/).forEach(c => { if (c) el.classList.add(c); });
      // Ensure sidebar-contact class is present when requested so CSS targeting
      // `.sidebar-contact` applies to this button as well.
      if (/\bsidebar-contact\b/.test(variant)) el.classList.add('sidebar-contact');
      // For header-contact (large-screen) include an envelope icon before the text
      if (/\b(header-contact|navbar-contact)\b/.test(variant)) {
        // create the icon element (Font Awesome)
        const icon = document.createElement('i');
        icon.className = 'fas fa-envelope';
        icon.setAttribute('aria-hidden', 'true');
        el.appendChild(icon);
        el.appendChild(document.createTextNode(text));
      } else {
        el.textContent = text;
      }
      el.setAttribute('aria-label', 'Contact Michal Lauer');
      el.addEventListener('click', function () { revealEmail(ph, el); });
    } else {
      el = document.createElement('a');
      el.href = '#';
      el.className = 'reveal-email-btn';
      if (variant) variant.split(/\s+/).forEach(c => { if (c) el.classList.add(c); });
      if (/\bsidebar-contact\b/.test(variant)) el.classList.add('sidebar-contact');
      // For header-contact (large-screen) include an envelope icon before the text
      if (/\b(header-contact|navbar-contact)\b/.test(variant)) {
        const icon = document.createElement('i');
        icon.className = 'fas fa-envelope';
        icon.setAttribute('aria-hidden', 'true');
        el.appendChild(icon);
        el.appendChild(document.createTextNode(text));
      } else {
        el.textContent = text;
      }
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Contact Michal Lauer');
      el.addEventListener('click', function (e) { e.preventDefault(); revealEmail(ph, el); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); el.click(); } });
    }

    ph.appendChild(el);
  });
}

// CTA buttons on the services page use a span so the button stays a single link.
// Reuse the same privacy-friendly contact behaviour: the label is shown, the
// address never lands in the markup.
function initCtaEmails() {
  document.querySelectorAll('.cta-email').forEach(span => {
    if (span.dataset.initialized) return; span.dataset.initialized = '1';

    span.textContent = span.dataset.text || 'Contact';

    const link = span.closest('a');
    if (!link) return;

    link.setAttribute('aria-label', (span.dataset.text || 'Contact') + ' - Michal Lauer');
    link.addEventListener('click', function (e) { e.preventDefault(); revealEmail(span, link); });
  });
}

// Reference carousels on the services page.
// Exactly three reviews are shown at a time: the middle one is pulled
// forward while its neighbours sit back. Arrows step one review at a time
// and loop around in both directions. Cards keep their natural height and
// are vertically centred against the tallest one.
function initRefCarousels() {
  const carousels = $$('.ref-carousel');
  if (!carousels.length) return;

  carousels.forEach(carousel => {
    if (carousel._initialized) return;

    const viewport = carousel.querySelector('.ref-viewport');
    const track = carousel.querySelector('.ref-track');
    const cards = track ? Array.from(track.querySelectorAll('.ref-card')) : [];
    const prev = carousel.querySelector('.ref-arrow-prev');
    const next = carousel.querySelector('.ref-arrow-next');
    if (!viewport || !track || !cards.length || !prev || !next) return;

    carousel._initialized = true;

    const state = { index: 0, gap: 0, cardWidth: 0, usableWidth: 0 };

    // Three reviews are on screen on wide displays: the centre one pulled
    // forward and its two neighbours behind. Below laptop width there is not
    // enough room, so only the centre card is shown at full width.
    const singleQuery = window.matchMedia('(max-width: 1024px)');
    const perView = () => (singleQuery.matches ? 1 : 3);
    const maxSide = () => Math.floor(perView() / 2);

    const slotOf = (i) => {
      const total = cards.length;
      let rel = i - state.index;
      const half = Math.floor(total / 2);
      if (rel > half) rel -= total;
      if (rel < -half) rel += total;
      return rel;
    };

    const render = ({ animate = true } = {}) => {
      const stepW = state.cardWidth + state.gap;
      // Cards are absolutely positioned inside the track, which itself sits
      // in the viewport's content box. So slot 0 is measured from there.
      const centreLeft = (state.usableWidth - state.cardWidth) / 2;

      cards.forEach((card, i) => {
        const rel = slotOf(i);
        const visible = Math.abs(rel) <= maxSide();
        const left = centreLeft + rel * stepW;
        // The centre card is pulled forward only when there are neighbours to
        // sit back from it; alone on a phone it stays at full size.
        const scale = rel === 0 && perView() > 1 ? 1.07 : 1;

        card.style.transition = animate ? '' : 'none';
        // top: 50% + translateY(-50%) centres each card on its own rendered
        // height, so cards of different lengths stay vertically aligned.
        card.style.transform = `translate(${left}px, -50%) scale(${scale})`;
        // Keep side cards fully opaque: fading the whole card drops its text
        // below the contrast minimum. They recede via scale and muted colour.
        card.style.opacity = visible ? '1' : '0';
        card.style.pointerEvents = visible ? '' : 'none';
        card.style.zIndex = rel === 0 ? 3 : (visible ? 2 : 1);
        card.setAttribute('aria-hidden', visible ? 'false' : 'true');

        // Anything focusable inside a card that is out of view must not be
        // reachable by keyboard (it is aria-hidden, so it would be a dead end).
        // Cards may themselves be buttons, so include the card element.
        const focusables = [card, ...card.querySelectorAll('a, button')];
        focusables.forEach(el => {
          if (!el) return;
          if (visible) {
            el.removeAttribute('tabindex');
            if (el === card) el.style.pointerEvents = '';
          } else {
            el.setAttribute('tabindex', '-1');
          }
        });

        card.classList.toggle('is-active', rel === 0);
        card.classList.toggle('is-side', visible && rel !== 0);

        // Review position, e.g. "1 / 6"
        const counter = card.querySelector('.ref-number');
        if (counter) counter.textContent = `${i + 1} / ${cards.length}`;
      });

      if (!animate) {
        // Flush the jump so the next move animates from here
        void track.offsetWidth;
        cards.forEach(card => { card.style.transition = ''; });
      }
    };

    const go = (direction) => {
      const total = cards.length;
      if (total <= 1) return;
      state.index = (state.index + direction + total) % total;
      render();
    };

    const update = () => {
      const cs = getComputedStyle(track);
      const gap = parseFloat(cs.columnGap || cs.gap) || 0;
      state.gap = gap;

      const vpStyle = getComputedStyle(viewport);
      const available = viewport.clientWidth
        - parseFloat(vpStyle.paddingLeft)
        - parseFloat(vpStyle.paddingRight);

      // On phones and tablets only the centre card is shown. It is inset from
      // the arrows rather than stretched edge to edge, which reads better than
      // a full-bleed block. On wider screens three cards share the width, with
      // a floor that never exceeds what is available so nothing is pushed out.
      const count = perView();
      const fitWidth = Math.floor((available - gap * (count - 1)) / count);
      // Single card: inset to 84% of the space, capped so it does not run too
      // wide, and never clipped by the 200px floor that applies to the trio.
      const singleWidth = Math.min(520, Math.round(available * 0.84));
      const MIN_CARD = Math.min(200, fitWidth);
      state.cardWidth = count === 1
        ? singleWidth
        : Math.max(MIN_CARD, fitWidth);
      state.usableWidth = available;
      carousel.style.setProperty('--ref-card-width', `${state.cardWidth}px`);

      const scrollable = cards.length > 1;
      carousel.classList.toggle('is-static', !scrollable);
      prev.disabled = !scrollable;
      next.disabled = !scrollable;

      render({ animate: false });
      fitTrackHeight();
    };

    // Cards are absolutely positioned, so the track has no intrinsic height.
    // Let the tallest review define it, with a little room for the centre
    // card's scale-up so nothing spills outside the track.
    const fitTrackHeight = () => {
      track.style.minHeight = '0px';
      const tallest = Math.max(...cards.map(card => card.offsetHeight));
      if (tallest > 0) track.style.minHeight = `${Math.ceil(tallest * 1.08)}px`;
    };

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));

    // Keyboard support when the arrows are focused
    [prev, next].forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      });
    });

    update();
    window.addEventListener('resize', () => {
      clearTimeout(carousel._resizeTimeout);
      carousel._resizeTimeout = setTimeout(update, 120);
    });

    // Crossing the single-card breakpoint changes how many cards are on
    // screen; re-layout so resizing never leaves a stale arrangement.
    singleQuery.addEventListener('change', update);
  });
}

// External links open in a new tab. Pages without <base target="_blank"> (the
// services page) rely on this, so in-page anchors and internal links are left
// alone. Same-origin links keep the current tab.
function initExternalLinks() {
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    if (link.target || link.hostname === window.location.hostname) return;
    link.target = '_blank';
    const rel = (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
    ['noopener', 'noreferrer'].forEach(token => {
      if (!rel.includes(token) && !rel.includes('me')) rel.push(token);
    });
    link.setAttribute('rel', rel.join(' '));
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initTooltips();
  initSidebar();
  initMobileMenu();
  initSmoothScroll();
  initRefCarousels();
  initLightbox();
  initEmailPlaceholders();
  initCtaEmails();
  initExternalLinks();
});
