/* ═══════════════════════════════════════════════════════════════
   cookie-consent.js  |  Les Roches Retreat
   RGPD : aucun appel a Google avant le clic du visiteur.

   Regle tenue ici : Google Analytics n est pas present dans les pages.
   Ce fichier est le SEUL endroit qui peut le charger, et il ne le fait
   qu une fois le consentement donne. Tant que le visiteur n a pas
   repondu, ou s il refuse, rien ne part chez Google : pas de script,
   pas de requete, pas de cookie.

   Le compteur maison (js/track.js) est independant : il ne pose ni
   cookie ni identifiant, donc il mesure avant consentement.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  var CLE = 'lr_cookie_consent';
  var GA  = 'G-WFWBDDTMF0';

  function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
  function ecrire(v) { try { localStorage.setItem(CLE, v); } catch (e) {} }

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  var charge = false;
  function chargerAnalytics() {
    if (charge) return;
    charge = true;
    gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied',
      ad_personalization: 'denied', analytics_storage: 'denied'
    });
    gtag('consent', 'update', {
      ad_storage: 'granted', ad_user_data: 'granted',
      ad_personalization: 'granted', analytics_storage: 'granted'
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA, { anonymize_ip: true });
  }

  var stored = lire();
  if (stored === 'accepted') { chargerAnalytics(); return; }
  if (stored === 'declined') { return; }

  /* ── Langue et liens ─────────────────────────────────────────── */
  var lang = document.documentElement.lang || 'en';
  var isFR = lang.indexOf('fr') === 0;
  var isES = lang.indexOf('es') === 0;

  /* La politique de confidentialite vit a cote de la page courante,
     sauf dans /journal/<lang>/ ou il faut remonter de deux crans. */
  function lienPolitique() {
    var m = location.pathname.match(/\/journal\/(en|fr|es)\//);
    if (!m) return 'privacy-policy.html';
    return m[1] === 'en' ? '../../privacy-policy.html' : '../../' + m[1] + '/privacy-policy.html';
  }

  var texte = isFR
    ? 'Nous mesurons l’audience de ce site. Les cookies de mesure ne sont déposés que si vous les acceptez.'
    : isES
    ? 'Medimos la audiencia de este sitio. Las cookies de medición solo se instalan si las acepta.'
    : 'We measure this site’s audience. Measurement cookies are only set if you accept them.';

  var libAccepter = isFR ? 'Accepter' : isES ? 'Aceptar' : 'Accept';
  var libRefuser  = isFR ? 'Refuser'  : isES ? 'Rechazar' : 'Decline';
  var libEnSavoir = isFR ? 'En savoir plus' : isES ? 'Saber más' : 'Learn more';
  var libDialogue = isFR ? 'Consentement cookies' : isES ? 'Consentimiento de cookies' : 'Cookie consent';

  /* ── Bandeau ─────────────────────────────────────────────────── */
  var bandeau = document.createElement('div');
  bandeau.id = 'cookie-banner';
  bandeau.setAttribute('role', 'dialog');
  bandeau.setAttribute('aria-label', libDialogue);
  bandeau.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9999',
    'background:rgba(14,13,11,.96)', 'color:#f5f0e8', 'padding:1.1rem 1.5rem',
    'display:flex', 'align-items:center', 'gap:1rem', 'flex-wrap:wrap',
    'font-family:inherit', 'font-size:.78rem', 'letter-spacing:.03em',
    'border-top:1px solid rgba(245,240,232,.12)', 'backdrop-filter:blur(8px)'
  ].join(';');

  var msg = document.createElement('span');
  msg.style.cssText = 'flex:1;min-width:200px;line-height:1.6;opacity:.85';
  msg.textContent = texte + ' ';

  var enSavoir = document.createElement('a');
  enSavoir.href = lienPolitique();
  enSavoir.textContent = libEnSavoir;
  enSavoir.style.cssText = 'color:inherit;text-decoration:underline;text-underline-offset:3px;white-space:nowrap';
  msg.appendChild(enSavoir);

  var boutons = document.createElement('div');
  boutons.style.cssText = 'display:flex;gap:.6rem;flex-shrink:0';

  function faireBouton(libelle, principal) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = libelle;
    b.style.cssText = [
      'font-size:.62rem', 'letter-spacing:.18em', 'text-transform:uppercase',
      'padding:.55rem 1.4rem', 'border-radius:1px', 'cursor:pointer',
      'min-height:44px',
      'border:1px solid ' + (principal ? 'transparent' : 'rgba(245,240,232,.3)'),
      'background:' + (principal ? '#b09060' : 'transparent'),
      'color:' + (principal ? '#0e0d0b' : '#f5f0e8'),
      'font-family:inherit', 'transition:opacity .2s'
    ].join(';');
    return b;
  }

  var btnAccepter = faireBouton(libAccepter, true);
  var btnRefuser  = faireBouton(libRefuser, false);

  btnAccepter.addEventListener('click', function () {
    ecrire('accepted');
    chargerAnalytics();
    bandeau.remove();
  });

  btnRefuser.addEventListener('click', function () {
    ecrire('declined');
    bandeau.remove();
  });

  boutons.appendChild(btnAccepter);
  boutons.appendChild(btnRefuser);
  bandeau.appendChild(msg);
  bandeau.appendChild(boutons);
  document.body.appendChild(bandeau);
})();
