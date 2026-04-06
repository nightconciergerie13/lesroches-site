/* Les Roches — Promo Code System */
(function () {

  /* ── Inject styles ── */
  var style = document.createElement('style');
  style.textContent = [
    '.sb-promo{margin-bottom:.9rem}',
    '.sb-promo-label{font-family:"Outfit",sans-serif;font-size:.44rem;letter-spacing:.12em;text-transform:uppercase;color:var(--mid,#9a8f82);margin-bottom:.5rem;display:block}',
    '.sb-promo-row{display:flex;gap:0;border:1px solid var(--c2,#e2d9cc);border-radius:2px;overflow:hidden;background:var(--w,#faf7f2)}',
    '.sb-promo-input{flex:1;border:none;background:transparent;padding:.7rem .9rem;font-family:"Outfit",sans-serif;font-size:.62rem;color:var(--ink,#1e1b18);outline:none}',
    '.sb-promo-input::placeholder{color:var(--mid,#9a8f82);opacity:.7}',
    '.sb-promo-btn{border:none;background:transparent;padding:.7rem 1rem;font-family:"Outfit",sans-serif;font-size:.5rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ter,#b8734a);cursor:pointer;white-space:nowrap;border-left:1px solid var(--c2,#e2d9cc);transition:background .18s,color .18s}',
    '.sb-promo-btn:hover{background:var(--ter,#b8734a);color:#fff}',
    '.sb-promo-btn:disabled{opacity:.45;cursor:not-allowed}',
    '.sb-promo-msg{font-family:"Outfit",sans-serif;font-size:.52rem;margin-top:.45rem;min-height:1rem;padding:0 .1rem}',
    '.sb-promo-msg.ok{color:#5a8a5a}',
    '.sb-promo-msg.err{color:#b85a4a}',
  ].join('');
  document.head.appendChild(style);

  var _disc = 0;
  var _raw  = 0;

  function injectUI() {
    var cta = document.getElementById('sb-cta');
    if (!cta) return;
    var wrap = document.createElement('div');
    wrap.className = 'sb-promo';
    wrap.id = 'sb-promo-wrap';
    wrap.innerHTML =
      '<span class="sb-promo-label">Promo code</span>' +
      '<div class="sb-promo-row">' +
        '<input type="text" id="sb-promo-code" class="sb-promo-input" placeholder="Enter your code" autocomplete="off" ' +
        'onkeydown="if(event.key===\'Enter\'){window.applyPromo();}" />' +
        '<button type="button" class="sb-promo-btn" id="sb-promo-btn" onclick="window.applyPromo()">Apply</button>' +
      '</div>' +
      '<div class="sb-promo-msg" id="sb-promo-msg"></div>';
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
      var SB  = 'https://vrufclzcaswkdgrffdwm.supabase.co';
      var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydWZjbHpjYXN3a2RncmZmZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTE2MjgsImV4cCI6MjA4OTg2NzYyOH0.cHllj6HZms7qf5PVc3LPy057r3rvCv6JyjfAfVlH34E';
      var h   = { apikey: KEY, Authorization: 'Bearer ' + KEY };
      var r   = await fetch(SB + '/rest/v1/promo_codes?code=eq.' + encodeURIComponent(code) + '&active=eq.true&select=code,discount_pct', { headers: h });
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
