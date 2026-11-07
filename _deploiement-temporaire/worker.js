/**
 * Les Roches Retreat — Worker de reservation directe.
 * Reconstruit le 06-11-2026 apres effacement du dossier de travail temporaire.
 * Specification complete : [[Paiement direct — Worker & checkout maison]].
 *
 * Quatre points d'entree, appeles dans cet ordre par la page villa :
 *
 *   POST /quote    { villa, checkin, checkout, guest:{numAdult}, options }
 *                  -> le montant ferme, recalcule depuis Beds24 en direct
 *
 *   POST /intent   { villa, checkin, checkout, guest, options }
 *                  -> cree l'intention de paiement ONVO et renvoie de quoi
 *                     afficher le formulaire de carte DANS la page
 *
 *   POST /confirm  { paymentIntentId, guest }
 *                  -> verifie aupres d'ONVO que le paiement a VRAIMENT abouti,
 *                     puis ecrit la reservation dans Beds24
 *
 *   GET  /health   -> etat des dependances, sans rien ecrire
 *
 * Principes tenus :
 *   - le client n'envoie JAMAIS de montant, seulement une villa et deux dates
 *   - le sejour est inscrit dans l'intention ONVO et relu LA a la confirmation,
 *     jamais dans la requete du client
 *   - rien n'est ecrit dans Beds24 avant qu'ONVO ait confirme statut, montant
 *     ET devise (exigence explicite de la doc ONVO)
 *   - une reservation par paiement : apiReference porte l'identifiant de
 *     paiement et est relu avant toute creation
 *   - un `success: true` de Beds24 ne prouve rien : on relit apres ecriture
 *
 * Secrets attendus (Cloudflare -> Settings -> Variables and Secrets) :
 *   BEDS24_REFRESH_TOKEN · ONVO_SECRET_KEY · ONVO_PUBLISHABLE_KEY
 */

const BEDS24 = "https://beds24.com/api/v2";
const ONVO = "https://api.onvopay.com/v1";

const DISCOUNT = 0.95;
const PAY_FULL_BELOW_USD = 600;
const MAX_NIGHTS = 60;
const CURRENCY = "USD";
const SITE = "https://lesrochesretreat.com";

/** Liste blanche. Un identifiant venu du client n'est jamais utilise tel quel. */
const VILLAS = {
  jade:   { propId: 326257, roomId: 677073, name: "Casa Jade" },
  onyx:   { propId: 326248, roomId: 677060, name: "Casa Onyx" },
  topaze: { propId: 326251, roomId: 677063, name: "Casa Topaze" },
  ambre:  { propId: 326258, roomId: 677074, name: "Casa Ambre" },
  opale:  { propId: 326247, roomId: 677059, name: "Casa Opale" },
  agate:  { propId: 326259, roomId: 677075, name: "Casa Agate" },
};

/**
 * ===================== LES DEUX TABLES A REMPLIR PAR IAN =====================
 *
 * Deux categories, volontairement separees (arbitrage Ian du 05-11-2026) :
 *
 *   SERVICES   -> ce que Les Roches FACTURE. Prix ferme, encaisse avec l'acompte.
 *   ACTIVITES  -> ce qui interesse le client. Aucune facturation ici : on le
 *                 rappelle par WhatsApp et il paie le prestataire en direct.
 *
 * Les prix vivent ICI, cote serveur, et nulle part ailleurs. C'est ce qui
 * empeche un client de modifier le montant depuis son navigateur.
 */

/**
 * Services factures, assures par Marie et Martin dans la maison.
 *
 *   priceUsd : entier en dollars. `null` = pas de prix ferme -> le service est
 *              propose et transmis a l'exploitation, mais JAMAIS facture ici.
 *   unit     : "stay" une fois | "night" x nuits | "person" x voyageurs
 *              | "each" quantite choisie par le client (bornee par maxQty)
 *   maxQty   : plafond pour l'unite "each" (defaut 10)
 *   label    : les trois langues. La clientele est majoritairement anglophone.
 *   note     : precision affichee sous le service (trois langues, optionnel).
 */
