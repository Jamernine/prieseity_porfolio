/* ==========================================================================
   Loading screen — "becoming": five stages of a metamorphosis appear one by
   one inside a framed window, rendered as an ASCII / dot-matrix picture on a
   retro CRT (fish-eye bulge, scanlines, flicker, rolling band, power-off).
   No text. Shown once per session; skipped with prefers-reduced-motion.
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
  root.innerHTML = '<div class="loader__tv"><canvas></canvas><span class="loader__glass"></span></div>';
  document.documentElement.appendChild(root);
  document.documentElement.classList.add('is-loading');

  const tv = root.firstChild;
  const cv = tv.firstChild;
  const ctx = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = tv.clientWidth || Math.min(700, window.innerWidth * .9);
  const H = tv.clientHeight || Math.round(W / 2.2);
  const DW = Math.round(W * dpr), DH = Math.round(H * dpr);
  cv.width = DW; cv.height = DH;

  // flat (un-warped) picture is drawn here, then bent onto the visible canvas
  const flat = document.createElement('canvas'); flat.width = DW; flat.height = DH;
  const fx = flat.getContext('2d'); fx.scale(dpr, dpr);
  const mid = document.createElement('canvas'); mid.width = DW; mid.height = DH;
  const mx = mid.getContext('2d');

  // ---- grid inside the frame ----
  const PAD_X = W * .06, PAD_Y = H * .14;                 // frame position inside the screen
  const FW = W - PAD_X * 2, FH = H - PAD_Y * 2;
  const CELL = Math.max(3, Math.round(FW / 128));
  const COLS = Math.floor(FW / CELL), ROWS = Math.floor(FH / CELL);
  const GX = PAD_X + (FW - COLS * CELL) / 2, GY = PAD_Y + (FH - ROWS * CELL) / 2;

  // glyph atlas (density ramp)
  const RAMP = ['·', ':', '-', '=', '+', '*', '#', '%', '@'];
  const G = Math.ceil(CELL * dpr * 1.25);
  const atlas = document.createElement('canvas'); atlas.width = G * RAMP.length; atlas.height = G;
  const a = atlas.getContext('2d');
  a.fillStyle = '#fff'; a.textAlign = 'center'; a.textBaseline = 'middle';
  a.font = `bold ${G}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  RAMP.forEach((ch, i) => a.fillText(ch, i * G + G / 2, G / 2 + G * .06));

  // ---- the five stages, drawn in a unit box (0..1) and sampled onto the grid ----
  const off = document.createElement('canvas'); off.width = COLS; off.height = ROWS;
  const o = off.getContext('2d');
  const SLOTS = 5;
  const slotW = COLS / SLOTS;
  const ink = (c, alpha = 1) => { c.fillStyle = c.strokeStyle = `rgba(255,255,255,${alpha})`; };
  const stripes = (c, path, width, dash) => { // cut segment bands across a thick stroke
    c.save(); c.globalCompositeOperation = 'destination-out'; c.lineCap = 'butt'; c.lineWidth = width * 1.1; c.setLineDash(dash); c.stroke(path); c.restore();
  };
  const STAGES = [
    // 1 · curled caterpillar
    (c) => {
      const body = new Path2D('M .52 .06 C .44 .25 .36 .45 .38 .62 C .4 .82 .58 .9 .74 .84 C .8 .82 .84 .8 .86 .78');
      ink(c); c.lineWidth = .2; c.lineCap = 'round'; c.stroke(body);
      stripes(c, body, .2, [.012, .03]);
      c.lineWidth = .03; c.beginPath(); c.moveTo(.86, .78); c.quadraticCurveTo(.96, .82, 1, .96); c.moveTo(.84, .8); c.quadraticCurveTo(.92, .9, .9, 1); c.stroke();
      c.lineWidth = .025; c.beginPath(); c.moveTo(.52, .06); c.quadraticCurveTo(.4, .02, .3, .06); c.stroke();
    },
    // 2 · hanging, skin splitting
    (c) => {
      ink(c, .95);
      c.beginPath(); c.moveTo(.42, .02); c.bezierCurveTo(.7, .05, .66, .3, .62, .52); c.bezierCurveTo(.5, .44, .36, .32, .38, .02); c.fill();
      const top = new Path2D('M .52 .06 C .56 .2 .58 .34 .6 .5'); c.lineWidth = .16; stripes(c, top, .16, [.01, .035]);
      ink(c, .85); c.lineWidth = .035;
      c.beginPath(); c.moveTo(.36, .36); c.bezierCurveTo(.26, .6, .3, .95, .5, .96); c.bezierCurveTo(.7, .96, .74, .62, .64, .42); c.stroke();
      ink(c, .28); c.fill();
    },
    // 3 · chrysalis
    (c) => {
      ink(c, .9); c.lineWidth = .035;
      c.beginPath(); c.moveTo(.5, .02); c.lineTo(.5, .14); c.stroke();
      const shell = new Path2D('M .5 .14 C .3 .18 .26 .4 .27 .62 C .28 .86 .38 .96 .52 .96 C .68 .96 .74 .84 .74 .62 C .74 .4 .68 .2 .5 .14 Z');
      ink(c, .22); c.fill(shell);
      ink(c, 1); c.stroke(shell);
      ink(c, .55); c.lineWidth = .02; c.beginPath(); c.moveTo(.3, .38); c.quadraticCurveTo(.5, .44, .72, .36); c.stroke();
    },
    // 4 · emerging: empty shell above, crumpled wings unfolding below
    (c) => {
      ink(c, .9); c.lineWidth = .03;
      c.beginPath(); c.moveTo(.56, .02); c.lineTo(.56, .1); c.stroke();
      const shell = new Path2D('M .56 .1 C .4 .12 .36 .3 .4 .5 L .72 .5 C .74 .3 .7 .12 .56 .1 Z');
      ink(c, .18); c.fill(shell); ink(c, .95); c.stroke(shell);
      ink(c, 1);
      c.beginPath(); c.moveTo(.62, .48); c.bezierCurveTo(.9, .5, .86, .8, .62, .78); c.bezierCurveTo(.5, .84, .36, .98, .1, .96); c.bezierCurveTo(.24, .82, .4, .7, .5, .58); c.closePath(); c.fill();
      const fold = new Path2D('M .2 .92 C .36 .82 .5 .7 .7 .62'); c.lineWidth = .1; stripes(c, fold, .1, [.008, .028]);
    },
    // 5 · butterfly
    (c) => {
      const fore = new Path2D('M .46 .62 C .36 .4 .32 .2 .4 .06 C .62 .1 .86 .2 .98 .3 C .9 .44 .72 .56 .46 .62 Z');
      const hind = new Path2D('M .46 .62 C .3 .62 .08 .68 .04 .78 C .14 .9 .32 .96 .5 .9 C .52 .8 .5 .7 .46 .62 Z');
      const back = new Path2D('M .5 .6 C .6 .4 .74 .24 .9 .18 C .98 .32 .92 .5 .62 .64 Z');
      ink(c, .5); c.fill(back);
      ink(c, .32); c.fill(fore); c.fill(hind);
      ink(c, 1); c.lineWidth = .03; c.stroke(fore); c.stroke(hind); c.lineWidth = .02; c.stroke(back);
      c.lineWidth = .016;                                     // veins
      [[.42, .1], [.6, .12], [.78, .18], [.92, .28], [.84, .42]].forEach(([x, y]) => { c.beginPath(); c.moveTo(.46, .62); c.quadraticCurveTo((.46 + x) / 2 - .02, (.62 + y) / 2 + .04, x, y); c.stroke(); });
      [[.08, .74], [.18, .88], [.36, .93]].forEach(([x, y]) => { c.beginPath(); c.moveTo(.46, .62); c.lineTo(x, y); c.stroke(); });
      c.save(); c.clip(fore); c.lineWidth = .1; c.stroke(fore); c.restore();  // dark wing border
      c.save(); c.clip(hind); c.lineWidth = .08; c.stroke(hind); c.restore();
      ink(c, 1); c.lineWidth = .05; c.beginPath(); c.moveTo(.46, .64); c.lineTo(.58, .5); c.stroke(); // body
    }
  ];
  const fields = STAGES.map((draw, s) => {
    o.clearRect(0, 0, COLS, ROWS);
    const sw = slotW * .94, sh = Math.min(ROWS * .88, slotW * 1.25); o.save(); o.translate(s * slotW + (slotW - sw) / 2, (ROWS - sh) / 2); o.scale(sw, sh);
    draw(o);
    o.restore();
    const d = o.getImageData(0, 0, COLS, ROWS).data, f = new Float32Array(COLS * ROWS);
    for (let i = 0; i < f.length; i++) f[i] = d[i * 4 + 3] / 255;
    return f;
  });
  const field = new Float32Array(COLS * ROWS);
  const slotOf = (x) => Math.min(SLOTS - 1, Math.floor(x / slotW));

  // timeline (ms)
  const T_FRAME = 120, FRAME_DUR = 420, T_FIRST = 560, GAP = 430, GROW = 520, T_OFF = 3600, T_END = 4150;
  const cur = new Float32Array(COLS * ROWS);
  const seed = new Float32Array(COLS * ROWS).map(() => Math.random());
  const t0 = performance.now();
  let off2 = false, done = false;
  const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  // fish-eye: bend rows, then columns (barrel distortion)
  const K = .085;
  const warp = () => {
    mx.clearRect(0, 0, DW, DH);
    for (let y = 0; y < DH; y += 2) {
      const v = (y / DH) * 2 - 1, s = 1 - K * v * v * 1.4;
      mx.drawImage(flat, 0, y, DW, 2, (DW - DW * s) / 2, y, DW * s, 2);
    }
    ctx.clearRect(0, 0, DW, DH);
    for (let x = 0; x < DW; x += 2) {
      const u = (x / DW) * 2 - 1, s = 1 - K * u * u;
      ctx.drawImage(mid, x, 0, 2, DH, x, (DH - DH * s) / 2, 2, DH * s);
    }
    // faint chromatic fringe
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .1;
    ctx.drawImage(cv, -2 * dpr, 0); ctx.drawImage(cv, 2 * dpr, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  };

  const frameAt = (t) => {
    fx.clearRect(0, 0, W, H);
    // frame lines draw clockwise from the top-left
    const p = sm((t - T_FRAME) / FRAME_DUR), per = 2 * (FW + FH);
    let len = p * per;
    fx.strokeStyle = 'rgba(255,255,255,.95)'; fx.lineWidth = 2; fx.beginPath(); fx.moveTo(PAD_X, PAD_Y);
    const seg = (dx, dy, l) => { const k = Math.min(1, len / l); fx.lineTo(fx._x += dx * k, fx._y += dy * k); len -= l; return len > 0; };
    fx._x = PAD_X; fx._y = PAD_Y;
    if (len > 0 && seg(FW, 0, FW) && seg(0, FH, FH) && seg(-FW, 0, FW)) seg(0, -FH, FH);
    fx.stroke();

    // stages grow in one by one
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x, s = slotOf(x);
        const k = (t - (T_FIRST + s * GAP)) / GROW;         // 0 → 1 for this slot
        let target = 0;
        if (k > 0) {
          const f = fields[s][i];
          const grow = sm(k * 1.4 - (1 - y / ROWS) * .4);    // forms rise from the bottom like growth
          target = k < .35 ? (seed[i] > .7 && f > .05 ? Math.random() * .8 : 0) : f * grow;
          if (k < 1 && Math.random() < .08 * (1 - k)) target = Math.random() * .6; // static
        }
        cur[i] += (target - cur[i]) * .3;
        const v = cur[i] * (.85 + Math.random() * .15);
        if (v < .05) continue;
        fx.globalAlpha = Math.min(1, .3 + v * 1.5);
        const g = Math.min(RAMP.length - 1, Math.floor(v * RAMP.length));
        fx.drawImage(atlas, g * G, 0, G, G, GX + x * CELL, GY + y * CELL, CELL, CELL);
      }
    }
    fx.globalAlpha = 1;
  };

  const tick = (now) => {
    const t = now - t0;
    frameAt(t);
    warp();
    if (!off2 && t > T_OFF) { off2 = true; root.classList.add('is-off'); }
    if (t > T_END && !done) {
      done = true;
      root.classList.add('is-done');
      document.documentElement.classList.remove('is-loading');
      setTimeout(() => root.remove(), 700);
    }
    if (root.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
