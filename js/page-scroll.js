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
  var lastWheelAt = 0;
  var lastFrameAt = performance.now();
  var gotoAnimTarget = null;

  var scrollSensitivity = window.innerWidth < 768 ? 0.00112 : 0.00092;
  var wheelActiveMs = 280;
  var idleSnapDelayMs = 550;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function expSmooth(current, target, lambda, dt) {
    var alpha = 1 - Math.exp(-lambda * dt);
    return current + (target - current) * alpha;
  }

  function wheelDelta(e) {
    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 18;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    return dy;
  }

  function applyDeckPosition(p) {
    pages.forEach(function (page, i) {
      page.style.transform = 'translate3d(0,' + (i - p) * 100 + '%,0)';
    });
  }

  function publishProgress(wheelActive) {
    applyDeckPosition(smoothProgress);
    window.CronoSpiralScroll = smoothProgress / maxIndex;
    window.CronoSpiralWheelActive = !!wheelActive;
    syncIndexFromProgress(smoothProgress);
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

  function goTo(next, instant) {
    next = clamp(next, 0, maxIndex);
    targetProgress = next;
    gotoAnimTarget = instant ? null : next;
    lastWheelAt = 0;
    if (instant) smoothProgress = next;
    publishProgress(false);
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
    var dy = wheelDelta(e);
    var dir = dy > 0 ? 1 : -1;
    if (pageCanScroll(dir)) return;
    e.preventDefault();

    gotoAnimTarget = null;
    lastWheelAt = performance.now();
    targetProgress = clamp(targetProgress + dy * scrollSensitivity, 0, maxIndex);
    smoothProgress = targetProgress;
    publishProgress(true);
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
    gotoAnimTarget = null;
    lastWheelAt = performance.now();
    targetProgress = clamp(targetProgress + dir * 0.85, 0, maxIndex);
    smoothProgress = targetProgress;
    publishProgress(true);
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

  function motionLoop(now) {
    var dt = clamp((now - lastFrameAt) / 1000, 0.001, 0.05);
    lastFrameAt = now;
    var wheelActive = now - lastWheelAt < wheelActiveMs;

    if (gotoAnimTarget !== null) {
      smoothProgress = expSmooth(smoothProgress, gotoAnimTarget, 26, dt);
      targetProgress = smoothProgress;
      if (Math.abs(smoothProgress - gotoAnimTarget) < 0.003) {
        smoothProgress = gotoAnimTarget;
        targetProgress = gotoAnimTarget;
        gotoAnimTarget = null;
      }
      wheelActive = false;
    } else if (wheelActive) {
      smoothProgress = targetProgress;
    } else if (now - lastWheelAt > idleSnapDelayMs) {
      var snap = Math.round(targetProgress);
      targetProgress = expSmooth(targetProgress, snap, 22, dt);
      smoothProgress = targetProgress;
    }

    publishProgress(wheelActive);
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
  window.CronoSpiralWheelActive = false;
  requestAnimationFrame(motionLoop);

  window.CronoFullpage = {
    goTo: goTo,
    getIndex: function () { return index; },
    getScrollProgress: function () { return smoothProgress / maxIndex; }
  };

  if (typeof window.CronoSpiralConfig === 'undefined') window.CronoSpiralConfig = {};
  if (!window.CronoSpiralConfig.timeline) {
    window.CronoSpiralConfig.timeline = [
      { t: 0, x: 0.05, y: 0.02, z: 0, rx: 0.62, ry: 0.22, rz: 0.04, s: 0.92, camZ: 5.0, frontLayer: 0 },
      { t: 0.08, x: 0.08, y: -0.02, z: 0.08, rx: 0.52, ry: 0.38, rz: 0.05, s: 0.98, camZ: 4.7, frontLayer: 0 },
      { t: 0.16, x: 0.1, y: -0.04, z: 0.12, rx: 0.48, ry: 0.48, rz: 0.07, s: 1.04, camZ: 4.45, frontLayer: 0.05 },
      { t: 0.24, x: 0.04, y: 0, z: 0.22, rx: 0.72, ry: 0.28, rz: 0.04, s: 1.22, camZ: 3.85, frontLayer: 0.35 },
      { t: 0.32, x: -0.12, y: 0.04, z: 0.18, rx: 0.55, ry: -0.35, rz: 0.08, s: 1.12, camZ: 4.05, frontLayer: 0.55 },
      { t: 0.4, x: -0.28, y: 0.06, z: 0.1, rx: 0.4, ry: -0.52, rz: 0.1, s: 1.06, camZ: 4.25, frontLayer: 0.4 },
      { t: 0.48, x: 0.22, y: 0, z: 0.05, rx: 0.34, ry: 0.58, rz: 0.06, s: 1.02, camZ: 4.4, frontLayer: 0.15 },
      { t: 0.56, x: 0.38, y: -0.02, z: 0.02, rx: 0.3, ry: 0.68, rz: 0.05, s: 0.98, camZ: 4.5, frontLayer: 0.1 },
      { t: 0.64, x: 0.08, y: 0.04, z: 0.14, rx: 0.88, ry: 0.32, rz: 0.04, s: 1.38, camZ: 3.35, frontLayer: 0.45 },
      { t: 0.72, x: -0.42, y: 0.02, z: 0.06, rx: 0.36, ry: -0.42, rz: 0.09, s: 1.04, camZ: 4.2, frontLayer: 0.25 },
      { t: 0.8, x: 0.35, y: 0.08, z: 0.05, rx: 0.5, ry: 0.52, rz: 0.05, s: 0.96, camZ: 4.45, frontLayer: 0.12 },
      { t: 0.88, x: 0.06, y: -0.04, z: 0.18, rx: 0.82, ry: 0.22, rz: 0.1, s: 1.28, camZ: 3.55, frontLayer: 0.38 },
      { t: 0.94, x: 0.1, y: 0.1, z: 0.08, rx: 0.55, ry: 0.26, rz: 0.16, s: 1.15, camZ: 3.85, frontLayer: 0.15 },
      { t: 1, x: 0, y: -0.28, z: 0, rx: -0.28, ry: 0.18, rz: 0.02, s: 1.72, camZ: 3.15, frontLayer: 0.22 }
    ];
  }

  var canvas = document.getElementById('fpScene');
  if (canvas && window.CronoSpiralScene) {
    window.CronoSpiralScene.create(canvas);
  }
})();
