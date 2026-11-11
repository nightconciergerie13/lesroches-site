/* ══ Calendrier des disponibilités, pages de recherche ══════════════════
   Les fiches villa ont déjà ce comportement (config.js, applyCal) mais pour
   UNE villa. Ici on raisonne sur les six.

   Pourquoi ce n'est pas qu'un grisage de jours : mesuré sur availability.json,
   86 % des jours ont au moins une villa libre, donc barrer les jours ne
   barrerait que 16 dates sur 120. En revanche 50 % des PLAGES échouent. Le
   calendrier doit donc raisonner sur la plage : une fois l'arrivée choisie,
   il barre les départs qui ne donnent aucun séjour réservable.

   Trois règles, arbitrées avec Ian le 11-11-2026 :
   1. plage couverte par une villa entière        → cliquable
   2. plage couverte mais séjour minimum non atteint → barrée, raison au survol
   3. plage couverte seulement en deux maisons    → cliquable, repère discret
      (la page de résultats propose alors le séjour en deux maisons)

   On ne touche pas à datepicker.js : on reclasse les cases après rendu, comme
   le fait déjà config.js sur les fiches villa. */
(function () {
  if (!document.querySelector('.lrp-calendar')) return;

  var AV = null, SETS = {}, MEMO = {};
  var TODAY = new Date().toISOString().slice(0, 10);

  function plus(x, n) { var d = new Date(x + 'T00:00:00'); d.setDate(d.getDate() + n); 
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function nuits(a, b) { return Math.round((Date.parse(b+'T00:00:00') - Date.parse(a+'T00:00:00')) / 864e5); }

  function nuitLibre(id, d) {
    var V = AV.villas[id]; if (!V) return false;
    var s = SETS[id] || (SETS[id] = new Set(V.available || []));
    return s.has(d) && (V.prices || {})[d] != null;
  }
  function jourLibrePartout(d) {
    for (var id in AV.villas) if (nuitLibre(id, d)) return true;
    return false;
  }
  /* couvre les nuits [a, b) — sans regarder le séjour minimum */
  function couvre(id, a, b) {
    var n = nuits(a, b); if (n < 1) return false;
    for (var i = 0; i < n; i++) if (!nuitLibre(id, plus(a, i))) return false;
    return true;
  }
  function minReq(id, a) { return ((AV.villas[id] || {}).minStay || {})[a] || 1; }

  /* état d'une date de départ pour une arrivée donnée */
  function etatDepart(a, b) {
    var cle = a + '|' + b; if (MEMO[cle]) return MEMO[cle];
    var n = nuits(a, b), r;
    if (n < 1) r = { ok: false };
    else {
      var couvrantes = [];
      for (var id in AV.villas) if (couvre(id, a, b)) couvrantes.push(id);
      if (couvrantes.length) {
        var mini = Infinity;
        for (var i = 0; i < couvrantes.length; i++) mini = Math.min(mini, minReq(couvrantes[i], a));
        r = (n >= mini) ? { ok: true } : { ok: false, min: mini, n: n };
      } else {
        /* deux maisons : segments de 2 nuits au minimum, maisons différentes */
        var split = false;
        for (var k = 2; k <= n - 2 && !split; k++) {
          var A = [], B = [], id2;
          for (id2 in AV.villas) { if (couvre(id2, a, plus(a, k)) && k >= minReq(id2, a)) A.push(id2); }
          if (!A.length) continue;
          var mi = plus(a, k);
          for (id2 in AV.villas) { if (couvre(id2, mi, b) && (n - k) >= minReq(id2, mi)) B.push(id2); }
          for (var x = 0; x < A.length && !split; x++)
            for (var y = 0; y < B.length && !split; y++) if (A[x] !== B[y]) split = true;
        }
        r = split ? { ok: true, split: true } : { ok: false };
      }
    }
    return (MEMO[cle] = r);
  }

  function texteMin(req, n) {
    if (typeof LR_MIN === 'function') return LR_MIN(req, n);
    return 'Minimum ' + req + ' nights';
  }

  function appliquer() {
    if (!AV) return;
    var cals = document.querySelectorAll('.lrp-calendar');
    for (var c = 0; c < cals.length; c++) {
      var cal = cals[c];
      var deb = cal.querySelector('.lrp-day.lrp-start[data-date]');
      var fin = cal.querySelector('.lrp-day.lrp-end[data-date]');
      var a = deb ? deb.getAttribute('data-date') : '';
      var choixDepart = !!a && !fin;
      var cases = cal.querySelectorAll('.lrp-day[data-date]');
      /* on ne repeint que si quelque chose a bougé */
      var sig = c + '|' + a + '|' + choixDepart + '|' + cases.length +
                '|' + (cases.length ? cases[0].getAttribute('data-date') : '');
      /* une signature PAR calendrier : l'accueil en a deux, un seul
         compteur partage les aurait fait se repeindre en boucle. */
      if (sig === cal.__sig && !cal.__sale) continue;
      cal.__sig = sig; cal.__sale = false;
      for (var i = 0; i < cases.length; i++) {
        var el = cases[i], d = el.getAttribute('data-date');
        if (!d) continue;
        el.classList.remove('lrp-split');
        el.removeAttribute('title');
        var ok, titre = '';
        if (!choixDepart) {
          ok = (d >= TODAY) && jourLibrePartout(d);
        } else if (d <= a) {
          ok = false;
        } else {
          var e = etatDepart(a, d);
          ok = e.ok;
          if (e.split) el.classList.add('lrp-split');
          if (!ok && e.min) titre = texteMin(e.min, e.n);
        }
        if (titre) el.setAttribute('title', titre);
        if (ok) el.classList.remove('lrp-disabled'); else el.classList.add('lrp-disabled');
      }
    }
  }

  var st = document.createElement('style');
  st.textContent =
    /* Le repère « deux maisons » : un point, pas une couleur de case. Le
       visiteur voit qu'il se passe quelque chose sans qu'on crie. */
    '.lrp-day.lrp-split{position:relative}' +
    '.lrp-day.lrp-split::after{content:"";position:absolute;left:50%;bottom:3px;' +
    'transform:translateX(-50%);width:4px;height:4px;border-radius:50%;' +
    'background:var(--ter,#c17f59)}';
  document.head.appendChild(st);

  fetch('/availability.json?cb=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (j) {
      if (!j || !j.villas) throw 0;
      AV = j; appliquer();
      /* le calendrier se redessine à chaque survol et à chaque clic */
      new MutationObserver(function () {
        var cals = document.querySelectorAll('.lrp-calendar');
        for (var i = 0; i < cals.length; i++) cals[i].__sale = true;
        appliquer();
      }).observe(document.body, { childList: true, subtree: true });
      setInterval(function () {
        var cals = document.querySelectorAll('.lrp-calendar');
        for (var i = 0; i < cals.length; i++) cals[i].__sale = true;
        appliquer();
      }, 900);
    })
    /* données illisibles : on ne barre rien plutôt que de barrer à tort */
    .catch(function () {});
})();