const SERVICES = {
  navette: {
    label: { en: "Airport shuttle (Cobano)", fr: "Navette a\u00e9roport (C\u00f3bano)", es: "Traslado aeropuerto (C\u00f3bano)" },
    unit: "stay",
    priceUsd: 50,
    note: { en: "One way \u2014 Cobano airstrip to the villa, on arrival", fr: "Aller simple \u2014 de l'a\u00e9rodrome de C\u00f3bano \u00e0 la villa, \u00e0 l'arriv\u00e9e", es: "Solo ida \u2014 del aer\u00f3dromo de C\u00f3bano a la villa, a la llegada" },
  },
  courses: {
    label: { en: "Pre-arrival grocery stocking", fr: "Courses avant arriv\u00e9e", es: "Compras antes de llegar" },
    unit: "stay",
    priceUsd: 20,
    note: { en: "Service fee only \u2014 the receipt is reimbursed on arrival", fr: "Frais de service uniquement \u2014 le ticket de caisse est rembours\u00e9 \u00e0 l'arriv\u00e9e", es: "Solo el servicio \u2014 el recibo se reembolsa a la llegada" },
  },
  arriveeTot: {
    label: { en: "Early check-in (2 hours)", fr: "Arriv\u00e9e anticip\u00e9e (2 heures)", es: "Entrada anticipada (2 horas)" },
    unit: "stay",
    priceUsd: 30,
    note: { en: "From 1 pm instead of 3 pm \u2014 subject to availability, refunded if we cannot accommodate", fr: "\u00c0 partir de 13 h au lieu de 15 h \u2014 sous r\u00e9serve de disponibilit\u00e9, rembours\u00e9 si nous ne pouvons pas", es: "Desde la 1 pm en vez de las 3 pm \u2014 sujeto a disponibilidad, reembolsado si no es posible" },
  },
  departTard: {
    label: { en: "Late check-out (2 hours)", fr: "D\u00e9part tardif (2 heures)", es: "Salida tard\u00eda (2 horas)" },
    unit: "stay",
    priceUsd: 30,
    note: { en: "Until 1 pm instead of 11 am \u2014 subject to availability, refunded if we cannot accommodate", fr: "Jusqu'\u00e0 13 h au lieu de 11 h \u2014 sous r\u00e9serve de disponibilit\u00e9, rembours\u00e9 si nous ne pouvons pas", es: "Hasta la 1 pm en vez de las 11 am \u2014 sujeto a disponibilidad, reembolsado si no es posible" },
  },
  packPlage: {
    label: { en: "Beach pack", fr: "Pack plage", es: "Pack de playa" },
    unit: "stay",
    priceUsd: 50,
    note: { en: "Two loungers and a parasol, for the whole stay", fr: "Deux fauteuils d\u00e9tente et un parasol, pour tout le s\u00e9jour", es: "Dos tumbonas y una sombrilla, para toda la estancia" },
  },
  blanchisserie: {
    label: { en: "Laundry", fr: "Blanchisserie", es: "Lavander\u00eda" },
    unit: "each",
    maxQty: 10,
    priceUsd: 10,
    note: { en: "Per machine load, washed and dried", fr: "Par machine, lav\u00e9 et s\u00e9ch\u00e9", es: "Por lavado, lavado y secado" },
  },
  eau: {
    label: { en: "Drinking water, 10 L", fr: "Bonbonne d'eau potable 10 L", es: "Garraf\u00f3n de agua 10 L" },
    unit: "each",
    maxQty: 10,
    priceUsd: 15,
    note: { en: "Delivered to the villa", fr: "Livr\u00e9e \u00e0 la villa", es: "Entregado en la villa" },
  },
  decoration: {
    label: { en: "Special occasion setup", fr: "D\u00e9coration occasion sp\u00e9ciale", es: "Decoraci\u00f3n ocasi\u00f3n especial" },
    unit: "stay",
    priceUsd: null,
    note: { en: "Flowers, candles, table setting, champagne \u2014 on request", fr: "Fleurs, bougies, table dress\u00e9e, champagne \u2014 sur demande", es: "Flores, velas, mesa puesta, champ\u00e1n \u2014 a consultar" },
  },
};

