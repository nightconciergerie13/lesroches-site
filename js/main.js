// LES ROCHES RETREAT — Shared JS

// Custom cursor (desktop only)
if (window.matchMedia('(hover: hover)').matches) {
  document.body.classList.add('has-cursor');
  const cur = document.getElementById('cur');
  if (cur) {
    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function tick() {
      cur.style.left = mx + 'px';
      cur.style.top = my + 'px';
      requestAnimationFrame(tick);
    })();
    document.querySelectorAll('a, button, .villa-card, .exp-card, .rv-card, .nl, .nav-book, .h-cta, .bk-btn').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('hov'));
      el.addEventListener('mouseleave', () => cur.classList.remove('hov'));
    });
  }
}

// Nav scroll behavior
const nav = document.getElementById('nav');
const logo = document.getElementById('logo');
const nb = document.getElementById('nb');
const burger = document.getElementById('burger');
const overlay = document.getElementById('nav-overlay');
const navClose = document.getElementById('nav-close');

if (nav) {
  const nls = document.querySelectorAll('.nl');
  window.addEventListener('scroll', () => {
    const s = scrollY > 60;
    nav.classList.toggle('scrolled', s);
    if (logo) logo.classList.toggle('dark', s);
    if (nb) nb.classList.toggle('dark', s);
    if (burger) burger.classList.toggle('dark', s);
    nls.forEach(n => n.classList.toggle('dark', s));
    // Bouton retour accueil : visible quand nav transparente, caché quand nav scrollée
    if (homeBtn) homeBtn.classList.toggle('home-btn--hidden', s);
  });
}

// ── Bouton "Retour à l'accueil" — villas.html + experiences.html ──
const isVillaPage = /villas\.html/.test(location.pathname) || location.pathname.endsWith('/villas')
  || /experiences/.test(location.pathname);
let homeBtn = null;
if (isVillaPage) {
  // Injection du CSS
  const style = document.createElement('style');
  style.textContent = `
    .home-btn {
      position: fixed;
      top: 1.6rem;
      left: 1.6rem;
      z-index: 300;
      display: flex;
      align-items: center;
      gap: .55rem;
      padding: .55rem .9rem .55rem .75rem;
      background: rgba(10,8,6,.52);
      border: 1px solid rgba(255,255,255,.28);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: rgba(255,255,255,.9);
      font-family: 'Outfit', sans-serif;
      font-size: .62rem;
      letter-spacing: .18em;
      text-transform: uppercase;
      text-decoration: none;
      border-radius: 2px;
      cursor: pointer;
      transition: opacity .35s, transform .35s, background .2s;
      pointer-events: auto;
    }
    .home-btn svg {
      width: 13px; height: 13px; flex-shrink: 0;
      opacity: .75;
    }
    .home-btn:hover {
      background: rgba(10,8,6,.78);
      color: #fff;
    }
    .home-btn--hidden {
      opacity: 0;
      transform: translateY(6px);
      pointer-events: none;
    }
    @media (max-width: 640px) {
      .home-btn { top: 1.1rem; left: 1.1rem; }
    }
  `;
  document.head.appendChild(style);

  // Injection du bouton
  homeBtn = document.createElement('a');
  homeBtn.href = 'index.html';
  homeBtn.className = 'home-btn';
  var _p = window.location.pathname;
  var _homeLbl = _p.includes('/fr/') ? 'Accueil' : _p.includes('/es/') ? 'Inicio' : 'Home';
  homeBtn.setAttribute('aria-label', 'Back to home');
  homeBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
      '<path d="M19 12H5M11 6l-6 6 6 6"/>' +
    '</svg>' +
    _homeLbl;
  document.body.appendChild(homeBtn);

  // État initial (si page déjà scrollée au chargement)
  if (scrollY > 60) homeBtn.classList.add('home-btn--hidden');
}

// Mobile nav
if (burger && overlay) {
  burger.addEventListener('click', () => overlay.classList.add('open'));
  if (navClose) navClose.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.querySelectorAll('a, .nl').forEach(link => {
    link.addEventListener('click', () => overlay.classList.remove('open'));
  });
}

// Scroll reveal
const obs = new IntersectionObserver(e => e.forEach(x => {
  if (x.isIntersecting) x.target.classList.add('on');
}), { threshold: 0.06 });
document.querySelectorAll('.r').forEach(el => obs.observe(el));

// Full photo parallax reveal
const fpObs = new IntersectionObserver(e => e.forEach(x => {
  if (x.isIntersecting) x.target.classList.add('in-view');
}), { threshold: 0.1 });
document.querySelectorAll('.full-photo').forEach(el => fpObs.observe(el));
