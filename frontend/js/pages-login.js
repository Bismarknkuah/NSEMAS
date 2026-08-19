/**
 * ============================================================================
 * NSEMAS LOGIN PAGE — edit this file directly, it's self-contained
 * ============================================================================
 * This page is deliberately kept in its own file, separate from the rest of
 * the application, so you can restyle or restructure it without touching
 * anything else. The only other files it depends on are:
 *   - js/components.js  (SEAL_SVG, escapeHtml, onForm, toast helpers)
 *   - js/pages.js        (DEMO_ROLE_GROUPS — the quick-demo-access role list)
 *   - js/api.js / js/app.js (Api, Store, App — for the actual sign-in call)
 *
 * TO CHANGE THE PHOTO ON THE LEFT:
 * ---------------------------------
 * Change the path below, or just replace the file at that path with your
 * own image (same filename). If the file is missing, this page falls back
 * to a plain illustration automatically — it will never show a broken
 * image icon.
 */
const LOGIN_HERO_PHOTO = 'assets/brand/login-photo.jpg';

Pages.login = function (container) {
  const groupsHtml = DEMO_ROLE_GROUPS.map((g) => `
    <div class="demo-group">
      <div class="demo-group-label">${g.label}</div>
      <div class="demo-role-grid">
        ${g.roles.map((r) => `
          <button class="demo-role-card" data-username="${r.username || ''}" data-appointment-role="${r.appointmentRole || ''}" data-base-username="${r.baseUsername || ''}">
            <span class="demo-role-title">${escapeHtml(r.title)}</span>
            <span class="demo-role-sub">${escapeHtml(r.sub)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="kente-stripe"></div>
    <div class="utility-bar">
      <div class="utility-bar-inner">
        <a href="#/home">About NSEMAS</a>
        <a href="#/home">Who it's for</a>
        <a href="#/home">Support</a>
        <a href="#/home" class="utility-bar-signin">← Back to homepage</a>
      </div>
    </div>
    <div class="public-header">
      <div class="public-header-brand"><img src="assets/brand/logo.png" alt="NSEMAS" class="brand-logo-img" /><span>NSEMAS</span></div>
      <div class="public-header-nav">
        <a href="#/home" id="header-features-link">Features</a>
        <a href="#/home" id="header-who-link">Who it's for</a>
        <button class="btn-signin" id="header-back-home-btn">← Home</button>
      </div>
    </div>
    <div class="login-wrap login-wrap--v2">
      <div class="login-page-layout">
        <div class="login-side-notice">
          <div class="login-official-badge">
            <span>🇬🇭</span> Official Portal of the Ghana Education Service &amp; Ministry of Education
          </div>
          <div class="login-side-notice-label">GHANA EDUCATION SERVICE</div>
          <h2>One system, every level of Ghana's education.</h2>
          <p>From a single classroom's daily attendance to the Minister's national dashboard,
            NSEMAS connects every school, circuit, district, and region on one platform,
            built for the way Ghana's education system actually works, from Basic School
            through Senior High.</p>
          <div class="login-side-notice-stats">
            <div><strong>16</strong><span>Regions</span></div>
            <div><strong>70</strong><span>Role types</span></div>
            <div><strong>24/7</strong><span>Access</span></div>
          </div>
        </div>

        <div class="login-shell login-shell--v2">

        <div class="login-photo-panel">
          <img src="${LOGIN_HERO_PHOTO}" alt="" class="login-photo-img"
               onerror="this.style.display='none'; this.closest('.login-photo-panel').classList.add('login-photo-panel--fallback');" />
          <div class="login-photo-fallback-illustration">
            <svg viewBox="0 0 200 160"><rect x="20" y="90" width="160" height="60" rx="8" fill="rgba(255,255,255,0.08)"/><rect x="70" y="30" width="60" height="45" rx="4" fill="rgba(255,255,255,0.14)"/><path d="M100 10 L130 24 L100 38 L70 24 Z" fill="var(--gold-bright)"/><circle cx="60" cy="105" r="14" fill="rgba(255,255,255,0.14)"/><circle cx="140" cy="105" r="14" fill="rgba(255,255,255,0.14)"/><circle cx="100" cy="98" r="16" fill="rgba(255,255,255,0.2)"/></svg>
          </div>
        </div>

        <div class="login-panel login-panel--v2">
          <div class="login-panel-inner">
            <div class="login-brand-block">
              <img src="assets/brand/logo.png" alt="NSEMAS" class="brand-logo-img brand-logo-img--lg" />
              <h1 class="login-brand-title">NSEMAS</h1>
              <p class="login-brand-caption">NATIONAL SMART EDUCATION MANAGEMENT,<br/>ATTENDANCE, MONITORING AND QUALITY ASSURANCE SYSTEM</p>
              <div class="login-hero-divider"></div>
              <p class="login-brand-tagline">VIRTUAL CLASS <span>•</span> SMART MONITORING <span>•</span> QUALITY EDUCATION</p>
            </div>

            <div class="login-tabs" style="margin-top:22px">
              <button class="login-tab active" data-tab="credentials">Sign in</button>
              <button class="login-tab" data-tab="demo">Quick demo access</button>
            </div>

            <div id="tab-credentials" class="login-tab-content">
              <h2 class="login-welcome">Welcome Back!</h2>
              <p class="login-panel-lede">Sign in to access your account</p>
              <div id="login-error"></div>
              <form id="login-form">
                <div class="field field--icon">
                  <label for="username">Student ID / Index Number</label>
                  <span class="field-icon">👤</span>
                  <input name="username" id="username" autocomplete="username" required />
                </div>
                <div class="field field--icon">
                  <label for="password">Password</label>
                  <span class="field-icon">🔒</span>
                  <input name="password" id="password" type="password" autocomplete="current-password" required />
                </div>
                <div class="login-form-row">
                  <label class="login-remember"><input type="checkbox" /> Remember Me</label>
                  <a href="#" id="forgot-password-link">Forgot Password?</a>
                </div>
                <button type="submit" class="btn btn-primary login-signin-btn">→ Sign In</button>
              </form>
              <div class="login-or-divider"><span>OR</span></div>
              <button class="login-google-btn" id="google-signin-btn">
                <svg viewBox="0 0 18 18" width="16" height="16"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
                Sign in with Google
              </button>
              <p class="login-help-text">Need help? Contact your school administrator.</p>
              <div class="login-trust-badge">
                <span class="login-trust-icon">🔒</span>
                <div><strong>Secure • Reliable • Intelligent</strong><span>Accurate data. Better decisions. Brighter future.</span></div>
              </div>
            </div>

            <div id="tab-demo" class="login-tab-content" style="display:none">
              <p class="login-panel-lede">Explore NSEMAS as any of the 67 roles in the system — one click, no password needed.</p>
              <input id="demo-search" placeholder="Search roles… (e.g. 'librarian', 'district', 'prefect')" class="mb-16" />
              <div id="demo-error"></div>
              <div class="demo-groups" id="demo-groups">${groupsHtml}</div>
              <div id="demo-empty" class="muted" style="display:none; text-align:center; font-size:12.5px; padding:20px">No roles match your search.</div>
            </div>

            <div class="login-institutions">
              <div class="login-institution"><div class="login-institution-icon">${SEAL_SVG}</div><span>Ghana Education Service<br/>(GES)</span></div>
              <div class="login-institution"><div class="login-institution-icon">${SEAL_SVG}</div><span>Ministry of Education<br/>Republic of Ghana</span></div>
            </div>
            <div class="login-credit">Designed and built by Desward Technology</div>
            <button class="btn btn-outline" id="back-to-home-btn" style="width:100%; margin-top:14px">← Back to home</button>
          </div>
        </div>

        </div>
      </div>
    </div>
  `;

  document.getElementById('google-signin-btn').addEventListener('click', () => {
    toast("Google sign-in isn't set up in this build — use Sign in or Quick demo access below.", 'error');
  });
  document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    openForgotPasswordModal();
  });

  container.querySelectorAll('.login-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.login-tab').forEach((t) => t.classList.toggle('active', t === tab));
      container.querySelectorAll('.login-tab-content').forEach((c) => { c.style.display = 'none'; });
      document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
    });
  });

  ['back-to-home-btn', 'header-back-home-btn'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => { location.hash = '#/home'; App.boot(); });
  });

  async function doLogin(username, password, errorTargetId) {
    const errTarget = document.getElementById(errorTargetId);
    if (errTarget) errTarget.innerHTML = '';
    try {
      const res = await Api.login(username, password);
      if (res.mfaRequired) {
        promptForMfaCode(res.pendingToken, errorTargetId);
        return;
      }
      Store.setToken(res.token);
      Store.setUser(res.user);
      window.location.hash = '#/dashboard';
      App.boot();
    } catch (err) {
      if (errTarget) errTarget.innerHTML = `<div class="login-error">${escapeHtml(err.message)}</div>`;
    }
  }

  async function doAppointmentDemoLogin(baseUsername, appointmentRole, errorTargetId) {
    const errTarget = document.getElementById(errorTargetId);
    if (errTarget) errTarget.innerHTML = '';
    try {
      const res = await Api.demoQuickLogin(baseUsername, appointmentRole);
      Store.setToken(res.token);
      const me = await Api.me();
      Store.setUser(me);
      window.location.hash = '#/dashboard';
      App.boot();
    } catch (err) {
      if (errTarget) errTarget.innerHTML = `<div class="login-error">${escapeHtml(err.message)}</div>`;
    }
  }

  function promptForMfaCode(pendingToken, errorTargetId) {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Enter your authenticator code</h3>
      <p class="muted" style="font-size:12.5px; margin-bottom:14px">This account has two-factor authentication enabled.</p>
      <form id="mfa-verify-form">
        <div class="field"><input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autofocus placeholder="6-digit code" /></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Verify</button>
      </form>
      <div id="mfa-verify-error"></div>
    `);
    onForm('mfa-verify-form', async (data) => {
      try {
        const res = await Api.mfaVerifyLogin(pendingToken, data.code);
        Store.setToken(res.token);
        Store.setUser(res.user);
        m.remove();
        window.location.hash = '#/dashboard';
        App.boot();
      } catch (err) {
        document.getElementById('mfa-verify-error').innerHTML = `<div class="login-error">${escapeHtml(err.message)}</div>`;
      }
    });
  }

  onForm('login-form', (data) => doLogin(data.username, data.password, 'login-error'));

  container.querySelectorAll('.demo-role-card').forEach((card) => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.demo-role-card').forEach((c) => c.classList.remove('loading'));
      card.classList.add('loading');
      if (card.dataset.appointmentRole) {
        doAppointmentDemoLogin(card.dataset.baseUsername, card.dataset.appointmentRole, 'demo-error');
      } else {
        doLogin(card.dataset.username, 'demo123', 'demo-error');
      }
    });
  });

  const demoSearch = document.getElementById('demo-search');
  if (demoSearch) demoSearch.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    let anyVisible = false;
    document.querySelectorAll('.demo-group').forEach((group) => {
      let groupHasMatch = false;
      group.querySelectorAll('.demo-role-card').forEach((card) => {
        const matches = card.textContent.toLowerCase().includes(q);
        card.style.display = matches ? '' : 'none';
        if (matches) groupHasMatch = true;
      });
      group.style.display = groupHasMatch ? '' : 'none';
      if (groupHasMatch) anyVisible = true;
    });
    document.getElementById('demo-empty').style.display = anyVisible ? 'none' : 'block';
  });
};

