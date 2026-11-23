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

  const arrowSvg = '<svg viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3M11 3H4.5M11 3V9.5" stroke="currentColor" stroke-width="1.5"/></svg>';
  const arrow = `<span class="arrow" aria-hidden="true">${arrowSvg}${arrowSvg}</span>`;

  const navLinks = [
    { href: 'works.html', label: 'Works', key: 'works' },
    { href: 'about.html', label: 'About', key: 'about' },
    { href: 'blog.html', label: 'Insights', key: 'blog' },
    { href: 'contact.html', label: 'Contact', key: 'contact' }
  ];
  const activeKey = { work: 'works', post: 'blog' }[page] || page;
  const igUrl = S.instagram ? `https://www.instagram.com/${S.instagram}/` : '';
  const has = (arr) => Array.isArray(arr) && arr.length > 0;
  // primary way to reach out: Instagram first, email if one is set
  const primaryContact = igUrl
    ? `<a class="link-arrow" href="${igUrl}" target="_blank" rel="noopener">@${S.instagram} ${arrow}</a>`
    : S.email ? `<a class="link-arrow" href="mailto:${S.email}">${S.email} ${arrow}</a>` : '';

  /* ---------------- partials ---------------- */
  function header() {
    const links = navLinks.map((l) => `<a href="${l.href}"${l.key === activeKey ? ' aria-current="page"' : ''}>${l.label}</a>`).join('');
    return `
      <header class="site-header" id="top-header">
        <div class="container">
          <a href="index.html" class="wordmark-sm" aria-label="${S.name} — home">${S.name}</a>
          <span class="status">${S.available ? '<span class="dot"></span>Available For Hire' : 'Booked for ' + S.year}</span>
          <nav class="nav" aria-label="Primary">${links}</nav>
          <button class="menu-toggle" aria-expanded="false" aria-controls="mobile-panel">Menu</button>
        </div>
      </header>
      <div class="mobile-panel" id="mobile-panel" aria-hidden="true">
        <nav aria-label="Mobile"><a href="index.html">Home</a>${links}</nav>
        <div style="display:flex;flex-direction:column;gap:16px">
          <span class="status">${S.available ? '<span class="dot"></span>Available For Hire' : 'Booked for ' + S.year}</span>
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
            <a class="btn" href="contact.html#contact">Get In Touch ${arrow}</a>
          </div>
        </div>
      </section>`;
  }

  function footer() {
    const work = S.projects.filter((p) => p.featured).slice(0, 4).map((p) => `<li><a href="work.html?slug=${p.slug}">${esc(p.title)}</a></li>`).join('');
    const socials = S.socials.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener">${s.label}</a></li>`).join('');
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-cols">
            <div class="footer-col"><h4 class="label">All Pages</h4><ul>
              <li><a href="index.html">Home</a></li><li><a href="about.html#about">About</a></li>
              <li><a href="works.html#info">Works</a></li><li><a href="blog.html#info">Insights</a></li>
              <li><a href="contact.html#contact">Contact</a></li></ul></div>
            <div class="footer-col"><h4 class="label">Quick Links</h4><ul>${work}<li><a href="blog.html#articles">Latest articles</a></li></ul></div>
            <div class="footer-col"><h4 class="label">Contact</h4><ul>
              ${S.email ? `<li><a href="mailto:${S.email}">${S.email}</a></li>` : ''}${S.phone ? `<li><span class="muted">${S.phone}</span></li>` : ''}${socials}
              <li><a href="contact.html#contact">Contact page</a></li></ul></div>
            <div class="footer-col"><h4 class="label">Legal</h4><ul>
              <li><a href="privacy.html">Privacy Policy</a></li><li><a href="tos.html">Terms of Service</a></li><li><a href="404.html">404</a></li></ul></div>
          </div>
          <div class="footer-wordmark" aria-hidden="true">${S.name}</div>
          <div class="footer-credit">
            <span>© ${S.year} ${S.name}. All rights reserved.</span>
            <span>${S.location}</span>
            <a href="#" data-top class="link-arrow">Back to top ↑</a>
          </div>
        </div>
      </footer>`;
  }

  /* ---------------- reusable blocks ---------------- */
  // a cover made of several frames of one video, side by side (frames are read live via #t=)
  const coverStrip = (s, title) => `<div class="cover-strip" role="img" aria-label="${esc(title)}">${s.times.map((t) => `<video src="${s.video}#t=${t}" muted playsinline preload="metadata" tabindex="-1" aria-hidden="true"></video>`).join('')}</div>`;

  const workCard = (p) => `
    <a class="work-card reveal" href="work.html?slug=${p.slug}" data-view>
      <div class="work-card__media">${p.coverStrip ? coverStrip(p.coverStrip, p.title) : `<img src="${p.cover}" alt="${esc(p.title)} — ${esc(p.discipline)}" loading="lazy">`}${p.coverVideo ? `<video class="work-card__video" src="${p.coverVideo}" muted loop playsinline preload="none" aria-hidden="true"></video>` : ''}</div>
      <div class="work-card__meta"><h3 class="work-card__title">${esc(p.title)}</h3><span class="work-card__disc">${esc(p.discipline)}</span></div>
    </a>`;

  const articleRow = (a) => `
    <a class="article-row reveal" href="post.html?slug=${a.slug}">
      <div class="article-row__cover"><img src="${a.cover}" alt="" loading="lazy"></div>
      <div><h3>${esc(a.title)}</h3><div class="meta"><span>${a.date}</span>${a.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div></div>
      <span class="go" aria-hidden="true">${arrow}</span>
    </a>`;

  const sectionHead = (label, title, right = '') => `
    <div class="section-head reveal">
      <div class="left"><span class="label"><span class="star">✦</span> ${label}</span><h2 class="h-section">${title}</h2></div>
      ${right}
    </div>`;

  /* ---------------- pages ---------------- */
  function renderHome() {
    const h = S.hero;
    return `
      <section class="hero" id="hero">
        <span class="hero__px" style="--x:27%;--y:9%;--c:var(--cobalt)"></span>
        <span class="hero__px" style="--x:74%;--y:20%;--c:var(--lime)"></span>
        <span class="hero__px" style="--x:38%;--y:62%;--c:#9c8cff"></span>
        <span class="hero__px" style="--x:62%;--y:78%;--c:var(--sky-2)"></span>
        <span class="hero__px" style="--x:14%;--y:92%;--c:#ff8a3d"></span>
        <div class="container hero__inner">
          <h1 class="hero__title appear appear--center">
            <span class="hero__name">${esc(S.name)}</span>
            <span class="hero__row">
              <span class="hero__role">${esc(h.title || S.role)}</span>
              <span class="hero__chips">${h.expertise.map((e) => `<span class="hero__chip">${esc(e)}</span>`).join('')}</span>
            </span>
          </h1>
          <div class="hero__bottom appear">
            <div class="hero__intro">${h.intro.map((p) => `<p>${p}</p>`).join('')}</div>
            <aside class="hero__card">
              <span class="hero__card-label"><span class="dot"></span>${S.available ? `Booking projects for ${+S.year + 1}` : 'Currently booked'}</span>
              <div class="hero__photo"><img src="assets/img/hero.jpg" alt="Portrait of ${esc(S.name)}"></div>
              <a class="hero__cta" href="contact.html#contact">Book a call with ${esc(S.name)} ${arrow}</a>
            </aside>
          </div>
        </div>
      </section>

      <section class="section section--top" id="about">
        <div class="container about-teaser">
          <span class="label reveal"><span class="star">✦</span> ${S.about.label}</span>
          <div class="text reveal">
            <p class="lead">${S.about.text.replace('small mythology', '<span class="em">small mythology</span>')}</p>
            <a class="btn btn--ghost" href="about.html#about">More About Me ${arrow}</a>
          </div>
        </div>
      </section>

      <section class="section" id="tools">
        <div class="container">
          <span class="label reveal">Tools of the trade</span>
          <div class="logos-grid">${S.tools.map((t) => `<div class="logo-cell reveal" style="--brand:${t.color}"><span class="logo-icon" style="-webkit-mask-image:url('assets/logos/${t.logo}.svg');mask-image:url('assets/logos/${t.logo}.svg')" aria-hidden="true"></span>${t.name}</div>`).join('')}</div>
        </div>
      </section>

      <section class="section" id="works">
        <div class="container">
          ${sectionHead('© 2025 — ' + S.year, 'Selected <em>Works</em>', `<a class="link-arrow reveal" href="works.html#info">View All ${arrow}</a>`)}
          <div class="works-grid">${S.projects.filter((p) => p.featured).map(workCard).join('')}</div>
        </div>
      </section>

      ${has(S.stats) ? `
      <section class="section" id="stats" style="padding-top:0">
        <div class="container stats">
          ${S.stats.map((s) => `<div class="stat reveal"><div class="stat__num"><span data-count="${s.value}">0</span><span class="suffix">${s.suffix}</span></div><div class="stat__label">${s.label}</div></div>`).join('')}
        </div>
      </section>` : ''}

      <section class="section section--top" id="services">
        <div class="container">
          ${sectionHead('Services', 'What I can <em>do</em> for you')}
          <div class="services">${S.services.map((s, i) => {
            const linked = (s.projects || []).map((slug) => S.projects.find((p) => p.slug === slug)).filter(Boolean);
            return `
            <div class="service reveal">
              <h3 class="service__name"><span class="idx">0${i + 1}</span>${s.name}</h3>
              <p class="service__desc">${s.desc}</p>
              <div class="service__side">
                <div class="tags">${s.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
                ${linked.length ? `<div class="service__projects"><span class="label">Projects</span>${linked.map((p) => `<a class="link-arrow" href="work.html?slug=${p.slug}">${esc(p.title)} ${arrow}</a>`).join('')}</div>` : ''}
              </div>
            </div>`;
          }).join('')}</div>
        </div>
      </section>

      <section class="section" id="process">
        <div class="container">
          ${sectionHead('Process', 'Three steps, <em>one</em> world')}
          <div class="process">${S.process.map((p) => `<div class="step reveal"><span class="step__n">${p.n}</span><div><h3>${p.title}</h3><p>${p.desc}</p></div></div>`).join('')}</div>
        </div>
      </section>

      ${has(S.pricing) ? `
      <section class="section glow-bottom" id="pricing">
        <div class="container">
          ${sectionHead('Pricing', 'Simple, <em>honest</em> pricing')}
          <div class="pricing">${S.pricing.map((p) => `
            <div class="plan reveal${p.popular ? ' plan--popular' : ''}">
              <div class="plan__top"><h3 class="plan__name">${p.name}</h3>${p.popular ? '<span class="badge-popular">✦ Popular</span>' : ''}</div>
              <div class="plan__price">${p.price}<small>${p.per}</small></div>
              <p class="plan__desc">${p.desc}</p>
              <ul>${p.features.map((f) => `<li>${f}</li>`).join('')}</ul>
              <a class="btn ${p.popular ? '' : 'btn--ghost'}" href="contact.html#contact">${p.cta} ${arrow}</a>
            </div>`).join('')}</div>
        </div>
      </section>` : ''}

      <section class="section" id="articles">
        <div class="container">
          ${sectionHead('Insights', 'Notes from the <em>studio</em>', `<a class="link-arrow reveal" href="blog.html#articles">All Articles ${arrow}</a>`)}
          <div class="articles">${S.posts.map(articleRow).join('')}</div>
        </div>
      </section>

      <section class="section" id="faq">
        <div class="container faq-wrap">
          <div class="reveal" style="display:flex;flex-direction:column;gap:16px">
            <span class="label"><span class="star">✦</span> FAQ</span>
            <h2 class="h-section">Questions, <em>answered</em></h2>
          </div>
          <div class="faq">${S.faqs.map((f, i) => `
            <div class="faq-item reveal">
              <button class="faq-q" aria-expanded="false" aria-controls="faq-a-${i}" id="faq-q-${i}">${f.q}<span class="plus" aria-hidden="true"></span></button>
              <div class="faq-a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}"><p>${f.a}</p></div>
            </div>`).join('')}</div>
        </div>
      </section>`;
  }

  function renderAbout() {
    return `
      <section class="page-intro" id="about">
        <div class="container">
          <div class="page-intro__grid">
            <span class="label reveal"><span class="star">✦</span> About Me</span>
            <h1 class="page-title reveal">The eye behind <em>the light</em></h1>
          </div>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="container about-hero">
          <div class="about-hero__img reveal"><img src="assets/img/portrait.jpg" alt="Portrait of ${S.name}"></div>
          <div class="about-hero__text reveal">
            <p>${S.about.text}</p>
            ${S.about.long.map((p) => `<p>${p}</p>`).join('')}
            <div style="display:flex;gap:8px;flex-wrap:wrap">${S.hero.expertise.map((e) => `<span class="chip"><span class="star">✦</span>${e}</span>`).join('')}</div>
          </div>
        </div>
      </section>
      ${has(S.experience) ? `
      <section class="section" id="experience">
        <div class="container">
          ${sectionHead('Experience', 'Where I have <em>worked</em>')}
          <div class="list-rows">${S.experience.map((e) => `<div class="list-row reveal"><span>${e.role}</span><span class="muted">${e.place}</span><span class="muted">${e.time}</span></div>`).join('')}</div>
        </div>
      </section>` : ''}
      ${has(S.highlights) ? `
      <section class="section" id="highlights">
        <div class="container">
          ${sectionHead('Highlights', 'Moments I am <em>proud</em> of')}
          <div class="list-rows">${S.highlights.map((e) => `<div class="list-row reveal"><span>${e.title}</span><span class="muted">${e.meta}</span><span class="star">✦</span></div>`).join('')}</div>
        </div>
      </section>` : ''}
      <section class="section" id="selected" style="padding-top:0">
        <div class="container">
          ${sectionHead('Recent work', 'A few things I have <em>made</em>', `<a class="link-arrow reveal" href="works.html#info">View All ${arrow}</a>`)}
          <div class="works-grid">${S.projects.filter((p) => p.featured).slice(0, 2).map(workCard).join('')}</div>
        </div>
      </section>`;
  }

  function renderWorks() {
    return `
      <section class="page-intro" id="info">
        <div class="container page-intro__grid">
          <span class="label reveal"><span class="star">✦</span> ${S.projects.length} Projects</span>
          <div style="display:flex;flex-direction:column;gap:32px">
            <h1 class="page-title reveal">Selected <em>Works</em></h1>
            <p class="lead reveal">AI films, my own brand, collaborations and freelance work — grouped by what they are.</p>
          </div>
        </div>
      </section>
      ${(S.categories || []).map((c, i) => {
        const items = S.projects.filter((p) => p.category === c.id);
        if (!items.length) return '';
        return `
      <section class="section work-group" id="${c.id}" style="padding-top:0">
        <div class="container">
          <div class="work-group__head reveal">
            <span class="work-group__num">${String(i + 1).padStart(2, '0')}</span>
            <div><h2 class="h-section">${esc(c.name)}</h2><p class="muted">${esc(c.note || '')}</p></div>
            <span class="label">${items.length} ${items.length > 1 ? 'projects' : 'project'}</span>
          </div>
          <div class="works-grid">${items.map(workCard).join('')}</div>
        </div>
      </section>`;
      }).join('')}`;
  }

  function renderWork() {
    const i = Math.max(0, S.projects.findIndex((p) => p.slug === param('slug')));
    const p = S.projects[i];
    const next = S.projects[(i + 1) % S.projects.length];
    document.title = `${p.title} — ${S.name}`;
    // landscape media get promoted to full width once they load; gallery items are image paths or { video, poster }
    const wideIf = (w, h) => `if(${w}>${h}*1.15)this.parentElement.classList.add('wide')`;
    const gallery = p.gallery.map((g, k) => {
      if (typeof g === 'object' && g.youtube) {
        return `<figure class="reveal wide is-video is-embed"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(g.youtube)}?rel=0" title="${esc(g.title || p.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></figure><a class="yt-link reveal" href="https://youtu.be/${encodeURIComponent(g.youtube)}" target="_blank" rel="noopener">Watch on YouTube ${arrow}</a>`;
      }
      if (typeof g === 'object' && g.video) {
        // large files stream on demand; small ones autoplay muted
        return `<figure class="reveal is-video"><video src="${g.video}" poster="${g.poster || ''}" muted loop playsinline ${g.noAutoplay ? '' : 'autoplay'} controls preload="metadata" onloadedmetadata="${wideIf('this.videoWidth', 'this.videoHeight')}"></video>${g.label ? `<figcaption>${esc(g.label)}</figcaption>` : ''}</figure>`;
      }
      return `<figure class="reveal"><img src="${g}" alt="${esc(p.title)} — image ${k + 1}" loading="lazy" onload="${wideIf('this.naturalWidth', 'this.naturalHeight')}"></figure>`;
    }).join('');
    const cat = (S.categories || []).find((c) => c.id === p.category);
    return `
      <section class="container project-head">
        <div class="reveal" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><a class="link-arrow" href="works.html#info">← All Works</a>${cat ? `<a class="chip" href="works.html#${cat.id}">${esc(cat.name)}</a>` : ''}<span class="chip"><span class="star">✦</span>${esc(p.engagement || 'Freelance · Project-based')}</span></div>
        <h1 class="page-title reveal" style="margin-top:32px">${esc(p.title)}</h1>
        <div class="project-meta reveal">
          <div><span class="label">Discipline</span><span>${p.discipline}</span></div>
          <div><span class="label">Client</span><span>${esc(p.client || '—')}</span></div>
          <div><span class="label">Role</span><span>${esc(p.role || '—')}</span></div>
          <div><span class="label">Year</span><span>${p.year}</span></div>
        </div>
      </section>
      <div class="container"><div class="project-cover reveal">${p.coverStrip ? coverStrip(p.coverStrip, p.title) : `<img src="${p.cover}" alt="" data-parallax-img>`}</div></div>
      <section class="container project-body">
        <span class="label reveal"><span class="star">✦</span> Overview</span>
        <div class="copy reveal"><p>${p.summary}</p>${p.body.map((b) => `<p>${b}</p>`).join('')}</div>
      </section>
      <section class="container"><div class="gallery">${gallery}</div>
        <a class="next-project reveal" href="work.html?slug=${next.slug}">
          <span class="label">Next Project</span>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px"><span class="page-title">${esc(next.title)}</span>${arrow}</div>
        </a>
      </section>`;
  }

  function renderBlog() {
    return `
      <section class="page-intro" id="info">
        <div class="container page-intro__grid">
          <span class="label reveal"><span class="star">✦</span> Insights</span>
          <div style="display:flex;flex-direction:column;gap:32px">
            <h1 class="page-title reveal">Notes from <em>the studio</em></h1>
            <p class="lead reveal">Essays on colour, campaigns, type and the craft of building a brand world.</p>
          </div>
        </div>
      </section>
      <section class="section" id="articles" style="padding-top:0">
        <div class="container articles">${S.posts.map(articleRow).join('')}</div>
      </section>`;
  }

  function renderPost() {
    const i = Math.max(0, S.posts.findIndex((p) => p.slug === param('slug')));
    const a = S.posts[i];
    const next = S.posts[(i + 1) % S.posts.length];
    document.title = `${a.title} — ${S.name}`;
    const body = a.body.map((b, k) => (k === 1 ? `<blockquote>${b}</blockquote>` : `<p>${b}</p>`)).join('');
    return `
      <div class="container">
        <header class="post-head">
          <a class="link-arrow reveal" href="blog.html#articles">← All Insights</a>
          <h1 class="reveal">${esc(a.title)}</h1>
          <div class="reveal" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;color:var(--muted)"><span>${a.date}</span>${a.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        </header>
        <div class="post-cover reveal"><img src="${a.cover}" alt=""></div>
        <article class="post-body reveal">${body}</article>
        <div class="section-head reveal" style="margin-bottom:24px"><div class="left"><span class="label"><span class="star">✦</span> Next Read</span></div></div>
        <div class="articles">${articleRow(next)}</div>
      </div>`;
  }

  function renderContact() {
    return `
      <section class="contact-block" id="contact">
        <div class="container contact-grid">
          <span class="label reveal"><span class="star">✦</span> Say hello</span>
          <div>
            <h1 class="page-title reveal">Contact <em>Me</em></h1>
            <p class="lead reveal" style="margin-top:32px;color:var(--muted);max-width:560px">Have a brand, a campaign or a strange beautiful idea? Send me a DM — I read every message.</p>
            <div class="contact-list reveal">
              ${igUrl ? `<a href="${igUrl}" target="_blank" rel="noopener"><span class="k">Instagram</span><span>@${S.instagram}</span>${arrow}</a>` : ''}
              ${S.email ? `<a href="mailto:${S.email}"><span class="k">Email</span><span>${S.email}</span>${arrow}</a>` : ''}
              ${S.phone ? `<div><span class="k">Phone</span><span>${S.phone}</span><span></span></div>` : ''}
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
      <span class="label"><span class="star">✦</span> Legal · Updated ${S.year}</span>
      <h1 style="margin-top:24px">${title}</h1>
      ${sections.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join('')}
    </div></div>`;
  }

  function renderNotFound() {
    return `<section class="notfound">
      <span class="label"><span class="star">✦</span> Lost in the cobalt</span>
      <div class="num">404</div>
      <p class="muted" style="max-width:380px;margin:0">This page drifted out of the frame. Let's bring you back to the light.</p>
      <a class="btn" href="index.html">Back Home ${arrow}</a>
    </section>`;
  }

  const renderers = {
    home: renderHome, about: renderAbout, works: renderWorks, work: renderWork, blog: renderBlog,
    post: renderPost, contact: renderContact, privacy: () => renderLegal('privacy'), tos: () => renderLegal('tos'), notfound: renderNotFound
  };

  /* ---------------- mount ---------------- */
  const noCta = ['notfound', 'privacy', 'tos'].includes(page);
  document.body.insertAdjacentHTML('afterbegin', header());
  $('#main').innerHTML = (renderers[page] || renderHome)() + (noCta ? '' : cta());
  document.body.insertAdjacentHTML('beforeend', footer());
  if (finePointer && !reduceMotion) {
    document.body.insertAdjacentHTML('beforeend', `<div class="cursor-glow" aria-hidden="true"></div><div class="view-badge" aria-hidden="true">View ${arrowSvg.replace('<svg', '<svg width="14" height="14"')}</div>`);
  }

  /* ---------------- behaviours ---------------- */
  // hero appear
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));

  // header state
  const hdr = $('#top-header');
  const heroEl = $('.hero--dark'); // the light hero needs no white header
  // light theme: header text is white while it sits over the dark hero photo, dark everywhere else
  const onScrollHeader = () => {
    hdr.classList.toggle('is-scrolled', window.scrollY > 40);
    hdr.classList.toggle('on-dark', !!heroEl && window.scrollY < heroEl.offsetHeight - 60);
  };
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

  // back to top
  $$('[data-top]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }));

  // parallax: progress = (V - top) / (V + H); y = (progress - .5) * .6 * H, offset so y = 0 at load-top
  const layers = $$('[data-parallax], [data-parallax-img]');
  if (layers.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const V = window.innerHeight;
      layers.forEach((el) => {
        const wrap = el.parentElement;
        const r = wrap.getBoundingClientRect();
        const H = r.height;
        if (r.bottom < -200 || r.top > V + 200) return;
        const progress = Math.max(0, Math.min(1, (V - r.top) / (V + H)));
        const y = (progress - 0.5) * 0.6 * H;
        el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
  }

  // scroll reveal + count-up
  const countUp = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  const vh = window.innerHeight;
  $$('.reveal').forEach((el) => {
    // light stagger for siblings in grids
    const sibs = el.parentElement ? $$(':scope > .reveal', el.parentElement) : [];
    const idx = sibs.indexOf(el);
    if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 6) * 70}ms`;
    // anything already on screen at load reveals right away (no observer round-trip)
    const r = el.getBoundingClientRect();
    if (r.top < vh && r.bottom > 0) {
      requestAnimationFrame(() => { el.classList.add('is-in'); $$('[data-count]', el).forEach(countUp); });
      return;
    }
    io.observe(el);
  });

  // work cards with a cover video play it on hover (fine pointers only)
  if (finePointer && !reduceMotion) {
    $$('.work-card').forEach((card) => {
      const v = $('.work-card__video', card);
      if (!v) return;
      card.addEventListener('pointerenter', () => { v.play().catch(() => {}); });
      card.addEventListener('pointerleave', () => { v.pause(); });
    });
  }

  // FAQ: multiple open, height 0 -> measured -> auto
  $$('.faq-item').forEach((item) => {
    const btn = $('.faq-q', item);
    const panelA = $('.faq-a', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
      if (open) {
        panelA.style.height = panelA.scrollHeight + 'px';
        const done = (e) => { if (e.propertyName === 'height') { panelA.style.height = 'auto'; panelA.removeEventListener('transitionend', done); } };
        panelA.addEventListener('transitionend', done);
      } else {
        panelA.style.height = panelA.scrollHeight + 'px';
        requestAnimationFrame(() => requestAnimationFrame(() => { panelA.style.height = '0px'; }));
      }
    });
  });

  // cursor glow + view badge (fine pointers only)
  const glow = $('.cursor-glow');
  const badge = $('.view-badge');
  if (glow) {
    let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my, bx = mx, by = my;
    let overCard = false;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; glow.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
    document.documentElement.addEventListener('mouseleave', () => { glow.classList.remove('is-on'); badge.classList.remove('is-on'); });
    $$('[data-view]').forEach((card) => {
      card.addEventListener('pointerenter', (e) => { overCard = true; bx = e.clientX; by = e.clientY; badge.classList.add('is-on'); });
      card.addEventListener('pointerleave', () => { overCard = false; badge.classList.remove('is-on'); });
    });
    window.addEventListener('pagehide', () => badge.classList.remove('is-on'));
    const loop = () => {
      gx += (mx - gx) * 0.12; gy += (my - gy) * 0.12;
      bx += (mx - bx) * 0.35; by += (my - by) * 0.35;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      badge.style.transform = `translate3d(${bx}px, ${by}px, 0) translate(-50%, -50%) scale(${overCard ? 1 : 0.6})`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // hash on direct load (content is rendered by JS, so re-apply anchor)
  const scrollKey = 'scroll:' + location.pathname + location.search;
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'auto' }), 60);
  } else {
    // coming back (browser Back) to a JS-rendered page: return to where the visitor was
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
