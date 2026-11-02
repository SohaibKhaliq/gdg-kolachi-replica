/* GDG Kolachi replica v2 — GSAP + ScrollTrigger scroll effects (same
   libraries the original uses), with a static fallback if GSAP fails
   to load. All effects are scroll-driven: hero phrase/photo cycle,
   mission word reveal, flagship card fan, audience highlight,
   team brightening, gallery drag. */

(function () {
  'use strict';

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  var hasGsap = (typeof gsap !== 'undefined') && (typeof ScrollTrigger !== 'undefined');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Hero phrase + photo cycle ---------- */
  var heroStage = document.getElementById('hero');
  var phrases = Array.prototype.slice.call(document.querySelectorAll('.hero-phrase'));
  var bgImgs = Array.prototype.slice.call(document.querySelectorAll('.hero-bg-img'));
  var heroBar = document.querySelector('.hero-progress span');
  var currentPhrase = 0;

  function setHero(idx) {
    if (idx === currentPhrase) return;
    currentPhrase = idx;
    phrases.forEach(function (el, i) {
      el.classList.toggle('is-current', i === idx);
      el.classList.toggle('is-past', i < idx);
    });
    bgImgs.forEach(function (el, i) {
      el.classList.toggle('is-active', i === idx);
    });
    if (heroBar) heroBar.style.width = ((idx + 1) / phrases.length * 100) + '%';
  }

  function heroProgress() {
    var top = heroStage.offsetTop;
    var span = heroStage.offsetHeight - window.innerHeight;
    return span > 0 ? clamp((window.scrollY - top) / span, 0, 1) : 0;
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

  function missionProgress() {
    if (!missionWords.length) return 0;
    var rect = missionEl.getBoundingClientRect();
    var vh = window.innerHeight;
    return clamp((vh * 0.85 - rect.top) / (rect.height + vh * 0.3), 0, 1);
  }

  function updateMission(p) {
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

  function fanSpread() {
    var vw = window.innerWidth;
    var cardW = vw <= 900 ? 170 : 230;
    return Math.max(30, Math.min(200, (vw - cardW - 40) / 4));
  }

  function updateFlagship(p) {
    if (scrollDownEl) scrollDownEl.style.opacity = String(Math.max(0, 1 - p * 5.5));
    var fanP = clamp((p - 0.3) / 0.5, 0, 1);
    var spread = fanSpread();
    fanCards.forEach(function (card, i) {
      var off = i - 2;
      var x = off * spread * fanP;
      var y = Math.abs(off) * 26 * fanP;
      var r = off * 10 * fanP;
      var s = 0.8 + 0.2 * fanP;
      if (hasGsap) {
        gsap.set(card, { x: x, y: y, rotation: r, scale: s, opacity: fanP, zIndex: 10 - Math.abs(off) });
      } else {
        card.style.transform = 'translate(' + x + 'px, ' + y + 'px) rotate(' + r + 'deg) scale(' + s + ')';
        card.style.opacity = String(fanP);
        card.style.zIndex = String(10 - Math.abs(off));
      }
    });
    if (truckBox) {
      var bOp = 1 - Math.max(0, (p - 0.7) / 0.3) * 0.85;
      if (hasGsap) {
        gsap.set(truckBox, { opacity: bOp, scale: 1 - fanP * 0.12 });
      } else {
        truckBox.style.opacity = String(bOp);
        truckBox.style.transform = 'translate(-50%, -50%) scale(' + (1 - fanP * 0.12) + ')';
      }
    }
    if (flagshipScene) {
      flagshipScene.style.opacity = p > 0.9 ? String(1 - (p - 0.9) / 0.1) : '1';
    }
  }

  function flagshipProgress() {
    var top = flagshipStage.offsetTop;
    var span = flagshipStage.offsetHeight - window.innerHeight;
    return span > 0 ? clamp((window.scrollY - top) / span, 0, 1) : 0;
  }

  /* ---------- Drive everything ---------- */
  function updateAll() {
    var hp = heroProgress();
    setHero(Math.min(phrases.length - 1, Math.floor(hp * phrases.length)));
    updateMission(missionProgress());
    updateFlagship(flagshipProgress());
    updateAudience();
  }

  if (hasGsap) {
    ScrollTrigger.create({ trigger: heroStage, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: updateAll });
    ScrollTrigger.create({ trigger: missionEl, start: 'top 85%', end: 'bottom 40%', scrub: true, onUpdate: updateAll });
    ScrollTrigger.create({ trigger: flagshipStage, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: updateAll });
    window.addEventListener('scroll', updateAudience, { passive: true });
    var gsapTicking = false;
    window.addEventListener('scroll', function () {
      if (gsapTicking) return;
      gsapTicking = true;
      requestAnimationFrame(function () { updateAll(); gsapTicking = false; });
    }, { passive: true });
    updateAll();
  } else {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { updateAll(); ticking = false; });
    }, { passive: true });
    updateAll();
  }
  window.addEventListener('resize', updateAll);

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
    var down = false, startX = 0, startScroll = 0;
    gallery.addEventListener('pointerdown', function (e) {
      down = true;
      startX = e.clientX; startScroll = gallery.scrollLeft;
      gallery.classList.add('dragging');
    });
    gallery.addEventListener('pointermove', function (e) {
      if (!down) return;
      gallery.scrollLeft = startScroll - (e.clientX - startX);
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