/** Real password reset — a code goes to the phone number already on
 * file, never to one typed into this form (that would let anyone claim
 * any account by entering a phone number). Two steps: request, then
 * submit the code with a new password. */
function openForgotPasswordModal() {
  const m = modal(`
    <button class="close-x" onclick="closeModal(this)">✕</button>
    <h3>Reset your password</h3>
    <p class="muted" style="font-size:12px; margin-bottom:14px">Enter your username — a code will be sent to the phone number on your account.</p>
    <form id="request-reset-form">
      <div class="field"><label>Username</label><input name="username" required autocomplete="username" /></div>
      <button class="btn btn-gold" type="submit" style="width:100%">Send code</button>
    </form>
    <div id="request-reset-result"></div>
  `);
  onForm('request-reset-form', async (data) => {
    try {
      const res = await Api.forgotPassword(data.username);
      document.getElementById('request-reset-result').innerHTML = `
        <p class="muted" style="font-size:12px; margin-top:12px">${escapeHtml(res.message)}${res.maskedPhone ? ` (${escapeHtml(res.maskedPhone)})` : ''}</p>
      `;
      openEnterCodeModal(data.username, m);
    } catch (err) { toast(err.message, 'error'); }
  });
}

function openEnterCodeModal(username, previousModal) {
  previousModal.remove();
  const m = modal(`
    <button class="close-x" onclick="closeModal(this)">✕</button>
    <h3>Enter the code</h3>
    <p class="muted" style="font-size:12px; margin-bottom:14px">Check the SMS sent to the phone number on file. The code expires in 10 minutes.</p>
    <form id="reset-password-form">
      <div class="field"><label>6-digit code</label><input name="code" required maxlength="6" pattern="[0-9]{6}" autocomplete="one-time-code" /></div>
      <div class="field"><label>New password</label><input name="newPassword" type="password" required minlength="6" autocomplete="new-password" /></div>
      <button class="btn btn-gold" type="submit" style="width:100%">Reset password</button>
    </form>
  `);
  onForm('reset-password-form', async (data) => {
    try {
      await Api.resetPassword(username, data.code, data.newPassword);
      toast('Password reset — sign in with your new password', 'success');
      m.remove();
    } catch (err) { toast(err.message, 'error'); }
  });
}
