/**
 * ============================================================================
 * NSEMAS HOMEPAGE — edit this file directly, it's self-contained
 * ============================================================================
 * Kept separate from the rest of the application so you can restyle or
 * restructure it without touching anything else. Depends only on:
 *   - js/components.js  (SEAL_SVG, escapeHtml, modal helper)
 *   - js/pages.js        (LEADERSHIP_PEOPLE, the leadership photo list)
 *   - js/app.js          (App, to navigate to the login page)
 *
 * TO CHANGE THE LEADERSHIP PHOTOS: edit LEADERSHIP_PEOPLE in js/pages.js,
 * or just replace the image files in frontend/assets/leadership/.
 */

const ICON_LEARNERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12.5V17c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/></svg>';
const ICON_TEACHERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M7 20h10M12 16v4"/></svg>';
const ICON_PARENTS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14.5 20c0-2.3 1.8-4.5 4-4.7"/></svg>';
const ICON_SCHOOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21V10l8-5 8 5v11"/><path d="M9 21v-6h6v6M4 21h16"/></svg>';
const ICON_DISTRICT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21h16M5 21V9l7-5 7 5v12M9 21v-5h6v5"/></svg>';
const ICON_MINISTRY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 20 7v2H4V7l8-4Z"/><path d="M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18"/></svg>';

const HOME_FEATURES = [
  { title: 'Digital Student Passports', short: 'Biometric attendance, promotion history, and full academic records in one place.',
    detail: 'Every learner gets a Ghana Education Unique Learner Number (GEULN) at admission. Attendance is captured through real fingerprint-matched biometric check-in. Promotion and repetition decisions, exam results, and academic history all live under that one record, following the student even if they transfer schools.' },
  { title: 'National Oversight', short: 'Real-time dashboards from the classroom up to the Minister of Education.',
    detail: 'Every tier of the system, from Circuit Supervisor to District Director to Regional Director, right up to the Minister, sees dashboards scoped to their jurisdiction, live. A Headmaster sees their school. A District Director sees every school in their district. The Minister sees the whole country, with AI-assisted risk flags for schools that need attention.' },
  { title: 'Executive Appointments', short: 'Student leaders and teacher coordinators switch views with one click.',
    detail: 'A School Prefect, Course Rep, or Department Head is still fundamentally a student or teacher, but when they are acting in that leadership capacity, a tab at the top of the screen switches them into a genuinely different dashboard built for that duty, and back again just as easily.' },
  { title: 'Multi-Child Parent Access', short: 'One parent account, every child, any school, public or private.',
    detail: 'A parent with children at different schools, even a mix of public and private, signs in once and switches between children from a single account. Report cards, attendance, fee balances at private schools, and messages all follow the right child automatically.' },
  { title: 'Virtual Classroom', short: 'Real video and audio classes and meetings, built in for every role.',
    detail: 'Any teacher, headmaster, or district officer can start a live session with real camera and microphone, not a mockup, and share a join code. Screen sharing, live chat, and hand raise are built in. It works reliably on most networks. This build has no relay server, so a small number of very restrictive institutional firewalls may block the direct connection.' },
  { title: 'Library and Finance', short: 'A real book catalog with borrowing, and fee billing for private schools.',
    detail: 'Librarians manage an actual catalog with live copy availability. Students browse, borrow, and return. At private schools, fee structures, invoices, and payments, including partial payments, are tracked properly, with the balance always up to date, and parents see it on their own dashboard.' },
];

const HOME_AUDIENCES = [
  { icon: ICON_LEARNERS, title: 'Learners', desc: 'Attendance, timetable, assignments, results, the library, and Ask & Learn, all in one portal.' },
  { icon: ICON_TEACHERS, title: 'Teachers', desc: 'Take attendance, grade objective exams instantly, post assignments, run a virtual class.' },
  { icon: ICON_PARENTS, title: 'Parents', desc: 'Follow every child, even across different schools, from a single account.' },
  { icon: ICON_SCHOOL, title: 'School Leadership', desc: 'Admit students, manage staff, approve leave, run inspections, oversee finance.' },
  { icon: ICON_DISTRICT, title: 'District and Regional Offices', desc: 'Real-time visibility into every school in your jurisdiction, not paperwork.' },
  { icon: ICON_MINISTRY, title: 'Ministry and GES', desc: 'National dashboards, AI-assisted risk flags, and full audit trails.' },
];

