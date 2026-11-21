/* Les Roches — l'avantage horaire de la réservation en direct.
 *
 * Deux heures de plus, d'un côté ou de l'autre, quand le calendrier le permet :
 *   - arrivée dès 13h au lieu de 15h, si personne ne dort dans la villa la veille ;
 *   - départ jusqu'à 13h au lieu de 11h, si personne n'arrive le jour du départ.
 *
 * Le site sait déjà tout cela : availability.json liste les nuits vendables de
 * chaque villa. Une nuit vendable est une nuit où personne ne dort, donc une
 * nuit qui libère le ménage.
 *
 * On écrit « possible » et jamais « garanti » : la nuit voisine est libre
 * aujourd'hui, elle peut être vendue demain. C'est aussi pour cela que cette
 * ligne ne remplace pas la confirmation faite avant l'arrivée.
 *
 * Fichier séparé à dessein : le moteur de prix (config.js) encaisse de vraies
 * cartes, on ne le touche pas pour un argument commercial.
 */
(function () {
  var mm = document.documentElement.innerHTML.match(/booking2\.php\?propid=(\d+)/);
  if (!mm) return;
  var PID = mm[1];

  var L = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  if (L !== "fr" && L !== "es") L = "en";

  var T = {
    en: {
      tot:  "Booking direct: check-in from 1 pm, instead of 3 pm.",
      tard: "Booking direct: check-out until 1 pm, instead of 11 am.",
      deux: "Booking direct, your choice: check-in from 1 pm or check-out until 1 pm."
    },
    fr: {
      tot:  "En direct : arrivée possible dès 13h, au lieu de 15h.",
      tard: "En direct : départ possible jusqu'à 13h, au lieu de 11h.",
      deux: "En direct, au choix : arrivée dès 13h ou départ jusqu'à 13h."
    },
    es: {
      tot:  "En directo: entrada desde las 13h, en vez de las 15h.",
      tard: "En directo: salida hasta las 13h, en vez de las 11h.",
      deux: "En directo, a elegir: entrada desde las 13h o salida hasta las 13h."
    }
  }[L];

  var AV = null, SET = null;

  function style() {
    var s = document.createElement("style");
    s.textContent =
      ".sb-horaire{margin-top:.7rem;padding-top:.7rem;border-top:1px solid var(--c2,#e2d9cc);" +
      "font-family:'Outfit',sans-serif;font-size:.72rem;font-weight:300;line-height:1.45;" +
      "letter-spacing:.02em;color:var(--ter,#b8734a)}" +
      ".sb-horaire:empty{display:none;margin:0;padding:0;border:0}";
    document.head.appendChild(s);
  }

  function poser() {
    var tot = document.getElementById("sb-total");
    if (!tot || document.getElementById("sb-horaire")) return;
    var d = document.createElement("div");
    d.className = "sb-horaire";
    d.id = "sb-horaire";
    tot.appendChild(d);
  }

  /* "2026-12-14" + n jours, sans fuseau : on reste sur des dates nues. */
  function decale(iso, n) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return "";
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function calcule() {
    var el = document.getElementById("sb-horaire");
    if (!el) return;
    var ci = (document.getElementById("sb-checkin") || {}).value || "";
    var co = (document.getElementById("sb-checkout") || {}).value || "";
    var txt = "";
    if (SET && ci && co) {
      var veille = decale(ci, -1);
      var tot  = veille && SET[veille] === 1;   /* personne ne dort la veille */
      var tard = SET[co] === 1;                 /* personne n'arrive le jour du depart */
      txt = tot && tard ? T.deux : tot ? T.tot : tard ? T.tard : "";
    }
    if (el.textContent !== txt) el.textContent = txt;
  }

  function demarre() {
    style();
    poser();
    fetch("/availability.json?cb=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        AV = j;
        var V = AV && AV.villas && AV.villas[PID];
        if (!V || !V.available) return;
        SET = {};
        for (var i = 0; i < V.available.length; i++) SET[V.available[i]] = 1;
        calcule();
        setInterval(calcule, 800);
      })
      .catch(function () {});
  }

  if (document.readyState !== "loading") demarre();
  else document.addEventListener("DOMContentLoaded", demarre);
})();
