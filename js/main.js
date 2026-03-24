// LES ROCHES RETREAT — Shared JS

// Custom cursor (desktop only)
if (window.matchMedia('(hover: hover)').matches) {
  const cur = document.getElementById('cur');
  if (cur) {
    document.addEventListener('mousemove', e => {
      cur.style.left = e.clientX + 'px';
      cur.style.top = e.clientY + 'px';
    });
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
  });
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