Pages.home = function (container) {
  container.innerHTML = `
    <div class="kente-stripe"></div>
    <div class="utility-bar">
      <div class="utility-bar-inner">
        <a href="#home-audiences-anchor">For Learners</a>
        <a href="#home-audiences-anchor">For Staff</a>
        <a href="#home-audiences-anchor">For Parents</a>
        <a href="#home-news-anchor">News &amp; Media</a>
        <a href="#/login" class="utility-bar-signin">Portal Sign In</a>
      </div>
    </div>
    <div class="public-header">
      <div class="public-header-brand"><img src="assets/brand/logo.png" alt="NSEMAS" class="brand-logo-img" /><span>NSEMAS</span></div>
      <div class="public-header-nav">
        <a href="#home-hero-anchor">Home</a>
        <a href="#home-audiences-anchor">Who it's for</a>
        <a href="#home-features-anchor">Features</a>
        <a href="#home-news-anchor">News &amp; Media</a>
        <a href="#home-leadership-anchor">Leadership</a>
        <button class="btn-signin" id="home-signin-btn-top">Sign In</button>
      </div>
    </div>
    <div class="home-wrap">

      <div class="home-hero" id="home-hero-anchor">
        <img src="assets/brand/logo.png" alt="NSEMAS" class="brand-logo-img brand-logo-img--lg" />
        <h1>NSEMAS</h1>
        <p class="login-hero-tagline">National Smart Education Management,<br/>Attendance, Monitoring &amp; Quality Assurance System</p>
        <div class="login-hero-divider"></div>
        <p class="login-hero-note" style="max-width:640px; margin:0 auto">A unified digital environment connecting classrooms, schools,
          circuits, district and regional offices, GES headquarters, and the Ministry of Education,
          built for Ghana's education system.</p>
        <button class="btn btn-gold" id="home-signin-btn" style="margin-top:24px; padding:12px 32px; font-size:14px">Sign In →</button>
      </div>

      <div class="home-leadership-banner" id="leadership-banner" data-anchor="home-leadership-anchor">
        <span id="home-leadership-anchor" style="position:absolute; margin-top:-90px"></span>
        <div class="home-leadership-banner-photo">
          <img id="leadership-banner-img" src="" alt="" />
        </div>
        <div class="home-leadership-banner-text">
          <div class="home-leadership-banner-label">National Leadership</div>
          <div class="home-leadership-banner-name" id="leadership-banner-name"></div>
          <div class="home-leadership-banner-title" id="leadership-banner-title"></div>
          <div class="home-leadership-banner-dots" id="leadership-banner-dots"></div>
        </div>
      </div>

      <div class="home-stats">
        <div><strong>16</strong><span>Regions covered</span></div>
        <div><strong>Basic → SHS</strong><span>Full lifecycle</span></div>
        <div><strong>Public &amp; Private</strong><span>All institutions</span></div>
        <div><strong>67</strong><span>Role types supported</span></div>
      </div>

      <div class="home-section" id="home-audiences-anchor">
        <h2 class="home-section-title">Built for everyone in the system</h2>
        <p class="home-section-sub">Select who you are to see what NSEMAS does for you.</p>
        <div class="home-audience-grid">
          ${HOME_AUDIENCES.map((a) => `
            <div class="home-audience-card">
              <div class="home-audience-icon">${a.icon}</div>
              <h3>${escapeHtml(a.title)}</h3>
              <p>${escapeHtml(a.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="home-section" id="home-features-anchor">
        <h2 class="home-section-title">What's inside</h2>
        <p class="home-section-sub">Six areas, each genuinely built. Click any one to learn more.</p>
        <div class="home-features">
          ${HOME_FEATURES.map((f, i) => `
            <button class="home-feature-card" data-feature="${i}" style="text-align:left; cursor:pointer; width:100%; font-family:inherit">
              <h3>${escapeHtml(f.title)}</h3>
              <p>${escapeHtml(f.short)}</p>
              <span class="home-feature-more">Learn more →</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="home-section" id="home-news-anchor">
        <div class="home-news-header">
          <div style="text-align:left">
            <h2 class="home-section-title" style="margin-bottom:2px">News &amp; Media</h2>
            <p class="home-section-sub" style="margin-bottom:0">Official updates published by Ministry and GES leadership.</p>
          </div>
        </div>
        <div class="home-media-grid" id="home-media-grid"><div class="muted" style="padding:20px">Loading…</div></div>
      </div>

      <div class="home-footer">
        <button class="btn btn-outline" id="home-signin-btn-2" style="padding:10px 28px;">Sign in to NSEMAS</button>
      </div>
    </div>
    <div class="notice-ticker-bar">
      <div class="notice-ticker" id="notice-ticker">
        <div class="notice-ticker-label">NOTICES</div>
        <div class="notice-ticker-viewport"><div class="notice-ticker-track" id="notice-ticker-track">Loading notices…</div></div>
      </div>
    </div>
    <footer class="site-footer">
      <div class="site-footer-grid">
        <div class="site-footer-col">
          <div class="flex gap-8" style="align-items:center; margin-bottom:12px">
            <img src="assets/brand/logo.png" alt="NSEMAS" style="width:26px; height:26px; border-radius:6px" />
            <strong style="font-family:var(--font-public-display); font-size:15px">NSEMAS</strong>
          </div>
          <p style="font-size:12px; color:rgba(255,255,255,0.65); line-height:1.6; max-width:280px">
            National Smart Education Management, Attendance, Monitoring and Quality Assurance System,
            built for Ghana Education Service and the Ministry of Education.
          </p>
        </div>
        <div class="site-footer-col">
          <div class="site-footer-heading">Useful links</div>
          <a href="#/login">Sign in</a>
          <a href="https://ges.gov.gh" target="_blank" rel="noopener">Ghana Education Service</a>
          <a href="https://moe.gov.gh" target="_blank" rel="noopener">Ministry of Education</a>
          <a href="https://waec.org.gh" target="_blank" rel="noopener">WAEC</a>
        </div>
        <div class="site-footer-col">
          <div class="site-footer-heading">Contact</div>
          <p style="font-size:12px; color:rgba(255,255,255,0.65); line-height:1.7">
            Ministry of Education, Ministries, Accra, Ghana<br/>
            info@ges.gov.gh
          </p>
        </div>
      </div>
      <div class="site-footer-bottom">
        <span>© ${new Date().getFullYear()} NSEMAS. Republic of Ghana</span>
        <span>Powered by Desward Technology</span>
      </div>
    </footer>`;

  // Rotating leadership banner — cycles through President, VP, Minister
  // automatically. Falls back cleanly if a photo is missing. The timer is
  // stored on window so a later visit to this page clears the previous
  // one — without this, every visit would leave its own interval running
  // forever in the background, since Pages.home is called fresh each time.
  let leaderIndex = 0;
  function renderLeader() {
    const img = document.getElementById('leadership-banner-img');
    if (!img) { clearInterval(window.__nsemasLeaderTimer); return; } // page navigated away — stop updating a DOM that's gone
    const person = LEADERSHIP_PEOPLE[leaderIndex];
    img.src = `assets/leadership/${person.file}`;
    img.alt = person.name;
    img.onerror = () => { img.style.display = 'none'; };
    img.onload = () => { img.style.display = 'block'; };
    document.getElementById('leadership-banner-name').textContent = person.name;
    document.getElementById('leadership-banner-title').textContent = person.title;
    document.getElementById('leadership-banner-dots').innerHTML = LEADERSHIP_PEOPLE.map((_, i) =>
      `<span class="home-leadership-dot ${i === leaderIndex ? 'active' : ''}" data-dot="${i}"></span>`
    ).join('');
    document.querySelectorAll('.home-leadership-dot').forEach((dot) => {
      dot.addEventListener('click', () => { leaderIndex = Number(dot.dataset.dot); renderLeader(); resetTimer(); });
    });
  }
  function resetTimer() {
    clearInterval(window.__nsemasLeaderTimer);
    window.__nsemasLeaderTimer = setInterval(() => {
      leaderIndex = (leaderIndex + 1) % LEADERSHIP_PEOPLE.length;
      renderLeader();
    }, 4000);
  }
  renderLeader();
  resetTimer();

  Api.publicAnnouncements().then((notices) => {
    const track = document.getElementById('notice-ticker-track');
    if (!track) return;
    if (!notices.length) { track.textContent = 'Welcome to NSEMAS, the national education management platform.'; return; }
    const items = notices.map((n) => escapeHtml(n.title)).join('&nbsp;&nbsp;•&nbsp;&nbsp;');
    track.innerHTML = `<span>${items}</span><span>${items}</span>`;
  }).catch(() => {
    const track = document.getElementById('notice-ticker-track');
    if (track) track.textContent = 'Welcome to NSEMAS, the national education management platform.';
  });

  function renderMediaGrid(items) {
    const grid = document.getElementById('home-media-grid');
    if (!items.length) { grid.innerHTML = emptyState('No media published yet.'); return; }
    grid.innerHTML = items.map((m) => `
      <div class="home-media-card">
        ${m.type === 'VIDEO'
          ? `<video src="${API_BASE}/homepage-media/file/${m.file}" controls preload="metadata"></video>`
          : `<img src="${API_BASE}/homepage-media/file/${m.file}" alt="${escapeHtml(m.caption || '')}" loading="lazy" />`}
        ${m.caption ? `<div class="home-media-caption">${escapeHtml(m.caption)}</div>` : ''}
      </div>
    `).join('');
  }

  Api.publicHomepageMedia().then(renderMediaGrid).catch(() => {
    document.getElementById('home-media-grid').innerHTML = emptyState('Could not load media right now.');
  });

  ['home-signin-btn', 'home-signin-btn-2', 'home-signin-btn-top'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => { location.hash = '#/login'; App.boot(); });
  });

  container.querySelectorAll('[data-feature]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = HOME_FEATURES[Number(btn.dataset.feature)];
      modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>${escapeHtml(f.title)}</h3>
        <p style="font-size:13.5px; line-height:1.7; color:var(--ink-soft); margin-top:12px">${escapeHtml(f.detail)}</p>
      `);
    });
  });
};
