/* Full-page cinematic scroll + spirale 3D continua (homepage) */
(function () {
  var body = document.body;
  if (!body || !body.classList.contains('fp-home')) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var pages = Array.prototype.slice.call(document.querySelectorAll('.fp-page'));
  if (pages.length < 2) return;

  document.documentElement.classList.add('fp-on');

  var maxIndex = pages.length - 1;
  var targetProgress = 0;
  var smoothProgress = 0;
  var index = 0;
  var locked = false;
  var wheelAccum = 0;
  var scrollSensitivity = window.innerWidth < 768 ? 0.00115 : 0.00095;
  var snapThreshold = 0.22;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function applyDeckPosition(p) {
    pages.forEach(function (page, i) {
      page.style.transform = 'translate3d(0,' + (i - p) * 100 + '%,0)';
    });
  }

  function setChrome() {
    var nav = document.getElementById('navbar');
    var cta = document.getElementById('mobileCta');
    if (nav) nav.classList.toggle('scrolled', index > 0);
    if (cta) cta.classList.toggle('visible', index > 0);
    var dots = document.querySelectorAll('.fp-dots button');
    dots.forEach(function (btn, i) {
      btn.classList.toggle('is-on', i === index);
      if (i === index) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
    pages.forEach(function (page, i) {
      page.classList.toggle('is-current', i === index);
      if (i === index) {
        page.querySelectorAll('.reveal').forEach(function (el) {
          el.classList.add('visible');
        });
      }
    });
  }

  function syncIndexFromProgress(p) {
    var next = Math.round(clamp(p, 0, maxIndex));
    if (next !== index) {
      index = next;
      setChrome();
    }
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function goTo(next, instant) {
    next = clamp(next, 0, maxIndex);
    targetProgress = next;
    if (instant) {
      smoothProgress = next;
      applyDeckPosition(next);
      index = next;
      setChrome();
      window.CronoSpiralScroll = next / maxIndex;
      return;
    }
    locked = true;
    var start = smoothProgress;
    var startTime = performance.now();
    var duration = window.innerWidth < 768 ? 920 : 1180;
    function frame(now) {
      var t = clamp((now - startTime) / duration, 0, 1);
      t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      smoothProgress = lerp(start, next, t);
      applyDeckPosition(smoothProgress);
      window.CronoSpiralScroll = smoothProgress / maxIndex;
      syncIndexFromProgress(smoothProgress);
      if (t < 1) requestAnimationFrame(frame);
      else locked = false;
    }
    requestAnimationFrame(frame);
  }

  function pageCanScroll(dir) {
    var page = pages[index];
    if (!page) return false;
    var max = page.scrollHeight - page.clientHeight;
    if (max <= 8) return false;
    if (dir > 0 && page.scrollTop < max - 4) return true;
    if (dir < 0 && page.scrollTop > 4) return true;
    return false;
  }

  function onWheel(e) {
    if (e.ctrlKey) return;
    var dir = e.deltaY > 0 ? 1 : -1;
    if (pageCanScroll(dir)) return;
    e.preventDefault();
    if (locked) return;

    wheelAccum += e.deltaY * scrollSensitivity;
    targetProgress = clamp(targetProgress + e.deltaY * scrollSensitivity, 0, maxIndex);

    var nearest = Math.round(targetProgress);
    if (Math.abs(targetProgress - nearest) < snapThreshold) {
      targetProgress = lerp(targetProgress, nearest, 0.18);
    }
  }

  var touchY = 0;
  function onTouchStart(e) {
    if (!e.touches || !e.touches[0]) return;
    touchY = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    var dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 48) return;
    var dir = dy > 0 ? 1 : -1;
    if (pageCanScroll(dir)) return;
    goTo(index + dir);
  }

  function onKey(e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(maxIndex);
    }
  }

  function buildDots() {
    var wrap = document.getElementById('fpDots');
    if (!wrap) return;
    wrap.innerHTML = pages.map(function (page, i) {
      var label = page.getAttribute('data-fp-label') || ('Pagina ' + (i + 1));
      return '<button type="button" data-i="' + i + '" aria-label="' + label.replace(/"/g, '') + '"><span></span></button>';
    }).join('');
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-i]');
      if (btn) goTo(Number(btn.getAttribute('data-i')));
    });
  }

  function bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        var i = pages.indexOf(target.closest('.fp-page') || target);
        if (i < 0) return;
        e.preventDefault();
        goTo(i);
      });
    });
  }

  function startIndex() {
    var hash = (location.hash || '').replace('#', '');
    if (!hash) return 0;
    var el = document.getElementById(hash);
    if (!el) return 0;
    var i = pages.indexOf(el.closest('.fp-page') || el);
    return i < 0 ? 0 : i;
  }

  function motionLoop() {
    if (!locked) {
      smoothProgress += (targetProgress - smoothProgress) * 0.08;
      applyDeckPosition(smoothProgress);
      syncIndexFromProgress(smoothProgress);
    }
    window.CronoSpiralScroll = smoothProgress / maxIndex;
    requestAnimationFrame(motionLoop);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKey);
  buildDots();
  bindAnchors();

  var start = startIndex();
  targetProgress = start;
  smoothProgress = start;
  applyDeckPosition(start);
  index = start;
  setChrome();
  window.CronoSpiralScroll = start / maxIndex;
  requestAnimationFrame(motionLoop);

  window.CronoFullpage = {
    goTo: goTo,
    getIndex: function () { return index; },
    getScrollProgress: function () { return smoothProgress / maxIndex; }
  };

  /* Timeline globale spirale (scroll 0 → 1) — modifica in js/spiral-config.js */
  if (typeof window.CronoSpiralConfig === 'undefined') window.CronoSpiralConfig = {};
  if (!window.CronoSpiralConfig.timeline) {
    window.CronoSpiralConfig.timeline = [
      { t: 0, x: 0.05, y: 0.02, z: 0, rx: 0.62, ry: 0.22, rz: 0.04, s: 0.88, camZ: 5.2, frontLayer: 0 },
      { t: 0.12, x: 0.1, y: -0.05, z: 0.15, rx: 0.45, ry: 0.55, rz: 0.08, s: 1.05, camZ: 4.4, frontLayer: 0 },
      { t: 0.22, x: 0, y: 0, z: 0.35, rx: 0.95, ry: 0.12, rz: 0, s: 1.55, camZ: 2.85, frontLayer: 0.85 },
      { t: 0.32, x: -0.35, y: 0.08, z: 0.1, rx: 0.38, ry: -0.62, rz: 0.12, s: 1.08, camZ: 4.2, frontLayer: 0 },
      { t: 0.42, x: 0.55, y: -0.02, z: -0.05, rx: 0.28, ry: 0.78, rz: 0.06, s: 0.98, camZ: 4.55, frontLayer: 0 },
      { t: 0.52, x: 0, y: 0.05, z: 0.2, rx: 1.35, ry: 0.35, rz: 0.05, s: 1.75, camZ: 2.55, frontLayer: 0.9 },
      { t: 0.62, x: -0.75, y: 0, z: 0, rx: 0.32, ry: -0.48, rz: 0.1, s: 1.02, camZ: 4.35, frontLayer: 0 },
      { t: 0.72, x: 0.65, y: 0.12, z: 0.08, rx: 0.55, ry: 0.65, rz: 0.04, s: 0.92, camZ: 4.6, frontLayer: 0 },
      { t: 0.82, x: 0, y: -0.08, z: 0.25, rx: 1.05, ry: 0.18, rz: 0.15, s: 1.45, camZ: 3.05, frontLayer: 0.75 },
      { t: 0.92, x: 0.15, y: 0.15, z: 0.05, rx: 0.48, ry: 0.28, rz: 0.22, s: 1.22, camZ: 3.65, frontLayer: 0 },
      { t: 1, x: 0, y: -0.35, z: 0, rx: -0.35, ry: 0.15, rz: 0, s: 2.05, camZ: 2.95, frontLayer: 0.35 }
    ];
  }

  var canvas = document.getElementById('fpScene');
  if (canvas && window.CronoSpiralScene) {
    window.CronoSpiralScene.create(canvas);
  }
})();
