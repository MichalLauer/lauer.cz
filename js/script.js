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

const setTestimonialArrows = (enabled) => {
  $$('.testimonial-arrow').forEach(arrow => {
    arrow.style.pointerEvents = enabled ? 'auto' : 'none';
  });
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
      
      const rect = el.getBoundingClientRect();
      const ttRect = tooltip.getBoundingClientRect();
      const top = window.scrollY + rect.top - ttRect.height - 10;
      const left = Math.max(10, Math.min(
        window.scrollX + rect.left + (rect.width - ttRect.width) / 2,
        window.innerWidth - ttRect.width - 10
      ));
      
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    };

    el.addEventListener('mouseenter', () => {
      el.setAttribute('title', '');
      tooltip = createTooltip();
      positionTooltip();
    });

    el.addEventListener('mousemove', positionTooltip);

    el.addEventListener('mouseleave', () => {
      el.setAttribute('title', tooltipText);
      if (tooltip) { tooltip.remove(); tooltip = null; }
    });
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

      const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        li.classList.toggle('open');
        const isOpen = li.classList.contains('open');
        indicator.setAttribute('aria-expanded', String(!!isOpen));
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
      // Update the aria-expanded state on the indicator if present
      const ind = li.querySelector('.submenu-indicator');
      if (ind) ind.setAttribute('aria-expanded', String(li.classList.contains('open')));
    } else {
      // When clicking a link (no submenu), close mobile menu so content is visible
      if (window.closeMobileMenu) {
        window.closeMobileMenu();
      } else {
        document.body.classList.remove('menu-open');
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        // remove any overlay if present
        const overlay = document.querySelector('.menu-overlay');
        if (overlay) overlay.remove();
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
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
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without jumping
        if (history.pushState) {
          history.pushState(null, '', `#${targetId}`);
        }
      }
    });
  });
}

// Testimonial data
const testimonials = [
  {
    text: 'Nemůžu si vynachválit Pana Lauera z mnoha důvodů, jako je rychlost, připravenost a neskutečná ochota.',
    source: 'Andy V.',
    url: 'https://www.doucuji.eu/381550-doucovani-srozumitelne-a-lidske-doucovani-statistiky-a-datove-analyzy'
  },
  {
    text: 'Obrovská spokojenost s panem Lauerem. Ještě jednou velké DÍKY za pomoc se statistikou a všem moc doporučuji.',
    source: 'Vendula K.',
    url: 'https://www.doucuji.eu/381550-doucovani-srozumitelne-a-lidske-doucovani-statistiky-a-datove-analyzy'
  },
  {
    text: 'Pokud potřebujete poradit se statistikou v rámci své vysokoškolské práce určitě se neváhejte obrátit na pana Michala.',
    source: 'Petra M.',
    url: 'https://www.doucuji.eu/381550-doucovani-srozumitelne-a-lidske-doucovani-statistiky-a-datove-analyzy'
  },
  {
    text: 'Díky panu Lauerovi se mi podařilo úspěšně spočítat řadu příkladů a uspět u zkoušky na první pokus, což považuji za zázrak:)',
    source: 'Andrea D.',
    url: 'https://www.doucuji.eu/381550-doucovani-srozumitelne-a-lidske-doucovani-statistiky-a-datove-analyzy'
  },
  {
    text: 'Pana Michala na 100 % doporučuji. Velká pomoc při DP. Je vidět, že statistice opravdu rozumí a hlavně ji dokáže vysvětlit.',
    source: 'Mgr. I.',
    url: 'https://www.doucuji.eu/381550-doucovani-srozumitelne-a-lidske-doucovani-statistiky-a-datove-analyzy'
  }
];

