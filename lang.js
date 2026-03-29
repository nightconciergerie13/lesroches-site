/* ══════════════════════════════════════════════════════════════
   LES ROCHES — Language switcher
   Détecte le dossier courant (/fr/, /es/) et redirige vers
   la version correspondante de la page courante.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function init() {
    const ls = document.getElementById('ls');
    if (!ls) return;

    const path = window.location.pathname;
    const inFr = path.includes('/fr/');
    const inEs = path.includes('/es/');
    const filename = path.split('/').pop() || 'index.html';

    // Marquer la langue active
    const spans = ls.querySelectorAll('span:not(.lsep)');
    spans.forEach(span => {
      const lang = span.textContent.trim();
      span.classList.remove('on');
      if (lang === 'EN' && !inFr && !inEs) span.classList.add('on');
      if (lang === 'FR' && inFr) span.classList.add('on');
      if (lang === 'ES' && inEs) span.classList.add('on');
    });

    // Liens de redirection
    spans.forEach(span => {
      const lang = span.textContent.trim();
      span.style.cursor = 'pointer';
      span.addEventListener('click', () => {
        if (lang === 'EN') {
          window.location.href = '/' + filename;
        } else if (lang === 'FR') {
          window.location.href = '/fr/' + filename;
        } else if (lang === 'ES') {
          window.location.href = '/es/' + filename;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
