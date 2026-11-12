/* ═══════════════════════════════════════════════════════════════
   maj-prix-vitrine.mjs  |  Les Roches Retreat

   Reecrit le prix d'appel fige dans le HTML a partir de availability.json,
   juste apres la synchronisation Beds24. Objectif : que le chiffre lu dans
   la source d'une page ne puisse plus contredire celui qu'affiche le
   JavaScript, ni celui que facture le moteur de reservation.

   Pourquoi c'est necessaire : les moteurs de reponse (ChatGPT, Perplexity)
   et les apercus de partage lisent le HTML sans executer le JavaScript.
   Le 12-11-2026, ils annoncaient 155 a 550 $ la nuit alors que le site
   affichait 180 $ a l'ecran. Un audit a mis la main dessus ; ce script
   fait en sorte que ca ne puisse pas revenir.

   Regle appliquee, identique a celle de js/config.js :
     prix d'appel d'une villa = max(plancher, round(min(prix Beds24) x 0,95))
   Le plancher est lu dans js/config.js : une seule source de verite.

   Garde-fou : si le calcul sort de la fourchette [100, 2000], le script
   n'ecrit rien et sort en erreur. Mieux vaut un prix perime qu'un prix absurde.
   ═══════════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";

const RACINE = process.cwd();
const REMISE = 0.95;          // tarif direct = plateformes - 5%
const MIN_SAIN = 100, MAX_SAIN = 2000;

const VILLAS = {
  "326247": "opale",
  "326248": "onyx",
  "326251": "topaze",
  "326257": "jade",
  "326258": "ambre",
  "326259": "agate"
};

/* ── Plancher : lu dans js/config.js ─────────────────────────── */
function plancher() {
  const src = fs.readFileSync(path.join(RACINE, "js", "config.js"), "utf8");
  const m = src.match(/var LR_PLANCHER_VITRINE\s*=\s*(\d+)/);
  if (!m) throw new Error("LR_PLANCHER_VITRINE introuvable dans js/config.js");
  return parseInt(m[1], 10);
}

/* ── Prix d'appel par villa ──────────────────────────────────── */
function prixDAppel() {
  const av = JSON.parse(fs.readFileSync(path.join(RACINE, "availability.json"), "utf8"));
  const sol = plancher();
  const prix = {};
  for (const [id, slug] of Object.entries(VILLAS)) {
    const v = av.villas && av.villas[id];
    if (!v || !v.prices) continue;
    const nuits = Object.values(v.prices).filter(p => typeof p === "number" && p > 0);
    if (!nuits.length) continue;
    const p = Math.max(sol, Math.round(Math.min(...nuits) * REMISE));
    if (p < MIN_SAIN || p > MAX_SAIN) throw new Error(`prix aberrant pour ${slug} : ${p}`);
    prix[slug] = p;
  }
  if (Object.keys(prix).length !== 6) throw new Error(`${Object.keys(prix).length} villas cotees sur 6 : on n ecrit rien`);
  return prix;
}

/* ── Parcours des pages ──────────────────────────────────────── */
function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if ([".git", ".github", "node_modules", "images", "fonts", "journal", "admin"].includes(e.name)) continue;
      pages(p, acc);
    } else if (e.name.endsWith(".html")) {
      acc.push(p);
    }
  }
  return acc;
}

const prix = prixDAppel();
const global = Math.min(...Object.values(prix));
let touches = 0, remplacements = 0;

for (const fichier of pages(RACINE)) {
  const avant = fs.readFileSync(fichier, "utf8");
  let s = avant;

  /* 1. cartes de villa : <span class="vc-price" id="price-jade">$450</span> */
  s = s.replace(/(<span class="vc-price" id="price-([a-z]+)">\$)\d+(<\/span>)/g,
    (tout, a, slug, c) => (prix[slug] ? (remplacements++, a + prix[slug] + c) : tout));

  /* 2. fiche de villa : <div class="sb-price-val">$450 <small> */
  const slugFiche = (path.basename(fichier).match(/^villa-([a-z]+)\.html$/) || [])[1];
  if (slugFiche && prix[slugFiche]) {
    s = s.replace(/(<div class="sb-price-val">\$)\d+( <small>)/g,
      (tout, a, b) => (remplacements++, a + prix[slugFiche] + b));
  }

  /* 3. barre de reservation mobile : Des <strong>$350</strong> ou <strong>350 $</strong> */
  s = s.replace(/(class="mob-book-from">[^<]*<strong>\$?)\d+( ?\$?<\/strong>)/g,
    (tout, a, b) => (remplacements++, a + global + b));

  /* 4. meta description et og:description : le seul nombre colle a un $ */
  s = s.replace(/(<meta (?:name="description"|property="og:description") content=")([^"]*)(")/g,
    (tout, a, texte, c) => {
      const neuf = texte
        .replace(/\$\s?\d+/g, "$" + global)
        .replace(/(?<!\$)\b\d+\s\$/g, global + " $");
      if (neuf !== texte) remplacements++;
      return a + neuf + c;
    });

  if (s !== avant) { fs.writeFileSync(fichier, s); touches++; }
}

console.log(`prix d appel : ${JSON.stringify(prix)} | vitrine globale : $${global}`);
console.log(`pages reecrites : ${touches} | emplacements mis a jour : ${remplacements}`);
