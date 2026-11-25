/* ==========================================================================
   Loading screen — no text.
   1. the frame draws itself   2. dot noise scans in left → right
   3. a lens flare bursts and a light streak sweeps across
   4. the dots condense into forms, then morph once more before the page opens.
   Shown once per browser session; skipped with prefers-reduced-motion.
   ========================================================================== */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seen = false;
  try { seen = sessionStorage.getItem('prieseity:loaded') === '1'; } catch (e) { /* ignore */ }
  if (reduce || seen) return;
  try { sessionStorage.setItem('prieseity:loaded', '1'); } catch (e) { /* ignore */ }

  const root = document.createElement('div');
  root.className = 'loader';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<div class="loader__frame"><canvas></canvas><span class="loader__flare"></span><span class="loader__streak"></span></div>';
  document.documentElement.appendChild(root);
  document.documentElement.classList.add('is-loading');

  const frame = root.firstChild;
  const cv = frame.firstChild;
  const ctx = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = frame.clientWidth || Math.min(560, window.innerWidth * .82);
  const H = frame.clientHeight || Math.round(W / 2.1);
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.scale(dpr, dpr);

  const STEP = Math.max(4, Math.round(W / 96));
  const COLS = Math.floor(W / STEP), ROWS = Math.floor(H / STEP);

  // ---- forms drawn on a tiny canvas, sampled onto the grid ----
  const off = document.createElement('canvas');
  off.width = COLS; off.height = ROWS;
  const o = off.getContext('2d');
  const forms = [
    (c, w, h) => { // bottle, vase, drop, curl, butterfly
      const u = w / 10;
      c.beginPath(); c.ellipse(1.1 * u, h * .5, u * .55, h * .34, 0, 0, 7); c.fill();
      c.fillRect(.85 * u, h * .62, u * .9, h * .24);
      c.beginPath(); c.ellipse(3.1 * u, h * .62, u * .62, h * .26, 0, 0, 7); c.fill();
      c.fillRect(2.95 * u, h * .1, u * .32, h * .32);
      c.beginPath(); c.moveTo(5 * u, h * .08); c.quadraticCurveTo(6 * u, h * .62, 5 * u, h * .9); c.quadraticCurveTo(4 * u, h * .62, 5 * u, h * .08); c.fill();
      c.lineWidth = u * .42; c.beginPath(); c.moveTo(6.8 * u, h * .1); c.lineTo(6.8 * u, h * .55); c.quadraticCurveTo(6.8 * u, h * .86, 7.3 * u, h * .7); c.stroke();
      c.beginPath(); c.ellipse(8.4 * u, h * .4, u * .75, h * .22, -.6, 0, 7); c.fill();
      c.beginPath(); c.ellipse(9.2 * u, h * .4, u * .75, h * .22, .6, 0, 7); c.fill();
      c.beginPath(); c.ellipse(8.5 * u, h * .72, u * .5, h * .16, .5, 0, 7); c.fill();
      c.beginPath(); c.ellipse(9.1 * u, h * .72, u * .5, h * .16, -.5, 0, 7); c.fill();
    },
    (c, w, h) => { // eye in a ring
      c.lineWidth = h * .1;
      c.beginPath(); c.arc(w / 2, h / 2, h * .38, 0, 7); c.stroke();
      c.beginPath(); c.ellipse(w / 2, h / 2, h * .32, h * .13, 0, 0, 7); c.fill();
    }
  ];
  const sample = (draw) => {
    o.clearRect(0, 0, COLS, ROWS); o.fillStyle = '#fff'; o.strokeStyle = '#fff';
    draw(o, COLS, ROWS);
    const d = o.getImageData(0, 0, COLS, ROWS).data, pts = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (d[(y * COLS + x) * 4 + 3] > 90) pts.push([x, y]);
    return pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };
  const targets = forms.map(sample);
  const N = Math.max(...targets.map((t) => t.length), 400);

  // noise field: every dot starts on a random grid cell, revealed by a left→right scan
  const dots = Array.from({ length: N }, () => {
    const x = Math.floor(Math.random() * COLS), y = Math.floor(Math.random() * ROWS);
    return { x, y, tx: x, ty: y, a: 0 };
  }).sort((a, b) => a.x - b.x);
  const assign = (pts) => dots.forEach((d, k) => {
    const p = pts[Math.floor(k * pts.length / N)];
    d.tx = p[0]; d.ty = p[1];
  });

  // timeline (ms)
  const T_SCAN = 350, SCAN = 650, T_FLARE = 900, T_FORM = 1050, T_FORM2 = 2350, T_END = 3300;
  const t0 = performance.now();
  let stage = 0, done = false;
  const s = STEP * .5;

  const tick = (now) => {
    const t = now - t0;
    if (stage === 0 && t > T_FLARE) { stage = 1; root.classList.add('is-flare'); }
    if (stage === 1 && t > T_FORM) { stage = 2; assign(targets[0]); }
    if (stage === 2 && t > T_FORM2) { stage = 3; assign(targets[1]); }

    const scanX = ((t - T_SCAN) / SCAN) * COLS;           // scan head position
    const ease = stage >= 2 ? .09 : 0;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (const d of dots) {
      if (d.x < scanX) d.a = Math.min(1, d.a + .12);
      d.x += (d.tx - d.x) * ease;
      d.y += (d.ty - d.y) * ease;
      if (d.a <= 0) continue;
      ctx.globalAlpha = d.a * (stage >= 2 ? .7 + Math.random() * .3 : .35 + Math.random() * .4);
      ctx.fillRect(d.x * STEP, d.y * STEP, s, s);
    }
    ctx.globalAlpha = 1;

    if (t > T_END && !done) {
      done = true;
      root.classList.add('is-done');
      document.documentElement.classList.remove('is-loading');
      setTimeout(() => root.remove(), 900);
    }
    if (root.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