/**
 * Activites : cases a cocher, JAMAIS facturees. Le client est rappele par
 * WhatsApp et paie le prestataire en direct. Aucun champ prix n'existe ici,
 * donc une activite ne peut pas etre facturee, meme par erreur de saisie.
 * Ordre : a la villa, puis la mer, puis la terre, puis le ciel.
 */
const ACTIVITIES = {
  massage:    { label: { en: "In-villa massage",        fr: "Massage \u00e0 la villa",      es: "Masaje en la villa" } },
  chef:       { label: { en: "Private chef at the villa", fr: "Chef \u00e0 la villa",       es: "Chef privado en la villa" } },
  cuisine:    { label: { en: "Cooking class",           fr: "Cours de cuisine",             es: "Clase de cocina" } },
  pilates:    { label: { en: "Pilates",                 fr: "Pilates",                      es: "Pilates" } },
  surf:       { label: { en: "Surf lessons",            fr: "Cours de surf",                es: "Clases de surf" } },
  kayak:      { label: { en: "Kayak fishing",           fr: "P\u00eache en kayak",          es: "Pesca en kayak" } },
  peche:      { label: { en: "Sport fishing",           fr: "P\u00eache",                   es: "Pesca deportiva" } },
  tortuga:    { label: { en: "Isla Tortuga day trip",   fr: "Journ\u00e9e Isla Tortuga",    es: "D\u00eda en Isla Tortuga" } },
  biolum:     { label: { en: "Bioluminescence tour",    fr: "Sortie bioluminescence",       es: "Tour de bioluminiscencia" } },
  quad:       { label: { en: "ATV / quad",              fr: "Quad",                         es: "Cuadraciclo" } },
  cheval:     { label: { en: "Horseback on the beach",  fr: "Cheval sur la plage",          es: "Cabalgata en la playa" } },
  tyrolienne: { label: { en: "Zipline",                 fr: "Tyrolienne",                   es: "Canopy" } },
  curu:       { label: { en: "Cur\u00fa Wildlife Refuge", fr: "Refuge de Cur\u00fa",       es: "Refugio de Cur\u00fa" } },
  helico:     { label: { en: "Helicopter tour",         fr: "Tour en h\u00e9licopt\u00e8re", es: "Tour en helic\u00f3ptero" } },
};

/** La remise directe de 5 % porte sur l'hebergement, pas sur les services. */
const DISCOUNT_APPLIES_TO_EXTRAS = false;

/** Les services sont encaisses en entier d'emblee : on paie le prestataire. */
const EXTRAS_PAID_IN_FULL = true;

/* ================================================================ erreurs == */

class HttpError extends Error {
  constructor(status, code, extra) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra || {};
  }
}

/* ================================================================== dates == */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function parseISO(s) {
  if (typeof s !== "string" || !ISO.test(s)) return null;
  const d = new Date(s + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== s) return null;   // refuse le 30 fevrier
  return d;
}

const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const toISO = (d) => d.toISOString().slice(0, 10);

/**
 * Date du jour au Costa Rica (UTC-6, sans heure d'ete).
 * Le site utilise la date UTC et refuse donc le jour en cours des 18 h locales.
 */
const todayCostaRica = (now) =>
  new Date((now ?? Date.now()) - 6 * 3600000).toISOString().slice(0, 10);

/* ================================================================= beds24 == */

let tokenCache = null;

async function beds24Token(env) {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60000) return tokenCache.token;

  const key = new Request("https://les-roches.internal/beds24-token");
  const store = typeof caches !== "undefined" ? caches.default : null;

  if (store) {
    const hit = await store.match(key);
    if (hit) {
      const c = await hit.json();
      if (c.expiresAt > now + 60000) { tokenCache = c; return c.token; }
    }
  }

  if (!env.BEDS24_REFRESH_TOKEN) throw new HttpError(500, "beds24_not_configured");

  const r = await fetch(BEDS24 + "/authentication/token", {
    headers: { accept: "application/json", refreshToken: env.BEDS24_REFRESH_TOKEN },
  });
  if (!r.ok) throw new HttpError(502, "beds24_auth_failed");
  const j = await r.json();
  if (!j.token) throw new HttpError(502, "beds24_auth_failed");

  const ttl = Math.min(Number(j.expiresIn) || 86400, 86400) - 3600;   // marge d'1 h
  const entry = { token: j.token, expiresAt: now + ttl * 1000 };
  tokenCache = entry;
  if (store) {
    await store.put(key, new Response(JSON.stringify(entry), {
      headers: { "content-type": "application/json", "cache-control": "max-age=" + ttl },
    }));
  }
  return entry.token;
}

