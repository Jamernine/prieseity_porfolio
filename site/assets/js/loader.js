/* ==========================================================================
   Loading screen — ASCII / dot-matrix "intersection" (no text).
   Timeline
     0.00s  frame lines draw in from the left
     0.25s  a scan head sweeps left → right, leaving flickering static behind
     0.95s  lens flare bursts, a light streak crosses the window
     1.10s  static resolves into halftone forms (bottle · vase · drop · curl · butterfly)
     2.15s  glitch-morph (left → right wave) into an eye inside a ring
     3.05s  glitch-morph into a row of film frames
     3.75s  everything wipes out to the right, screen fades to the page
   Each cell is drawn with a glyph from a density ramp, so shapes read as
   shaded dot-matrix / ASCII rather than flat silhouettes.
   Shown once per session; skipped with prefers-reduced-motion.
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
  const W = frame.clientWidth || Math.min(620, window.innerWidth * .84);
  const H = frame.clientHeight || Math.round(W / 2.1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);

  // ---- grid ----
  const CELL = Math.max(4, Math.round(W / 118));          // px per cell
  const COLS = Math.floor(W / CELL), ROWS = Math.floor(H / CELL);
  const OX = (W - COLS * CELL) / 2, OY = (H - ROWS * CELL) / 2;
  const SIZE = COLS * ROWS;

  // ---- glyph atlas: density ramp drawn once, blitted per cell ----
  const RAMP = ['·', ':', '-', '=', '+', '*', '#', '%', '@'];
  const atlas = document.createElement('canvas');
  const G = Math.ceil(CELL * dpr);
  atlas.width = G * RAMP.length; atlas.height = G;
  const a = atlas.getContext('2d');
  a.fillStyle = '#fff'; a.textAlign = 'center'; a.textBaseline = 'middle';
  a.font = `${Math.round(G * 1.05)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  RAMP.forEach((ch, i) => a.fillText(ch, i * G + G / 2, G / 2 + G * .06));

  // ---- forms: drawn with soft radial shading, sampled as luminance ----
  const off = document.createElement('canvas');
  off.width = COLS; off.height = ROWS;
  const o = off.getContext('2d');
  const shade = (c, x, y, r) => {
    const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r * 1.15);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,.45)');
    return g;
  };
  const blob = (c, x, y, rx, ry, rot = 0) => { c.fillStyle = shade(c, x, y, Math.max(rx, ry)); c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, 7); c.fill(); };
  const FORMS = [
    (c, w, h) => { // bottle · vase · drop · curl · butterfly
      const u = w / 10;
      blob(c, 1.1 * u, h * .52, u * .55, h * .33);
      c.fillStyle = shade(c, 1.3 * u, h * .74, u); c.fillRect(.8 * u, h * .6, u * .95, h * .28);
      blob(c, 3.1 * u, h * .64, u * .62, h * .25);
      c.fillStyle = shade(c, 3.1 * u, h * .25, u * .5); c.fillRect(2.94 * u, h * .1, u * .32, h * .34);
      c.fillStyle = shade(c, 5 * u, h * .55, u * .8);
      c.beginPath(); c.moveTo(5 * u, h * .08); c.quadraticCurveTo(6 * u, h * .62, 5 * u, h * .9); c.quadraticCurveTo(4 * u, h * .62, 5 * u, h * .08); c.fill();
      c.strokeStyle = shade(c, 6.9 * u, h * .5, u); c.lineWidth = u * .42; c.lineCap = 'round';
      c.beginPath(); c.moveTo(6.8 * u, h * .1); c.lineTo(6.8 * u, h * .55); c.quadraticCurveTo(6.8 * u, h * .88, 7.35 * u, h * .7); c.stroke();
      blob(c, 8.35 * u, h * .4, u * .78, h * .22, -.6); blob(c, 9.25 * u, h * .4, u * .78, h * .22, .6);
      blob(c, 8.45 * u, h * .72, u * .5, h * .16, .5); blob(c, 9.15 * u, h * .72, u * .5, h * .16, -.5);
    },
    (c, w, h) => { // eye in a ring
      c.strokeStyle = shade(c, w / 2, h / 2, h * .4); c.lineWidth = h * .09;
      c.beginPath(); c.arc(w / 2, h / 2, h * .39, 0, 7); c.stroke();
      c.fillStyle = shade(c, w / 2, h / 2, h * .32);
      c.beginPath(); c.moveTo(w / 2 - h * .34, h / 2); c.quadraticCurveTo(w / 2, h / 2 - h * .3, w / 2 + h * .34, h / 2); c.quadraticCurveTo(w / 2, h / 2 + h * .3, w / 2 - h * .34, h / 2); c.fill();
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(w / 2, h / 2, h * .09, 0, 7); c.fill();
      c.globalCompositeOperation = 'source-over'; c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2, h / 2, h * .045, 0, 7); c.fill();
      for (let i = 0; i < 12; i++) { // rays
        const ang = i / 12 * Math.PI * 2, r0 = h * .43, r1 = h * .49;
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(w / 2 + Math.cos(ang) * r0, h / 2 + Math.sin(ang) * r0); c.lineTo(w / 2 + Math.cos(ang) * r1, h / 2 + Math.sin(ang) * r1); c.stroke();
      }
    },
    (c, w, h) => { // film frames with sprocket holes
      const fw = w * .19, gap = w * .025, x0 = (w - (fw * 4 + gap * 3)) / 2;
      for (let i = 0; i < 4; i++) {
        const x = x0 + i * (fw + gap);
        c.fillStyle = shade(c, x + fw / 2, h / 2, fw * .7); c.fillRect(x, h * .2, fw, h * .6);
        c.globalCompositeOperation = 'destination-out'; c.fillRect(x + fw * .12, h * .3, fw * .76, h * .4); c.globalCompositeOperation = 'source-over';
      }
      c.fillStyle = 'rgba(255,255,255,.8)';
      for (let x = x0; x < w - x0; x += w * .03) { c.fillRect(x, h * .1, w * .014, h * .05); c.fillRect(x, h * .85, w * .014, h * .05); }
    }
  ];
  const sample = (draw) => {
    o.clearRect(0, 0, COLS, ROWS);
    draw(o, COLS, ROWS);
    const d = o.getImageData(0, 0, COLS, ROWS).data;
    const f = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) f[i] = d[i * 4 + 3] / 255;
    return f;
  };
  const fields = FORMS.map(sample);

  // per-cell state
  const cur = new Float32Array(SIZE);                       // displayed brightness
  const noise = new Float32Array(SIZE).map(() => Math.random());
  const jitter = new Float32Array(SIZE).map(() => Math.random());

  // timeline (ms)
  const T = { scan: 250, scanDur: 700, flare: 950, form: [1100, 2150, 3050], morph: 650, out: 3750, end: 4250 };
  const t0 = performance.now();
  let flared = false, done = false;
  const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  const draw = (now) => {
    const t = now - t0;
    if (!flared && t > T.flare) { flared = true; root.classList.add('is-flare'); }

    // which form, and how far the left→right morph wave has travelled
    let fi = -1;
    for (let k = 0; k < T.form.length; k++) if (t >= T.form[k]) fi = k;
    const wave = fi >= 0 ? (t - T.form[fi]) / T.morph : 0;   // 0 → 1 across the grid
    const prev = fi > 0 ? fields[fi - 1] : null;
    const next = fi >= 0 ? fields[fi] : null;
    const scanCol = ((t - T.scan) / T.scanDur) * COLS;
    const outCol = ((t - T.out) / (T.end - T.out)) * (COLS + 12);

    ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x;
        let target;
        if (fi < 0) {
          // static field revealed by the scan head
          target = x < scanCol ? (noise[i] > .62 ? .25 + Math.random() * .55 : Math.random() * .12) : 0;
        } else {
          const local = sm(wave * 1.35 - (x / COLS) * .35 - jitter[i] * .12); // staggered wave
          const from = prev ? prev[i] : (noise[i] > .62 ? .45 : .06);
          target = from + (next[i] - from) * local;
          // glitch: cells in the moving front scramble
          if (local > 0 && local < 1 && Math.random() < .35) target = Math.random();
        }
        if (t > T.out && x < outCol) target *= Math.max(0, 1 - (outCol - x) / 10);
        cur[i] += (target - cur[i]) * .35;
        const v = cur[i] * (.82 + Math.random() * .18);      // LED flicker
        if (v < .06) continue;
        const g = Math.min(RAMP.length - 1, Math.floor(v * RAMP.length));
        ctx.globalAlpha = Math.min(1, .15 + v * 1.4);
        ctx.drawImage(atlas, g * G, 0, G, G, OX + x * CELL, OY + y * CELL, CELL, CELL);
      }
      // bright scan head
      if (fi < 0 && scanCol > 0 && scanCol < COLS) {
        ctx.globalAlpha = .9;
        ctx.fillStyle = '#fff';
        ctx.fillRect(OX + scanCol * CELL, OY, 1.5, ROWS * CELL);
      }
    }
    ctx.globalAlpha = 1;

    if (t > T.end && !done) {
      done = true;
      root.classList.add('is-done');
      document.documentElement.classList.remove('is-loading');
      setTimeout(() => root.remove(), 900);
    }
    if (root.isConnected) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
})();
