/* GDG Kolachi replica v3 — plain JS (no library load-order risk).
   Mechanisms copied from the studied original:
   - Hero: five full panels sliding up (photo + phrase together).
   - Dots: JS grid with a centre hole; cursor proximity blends each dot
     from dim white to its own random Google colour within 150px;
     fast cursor moves knock dots (elastic return); clicks shockwave.
   - Mission: fast word-by-word brightening on scroll.
   - Flagship: Scroll Down fades, 3D box rises + rotates 360°, recedes,
     flaps open to ±45°, five cards fan -25°..+30° (DevFest front-left).
   - Audience: fixed Google colour cycle, centre-nearest item bright.
   - Team: row-wise brightening (whole rows together).
   - Header/bottom bar: transparent over hero, solid after. */

(function () {
  'use strict';

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  var GOOGLE_COLORS = ['#EA4335', '#4285F4', '#34A853', '#F9AB00'];
  var BASE_RGB = [255, 255, 255, 0.12];

  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }

  function lerpColor(activeHex, t) {
    var c = hexToRgb(activeHex);
    var r = Math.round(BASE_RGB[0] + (c[0] - BASE_RGB[0]) * t);
    var g = Math.round(BASE_RGB[1] + (c[1] - BASE_RGB[1]) * t);
    var b = Math.round(BASE_RGB[2] + (c[2] - BASE_RGB[2]) * t);
    var a = BASE_RGB[3] + (1 - BASE_RGB[3]) * t;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')';
  }

  /* ---------- Header / bottom bar solidity ---------- */
  var header = document.getElementById('siteHeader');
  var bottomBar = document.getElementById('bottomBar');
  var heroStage = document.getElementById('hero');

  function updateChrome() {
    var span = heroStage.offsetHeight - window.innerHeight;
    var solid = window.scrollY > span;
    header.classList.toggle('is-solid', solid);
    bottomBar.classList.toggle('is-solid', solid);
  }

  /* ---------- Hero panels ---------- */
  var heroPanels = Array.prototype.slice.call(document.querySelectorAll('.hero-panel'));

  function updateHero() {
    var top = heroStage.offsetTop;
    var span = heroStage.offsetHeight - window.innerHeight;
    var p = span > 0 ? clamp((window.scrollY - top) / span, 0, 1) : 0;
    heroPanels.forEach(function (panel, i) {
      panel.style.transform = 'translateY(' + ((i - p * 4) * 100) + '%)';
    });
  }

  /* ---------- Dots grid + cursor glow ---------- */
  var dotsContainer = document.querySelector('[data-dots-container-init]');
  var dotCenters = [];
  var THRESHOLD = 150, SPEED_THRESHOLD = 100, SHOCK_RADIUS = 250, SHOCK_POWER = 5, MAX_SPEED = 5000;

  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    dotCenters = [];
    var style = getComputedStyle(dotsContainer);
    var dotPx = parseFloat(style.fontSize);
    var gapPx = dotPx * 2;
    var contW = dotsContainer.clientWidth;
    var contH = dotsContainer.clientHeight;
    if (!contW || !contH || !dotPx) return;
    var cols = Math.floor((contW + gapPx) / (dotPx + gapPx));
    var rows = Math.floor((contH + gapPx) / (dotPx + gapPx));
    var holeCols = (cols % 2 === 0) ? 4 : 5;
    var holeRows = (rows % 2 === 0) ? 4 : 5;
    var startCol = (cols - holeCols) / 2;
    var startRow = (rows - holeRows) / 2;
    var dots = [];
    for (var i = 0; i < cols * rows; i++) {
      var row = Math.floor(i / cols);
      var col = i % cols;
      var isHole = row >= startRow && row < startRow + holeRows &&
                   col >= startCol && col < startCol + holeCols;
      var d = document.createElement('div');
      d.className = 'dot';
      if (isHole) {
        d.style.visibility = 'hidden';
        d._isHole = true;
      } else {
        d.style.backgroundColor = 'rgba(255,255,255,0.12)';
        d._activeColor = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];
        d._knocked = false;
      }
      dotsContainer.appendChild(d);
      dots.push(d);
    }
    requestAnimationFrame(function () {
      dotCenters = dots.filter(function (d) { return !d._isHole; }).map(function (d) {
        var r = d.getBoundingClientRect();
        return { el: d, x: r.left + window.scrollX + r.width / 2, y: r.top + window.scrollY + r.height / 2 };
      });
    });
  }

  function knockDot(el, pushX, pushY) {
    if (el._knocked) return;
    el._knocked = true;
    el.style.transition = 'transform 0.3s ease-out';
    el.style.transform = 'translate(' + pushX.toFixed(1) + 'px,' + pushY.toFixed(1) + 'px)';
    setTimeout(function () {
      el.style.transition = 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = 'translate(0px,0px)';
      setTimeout(function () { el._knocked = false; }, 1200);
    }, 300);
  }

  var lastTime = 0, lastX = 0, lastY = 0;

  window.addEventListener('mousemove', function (e) {
    var now = performance.now();
    var dt = now - lastTime || 16;
    var dx = e.pageX - lastX, dy = e.pageY - lastY;
    var vx = dx / dt * 1000, vy = dy / dt * 1000;
    var speed = Math.hypot(vx, vy);
    if (speed > MAX_SPEED) { var s = MAX_SPEED / speed; vx *= s; vy *= s; speed = MAX_SPEED; }
    lastTime = now; lastX = e.pageX; lastY = e.pageY;
    requestAnimationFrame(function () {
      dotCenters.forEach(function (item) {
        var dist = Math.hypot(item.x - e.pageX, item.y - e.pageY);
        var t = Math.max(0, 1 - dist / THRESHOLD);
        item.el.style.backgroundColor = lerpColor(item.el._activeColor, t);
        if (speed > SPEED_THRESHOLD && dist < THRESHOLD) {
          var pushX = (item.x - e.pageX + vx * 0.005) * 0.12;
          var pushY = (item.y - e.pageY + vy * 0.005) * 0.12;
          knockDot(item.el, pushX, pushY);
        }
      });
    });
  });

  window.addEventListener('click', function (e) {
    dotCenters.forEach(function (item) {
      var dist = Math.hypot(item.x - e.pageX, item.y - e.pageY);
      if (dist < SHOCK_RADIUS) {
        var falloff = Math.max(0, 1 - dist / SHOCK_RADIUS);
        knockDot(item.el,
          (item.x - e.pageX) * SHOCK_POWER * falloff * 0.12,
          (item.y - e.pageY) * SHOCK_POWER * falloff * 0.12);
      }
    });
  });

  window.addEventListener('resize', buildDots);
  buildDots();

  /* ---------- Mission word brightening ---------- */
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
    var p = clamp((vh * 0.9 - rect.top) / (rect.height * 0.6), 0, 1);
    var litCount = Math.floor(p * missionWords.length);
    missionWords.forEach(function (el, i) {
      el.classList.toggle('lit', i < litCount);
    });
  }

  /* ---------- Flagship: fade, 3D box, flaps, fan ---------- */
  var flagshipStage = document.getElementById('flagship');
  var scrollDownEl = document.querySelector('.scroll-down');
  var cubeWrap = document.getElementById('cubeWrap');
  var cube = document.getElementById('cube');
  var flapLeft = document.querySelector('.flap-left');
  var flapRight = document.querySelector('.flap-right');
  var fanCards = Array.prototype.slice.call(document.querySelectorAll('.fan-card'));
  var FAN_ANGLES = [-25, -12, -3, 15, 30];

  function updateFlagship() {
    var top = flagshipStage.offsetTop;
    var span = flagshipStage.offsetHeight - window.innerHeight;
    var p = span > 0 ? clamp((window.scrollY - top) / span, 0, 1) : 0;

    if (scrollDownEl) {
      scrollDownEl.style.opacity = String(1 - clamp(p / 0.2, 0, 1));
    }

    var rise = (1 - clamp((p - 0.2) / 0.25, 0, 1)) * 45;
    var recedeP = clamp((p - 0.55) / 0.2, 0, 1);
    var recedeY = 22 * recedeP;
    var scale = 1 - 0.55 * recedeP;
    if (cubeWrap) {
      cubeWrap.style.transform = 'translateY(' + (rise + recedeY).toFixed(2) + 'vh) scale(' + scale.toFixed(3) + ')';
    }
    if (cube) {
      cube.style.transform = 'rotateY(' + (360 * clamp((p - 0.25) / 0.35, 0, 1)).toFixed(1) + 'deg)';
    }

    var flapP = clamp((p - 0.65) / 0.15, 0, 1);
    if (flapLeft) flapLeft.style.transform = 'rotate(' + (-45 * flapP).toFixed(1) + 'deg)';
    if (flapRight) flapRight.style.transform = 'rotate(' + (45 * flapP).toFixed(1) + 'deg)';

    var cardP = clamp((p - 0.7) / 0.3, 0, 1);
    fanCards.forEach(function (card, i) {
      var off = i - 2;
      var x = off * 78 * cardP;
      var y = (1 - cardP) * 300 - 40 * cardP;
      var angle = FAN_ANGLES[i] * cardP;
      var sc = 0.6 + 0.4 * cardP;
      card.style.transform = 'translate(calc(-50% + ' + x.toFixed(1) + 'px), calc(-50% + ' + y.toFixed(1) + 'px)) rotate(' + angle.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      card.style.opacity = String(cardP);
      card.style.zIndex = String(10 - i);
    });
  }

  /* ---------- Audience centre highlight ---------- */
  var audienceItems = Array.prototype.slice.call(document.querySelectorAll('#audienceList li'));

  function updateAudience() {
    if (!audienceItems.length) return;
    var vh = window.innerHeight;
    var center = vh / 2;
    var best = null, bestDist = Infinity;
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

  /* ---------- Team row-wise brightening ---------- */
  var teamCards = Array.prototype.slice.call(document.querySelectorAll('#teamGrid .team-card'));

  function updateTeam() {
    var line = window.innerHeight * 0.75;
    teamCards.forEach(function (card) {
      card.classList.toggle('lit', card.getBoundingClientRect().top < line);
    });
  }

  /* ---------- Drive everything ---------- */
  function updateAll() {
    updateChrome();
    updateHero();
    updateMission();
    updateFlagship();
    updateAudience();
    updateTeam();
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { updateAll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', updateAll);
  updateAll();

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
