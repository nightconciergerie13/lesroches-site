// ============================================================
// Les Roches - Synchro disponibilites + prix Beds24 -> availability.json
// LECTURE SEULE. Tourne dans GitHub Actions (toutes les heures).
// ============================================================

const APIKEY   = process.env.BEDS24_APIKEY;
const PROPKEYS = JSON.parse(process.env.BEDS24_PROPKEYS || '{}');
const API      = "https://api.beds24.com/json/getRoomDates";

const ROOMS = {
  "326257": 677073, // Casa Jade
  "326258": 677074, // Casa Ambre
  "326247": 677059, // Casa Opale
  "326259": 677075, // Casa Agate
  "326248": 677060, // Casa Onyx
  "326251": 677063  // Casa Topaze
};

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const iso = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

async function fetchVilla(propId) {
  const roomId = ROOMS[propId];
  const propKey = PROPKEYS[propId];
  if (!roomId || !propKey) { console.log(`SKIP ${propId}`); return null; }
  const from = new Date();
  const to = new Date(); to.setDate(to.getDate() + 365);
  const body = { authentication: { apiKey: APIKEY, propKey }, roomId, from: ymd(from), to: ymd(to) };
  const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { console.log(`PARSE FAIL ${propId}: ${text.slice(0, 300)}`); return null; }
  if (data && data.error) { console.log(`API ERROR ${propId}: ${JSON.stringify(data).slice(0, 300)}`); return null; }
  return data;
}

function extractRoomObject(data, roomId) {
  if (!data || typeof data !== "object") return null;
  if (Object.keys(data).some(k => /^\d{8}$/.test(k))) return data;
  if (data[String(roomId)]) return data[String(roomId)];
  if (data[roomId]) return data[roomId];
  for (const v of Object.values(data)) {
    if (v && typeof v === "object" && Object.keys(v).some(k => /^\d{8}$/.test(k))) return v;
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
    if (!roomObj) { console.log(`NO ROOM OBJ ${propId}`); continue; }
    const available = [];
    const minStay = {};
    const prices = {};
    for (const [dateKey, info] of Object.entries(roomObj)) {
      if (!/^\d{8}$/.test(dateKey) || !info || typeof info !== "object") continue;
      const inv = Number(info.i || 0);
      const ovr = Number(info.o || 0);
      if (inv > 0 && ovr !== 1) {
        const d = iso(dateKey);
        available.push(d);
        if (info.m) minStay[d] = Number(info.m);
        if (info.p1 != null && info.p1 !== "") prices[d] = Number(info.p1);
      }
    }
    villas[propId] = { available, minStay, prices };
    console.log(`OK ${propId}: ${available.length} dates dispo`);
  }
  const out = { updated: new Date().toISOString(), source: "beds24-getRoomDates", villas };
  const fs = await import("fs");
  fs.writeFileSync("availability.json", JSON.stringify(out));
  console.log("availability.json ecrit.");
  console.log("DEBUG: " + debugRaw);
})();
