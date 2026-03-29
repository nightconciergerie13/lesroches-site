/* ═══════════════════════════════════════════════════════════════
   LES ROCHES — Date Range Picker  v3
   Remplace flatpickr — aucune dépendance externe

   ── CORRECTIFS v3 ──────────────────────────────────────────────
   • Sélection sur mousedown (pas click) : évite la race condition
     entre mouseover→_render() et le clic natif du navigateur.
   • Hover preview sans reconstruire le DOM : classes CSS ajoutées
     directement sur les spans existants → spans restent stables.
   • position:fixed pour fonctionner dans tous les contextes.

   Options :
     onChange(selectedDates)   callback quand la plage est choisie
     onClear()                 callback quand on efface
     anchor                    Element DOM pour le positionnement
     triggers                  Array d'éléments dont le mousedown
                               ne ferme PAS le picker
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
                   'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  var DAYS_FR   = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

  var _instanceCount = 0;

  /* ── helpers ── */
  function ymd(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function parseYMD(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  /* ═══════════════════════════════════════════════════════════ */
  function LRPicker(startInput, endInput, opts) {
    this.startInput  = startInput;
    this.endInput    = endInput;
    this.opts        = opts || {};
    this.todayStr    = ymd(new Date());
    this._disabled   = [];
    this._startStr   = null;
    this._endStr     = null;
    this._open       = false;
    this._id         = ++_instanceCount;
    this._triggers   = this.opts.triggers || [];

    var now = new Date();
    this._viewYear  = now.getFullYear();
    this._viewMonth = now.getMonth();

    this._buildDOM();
    this._bindEvents();
  }

  LRPicker.prototype = {

    /* ── API publique ─────────────────────────────────────────── */
    open: function () {
      if (this._open) return;
      this._open = true;
      this._openedAt = Date.now(); /* ── protection anti-scroll mobile ── */
      this._cal.style.display = 'flex';
      this._position();
      this._render();
    },
    close: function () {
      if (!this._open) return;
      this._open = false;
      this._cal.style.display = 'none';
    },
    set: function (key, val) {
      if (key === 'disable') {
        this._disabled = (val || []).map(function (d) { return String(d); });
        if (this._open) this._render();
      }
    },
    /* Pré-remplit les dates programmatiquement (ex: depuis URL params)
       startStr / endStr au format 'YYYY-MM-DD' */
    setDates: function (startStr, endStr) {
      if (!startStr) return;
      this._startStr = String(startStr);
      this._endStr   = endStr ? String(endStr) : null;
      if (this.startInput) this.startInput.value = this._startStr;
      if (this.endInput)   this.endInput.value   = this._endStr || '';
      /* met à jour le mois affiché */
      var d = new Date(this._startStr + 'T00:00:00');
      if (!isNaN(d)) { this._curYear = d.getFullYear(); this._curMonth = d.getMonth(); }
      if (this._open) this._render();
      /* déclenche onChange si les deux dates sont présentes */
      if (this._startStr && this._endStr && typeof this.opts.onChange === 'function') {
        this.opts.onChange([parseYMD(this._startStr), parseYMD(this._endStr)]);
      }
    },

    /* ── construction du DOM ──────────────────────────────────── */
    _buildDOM: function () {
      var id  = this._id;
      var cal = document.createElement('div');
      cal.className     = 'lrp-calendar';
      cal.style.display = 'none';
      cal.innerHTML =
        '<div class="lrp-months">' +
          '<div class="lrp-month-pane lrp-L' + id + '"></div>' +
          '<div class="lrp-month-pane lrp-R' + id + '"></div>' +
        '</div>' +
        '<div class="lrp-footer">' +
          '<span class="lrp-clear">Effacer</span>' +
        '</div>';
      document.body.appendChild(cal);
      this._cal = cal;
    },

    /* ── événements ───────────────────────────────────────────── */
    _bindEvents: function () {
      var self = this;

      /* ── Fermer au clic EXTÉRIEUR (mousedown capture) ── */
      document.addEventListener('mousedown', function (e) {
        if (!self._open) return;
        if (self._cal.contains(e.target)) return;
        if (e.target === self.startInput || e.target === self.endInput) return;
        for (var i = 0; i < self._triggers.length; i++) {
          if (self._triggers[i] && self._triggers[i].contains(e.target)) return;
        }
        /* Classes parentes compatibles */
        var el = e.target;
        while (el) {
          if (el.classList && (
            el.classList.contains('sb-field') ||
            el.classList.contains('ds-field') ||
            el.classList.contains('fp-field')
          )) return;
          el = el.parentElement;
        }
        self.close();
      }, true);

      /* ── Sélection d'un jour sur MOUSEDOWN (desktop) ── */
      /* CORRECTION v3 : mousedown (pas click) évite la race condition
         entre mouseover→_render() et l'événement click natif. */
      this._cal.addEventListener('mousedown', function (e) {
        var t = e.target;
        /* Navigation mois */
        if (t.classList.contains('lrp-prev') || t.classList.contains('lrp-next')) return;
        /* Jour valide */
        if (t.classList.contains('lrp-day') &&
            !t.classList.contains('lrp-disabled') &&
            !t.classList.contains('lrp-empty')) {
          e.preventDefault(); /* pas de focus/blur/text-select */
          self._selectDay(t.dataset.date);
        }
      });

      /* ── Sélection d'un jour sur TOUCHEND (mobile) ── */
      /* Sur mobile, mousedown n'est pas toujours fiable — on écoute aussi touchend. */
      this._cal.addEventListener('touchend', function (e) {
        var t = document.elementFromPoint(
          e.changedTouches[0].clientX,
          e.changedTouches[0].clientY
        );
        if (!t) return;
        /* Navigation mois */
        if (t.classList.contains('lrp-prev') || t.classList.contains('lrp-next')) return;
        /* Jour valide */
        if (t.classList.contains('lrp-day') &&
            !t.classList.contains('lrp-disabled') &&
            !t.classList.contains('lrp-empty')) {
          e.preventDefault(); /* empêche le mousedown/click synthétique en double */
          self._openedAt = Date.now(); /* réinitialise la grâce pour éviter fermeture au scroll */
          self._selectDay(t.dataset.date);
        }
      }, { passive: false });

      /* ── Navigation (prev/next mois) sur click ── */
      this._cal.addEventListener('click', function (e) {
        var t = e.target;
        if (t.classList.contains('lrp-prev')) {
          self._viewMonth--;
          if (self._viewMonth < 0) { self._viewMonth = 11; self._viewYear--; }
          self._render(); return;
        }
        if (t.classList.contains('lrp-next')) {
          self._viewMonth++;
          if (self._viewMonth > 11) { self._viewMonth = 0; self._viewYear++; }
          self._render(); return;
        }
      });

      /* ── Effacer ── */
      this._cal.querySelector('.lrp-clear').addEventListener('click', function () {
        self._startStr = null;
        self._endStr   = null;
        if (self.startInput) self.startInput.value = '';
        if (self.endInput)   self.endInput.value   = '';
        if (self.opts.onClear) self.opts.onClear();
        self._render();
      });

      /* ── Hover preview : mise à jour des classes sans reconstruire le DOM ── */
      /* CORRECTION v3 : on ne appelle plus _render() dans mouseover.
         Les spans restent stables → mousedown peut fiabilement les cibler. */
      this._cal.addEventListener('mouseover', function (e) {
        if (!self._startStr || self._endStr) return; /* seulement pendant la 2e sélection */
        var t = e.target;
        if (!t.classList.contains('lrp-day') || t.classList.contains('lrp-disabled')) return;
        var hovered = t.dataset.date;
        if (!hovered) return;
        /* Mettre à jour les classes lrp-inrange sur tous les spans existants */
        var spans = self._cal.querySelectorAll('.lrp-day[data-date]');
        for (var i = 0; i < spans.length; i++) {
          var s = spans[i];
          var d = s.dataset.date;
          var inRange = (self._startStr < d && d < hovered) || (hovered < d && d < self._startStr);
          s.classList.toggle('lrp-inrange', inRange);
        }
      });
      this._cal.addEventListener('mouseleave', function () {
        /* Retirer le hover preview quand la souris sort */
        if (!self._startStr || self._endStr) return;
        var spans = self._cal.querySelectorAll('.lrp-day.lrp-inrange');
        for (var i = 0; i < spans.length; i++) {
          spans[i].classList.remove('lrp-inrange');
        }
      });

      /* ── Scroll : le calendrier reste ouvert (position:fixed, ne suit pas le scroll) ── */
      /* Fermeture uniquement via sélection de dates ou clic extérieur. */
    },

    /* ── sélection ───────────────────────────────────────────── */
    _selectDay: function (ds) {
      if (!this._startStr || this._endStr) {
        /* Début d'une nouvelle plage */
        this._startStr = ds;
        this._endStr   = null;
        if (this.startInput) this.startInput.value = ds;
        if (this.endInput)   this.endInput.value   = '';
      } else {
        /* Fin de la plage */
        if (ds < this._startStr) {
          this._endStr   = this._startStr;
          this._startStr = ds;
        } else {
          this._endStr = ds;
        }
        if (this.startInput) this.startInput.value = this._startStr;
        if (this.endInput)   this.endInput.value   = this._endStr;
        if (this.opts.onChange) {
          this.opts.onChange([parseYMD(this._startStr), parseYMD(this._endStr)]);
        }
        var self = this;
        setTimeout(function () { self.close(); }, 280);
      }
      this._render();
    },

    /* ── rendu ───────────────────────────────────────────────── */
    _isDisabled: function (ds) {
      if (ds < this.todayStr) return true;
      return this._disabled.indexOf(ds) !== -1;
    },

    _render: function () {
      var id = this._id;
      var L = this._cal.querySelector('.lrp-L' + id);
      var R = this._cal.querySelector('.lrp-R' + id);
      L.innerHTML = this._renderMonth(this._viewYear, this._viewMonth, true, false);
      var ry = (this._viewMonth === 11) ? this._viewYear + 1 : this._viewYear;
      var rm = (this._viewMonth === 11) ? 0 : this._viewMonth + 1;
      R.innerHTML = this._renderMonth(ry, rm, false, true);
    },

    _renderMonth: function (year, month, showPrev, showNext) {
      var html = '<div class="lrp-month-header">';
      html += showPrev ? '<button class="lrp-nav lrp-prev" type="button">&#8249;</button>' : '<span></span>';
      html += '<span class="lrp-month-title">' + MONTHS_FR[month] + ' ' + year + '</span>';
      html += showNext ? '<button class="lrp-nav lrp-next" type="button">&#8250;</button>' : '<span></span>';
      html += '</div>';

      html += '<div class="lrp-weekdays">';
      for (var w = 0; w < DAYS_FR.length; w++) {
        html += '<span class="lrp-wd">' + DAYS_FR[w] + '</span>';
      }
      html += '</div>';

      html += '<div class="lrp-days">';
      var first  = new Date(year, month, 1).getDay();
      var offset = (first === 0) ? 6 : first - 1;
      for (var i = 0; i < offset; i++) html += '<span class="lrp-day lrp-empty"></span>';

      var daysInMonth = new Date(year, month + 1, 0).getDate();

      for (var d = 1; d <= daysInMonth; d++) {
        var ds  = year + '-' +
                  String(month + 1).padStart(2, '0') + '-' +
                  String(d).padStart(2, '0');
        var cls = 'lrp-day';

        if (this._isDisabled(ds)) {
          cls += ' lrp-disabled';
        } else {
          if (ds === this.todayStr)  cls += ' lrp-today';
          if (ds === this._startStr) cls += ' lrp-selected lrp-start';
          if (this._endStr && ds === this._endStr) cls += ' lrp-selected lrp-end';
          if (this._startStr && this._endStr && ds > this._startStr && ds < this._endStr) {
            cls += ' lrp-inrange';
          }
        }
        html += '<span class="' + cls + '" data-date="' + ds + '">' + d + '</span>';
      }
      html += '</div>';
      return html;
    },

    /* ── positionnement (position:fixed → coordonnées viewport) ─ */
    _position: function () {
      var anchorEl = this.opts.anchor;
      if (!anchorEl && this.startInput) {
        anchorEl = this.startInput.closest('.sb-dates-row') ||
                   this.startInput.closest('.fh-search')    ||
                   this.startInput.closest('.ds-field')      ||
                   this.startInput;
      }
      if (!anchorEl) return;

      /* ── Mobile : épinglé en haut du viewport, scrollable ── */
      if (window.innerWidth <= 640) {
        this._cal.style.top  = '10px';
        this._cal.style.left = '10px';
        return;
      }

      var r    = anchorEl.getBoundingClientRect();
      var top  = r.bottom + 8;
      var left = r.left;

      /* Largeur responsive */
      var calW = Math.min(580, window.innerWidth - 20);
      this._cal.style.maxWidth = calW + 'px';
      if (left + calW > window.innerWidth - 10) left = window.innerWidth - calW - 10;
      if (left < 8) left = 8;

      /* Flip vers le haut si pas assez de place en bas */
      var calH = 390;
      if (top + calH > window.innerHeight - 10) {
        top = Math.max(8, r.top - calH - 8);
      }

      this._cal.style.top  = top  + 'px';
      this._cal.style.left = left + 'px';
    }
  };

  global.LRPicker = LRPicker;

})(window);
