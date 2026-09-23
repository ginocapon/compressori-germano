/**
 * Crono Service — spirale 3D continua (Three.js)
 *
 * MODIFICHE RAPIDE — edita window.CronoSpiralConfig prima del render:
 * - scrollDamping: velocità di inseguimento scroll (0.05–0.12)
 * - segments / turns / spiralRadius / spiralDepth: densità e forma
 * - glow, opacity, thickness: aspetto luminoso
 * - noise / distortion: deformazione organica (0 = geometrico)
 * - timeline[]: pose a t=0…1 lungo lo scroll globale
 */
(function (global) {
  'use strict';

  var DEFAULT_CONFIG = {
    spiralRadius: 0.42,
    spiralDepth: 14,
    turns: 5.5,
    segments: 220,
    thickness: 0.011,
    ringSegments: 56,
    glow: 1,
    opacity: 0.72,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
    perspective: 42,
    noise: 0.022,
    distortion: 0.85,
    fogDensity: 0.072,
    clearColor: 0x050910,
    ringColor: 0xb8d4f0,
    accentColor: 0xe8611a,
    accentMix: 0.12,
    scrollDamping: 0.08,
    mouseInfluence: 0.035,
    driftSpeed: 0.00008,
    mobileScale: 0.55
  };

  global.CronoSpiralConfig = global.CronoSpiralConfig || {};
  var cfg = global.CronoSpiralConfig;
  Object.keys(DEFAULT_CONFIG).forEach(function (k) {
    if (cfg[k] === undefined) cfg[k] = DEFAULT_CONFIG[k];
  });

  /* —— Simplex 3D (compact) —— */
  var F3 = 1 / 3;
  var G3 = 1 / 6;
  var grad3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];
  var perm = new Uint8Array(512);
  (function seedPerm() {
    var p = [];
    for (var i = 0; i < 256; i++) p[i] = i;
    for (var j = 255; j > 0; j--) {
      var r = Math.floor(Math.random() * (j + 1));
      var t = p[j]; p[j] = p[r]; p[r] = t;
    }
    for (var k = 0; k < 512; k++) perm[k] = p[k & 255];
  })();

  function dot3(g, x, y, z) { return g[0] * x + g[1] * y + g[2] * z; }

  function simplex3(x, y, z) {
    var s = (x + y + z) * F3;
    var i = Math.floor(x + s);
    var j = Math.floor(y + s);
    var k = Math.floor(z + s);
    var t = (i + j + k) * G3;
    var X0 = i - t;
    var Y0 = j - t;
    var Z0 = k - t;
    var x0 = x - X0;
    var y0 = y - Y0;
    var z0 = z - Z0;
    var i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    var x1 = x0 - i1 + G3;
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;
    var x2 = x0 - i2 + 2 * G3;
    var y2 = y0 - j2 + 2 * G3;
    var z2 = z0 - k2 + 2 * G3;
    var x3 = x0 - 1 + 3 * G3;
    var y3 = y0 - 1 + 3 * G3;
    var z3 = z0 - 1 + 3 * G3;
    var ii = i & 255;
    var jj = j & 255;
    var kk = k & 255;
    var n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      t0 *= t0;
      n0 = t0 * t0 * dot3(grad3[perm[ii + perm[jj + perm[kk]]] % 12], x0, y0, z0);
    }
    t0 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t0 > 0) {
      t0 *= t0;
      n1 = t0 * t0 * dot3(grad3[perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12], x1, y1, z1);
    }
    t0 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t0 > 0) {
      t0 *= t0;
      n2 = t0 * t0 * dot3(grad3[perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12], x2, y2, z2);
    }
    t0 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t0 > 0) {
      t0 *= t0;
      n3 = t0 * t0 * dot3(grad3[perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12], x3, y3, z3);
    }
    return 32 * (n0 + n1 + n2 + n3);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function sampleTimeline(t) {
    var tl = cfg.timeline;
    if (!tl || !tl.length) return null;
    t = clamp(t, 0, 1);
    var i = 0;
    while (i < tl.length - 1 && tl[i + 1].t <= t) i++;
    var a = tl[i];
    var b = tl[Math.min(tl.length - 1, i + 1)];
    var span = b.t - a.t || 1;
    var u = clamp((t - a.t) / span, 0, 1);
    u = u * u * u * (u * (u * 6 - 15) + 10);
    var out = {};
    ['x', 'y', 'z', 'rx', 'ry', 'rz', 's', 'camZ', 'camX', 'camY', 'frontLayer'].forEach(function (key) {
      var va = a[key];
      var vb = b[key];
      if (va === undefined && vb === undefined) return;
      if (va === undefined) va = vb;
      if (vb === undefined) vb = va;
      out[key] = lerp(va, vb, u);
    });
    return out;
  }

  function SpiralScene(canvas) {
    if (!canvas || typeof THREE === 'undefined') return null;

    var mobile = window.innerWidth < 768;
    var segCount = mobile ? Math.floor(cfg.segments * cfg.mobileScale) : cfg.segments;
    segCount = Math.max(48, segCount);

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !mobile,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(cfg.clearColor, cfg.fogDensity);

    var camera = new THREE.PerspectiveCamera(cfg.perspective, window.innerWidth / window.innerHeight, 0.08, 80);
    camera.position.set(0, 0, 4.8);

    var root = new THREE.Group();
    scene.add(root);

    function helixPoint(f) {
      var angle = f * cfg.turns * Math.PI * 2;
      var r = cfg.spiralRadius * (0.82 + 0.28 * Math.sin(f * Math.PI));
      return new THREE.Vector3(
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        (f - 0.5) * cfg.spiralDepth
      );
    }

    var curvePts = [];
    var curveSteps = mobile ? 100 : 180;
    for (var ci = 0; ci <= curveSteps; ci++) {
      curvePts.push(helixPoint(ci / curveSteps));
    }
    var path = new THREE.CatmullRomCurve3(curvePts);
    var tubeGeo = new THREE.TubeGeometry(
      path,
      mobile ? 140 : 260,
      cfg.thickness * 2.8,
      mobile ? 10 : 16,
      false
    );
    var wireMat = new THREE.LineBasicMaterial({
      color: cfg.ringColor,
      transparent: true,
      opacity: 0.52 * cfg.glow,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var tubeWire = new THREE.LineSegments(new THREE.WireframeGeometry(tubeGeo), wireMat);
    root.add(tubeWire);

    var tubeGlow = new THREE.LineSegments(
      new THREE.WireframeGeometry(tubeGeo),
      new THREE.LineBasicMaterial({
        color: cfg.accentColor,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    tubeGlow.scale.setScalar(1.04);
    root.add(tubeGlow);

    var ringGeo = new THREE.TorusGeometry(1, cfg.thickness * 1.15, 5, mobile ? 36 : cfg.ringSegments);
    var ringMat = new THREE.MeshBasicMaterial({
      color: cfg.ringColor,
      transparent: true,
      opacity: Math.min(1, cfg.opacity * 1.1),
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var rings = new THREE.InstancedMesh(ringGeo, ringMat, segCount);
    if (rings.instanceMatrix.setUsage) rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(rings);

    var dummy = new THREE.Object3D();
    var helixMeta = [];

    function rebuildHelixMeta() {
      helixMeta.length = 0;
      var turns = cfg.turns;
      var depth = cfg.spiralDepth;
      var radius = cfg.spiralRadius;
      for (var i = 0; i < segCount; i++) {
        var f = i / (segCount - 1);
        var angle = f * turns * Math.PI * 2;
        var z = (f - 0.5) * depth;
        helixMeta.push({ f: f, angle: angle, z: z, radius: radius * (0.82 + 0.28 * Math.sin(f * Math.PI)) });
      }
    }
    rebuildHelixMeta();

    var mouse = { x: 0, y: 0 };
    var smoothMouse = { x: 0, y: 0 };
    var smoothFront = 0;
    var running = true;
    var time = 0;
    var lastTickAt = performance.now();

    function updateInstances(scrollNorm) {
      var nAmt = cfg.noise * cfg.distortion;
      var t = time * 0.35;
      for (var i = 0; i < segCount; i++) {
        var meta = helixMeta[i];
        var f = meta.f;
        var angle = meta.angle + scrollNorm * 0.55;
        var nx = simplex3(f * 2.1 + t, 0.4, 1.2) * nAmt;
        var ny = simplex3(0.2, f * 2.3 + t, 0.8) * nAmt;
        var nz = simplex3(1.1, f * 1.7, t) * nAmt * 1.6;
        var r = meta.radius + simplex3(f * 3, t, 0.5) * nAmt * 0.6;
        var x = Math.cos(angle) * r + nx;
        var y = Math.sin(angle) * r + ny;
        var z = meta.z + nz - scrollNorm * 1.35;
        var ringScale = 0.62 + 0.48 * (0.35 + 0.65 * Math.sin(f * Math.PI));
        var parallax = 1 + (f - 0.5) * 0.06 * scrollNorm;
        dummy.position.set(x, y, z);
        dummy.rotation.set(
          Math.PI / 2 + ny * 2,
          angle + nx * 3,
          nz * 2 + f * 0.2
        );
        dummy.scale.setScalar(ringScale * parallax);
        dummy.updateMatrix();
        rings.setMatrixAt(i, dummy.matrix);
      }
      rings.instanceMatrix.needsUpdate = true;
    }

    function onResize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    function onMouseMove(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    document.addEventListener('visibilitychange', function () {
      running = document.visibilityState === 'visible';
      if (running) requestAnimationFrame(tick);
    });

    function tick(now) {
      if (!running) return;
      var dt = clamp((now - lastTickAt) / 1000, 0.001, 0.05);
      lastTickAt = now;
      time += dt;

      var scrollNorm = typeof global.CronoSpiralScroll === 'number' ? global.CronoSpiralScroll : 0;
      var mouseAlpha = 1 - Math.exp(-10 * dt);
      smoothMouse.x += (mouse.x - smoothMouse.x) * mouseAlpha;
      smoothMouse.y += (mouse.y - smoothMouse.y) * mouseAlpha;

      var pose = sampleTimeline(scrollNorm) || {
        x: 0, y: 0, z: 0, rx: 0.75, ry: 0.15, rz: 0.05, s: 1, camZ: 4.5, camX: 0, camY: 0, frontLayer: 0
      };

      root.position.set(pose.x || 0, pose.y || 0, pose.z || 0);
      root.scale.setScalar(pose.s || 1);
      root.rotation.x = (pose.rx || 0) + smoothMouse.y * cfg.mouseInfluence;
      root.rotation.y = (pose.ry || 0) + smoothMouse.x * cfg.mouseInfluence + time * cfg.driftSpeed;
      root.rotation.z = pose.rz || 0;

      camera.position.x = (pose.camX || 0) + smoothMouse.x * 0.12;
      camera.position.y = (pose.camY || 0) - smoothMouse.y * 0.08;
      camera.position.z = pose.camZ || 4.5;
      camera.lookAt(pose.x || 0, pose.y || 0, 0);

      scene.fog.density = cfg.fogDensity;
      ringMat.opacity = cfg.opacity;

      updateInstances(scrollNorm);

      var frontTarget = pose.frontLayer || 0;
      var frontAlpha = 1 - Math.exp(-8 * dt);
      smoothFront += (frontTarget - smoothFront) * frontAlpha;
      canvas.style.zIndex = smoothFront > 0.42 ? '3' : '0';
      canvas.style.opacity = String(0.9 + smoothFront * 0.1);

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    return {
      setScroll: function (t) { global.CronoSpiralScroll = clamp(t, 0, 1); },
      getSmoothScroll: function () { return global.CronoSpiralScroll || 0; },
      rebuild: function () {
        rebuildHelixMeta();
        onResize();
      },
      destroy: function () {
        running = false;
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mousemove', onMouseMove);
      }
    };
  }

  global.CronoSpiralScene = { create: SpiralScene, config: cfg };
})(window);