async function beds24(env, path, init) {
  const token = await beds24Token(env);
  const r = await fetch(BEDS24 + path, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      token,
      ...(init?.headers || {}),
    },
  });
  if (r.status === 401) { tokenCache = null; throw new HttpError(502, "beds24_token_rejected"); }
  if (r.status === 429) throw new HttpError(503, "beds24_rate_limited");
  if (!r.ok) throw new HttpError(502, "beds24_unavailable", { status: r.status });
  return r.json();
}

/** Calendrier d'une chambre, etale nuit par nuit (Beds24 renvoie des segments). */
async function fetchNights(env, roomId, from, to) {
  const body = await beds24(env,
    "/inventory/rooms/calendar?roomId=" + encodeURIComponent(roomId) +
    "&startDate=" + from + "&endDate=" + to +
    "&includePrices=true&includeMinStay=true&includeNumAvail=true");

  const nights = new Map();
  for (const row of body.data || []) {
    for (const seg of row.calendar || []) {
      const a = parseISO(seg.from), b = parseISO(seg.to);
      if (!a || !b) continue;
      for (let d = a; d <= b; d = addDays(d, 1)) {
        nights.set(toISO(d), {
          price: seg.price1 == null ? null : Number(seg.price1),
          minStay: seg.minStay == null ? null : Number(seg.minStay),
          numAvail: seg.numAvail == null ? null : Number(seg.numAvail),
        });
      }
    }
  }
  return nights;
}

/** Libelle dans la langue demandee ; l'anglais est le defaut. */
function pick(label, lang) {
  if (typeof label === "string") return label;
  return (label && (label[lang] || label.en)) || "";
}

/* ================================================================ options == */

const trim = (v, max) => String(v ?? "").trim().slice(0, max);

/** Options gratuites et selections, validees contre les tables du serveur. */
function cleanOptions(o) {
  const askedS = Array.isArray(o?.services) ? o.services : [];
  const askedA = Array.isArray(o?.activities) ? o.activities : [];
  const services = Object.keys(SERVICES).filter((k) => askedS.includes(k));

  /* Quantites, uniquement pour les services a l'unite. Bornees cote serveur :
     le client choisit combien, jamais combien ca coute. */
  const quantities = {};
  for (const k of services) {
    if (SERVICES[k].unit !== "each") continue;
    const max = SERVICES[k].maxQty || 10;
    const n = Math.floor(Number(o?.quantities?.[k]));
    quantities[k] = Number.isFinite(n) ? Math.min(Math.max(n, 1), max) : 1;
  }

  return {
    babyCot: o?.babyCot === true,
    pet: o?.pet === true,
    services,
    quantities,
    activities: Object.keys(ACTIVITIES).filter((k) => askedA.includes(k)),
  };
}

/** Chiffre les services retenus. Un service sans prix sort en `quoted: false`. */
function priceServices(keys, nights, numAdult, quantities) {
  const lines = [];
  let cents = 0;
  for (const k of keys) {
    const e = SERVICES[k];
    if (!e) continue;
    if (e.priceUsd == null) {
      lines.push({ key: k, label: pick(e.label, "fr"), quoted: false, cents: 0 });
      continue;
    }
    const qty = e.unit === "night" ? nights
      : e.unit === "person" ? numAdult
      : e.unit === "each" ? (quantities?.[k] || 1)
      : 1;
    const unitCents = Math.round(Number(e.priceUsd)) * 100;
    const line = unitCents * qty;
    cents += line;
    lines.push({ key: k, label: pick(e.label, "fr"), quoted: true, unit: e.unit, qty, unitCents, cents: line });
  }
  return { cents, lines };
}

