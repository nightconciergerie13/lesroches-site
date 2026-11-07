/**
 * Les Roches Retreat — bloc de paiement direct, en un seul fichier.
 *
 * A INSTALLER UNE SEULE FOIS, puis une ligne par fiche villa :
 *     <script src="/js/checkout.js" defer></script>
 *
 * Le fichier s'injecte lui-meme : styles, balisage, chargement du SDK ONVO.
 * Toute evolution se fait ICI, pas dans les six fiches villa.
 *
 * La villa est devinee depuis le propid deja present dans la page.
 * Aucun prix n'est porte par ce fichier : tout vient du Worker.
 */
(function () {
  /* ---- LA SEULE LIGNE A ADAPTER ---------------------------------------- */
  var WORKER = "https://les-roches-paiement.nightconciergerie.workers.dev";
  /* --------------------------------------------------------------------- */

  var SDK = "https://sdk.onvopay.com/sdk.js";

  var CSS = `#lr-pay{position:fixed;inset:0;z-index:99999;background:rgba(20,18,16,.72);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}
  #lr-pay[hidden]{display:none}
  #lr-pay-card{background:#fffdf9;color:#1d1b19;max-width:460px;width:100%;border-radius:14px;padding:26px 24px;position:relative;font:400 16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
  #lr-pay-card h2{font:500 21px/1.3 inherit;margin:0 0 6px}
  #lr-pay-card h3{font:500 19px/1.3 inherit;margin:0 0 8px}
  #lr-pay-recap{margin:0 0 18px;color:#5f5b55;font-size:14px}
  #lr-pay-close{position:absolute;top:10px;right:14px;border:0;background:none;font-size:28px;line-height:1;cursor:pointer;color:#8a857d}
  #lr-pay label{display:block;margin:0 0 12px;font-size:13px;color:#5f5b55}
  #lr-pay input{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:10px 12px;border:1px solid #d9d4cb;border-radius:8px;font-size:16px;background:#fff;color:#1d1b19}
  #lr-pay .lr-row{display:flex;gap:12px}
  #lr-pay .lr-row label{flex:1;min-width:0}
  #lr-pay button#lr-go1,#lr-pay button#lr-go2{width:100%;padding:14px;border:0;border-radius:8px;background:#1d1b19;color:#fffdf9;font-size:16px;cursor:pointer;margin-top:4px}
  #lr-pay button[disabled]{opacity:.5;cursor:default}
  #lr-pay .lr-err{color:#a32d2d;font-size:14px;margin:0 0 12px}
  #lr-pay .lr-trust{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:#8a857d;margin:12px 0 0;text-align:center;text-decoration:none}
  #lr-pay .lr-lock{color:#1d9e75;font-size:9px}
  #lr-pay .lr-wa{color:#5f5b55;margin-top:7px;border-top:1px solid #efece5;padding-top:10px}
  #lr-pay .lr-wa:hover{color:#1d1b19}
  #lr-onvo{min-height:180px;margin-bottom:14px}
  #lr-opts{border:1px solid #e4e0d8;border-radius:8px;padding:12px 14px 6px;margin:0 0 14px}
  #lr-opts legend{font-size:13px;color:#5f5b55;padding:0 6px}
  #lr-pay .lr-cb{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-size:14px;color:#1d1b19;cursor:pointer}
  #lr-pay .lr-cb input{width:auto;margin:0;flex:0 0 auto}
  #lr-pay .lr-cb small{color:#8a857d}
  #lr-pay .lr-sub{font-size:12px;color:#8a857d;margin:10px 0 6px}
  #lr-services,#lr-activities{display:flex;flex-wrap:wrap;gap:6px 14px}
  #lr-activities label{flex:0 0 calc(50% - 7px)}
  #lr-services label{flex:0 0 100%;align-items:flex-start}
  #lr-services .lr-sv-row input{margin-top:3px}
  #lr-pay .lr-hint{display:block;font-size:11px;font-style:normal;color:#8a857d;line-height:1.4;margin-top:1px}
  #lr-pay .lr-qty{width:52px;flex:0 0 auto;margin:0 0 0 auto;padding:4px 6px;font-size:14px;text-align:center}
  #lr-pay .lr-qty:disabled{opacity:.35}
  #lr-pay .lr-note{font-size:12px;color:#8a857d;margin:8px 0 2px;line-height:1.45}
  #lr-sum{margin:0 0 14px;font-size:14px}
  #lr-sum div{display:flex;justify-content:space-between;padding:3px 0}
  #lr-sum div.lr-strong{font-weight:500;border-top:1px solid #e4e0d8;margin-top:6px;padding-top:7px}
  #lr-sum dt{margin:0;color:#5f5b55}
  #lr-sum dd{margin:0;color:#1d1b19;white-space:nowrap;font-variant-numeric:tabular-nums}
  #lr-pay-policy{font-size:13px;color:#5f5b55;background:#f4f1ea;border-radius:8px;padding:10px 12px;margin:0 0 14px}`;

  var HTML = `<div id="lr-pay" hidden role="dialog" aria-modal="true" aria-labelledby="lr-pay-title">
  <div id="lr-pay-card">
    <button type="button" id="lr-pay-close" aria-label="Close">&times;</button>

    <h2 id="lr-pay-title"></h2>
    <p id="lr-pay-recap"></p>

    <div id="lr-pay-step1">
      <div class="lr-row">
        <label><span data-t="firstName"></span><input id="lr-fn" autocomplete="given-name" required></label>
        <label><span data-t="lastName"></span><input id="lr-ln" autocomplete="family-name" required></label>
      </div>
      <label><span data-t="email"></span><input id="lr-em" type="email" autocomplete="email" required></label>
      <div class="lr-row">
        <label><span data-t="phone"></span><input id="lr-ph" type="tel" autocomplete="tel" required></label>
        <label><span data-t="guests"></span><input id="lr-ad" type="number" min="1" max="12" value="2"></label>
      </div>

      <fieldset id="lr-opts">
        <legend data-t="optsTitle"></legend>
        <label class="lr-cb"><input type="checkbox" id="lr-cot"><span data-t="babyCot"></span></label>
        <label class="lr-cb"><input type="checkbox" id="lr-pet"><span data-t="pet"></span></label>

        <p class="lr-sub" data-t="servicesTitle"></p>
        <div id="lr-services"></div>

        <p class="lr-sub" data-t="activitiesTitle"></p>
        <div id="lr-activities"></div>
        <p class="lr-note" data-t="activitiesNote"></p>
      </fieldset>

      <dl id="lr-sum"></dl>
      <p id="lr-pay-policy"></p>
      <p id="lr-err1" class="lr-err" hidden></p>
      <button type="button" id="lr-go1"></button>
    </div>

    <div id="lr-pay-step2" hidden>
      <div id="lr-onvo"></div>
      <p id="lr-err2" class="lr-err" hidden></p>
      <button type="button" id="lr-go2"></button>
      <p class="lr-trust"><span class="lr-lock" aria-hidden="true">&#9679;</span><span data-t="secure"></span></p>
      <a id="lr-wa" class="lr-trust lr-wa" href="#" target="_blank" rel="noopener"><span data-t="whatsapp"></span></a>
    </div>

    <div id="lr-pay-done" hidden>
      <h3 data-t="doneTitle"></h3>
      <p id="lr-done-txt"></p>
    </div>
  </div>
</div>`;

  /**
   * Corrige les textes de la page qui sont devenus faux avec le paiement en
   * ligne. Ils sont ici, et pas dans les 18 fiches villa, pour une raison :
   * le texte et le comportement changent par le meme code, donc ils ne peuvent
   * pas diverger. Chaque entree : [texte a trouver, texte de remplacement].
   */
  /**
   * Textes de la page devenus faux le jour ou le site encaisse par carte.
   *
   * ⚠️ Deux mecanismes, parce que deux realites de balisage (relevees le
   * 07-11-2026 sur les pages EN LIGNE, jamais ecrites de memoire) :
   *
   *   BLOCS — la phrase est coupee en plusieurs noeuds par un <strong> ou un
   *           <br>. On remplace alors le contenu de l'element entier.
   *   MOTS  — la phrase tient dans un seul noeud de texte. On remplace le
   *           noeud, ce qui preserve les icones autour (le bouton porte un SVG).
   *
   * Correctif provisoire : la vraie correction est dans le HTML des 18 fiches.
   */
  var BLOCS = {
    en: [
      ["You pay nothing today. Sending the request commits you to nothing, we confirm your dates first.",
       "<strong>50% deposit today by card.</strong> The balance is paid on arrival \u2014 your dates are confirmed instantly."],
      ["Payment: 50% deposit by bank transfer on confirmation. The balance (50%) is payable on arrival by transfer, card, or cash.",
       "<strong>Payment:</strong> 50% deposit by card when you book. The balance (50%) is payable on arrival by card, cash, or payment link."],
      ["Your request will be sent via WhatsApp. You will receive a confirmation by email within 24h, along with the bank details for the transfer.",
       "Your request will be sent via WhatsApp. You receive your confirmation by email straight away."]
    ],
    fr: [
      ["Vous ne payez rien aujourd'hui. Envoyer la demande ne vous engage \u00e0 rien, on confirme vos dates d'abord.",
       "<strong>Acompte de 50 % aujourd'hui par carte.</strong> Le solde est r\u00e9gl\u00e9 \u00e0 l'arriv\u00e9e \u2014 vos dates sont confirm\u00e9es imm\u00e9diatement."],
      ["Paiement : 50 % d'acompte par virement bancaire \u00e0 la confirmation. Le solde (50 %) est r\u00e9gl\u00e9 \u00e0 l'arriv\u00e9e, par virement, carte ou esp\u00e8ces.",
       "<strong>Paiement :</strong> 50 % d'acompte par carte au moment de la r\u00e9servation. Le solde (50 %) est r\u00e9gl\u00e9 \u00e0 l'arriv\u00e9e, par carte, esp\u00e8ces ou lien de paiement."],
      ["Votre demande sera transmise par WhatsApp. Vous recevrez une confirmation par email sous 24h, avec les coordonn\u00e9es bancaires pour le virement.",
       "Votre demande sera transmise par WhatsApp. Vous recevez votre confirmation par email imm\u00e9diatement."]
    ],
    es: [
      ["No pagas nada hoy. Enviar la solicitud no te compromete a nada, primero confirmamos tus fechas.",
       "<strong>Dep\u00f3sito del 50 % hoy con tarjeta.</strong> El saldo se abona a la llegada \u2014 tus fechas se confirman al instante."],
      ["Pago: dep\u00f3sito del 50 % por transferencia bancaria al confirmar. El saldo (50 %) se abona a la llegada por transferencia, tarjeta o efectivo.",
       "<strong>Pago:</strong> dep\u00f3sito del 50 % con tarjeta al reservar. El saldo (50 %) se abona a la llegada con tarjeta, en efectivo o por enlace de pago."],
      ["Tu solicitud se enviar\u00e1 por WhatsApp. Recibir\u00e1s una confirmaci\u00f3n por correo en 24 h con los datos bancarios para la transferencia.",
       "Tu solicitud se enviar\u00e1 por WhatsApp. Recibes tu confirmaci\u00f3n por correo de inmediato."]
    ]
  };

  var MOTS = {
    en: [
      ["Request this booking", "Book now"],
      ["Payment by bank transfer \u00b7 Confirmation within 24h",
       "Secure card payment \u00b7 Instant confirmation"]
    ],
    fr: [
      ["Demander cette r\u00e9servation", "R\u00e9server maintenant"],
      ["Paiement par virement bancaire \u00b7 Confirmation sous 24h",
       "Paiement par carte s\u00e9curis\u00e9 \u00b7 Confirmation imm\u00e9diate"]
    ],
    es: [
      ["Solicitar esta reserva", "Reservar ahora"],
      ["Pago por transferencia \u00b7 Confirmaci\u00f3n en 24 h",
       "Pago con tarjeta seguro \u00b7 Confirmaci\u00f3n inmediata"]
    ]
  };

  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  /** Rien de notre propre modale ne doit etre touche. */
  function aNous(el) { return !!(el && el.closest && el.closest("#lr-pay")); }

  /**
   * Remet les textes de la page en accord avec ce que le site fait vraiment.
   * Les BLOCS passent en premier : ils contiennent des phrases que les MOTS
   * modifieraient partiellement, ce qui les rendrait introuvables.
   */
  function fixTexts() {
    /* Langue calculee ici meme : fixTexts tourne AVANT start(), ou vit LANG.
       Dependre de LANG depuis ce point a casse le tunnel le 06-11-2026. */
    var code = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
    var blocs = BLOCS[code] || BLOCS.en || [];
    var mots  = MOTS[code]  || MOTS.en  || [];
    var rate  = [];

    var elements = Array.prototype.slice.call(document.querySelectorAll("body *"));

    blocs.forEach(function (pair) {
      var vise = norm(pair[0]);
      var trouves = elements.filter(function (el) {
        return !aNous(el) && norm(el.textContent) === vise;
      });
      /* On ne garde que les plus profonds : remplacer un parent effacerait
         ses voisins. */
      var feuilles = trouves.filter(function (el) {
        return !trouves.some(function (o) { return o !== el && el.contains(o); });
      });
      if (!feuilles.length) { rate.push(pair[0].slice(0, 50)); return; }
      feuilles.forEach(function (el) { el.innerHTML = pair[1]; });
    });

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var noeuds = [], n;
    while ((n = walker.nextNode())) noeuds.push(n);

    mots.forEach(function (pair) {
      var vise = norm(pair[0]), touche = false;
      noeuds.forEach(function (node) {
        if (aNous(node.parentNode)) return;
        var v = norm(node.nodeValue);
        if (!v || v.indexOf(vise) < 0) return;
        node.nodeValue = v.split(vise).join(pair[1]);
        touche = true;
      });
      if (!touche) rate.push(pair[0].slice(0, 50));
    });

    /* Temoin de verification : une correction qui ne s'applique jamais est une
       chaine fausse, pas un texte absent. On veut pouvoir le constater. */
    window.LR_FIXES = { langue: code, prevus: blocs.length + mots.length,
                        manquants: rate };
  }

  /* Injection : styles dans le head, balisage en fin de body. */
  function inject() {
    if (document.getElementById("lr-pay")) return;          /* deja la */
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    var box = document.createElement("div");
    box.innerHTML = HTML;
    while (box.firstChild) document.body.appendChild(box.firstChild);
  }

  /* Charge le SDK ONVO une seule fois, puis rend la main. */
  function withSdk(then) {
    if (window.onvo) return then();
    var s = document.createElement("script");
    s.src = SDK;
    s.onload = then;
    s.onerror = function () { then(); };                    /* on laisse le devis marcher */
    document.head.appendChild(s);
  }

  function boot() {
    inject();
    /* Les textes sont du confort : une erreur ici ne doit JAMAIS empecher
       le tunnel de demarrer. Le 06-11-2026, elle l'a empeche. */
    try { fixTexts(); } catch (e) { }
    withSdk(start);
  }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);

  function start() {

  /* ---- LA SEULE LIGNE A ADAPTER ---------------------------------------- */
  /* --------------------------------------------------------------------- */

  var PROPS = { "326257":"jade","326248":"onyx","326251":"topaze",
                "326258":"ambre","326247":"opale","326259":"agate" };

  var $ = function (id) { return document.getElementById(id); };
  var money = function (c) {
    return "$" + (c/100).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
  };

  /* ---- Langues. La page donne la langue ; l'anglais est le defaut. ------ */
  var LANGS = {
    en: {
      title:"Book direct", firstName:"First name", lastName:"Last name", email:"Email",
      phone:"Phone", guests:"Guests", go1:"Continue to payment", wait:"One moment…",
      pay:"Pay", loading:"Loading the amount…", confirming:"Confirming…",
      secure:"Secure card payment · you stay on lesrochesretreat.com",
      whatsapp:"A question before paying? We reply on WhatsApp, usually within minutes.",
      doneTitle:"You're booked.",
      optsTitle:"A few details", babyCot:"We need a baby cot", pet:"We're bringing a pet (no extra charge)",
      servicesTitle:"Add a service — charged with your booking",
      activitiesTitle:"Interested in an activity?",
      activitiesNote:"Nothing is charged here. We'll message you on WhatsApp with the options, and you pay the provider directly.",
      beds:"2 double beds · up to 4 guests",
      perStay:"per stay", perNight:"per night", perPerson:"per person", perEach:"each", onRequest:"on request",
      totalLine:"Total", depositLine:"To pay today", balanceLine:"On arrival",
      recap:function(q){return q.nights+(q.nights>1?" nights":" night")+" from "+q.checkin+" to "+q.checkout+" · total "+q.m+" (5% direct discount included)";},
      policyFull:function(q){return "You pay "+q.d+" today by card — the full amount. Non-refundable, except in cases of force majeure (a natural disaster making access impossible). For any other cancellation, half of it becomes a credit valid for 12 months.";},
      policyPart:function(q){return "You pay a 50% deposit of "+q.d+" today by card. The balance of "+q.b+" is payable on arrival — by card, in cash, or by payment link. The deposit is non-refundable, except in cases of force majeure (a natural disaster making access impossible). For any other cancellation, half of the deposit (25% of the total) becomes a credit valid for 12 months.";},
      done:function(g,id){return "Thank you "+g.firstName+". Your booking is confirmed and a confirmation email is on its way to "+g.email+". Reference "+id+".";},
      err:{
        night_unavailable:"One of the nights has just been booked. Please choose other dates.",
        night_unpriced:"These dates aren't open for online booking yet. Message us on WhatsApp.",
        min_stay_not_met:"The minimum stay isn't met for these dates.",
        checkin_in_past:"The arrival date is in the past.",
        checkout_before_checkin:"Departure must come after arrival.",
        stay_too_long:"For a stay this long, please contact us directly.",
        guest_email_invalid:"That email address isn't valid.",
        guest_phone_invalid:"That phone number isn't valid.",
        guest_firstname_required:"Please enter your first name.",
        guest_lastname_required:"Please enter your last name.",
        payment_not_succeeded:"The payment did not go through. Nothing was charged.",
        beds24_rate_limited:"Service is busy. Please try again in a minute.",
        booking_write_unconfirmed:"Your payment went through, but the automatic confirmation failed. We will email you within the hour — please do not pay again.",
        fallback:"Something went wrong. Please try again, or message us on WhatsApp."
      }
    },
    fr: {
      title:"Réserver en direct", firstName:"Prénom", lastName:"Nom", email:"E-mail",
      phone:"Téléphone", guests:"Voyageurs", go1:"Continuer vers le paiement", wait:"Un instant…",
      pay:"Payer", loading:"Chargement du montant…", confirming:"Confirmation…",
      secure:"Paiement par carte sécurisé · vous ne quittez pas lesrochesretreat.com",
      whatsapp:"Une question avant de payer ? On répond sur WhatsApp, en général en quelques minutes.",
      doneTitle:"C'est réservé.",
      optsTitle:"Quelques précisions", babyCot:"Nous avons besoin d'un lit bébé", pet:"Nous venons avec un animal (sans supplément)",
      servicesTitle:"Ajouter un service — facturé avec votre réservation",
      activitiesTitle:"Intéressé par une activité ?",
      activitiesNote:"Rien n'est facturé ici. Nous revenons vers vous par WhatsApp avec les différents éléments, et vous réglez directement le prestataire.",
      beds:"2 lits doubles · jusqu'à 4 voyageurs",
      perStay:"le séjour", perNight:"la nuit", perPerson:"la personne", perEach:"l’unité", onRequest:"sur demande",
      totalLine:"Total", depositLine:"À payer aujourd'hui", balanceLine:"À l'arrivée",
      recap:function(q){return q.nights+(q.nights>1?" nuits":" nuit")+" du "+q.checkin+" au "+q.checkout+" · total "+q.m+" (remise directe de 5 % incluse)";},
      policyFull:function(q){return "Vous payez "+q.d+" aujourd'hui par carte — la totalité. Non remboursable, sauf cas de force majeure (catastrophe naturelle rendant l'accès impossible). Pour toute autre annulation, la moitié devient un avoir valable 12 mois.";},
      policyPart:function(q){return "Vous payez un acompte de 50 %, soit "+q.d+", aujourd'hui par carte. Le solde de "+q.b+" se règle à l'arrivée — par carte, en espèces, ou par lien de paiement. L'acompte n'est pas remboursable, sauf cas de force majeure (catastrophe naturelle rendant l'accès impossible). Pour toute autre annulation, la moitié de l'acompte (25 % du total) devient un avoir valable 12 mois.";},
      done:function(g,id){return "Merci "+g.firstName+". Votre réservation est confirmée et un e-mail de confirmation part à "+g.email+". Référence "+id+".";},
      err:{
        night_unavailable:"Une des nuits de votre séjour vient d'être réservée. Choisissez d'autres dates.",
        night_unpriced:"Ces dates ne sont pas encore ouvertes à la réservation en ligne. Écrivez-nous sur WhatsApp.",
        min_stay_not_met:"Le séjour minimum n'est pas atteint sur ces dates.",
        checkin_in_past:"La date d'arrivée est passée.",
        checkout_before_checkin:"Le départ doit suivre l'arrivée.",
        stay_too_long:"Pour un séjour aussi long, écrivez-nous directement.",
        guest_email_invalid:"Cette adresse e-mail n'est pas valide.",
        guest_phone_invalid:"Ce numéro de téléphone n'est pas valide.",
        guest_firstname_required:"Indiquez votre prénom.",
        guest_lastname_required:"Indiquez votre nom.",
        payment_not_succeeded:"Le paiement n'a pas abouti. Aucun montant n'a été prélevé.",
        beds24_rate_limited:"Service momentanément occupé. Réessayez dans une minute.",
        booking_write_unconfirmed:"Votre paiement est bien passé, mais la confirmation automatique a échoué. Nous vous écrivons dans l'heure — ne payez pas une seconde fois.",
        fallback:"Une erreur est survenue. Réessayez, ou écrivez-nous sur WhatsApp."
      }
    },
    es: {
      title:"Reservar directo", firstName:"Nombre", lastName:"Apellido", email:"Correo",
      phone:"Teléfono", guests:"Huéspedes", go1:"Continuar al pago", wait:"Un momento…",
      pay:"Pagar", loading:"Cargando el monto…", confirming:"Confirmando…",
      secure:"Pago con tarjeta seguro · no sale de lesrochesretreat.com",
      whatsapp:"¿Alguna duda antes de pagar? Respondemos por WhatsApp, normalmente en minutos.",
      doneTitle:"Reserva confirmada.",
      optsTitle:"Algunos detalles", babyCot:"Necesitamos una cuna", pet:"Venimos con una mascota (sin cargo)",
      servicesTitle:"Añadir un servicio — se cobra con su reserva",
      activitiesTitle:"¿Le interesa alguna actividad?",
      activitiesNote:"Aquí no se cobra nada. Le escribimos por WhatsApp con las opciones, y usted paga directamente al proveedor.",
      beds:"2 camas dobles · hasta 4 huéspedes",
      perStay:"por estancia", perNight:"por noche", perPerson:"por persona", perEach:"por unidad", onRequest:"a consultar",
      totalLine:"Total", depositLine:"A pagar hoy", balanceLine:"A la llegada",
      recap:function(q){return q.nights+(q.nights>1?" noches":" noche")+" del "+q.checkin+" al "+q.checkout+" · total "+q.m+" (5 % de descuento directo incluido)";},
      policyFull:function(q){return "Paga "+q.d+" hoy con tarjeta — el total. No reembolsable, salvo fuerza mayor (desastre natural que impida el acceso). Para cualquier otra cancelación, la mitad se convierte en un crédito válido 12 meses.";},
      policyPart:function(q){return "Paga un depósito del 50 %, "+q.d+", hoy con tarjeta. El saldo de "+q.b+" se paga a la llegada — con tarjeta, en efectivo, o mediante enlace de pago. El depósito no es reembolsable, salvo fuerza mayor (desastre natural que impida el acceso). Para cualquier otra cancelación, la mitad del depósito (25 % del total) se convierte en un crédito válido 12 meses.";},
      done:function(g,id){return "Gracias "+g.firstName+". Su reserva está confirmada y le enviamos un correo a "+g.email+". Referencia "+id+".";},
      err:{
        night_unavailable:"Una de las noches acaba de ser reservada. Elija otras fechas.",
        night_unpriced:"Estas fechas aún no están abiertas en línea. Escríbanos por WhatsApp.",
        min_stay_not_met:"No se alcanza la estancia mínima en estas fechas.",
        checkin_in_past:"La fecha de llegada ya pasó.",
        checkout_before_checkin:"La salida debe ser posterior a la llegada.",
        stay_too_long:"Para una estancia tan larga, escríbanos directamente.",
        guest_email_invalid:"Ese correo no es válido.",
        guest_phone_invalid:"Ese teléfono no es válido.",
        guest_firstname_required:"Indique su nombre.",
        guest_lastname_required:"Indique su apellido.",
        payment_not_succeeded:"El pago no se completó. No se cobró nada.",
        beds24_rate_limited:"Servicio ocupado. Intente en un minuto.",
        booking_write_unconfirmed:"Su pago se realizó, pero la confirmación automática falló. Le escribimos dentro de la hora — no pague de nuevo.",
        fallback:"Ocurrió un error. Intente de nuevo, o escríbanos por WhatsApp."
      }
    }
  };

  var LANG = (function () {
    var c = (document.documentElement.lang || "en").slice(0,2).toLowerCase();
    return LANGS[c] ? c : "en";
  })();
  var L = LANGS[LANG];

  var say = function (code) { return L.err[code] || L.err.fallback; };

  function post(path, body) {
    return fetch(WORKER + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { return { httpOk: r.ok, body: j }; }); });
  }

  var villa = null, stay = null, guest = null, intentId = null, onvoInstance = null, WA_BASE = "";

  function dates() {
    var a = ($("sb-checkin")||{}).value || "", b = ($("sb-checkout")||{}).value || "";
    return (a && b) ? { checkin:a, checkout:b } : null;
  }

  function selectedOptions() {
    return {
      babyCot: $("lr-cot").checked,
      pet: $("lr-pet").checked,
      services: Array.prototype.filter.call(document.querySelectorAll(".lr-sv"), function (c) { return c.checked; })
                     .map(function (c) { return c.value; }),
      quantities: Array.prototype.reduce.call(document.querySelectorAll(".lr-qty"), function (acc, q) {
        if (!q.disabled) acc[q.getAttribute("data-for")] = Number(q.value) || 1;
        return acc;
      }, {}),
      activities: Array.prototype.filter.call(document.querySelectorAll(".lr-ac"), function (c) { return c.checked; })
                       .map(function (c) { return c.value; })
    };
  }

  function unitLabel(u) {
      return u === "night" ? L.perNight
        : u === "person" ? L.perPerson
        : u === "each" ? L.perEach
        : L.perStay;
    }

  /* Dessine les deux listes a partir des catalogues du serveur. */
  function paintCatalogs(services, activities) {
    var box = $("lr-services");
    if (!box.dataset.done) {
      box.innerHTML = services.map(function (e) {
        var price = e.priceCents == null
          ? ""
          : " — " + money(e.priceCents) + " " + unitLabel(e.unit);
        var note = e.note ? '<em class="lr-hint">' + e.note + "</em>" : "";
        var qty = e.unit === "each"
          ? '<input type="number" class="lr-qty" data-for="' + e.key + '" min="1" max="' +
            (e.maxQty || 10) + '" value="1" disabled aria-label="' + e.label + '">'
          : "";
        return '<label class="lr-cb lr-sv-row"><input type="checkbox" class="lr-sv" value="' + e.key + '">' +
               "<span>" + e.label + "<small>" + price + "</small>" + note + "</span>" + qty + "</label>";
      }).join("");
      box.dataset.done = "1";
      Array.prototype.forEach.call(document.querySelectorAll(".lr-sv"), function (c) {
        c.addEventListener("change", function () {
          var q = document.querySelector('.lr-qty[data-for="' + c.value + '"]');
          if (q) q.disabled = !c.checked;
          refresh();
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll(".lr-qty"), function (q) {
        q.addEventListener("change", refresh);
        q.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); });
      });
      if (!services.length) { box.hidden = true; document.querySelector('[data-t="servicesTitle"]').hidden = true; }
    }

    var abox = $("lr-activities");
    if (!abox.dataset.done) {
      abox.innerHTML = activities.map(function (e) {
        return '<label class="lr-cb"><input type="checkbox" class="lr-ac" value="' + e.key + '">' +
               "<span>" + e.label + "</span></label>";
      }).join("");
      abox.dataset.done = "1";
      if (!activities.length) {
        abox.hidden = true;
        document.querySelector('[data-t="activitiesTitle"]').hidden = true;
        document.querySelector('[data-t="activitiesNote"]').hidden = true;
      }
    }
  }

  function paintTotals(q) {
    var rows = [[L.totalLine, money(q.totalCents), true]];
    if (q.balanceCents > 0) {
      rows = [[L.depositLine, money(q.depositCents), true], [L.balanceLine, money(q.balanceCents), false]];
    }
    $("lr-sum").innerHTML = rows.map(function (r) {
      return '<div class="' + (r[2] ? "lr-strong" : "") + '"><dt>' + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
    }).join("");
  }

  var timer = null;
  function refresh() { clearTimeout(timer); timer = setTimeout(load, 250); }

  function load() {
    post("/quote", { villa: villa, checkin: stay.checkin, checkout: stay.checkout, lang: LANG,
                     options: selectedOptions(), guest: { numAdult: Number($("lr-ad").value) || 2 } })
      .then(function (res) {
        if (!res.body.ok) { $("lr-pay-recap").textContent = say(res.body.error); $("lr-go1").disabled = true; return; }
        var q = res.body.quote || res.body;
        stay.quote = q;
        paintCatalogs(q.servicesCatalog || [], q.activitiesCatalog || []);
        var view = { nights:q.nights, checkin:q.checkin, checkout:q.checkout,
                     m:money(q.totalCents), d:money(q.depositCents), b:money(q.balanceCents) };
        $("lr-pay-recap").textContent = L.recap(view) + " · " + L.beds;
        paintTotals(q);
        $("lr-pay-policy").textContent = q.payFullUpfront ? L.policyFull(view) : L.policyPart(view);
        $("lr-go1").disabled = false;
        if (WA_BASE) {
          $("lr-wa").href = WA_BASE + "?text=" + encodeURIComponent(
            q.villa.name + " — " + q.checkin + " / " + q.checkout + " — ");
        }
      })
      .catch(function () { $("lr-pay-recap").textContent = say(); });
  }

  function open_() {
    var d = dates();
    if (!d) return;
    stay = d;
    $("lr-err1").hidden = true; $("lr-err2").hidden = true;
    $("lr-pay-step1").hidden = false; $("lr-pay-step2").hidden = true; $("lr-pay-done").hidden = true;
    $("lr-pay-recap").textContent = L.loading;
    $("lr-pay").hidden = false;
    document.body.style.overflow = "hidden";
    load();
  }

  function close_() {
    $("lr-pay").hidden = true;
    document.body.style.overflow = "";
  }

  function fail1(code) { $("lr-err1").textContent = say(code); $("lr-err1").hidden = false; }
  function fail2(code) { $("lr-err2").textContent = say(code); $("lr-err2").hidden = false; }

  function toPayment() {
    guest = {
      firstName: $("lr-fn").value, lastName: $("lr-ln").value,
      email: $("lr-em").value, phone: $("lr-ph").value,
      numAdult: Number($("lr-ad").value) || 2
    };
    if (!guest.firstName.trim()) return fail1("guest_firstname_required");
    if (!guest.lastName.trim()) return fail1("guest_lastname_required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(guest.email)) return fail1("guest_email_invalid");
    if (guest.phone.replace(/\D/g,"").length < 6) return fail1("guest_phone_invalid");

    $("lr-err1").hidden = true;
    $("lr-go1").disabled = true;
    $("lr-go1").textContent = L.wait;

    post("/intent", { villa: villa, checkin: stay.checkin, checkout: stay.checkout, lang: LANG,
                      guest: guest, options: selectedOptions() })
      .then(function (res) {
        $("lr-go1").disabled = false;
        $("lr-go1").textContent = L.go1;
        if (!res.body.ok) return fail1(res.body.error);
        intentId = res.body.paymentIntentId;
        $("lr-pay-step1").hidden = true;
        $("lr-pay-step2").hidden = false;
        $("lr-go2").textContent = L.pay + " " + money(res.body.amountCents);
        renderCard(res.body.publishableKey, intentId);
      })
      .catch(function () { $("lr-go1").disabled = false; fail1(); });
  }

  function renderCard(publicKey, paymentIntentId) {
    onvoInstance = window.onvo.pay({
      publicKey: publicKey,
      paymentIntentId: paymentIntentId,
      paymentType: "one_time",
      locale: "en",            /* sinon ONVO affiche le formulaire en espagnol */
      manualSubmit: true,      /* le bouton est le notre */
      onSuccess: function () { finish(); },
      onError: function (e) {
        fail2((e && e.details && e.details.card && e.details.card.reason) || null);
        $("lr-go2").disabled = false;
      }
    });
    onvoInstance.render("#lr-onvo");

    $("lr-go2").onclick = function () {
      $("lr-err2").hidden = true;
      $("lr-go2").disabled = true;
      onvoInstance.submitPayment();
    };
  }

  function finish() {
    $("lr-go2").textContent = L.confirming;
    post("/confirm", { paymentIntentId: intentId, guest: guest })
      .then(function (res) {
        if (!res.body.ok) { fail2(res.body.error); return; }
        $("lr-pay-step2").hidden = true;
        $("lr-pay-done").hidden = false;
        $("lr-done-txt").textContent = L.done(guest, res.body.bookingId);
      })
      .catch(function () { fail2("booking_write_unconfirmed"); });
  }

  function init() {
    var mm = document.documentElement.innerHTML.match(/booking2\.php\?propid=(\d+)/);
    villa = mm ? PROPS[mm[1]] : null;
    if (!villa) return;                    /* page sans villa identifiable : on ne touche a rien */

    var cta = $("sb-cta");
    if (!cta) return;

    /* On remplace le bouton pour neutraliser les anciens ecouteurs
       (la page en portait deux, qui redirigeaient vers beds24.com). */
    var fresh = cta.cloneNode(true);
    cta.parentNode.replaceChild(fresh, cta);
    fresh.addEventListener("click", function (e) {
      e.preventDefault(); e.stopImmediatePropagation(); open_();
    }, true);

    /* Remplit les libelles dans la langue de la page. */
    $("lr-pay-title").textContent = L.title;
    $("lr-go1").textContent = L.go1;
    Array.prototype.forEach.call(document.querySelectorAll("#lr-pay [data-t]"), function (el) {
      var k = el.getAttribute("data-t");
      if (L[k]) el.textContent = L[k];
    });

    /* Reprend le numero WhatsApp deja present sur la page : un seul a maintenir. */
    var wa = document.querySelector('a[href*="wa.me/"]');
    if (wa) { WA_BASE = (wa.getAttribute("href") || "").split("?")[0]; $("lr-wa").href = WA_BASE; }
    else { $("lr-wa").hidden = true; }

    $("lr-pay-close").addEventListener("click", close_);
    $("lr-pay").addEventListener("click", function (e) { if (e.target === $("lr-pay")) close_(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("lr-pay").hidden) close_(); });
    $("lr-go1").addEventListener("click", toPayment);
    $("lr-cot").addEventListener("change", refresh);
    $("lr-pet").addEventListener("change", refresh);
    $("lr-ad").addEventListener("change", refresh);
  }

    init();

  }
})();
