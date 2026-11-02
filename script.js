/* GDG Kolachi replica — scroll-driven animations in vanilla JS (no libraries).
   All effects are tied to scroll position, matching the original's behaviour:
   hero phrase cycle, mission word reveal, flagship card fan, audience
   highlight, team brightening, and drag-to-scroll gallery. */

(function () {
  'use strict';

  var ticking = false;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* ---------- Hero phrase cycle ---------- */
  var heroStage = document.getElementById('hero');
  var phrases = Array.prototype.slice.call(document.querySelectorAll('.hero-phrase'));
  var heroBar = document.querySelector('.hero-progress span');
  var currentPhrase = -1;

  function updateHero() {
    var top = heroStage.offsetTop;
    var span = heroStage.offsetHeight - window.innerHeight;
    var p = span > 0 ? clamp((window.scrollY - top) / span, 0, 1) : 0;
    var idx = Math.min(phrases.length - 1, Math.floor(p * phrases.length));
    if (idx !== currentPhrase) {
      currentPhrase = idx;
      phrases.forEach(function (el, i) {
        el.classList.toggle('is-current', i === idx);
        el.classList.toggle('is-past', i < idx);
      });
      if (heroBar) heroBar.style.width = ((idx + 1) / phrases.length * 100) + '%';
    }
  }

  /* ---------- Mission word-by-word reveal ---------- */
  var missionEl = document.getElementById('missionText');
  var missionWords = [];
  if (missionEl) {
    var text = missionEl.textContent.trim().split(/\s+/);
    missionEl.innerHTML = text.map(function (w) {
      return '<span class="w">' + w + '</span>';
    }).join(' ');
    missionWords = Array.prototype.slice.call(missionEl.querySelectorAll('.w'));
  }

  function updateMission() {
    if (!missionWords.length) return;
    var rect = missionEl.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = clamp((vh * 0.85 - rect.top) / (rect.height + vh * 0.3), 0, 1);
    var litCount = Math.floor(p * missionWords.length);
    missionWords.forEach(function (el, i) {
      el.classList.toggle('lit', i < litCount);
    });
  }

  /* ---------- Flagship fan ---------- */
  var flagshipStage = document.getElementById('flagship');
  var scrollDownEl = document.querySelector('.scroll-down');
  var flagshipScene = document.querySelector('.flagship-scene');
  var truckBox = document.querySelector('.truck-box');
  var fanCards = Array.prototype.slice.call(document.querySelectorAll('.fan-card'));

  function updateFlagship() {
    var top = flagshipStage.offsetTop;
    var span = flagshipStage.offsetHeight - window.innerHeight;
    var p = span > 0 ? clamp((window.scrollY - top) / span, 0, 1) : 0;
    if (scrollDownEl) scrollDownEl.style.opacity = String(Math.max(0, 1 - p * 3));
    var fanP = clamp((p - 0.25) / 0.5, 0, 1);
    fanCards.forEach(function (card, i) {
      var off = i - 2;
      var x = off * 200 * fanP;
      var y = Math.abs(off) * 34 * fanP;
      var r = off * 13 * fanP;
      var s = 0.75 + 0.25 * fanP;
      card.style.transform = 'translate(' + x + 'px, ' + y + 'px) rotate(' + r + 'deg) scale(' + s + ')';
      card.style.opacity = String(fanP);
      card.style.zIndex = String(10 - Math.abs(off));
    });
    if (truckBox) {
      truckBox.style.opacity = String(1 - Math.max(0, (p - 0.7) / 0.3) * 0.85);
      truckBox.style.transform = 'translate(-50%, -50%) scale(' + (1 - fanP * 0.12) + ')';
    }
    if (flagshipScene && p > 0.9) {
      flagshipScene.style.opacity = String(1 - (p - 0.9) / 0.1);
    } else if (flagshipScene) {
      flagshipScene.style.opacity = '1';
    }
  }

  /* ---------- Audience central highlight ---------- */
  var audienceItems = Array.prototype.slice.call(document.querySelectorAll('#audienceList li'));

  function updateAudience() {
    if (!audienceItems.length) return;
    var vh = window.innerHeight;
    var center = vh / 2;
    var best = null;
    var bestDist = Infinity;
    audienceItems.forEach(function (li) {
      var r = li.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var d = Math.abs((r.top + r.bottom) / 2 - center);
      if (d < bestDist) { bestDist = d; best = li; }
    });
    audienceItems.forEach(function (li) {
      li.classList.toggle('lit', li === best);
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateHero();
      updateMission();
      updateFlagship();
      updateAudience();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Team cards brighten on scroll into view ---------- */
  var teamCards = document.querySelectorAll('#teamGrid .team-card');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var idx = Array.prototype.indexOf.call(teamCards, entry.target);
          entry.target.style.transitionDelay = ((idx % 6) * 60) + 'ms';
          entry.target.classList.add('lit');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    teamCards.forEach(function (card) { io.observe(card); });
  } else {
    teamCards.forEach(function (card) { card.classList.add('lit'); });
  }

  /* ---------- Gallery drag to scroll ---------- */
  var gallery = document.getElementById('gallery');
  if (gallery) {
    var down = false, startX = 0, startScroll = 0, moved = 0;
    gallery.addEventListener('pointerdown', function (e) {
      down = true; moved = 0;
      startX = e.clientX; startScroll = gallery.scrollLeft;
      gallery.classList.add('dragging');
    });
    gallery.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      gallery.scrollLeft = startScroll - dx;
    });
    function endDrag() {
      down = false;
      gallery.classList.remove('dragging');
    }
    gallery.addEventListener('pointerup', endDrag);
    gallery.addEventListener('pointerleave', endDrag);
    gallery.addEventListener('pointercancel', endDrag);
  }
})();