/** Texte lisible pour l'exploitation, pose dans les commentaires de la reservation. */
function optionsComment(opt, guest, nights) {
  const bits = [];
  bits.push(guest.numAdult + " voyageur" + (guest.numAdult > 1 ? "s" : ""));
  if (opt.babyCot) bits.push("LIT BEBE demande");
  bits.push(opt.pet ? "VIENT AVEC UN ANIMAL" : "sans animal");

  const sv = priceServices(opt.services, nights, guest.numAdult, opt.quantities);
  const facture = sv.lines.filter((l) => l.quoted)
    .map((l) => l.label + (l.unit === "each" && l.qty > 1 ? " x" + l.qty : ""));
  const aChiffrer = sv.lines.filter((l) => !l.quoted).map((l) => l.label);
  if (facture.length) bits.push("SERVICES FACTURES : " + facture.join(", "));
  if (aChiffrer.length) bits.push("Services demandes, non tarifes : " + aChiffrer.join(", "));
  if (opt.activities.length) {
    bits.push("ACTIVITES — RAPPELER PAR WHATSAPP (paiement direct au prestataire) : " +
      opt.activities.map((k) => pick(ACTIVITIES[k].label, "fr")).join(", "));
  }
  return bits.join(" · ");
}

function cleanGuest(g) {
  const firstName = trim(g?.firstName, 60);
  const lastName = trim(g?.lastName, 60);
  const email = trim(g?.email, 120);
  const phone = trim(g?.phone, 30);
  const city = trim(g?.city, 60);
  const country = trim(g?.country, 60);
  if (!firstName) throw new HttpError(400, "guest_firstname_required");
  if (!lastName) throw new HttpError(400, "guest_lastname_required");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) throw new HttpError(400, "guest_email_invalid");
  if (phone.replace(/\D/g, "").length < 6) throw new HttpError(400, "guest_phone_invalid");
  /* Ville et pays sont exiges par le formulaire, pas par le serveur : un
     navigateur qui garde l'ancien checkout.js en cache ne doit pas se voir
     refuser sa reservation pour deux champs d'adresse. On les enregistre
     quand ils arrivent, on n'echoue pas quand ils manquent. */
  return { firstName, lastName, email, phone, city, country,
           numAdult: Math.min(Math.max(Number(g?.numAdult) || 2, 1), 12) };
}

/* ================================================================== devis == */

