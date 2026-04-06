/* ═══════════════════════════════════════════════════════════════
   cookie-consent.js  |  Les Roches Retreat
   RGPD / GDPR compliant banner + Google Consent Mode v2
   ═══════════════════════════════════════════════════════════════ */

(function () {
  const STORAGE_KEY = 'lr_cookie_consent';
  const stored = localStorage.getItem(STORAGE_KEY);

  // --- Google Consent Mode v2 helpers ---
  function setConsent(granted) {
    if (typeof gtag !== 'function') return;
    const state = granted ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage: state,
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state
    });
  }

  // Apply stored preference immediately (before banner renders)
  if (stored === 'accepted') { setConsent(true); return; }
  if (stored === 'declined') { setConsent(false); return; }

  // --- Build banner ---
  const lang = document.documentElement.lang || 'en';
  const isFR = lang.startsWith('fr');
  const isES = lang.startsWith('es');

  const text = isFR
    ? 'Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience.'
    : isES
    ? 'Usamos cookies para analizar el tráfico y mejorar tu experiencia.'
    : 'We use cookies to analyse traffic and improve your experience.';

  const acceptLabel = isFR ? 'Accepter' : isES ? 'Aceptar' : 'Accept';
  const declineLabel = isFR ? 'Refuser' : isES ? 'Rechazar' : 'Decline';

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', isFR ? 'Consentement cookies' : isES ? 'Consentimiento de cookies' : 'Cookie consent');
  banner.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9999',
    'background:rgba(14,13,11,.96)', 'color:#f5f0e8', 'padding:1.1rem 1.5rem',
    'display:flex', 'align-items:center', 'gap:1rem', 'flex-wrap:wrap',
    'font-family:inherit', 'font-size:.78rem', 'letter-spacing:.03em',
    'border-top:1px solid rgba(245,240,232,.12)', 'backdrop-filter:blur(8px)'
  ].join(';');

  const msg = document.createElement('span');
  msg.style.cssText = 'flex:1;min-width:200px;line-height:1.6;opacity:.85';
  msg.textContent = text;

  const btnWrap = document.createElement('div');
  btnWrap.style.cssText = 'display:flex;gap:.6rem;flex-shrink:0';

  function makeBtn(label, primary) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = [
      'font-size:.62rem', 'letter-spacing:.18em', 'text-transform:uppercase',
      'padding:.55rem 1.4rem', 'border-radius:1px', 'cursor:pointer',
      'border:1px solid ' + (primary ? 'transparent' : 'rgba(245,240,232,.3)'),
      'background:' + (primary ? '#b09060' : 'transparent'),
      'color:' + (primary ? '#0e0d0b' : '#f5f0e8'),
      'font-family:inherit', 'transition:opacity .2s'
    ].join(';');
    return b;
  }

  const acceptBtn = makeBtn(acceptLabel, true);
  const declineBtn = makeBtn(declineLabel, false);

  acceptBtn.addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setConsent(true);
    banner.remove();
  });

  declineBtn.addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setConsent(false);
    banner.remove();
  });

  btnWrap.appendChild(acceptBtn);
  btnWrap.appendChild(declineBtn);
  banner.appendChild(msg);
  banner.appendChild(btnWrap);
  document.body.appendChild(banner);
})();
