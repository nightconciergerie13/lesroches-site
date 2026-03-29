/* ══════════════════════════════════════════════════════════════
   LES ROCHES — Native touch swipe for photo galleries
   Works on .vp-photos (villa pages) and .slide-wrap (homepage)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function enableSwipe(container) {
    if (!container) return;
    let startX = 0, startY = 0, isDragging = false;
    const THRESHOLD = 50;

    container.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    container.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy && dx > 10) e.preventDefault(); // prevent page scroll only on horizontal swipe
    }, { passive: false });

    container.addEventListener('touchend', e => {
      if (!isDragging) return;
      isDragging = false;
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) < THRESHOLD) return;

      if (diff > 0) {
        // Swipe left → next
        const next = container.querySelector('[id$="next"], .vnext, #vnext, #next-photo, .ph-next');
        if (next) next.click();
        else container.scrollBy({ left: container.offsetWidth * 0.8, behavior: 'smooth' });
      } else {
        // Swipe right → prev
        const prev = container.querySelector('[id$="prev"], .vprev, #vprev, #prev-photo, .ph-prev');
        if (prev) prev.click();
        else container.scrollBy({ left: -container.offsetWidth * 0.8, behavior: 'smooth' });
      }
    }, { passive: true });
  }

  function init() {
    // Villa photo galleries
    document.querySelectorAll('.vp-photos, .vp-gallery, .photo-slider').forEach(enableSwipe);
    // Homepage villa scroll
    const vscroll = document.getElementById('vscroll');
    if (vscroll) enableSwipe(vscroll);
    // Homepage slideshow
    document.querySelectorAll('.slide-wrap').forEach(enableSwipe);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