export async function quote(env, input, now) {
  const opt = cleanOptions(input?.options);
  const lang = ["en", "fr", "es"].includes(input?.lang) ? input.lang : "en";
  const numAdult = Math.min(Math.max(Number(input?.guest?.numAdult) || 2, 1), 12);

  const villaKey = String(input?.villa ?? "").toLowerCase().trim();
  const villa = VILLAS[villaKey];
  if (!villa) throw new HttpError(400, "unknown_villa", { villa: villaKey });

  const ci = parseISO(input.checkin);
  const co = parseISO(input.checkout);
  if (!ci) throw new HttpError(400, "bad_checkin");
  if (!co) throw new HttpError(400, "bad_checkout");

  const nights = Math.round((co - ci) / 86400000);
  if (nights < 1) throw new HttpError(400, "checkout_before_checkin");
  if (nights > MAX_NIGHTS) throw new HttpError(400, "stay_too_long", { max: MAX_NIGHTS });

  const today = todayCostaRica(now);
  if (input.checkin < today) throw new HttpError(400, "checkin_in_past", { today });

  const cal = await fetchNights(env, villa.roomId, input.checkin, toISO(addDays(co, -1)));

  const perNight = [];
  let gross = 0;
  for (let d = ci; d < co; d = addDays(d, 1)) {
    const k = toISO(d);
    const n = cal.get(k);
    if (!n) throw new HttpError(409, "night_unknown", { date: k });
    if (n.numAvail == null || n.numAvail < 1) throw new HttpError(409, "night_unavailable", { date: k });
    if (n.price == null || !(n.price > 0)) throw new HttpError(409, "night_unpriced", { date: k });
    gross += n.price;
    perNight.push({ date: k, price: n.price });
  }

  const arrival = cal.get(input.checkin);
  const minStay = arrival?.minStay ?? 1;          // le minStay de la DATE D'ARRIVEE
  if (nights < minStay) throw new HttpError(409, "min_stay_not_met", { minStay, nights });

  // Hebergement : reproduit le site au centime, Math.round(brut * 0.95).
  // Surtout pas un arrondi inferieur : le site fait Math.round.
  const accomUsd = Math.round(gross * DISCOUNT);
  const accommodationCents = accomUsd * 100;

  // Services : prix pris dans la table du serveur, jamais dans la requete.
  const ex = priceServices(opt.services, nights, numAdult, opt.quantities);
  const extrasCents = DISCOUNT_APPLIES_TO_EXTRAS ? Math.round(ex.cents * DISCOUNT) : ex.cents;

  const totalCents = accommodationCents + extrasCents;

  // La regle « sous 600 $, on encaisse tout » porte sur l'HEBERGEMENT.
  const payFull = accomUsd < PAY_FULL_BELOW_USD;
  const accomDepositCents = payFull ? accommodationCents : accommodationCents / 2;
  const depositCents = accomDepositCents + (EXTRAS_PAID_IN_FULL ? extrasCents : extrasCents / 2);

  return {
    villa: { key: villaKey, name: villa.name, propId: villa.propId, roomId: villa.roomId },
    checkin: input.checkin, checkout: input.checkout, nights, minStay,
    currency: CURRENCY,
    grossCents: gross * 100,
    discountPct: Math.round((1 - DISCOUNT) * 100),
    accommodationCents,
    extrasCents,
    serviceLines: ex.lines,
    /* Les deux catalogues, pour que la page affiche listes et prix sans jamais
       les porter elle-meme. */
    servicesCatalog: Object.keys(SERVICES).map((k) => ({
      key: k,
      label: pick(SERVICES[k].label, lang),
      note: SERVICES[k].note ? pick(SERVICES[k].note, lang) : null,
      unit: SERVICES[k].unit,
      maxQty: SERVICES[k].unit === "each" ? (SERVICES[k].maxQty || 10) : null,
      priceCents: SERVICES[k].priceUsd == null ? null : Math.round(Number(SERVICES[k].priceUsd)) * 100,
    })),
    activitiesCatalog: Object.keys(ACTIVITIES).map((k) => ({ key: k, label: pick(ACTIVITIES[k].label, lang) })),
    totalCents,
    depositCents,
    balanceCents: totalCents - depositCents,
    payFullUpfront: payFull,
    options: opt,
    perNight,
    quotedAt: new Date(now ?? Date.now()).toISOString(),
  };
}

/**
 * Mode test : reconnu a la cle ONVO (`onvo_test_...`). Dans ce mode la
 * reservation est bien ecrite dans Beds24 — on veut eprouver l'ecriture — mais
 * avec le statut `inquiry`, qui N'OCCUPE PAS les dates. Aucun risque de bloquer
 * un vrai calendrier avec un paiement de test.
 */
const isTestMode = (env) => String(env?.ONVO_SECRET_KEY || "").startsWith("onvo_test_");

/* =================================================================== onvo == */

async function onvo(env, path, init) {
  if (!env.ONVO_SECRET_KEY) throw new HttpError(500, "onvo_not_configured");
  const r = await fetch(ONVO + path, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: "Bearer " + env.ONVO_SECRET_KEY,
      ...(init?.headers || {}),
    },
  });
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* laisse null */ }
  if (!r.ok) throw new HttpError(502, "onvo_error", { status: r.status, detail: body?.message ?? null });
  return body;
}

/* =============================================================== intention == */

