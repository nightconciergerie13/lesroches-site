// ============================================================
// Les Roches — Synchro disponibilités Beds24 -> availability.json
// LECTURE SEULE. N'écrit JAMAIS dans Supabase ni sur le site.
// Tourne dans GitHub Actions (toutes les heures). Lit getRoomDates,
// génère availability.json (servi par GitHub Pages, lu par le site).
// ============================================================

const APIKEY   = process.env.BEDS24_APIKEY;                       // secret (clé de compte)
const PROPKEYS = JSON.parse(process.env.BEDS24_PROPKEYS || '{}'); // secret (map propId -> propKey)
const API      = "https://api.beds24.com/json/getRoomDates";

// propId -> roomId (identifiants publics, non secrets)
const ROOMS = {
  "326257": 677073, // Casa Jade
  "326258": 677074, // Casa Ambre
  "326247": 677059, // Casa Opale
  "326259": 677075, // Casa Agate
  "326248": 677060, // Casa Onyx
  "326251": 677063  // Casa Topaze
};

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const iso = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

async function fetchVilla(propId) {
  const roomId = ROOMS[propId];
  const propKey = PROPKEYS[propId];
  if (!roomId || !propKey) { console.log(`SKIP ${propId} (roomId/propKey manquant)`); return null; }

  const from = new Date();
  const to = new Date(); to.setDate(to.getDate() + 365);
  const body = { authentication: { apiKey: APIKEY, propKey }, roomId, from: ymd(from), to: ymd(to) };

  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { console.log(`PARSE FAIL ${propId}: ${text.slice(0, 300)}`); return null; }
  if (data && data.error) { console.log(`API ERROR ${propId}: ${JSON.stringify(data).slice(0, 300)}`); return null; }
  return data;
}

function extractRoomObject(data, roomId) {
  if (!data || typeof data !== 'object') return null;
  // Cas reel : la reponse EST directement la map date -> info
  if (Object.keys(data).some(k => /^\d{8}$/.test(k))) return data;
  // Fallback : imbriquee sous le roomId
  if (data[String(roomId)]) return data[String(roomId)];
  if (data[roomId]) return data[roomId];
  for (const v of Object.values(data)) {
    if (v && typeof v === 'object' && Object.keys(v).some(k => /^\d{8}$/.test(k))) return v;
  }
  return null;
}

(async () => {
  const villas = {};
  let debugRaw = null;

  for (const propId of Object.keys(ROOMS)) {
    const data = await fetchVilla(propId);
    if (!data) continue;
    if (!debugRaw) debugRaw = JSON.stringify(data).slice(0, 600);

    const roomObj = extractRoomObject(data, ROOMS[propId]);
    if (!roomObj) { console.log(`NO ROOM OBJ ${propId}: ${JSON.stringify(data).slice(0, 300)}`); continue; }

    const available = [];
    const minStay = {};
    for (const [dateKey, info] of Object.entries(roomObj)) {
      if (!/^\d{8}$/.test(dateKey) || !info || typeof info !== 'object') continue;
      const inv = Number(info.i || 0);
      const ovr = Number(info.o || 0);
      if (inv > 0 && ovr !== 1) {
        available.push(iso(dateKey));
        if (info.m) minStay[iso(dateKey)] = Number(info.m);
      }
    }
    villas[propId] = { available, minStay };
    console.log(`OK ${propId}: ${available.length} dates dispo`);
  }

  const out = { updated: new Date().toISOString(), source: 'beds24-getRoomDates', villas };
  const fs = await import('fs');
  fs.writeFileSync('availability.json', JSON.stringify(out));
  console.log('availability.json ecrit.');
  console.log('DEBUG 1ere reponse brute Beds24: ' + debugRaw);
})();
