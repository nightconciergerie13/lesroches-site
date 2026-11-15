/* ═══════════════════════════════════════════════════════════════
   build-footer.mjs  |  Les Roches Retreat

   SOURCE UNIQUE DU PIED DE PAGE.

   Avant le 16-11-2026, le site avait CINQ pieds de page differents :
   des classes distinctes, des feuilles de style distinctes, des
   tailles et des opacites distinctes, et surtout des liens qui ne
   concordaient pas. Releve a ce moment-la :
     - 16 structures HTML differentes pour 105 pages
     - 9 pages avec des liens Instagram et Email pointant vers "#"
     - 5 libelles pour une meme page (Notre Histoire, Notre histoire,
       A Propos, A propos, Notre Recit)
     - "Reserver" menant tantot a contact.html, tantot a
       booking-conditions.html

   Ce fichier est desormais le seul endroit ou le pied de page existe.
   Pour le modifier : on edite ici, puis on execute

       node build-footer.mjs

   ce qui reecrit le bloc <footer> des 105 pages. Ne jamais modifier
   un pied de page directement dans une page : la prochaine execution
   l'ecraserait.

   GitHub Pages ne sait pas faire d'inclusion cote serveur, et une
   injection par JavaScript priverait Google des liens internes du
   pied de page. D'ou ce generateur : le HTML reste statique.
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ANNEE = 2026;
const EMAIL = 'hello@lesrochesretreat.com';
const WHATSAPP = '33667749024';
const INSTAGRAM = 'https://www.instagram.com/lesrochessantateresa/';
const SOCIETE = 'NIGHT CONCIERGERIE SRL';
const CEDULA = '3-102-870510';
const SIEGE = 'Rohrmoser, Pavas, San José, Costa Rica';

/* Les pages internes en noindex ne sont volontairement pas liees ici :
   partenaires.html porte "noindex, nofollow, noarchive", la lier depuis
   les 105 pages contredirait sa propre directive. */

const T = {
  fr: {
    tag: 'Six villas privées au cœur de Santa Teresa, Costa Rica.',
    explorer: 'Explorer', reserver: 'Réserver', contact: 'Contact',
    liens: [['villas.html','Villas'], ['experiences.html','Expériences'],
            ['santa-teresa.html','Santa Teresa'], ['journal.html','Journal'],
            ['about.html','Notre histoire']],
    resa: [['contact.html','Réserver en direct'],
           ['booking-conditions.html','Conditions de réservation'],
           ['faq.html','Questions fréquentes'],
           ['privacy-policy.html','Politique de confidentialité']],
    adresse: 'Calle Vista De Olas, Malpaís<br>Santa Teresa, Costa Rica',
    droits: 'Tous droits réservés',
    siege: 'Siège social'
  },
  en: {
    tag: 'Six private villas in the heart of Santa Teresa, Costa Rica.',
    explorer: 'Explore', reserver: 'Book', contact: 'Contact',
    liens: [['villas.html','Villas'], ['experiences.html','Experiences'],
            ['santa-teresa.html','Santa Teresa'], ['journal.html','Journal'],
            ['about.html','Our story']],
    resa: [['contact.html','Book direct'],
           ['booking-conditions.html','Booking conditions'],
           ['faq.html','Frequently asked questions'],
           ['privacy-policy.html','Privacy policy']],
    adresse: 'Calle Vista De Olas, Malpaís<br>Santa Teresa, Costa Rica',
    droits: 'All rights reserved',
    siege: 'Registered office'
  },
  es: {
    tag: 'Seis villas privadas en el corazón de Santa Teresa, Costa Rica.',
    explorer: 'Explorar', reserver: 'Reservar', contact: 'Contacto',
    liens: [['villas.html','Villas'], ['experiences.html','Experiencias'],
            ['santa-teresa.html','Santa Teresa'], ['journal.html','Journal'],
            ['about.html','Nuestra historia']],
    resa: [['contact.html','Reservar directo'],
           ['booking-conditions.html','Condiciones de reserva'],
           ['faq.html','Preguntas frecuentes'],
           ['privacy-policy.html','Política de privacidad']],
    adresse: 'Calle Vista De Olas, Malpaís<br>Santa Teresa, Costa Rica',
    droits: 'Todos los derechos reservados',
    siege: 'Domicilio social'
  }
};

/* Styles portes par le bloc lui-meme : le pied de page ne depend donc
   d'aucune feuille de la page hote. Le prefixe lrf- est neuf, il
   n'entre en collision avec aucune regle existante. */
