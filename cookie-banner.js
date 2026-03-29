/**
 * Les Roches — Cookie Consent Banner
 * GDPR/RGPD compliant, no dependencies, stores preference in localStorage
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'lr_cookie_consent';
  const CONSENT_VERSION = '1';

  // Check if already consented
  if (localStorage.getItem(STORAGE_KEY) === CONSENT_VERSION) return;

  // Detect language for banner text
  const lang = (navigator.language || 'en').toLowerCase().substring(0, 2);

  const texts = {
    fr: {
      msg: 'Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience. En continuant, vous acceptez notre politique de confidentialité.',
      accept: 'Accepter',
      decline: 'Refuser',
      policy: 'En savoir plus'
    },
    es: {
      msg: 'Utilizamos cookies para analizar el tráfico y mejorar su experiencia. Al continuar, acepta nuestra política de privacidad.',
      accept: 'Aceptar',
      decline: 'Rechazar',
      policy: 'Más información'
    },
    en: {
      msg: 'We use cookies to analyse traffic and improve your experience. By continuing, you agree to our privacy policy.',
      accept: 'Accept',
      decline: 'Decline',
      policy: 'Learn more'
    }
  };

  const t = texts[lang] || texts.en;

  // Build banner HTML
  const banner = document.createElement('div');
  banner.id = 'lr-cookie';
  banner.innerHTML = `
    <div class="lr-ck-inner">
      <p class="lr-ck-msg">${t.msg}</p>
      <div class="lr-ck-actions">
        <button class="lr-ck-accept">${t.accept}</button>
        <button class="lr-ck-decline">${t.decline}</button>
      </div>
    </div>
  `;

  // Styles (injected inline so no external CSS needed)
  const style = document.createElement('style');
  style.textContent = `
    #lr-cookie {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9998;
      background: rgba(30,27,24,0.97);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255,255,255,0.07);
      padding: 1.1rem 5vw;
      transform: translateY(100%);
      transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    #lr-cookie.visible {
      transform: translateY(0);
    }
    .lr-ck-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .lr-ck-msg {
      font-family: 'Outfit', sans-serif;
      font-size: 0.68rem;
      color: rgba(250,247,242,0.52);
      line-height: 1.7;
      font-weight: 300;
      margin: 0;
    }
    .lr-ck-actions {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      flex-shrink: 0;
    }
    .lr-ck-accept, .lr-ck-decline {
      font-family: 'Outfit', sans-serif;
      font-size: 0.5rem;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      border: none;
      border-radius: 1px;
      padding: 0.6rem 1.4rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .lr-ck-accept {
      background: #b8734a;
      color: #faf7f2;
    }
    .lr-ck-accept:hover {
      background: #a05f38;
    }
    .lr-ck-decline {
      background: transparent;
      color: rgba(250,247,242,0.35);
      border: 1px solid rgba(255,255,255,0.12);
    }
    .lr-ck-decline:hover {
      color: rgba(250,247,242,0.65);
      border-color: rgba(255,255,255,0.25);
    }
    @media (max-width: 700px) {
      .lr-ck-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .lr-ck-actions {
        width: 100%;
      }
      .lr-ck-accept, .lr-ck-decline {
        flex: 1;
        text-align: center;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(banner);

  // Show with delay for smooth entry
  setTimeout(() => banner.classList.add('visible'), 600);

  // Accept
  banner.querySelector('.lr-ck-accept').addEventListener('click', function() {
    localStorage.setItem(STORAGE_KEY, CONSENT_VERSION);
    hideBanner();
    // Analytics can be enabled here
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
    }
  });

  // Decline
  banner.querySelector('.lr-ck-decline').addEventListener('click', function() {
    localStorage.setItem(STORAGE_KEY, 'declined');
    hideBanner();
  });

  function hideBanner() {
    banner.style.transition = 'transform 0.35s ease';
    banner.style.transform = 'translateY(100%)';
    setTimeout(() => banner.remove(), 400);
  }

})();