export async function createIntent(env, input, now) {
  const guest = cleanGuest(input?.guest);
  const q = await quote(env, { ...input, guest }, now);
  const opt = q.options;

  const label = q.villa.name + " " + q.checkin + " au " + q.checkout +
    " (" + q.nights + (q.nights > 1 ? " nuits" : " nuit") + ")" +
    (q.payFullUpfront ? " — paiement integral" : " — acompte 50 %");

  // Le sejour est inscrit DANS l'intention, chez ONVO. A la confirmation on le
  // relira la, jamais dans la requete du client : sinon on pourrait payer
  // l'acompte d'un sejour et faire confirmer un autre sejour de meme montant.
  const intent = await onvo(env, "/payment-intents", {
    method: "POST",
    body: JSON.stringify({
      amount: q.depositCents,
      currency: q.currency,
      description: label,
      metadata: {
        villa: q.villa.key,
        checkin: q.checkin,
        checkout: q.checkout,
        nights: String(q.nights),
        numAdult: String(guest.numAdult),
        totalCents: String(q.totalCents),
        depositCents: String(q.depositCents),
        babyCot: opt.babyCot ? "1" : "0",
        pet: opt.pet ? "1" : "0",
        services: opt.services.join(","),
        quantities: Object.entries(opt.quantities).map(([k, n]) => k + ":" + n).join(","),
        activities: opt.activities.join(","),
      },
    }),
  });

  const id = intent?.id ?? intent?.data?.id;
  if (!id) throw new HttpError(502, "onvo_no_intent_id");

  return {
    paymentIntentId: id,
    publishableKey: env.ONVO_PUBLISHABLE_KEY ?? null,
    amountCents: q.depositCents,
    currency: q.currency,
    description: label,
    quote: q,
  };
}

/* ============================================================= reservation == */

/**
 * La reservation deja creee pour ce paiement, s'il y en a une.
 *
 * On cherche par chambre + date d'arrivee, puis on filtre sur `custom1`, qui
 * porte l'identifiant ONVO.
 *
 * ⚠️ Ne PAS utiliser `apiReference` : Beds24 accepte le champ, repond
 * `success: true`, et ne le stocke pas (constate le 06-11-2026). Il est
 * reserve aux reservations venues des canaux.
 */
async function findExisting(env, roomId, arrival, intentId) {
  const body = await beds24(env,
    "/bookings?roomId=" + encodeURIComponent(roomId) +
    "&arrivalFrom=" + arrival + "&arrivalTo=" + arrival +
    "&includeInvoiceItems=false");
  for (const b of body.data || []) {
    if (String(b.custom1 || "").trim() === intentId) return b;
  }
  return null;
}

