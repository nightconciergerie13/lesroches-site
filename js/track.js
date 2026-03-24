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

  function getSource() {
    const utm = getUTM('utm_source');
    if (utm) return utm.toLowerCase();

    const ref = document.referrer.toLowerCase();
    if (!ref) return 'direct';
    if (ref.includes('google')) return 'google';
    if (ref.includes('instagram') || ref.includes('l.instagram')) return 'instagram';
    if (ref.includes('facebook') || ref.includes('fb.com')) return 'facebook';
    if (ref.includes('tripadvisor')) return 'tripadvisor';
    if (ref.includes('airbnb')) return 'airbnb';
    if (ref.includes('booking.com')) return 'booking';
    if (ref.includes('pinterest')) return 'pinterest';
    if (ref.includes('twitter') || ref.includes('t.co')) return 'twitter';
    if (ref.includes('youtube')) return 'youtube';
    if (ref.includes('whatsapp')) return 'whatsapp';
    return 'other';
  }

  // ── Géolocalisation IP (ipapi.co, 1000 req/jour gratuites) ──

  async function getGeo() {
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
