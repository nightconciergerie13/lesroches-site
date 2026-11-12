/* ═══════════════════════════════════════════════════════════════
   cookie-consent.js  |  Les Roches Retreat

   Regle tenue ici : rien ne part chez un tiers avant le clic.

   1. Google Analytics n est plus present dans les pages. Ce fichier
      est le seul endroit du site capable de le charger, et il ne le
      fait qu apres un clic sur Accepter.
   2. La carte Google du pied de page n est pas chargee tant que le
      visiteur ne la demande pas, par le bouton ou par son accord.
   3. Les cookies _ga poses avant cette correction sont effaces tant
      que le visiteur n a pas accepte.

   Le compteur maison (js/track.js) est independant : il ne pose ni
   cookie ni identifiant, donc il mesure avant consentement.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  var CLE = 'lr_cookie_consent';
  var GA  = 'G-WFWBDDTMF0';

  function lire() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
  function ecrire(v) { try { localStorage.setItem(CLE, v); } catch (e) {} }

  /* ── Langue et libelles ──────────────────────────────────────── */
  var lang = document.documentElement.lang || 'en';
  var isFR = lang.indexOf('fr') === 0;
  var isES = lang.indexOf('es') === 0;
  function mot(fr, es, en) { return isFR ? fr : isES ? es : en; }

  var libAccepter = mot('Accepter', 'Aceptar', 'Accept');
  var libRefuser  = mot('Refuser', 'Rechazar', 'Decline');
  var libEnSavoir = mot('En savoir plus', 'Saber más', 'Learn more');
  var libCarte    = mot('Afficher la carte', 'Mostrar el mapa', 'Show the map');
  var libCarteNb  = mot('Google peut déposer des cookies.',
                        'Google puede instalar cookies.',
                        'Google may set cookies.');
  var libDialogue = mot('Consentement cookies', 'Consentimiento de cookies', 'Cookie consent');
  var texte = mot(
    'Nous mesurons l’audience de ce site. Les cookies de mesure ne sont déposés que si vous les acceptez.',
    'Medimos la audiencia de este sitio. Las cookies de medición solo se instalan si las acepta.',
    'We measure this site’s audience. Measurement cookies are only set if you accept them.'
  );

  /* ── Google Analytics ────────────────────────────────────────── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  /* Conversion : un clic vers WhatsApp, d'ou qu'il vienne. L'ecouteur est pose
     avant toute sortie de fonction, sinon il manquerait aux visiteurs qui ont
     deja repondu au bandeau. */
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href*="wa.me/"]') : null;
    if (!a) return;
    try { gtag('event', 'contact_whatsapp', { lien: a.getAttribute('href') || '' }); } catch (e) {}
  }, true);

  var chargeGA = false;
  function chargerAnalytics() {
    if (chargeGA) return;
    chargeGA = true;
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

  /* Les cookies _ga poses avant la correction du 12-11-2026 n ont
     pas ete consentis : on les retire tant qu il n y a pas d accord. */
  function effacerCookiesGA() {
    var hotes = [location.hostname, '.' + location.hostname];
    var pts = location.hostname.split('.');
    if (pts.length > 2) hotes.push('.' + pts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var nom = c.split('=')[0].trim();
      if (nom.indexOf('_ga') !== 0) return;
      hotes.forEach(function (h) {
        document.cookie = nom + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + h;
      });
      document.cookie = nom + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });
  }

  /* ── Carte Google, chargee a la demande ──────────────────────── */
  function bouton(libelle, principal) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = libelle;
    b.style.cssText = [
      'font-size:.62rem', 'letter-spacing:.18em', 'text-transform:uppercase',
      'padding:.55rem 1.4rem', 'border-radius:1px', 'cursor:pointer', 'min-height:44px',
      'border:1px solid ' + (principal ? 'transparent' : 'currentColor'),
      'background:' + (principal ? '#b09060' : 'transparent'),
      'color:' + (principal ? '#0e0d0b' : 'inherit'),
      'font-family:inherit', 'transition:opacity .2s'
    ].join(';');
    return b;
  }

  function poserCarte(hote) {
    var cadre = document.createElement('iframe');
    cadre.src = hote.getAttribute('data-carte');
    cadre.setAttribute('allowfullscreen', '');
    cadre.setAttribute('loading', 'lazy');
    cadre.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    cadre.style.cssText = 'width:100%;height:100%;border:0;display:block;' +
      'filter:grayscale(.6) sepia(.4) contrast(.9) brightness(.9)';
    hote.innerHTML = '';
    hote.style.padding = '0';
    hote.style.background = 'none';
    hote.style.border = '0';
    hote.appendChild(cadre);
  }

  function cartes(accepte) {
    var liste = document.querySelectorAll('.lr-carte[data-carte]');
    for (var i = 0; i < liste.length; i++) {
      (function (hote) {
        if (accepte) { poserCarte(hote); return; }
        var b = bouton(libCarte, false);
        b.addEventListener('click', function () { poserCarte(hote); });
        var note = document.createElement('span');
        note.textContent = libCarteNb;
        note.style.cssText = 'font-size:.6rem;letter-spacing:.06em;opacity:.6;line-height:1.5';
        hote.innerHTML = '';
        hote.appendChild(b);
        hote.appendChild(note);
      })(liste[i]);
    }
  }

  /* ── Choix deja fait ─────────────────────────────────────────── */
  var stored = lire();
  if (stored === 'accepted') { chargerAnalytics(); cartes(true); return; }
  effacerCookiesGA();
  cartes(false);
  if (stored === 'declined') { return; }

  /* ── Bandeau ─────────────────────────────────────────────────── */
  function lienPolitique() {
    var m = location.pathname.match(/\/journal\/(en|fr|es)\//);
    if (!m) return 'privacy-policy.html';
    return m[1] === 'en' ? '../../privacy-policy.html' : '../../' + m[1] + '/privacy-policy.html';
  }

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

  var btnAccepter = bouton(libAccepter, true);
  var btnRefuser  = bouton(libRefuser, false);
  btnRefuser.style.borderColor = 'rgba(245,240,232,.3)';
  btnRefuser.style.color = '#f5f0e8';

  btnAccepter.addEventListener('click', function () {
    ecrire('accepted');
    chargerAnalytics();
    cartes(true);
    bandeau.remove();
  });

  btnRefuser.addEventListener('click', function () {
    ecrire('declined');
    effacerCookiesGA();
    bandeau.remove();
  });

  boutons.appendChild(btnAccepter);
  boutons.appendChild(btnRefuser);
  bandeau.appendChild(msg);
  bandeau.appendChild(boutons);
  document.body.appendChild(bandeau);
})();
