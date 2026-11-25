/* ==========================================================================
   Loading screen — dot-matrix morph inside a framed window (no text).
   Dots fade in a column at a time, then morph through a sequence of shapes.
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
  root.innerHTML = '<div class="loader__frame"><canvas></canvas></div>';
  document.documentElement.appendChild(root);
  document.documentElement.classList.add('is-loading');

  const frame = root.firstChild;
  const cv = frame.firstChild;
  const ctx = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // fall back to a computed size if the stylesheet hasn't applied yet
  const W = frame.clientWidth || Math.min(560, window.innerWidth * .82);
  const H = frame.clientHeight || Math.round(W / 2.1);
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.scale(dpr, dpr);

  const STEP = Math.max(5, Math.round(W / 70));          // grid pitch
  const COLS = Math.floor(W / STEP), ROWS = Math.floor(H / STEP);

  // ---- shapes, drawn on an offscreen canvas and sampled onto the grid ----
  const off = document.createElement('canvas');
  off.width = COLS; off.height = ROWS;
  const o = off.getContext('2d');
  const shapes = [
    (c, w, h) => { // standing forms: bottle, drop, figure
      const u = w / 10;
      c.beginPath(); c.ellipse(1.5 * u, h * .55, u * .7, h * .36, 0, 0, 7); c.fill();
      c.beginPath(); c.ellipse(3.6 * u, h * .6, u * .75, h * .3, 0, 0, 7); c.fill();
      c.fillRect(3.35 * u, h * .12, u * .5, h * .25);
      c.beginPath(); c.moveTo(5.6 * u, h * .1); c.quadraticCurveTo(6.9 * u, h * .7, 5.6 * u, h * .92); c.quadraticCurveTo(4.3 * u, h * .7, 5.6 * u, h * .1); c.fill();
      c.beginPath(); c.ellipse(8.2 * u, h * .55, u * 1.1, h * .3, -.5, 0, 7); c.fill();
      c.beginPath(); c.ellipse(8.6 * u, h * .5, u * 1.1, h * .3, .5, 0, 7); c.fill();
    },
    (c, w, h) => { // an eye inside a ring
      c.lineWidth = h * .12;
      c.beginPath(); c.arc(w / 2, h / 2, h * .38, 0, 7); c.stroke();
      c.beginPath(); c.ellipse(w / 2, h / 2, h * .3, h * .14, 0, 0, 7); c.fill();
    },
    (c, w, h) => { // wave field
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x / w * Math.PI * 3) * h * .25;
        c.fillRect(x, y - h * .14, 1, h * .28);
      }
    },
    (c, w, h) => { // film frames
      const fw = w / 4.6;
      for (let i = 0; i < 4; i++) c.fillRect(w * .06 + i * fw * 1.12, h * .2, fw, h * .6);
    }
  ];
  const sample = (draw) => {
    o.clearRect(0, 0, COLS, ROWS); o.fillStyle = '#fff'; o.strokeStyle = '#fff';
    draw(o, COLS, ROWS);
    const d = o.getImageData(0, 0, COLS, ROWS).data, pts = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (d[(y * COLS + x) * 4 + 3] > 100) pts.push([x, y]);
    return pts;
  };
  const targets = shapes.map(sample);
  const N = Math.max(...targets.map((t) => t.length));

  // dots start scattered across the frame and reveal column by column
  const dots = Array.from({ length: N }, () => {
    const x = Math.random() * COLS, y = Math.random() * ROWS;
    return { x, y, tx: x, ty: y, a: 0, born: (x / COLS) * 700 + Math.random() * 300 };
  });
  const assign = (pts) => {
    // sort both by x so the morph sweeps left→right instead of crossing randomly
    const order = dots.map((d, i) => i).sort((a, b) => dots[a].x - dots[b].x);
    const sorted = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    order.forEach((di, k) => {
      const p = sorted[Math.floor(k * sorted.length / N)];
      dots[di].tx = p[0] + (Math.random() - .5) * .6;
      dots[di].ty = p[1] + (Math.random() - .5) * .6;
    });
  };

  const t0 = performance.now();
  const HOLD = 620;                     // time per shape
  let shapeIdx = -1, done = false;
  const total = 700 + shapes.length * HOLD + 250;

  const tick = (now) => {
    const t = now - t0;
    const want = Math.min(shapes.length - 1, Math.floor(Math.max(0, t - 450) / HOLD));
    if (want !== shapeIdx) { shapeIdx = want; assign(targets[shapeIdx]); }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    const s = STEP * .42;
    for (const d of dots) {
      if (t > d.born) d.a = Math.min(1, d.a + .06);
      d.x += (d.tx - d.x) * .14;
      d.y += (d.ty - d.y) * .14;
      if (d.a <= 0) continue;
      ctx.globalAlpha = d.a * (.55 + Math.random() * .45);   // subtle flicker
      ctx.fillRect(d.x * STEP, d.y * STEP, s, s);
    }
    ctx.globalAlpha = 1;

    if (t > total && !done) {
      done = true;
      root.classList.add('is-done');
      document.documentElement.classList.remove('is-loading');
      setTimeout(() => root.remove(), 900);
    }
    if (!done || root.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
