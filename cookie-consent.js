/* ══════════════════════════════════════════════════════════════
   LES ROCHES — GDPR Cookie Consent Banner
   Stores preference in localStorage (functional only — not analytics)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const KEY = 'lr_cookie_consent';
  const stored = localStorage.getItem(KEY);
  if (stored) return; // Already decided

  // ── Inject CSS ────────────────────────────────────────────────
  const css = `
#lr-cookie{position:fixed;bottom:0;left:0;right:0;z-index:8000;background:rgba(30,27,24,.97);backdrop-filter:blur(12px);border-top:1px solid rgba(255,255,255,.08);padding:1.2rem 2rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;transform:translateY(100%);transition:transform .4s cubic-bezier(.25,.8,.25,1)}
#lr-cookie.show{transform:translateY(0)}
.lr-ck-txt{font-family:'Outfit',sans-serif;font-size:.62rem;font-weight:300;color:rgba(250,247,242,.65);line-height:1.7;max-width:640px}
.lr-ck-txt a{color:var(--ter,#b8734a);text-decoration:underline}
.lr-ck-btns{display:flex;gap:.7rem;flex-shrink:0}
.lr-ck-btn{font-family:'Outfit',sans-serif;font-size:.5rem;letter-spacing:.22em;text-transform:uppercase;padding:.55rem 1.4rem;border-radius:1px;cursor:pointer;transition:all .2s;white-space:nowrap}
.lr-ck-accept{background:var(--ter,#b8734a);color:#fff;border:1px solid var(--ter,#b8734a)}
.lr-ck-accept:hover{background:var(--ter2,#a05f38)}
.lr-ck-decline{background:transparent;color:rgba(250,247,242,.4);border:1px solid rgba(255,255,255,.15)}
.lr-ck-decline:hover{color:rgba(250,247,242,.75);border-color:rgba(255,255,255,.35)}
@media(max-width:680px){#lr-cookie{padding:1rem 1.2rem}.lr-ck-btns{width:100%}.lr-ck-btn{flex:1;text-align:center}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── Build banner ──────────────────────────────────────────────
  const banner = document.createElement('div');
  banner.id = 'lr-cookie';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML = `
    <p class="lr-ck-txt">
      We use cookies to analyze site traffic and improve your experience.
      By clicking <strong>Accept</strong>, you consent to our use of analytics cookies.
      Read our <a href="/booking-conditions.html">Privacy Policy</a>.
    </p>
    <div class="lr-ck-btns">
      <button class="lr-ck-btn lr-ck-decline" id="lr-ck-decline">Decline</button>
      <button class="lr-ck-btn lr-ck-accept" id="lr-ck-accept">Accept</button>
    </div>
  `;
  document.body.appendChild(banner);

  // Show with slight delay so CSS transition works
  requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('show')));

  function dismiss(choice) {
    localStorage.setItem(KEY, choice);
    banner.style.transform = 'translateY(100%)';
    setTimeout(() => banner.remove(), 420);
  }

  document.getElementById('lr-ck-accept').addEventListener('click', () => dismiss('accepted'));
  document.getElementById('lr-ck-decline').addEventListener('click', () => dismiss('declined'));
})();
