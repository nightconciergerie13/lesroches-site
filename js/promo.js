/* Les Roches — Promo Code System */
(function () {
  var _disc = 0;
  var _raw = 0;

  function injectUI() {
    var cta = document.getElementById('sb-cta');
    if (!cta) return;
    var wrap = document.createElement('div');
    wrap.className = 'sb-promo';
    wrap.id = 'sb-promo-wrap';
    wrap.innerHTML = '<div class="sb-promo-row">' +
      '<input type="text" id="sb-promo-code" class="sb-promo-input" placeholder="Promo code" autocomplete="off" ' +
      'onkeydown="if(event.key===\'Enter\'){window.applyPromo();}" />' +
      '<button type="button" class="sb-promo-btn" id="sb-promo-btn" onclick="window.applyPromo()">Apply</button>' +
      '</div><div class="sb-promo-msg" id="sb-promo-msg"></div>';
    cta.parentNode.insertBefore(wrap, cta);

    var totalEl = document.getElementById('sb-total-val');
    if (totalEl) {
      new MutationObserver(function () {
        var txt = totalEl.textContent || '';
        var t = parseInt(txt.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(t) && t > 10 && t !== _raw) {
          _raw = t;
          if (_disc > 0) {
            var msg = document.getElementById('sb-promo-msg');
            if (msg) { msg.className = 'sb-promo-msg ok'; msg.textContent = _disc + '% discount applied!'; }
            totalEl.textContent = '$' + Math.round(_raw * (1 - _disc / 100)).toLocaleString('en-US');
          }
        }
      }).observe(totalEl, { childList: true, characterData: true, subtree: true });
    }
  }

  window.applyPromo = async function () {
    var inp = document.getElementById('sb-promo-code');
    var msg = document.getElementById('sb-promo-msg');
    var btn = document.getElementById('sb-promo-btn');
    var code = inp ? inp.value.trim().toUpperCase() : '';
    if (!code) { if (msg) msg.textContent = ''; return; }
    if (msg) { msg.className = 'sb-promo-msg'; msg.textContent = 'Checking…'; }
    if (btn) btn.disabled = true;
    try {
      var SB = 'https://vrufclzcaswkdgrffdwm.supabase.co';
      var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydWZjbHpjYXN3a2RncmZmZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTE2MjgsImV4cCI6MjA4OTg2NzYyOH0.cHllj6HZms7qf5PVc3LPy057r3rvCv6JyjfAfVlH34E';
      var h = { apikey: KEY, Authorization: 'Bearer ' + KEY };
      var r = await fetch(SB + '/rest/v1/promo_codes?code=eq.' + encodeURIComponent(code) + '&active=eq.true&select=code,discount_pct', { headers: h });
      var data = await r.json();
      if (data && data.length > 0) {
        _disc = data[0].discount_pct;
        if (msg) { msg.className = 'sb-promo-msg ok'; msg.textContent = _disc + '% discount applied!'; }
        var el = document.getElementById('sb-total-val');
        if (el) {
          var cur = parseInt((el.textContent || '').replace(/[^0-9]/g, ''), 10);
          if (!isNaN(cur) && cur > 10) { _raw = _raw || cur; el.textContent = '$' + Math.round(_raw * (1 - _disc / 100)).toLocaleString('en-US'); }
        }
      } else {
        _disc = 0; _raw = 0;
        if (msg) { msg.className = 'sb-promo-msg err'; msg.textContent = 'Invalid or expired code.'; }
      }
    } catch (e) {
      if (msg) { msg.className = 'sb-promo-msg err'; msg.textContent = 'Error. Please try again.'; }
    }
    if (btn) btn.disabled = false;
  };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', injectUI); }
  else { injectUI(); }
})();