const CSS = `<style>
/* Les pages hotes posent des regles sur la balise footer elle-meme :
   l'une d'elles met display:grid, ce qui ecrasait ce bloc a 558 px de
   large. On redeclare donc toute la mise en page, sans dependre de rien. */
.lrf{display:block;width:auto;max-width:none;margin:0;gap:0;grid-template-columns:none;text-align:left;background:#2e2a26;color:#faf7f2;padding:4rem 0 2rem;font-family:'Outfit',system-ui,-apple-system,sans-serif}
.lrf *{box-sizing:border-box}
.lrf-in{display:block;width:100%;max-width:1180px;margin:0 auto;padding:0 2rem;float:none}
.lrf-top{display:grid;grid-template-columns:1.5fr 1fr 1.2fr 1.1fr;gap:2.5rem}
.lrf-logo{font-family:'Gilda Display',Georgia,serif;font-size:1rem;letter-spacing:.16em;text-transform:uppercase;color:#faf7f2;margin-bottom:.9rem}
.lrf-tag{font-size:.72rem;line-height:1.7;color:rgba(255,255,255,.5);max-width:260px;margin:0}
.lrf-ct{font-size:.6rem;letter-spacing:.3em;text-transform:uppercase;color:#b8734a;margin-bottom:.9rem}
.lrf-link{display:block;font-size:.75rem;line-height:1.5;color:rgba(255,255,255,.62);margin-bottom:.5rem;text-decoration:none;transition:color .2s}
.lrf-link:hover{color:#faf7f2}
.lrf-adr{font-size:.72rem;line-height:1.7;color:rgba(255,255,255,.5);margin:.9rem 0 0}
.lrf-bot{margin-top:3rem;padding-top:1.6rem;border-top:1px solid rgba(255,255,255,.08)}
.lrf-copy{font-size:.62rem;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.5)}
.lrf-legal{display:block;margin-top:.6rem;font-size:10px;line-height:1.6;letter-spacing:.02em;color:rgba(250,247,242,.55)}
@media(max-width:860px){.lrf-top{grid-template-columns:1fr 1fr;gap:2rem}.lrf-in{padding:0 1.5rem}}
@media(max-width:560px){.lrf-top{grid-template-columns:1fr}.lrf{padding:3rem 0 1.5rem}}
</style>`;

function pied(lg, p, r) {
  const t = T[lg];
  const col = (titre, liens, prefixe) =>
    `<div><div class="lrf-ct">${titre}</div>` +
    liens.map(([u, n]) => `<a class="lrf-link" href="${prefixe}${u}">${n}</a>`).join('') +
    `</div>`;
  return `${CSS}
<footer class="lrf">
  <div class="lrf-in">
    <div class="lrf-top">
      <div>
        <div class="lrf-logo">Les Roches</div>
        <p class="lrf-tag">${t.tag}</p>
      </div>
      ${col(t.explorer, t.liens, p)}
      ${col(t.reserver, t.resa, p)}
      <div>
        <div class="lrf-ct">${t.contact}</div>
        <a class="lrf-link" href="mailto:${EMAIL}">${EMAIL}</a>
        <a class="lrf-link" href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="lrf-link" href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a>
        <p class="lrf-adr">${t.adresse}</p>
      </div>
    </div>
    <div class="lrf-bot">
      <div class="lrf-copy">&copy; ${ANNEE} Les Roches &middot; Santa Teresa, Costa Rica &middot; ${t.droits}</div>
      <span class="lrf-legal">${SOCIETE} &middot; Cédula jurídica ${CEDULA} &middot; ${t.siege} : ${SIEGE}</span>
    </div>
  </div>
</footer>`;
}

function contexte(chemin) {
  if (chemin.startsWith('journal/fr/')) return ['fr', '../../fr/', '../../'];
  if (chemin.startsWith('journal/es/')) return ['es', '../../es/', '../../'];
  if (chemin.startsWith('journal/'))    return ['en', '../../', '../../'];
  if (chemin.startsWith('fr/'))         return ['fr', '', '../'];
  if (chemin.startsWith('es/'))         return ['es', '', '../'];
  return ['en', '', ''];
}

function pages(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (e === '.git' || e === 'admin' || e === 'node_modules') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) pages(p, acc);
    else if (e.endsWith('.html')) acc.push(p.replace(/^\.\//, ''));
  }
  return acc;
}

const RX = /(?:<style>(?:(?!<\/style>)[\s\S])*?\.lrf\{[\s\S]*?<\/style>\s*)?<footer[\s\S]*?<\/footer>/;

let faits = 0, ignores = [];
for (const f of pages('.')) {
  const h = readFileSync(f, 'utf8');
  if (!/<footer[^>]*>/.test(h)) { ignores.push(f); continue; }
  const [lg, p, r] = contexte(f);
  const neuf = h.replace(RX, pied(lg, p, r));
  if (neuf !== h) { writeFileSync(f, neuf); faits++; }
}
console.log(`pieds de page regeneres : ${faits}`);
if (ignores.length) console.log(`sans <footer>, ignorees : ${ignores.join(', ')}`);
