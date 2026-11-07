// =========================================
// SALLADSHUSET — Vanilla JS
// - Mobile nav toggle
// - Fade-in-on-scroll via IntersectionObserver
// - Live öppet/stängt (öppettiderna går över midnatt tis–lör)
// - Dagens rad markerad i öppettidstabellen
// =========================================

(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var toggle = document.querySelector('.nav-toggle');
  var navList = document.querySelector('.nav-list');

  if (toggle && navList) {
    toggle.addEventListener('click', function () {
      var isOpen = navList.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navList.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navList.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // Verifierade öppettider (Google Places). close < open betyder att
  // passet går över midnatt in på nästa kalenderdygn.
  var DAYS = ['mån', 'tis', 'ons', 'tor', 'fre', 'lör', 'sön'];
  var HOURS = {
    'mån': null,
    'tis': { open: 15 * 60, close: 1 * 60 },
    'ons': { open: 16 * 60, close: 3 * 60 },
    'tor': { open: 16 * 60, close: 3 * 60 },
    'fre': { open: 16 * 60, close: 3 * 60 },
    'lör': { open: 16 * 60, close: 3 * 60 },
    'sön': null
  };

  function updateOpenStatus() {
    var statusEl = document.getElementById('open-status');
    if (!statusEl) return;

    var now = new Date();
    var formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Stockholm', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    });
    var parts = formatter.formatToParts(now);
    var weekday = parts.find(function (p) { return p.type === 'weekday'; }).value;
    var hour = parseInt(parts.find(function (p) { return p.type === 'hour'; }).value, 10);
    var minute = parseInt(parts.find(function (p) { return p.type === 'minute'; }).value, 10);
    var minutes = hour * 60 + minute;

    var todayIdx = DAYS.indexOf(weekday);
    var today = HOURS[weekday];
    var yesterday = HOURS[DAYS[(todayIdx + 6) % 7]];

    var isOpen = false;

    if (today) {
      if (today.close > today.open) {
        // Samma dygn (används inte just nu, men robust om öppettider ändras).
        if (minutes >= today.open && minutes < today.close) isOpen = true;
      } else {
        // Passet går över midnatt — öppet från open-tiden och natten ut.
        if (minutes >= today.open) isOpen = true;
      }
    }
    if (!isOpen && yesterday && yesterday.close <= yesterday.open) {
      // Spill över från gårdagens nattöppna pass.
      if (minutes < yesterday.close) isOpen = true;
    }

    statusEl.innerHTML = '';
    var dot = document.createElement('span');
    dot.classList.add('dot');
    var label = document.createElement('span');
    label.textContent = isOpen ? 'Just nu öppet' : 'Just nu stängt';
    statusEl.classList.toggle('is-open', isOpen);
    statusEl.classList.toggle('is-closed', !isOpen);
    statusEl.appendChild(dot);
    statusEl.appendChild(label);

    document.querySelectorAll('.hours-table tr').forEach(function (row) {
      row.classList.toggle('is-today', row.dataset.day === weekday);
    });
  }

  updateOpenStatus();

})();
