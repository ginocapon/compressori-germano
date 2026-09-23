/* Full-page cinematic scroll + wireframe torus (homepage only) */
(function () {
  var body = document.body;
  if (!body || !body.classList.contains('fp-home')) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var pages = Array.prototype.slice.call(document.querySelectorAll('.fp-page'));
  if (pages.length < 2) return;

  document.documentElement.classList.add('fp-on');

  var index = 0;
  var progress = 0;
  var locked = false;
  var duration = window.innerWidth < 768 ? 780 : 1050;
  var wheelLock = 0;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function applyTransforms(from, to, e) {
    var shift = (to - from) * e;
    pages.forEach(function (page, i) {
      page.style.transform = 'translate3d(0,' + ((i - from) - shift) * 100 + '%,0)';
    });
    progress = from + (to - from) * e;
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

  function goTo(next, instant) {
    next = Math.max(0, Math.min(pages.length - 1, next));
    if (next === index && !instant) return;
    if (locked && !instant) return;
    var from = index;
    index = next;
    setChrome();
    if (instant) {
      applyTransforms(next, next, 1);
      progress = next;
      return;
    }
    locked = true;
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      applyTransforms(from, next, easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(frame);
      else {
        locked = false;
        progress = next;
      }
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
    var now = Date.now();
    if (locked || now < wheelLock) return;
    wheelLock = now + 180;
    goTo(index + dir);
  }

  var touchY = 0;
  function onTouchStart(e) {
    if (!e.touches || !e.touches[0]) return;
    touchY = e.touches[0].clientY;
  }
  function onTouchEnd(e) {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    var dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 56) return;
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
      goTo(pages.length - 1);
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

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKey);
  buildDots();
  bindAnchors();
  applyTransforms(0, 0, 1);
  goTo(startIndex(), true);
  window.CronoFullpage = { goTo: goTo, getIndex: function () { return index; } };

  /* ---------- 3D wireframe torus ---------- */
  var canvas = document.getElementById('fpScene');
  if (!canvas || typeof THREE === 'undefined') return;

  var mobile = window.innerWidth < 900;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x050910, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050910, 0.1);

  var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 40);
  camera.position.set(0, 0, 4.4);

  var group = new THREE.Group();
  scene.add(group);

  var segs = mobile ? [22, 46] : [40, 80];
  var torus = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.TorusGeometry(1.12, 0.4, segs[0], segs[1])),
    new THREE.LineBasicMaterial({ color: 0x9ec4e8, transparent: true, opacity: 0.58 })
  );
  group.add(torus);

  var side = mobile ? 0.38 : 1.02;
  var scale = mobile ? 0.3 : 0.54;
  var lift = mobile ? 0.55 : 0.06;
  var poses = [
    { x: side, y: lift, z: 0, rx: 0.72, ry: 0.18, rz: 0.08, s: scale, camZ: 4.4 },
    { x: -side, y: lift, z: 0, rx: 0.35, ry: 0.85, rz: 0.05, s: scale, camZ: 4.5 },
    { x: side, y: lift, z: 0, rx: 1.15, ry: 0.25, rz: 0.1, s: scale, camZ: 4.35 },
    { x: -side, y: lift, z: 0, rx: 0.25, ry: -0.7, rz: 0.15, s: scale, camZ: 4.4 },
    { x: side, y: lift, z: 0, rx: 1.05, ry: 0.4, rz: 0.1, s: scale, camZ: 4.3 },
    { x: -side, y: lift, z: 0, rx: 0.4, ry: 0.55, rz: 0, s: scale, camZ: 4.5 },
    { x: side, y: lift, z: 0, rx: 0.55, ry: 0.2, rz: 0.2, s: scale, camZ: 4.4 },
    { x: -side, y: lift, z: 0, rx: 0.3, ry: -0.45, rz: 0, s: scale, camZ: 4.5 },
    { x: side, y: lift, z: 0, rx: 0.2, ry: 0.9, rz: 0.1, s: scale, camZ: 4.35 },
    { x: -side, y: lift, z: 0, rx: -0.35, ry: 0.15, rz: 0, s: scale, camZ: 4.4 }
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function poseAt(p) {
    var max = poses.length - 1;
    var clamped = Math.max(0, Math.min(max, p));
    var i = Math.floor(clamped);
    var t = clamped - i;
    var a = poses[i];
    var b = poses[Math.min(max, i + 1)];
    var hop = Math.sin(t * Math.PI);
    var loop = Math.sin(t * Math.PI * 2);
    var flip = a.x * b.x < 0 ? 1 : 0.28;
    var x = lerp(a.x, b.x, t) * (1 - 0.22 * hop * flip);
    var y = lerp(a.y, b.y, t) + hop * (mobile ? 0.22 : 0.42) * (flip ? 1 : 0.35);
    var z = lerp(a.z, b.z, t) + loop * 0.38 * flip;
    if (x > side) x = side;
    if (x < -side) x = -side;
    if (y > 0.85) y = 0.85;
    if (y < -0.35) y = -0.35;
    return {
      x: x,
      y: y,
      z: z,
      rx: lerp(a.rx, b.rx, t) + hop * Math.PI * flip,
      ry: lerp(a.ry, b.ry, t) + t * Math.PI * 1.35 * flip,
      rz: lerp(a.rz, b.rz, t) + loop * 0.9 * flip,
      s: lerp(a.s, b.s, t) * (1 + hop * 0.16),
      camZ: lerp(a.camZ, b.camZ, t)
    };
  }

  function onResize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', onResize);

  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = document.visibilityState === 'visible';
    if (running) requestAnimationFrame(tick);
  });

  function tick() {
    if (!running) return;
    var pose = poseAt(progress);
    var time = performance.now() * 0.001;
    group.position.set(
      pose.x + Math.sin(time * 0.75) * 0.1,
      pose.y + Math.sin(time * 1.15) * 0.07 + Math.sin(time * 2.4) * 0.03,
      pose.z + Math.cos(time * 0.9) * 0.08
    );
    group.scale.setScalar(pose.s * (1 + Math.sin(time * 1.35) * 0.05));
    group.rotation.x = pose.rx + Math.sin(time * 0.5) * 0.28;
    group.rotation.y = pose.ry + time * 0.32;
    group.rotation.z = pose.rz + Math.sin(time * 0.85) * 0.22;
    camera.position.z = pose.camZ;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