export async function confirm(env, input, now) {
  const intentId = trim(input?.paymentIntentId, 80);
  if (!intentId) throw new HttpError(400, "payment_intent_required");

  // 1. Ce qu'ONVO dit du paiement. Jamais ce que la page pretend.
  const got = await onvo(env, "/payment-intents/" + encodeURIComponent(intentId));
  const p = got?.data ?? got;
  if (!p) throw new HttpError(502, "onvo_intent_not_found");
  if (p.status !== "succeeded") throw new HttpError(409, "payment_not_succeeded", { status: p.status ?? null });
  if (String(p.currency).toUpperCase() !== CURRENCY) throw new HttpError(409, "payment_wrong_currency", { currency: p.currency });

  // 2. Le sejour vient de l'intention ONVO, PAS de la requete du client.
  const meta = p.metadata || {};
  if (!meta.villa || !meta.checkin || !meta.checkout) {
    throw new HttpError(409, "payment_without_stay", { paymentIntentId: intentId });
  }

  const guest = cleanGuest(input?.guest);
  const q = await quote(env, {
    villa: meta.villa, checkin: meta.checkin, checkout: meta.checkout,
    options: {
      babyCot: meta.babyCot === "1",
      pet: meta.pet === "1",
      services: String(meta.services || "").split(",").filter(Boolean),
      quantities: Object.fromEntries(String(meta.quantities || "").split(",").filter(Boolean)
        .map((pair) => { const [k, n] = pair.split(":"); return [k, Number(n)]; })),
      activities: String(meta.activities || "").split(",").filter(Boolean),
    },
    guest: { numAdult: Number(meta.numAdult) || guest.numAdult },
  }, now);

  // 3. Le montant encaisse doit etre celui du devis. Au centime.
  if (Number(p.amount) !== q.depositCents) {
    throw new HttpError(409, "payment_amount_mismatch", { paid: Number(p.amount), expected: q.depositCents });
  }

  // 4. Une reservation par paiement. On relit avant d'ecrire.
  const already = await findExisting(env, q.villa.roomId, q.checkin, intentId);
  if (already) return { bookingId: already.id, alreadyExisted: true, quote: q };

  const opt = q.options;
  const total = q.totalCents / 100;
  const paid = q.depositCents / 100;

  const test = isTestMode(env);

  const payload = [{
    roomId: q.villa.roomId,
    status: test ? "inquiry" : "confirmed",
    arrival: q.checkin,
    departure: q.checkout,
    numAdult: guest.numAdult,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    mobile: guest.phone,
    city: guest.city,
    country: guest.country,
    price: total,
    deposit: paid,
    custom1: intentId,           /* identifiant de paiement : sert a l'idempotence */
    allowAutoAction: test ? "disable" : "enable",  /* pas d'e-mail au client en mode test */
    comments: optionsComment(opt, guest, q.nights),
    notes: (test ? "[TEST \u2014 A SUPPRIMER] " : "") +
      "Reservation directe lesrochesretreat.com. Remise directe 5 %. " +
      (q.payFullUpfront ? "Paiement integral" : "Acompte 50 %") +
      " encaisse via ONVO (" + intentId + "). Solde a l'arrivee : " +
      (q.balanceCents / 100).toFixed(2) + " USD.",
    invoiceItems: [
      {
        type: "charge",
        description: "Sejour " + q.nights + (q.nights > 1 ? " nuits" : " nuit") + " (remise directe 5 %)",
        qty: 1,
        amount: q.accommodationCents / 100,
      },
      ...q.serviceLines.filter((l) => l.quoted).map((l) => ({
        type: "charge",
        description: l.label + (l.qty > 1 ? " x" + l.qty : ""),
        qty: 1,
        amount: l.cents / 100,
      })),
      {
        type: "payment",
        description: (q.payFullUpfront ? "Paiement integral" : "Acompte") + " — ONVO " + intentId,
        qty: 1,
        amount: paid,
      },
    ],
  }];

  const res = await beds24(env, "/bookings", { method: "POST", body: JSON.stringify(payload) });
  const first = Array.isArray(res) ? res[0] : res?.[0] ?? res;
  const createdId = first?.new?.id ?? first?.id ?? null;

  // 5. Un `success: true` ne prouve rien. On relit.
  const check = await findExisting(env, q.villa.roomId, q.checkin, intentId);
  if (!check) {
    throw new HttpError(500, "booking_write_unconfirmed", {
      paymentIntentId: intentId,
      paidCents: q.depositCents,
      beds24Said: JSON.stringify(res).slice(0, 300),
    });
  }

  return { bookingId: check.id ?? createdId, alreadyExisted: false, testMode: test, quote: q };
}

/* ============================================================== transport == */

const CORS = {
  "access-control-allow-origin": SITE,
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
  vary: "origin",
};

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS },
  });

async function health(env) {
  const out = {
    beds24: "?", onvo: "?",
    publishableKey: env.ONVO_PUBLISHABLE_KEY ? "present" : "absent",
    mode: isTestMode(env) ? "TEST \u2014 les reservations seront ecrites en 'inquiry', sans occuper les dates"
                          : "PRODUCTION \u2014 les reservations occupent les dates",
  };
  try { await beds24Token(env); out.beds24 = "ok"; } catch (e) { out.beds24 = e.code || "erreur"; }
  try { await onvo(env, "/payment-intents/account"); out.onvo = "ok"; } catch (e) { out.onvo = e.code || "erreur"; }
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    if (url.pathname === "/health" && request.method === "GET") return json(await health(env));

    const routes = { "/quote": quote, "/intent": createIntent, "/confirm": confirm };
    const handler = routes[url.pathname];
    if (!handler) return json({ ok: false, error: "not_found" }, 404);
    if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

    let input;
    try { input = await request.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }

    try {
      return json({ ok: true, ...(await handler(env, input)) });
    } catch (e) {
      if (e instanceof HttpError) return json({ ok: false, error: e.code, ...e.extra }, e.status);
      return json({ ok: false, error: "internal" }, 500);
    }
  },
};

export { HttpError, VILLAS, SERVICES, ACTIVITIES, todayCostaRica };
