/* ==========================================================================
   Prieseity — rendering + motion
   ========================================================================== */
(function () {
  const S = window.SITE;
  const page = document.body.dataset.page || 'home';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const param = (k) => new URLSearchParams(location.search).get(k);
  const pad = (n) => String(n).padStart(2, '0');

  const arrowSvg = '<svg viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3M11 3H4.5M11 3V9.5" stroke="currentColor" stroke-width="1.2"/></svg>';
  const arrow = `<span class="arrow" aria-hidden="true">${arrowSvg}${arrowSvg}</span>`;

  const navLinks = [
    { href: 'works.html', label: 'Works', key: 'works' },
    { href: 'about.html', label: 'About', key: 'about' },
    { href: 'contact.html', label: 'Contact', key: 'contact' }
  ];
  const activeKey = { work: 'works' }[page] || page;
  const igUrl = S.instagram ? `https://www.instagram.com/${S.instagram}/` : '';
  const has = (arr) => Array.isArray(arr) && arr.length > 0;
  const primaryContact = igUrl
    ? `<a class="link-arrow" href="${igUrl}" target="_blank" rel="noopener">@${S.instagram} ${arrow}</a>`
    : S.email ? `<a class="link-arrow" href="mailto:${S.email}">${S.email} ${arrow}</a>` : '';

  // categories (clusters) + their projects
  const cats = (S.categories || []).map((c, i) => ({ ...c, n: i + 1, items: S.projects.filter((p) => p.category === c.id) })).filter((c) => c.items.length);
  const catOf = (p) => cats.find((c) => c.id === p.category);
  const catHref = (c) => (c.items.length === 1 ? `work.html?slug=${c.items[0].slug}` : `works.html?c=${c.id}`);

  /* ---------------- partials ---------------- */
  function header() {
    const links = navLinks.map((l) => `<a href="${l.href}"${l.key === activeKey ? ' aria-current="page"' : ''}>${l.label}</a>`).join('');
    const status = S.available ? '<span class="dot"></span>Available for hire' : 'Booked for ' + S.year;
    return `
      <header class="site-header" id="top-header">
        <div class="container">
          <a href="index.html" class="wordmark-sm" aria-label="${S.name} — home">${S.name}</a>
          <span class="status">${status}</span>
          <nav class="nav" aria-label="Primary">${links}</nav>
          <button class="menu-toggle" aria-expanded="false" aria-controls="mobile-panel">Menu</button>
        </div>
      </header>
      <div class="mobile-panel" id="mobile-panel" aria-hidden="true">
        <nav aria-label="Mobile"><a href="index.html">Home</a>${links}</nav>
        <div style="display:flex;flex-direction:column;gap:16px">
          <span class="status">${status}</span>
          ${primaryContact}
        </div>
      </div>`;
  }

  function cta() {
    return `
      <section class="cta" id="cta">
        <div class="container">
          <div class="cta__box reveal">
            <video class="cta__video" src="assets/video/halftone.webm" autoplay muted loop playsinline aria-hidden="true"></video>
            <img class="cta__lily" src="assets/img/lily.png" alt="" aria-hidden="true">
            <span class="label"><span class="star">✦</span> Let's work together</span>
            <h2>Give your brand a <em>light</em> of its own.</h2>
            <p>Tell me about the world you're building. I reply within two working days.</p>
            <a class="btn btn--light" href="contact.html#contact">Get In Touch ${arrow}</a>
          </div>
        </div>
      </section>`;
  }

  function footer() {
    const socials = S.socials.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener">${s.label}</a></li>`).join('');
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-cols">
            <div class="footer-col"><h4 class="label">Pages</h4><ul>
              <li><a href="index.html">Home</a></li><li><a href="works.html">Works</a></li>
              <li><a href="about.html">About</a></li><li><a href="contact.html">Contact</a></li></ul></div>
            <div class="footer-col"><h4 class="label">Contact</h4><ul>
              ${S.email ? `<li><a href="mailto:${S.email}">${S.email}</a></li>` : ''}${socials}</ul></div>
            <div class="footer-col"><h4 class="label">Legal</h4><ul>
              <li><a href="privacy.html">Privacy Policy</a></li><li><a href="tos.html">Terms of Service</a></li></ul></div>
          </div>
          <div class="footer-wordmark" aria-hidden="true">${S.name}</div>
          <div class="footer-credit">
            <span>© ${S.year} ${S.name}</span>
            <span>${S.location}</span>
            <a href="#" data-top class="link-arrow">Back to top ↑</a>
          </div>
        </div>
      </footer>`;
  }

  /* ---------------- reusable blocks ---------------- */
  // a cover made of several frames of one video, side by side
  const coverStrip = (s, title) => `<div class="cover-strip" role="img" aria-label="${esc(title)}">${s.times.map((t) => `<video src="${s.video}#t=${t}" muted playsinline preload="metadata" tabindex="-1" aria-hidden="true"></video>`).join('')}</div>`;
  const coverImg = (src, alt, pos) => `<img src="${src}" alt="${esc(alt)}" loading="lazy"${pos ? ` style="object-position:${pos}"` : ''}>`;

  // cluster card — one cover per category, shown in the shared cobalt tone (true colour on hover)
  const clusterCard = (c) => `
    <a class="work-card cluster-card reveal" href="${catHref(c)}" data-view>
      ${c.panel
        ? `<div class="work-card__media art-panel${c.artShape ? ' art-panel--' + c.artShape : ''}"><img src="${c.cover}" alt="${esc(c.name)}" loading="lazy"></div>`
        : `<div class="work-card__media">${coverImg(c.cover, c.name, c.coverPos)}</div>`}
      <div class="work-card__meta">
        <span class="work-card__idx">${pad(c.n)}</span>
        <h3 class="work-card__title">${esc(c.name)}</h3>
        <span class="work-card__disc">${c.items.length > 1 ? `${c.items.length} projects` : esc(c.items[0].discipline)}</span>
      </div>
    </a>`;

  const workCard = (p) => `
    <a class="work-card reveal" href="work.html?slug=${p.slug}" data-view>
      <div class="work-card__media">${p.coverStrip ? coverStrip(p.coverStrip, p.title) : coverImg(p.cover, `${p.title} — ${p.discipline}`, p.coverPos)}${p.coverVideo ? `<video class="work-card__video" src="${p.coverVideo}" muted loop playsinline preload="none" aria-hidden="true"></video>` : ''}</div>
      <div class="work-card__meta"><h3 class="work-card__title">${esc(p.title)}</h3><span class="work-card__disc">${esc(p.discipline)}</span></div>
    </a>`;

  const sectionHead = (idx, label, title, right = '') => `
    <div class="section-head reveal">
      <span class="section-head__idx">${idx}</span>
      <span class="label">${label}</span>
      <h2 class="h-section">${title}</h2>
      ${right ? `<div class="section-head__right">${right}</div>` : ''}
    </div>`;

  /* ---------------- pages ---------------- */
  function renderHome() {
    const h = S.hero;
    return `
      <section class="hero" id="hero">
        <span class="hero__px" style="--x:31%;--y:14%;--c:var(--blue)"></span>
        <span class="hero__px" style="--x:78%;--y:24%;--c:var(--neon)"></span>
        <span class="hero__px" style="--x:56%;--y:74%;--c:var(--blue)"></span>
        <div class="container hero__inner">
          <div class="hero__top appear appear--center">
            <h1 class="hero__title">
              <span class="hero__name">${esc(S.name)}</span>
              <span class="hero__role">${esc(h.title || S.role)}</span>
            </h1>
            <div class="hero__chips">${h.expertise.map((e) => `<span class="hero__chip">${esc(e)}</span>`).join('')}</div>
          </div>
          <div class="hero__bottom appear">
            <div class="hero__intro">${h.intro.map((p) => `<p>${p}</p>`).join('')}</div>
            <aside class="hero__card">
              <span class="hero__card-label"><span class="dot"></span>${S.available ? `Booking projects for ${+S.year + 1}` : 'Currently booked'}</span>
              <div class="hero__photo"><img src="assets/img/hero.jpg" alt="Portrait of ${esc(S.name)}"></div>
              <a class="hero__cta" href="contact.html#contact">Book a call ${arrow}</a>
            </aside>
          </div>
        </div>
      </section>

      <section class="section" id="about">
        <div class="container about-teaser">
          <span class="label reveal">${S.about.label}</span>
          <div class="text reveal">
            <p class="lead">${S.about.text}</p>
            <a class="link-arrow" href="about.html">More about me ${arrow}</a>
          </div>
        </div>
      </section>

      <section class="section section--tight" id="tools">
        <div class="container tools">
          <span class="label reveal">Tools</span>
          <div class="logos-row reveal">${S.tools.map((t) => `<span class="logo-mark" title="${esc(t.name)}"><img src="assets/logos/color/${t.logo}.svg" alt="${esc(t.name)}" loading="lazy"></span>`).join('')}</div>
        </div>
      </section>

      <section class="section" id="works">
        <div class="container">
          ${sectionHead('01', 'Selected work', 'Works', `<a class="link-arrow" href="works.html">All works ${arrow}</a>`)}
          <div class="works-grid">${cats.map(clusterCard).join('')}</div>
        </div>
      </section>

      <section class="section" id="services">
        <div class="container">
          ${sectionHead('02', 'Services', 'What I do')}
          <div class="services">${S.services.map((s, i) => {
            const linked = (s.projects || []).map((slug) => S.projects.find((p) => p.slug === slug)).filter(Boolean);
            return `
            <div class="service reveal">
              <span class="service__idx">${pad(i + 1)}</span>
              <h3 class="service__name">${s.name}</h3>
              <div class="service__body">
                <p class="service__desc">${s.desc}</p>
              </div>
            </div>`;
          }).join('')}</div>
        </div>
      </section>`;
  }

  function renderAbout() {
    return `
      <section class="page-intro" id="about">
        <div class="container page-intro__grid">
          <span class="label reveal">About</span>
          <h1 class="page-title reveal">The eye behind <em>the frame</em></h1>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="container about-hero">
          <div class="about-hero__img reveal"><img src="assets/img/portrait.jpg" alt="Portrait of ${S.name}"></div>
          <div class="about-hero__text reveal">
            <p>${S.about.text}</p>
            ${S.about.long.map((p) => `<p>${p}</p>`).join('')}
            <div class="chips">${S.hero.expertise.map((e) => `<span class="chip">${e}</span>`).join('')}</div>
          </div>
        </div>
      </section>
      ${has(S.experience) ? `
      <section class="section" id="experience">
        <div class="container">
          ${sectionHead('—', 'Experience', 'Where I have worked')}
          <div class="list-rows">${S.experience.map((e) => `<div class="list-row reveal"><span>${e.role}</span><span class="muted">${e.place}</span><span class="muted">${e.time}</span></div>`).join('')}</div>
        </div>
      </section>` : ''}
      <section class="section" id="selected">
        <div class="container">
          ${sectionHead('—', 'Selected work', 'A few things I have made', `<a class="link-arrow" href="works.html">All works ${arrow}</a>`)}
          <div class="works-grid">${cats.slice(0, 2).map(clusterCard).join('')}</div>
        </div>
      </section>`;
  }

  function renderWorks() {
    const c = cats.find((x) => x.id === param('c'));
    if (c) {
      document.title = `${c.name} — ${S.name}`;
      return `
      <section class="page-intro" id="info">
        <div class="container page-intro__grid">
          <a class="link-arrow reveal" href="works.html">← All works</a>
          <div class="page-intro__text">
            <span class="label reveal">${pad(c.n)} · ${c.items.length} projects</span>
            <h1 class="page-title reveal">${esc(c.name)}</h1>
            <p class="lead reveal">${esc(c.note || '')}</p>
          </div>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="container works-grid">${c.items.map(workCard).join('')}</div>
      </section>`;
    }
    return `
      <section class="page-intro" id="info">
        <div class="container page-intro__grid">
          <span class="label reveal">${S.projects.length} projects · ${cats.length} groups</span>
          <div class="page-intro__text">
            <h1 class="page-title reveal">Works</h1>
            <p class="lead reveal">AI films, my own brand, hackathons, collaborations and freelance work — grouped by what they are.</p>
          </div>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="container">
          <div class="works-grid">${cats.map(clusterCard).join('')}</div>
        </div>
      </section>`;
  }

  function renderWork() {
    const found = S.projects.find((p) => p.slug === param('slug'));
    const p = found || S.projects[0];
    const cat = catOf(p);
    const siblings = cat ? cat.items : S.projects;
    const i = siblings.indexOf(p);
    const next = siblings.length > 1 ? siblings[(i + 1) % siblings.length] : S.projects[(S.projects.indexOf(p) + 1) % S.projects.length];
    document.title = `${p.title} — ${S.name}`;
    const wideIf = (w, h) => `if(${w}>${h}*1.15)this.parentElement.classList.add('wide')`;
    const gallery = p.gallery.map((g, k) => {
      if (typeof g === 'object' && g.youtube) {
        return `<figure class="reveal wide is-video is-embed"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(g.youtube)}?rel=0" title="${esc(g.title || p.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></figure><a class="yt-link reveal" href="https://youtu.be/${encodeURIComponent(g.youtube)}" target="_blank" rel="noopener">Watch on YouTube ${arrow}</a>`;
      }
      if (typeof g === 'object' && g.video) {
        return `<figure class="reveal is-video"><video src="${g.video}" poster="${g.poster || ''}" muted loop playsinline ${g.noAutoplay ? '' : 'autoplay'} controls preload="metadata" onloadedmetadata="${wideIf('this.videoWidth', 'this.videoHeight')}"></video>${g.label ? `<figcaption>${esc(g.label)}</figcaption>` : ''}</figure>`;
      }
      return `<figure class="reveal"><img src="${g}" alt="${esc(p.title)} — image ${k + 1}" loading="lazy" onload="${wideIf('this.naturalWidth', 'this.naturalHeight')}"></figure>`;
    }).join('');
    const back = cat && cat.items.length > 1 ? `<a class="link-arrow" href="works.html?c=${cat.id}">← ${esc(cat.name)}</a>` : `<a class="link-arrow" href="works.html">← All works</a>`;
    return `
      <section class="container project-head">
        <div class="project-crumbs reveal">${back}<span class="chip">${esc(p.engagement || 'Freelance · Project-based')}</span></div>
        <h1 class="page-title reveal">${esc(p.title)}</h1>
        <div class="project-meta reveal">
          <div><span class="label">Discipline</span><span>${p.discipline}</span></div>
          <div><span class="label">Client</span><span>${esc(p.client || '—')}</span></div>
          <div><span class="label">Role</span><span>${esc(p.role || '—')}</span></div>
          <div><span class="label">Year</span><span>${p.year}</span></div>
        </div>
      </section>
      <div class="container"><div class="project-cover reveal">${p.coverStrip ? coverStrip(p.coverStrip, p.title) : `<img src="${p.cover}" alt=""${p.coverPos ? ` style="object-position:${p.coverPos}"` : ''}>`}</div></div>
      <section class="container project-body">
        <span class="label reveal">Overview</span>
        <div class="copy reveal"><p>${p.summary}</p>${p.body.map((b) => `<p>${b}</p>`).join('')}</div>
      </section>
      <section class="container"><div class="gallery">${gallery}</div>
        ${next && next !== p ? `<a class="next-project reveal" href="work.html?slug=${next.slug}">
          <span class="label">Next project</span>
          <div class="next-project__row"><span class="next-project__title">${esc(next.title)}</span>${arrow}</div>
        </a>` : ''}
      </section>`;
  }

  function renderContact() {
    return `
      <section class="contact-block" id="contact">
        <div class="container contact-grid">
          <span class="label reveal">Contact</span>
          <div>
            <h1 class="page-title reveal">Say <em>hello</em></h1>
            <p class="lead reveal" style="margin-top:24px;max-width:520px">Have a film, a brand or a strange beautiful idea? Send me a message — I read every one.</p>
            <div class="contact-list reveal">
              ${igUrl ? `<a href="${igUrl}" target="_blank" rel="noopener"><span class="k">Instagram</span><span>@${S.instagram}</span>${arrow}</a>` : ''}
              ${S.email ? `<a href="mailto:${S.email}"><span class="k">Email</span><span>${S.email}</span>${arrow}</a>` : ''}
              <a href="index.html"><span class="k">Website</span><span>${S.website}</span>${arrow}</a>
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderLegal(kind) {
    const isPrivacy = kind === 'privacy';
    const reach = S.email || (S.instagram ? `Instagram @${S.instagram}` : 'the contact page');
    const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
    const sections = isPrivacy
      ? [['What I collect', 'This site does not use tracking cookies. If you message me, I keep your message only to reply and to manage our project.'], ['How it is used', 'Your details are never sold or shared. They are used only to communicate about work you asked about.'], ['Your rights', `You can ask me to delete your messages at any time via ${reach}.`]]
      : [['Use of work', 'All images and designs shown here belong to their respective owners and are presented for portfolio purposes only.'], ['Projects', 'Scope, timeline and fees are agreed in writing before any project begins.'], ['Contact', `Questions about these terms can be sent via ${reach}.`]];
    return `<div class="container"><div class="legal">
      <span class="label">Legal · Updated ${S.year}</span>
      <h1>${title}</h1>
      ${sections.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join('')}
    </div></div>`;
  }

  function renderNotFound() {
    return `<section class="notfound">
      <span class="label">Page not found</span>
      <div class="num">404</div>
      <a class="btn" href="index.html">Back home ${arrow}</a>
    </section>`;
  }

  const renderers = {
    home: renderHome, about: renderAbout, works: renderWorks, work: renderWork,
    contact: renderContact, privacy: () => renderLegal('privacy'), tos: () => renderLegal('tos'), notfound: renderNotFound
  };

  /* ---------------- mount ---------------- */
  const noCta = ['notfound', 'privacy', 'tos'].includes(page);
  document.body.insertAdjacentHTML('afterbegin', header());
  $('#main').innerHTML = (renderers[page] || renderNotFound)() + (noCta ? '' : cta());
  document.body.insertAdjacentHTML('beforeend', footer());
  if (finePointer && !reduceMotion) {
    document.body.insertAdjacentHTML('beforeend', `<div class="view-badge" aria-hidden="true">View ${arrowSvg.replace('<svg', '<svg width="14" height="14"')}</div>`);
  }

  /* ---------------- behaviours ---------------- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));

  const hdr = $('#top-header');
  const onScrollHeader = () => hdr.classList.toggle('is-scrolled', window.scrollY > 40);
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  // mobile menu
  const toggle = $('.menu-toggle');
  const panel = $('#mobile-panel');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', open);
    toggle.textContent = open ? 'Close' : 'Menu';
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(!panel.classList.contains('is-open')));
  $$('a', panel).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth >= 810) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  $$('[data-top]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }));

  // scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  const vh = window.innerHeight;
  $$('.reveal').forEach((el) => {
    const sibs = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [];
    const idx = sibs.indexOf(el);
    if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 6) * 60}ms`;
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) { requestAnimationFrame(() => el.classList.add('is-in')); return; }
    io.observe(el);
  });

  // hand-drawn doodles that drift in at the page margins while scrolling.
  // Files live in assets/img/doodles/; missing files are simply skipped.
  const doodles = S.doodles || [];
  if (doodles.length && window.innerWidth >= 810) {
    const main = $('#main');
    main.style.position = 'relative';
    const gap = 1100;
    const count = Math.max(0, Math.floor((main.scrollHeight - 700) / gap));
    const placed = [];
    for (let k = 0; k < count; k++) {
      const src = doodles[k % doodles.length];
      const el = document.createElement('img');
      el.className = 'doodle';
      el.src = `assets/img/doodles/${src}`;
      el.alt = '';
      el.setAttribute('aria-hidden', 'true');
      el.style.top = `${900 + k * gap}px`;
      // sit in the outer margin, outside the content column
      el.style[k % 2 ? 'right' : 'left'] = 'max(6px, calc((100vw - 1280px) / 2 - 110px))';
      el.style.setProperty('--rot', `${(k % 2 ? 1 : -1) * (4 + (k % 3) * 3)}deg`);
      el.onerror = () => el.remove();
      main.appendChild(el);
      placed.push(el);
    }
    const dio = new IntersectionObserver((es) => es.forEach((en) => en.target.classList.toggle('is-in', en.isIntersecting)), { threshold: 0.2 });
    placed.forEach((el) => dio.observe(el));
    if (!reduceMotion) {
      let tick = false;
      const drift = () => {
        tick = false;
        placed.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > innerHeight + 200) return;
          const y = (r.top + r.height / 2 - innerHeight / 2) * -0.12;
          el.style.translate = `0 ${y.toFixed(1)}px`;
        });
      };
      window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(drift); } }, { passive: true });
      drift();
    }
  }

  // cover video on hover
  if (finePointer && !reduceMotion) {
    $$('.work-card').forEach((card) => {
      const v = $('.work-card__video', card);
      if (!v) return;
      card.addEventListener('pointerenter', () => { v.play().catch(() => {}); });
      card.addEventListener('pointerleave', () => { v.pause(); });
    });
  }

  // view badge that follows the cursor over work cards
  const badge = $('.view-badge');
  if (badge) {
    let mx = 0, my = 0, bx = 0, by = 0, over = false;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    $$('[data-view]').forEach((card) => {
      card.addEventListener('pointerenter', (e) => { over = true; bx = e.clientX; by = e.clientY; badge.classList.add('is-on'); });
      card.addEventListener('pointerleave', () => { over = false; badge.classList.remove('is-on'); });
    });
    window.addEventListener('pagehide', () => badge.classList.remove('is-on'));
    const loop = () => {
      bx += (mx - bx) * 0.3; by += (my - by) * 0.3;
      badge.style.transform = `translate3d(${bx}px, ${by}px, 0) translate(-50%, -50%) scale(${over ? 1 : 0.6})`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // anchors + scroll restore on Back
  const scrollKey = 'scroll:' + location.pathname + location.search;
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'auto' }), 60);
  } else {
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      const saved = sessionStorage.getItem(scrollKey);
      if (nav && nav.type === 'back_forward' && saved) {
        history.scrollRestoration = 'manual';
        requestAnimationFrame(() => window.scrollTo(0, +saved));
      }
    } catch (e) { /* storage unavailable */ }
  }
  window.addEventListener('pagehide', () => { try { sessionStorage.setItem(scrollKey, String(window.scrollY)); } catch (e) {} });
})();
