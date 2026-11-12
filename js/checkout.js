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
  /* Apple Pay : deux scripts a part. Celui d'Apple definit ApplePaySession
     et la balise <apple-pay-button> ; sans lui, isAvailable() repond non
     ailleurs que dans Safari. ONVO.js est distinct du widget carte. */
  var SDK_APPLE = "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";
  var SDK_ONVOJS = "https://js.onvopay.com/v1/";

  var CSS = `#lr-pay{position:fixed;inset:0;z-index:99999;background:rgba(20,18,16,.72);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}
  #lr-pay[hidden]{display:none}
  /* Un selecteur par identifiant (#lr-steps{display:flex}) l'emporte sur la
     regle navigateur [hidden]{display:none} : sans ce !important, un bloc
     masque par hidden reste visible. Constate le 07-11-2026 sur le fil
     d'etapes, qui survivait a l'ecran de confirmation. */
  #lr-pay [hidden]{display:none!important}
  #lr-pay *{box-sizing:border-box}
  #lr-pay-card{background:#fffdf9;color:#1d1b19;width:100%;max-width:960px;max-height:92vh;border-radius:14px;position:relative;display:flex;overflow:hidden;font:400 16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 24px 60px rgba(20,18,16,.35)}
  #lr-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;overflow-y:auto;padding:28px 30px 0}
  #lr-aside{flex:0 0 310px;background:#f4f1ea;padding:28px 26px;overflow-y:auto}
  #lr-pay-close{position:absolute;top:10px;right:14px;z-index:2;border:0;background:none;font-size:28px;line-height:1;cursor:pointer;color:#8a857d}
  #lr-pay-close:hover{color:#1d1b19}

  #lr-pay-title{font:500 22px/1.3 inherit;margin:0 0 14px}
  #lr-pay h3{font:500 19px/1.3 inherit;margin:0 0 8px}
  #lr-steps{display:flex;align-items:center;gap:9px;font-size:12px;color:#8a857d;margin:0 0 20px}
  #lr-steps .lr-dots{display:flex;gap:5px}
  #lr-steps i{width:6px;height:6px;border-radius:50%;background:#ded9d0;display:block}
  #lr-steps i.on{background:#1d1b19}
  .lr-step-title{font:500 17px/1.3 inherit;margin:0 0 4px;color:#1d1b19}
  .lr-step-sub{font-size:13px;color:#8a857d;margin:0 0 18px}

  #lr-pay label{display:block;margin:0 0 14px;font-size:13px;color:#5f5b55}
  #lr-pay input,#lr-pay select{display:block;width:100%;margin-top:5px;padding:11px 12px;border:1px solid #d9d4cb;border-radius:8px;font-size:16px;background:#fff;color:#1d1b19;font-family:inherit}
  #lr-pay input:focus,#lr-pay select:focus{outline:2px solid #1d1b19;outline-offset:-1px}
  #lr-pay .lr-row{display:flex;gap:14px}
  #lr-pay .lr-row label{flex:1 1 0;min-width:0}
  #lr-pay .lr-tel{display:flex;gap:10px}
  #lr-pay .lr-tel select{flex:0 0 150px}
  #lr-pay .lr-tel input{flex:1 1 auto}

  .lr-nav{position:sticky;bottom:0;display:flex;gap:10px;background:#fffdf9;padding:16px 0 24px;margin-top:auto}
  .lr-nav:before{content:"";position:absolute;left:0;right:0;top:-18px;height:18px;background:linear-gradient(rgba(255,253,249,0),#fffdf9);pointer-events:none}
  .lr-foot{position:sticky;bottom:0;background:#fffdf9;margin-top:auto;padding-top:14px}
  .lr-foot:before{content:"";position:absolute;left:0;right:0;top:-18px;height:18px;background:linear-gradient(rgba(255,253,249,0),#fffdf9);pointer-events:none}
  .lr-foot .lr-nav{position:static;padding-top:10px;margin-top:0}
  .lr-foot .lr-nav:before{display:none}
  #lr-pay button.lr-next{flex:1 1 auto;padding:14px;border:0;border-radius:8px;background:#1d1b19;color:#fffdf9;font-size:16px;font-family:inherit;cursor:pointer}
  #lr-pay button.lr-back{flex:0 0 auto;padding:14px 20px;border:1px solid #d9d4cb;border-radius:8px;background:#fffdf9;color:#5f5b55;font-size:16px;font-family:inherit;cursor:pointer}
  #lr-pay button.lr-back:hover{color:#1d1b19;border-color:#b9b2a6}
  #lr-pay button[disabled]{opacity:.4;cursor:default}

  .lr-aside-villa{font:500 19px/1.25 inherit;margin:0 0 8px}
  .lr-aside-dates{font-size:14px;color:#1d1b19;margin:0 0 3px}
  .lr-aside-meta{font-size:12px;color:#8a857d;margin:0 0 18px;line-height:1.5}
  .lr-aside-sum{border-top:1px solid #e0dbd1;padding-top:13px}
  .lr-aside-sum div{display:flex;justify-content:space-between;gap:12px;padding:4px 0;font-size:13px;color:#5f5b55}
  .lr-aside-sum div b{font-weight:400;color:#1d1b19;font-variant-numeric:tabular-nums}
  .lr-aside-sum div.lr-strong{font-size:15px;color:#1d1b19}
  .lr-aside-sum div.lr-strong b{font-weight:500}
  .lr-aside-note{font-size:11px;color:#8a857d;margin:14px 0 0;line-height:1.5}
  .lr-aside-sum div.lr-line{font-size:12.5px;color:#8a857d}
  .lr-aside-sum div.lr-line b{font-weight:400;color:#5f5b55}
  .lr-aside-sum div.lr-total{border-top:1px solid #e0dbd1;margin-top:8px;padding-top:10px}
  .lr-aside-wa{margin-top:18px;border-top:1px solid #e0dbd1;padding-top:14px}
  #lr-aside-toggle{display:none}
  .lr-wa-q{font-size:12px;color:#8a857d;margin:0 0 9px;line-height:1.5}
  a.lr-wa-btn{display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 12px;border:1px solid #25d366;border-radius:8px;color:#1d1b19;background:#fff;font-size:14px;text-decoration:none}
  a.lr-wa-btn:hover{background:#f0fbf4}
  a.lr-wa-btn svg{flex:0 0 auto}

  .lr-scroll-hint{display:none;font-size:12px;color:#8a857d;margin:0 0 12px}

  #lr-activities{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 4px}
  #lr-activities label.lr-ac-chip{display:flex;align-items:center;gap:8px;margin:0;padding:10px 11px;border:1px solid #e4e0d8;border-radius:9px;background:#fff;font-size:13.5px;line-height:1.35;color:#1d1b19;cursor:pointer}
  #lr-activities label.lr-ac-chip.on{border-color:#1d1b19;background:#f7f5f0}
  #lr-activities label.lr-ac-chip input{width:auto;margin:0;flex:0 0 auto}

  #lr-policy-box{border:1px solid #e4e0d8;border-radius:8px;padding:0;margin:0 0 16px;background:#f9f7f2}
  /* Bloc non repliable : au moment de payer, la politique doit etre lue, pas depliee.
     Elle etait repliee par defaut sous 860 px, c'est-a-dire sur mobile. */
  #lr-policy-ttl{margin:0;padding:11px 14px 0;font-size:12px;letter-spacing:.04em;
    text-transform:uppercase;color:#8a857d}
  #lr-pay-policy{font-size:13px;color:#5f5b55;margin:0;padding:0 14px 13px;line-height:1.55;background:none;border-radius:0}
  /* Barre de reservation collante, mobile uniquement. Elle n'apparait que
     lorsque le bloc de reservation est sorti de l'ecran : avant, elle ferait
     doublon ; apres, c'est le seul rappel du prix pendant quatre ecrans. */
  #lr-sticky{position:fixed;left:0;right:0;bottom:0;z-index:880;display:none;
    align-items:center;gap:12px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));
    background:rgba(255,255,255,.97);backdrop-filter:blur(8px);
    border-top:1px solid #e4e0d8;box-shadow:0 -2px 14px rgba(29,27,25,.08)}
  #lr-sticky.on{display:flex}
  #lr-sticky-txt{flex:1 1 auto;min-width:0;line-height:1.25}
  #lr-sticky-price{display:block;font-size:15px;font-weight:600;color:#1d1b19}
  #lr-sticky-sub{display:block;font-size:11.5px;color:#8a857d;margin-top:1px}
  #lr-sticky-go{flex:0 0 auto;padding:12px 20px;min-height:44px;border:0;border-radius:8px;
    background:#1d1b19;color:#fff;font-size:13px;letter-spacing:.06em;cursor:pointer}
  /* Le bouton flottant WhatsApp remonte pour ne pas passer sous la barre. */
  body.lr-sticky-on .wa-float,body.lr-sticky-on #wa-float,
  body.lr-sticky-on [class*="whatsapp-float"]{bottom:86px!important}
  @media (min-width:861px){#lr-sticky{display:none!important}}

  /* Zones tactiles : les champs de la fiche villa faisaient 14 a 16 px de haut. */
  @media (max-width:860px){
    #sb-checkin,#sb-checkout,#sb-guests,
    .sb-dates-row .sb-field{min-height:44px}
    #sb-checkin,#sb-checkout{display:flex;align-items:center}
    #sb-guests{padding-top:10px;padding-bottom:10px}
  }

  .lr-req{color:#a32d2d;font-weight:600}
  #lr-wallet{margin:0 0 14px}
  #lr-wallet apple-pay-button{--apple-pay-button-width:100%;--apple-pay-button-height:46px;--apple-pay-button-border-radius:8px;display:block;width:100%}
  #lr-wallet-or{display:flex;align-items:center;gap:12px;margin:14px 0 10px;font-size:12.5px;color:#8a857d}
  #lr-wallet-or:before,#lr-wallet-or:after{content:"";flex:1;height:1px;background:#e4e0d8}
  #lr-onvo{min-height:180px;margin:0 0 4px;border:1px solid #e4e0d8;border-radius:10px;padding:4px 10px;background:#fff}
  .lr-aside-err{font-size:13px;color:#a32d2d;margin:0 0 14px}

  #lr-pay .lr-cb{display:flex;align-items:flex-start;gap:9px;margin:0 0 10px;font-size:14px;color:#1d1b19;cursor:pointer;line-height:1.45}
  #lr-pay .lr-cb input{width:auto;margin:3px 0 0;flex:0 0 auto}
  #lr-services{display:grid;grid-template-columns:1fr 1fr;gap:4px 22px;margin:0 0 4px}
  #lr-activities{display:grid;grid-template-columns:1fr 1fr;gap:2px 22px;margin:0 0 4px}
  .lr-sv-txt{flex:1 1 auto;min-width:0}
  .lr-sv-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
  .lr-price{font-style:normal;font-size:13px;color:#5f5b55;white-space:nowrap;font-variant-numeric:tabular-nums}
  #lr-pay .lr-hint{display:block;font-size:11.5px;font-style:normal;color:#8a857d;line-height:1.45;margin-top:2px}
  #lr-pay .lr-qty{width:54px;flex:0 0 auto;margin:0 0 0 8px;padding:5px 6px;font-size:14px;text-align:center}
  #lr-pay .lr-qty:disabled{opacity:.35}
  #lr-pay .lr-note{font-size:12px;color:#8a857d;margin:12px 0 2px;line-height:1.5}

  #lr-sum{margin:0 0 16px;font-size:14px}
  #lr-sum div{display:flex;justify-content:space-between;padding:4px 0}
  #lr-sum div.lr-strong{font-weight:500;border-top:1px solid #e4e0d8;margin-top:6px;padding-top:8px}
  #lr-sum dt{margin:0;color:#5f5b55}
  #lr-sum dd{margin:0;color:#1d1b19;white-space:nowrap;font-variant-numeric:tabular-nums}
  #lr-ack{margin:4px 0 0}
  #lr-ack .lr-cb{font-size:13px;color:#5f5b55}
  #lr-ack a{color:#1d1b19;text-decoration:underline}

  #lr-pay .lr-err{color:#a32d2d;font-size:14px;margin:0 0 12px}
  #lr-pay .lr-trust{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:#8a857d;margin:0 0 4px;text-align:center;text-decoration:none}
  #lr-pay .lr-lock{color:#1d9e75;font-size:9px}

  @media (max-width:860px){
    #lr-pay{padding:0;align-items:stretch}
    #lr-pay-card{max-width:none;max-height:none;min-height:100%;border-radius:0;flex-direction:column}
    #lr-aside{flex:0 0 auto;order:-1;padding:22px 20px 20px}
    #lr-main{padding:22px 20px 0}
    #lr-services{grid-template-columns:1fr}
    #lr-pay .lr-tel select{flex:0 0 124px}
    /* Sur telephone le panneau sert de resume : on garde la maison, les dates
       et les montants, on laisse tomber la phrase de bas de panneau. */
    .lr-aside-note{display:none}
    .lr-aside-villa{font-size:17px;margin-bottom:5px}
    .lr-aside-meta{margin-bottom:12px}
    .lr-aside-wa{margin-top:12px;padding-top:11px}
    /* L'indice de defilement ne sert qu'au telephone : sur ordinateur toute
       l'etape tient a l'ecran. */
    .lr-scroll-hint{display:block}
    /* Etape paiement : le panneau repete ce que le recapitulatif dit deja.
       On le retire pour que le formulaire de carte soit tout de suite visible. */
    #lr-aside.lr-aside-off{display:none}
    /* Le detail ligne par ligne allongeait le panneau au point de pousser
       l'etape hors de l'ecran. Il se replie : les deux montants qui comptent
       restent lisibles, le reste s'ouvre d'une pression. */
    .lr-aside-meta{display:none}
    #lr-aside-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;margin:12px 0 0;padding:10px 12px;border:1px solid #e0dbd1;border-radius:9px;background:#fffdf9;font:inherit;font-size:13px;color:#5f5b55;text-align:left;cursor:pointer}
    #lr-aside-toggle .lr-chev{transition:transform .15s;color:#8a857d}
    #lr-aside.open #lr-aside-toggle .lr-chev{transform:rotate(180deg)}
    #lr-aside-mini{display:block}
    #lr-aside-mini b{display:block;color:#1d1b19;font-weight:500;font-variant-numeric:tabular-nums}
    #lr-aside-body{display:none;margin-top:4px}
    #lr-aside.open #lr-aside-body{display:block}
  }`;

  var HTML = `<div id="lr-pay" hidden role="dialog" aria-modal="true" aria-labelledby="lr-pay-title">
  <div id="lr-pay-card">
    <button type="button" id="lr-pay-close" aria-label="Close">&times;</button>

    <div id="lr-main">
      <h2 id="lr-pay-title"></h2>

      <div id="lr-steps">
        <span id="lr-step-txt"></span>
        <span class="lr-dots"><i></i><i></i><i></i><i></i></span>
      </div>

      <div id="lr-s1">
        <p class="lr-step-title" data-t="s1Title"></p>
        <p class="lr-step-sub" data-t="s1Sub"></p>
        <div class="lr-row">
          <label><span data-t="firstName"></span><input id="lr-fn" autocomplete="given-name" required></label>
          <label><span data-t="lastName"></span><input id="lr-ln" autocomplete="family-name" required></label>
        </div>
        <label><span data-t="email"></span><input id="lr-em" type="email" autocomplete="email" required></label>
        <label>
          <span data-t="phone"></span>
          <span class="lr-tel">
            <select id="lr-cc" aria-label="Indicatif"></select>
            <input id="lr-ph" type="tel" inputmode="tel" autocomplete="tel-national" required>
          </span>
        </label>
        <div class="lr-row">
          <label><span data-t="city"></span><input id="lr-ci" autocomplete="address-level2" required></label>
          <label><span data-t="country"></span><input id="lr-co" list="lr-countries" autocomplete="country-name" required></label>
        </div>
        <datalist id="lr-countries"></datalist>
        <p id="lr-err1" class="lr-err" hidden></p>
        <div class="lr-nav"><button type="button" id="lr-n1" class="lr-next"></button></div>
      </div>

      <div id="lr-s2" hidden>
        <p class="lr-step-title" data-t="servicesTitle"></p>
        <p class="lr-step-sub" data-t="optional"></p>
        <p class="lr-scroll-hint" id="lr-hint2"></p>
        <div class="lr-row">
          <label><span data-t="guests"></span><input id="lr-ad" type="number" min="1" max="12" value="2"></label>
          <span style="flex:1 1 0"></span>
        </div>
        <label class="lr-cb"><input type="checkbox" id="lr-cot"><span data-t="babyCot"></span></label>
        <label class="lr-cb"><input type="checkbox" id="lr-pet"><span data-t="pet"></span></label>
        <div id="lr-services"></div>
        <div class="lr-nav">
          <button type="button" id="lr-b2" class="lr-back"></button>
          <button type="button" id="lr-n2" class="lr-next"></button>
        </div>
      </div>

      <div id="lr-s3" hidden>
        <p class="lr-step-title" data-t="activitiesTitle"></p>
        <p class="lr-step-sub" data-t="activitiesNote"></p>
        <div id="lr-activities"></div>
        <p id="lr-err3" class="lr-err" hidden></p>
        <div class="lr-nav">
          <button type="button" id="lr-b3" class="lr-back"></button>
          <button type="button" id="lr-n3" class="lr-next"></button>
        </div>
      </div>

      <div id="lr-s4" hidden>
        <p class="lr-step-title" data-t="s4Title"></p>
        <dl id="lr-sum"></dl>
        <div id="lr-policy-box">
          <p id="lr-policy-ttl" data-t="policySummary"></p>
          <p id="lr-pay-policy"></p>
        </div>
        <div id="lr-wallet" hidden>
          <apple-pay-button id="lr-apple" buttonstyle="black" type="buy"></apple-pay-button>
          <div id="lr-wallet-or"></div>
        </div>
        <div id="lr-onvo"></div>
        <div class="lr-foot">
          <div id="lr-ack">
            <label class="lr-cb"><input type="checkbox" id="lr-ack1"><span id="lr-ack1-t"></span></label>
            <label class="lr-cb"><input type="checkbox" id="lr-ack2"><span id="lr-ack2-t"></span></label>
          </div>
          <p id="lr-err2" class="lr-err" hidden></p>
          <p class="lr-trust"><span class="lr-lock" aria-hidden="true">&#9679;</span><span data-t="secure"></span></p>
          <div class="lr-nav">
            <button type="button" id="lr-b4" class="lr-back"></button>
            <button type="button" id="lr-go2" class="lr-next"></button>
          </div>
        </div>
      </div>

      <div id="lr-blocked" hidden>
        <p class="lr-step-title" data-t="blockedTitle"></p>
        <p class="lr-step-sub" id="lr-blocked-txt"></p>
        <div class="lr-nav"><button type="button" id="lr-redo" class="lr-next"></button></div>
      </div>

      <div id="lr-pay-done" hidden>
        <h3 data-t="doneTitle"></h3>
        <p id="lr-done-txt"></p>
        <div class="lr-nav"><button type="button" id="lr-close2" class="lr-next"></button></div>
      </div>
    </div>

    <div id="lr-aside">
      <p class="lr-aside-villa" id="lr-villa"></p>
      <p class="lr-aside-dates" id="lr-dates"></p>
      <p class="lr-aside-meta" id="lr-meta"></p>
      <p class="lr-aside-err" id="lr-aside-err" hidden></p>
      <button type="button" id="lr-aside-toggle" aria-expanded="false">
        <span id="lr-aside-mini"></span><span class="lr-chev" aria-hidden="true">&#9662;</span>
      </button>
      <div id="lr-aside-body">
      <div class="lr-aside-sum" id="lr-aside-sum"></div>
      <p class="lr-aside-note" id="lr-aside-note"></p>
      <div class="lr-aside-wa" id="lr-wa-box">
        <p class="lr-wa-q" data-t="whatsapp"></p>
        <a id="lr-wa" class="lr-wa-btn" href="#" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#25d366" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5.2-.4v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4 7.6 7.6 0 0 0 1.6.5 3.7 3.7 0 0 0 1.7.1 2.8 2.8 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3z"/></svg>
          <span id="lr-wa-t"></span>
        </a>
      </div>
      </div>
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
       "<strong>Paid in full today by card.</strong> Your dates are confirmed instantly."],
      ["Payment: 50% deposit by bank transfer on confirmation. The balance (50%) is payable on arrival by transfer, card, or cash.",
       "<strong>Payment:</strong> the full amount is charged by card when you book, taxes included. Cancellation until 60 days before arrival: 96% refunded, the 4% card fee is not."],
      ["Your request will be sent via WhatsApp. You will receive a confirmation by email within 24h, along with the bank details for the transfer.",
       "Your request will be sent via WhatsApp. You receive your confirmation by email straight away."]
    ],
    fr: [
      ["Vous ne payez rien aujourd'hui. Envoyer la demande ne vous engage \u00e0 rien, on confirme vos dates d'abord.",
       "<strong>R\u00e9gl\u00e9 en totalit\u00e9 aujourd'hui par carte.</strong> Vos dates sont confirm\u00e9es imm\u00e9diatement."],
      ["Paiement : 50 % d'acompte par virement bancaire \u00e0 la confirmation. Le solde (50 %) est r\u00e9gl\u00e9 \u00e0 l'arriv\u00e9e, par virement, carte ou esp\u00e8ces.",
       "<strong>Paiement :</strong> la totalit\u00e9 du s\u00e9jour est d\u00e9bit\u00e9e par carte au moment de la r\u00e9servation, taxes comprises. Annulation jusqu'\u00e0 60 jours avant l'arriv\u00e9e : 96 % rembours\u00e9s, les 4 % de frais bancaires ne le sont pas."],
      ["Votre demande sera transmise par WhatsApp. Vous recevrez une confirmation par email sous 24h, avec les coordonn\u00e9es bancaires pour le virement.",
       "Votre demande sera transmise par WhatsApp. Vous recevez votre confirmation par email imm\u00e9diatement."]
    ],
    es: [
      ["No pagas nada hoy. Enviar la solicitud no te compromete a nada, primero confirmamos tus fechas.",
       "<strong>Pago completo hoy con tarjeta.</strong> Tus fechas se confirman al instante."],
      ["Pago: dep\u00f3sito del 50 % por transferencia bancaria al confirmar. El saldo (50 %) se abona a la llegada por transferencia, tarjeta o efectivo.",
       "<strong>Pago:</strong> el importe total se cobra con tarjeta al reservar, impuestos incluidos. Cancelaci\u00f3n hasta 60 d\u00edas antes de la llegada: se reembolsa el 96 %, la comisi\u00f3n bancaria del 4 % no."],
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

  /* Mis par init() quand le tunnel est pret a s'ouvrir. */
  var OUVRIR = null;
  var clicEnAttente = false;

  /**
   * La fiche villa porte DEUX scripts en fin de page qui, sur DOMContentLoaded,
   * reclonent #sb-cta et y rebranchent la redirection vers beds24.com. Tout
   * ecouteur pose sur le bouton lui-meme est donc efface apres coup — constate
   * le 07-11-2026. On intercepte sur `document`, en capture : ce noeud-la n'est
   * jamais remplace, et la capture passe avant tout ecouteur du bouton.
   */
  function intercepterCta() {
    document.addEventListener("click", function (e) {
      var n = e.target;
      var cta = n && n.closest ? n.closest("#sb-cta")
              : (n && n.parentNode && n.parentNode.closest ? n.parentNode.closest("#sb-cta") : null);
      if (!cta) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (OUVRIR) OUVRIR();
      else clicEnAttente = true;          /* clic avant la fin du chargement */
    }, true);
  }

  function boot() {
    inject();
    intercepterCta();
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

  /* Le nom affichable, connu avant meme la reponse du serveur : le panneau
     lateral ne doit jamais rester vide, meme quand le devis echoue. */
  var NOMS = { jade:"Casa Jade", onyx:"Casa Onyx", topaze:"Casa Topaze",
               ambre:"Casa Ambre", opale:"Casa Opale", agate:"Casa Agate" };

  var $ = function (id) { return document.getElementById(id); };
  var money = function (c) {
    return "$" + (c/100).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
  };

  /* ---- Langues. La page donne la langue ; l'anglais est le defaut. ------ */
  /**
   * Indicatifs WhatsApp : les pays d'ou viennent reellement les voyageurs,
   * dans l'ordre ou on les attend. [code ISO, indicatif, en, fr, es]
   */
  var PAYS = [
    ["CR","506","Costa Rica","Costa Rica","Costa Rica"],
    ["US","1","United States","\u00c9tats-Unis","Estados Unidos"],
    ["CA","1","Canada","Canada","Canad\u00e1"],
    ["FR","33","France","France","Francia"],
    ["GB","44","United Kingdom","Royaume-Uni","Reino Unido"],
    ["ES","34","Spain","Espagne","Espa\u00f1a"],
    ["IT","39","Italy","Italie","Italia"],
    ["DE","49","Germany","Allemagne","Alemania"],
    ["CH","41","Switzerland","Suisse","Suiza"],
    ["BE","32","Belgium","Belgique","B\u00e9lgica"],
    ["NL","31","Netherlands","Pays-Bas","Pa\u00edses Bajos"],
    ["LU","352","Luxembourg","Luxembourg","Luxemburgo"],
    ["PT","351","Portugal","Portugal","Portugal"],
    ["SE","46","Sweden","Su\u00e8de","Suecia"],
    ["IL","972","Israel","Isra\u00ebl","Israel"],
    ["BR","55","Brazil","Br\u00e9sil","Brasil"],
    ["AR","54","Argentina","Argentine","Argentina"],
    ["MX","52","Mexico","Mexique","M\u00e9xico"],
    ["CO","57","Colombia","Colombie","Colombia"],
    ["CL","56","Chile","Chili","Chile"],
    ["PA","507","Panama","Panama","Panam\u00e1"],
    ["AU","61","Australia","Australie","Australia"]
  ];

  var LANGS = {
    en: {
      title:"Book direct", firstName:"First name", lastName:"Last name", email:"Email",
      phone:"WhatsApp", guests:"Guests", go1:"Continue to payment", wait:"One moment…",
      pay:"Pay", loading:"Loading the amount…", confirming:"Confirming…",
      secure:"Secure card payment · you stay on lesrochesretreat.com",
      whatsapp:"A question before paying? We reply on WhatsApp, usually within minutes.",
      doneTitle:"You're booked.",
      s1Title:"Your details", s4Title:"Payment",
      s1Sub:"So we can send your confirmation and reach you if anything changes.",
      city:"City", country:"Country",
      blockedTitle:"These dates aren't available",
      redo:"Choose other dates", close:"Close",
      nightsLabel:function(n){return n+(n>1?" nights":" night");},
      discountNote:"All prices in USD. The 5% direct discount is already included.",
      ack1:'By completing this booking, I agree with the <a href="/booking-conditions.html" target="_blank" rel="noopener">Booking Conditions</a>.',
      ack2:'I agree with the <a href="/privacy-policy.html" target="_blank" rel="noopener">Privacy Terms</a>.',
      next:"Continue", back:"Back",
      optional:"Optional. Continue if you need nothing here.",
      stepOf:function(n){return "Step "+n+" of 4";},
      waBtn:"Message us on WhatsApp",
      policySummary:"Payment & cancellation terms",
      scrollHint:function(n){return "\u2193 Scroll down for the "+n+" services";},
      stayLine:function(n){return "Stay \u00b7 "+n+(n>1?" nights":" night");},
      optsTitle:"A few details", babyCot:"We need a baby cot", pet:"We're bringing a pet (no extra charge)",
      servicesTitle:"Add a service, charged with your booking",
      activitiesTitle:"Interested in an activity?",
      activitiesNote:"Just tick what appeals to you: nothing is booked and nothing is charged here. It simply tells us what to prepare: we send you the details and prices on WhatsApp before you arrive, and you pay the provider directly.",
      beds:"2 double beds · up to 4 guests",
      perStay:"per stay", perNight:"per night", perPerson:"per person", perEach:"each", onRequest:"on request",
      totalLine:"Total", depositLine:"To pay today", balanceLine:"On arrival",
      recap:function(q){return q.nights+(q.nights>1?" nights":" night")+" from "+q.checkin+" to "+q.checkout+" · total "+q.m+" (5% direct discount included)";},
      policyFull:function(q){return "You pay "+q.d+" today by card, the full amount including taxes. Cancel up to 60 days before arrival: 96% refunded, the 4% card fee is not recoverable. After that: 50% refunded.";},
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
        guest_city_required:"Please enter your city.",
        guest_country_required:"Please enter your country.",
        ack_required:"Please tick both boxes to continue.",
        payment_not_succeeded:"The payment did not go through. Nothing was charged.",
        beds24_rate_limited:"Service is busy. Please try again in a minute.",
        booking_write_unconfirmed:"Your payment went through, but the automatic confirmation failed. We will email you within the hour. Please do not pay again.",
        fallback:"Something went wrong. Please try again, or message us on WhatsApp."
      }
    },
    fr: {
      title:"Réserver en direct", firstName:"Prénom", lastName:"Nom", email:"E-mail",
      phone:"WhatsApp", guests:"Voyageurs", go1:"Continuer vers le paiement", wait:"Un instant…",
      pay:"Payer", loading:"Chargement du montant…", confirming:"Confirmation…",
      secure:"Paiement par carte sécurisé · vous ne quittez pas lesrochesretreat.com",
      whatsapp:"Une question avant de payer ? On répond sur WhatsApp, en général en quelques minutes.",
      doneTitle:"C'est réservé.",
      s1Title:"Vos coordonn\u00e9es", s4Title:"Paiement",
      s1Sub:"Pour vous envoyer la confirmation et vous joindre si quelque chose change.",
      city:"Ville", country:"Pays",
      blockedTitle:"Ces dates ne sont pas disponibles",
      redo:"Choisir d'autres dates", close:"Fermer",
      nightsLabel:function(n){return n+(n>1?" nuits":" nuit");},
      discountNote:"Tous les prix sont en dollars US. La remise directe de 5 % est d\u00e9j\u00e0 comprise.",
      ack1:'En validant cette r\u00e9servation, j\'accepte les <a href="/fr/booking-conditions.html" target="_blank" rel="noopener">conditions de r\u00e9servation</a>.',
      ack2:'J\'accepte la <a href="/fr/privacy-policy.html" target="_blank" rel="noopener">politique de confidentialit\u00e9</a>.',
      next:"Suivant", back:"Retour",
      optional:"Facultatif. Passez à la suite si vous n'avez besoin de rien.",
      stepOf:function(n){return "\u00c9tape "+n+" sur 4";},
      waBtn:"\u00c9crire sur WhatsApp",
      policySummary:"Paiement et conditions d'annulation",
      scrollHint:function(n){return "\u2193 Faites d\u00e9filer pour voir les "+n+" services";},
      stayLine:function(n){return "S\u00e9jour \u00b7 "+n+(n>1?" nuits":" nuit");},
      optsTitle:"Quelques précisions", babyCot:"Nous avons besoin d'un lit bébé", pet:"Nous venons avec un animal (sans supplément)",
      servicesTitle:"Ajouter un service, facturé avec votre réservation",
      activitiesTitle:"Intéressé par une activité ?",
      activitiesNote:"Cochez simplement ce qui vous tente\u00a0: rien n'est réservé ni facturé ici. Cela nous dit quoi préparer : nous vous envoyons les détails et les tarifs sur WhatsApp avant votre arrivée, et vous réglez directement le prestataire.",
      beds:"2 lits doubles · jusqu'à 4 voyageurs",
      perStay:"le séjour", perNight:"la nuit", perPerson:"la personne", perEach:"l’unité", onRequest:"sur demande",
      totalLine:"Total", depositLine:"À payer aujourd'hui", balanceLine:"À l'arrivée",
      recap:function(q){return q.nights+(q.nights>1?" nuits":" nuit")+" du "+q.checkin+" au "+q.checkout+" · total "+q.m+" (remise directe de 5 % incluse)";},
      policyFull:function(q){return "Vous payez "+q.d+" aujourd'hui par carte, la totalité taxes comprises. Annulation jusqu'à 60 jours avant l'arrivée : 96 % remboursés, les 4 % de frais bancaires non récupérables. Au-delà : 50 % remboursés.";},
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
        guest_city_required:"Indiquez votre ville.",
        guest_country_required:"Indiquez votre pays.",
        ack_required:"Cochez les deux cases pour continuer.",
        payment_not_succeeded:"Le paiement n'a pas abouti. Aucun montant n'a été prélevé.",
        beds24_rate_limited:"Service momentanément occupé. Réessayez dans une minute.",
        booking_write_unconfirmed:"Votre paiement est bien passé, mais la confirmation automatique a échoué. Nous vous écrivons dans l'heure. Ne payez pas une seconde fois.",
        fallback:"Une erreur est survenue. Réessayez, ou écrivez-nous sur WhatsApp."
      }
    },
    es: {
      title:"Reservar directo", firstName:"Nombre", lastName:"Apellido", email:"Correo",
      phone:"WhatsApp", guests:"Huéspedes", go1:"Continuar al pago", wait:"Un momento…",
      pay:"Pagar", loading:"Cargando el monto…", confirming:"Confirmando…",
      secure:"Pago con tarjeta seguro · no sale de lesrochesretreat.com",
      whatsapp:"¿Alguna duda antes de pagar? Respondemos por WhatsApp, normalmente en minutos.",
      doneTitle:"Reserva confirmada.",
      s1Title:"Tus datos", s4Title:"Pago",
      s1Sub:"Para enviarte la confirmaci\u00f3n y contactarte si algo cambia.",
      city:"Ciudad", country:"Pa\u00eds",
      blockedTitle:"Estas fechas no est\u00e1n disponibles",
      redo:"Elegir otras fechas", close:"Cerrar",
      nightsLabel:function(n){return n+(n>1?" noches":" noche");},
      discountNote:"Todos los precios en d\u00f3lares US. El descuento directo del 5 % ya est\u00e1 incluido.",
      ack1:'Al completar esta reserva, acepto las <a href="/es/booking-conditions.html" target="_blank" rel="noopener">condiciones de reserva</a>.',
      ack2:'Acepto la <a href="/es/privacy-policy.html" target="_blank" rel="noopener">pol\u00edtica de privacidad</a>.',
      next:"Siguiente", back:"Atrás",
      optional:"Opcional. Continúa si no necesitas nada aquí.",
      stepOf:function(n){return "Paso "+n+" de 4";},
      waBtn:"Escr\u00edbenos por WhatsApp",
      policySummary:"Pago y condiciones de cancelaci\u00f3n",
      scrollHint:function(n){return "\u2193 Desliza para ver los "+n+" servicios";},
      stayLine:function(n){return "Estancia \u00b7 "+n+(n>1?" noches":" noche");},
      optsTitle:"Algunos detalles", babyCot:"Necesitamos una cuna", pet:"Venimos con una mascota (sin cargo)",
      servicesTitle:"Añadir un servicio, se cobra con su reserva",
      activitiesTitle:"¿Le interesa alguna actividad?",
      activitiesNote:"Marque simplemente lo que le atraiga: aquí no se reserva ni se cobra nada. Nos dice qué preparar: le enviamos los detalles y los precios por WhatsApp antes de su llegada, y usted paga directamente al proveedor.",
      beds:"2 camas dobles · hasta 4 huéspedes",
      perStay:"por estancia", perNight:"por noche", perPerson:"por persona", perEach:"por unidad", onRequest:"a consultar",
      totalLine:"Total", depositLine:"A pagar hoy", balanceLine:"A la llegada",
      recap:function(q){return q.nights+(q.nights>1?" noches":" noche")+" del "+q.checkin+" al "+q.checkout+" · total "+q.m+" (5 % de descuento directo incluido)";},
      policyFull:function(q){return "Pagas "+q.d+" hoy con tarjeta, el total con impuestos incluidos. Cancelación hasta 60 días antes de la llegada: se reembolsa el 96 %, la comisión bancaria del 4 % no es recuperable. Después: 50 % reembolsado.";},
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
        guest_city_required:"Indique su ciudad.",
        guest_country_required:"Indique su pa\u00eds.",
        ack_required:"Marca las dos casillas para continuar.",
        payment_not_succeeded:"El pago no se completó. No se cobró nada.",
        beds24_rate_limited:"Servicio ocupado. Intente en un minuto.",
        booking_write_unconfirmed:"Su pago se realizó, pero la confirmación automática falló. Le escribimos dentro de la hora. No pague de nuevo.",
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

  /* "2026-12-15" -> "15 dec. 2026", dans la langue de la page. */
  function jolieDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return iso || "";
    try {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
        .toLocaleDateString(LANG, { day: "numeric", month: "short", year: "numeric" });
    } catch (e) { return iso; }
  }

  /* Dessine les deux listes a partir des catalogues du serveur. */
  function paintCatalogs(services, activities) {
    var box = $("lr-services");
    if (!box.dataset.done) {
      box.innerHTML = services.map(function (e) {
        var prix = '<em class="lr-price">' +
          (e.priceCents == null ? L.onRequest : money(e.priceCents) + " " + unitLabel(e.unit)) +
          "</em>";
        var note = e.note ? '<em class="lr-hint">' + e.note + "</em>" : "";
        var qty = e.unit === "each"
          ? '<input type="number" class="lr-qty" data-for="' + e.key + '" min="1" max="' +
            (e.maxQty || 10) + '" value="1" disabled aria-label="' + e.label + '">'
          : "";
        return '<label class="lr-cb lr-sv-row"><input type="checkbox" class="lr-sv" value="' + e.key + '">' +
               '<span class="lr-sv-txt"><span class="lr-sv-top"><span>' + e.label + "</span>" + prix +
               "</span>" + note + "</span>" + qty + "</label>";
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
      else $("lr-hint2").textContent = L.scrollHint(services.length);
    }

    var abox = $("lr-activities");
    if (!abox.dataset.done) {
      abox.innerHTML = activities.map(function (e) {
        return '<label class="lr-ac-chip"><input type="checkbox" class="lr-ac" value="' + e.key + '">' +
               "<span>" + e.label + "</span></label>";
      }).join("");
      abox.dataset.done = "1";
      /* La pastille cochee se voit d'un coup d'oeil, sans dependre de :has(). */
      Array.prototype.forEach.call(abox.querySelectorAll(".lr-ac"), function (c) {
        c.addEventListener("change", function () {
          c.parentNode.classList.toggle("on", c.checked);
        });
      });
      if (!activities.length) {
        abox.hidden = true;
        document.querySelector('[data-t="activitiesTitle"]').hidden = true;
        document.querySelector('[data-t="activitiesNote"]').hidden = true;
      }
    }
  }

  /* Le detail complet, montre a l'etape paiement. */
  function paintTotals(q) {
    var rows = [[L.totalLine, money(q.totalCents), true]];
    if (q.balanceCents > 0) {
      rows = [[L.depositLine, money(q.depositCents), true], [L.balanceLine, money(q.balanceCents), false]];
    }
    $("lr-sum").innerHTML = rows.map(function (r) {
      return '<div class="' + (r[2] ? "lr-strong" : "") + '"><dt>' + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
    }).join("");
  }

  /**
   * Le panneau lateral, visible a toutes les etapes : la maison, les dates et
   * les montants. Le client ne decouvre jamais le prix a la derniere seconde,
   * et il sait toujours quelle villa il reserve.
   */
  function paintAside(q) {
    $("lr-villa").textContent = q.villa.name;
    $("lr-dates").textContent = jolieDate(q.checkin) + " \u2192 " + jolieDate(q.checkout);
    $("lr-meta").textContent = L.nightsLabel(q.nights) + " \u00b7 " + L.beds;

    /* Le detail d'abord : le client voit ce qu'il a ajoute, et combien ca
       pese, avant de voir le total. Les libelles viennent du catalogue, donc
       dans la langue de la page (ceux de serviceLines sont en francais,
       parce qu'ils partent dans Beds24 pour Marie et Martin). */
    var noms = {};
    (q.servicesCatalog || []).forEach(function (e) { noms[e.key] = e.label; });

    var html = ['<div class="lr-line"><span>' + L.stayLine(q.nights) +
                "</span><b>" + money(q.accommodationCents) + "</b></div>"];

    (q.serviceLines || []).forEach(function (l) {
      if (!l.quoted) return;
      var nom = noms[l.key] || l.label;
      if (l.qty > 1) nom += " \u00d7 " + l.qty;
      html.push('<div class="lr-line"><span>' + nom + "</span><b>" + money(l.cents) + "</b></div>");
    });

    html.push('<div class="lr-strong lr-total"><span>' + L.totalLine +
              "</span><b>" + money(q.totalCents) + "</b></div>");
    if (q.balanceCents > 0) {
      html.push("<div><span>" + L.depositLine + "</span><b>" + money(q.depositCents) + "</b></div>");
      html.push("<div><span>" + L.balanceLine + "</span><b>" + money(q.balanceCents) + "</b></div>");
    }
    $("lr-aside-sum").innerHTML = html.join("");
    $("lr-aside-note").textContent = L.discountNote;
    $("lr-aside-mini").innerHTML =
      "<b>" + L.totalLine + " " + money(q.totalCents) + "</b>" +
      (q.balanceCents > 0 ? L.depositLine + " " + money(q.depositCents) : "");
    $("lr-aside-err").hidden = true;
  }

  var timer = null;
  function refresh() { clearTimeout(timer); timer = setTimeout(load, 250); }

  function load() {
    post("/quote", { villa: villa, checkin: stay.checkin, checkout: stay.checkout, lang: LANG,
                     options: selectedOptions(), guest: { numAdult: Number($("lr-ad").value) || 2 } })
      .then(function (res) {
        if (!res.body.ok) return impasse(res.body.error);
        var q = res.body.quote || res.body;
        stay.quote = q;
        paintCatalogs(q.servicesCatalog || [], q.activitiesCatalog || []);
        var view = { nights:q.nights, checkin:q.checkin, checkout:q.checkout,
                     m:money(q.totalCents), d:money(q.depositCents), b:money(q.balanceCents) };
        paintAside(q);
        paintTotals(q);
        /* Le site encaisse toujours 100 % : une seule politique a afficher. */
        $("lr-pay-policy").textContent = L.policyFull(view);
        bloquer(false);
        if (!$("lr-blocked").hidden) goStep(etape);     /* on sortait d'une impasse */
        if (WA_BASE) {
          $("lr-wa").href = WA_BASE + "?text=" + encodeURIComponent(
            q.villa.name + " \u00b7 " + q.checkin + " / " + q.checkout + " \u00b7 ");
        }
      })
      .catch(function () { impasse(null); });
  }

  /**
   * Dates vendues ou devis impossible : on ne laisse pas le client devant un
   * formulaire qu'il ne peut pas valider. On dit pourquoi, on propose d'autres
   * dates, et le WhatsApp reste a cote.
   */
  function impasse(code) {
    ["lr-s1", "lr-s2", "lr-s3", "lr-s4", "lr-pay-done"].forEach(function (id) { $(id).hidden = true; });
    $("lr-steps").hidden = true;
    $("lr-blocked").hidden = false;
    $("lr-blocked-txt").textContent = say(code);
    $("lr-villa").textContent = NOMS[villa] || "";
    $("lr-dates").textContent = stay ? jolieDate(stay.checkin) + " \u2192 " + jolieDate(stay.checkout) : "";
    $("lr-meta").textContent = "";
    $("lr-aside-err").textContent = say(code);
    $("lr-aside-err").hidden = false;
    $("lr-aside-sum").innerHTML = "";
    $("lr-aside-note").textContent = "";
  }

  /* Tant que le devis n'a pas repondu, on n'avance pas. */
  function bloquer(oui) {
    ["lr-n1", "lr-n2", "lr-n3"].forEach(function (id) { $(id).disabled = !!oui; });
  }

  /* ---- La machine a etapes : 1 coordonnees, 2 services, 3 activites, 4 carte */

  var etape = 1;

  function goStep(n) {
    etape = n;
    $("lr-blocked").hidden = true;
    $("lr-pay-done").hidden = true;
    ["lr-s1", "lr-s2", "lr-s3", "lr-s4"].forEach(function (id, i) {
      $(id).hidden = (i + 1) !== n;
    });
    $("lr-steps").hidden = false;
    $("lr-step-txt").textContent = L.stepOf(n);
    Array.prototype.forEach.call($("lr-steps").querySelectorAll("i"), function (pt, i) {
      pt.className = i < n ? "on" : "";
    });
    /* Sur telephone, l'etape paiement se passe du panneau : le recapitulatif
       de l'etape dit deja les montants, et le formulaire de carte doit se
       voir sans defiler. Sur ordinateur la classe ne change rien. */
    $("lr-aside").classList.toggle("lr-aside-off", n === 4);
    $("lr-main").scrollTop = 0;
  }

  function indicatif() {
    var sel = $("lr-cc");
    return sel && sel.value ? "+" + sel.value : "";
  }

  function lireGuest() {
    return {
      firstName: $("lr-fn").value, lastName: $("lr-ln").value,
      email: $("lr-em").value,
      phone: (indicatif() + " " + $("lr-ph").value).trim(),
      city: $("lr-ci").value, country: $("lr-co").value,
      numAdult: Number($("lr-ad").value) || 2
    };
  }

  /* Les coordonnees sont verifiees ICI, pas au paiement : une faute de frappe
     doit se voir a l'etape ou on l'a faite, pas trois ecrans plus loin. */
  function etape1Suivant() {
    var g = lireGuest();
    if (!g.firstName.trim()) return fail1("guest_firstname_required");
    if (!g.lastName.trim()) return fail1("guest_lastname_required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(g.email)) return fail1("guest_email_invalid");
    if ($("lr-ph").value.replace(/\D/g, "").length < 6) return fail1("guest_phone_invalid");
    if (!g.city.trim()) return fail1("guest_city_required");
    if (!g.country.trim()) return fail1("guest_country_required");
    $("lr-err1").hidden = true;
    guest = g;
    goStep(2);
  }

  function open_() {
    var d = dates();
    if (!d) return;
    stay = d;
    guest = null;
    intentId = null;
    onvoInstance = null;
    if ($("lr-wallet")) $("lr-wallet").hidden = true;
    $("lr-onvo").innerHTML = "";
    $("lr-err1").hidden = true; $("lr-err2").hidden = true; $("lr-err3").hidden = true;
    $("lr-ack1").checked = false; $("lr-ack2").checked = false;
    $("lr-go2").disabled = true;
    goStep(1);
    bloquer(true);
    $("lr-villa").textContent = NOMS[villa] || "";
    $("lr-dates").textContent = jolieDate(stay.checkin) + " \u2192 " + jolieDate(stay.checkout);
    $("lr-meta").textContent = L.loading;
    $("lr-aside-sum").innerHTML = "";
    $("lr-aside-note").textContent = "";
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
  function fail3(code) { $("lr-err3").textContent = say(code); $("lr-err3").hidden = false; }

  /* Le bouton Payer ne s'active qu'une fois les deux cases cochees. */
  function majAck() {
    $("lr-go2").disabled = !($("lr-ack1").checked && $("lr-ack2").checked);
  }

  /**
   * Retour depuis la carte : on jette l'intention de paiement en cours.
   * Le client revient pour changer un service ou une activite, donc le montant
   * peut bouger. Une intention non payee expire d'elle-meme chez ONVO.
   */
  function retourCarte() {
    intentId = null;
    onvoInstance = null;
    if ($("lr-wallet")) $("lr-wallet").hidden = true;
    $("lr-onvo").innerHTML = "";
    $("lr-err2").hidden = true;
    $("lr-ack1").checked = false; $("lr-ack2").checked = false;
    $("lr-go2").disabled = true;
    goStep(3);
  }

  function versPaiement() {
    guest = lireGuest();
    $("lr-err3").hidden = true;
    $("lr-n3").disabled = true;
    $("lr-n3").textContent = L.wait;

    post("/intent", { villa: villa, checkin: stay.checkin, checkout: stay.checkout, lang: LANG,
                      guest: guest, options: selectedOptions() })
      .then(function (res) {
        $("lr-n3").disabled = false;
        $("lr-n3").textContent = L.go1;
        if (!res.body.ok) return fail3(res.body.error);
        intentId = res.body.paymentIntentId;
        goStep(4);
        $("lr-go2").textContent = L.pay + " " + money(res.body.amountCents);
        majAck();
        renderCard(res.body.publishableKey, intentId);
        offrirApplePay(res.body.publishableKey, intentId, res.body.amountCents);
      })
      .catch(function () {
        $("lr-n3").disabled = false;
        $("lr-n3").textContent = L.go1;
        fail3();
      });
  }

  /* Charge les deux scripts d'Apple Pay, une seule fois. Si l'un manque, on
     rend la main sans rien casser : le formulaire carte reste la voie normale. */
  var walletTried = false;
  function withWallet(then) {
    if (walletTried) return then();
    walletTried = true;
    var restants = 2, fini = function () { if (--restants === 0) then(); };
    [SDK_APPLE, SDK_ONVOJS].forEach(function (url) {
      var el = document.createElement("script");
      el.src = url; el.async = true;
      el.onload = fini; el.onerror = fini;
      document.head.appendChild(el);
    });
  }

  var WALLET_OR = { en: "or pay by card", fr: "ou payer par carte", es: "o paga con tarjeta" };

  /**
   * Propose Apple Pay a l'etape 4, en plus du formulaire carte.
   *
   * Le bouton n'apparait que si l'appareil ET le domaine conviennent : c'est
   * isAvailable() qui tranche. Tout echec est silencieux, le tunnel carte ne
   * doit jamais en patir.
   *
   * Le montant n'est pas choisi ici : l'intention existe deja cote serveur avec
   * sa somme et les metadonnees du sejour. Apple Pay ne fait que la payer.
   */
  function offrirApplePay(publicKey, paymentIntentId, amountCents) {
    try {
      var bloc = $("lr-wallet"), bouton = $("lr-apple");
      if (!bloc || !bouton || !publicKey) return;
      bloc.hidden = true;

      withWallet(function () {
        try {
          if (typeof window.ONVO !== "function") return;
          var onvojs = window.ONVO(publicKey);
          if (!onvojs || typeof onvojs.applePay !== "function") return;

          var applePay = onvojs.applePay({
            countryCode: "CR",
            currencyCode: "USD",
            total: { label: "Les Roches Retreat", amount: (amountCents / 100).toFixed(2) }
          });

          applePay.isAvailable().then(function (dispo) {
            if (!dispo) return;
            $("lr-wallet-or").textContent = WALLET_OR[LANG] || WALLET_OR.en;
            bloc.hidden = false;
          }).catch(function () {});

          bouton.onclick = function () {
            /* Les deux acceptations valent pour Apple Pay comme pour la carte. */
            if (!$("lr-ack1").checked || !$("lr-ack2").checked) return fail2("ack_required");
            $("lr-err2").hidden = true;

            /* begin() doit partir dans le clic lui-meme : Apple l'exige. */
            applePay.begin({
              onPaymentMethod: function (ev) {
                return post("/pay-wallet", {
                  paymentIntentId: paymentIntentId,
                  paymentMethodId: ev.paymentMethodId
                }).then(function (res) {
                  var ok = !!(res.body && res.body.ok);
                  ev.complete(ok ? "success" : "failure");
                  if (ok) { $("lr-go2").disabled = true; finish(); }
                  else fail2((res.body && res.body.error) || null);
                }).catch(function () {
                  ev.complete("failure");
                  fail2();
                });
              },
              onCancel: function () {},
              onError: function () { fail2(); }
            });
          };
        } catch (e) { /* Apple Pay indisponible : on n'affiche rien. */ }
      });
    } catch (e) { /* idem */ }
  }

  /**
   * Barre de reservation collante en bas d'ecran, sur mobile.
   *
   * Constat 4 de l'audit : le bouton de reservation est a 61 % de la profondeur
   * de la page, sans aucun rappel pendant le defilement. Un visiteur venu
   * d'Instagram fait quatre ecrans avant de voir un prix.
   *
   * Elle ne s'affiche que lorsque le bloc de reservation est hors de l'ecran,
   * et elle reprend le prix reel affiche par config.js — jamais un prix a elle.
   */
  function poserBarreCollante() {
    try {
      if (window.innerWidth > 860) return;
      var carte = document.querySelector(".sb-card") || $("sb-cta");
      if (!carte || $("lr-sticky")) return;

      var LBL = {
        en: { from: "from", night: "night", book: "Book" },
        fr: { from: "dès", night: "nuit", book: "Réserver" },
        es: { from: "desde", night: "noche", book: "Reservar" }
      };
      var T = LBL[LANG] || LBL.en;

      var barre = document.createElement("div");
      barre.id = "lr-sticky";
      barre.innerHTML =
        '<span id="lr-sticky-txt">' +
          '<span id="lr-sticky-price"></span>' +
          '<span id="lr-sticky-sub"></span>' +
        '</span>' +
        '<button type="button" id="lr-sticky-go">' + T.book + '</button>';
      document.body.appendChild(barre);

      /* Le prix vient de la page, pas d'un calcul a nous. */
      function majPrix() {
        var pv = document.querySelector(".sb-price-val");
        var tv = $("sb-total-val");
        var prix = pv ? pv.textContent.trim() : "";
        var total = tv ? tv.textContent.trim() : "";
        /* Dates choisies : on montre le total. Sinon le prix par nuit. */
        if (total && /\d/.test(total)) {
          $("lr-sticky-price").textContent = total;
          $("lr-sticky-sub").textContent = ($("sb-checkin") || {}).value && ($("sb-checkout") || {}).value
            ? ($("sb-checkin").value + " \u2192 " + $("sb-checkout").value) : "";
        } else if (prix) {
          $("lr-sticky-price").textContent = T.from + " " + prix.replace(/\s*\/.*$/, "");
          $("lr-sticky-sub").textContent = "/ " + T.night;
        }
      }
      majPrix();
      setInterval(majPrix, 1200);

      $("lr-sticky-go").onclick = function () {
        carte.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      /* On n'affiche la barre que quand le bloc de reservation a quitte l'ecran. */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          var visible = entries[0].isIntersecting;
          barre.classList.toggle("on", !visible);
          document.body.classList.toggle("lr-sticky-on", !visible);
        }, { threshold: 0.12 }).observe(carte);
      }
    } catch (e) { /* la barre est un bonus : jamais bloquante */ }
  }

  var CHARGEMENT = {
    en: "Loading secure payment\u2026",
    fr: "Chargement du paiement s\u00e9curis\u00e9\u2026",
    es: "Cargando el pago seguro\u2026"
  };

  /**
   * Marque d'une etoile les champs que le tunnel exige.
   *
   * Constat 14 : les six champs de l'etape 1 sont obligatoires sans que rien
   * ne le dise, et la validation ne signale qu'une erreur a la fois. L'etoile
   * se pose depuis l'attribut `required` du champ : elle ne peut donc pas
   * mentir sur ce qui est reellement exige.
   */
  function marquerObligatoires() {
    try {
      var vus = {};
      [].forEach.call(document.querySelectorAll("#lr-pay label input[required]"), function (inp) {
        var lab = inp.closest("label");
        if (!lab) return;
        var span = lab.querySelector("span[data-t]");
        if (!span || vus[span.getAttribute("data-t")]) return;
        if (span.querySelector(".lr-req")) return;
        var et = document.createElement("span");
        et.className = "lr-req";
        et.setAttribute("aria-hidden", "true");
        et.textContent = " *";
        span.appendChild(et);
        vus[span.getAttribute("data-t")] = true;
        inp.setAttribute("aria-required", "true");
      });
    } catch (e) { /* cosmetique : jamais bloquant */ }
  }

  function renderCard(publicKey, paymentIntentId) {
    /* Le widget ONVO met plusieurs secondes a se monter. Sans ce mot, le client
       voit un cadre blanc vide a l'instant precis ou il sort sa carte. */
    $("lr-onvo").innerHTML =
      '<p style="margin:0;padding:62px 0;text-align:center;font-size:13px;color:#8a857d">' +
      (CHARGEMENT[LANG] || CHARGEMENT.en) + '</p>';
    onvoInstance = window.onvo.pay({
      publicKey: publicKey,
      paymentIntentId: paymentIntentId,
      paymentType: "one_time",
      /* ONVO ne connait que "es" et "en" (doc, section Locale) — et retombe en
         espagnol si on ne dit rien. La fiche espagnole a donc son formulaire
         en espagnol ; la francaise prend l'anglais, faute de mieux. */
      locale: LANG === "es" ? "es" : "en",
      manualSubmit: true,      /* le bouton est le notre */
      onSuccess: function () { finish(); },
      onError: function (e) {
        fail2((e && e.details && e.details.card && e.details.card.reason) || null);
        majAck();
      }
    });
    onvoInstance.render("#lr-onvo");

    $("lr-go2").onclick = function () {
      /* Ceinture et bretelles : le bouton est deja desactive, mais on ne lance
         jamais un paiement sans les deux acceptations. */
      if (!$("lr-ack1").checked || !$("lr-ack2").checked) return fail2("ack_required");
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
        $("lr-s4").hidden = true;
        $("lr-steps").hidden = true;
        $("lr-pay-done").hidden = false;
        $("lr-done-txt").textContent = L.done(guest, res.body.bookingId);
      })
      .catch(function () { fail2("booking_write_unconfirmed"); });
  }

  function init() {
    var mm = document.documentElement.innerHTML.match(/booking2\.php\?propid=(\d+)/);
    villa = mm ? PROPS[mm[1]] : null;
    if (!villa) return;                    /* page sans villa identifiable : on ne touche a rien */

    if (!$("sb-cta")) return;

    poserBarreCollante();

    /* Indicatifs WhatsApp + liste de pays, dans la langue de la page.
       Le pays par defaut suit la langue : un visiteur francophone compose
       presque toujours un +33. */
    var col = LANG === "fr" ? 3 : LANG === "es" ? 4 : 2;
    var parDefaut = LANG === "fr" ? "FR" : LANG === "es" ? "ES" : "US";
    $("lr-cc").innerHTML = PAYS.map(function (c) {
      return '<option value="' + c[1] + '"' + (c[0] === parDefaut ? " selected" : "") +
             ">" + c[col] + " +" + c[1] + "</option>";
    }).join("");
    /* Le pays de residence reste libre : la liste suggere, elle n'enferme pas. */
    $("lr-countries").innerHTML = PAYS.map(function (c) {
      return '<option value="' + c[col] + '"></option>';
    }).join("");

    $("lr-ack1-t").innerHTML = L.ack1;
    $("lr-ack2-t").innerHTML = L.ack2;

    /* Remplit les libelles dans la langue de la page. */
    $("lr-pay-title").textContent = L.title;
    $("lr-n1").textContent = L.next;
    $("lr-n2").textContent = L.next;
    $("lr-n3").textContent = L.go1;
    $("lr-b2").textContent = L.back;
    $("lr-b3").textContent = L.back;
    $("lr-b4").textContent = L.back;
    $("lr-redo").textContent = L.redo;
    $("lr-wa-t").textContent = L.waBtn;
    /* Ordinateur : la politique est deroulee, il y a la place. Telephone :
       repliee, pour que la carte reste visible. */
    $("lr-close2").textContent = L.close;
    Array.prototype.forEach.call(document.querySelectorAll("#lr-pay [data-t]"), function (el) {
      var k = el.getAttribute("data-t");
      if (L[k]) el.textContent = L[k];
    });

    /* Apres les libelles : cette boucle ecrase le contenu des spans, donc
       l'etoile doit se poser ensuite, jamais avant. */
    marquerObligatoires();

    /* Reprend le numero WhatsApp deja present sur la page : un seul a maintenir. */
    var wa = document.querySelector('a[href*="wa.me/"]');
    if (wa) { WA_BASE = (wa.getAttribute("href") || "").split("?")[0]; $("lr-wa").href = WA_BASE; }
    else { $("lr-wa-box").hidden = true; }

    $("lr-pay-close").addEventListener("click", close_);
    $("lr-pay").addEventListener("click", function (e) { if (e.target === $("lr-pay")) close_(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("lr-pay").hidden) close_(); });
    $("lr-n1").addEventListener("click", etape1Suivant);
    $("lr-n2").addEventListener("click", function () { goStep(3); });
    $("lr-n3").addEventListener("click", versPaiement);
    $("lr-b2").addEventListener("click", function () { goStep(1); });
    $("lr-b3").addEventListener("click", function () { goStep(2); });
    $("lr-b4").addEventListener("click", retourCarte);
    $("lr-cot").addEventListener("change", refresh);
    $("lr-pet").addEventListener("change", refresh);
    $("lr-ad").addEventListener("change", refresh);
    $("lr-ack1").addEventListener("change", majAck);
    $("lr-ack2").addEventListener("change", majAck);
    $("lr-aside-toggle").addEventListener("click", function () {
      var ouvert = $("lr-aside").classList.toggle("open");
      $("lr-aside-toggle").setAttribute("aria-expanded", ouvert ? "true" : "false");
    });
    $("lr-redo").addEventListener("click", close_);
    $("lr-close2").addEventListener("click", close_);

    /* A partir d'ici l'intercepteur a de quoi ouvrir la modale. */
    OUVRIR = open_;
    if (clicEnAttente) { clicEnAttente = false; open_(); }
  }

    init();

  }
})();
