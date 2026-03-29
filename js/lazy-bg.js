/* ══════════════════════════════════════════════════════════════
   LES ROCHES — Lazy-load CSS background-image elements
   Usage: add class="lazy-bg" data-bg="images/photo.webp" to any
   element that uses background-image. The real image loads only
   when the element enters the viewport.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) {
    // Fallback: load all immediately
    document.querySelectorAll('.lazy-bg[data-bg]').forEach(el => {
      el.style.backgroundImage = `url('${el.dataset.bg}')`;
      el.classList.remove('lazy-bg');
    });
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const bg = el.dataset.bg;
      if (bg) {
        el.style.backgroundImage = `url('${bg}')`;
        el.removeAttribute('data-bg');
        el.classList.remove('lazy-bg');
      }
      obs.unobserve(el);
    });
  }, {
    rootMargin: '200px 0px',
    threshold: 0
  });

  function observe() {
    document.querySelectorAll('.lazy-bg[data-bg]').forEach(el => obs.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    observe();
  }
})();
