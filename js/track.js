/* ══════════════════════════════════════════════════════════════
   LES ROCHES — Tracker visiteurs léger
   Enregistre : page, source, pays, device dans Supabase
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SUPABASE_URL  = 'https://vrufclzcaswkdgrffdwm.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydWZjbHpjYXN3a2RncmZmZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTE2MjgsImV4cCI6MjA4OTg2NzYyOH0.cHllj6HZms7qf5PVc3LPy057r3rvCv6JyjfAfVlH34E';

  // ── Helpers ──────────────────────────────────────────────────

  function getPage() {
    const p = window.location.pathname.split('/').pop() || 'index.html';
    return p === '' ? 'index.html' : p;
  }

  function getDevice() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function getUTM(param) {
    return new URLSearchParams(window.location.search).get(param) || null;
  }

  /* On classe sur le domaine du referent, jamais sur l'URL entiere.
     Constate le 21-11-2026 : « lesrochesretreat.com » contient « t.co »
     (dans « treat.com »), et l'ancien test `ref.includes('t.co')` rangeait
     donc toute la navigation interne en « twitter ». 96 vues sur 97 sur
     cinq jours. Toutes les parts de provenance en etaient faussees. */
  function sansWww(h) { return h.replace(/^www\./, ''); }

  function getSource() {
    const utm = getUTM('utm_source');
    if (utm) return utm.toLowerCase();

    const ref = document.referrer;
    if (!ref) return 'direct';

    let hote;
    try { hote = sansWww(new URL(ref).hostname.toLowerCase()); }
    catch (e) { return 'other'; }

    /* Navigation d'une page du site a une autre : ce n'est pas une source. */
    if (hote === sansWww(window.location.hostname.toLowerCase())) return 'interne';

    /* `est` n'accepte que le domaine exact ou un sous-domaine. */
    function est(d) { return hote === d || hote.endsWith('.' + d); }
    /* `famille` couvre les extensions nationales : google.fr, google.co.cr... */
    function famille(d) { return hote === d || hote.indexOf(d + '.') === 0 || hote.indexOf('.' + d + '.') !== -1; }

    if (famille('google')) return 'google';
    if (est('instagram.com')) return 'instagram';
    if (est('facebook.com') || est('fb.com') || est('fb.me')) return 'facebook';
    if (famille('tripadvisor')) return 'tripadvisor';
    if (famille('airbnb')) return 'airbnb';
    if (est('booking.com')) return 'booking';
    if (famille('pinterest')) return 'pinterest';
    if (est('twitter.com') || est('x.com') || est('t.co')) return 'twitter';
    if (est('youtube.com') || est('youtu.be')) return 'youtube';
    if (est('whatsapp.com')) return 'whatsapp';
    return 'other';
  }

  // ── Géolocalisation IP (ipapi.co, 1000 req/jour gratuites) ──
  // Cet appel transmet l'adresse IP du visiteur à un tiers, il est donc
  // conditionné au consentement (12-11-2026). Sans accord, la visite est
  // comptée sans le pays : le reste du compteur ne dépose rien et reste
  // licite avant consentement.

  function aConsenti() {
    try { return localStorage.getItem('lr_cookie_consent') === 'accepted'; }
    catch (e) { return false; }
  }

  async function getGeo() {
    if (!aConsenti()) return {};
    try {
      const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
      if (!r.ok) return {};
      const d = await r.json();
      return {
        country:      d.country_name || null,
        country_code: d.country_code  || null,
        city:         d.city          || null,
      };
    } catch (_) {
      return {};
    }
  }

  // ── Envoi vers Supabase ──────────────────────────────────────

  async function sendPageView() {
    // Ne pas tracker les pages admin
    if (window.location.pathname.includes('/admin')) return;

    const geo = await getGeo();

    const payload = {
      page:         getPage(),
      referrer:     document.referrer || null,
      source:       getSource(),
      utm_source:   getUTM('utm_source'),
      utm_medium:   getUTM('utm_medium'),
      utm_campaign: getUTM('utm_campaign'),
      country:      geo.country      || null,
      country_code: geo.country_code || null,
      city:         geo.city         || null,
      device:       getDevice(),
    };

    try {
      await fetch(SUPABASE_URL + '/rest/v1/page_views', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify(payload),
      });
    } catch (_) {
      // Silencieux — ne jamais bloquer l'expérience visiteur
    }
  }

  // Lancer après le chargement, sans bloquer le rendu
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendPageView);
  } else {
    setTimeout(sendPageView, 0);
  }

})();