// Testimonial carousel functionality
function initTestimonialCarousel() {
  const carousel = $('.testimonial-carousel');
  if (!carousel) return;

  const cardsContainer = carousel.querySelector('.testimonial-cards');
  const leftArrow = carousel.querySelector('.testimonial-arrow-left');
  const rightArrow = carousel.querySelector('.testimonial-arrow-right');

  if (!cardsContainer || !leftArrow || !rightArrow) return;

  // If already initialized, just re-render (this makes the function idempotent
  // and ensures that when the page is restored from bfcache we re-populate
  // the carousel without binding duplicate event listeners).
  if (carousel._initialized) {
    // update visibleCards and re-render
    const getVisibleCards = () => (window.innerWidth <= 768 ? 1 : (window.innerWidth <= 1024 ? 2 : 3));
    carousel._visibleCards = getVisibleCards();
    carousel._renderCards();
    return;
  }

  // First-time initialization
  carousel._initialized = true;
  carousel._totalCards = testimonials.length;
  carousel._currentPosition = 0;
  const getVisibleCards = () => (window.innerWidth <= 768 ? 1 : (window.innerWidth <= 1024 ? 2 : 3));
  carousel._visibleCards = getVisibleCards();

  // create a render function attached to the carousel so other handlers (pageshow)
  // can call it to repopulate the DOM from the source `testimonials` array.
  carousel._renderCards = function () {
    // defensive reference lookups
    const total = carousel._totalCards || testimonials.length;
    const pos = (typeof carousel._currentPosition === 'number') ? carousel._currentPosition : 0;
    const visible = carousel._visibleCards || 1;

    cardsContainer.innerHTML = '';

    for (let i = 0; i < visible; i++) {
      const cardIndex = (pos + i) % total;
      const testimonial = testimonials[cardIndex];

      const card = document.createElement('div');
      card.className = 'testimonial-card';
      card.innerHTML = `
        <div class="testimonial-text">${testimonial.text}</div>
        <div class="testimonial-bottom-row">
          <div class="testimonial-number">${cardIndex + 1}</div>
          <div class="testimonial-source"> 
            <a href="${testimonial.url}" target="_blank" rel="noopener" 
               title="Source" aria-label="Source">
               ${testimonial.source}
            </a> 🔗
          </div>
        </div>
      `;
      cardsContainer.appendChild(card);
    }
  };

  // Navigation handlers (bind once)
  leftArrow.addEventListener('click', () => {
    carousel._currentPosition = (carousel._currentPosition - 1 + carousel._totalCards) % carousel._totalCards;
    carousel._renderCards();
  });
  rightArrow.addEventListener('click', () => {
    carousel._currentPosition = (carousel._currentPosition + 1) % carousel._totalCards;
    carousel._renderCards();
  });

  // Handle window resize: re-calc visibleCards and re-render when breakpoint changes
  carousel._resizeHandler = () => {
    const newVisible = getVisibleCards();
    if (newVisible !== carousel._visibleCards) {
      carousel._visibleCards = newVisible;
      carousel._currentPosition = carousel._currentPosition % carousel._totalCards;
      carousel._renderCards();
    }
  };

  let resizeTimeout;
  window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(carousel._resizeHandler, 250); });

  // Initial render
  carousel._renderCards();
}

// When a user navigates with back/forward, some browsers restore the DOM from
// the bfcache and do not fire DOMContentLoaded. Use pageshow to ensure the
// carousel is repopulated when returning to the page.
window.addEventListener('pageshow', (e) => {
  const carousel = document.querySelector('.testimonial-carousel');
  if (!carousel) return;
  if (carousel._initialized) {
    // update visible cards then re-render
    const visible = (window.innerWidth <= 768 ? 1 : (window.innerWidth <= 1024 ? 2 : 3));
    carousel._visibleCards = visible;
    carousel._renderCards();
  } else {
    // If for some reason it wasn't initialized (rare), initialize now
    initTestimonialCarousel();
  }
});

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

  const updateLightbox = () => {
    const linkEl = galleryLinks[currentIndex];
    const imgEl = linkEl.querySelector('img');
    
    lightboxImg.src = imgEl.src;
    lightboxImg.alt = imgEl.alt;
    captionLink.href = imgEl.dataset.source || imgEl.src;
    
    // Update thumbnails
    thumbContainer.querySelectorAll('img').forEach((img, idx) => {
      img.classList.toggle('active', idx === currentIndex);
    });
  };

  // Build thumbnails
  galleryLinks.forEach((link, idx) => {
    const img = link.querySelector('img');
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = img.alt;
    thumb.dataset.index = idx;
    thumb.addEventListener('click', () => {
      currentIndex = idx;
      updateLightbox();
    });
    thumbContainer.appendChild(thumb);

    // Gallery link click handler
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentIndex = idx;
      updateLightbox();
      lightbox.classList.add('show');
      document.body.style.overflow = 'hidden';
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
    document.body.style.overflow = '';
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

// Performance optimization: Lazy loading for images
function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    $$('img[loading="lazy"]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Email placeholders and click-to-open-mailto behaviour
// Keep user/domain only in JS to avoid exposing in markup
const EMAIL_USER = 'hello';
const EMAIL_DOMAIN = 'lauer.cz';
const EMAIL_FULL = EMAIL_USER + '@' + EMAIL_DOMAIN;

function createMailtoAnchor(email) {
  const a = document.createElement('a');
  a.href = 'mailto:' + email;
  a.textContent = email;
  a.title = email;
  a.target = '_self';
  a.rel = 'nofollow';
  a.setAttribute('aria-label', 'Contact Michal Lauer');
  return a;
}

function revealEmail(container, triggerBtn) {
  // Do NOT insert the email into the page. Open the user's mail client instead.
  const mailto = 'mailto:' + EMAIL_FULL;
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

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initTooltips();
  initSidebar();
  initMobileMenu();
  initSmoothScroll();
  initTestimonialCarousel();
  initLightbox();
  initEmailPlaceholders();
  initLazyLoading();
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause any animations or timers when page is hidden
    $$('.testimonial-arrow').forEach(arrow => {
      arrow.style.pointerEvents = 'none';
    });
  } else {
    // Resume when page becomes visible
    $$('.testimonial-arrow').forEach(arrow => {
      arrow.style.pointerEvents = 'auto';
    });
  }
});