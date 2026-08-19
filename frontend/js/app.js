/* NSEMAS — router + application shell */
const App = {};

/**
 * Full role catalog, mirrored from backend/utils/roles.js (the single
 * source of truth server-side — this is a browser-side copy since there's
 * no shared module system between the two). Keep these in sync if roles
 * change. Every role carries a tier (for nav/context grouping) and
 * capability flags (canAdmit, canInspect, canAnnounce, canApproveLeave,
 * canManageAcademics, canManageCurriculum) matching the backend exactly,
 * so permission-driven UI here reflects what the server will actually allow.
 */
const ROLE_CATALOG = {
  MINISTER: { label: 'Minister of Education', tier: 'NATIONAL', flags: { canAnnounce: true } },
  DEPUTY_MINISTER: { label: 'Deputy Minister', tier: 'NATIONAL', flags: { canAnnounce: true } },
  CHIEF_DIRECTOR: { label: 'Chief Director', tier: 'NATIONAL', flags: { canAnnounce: true } },
  DIRECTOR_GENERAL: { label: 'Director-General, GES', tier: 'NATIONAL', flags: { canAnnounce: true } },
  DEPUTY_DIRECTOR_GENERAL: { label: 'Deputy Director-General', tier: 'NATIONAL', flags: { canAnnounce: true } },
  NATIONAL_DIRECTOR: { label: 'National Director', tier: 'NATIONAL', flags: { canAnnounce: true } },
  NATIONAL_MONITORING: { label: 'National Monitoring Supervisor', tier: 'NATIONAL', flags: { canInspect: true, canAnnounce: true } },
  NATIONAL_QA: { label: 'National QA Officer', tier: 'NATIONAL', flags: { canInspect: true, canAnnounce: true } },
  NATIONAL_EMIS_ADMIN: { label: 'National EMIS Administrator', tier: 'NATIONAL', flags: { canAnnounce: true, canManageCurriculum: true } },
  NATIONAL_ICT_ADMIN: { label: 'National ICT Administrator', tier: 'NATIONAL', flags: {} },
  NATIONAL_HR: { label: 'National HR Officer', tier: 'NATIONAL', flags: { canApproveLeave: true } },
  NATIONAL_CURRICULUM_OFFICER: { label: 'National Curriculum Officer', tier: 'NATIONAL', flags: { canManageCurriculum: true } },
  NATIONAL_EXAM_OFFICER: { label: 'National Examination Officer', tier: 'NATIONAL', flags: { canManageAcademics: true } },

  REGIONAL_DIRECTOR: { label: 'Regional Director', tier: 'REGIONAL', flags: { canAnnounce: true } },
  ASSISTANT_REGIONAL_DIRECTOR: { label: 'Assistant Regional Director', tier: 'REGIONAL', flags: { canAnnounce: true } },
  REGIONAL_MONITORING: { label: 'Regional Monitoring Supervisor', tier: 'REGIONAL', flags: { canInspect: true } },
  REGIONAL_QA: { label: 'Regional QA Officer', tier: 'REGIONAL', flags: { canInspect: true } },
  REGIONAL_EMIS: { label: 'Regional EMIS Officer', tier: 'REGIONAL', flags: {} },
  REGIONAL_ICT: { label: 'Regional ICT Officer', tier: 'REGIONAL', flags: {} },
  REGIONAL_HR: { label: 'Regional HR Officer', tier: 'REGIONAL', flags: { canApproveLeave: true } },
  REGIONAL_FINANCE: { label: 'Regional Finance Officer', tier: 'REGIONAL', flags: {} },

  DISTRICT_DIRECTOR: { label: 'District Director', tier: 'DISTRICT', flags: { canAnnounce: true } },
  ASSISTANT_DISTRICT_DIRECTOR: { label: 'Assistant District Director', tier: 'DISTRICT', flags: { canAnnounce: true } },
  DISTRICT_MONITORING: { label: 'District Monitoring Supervisor', tier: 'DISTRICT', flags: { canInspect: true } },
  DISTRICT_EMIS: { label: 'District EMIS Officer', tier: 'DISTRICT', flags: {} },
  DISTRICT_STATISTICS: { label: 'District Statistics Officer', tier: 'DISTRICT', flags: {} },
  DISTRICT_ICT: { label: 'District ICT Officer', tier: 'DISTRICT', flags: {} },
  DISTRICT_HR: { label: 'District HR Officer', tier: 'DISTRICT', flags: { canApproveLeave: true } },

  CIRCUIT_SUPERVISOR: { label: 'Circuit Supervisor', tier: 'CIRCUIT', flags: { canInspect: true } },
  ASSISTANT_CIRCUIT_SUPERVISOR: { label: 'Assistant Circuit Supervisor', tier: 'CIRCUIT', flags: { canInspect: true } },

  HEADMASTER: { label: 'Headmaster', tier: 'SCHOOL', flags: { canAdmit: true, canAnnounce: true, canManageAcademics: true, canApproveLeave: true } },
  ASSISTANT_HEAD_ACADEMIC: { label: 'Assistant Headmaster (Academic)', tier: 'SCHOOL', flags: { canAdmit: true, canManageAcademics: true } },
  ASSISTANT_HEAD_ADMIN: { label: 'Assistant Headmaster (Administration)', tier: 'SCHOOL', flags: { canAdmit: true, canApproveLeave: true } },
  SCHOOL_ADMIN: { label: 'School Administrator', tier: 'SCHOOL', flags: { canAdmit: true, canManageAcademics: true } },
  SECRETARY: { label: 'Secretary', tier: 'SCHOOL', flags: {} },
  ACCOUNTANT: { label: 'Accountant', tier: 'SCHOOL', flags: {} },
  STOREKEEPER: { label: 'Storekeeper', tier: 'SCHOOL', flags: {} },
  LIBRARIAN: { label: 'Librarian', tier: 'SCHOOL', flags: {} },
  ICT_COORDINATOR: { label: 'ICT Coordinator', tier: 'SCHOOL', flags: {} },
  COUNSELLOR: { label: 'Counsellor', tier: 'SCHOOL', flags: {} },
  NURSE: { label: 'School Nurse', tier: 'SCHOOL', flags: {} },
  SECURITY_OFFICER: { label: 'Security Officer', tier: 'SCHOOL', flags: {} },

  TEACHER: { label: 'Teacher', tier: 'SCHOOL', flags: { canAdmit: true, canManageAcademics: true } },
  DEPARTMENT_HEAD: { label: 'Department Head', tier: 'SCHOOL', flags: { canManageAcademics: true } },
  SUBJECT_COORDINATOR: { label: 'Subject Coordinator', tier: 'SCHOOL', flags: { canManageAcademics: true } },
  FORM_MASTER: { label: 'Form Master', tier: 'SCHOOL', flags: { canAdmit: true, canManageAcademics: true } },
  HOUSE_MASTER: { label: 'House Master', tier: 'SCHOOL', flags: {} },
  BOARDING_COORDINATOR: { label: 'Boarding Coordinator', tier: 'SCHOOL', flags: {} },
  LAB_TECHNICIAN: { label: 'Laboratory Technician', tier: 'SCHOOL', flags: {} },
  WORKSHOP_INSTRUCTOR: { label: 'Workshop Instructor', tier: 'SCHOOL', flags: { canManageAcademics: true } },
  SPORTS_COORDINATOR: { label: 'Sports Coordinator', tier: 'SCHOOL', flags: {} },

  PROPRIETOR: { label: 'Proprietor', tier: 'SCHOOL', flags: { canAdmit: true, canAnnounce: true, canManageAcademics: true, canApproveLeave: true } },
  EXECUTIVE_DIRECTOR: { label: 'Executive Director', tier: 'PRIVATE_BOARD', flags: { canAnnounce: true } },
  BOARD_CHAIRMAN: { label: 'School Board Chairman', tier: 'PRIVATE_BOARD', flags: {} },
  BOARD_MEMBER: { label: 'Board Member', tier: 'PRIVATE_BOARD', flags: {} },
  PROPRIETOR_REP: { label: 'Proprietor Representative', tier: 'PRIVATE_BOARD', flags: {} },

  SCHOOL_PREFECT: { label: 'School Prefect', tier: 'STUDENT_LEADER', flags: {} },
  ASSISTANT_PREFECT: { label: 'Assistant Prefect', tier: 'STUDENT_LEADER', flags: {} },
  BOYS_PREFECT: { label: 'Boys Prefect', tier: 'STUDENT_LEADER', flags: {} },
  GIRLS_PREFECT: { label: 'Girls Prefect', tier: 'STUDENT_LEADER', flags: {} },
  CLASS_PREFECT: { label: 'Class Prefect', tier: 'STUDENT_LEADER', flags: {} },
  COURSE_REP: { label: 'Course Representative', tier: 'STUDENT_LEADER', flags: {} },
  SRC_EXECUTIVE: { label: 'SRC Executive', tier: 'STUDENT_LEADER', flags: {} },
  HALL_REP: { label: 'Hall Representative', tier: 'STUDENT_LEADER', flags: {} },
  HOUSE_PREFECT: { label: 'House Prefect', tier: 'STUDENT_LEADER', flags: {} },

  PARENT: { label: 'Parent', tier: 'PORTAL', flags: {} },
  STUDENT: { label: 'Student', tier: 'PORTAL', flags: {} },
};

const ROLE_LABELS = Object.fromEntries(Object.entries(ROLE_CATALOG).map(([k, v]) => [k, v.label]));
const rolesInTier = (tier) => Object.entries(ROLE_CATALOG).filter(([, v]) => v.tier === tier).map(([k]) => k);
const rolesWithFlag = (flag) => Object.entries(ROLE_CATALOG).filter(([, v]) => v.flags[flag]).map(([k]) => k);

const NATIONAL_ROLES = rolesInTier('NATIONAL');
const REGIONAL_ROLES = rolesInTier('REGIONAL');
const DISTRICT_ROLES = rolesInTier('DISTRICT');
const CIRCUIT_ROLES = rolesInTier('CIRCUIT');
const SCHOOL_TIER_ROLES = rolesInTier('SCHOOL');
const PRIVATE_BOARD_ROLES = rolesInTier('PRIVATE_BOARD');
const STUDENT_LEADER_ROLES = rolesInTier('STUDENT_LEADER');
const PORTAL_ROLES = rolesInTier('PORTAL');

function buildContext(user) {
  const role = user.role;
  const flags = (ROLE_CATALOG[role] && ROLE_CATALOG[role].flags) || {};
  return {
    user,
    isNational: NATIONAL_ROLES.includes(role),
    isRegional: REGIONAL_ROLES.includes(role),
    isDistrict: DISTRICT_ROLES.includes(role),
    isCircuit: CIRCUIT_ROLES.includes(role),
    isSchoolAdmin: SCHOOL_TIER_ROLES.includes(role) || PRIVATE_BOARD_ROLES.includes(role),
    isTeacher: role === 'TEACHER',
    isStudentLeader: STUDENT_LEADER_ROLES.includes(role),
    isPortal: PORTAL_ROLES.includes(role),
    canAdmit: !!flags.canAdmit,
    canInspect: !!flags.canInspect,
    canAnnounce: !!flags.canAnnounce,
    canApproveLeave: !!flags.canApproveLeave,
    canManageAcademics: !!flags.canManageAcademics,
    canManageCurriculum: !!flags.canManageCurriculum,
    approvalRoleMatch: true, // fine-grained check happens server-side; UI just offers the button
  };
}

// Every nav item declares exactly who needs it — not "everyone except
// portal roles." A Librarian and a Headmaster are both "school tier," but
// that doesn't mean they need the same set of pages; boundaries here are
// drawn from what each role actually does, using the same role groupings
// the dashboards themselves use (DASH_* constants, defined in pages.js —
// loaded before this file, and only ever referenced here at call time).
function govTier(ctx) { return ctx.isNational || ctx.isRegional || ctx.isDistrict || ctx.isCircuit; }
function schoolLeadership(ctx) { return DASH_SCHOOL_LEADERSHIP.includes(ctx.user.role); }
function teachingStaff(ctx) { return DASH_TEACHING.includes(ctx.user.role); }
function privateBoard(ctx) { return DASH_GOVERNANCE.includes(ctx.user.role); }

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ path: '#/dashboard', label: 'Dashboard', icon: '◆', when: () => true }],
  },
  {
    label: 'Education Management',
    items: [
      { path: '#/schools', label: 'Schools', icon: '▤', when: (ctx) => govTier(ctx) || privateBoard(ctx) },
      { path: '#/students', label: 'Students', icon: '▥', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) || teachingStaff(ctx) || privateBoard(ctx) || ['COUNSELLOR', 'NURSE'].includes(ctx.user.role) },
      { path: '#/attendance', label: 'Attendance', icon: '✓', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) || teachingStaff(ctx) || privateBoard(ctx) || ctx.user.role === 'SECURITY_OFFICER' },
      { path: '#/academics', label: 'Curriculum & Exams', icon: '✎', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) || teachingStaff(ctx) || privateBoard(ctx) || ctx.canManageCurriculum },
      { path: '#/assignments', label: 'Assignments', icon: '📝', when: (ctx) => schoolLeadership(ctx) || teachingStaff(ctx) },
      { path: '#/ask-and-learn', label: 'Ask & Learn', icon: '💡', when: (ctx) => teachingStaff(ctx) || schoolLeadership(ctx) },
      { path: '#/promotion', label: 'Promotion & Progression', icon: '↑', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) },
      { path: '#/transfers', label: 'Transfers', icon: '⇄', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) },
      { path: '#/teacher-transfers', label: 'My Transfer Request', icon: '⇉', when: (ctx) => ctx.user.role === 'TEACHER' },
      { path: '#/teacher-transfers', label: 'Teacher Transfer Requests', icon: '⇉', when: (ctx) => (govTier(ctx) || schoolLeadership(ctx)) && ctx.user.role !== 'TEACHER' },
      { path: '#/alumni', label: 'Alumni', icon: '🎓', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) || privateBoard(ctx) },
      { path: '#/teachers', label: 'Teachers', icon: '☰', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) || privateBoard(ctx) },
      { path: '#/approvals', label: 'Approval Centre', icon: '☰', when: (ctx) => schoolLeadership(ctx) || govTier(ctx) },
      { path: '#/leave', label: 'Leave Management', icon: '⏱', when: (ctx) => ctx.canApproveLeave || schoolLeadership(ctx) || teachingStaff(ctx) },
      { path: '#/tasks', label: 'Tasks', icon: '☑', when: () => true },
      { path: '#/infrastructure', label: 'Infrastructure & Assets', icon: '⌂', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) || ['ACCOUNTANT', 'STOREKEEPER', 'ICT_COORDINATOR'].includes(ctx.user.role) },
      { path: '#/finance', label: 'Finance', icon: '💰', when: (ctx) => ctx.user.school?.type === 'PRIVATE' && ctx.user.role === 'FINANCE_DIRECTOR' },
      { path: '#/library', label: 'Library', icon: '📚', when: (ctx) => schoolLeadership(ctx) || ctx.user.role === 'LIBRARIAN' },
      { path: '#/homepage-media', label: 'Homepage Media', icon: '🖼', when: (ctx) => ['MINISTER', 'DEPUTY_MINISTER', 'DIRECTOR_GENERAL', 'DEPUTY_DIRECTOR_GENERAL', 'NATIONAL_EMIS_ADMIN'].includes(ctx.user.role) },
    ],
  },
  {
    label: 'Governance',
    items: [
      { path: '#/inspections', label: 'Inspections & QA', icon: '◈', when: (ctx) => ctx.canInspect || govTier(ctx) || schoolLeadership(ctx) },
      { path: '#/gis', label: 'GIS Mapping', icon: '⌖', when: (ctx) => govTier(ctx) },
      { path: '#/ai', label: 'AI Insights', icon: '✦', when: (ctx) => govTier(ctx) || schoolLeadership(ctx) || privateBoard(ctx) },
      { path: '#/announcements', label: 'Announcements', icon: '✉', when: () => true },
      { path: '#/reports', label: 'Reports to Supervisor', icon: '📋', when: () => true },
      { path: '#/messages', label: 'Messages', icon: '✉', when: () => true },
      { path: '#/vclass', label: 'Virtual Class', icon: '🎥', when: () => true },
      { path: '#/groups', label: 'Groups', icon: '👥', when: () => true },
    ],
  },
];

const PORTAL_NAV = [
  { label: 'Portal', items: [
    { path: '#/dashboard', label: 'Home', icon: '◆' },
    { path: '#/assignments', label: 'Assignments', icon: '📝', when: (ctx) => ctx.user.role === 'STUDENT' },
    { path: '#/ask-and-learn', label: 'Ask & Learn', icon: '💡', when: (ctx) => ctx.user.role === 'STUDENT' },
    { path: '#/library', label: 'Library', icon: '📚', when: (ctx) => ctx.user.role === 'STUDENT' },
    { path: '#/messages', label: 'Messages', icon: '✉' },
    { path: '#/vclass', label: 'Virtual Class', icon: '🎥' },
    { path: '#/groups', label: 'Groups', icon: '👥' },
    { path: '#/announcements', label: 'Announcements', icon: '✉' },
    { path: '#/reports', label: 'Reports to Supervisor', icon: '📋' },
    { path: '#/tasks', label: 'Tasks', icon: '☑', when: (ctx) => ctx.user.role === 'STUDENT' },
  ]},
];

// Distinct from both the plain student portal and the full staff console —
// a student leader has real duties (visibility into their class/school,
// reporting to a teacher, running their own groups) but not a teacher's
// or headmaster's toolkit.
const STUDENT_LEADER_NAV = [
  { label: 'Leadership', items: [
    { path: '#/dashboard', label: 'Dashboard', icon: '◆' },
    { path: '#/students', label: 'My Class & School', icon: '▥' },
    { path: '#/attendance', label: 'Attendance', icon: '✓' },
    { path: '#/groups', label: 'Groups', icon: '👥' },
    { path: '#/messages', label: 'Messages', icon: '✉' },
    { path: '#/vclass', label: 'Virtual Class', icon: '🎥' },
    { path: '#/announcements', label: 'Announcements', icon: '✉' },
    { path: '#/reports', label: 'Reports to Supervisor', icon: '📋' },
    { path: '#/tasks', label: 'Tasks', icon: '☑' },
  ]},
];

async function openMyProfileModal(ctx) {
  const m = modal(`
    <button class="close-x" onclick="closeModal(this)">✕</button>
    <h3>My profile</h3>
    <div class="pill-tabs" id="profile-modal-tabs" style="margin-bottom:16px">
      <button class="pill-tab active" data-ptab="info">Profile</button>
      <button class="pill-tab" data-ptab="security">Security</button>
    </div>
    <div id="profile-body"></div>
  `);
  const body = m.querySelector('#profile-body');
  let ptab = 'info';

  async function renderInfo() {
    const me = await Api.me();
    body.innerHTML = `
      <div class="flex gap-16 mb-16" style="align-items:center">
        <div class="profile-pic-preview" id="profile-pic-preview" style="${me.profilePicture ? `background-image:url('${me.profilePicture}');background-size:cover;background-position:center;` : ''}">
          ${me.profilePicture ? '' : initial(me.name)}
        </div>
        <div>
          <input type="file" id="profile-pic-input" accept="image/*" style="display:none" />
          <button class="btn btn-outline btn-sm" id="profile-pic-upload-btn">Change photo</button>
          ${me.profilePicture ? `<button class="btn btn-outline btn-sm" id="profile-pic-remove-btn">Remove</button>` : ''}
        </div>
      </div>
      <form id="profile-info-form" class="mb-16">
        <div class="field"><label>Display name</label><input name="name" value="${escapeHtml(me.name)}" /></div>
        <div class="field-row">
          <div class="field"><label>Email</label><input name="email" type="email" value="${escapeHtml(me.email || '')}" placeholder="you@example.com" /></div>
          <div class="field"><label>Phone</label><input name="phone" value="${escapeHtml(me.phone || '')}" placeholder="024..." /></div>
        </div>
        <button class="btn btn-primary btn-sm" type="submit">Save changes</button>
      </form>
      <hr class="divider" />
      <form id="profile-password-form">
        <label style="font-size:12.5px; font-weight:600; margin-bottom:8px">Change password</label>
        <div class="field-row">
          <div class="field"><label>Current password</label><input name="currentPassword" type="password" required /></div>
          <div class="field"><label>New password</label><input name="newPassword" type="password" required minlength="6" /></div>
        </div>
        <button class="btn btn-outline btn-sm" type="submit">Update password</button>
      </form>
    `;

    document.getElementById('profile-pic-upload-btn').addEventListener('click', () => {
      document.getElementById('profile-pic-input').click();
    });
    document.getElementById('profile-pic-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 700 * 1024) { toast('Please choose an image under 700KB', 'error'); return; }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await Api.uploadProfilePicture(reader.result);
          toast('Profile photo updated', 'success');
          const freshMe = await Api.me();
          Store.setUser(freshMe);
          renderInfo();
          renderShell();
        } catch (err) { toast(err.message, 'error'); }
      };
      reader.readAsDataURL(file);
    });
    const removeBtn = document.getElementById('profile-pic-remove-btn');
    if (removeBtn) removeBtn.addEventListener('click', async () => {
      await Api.removeProfilePicture();
      const freshMe = await Api.me();
      Store.setUser(freshMe);
      renderInfo();
      renderShell();
    });

    onForm('profile-info-form', async (data) => {
      await Api.updateProfile(data);
      const freshMe = await Api.me();
      Store.setUser(freshMe);
      toast('Profile updated', 'success');
      renderShell();
    });

    onForm('profile-password-form', async (data, form) => {
      await Api.changePassword(data.currentPassword, data.newPassword);
      toast('Password updated', 'success');
      form.reset();
    });
  }

  async function renderSecurity() {
    const me = await Api.me();
    body.innerHTML = `
      <p class="muted" style="font-size:12.5px; margin-bottom:14px">Two-factor authentication (2FA) adds a 6-digit code from an authenticator app on top of your password.</p>
      <div id="security-inner"></div>
    `;
    const inner = document.getElementById('security-inner');
    if (me.mfaEnabled) {
      inner.innerHTML = `
        <div class="card" style="background:var(--green-ok-pale); border-color:var(--green-ok)">
          <strong style="font-size:13px">Two-factor authentication is ON</strong>
          <p class="muted" style="font-size:12px; margin:6px 0 0">Your account requires an authenticator code at every login.</p>
        </div>
        <form id="mfa-disable-form" class="mt-16">
          <div class="field"><label>Enter your password to disable 2FA</label><input name="password" type="password" required /></div>
          <button class="btn btn-danger" type="submit" style="width:100%">Disable 2FA</button>
        </form>
      `;
      onForm('mfa-disable-form', async (data) => {
        await Api.mfaDisable(data.password);
        toast('Two-factor authentication disabled', 'success');
        renderSecurity();
      });
    } else {
      inner.innerHTML = `<button class="btn btn-gold" id="start-mfa-setup" style="width:100%">Enable two-factor authentication</button>`;
      document.getElementById('start-mfa-setup').addEventListener('click', async () => {
        const setup = await Api.mfaSetup();
        inner.innerHTML = `
          <p class="muted" style="font-size:12px">Add this account to any authenticator app (Google Authenticator, Authy, 1Password, etc.) by entering the secret manually — there's no QR image in this build, but the secret below works identically to scanning one.</p>
          <div class="card" style="background:var(--surface-2); margin:12px 0">
            <label>Secret key</label>
            <div class="mono" style="font-size:14px; letter-spacing:0.05em; word-break:break-all">${setup.secret}</div>
          </div>
          <form id="mfa-confirm-form">
            <div class="field"><label>Enter the 6-digit code your app now shows</label>
              <input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autofocus />
            </div>
            <button class="btn btn-primary" type="submit" style="width:100%">Confirm &amp; enable</button>
          </form>
          <div id="mfa-confirm-error"></div>
        `;
        onForm('mfa-confirm-form', async (data) => {
          try {
            await Api.mfaConfirm(data.code);
            toast('Two-factor authentication enabled', 'success');
            renderSecurity();
          } catch (err) {
            document.getElementById('mfa-confirm-error').innerHTML = `<div class="login-error">${escapeHtml(err.message)}</div>`;
          }
        });
      });
    }
  }

  m.querySelectorAll('#profile-modal-tabs .pill-tab').forEach((t) => {
    t.addEventListener('click', () => {
      ptab = t.dataset.ptab;
      m.querySelectorAll('#profile-modal-tabs .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
      if (ptab === 'info') renderInfo(); else renderSecurity();
    });
  });
  renderInfo();
}

function wireChatbotWidget() {
  const toggle = document.getElementById('chatbot-toggle');
  const panel = document.getElementById('chatbot-panel');
  const messages = document.getElementById('chatbot-messages');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'flex';
    if (!open) input.focus();
  });
  document.getElementById('chatbot-close').addEventListener('click', () => { panel.style.display = 'none'; });

  function addBubble(text, who) {
    const el = document.createElement('div');
    el.className = `chatbot-bubble chatbot-bubble-${who}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  addBubble('Hi! Ask me how to do something in NSEMAS — for example, "how do I admit a student?"', 'bot');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addBubble(text, 'user');
    input.value = '';
    try {
      const res = await Api.askChatbot(text);
      addBubble(res.reply, 'bot');
    } catch (err) {
      addBubble("Something went wrong reaching the help system — try again in a moment.", 'bot');
    }
  });
}

async function wireNotificationBell() {
  const bell = document.getElementById('notif-bell');
  const badge = document.getElementById('notif-badge');
  if (!bell) return;

  let notifs = [];
  try { notifs = await Api.notifications(); } catch { notifs = []; }
  const unread = notifs.filter((n) => !n.read).length;
  if (unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = 'inline-flex'; }

  bell.addEventListener('click', () => {
    const existing = document.getElementById('notif-dropdown');
    if (existing) { existing.remove(); return; }

    const dropdown = document.createElement('div');
    dropdown.id = 'notif-dropdown';
    dropdown.className = 'notif-dropdown';
    dropdown.innerHTML = `
      <div class="notif-dropdown-header">
        <strong style="font-size:13px">Notifications</strong>
        ${unread > 0 ? `<button class="mark-all-read" id="mark-all-read">Mark all read</button>` : ''}
      </div>
      <div class="notif-list">
        ${notifs.length ? notifs.slice(0, 15).map((n) => `
          <div class="notif-item ${n.read ? '' : 'unread'}" data-link="${n.link || ''}" data-id="${n.id}">
            <div class="flex-between"><strong style="font-size:12.5px">${escapeHtml(n.title)}</strong>
            <span class="mono muted" style="font-size:10px">${fmtDate(n.createdAt)}</span></div>
            <div class="muted" style="font-size:12px; margin-top:2px">${escapeHtml(n.body)}</div>
          </div>
        `).join('') : `<div class="muted" style="font-size:12.5px; padding:16px; text-align:center">No notifications yet</div>`}
      </div>
    `;
    bell.parentElement.style.position = 'relative';
    bell.parentElement.appendChild(dropdown);

    dropdown.querySelectorAll('.notif-item').forEach((item) => {
      item.addEventListener('click', async () => {
        await Api.markNotificationRead(item.dataset.id).catch(() => {});
        if (item.dataset.link) { window.location.hash = item.dataset.link; App.render(); }
        dropdown.remove();
      });
    });
    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) markAllBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await Api.markAllNotificationsRead();
      badge.style.display = 'none';
      dropdown.remove();
    });

    setTimeout(() => {
      document.addEventListener('click', function closeOnce(e) {
        if (!dropdown.contains(e.target) && e.target !== bell) {
          dropdown.remove();
          document.removeEventListener('click', closeOnce);
        }
      });
    }, 0);
  });
}

App.boot = async function () {
  const token = Store.getToken();
  const app = document.getElementById('app');

  if (!token) {
    if (location.hash === '#/login') {
      Pages.login(app);
    } else {
      Pages.home(app);
    }
    if (!App.__loggedOutHashListenerAdded) {
      App.__loggedOutHashListenerAdded = true;
      window.addEventListener('hashchange', () => {
        if (Store.getToken()) return; // logged in now — the other listener (added below) owns rendering
        App.boot();
      });
    }
    return;
  }

  let user;
  try { user = await Api.me(); Store.setUser(user); }
  catch (e) {
    Store.clearToken(); Store.clearUser();
    Pages.login(app);
    return;
  }

  App.ctx = buildContext(user);
  renderShell();
  window.addEventListener('hashchange', App.render);
  if (!location.hash || location.hash === '#/' || location.hash === '#/login') location.hash = '#/dashboard';
  App.render();
};

function renderShell() {
  const app = document.getElementById('app');
  const ctx = App.ctx;
  const baseNav = ctx.isPortal
    ? PORTAL_NAV
    : ctx.isStudentLeader
    ? STUDENT_LEADER_NAV
    : NAV_GROUPS.map((g) => ({
        ...g,
        items: g.label === 'Governance'
          ? [
              ...g.items,
              { path: '#/outbox', label: 'Comms Outbox', icon: '📤', when: (c) => c.isNational },
              { path: '#/admin', label: 'System Administration', icon: '🛡', when: (c) => c.user.role === 'NATIONAL_EMIS_ADMIN' },
            ]
          : g.items,
      }));
  const navGroups = baseNav
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.when || item.when(ctx)) }))
    .filter((g) => g.items.length > 0);

  const navHtml = navGroups.map((g) => `
    <div class="nav-section">
      <div class="nav-label">${g.label}</div>
      ${g.items.map((item) => `
        <button class="nav-item" data-path="${item.path}" onclick="location.hash='${item.path}'">
          <span>${item.icon}</span><span>${item.label}</span><span class="dot"></span>
        </button>
      `).join('')}
    </div>
  `).join('');

  app.innerHTML = `
    <div class="shell">
      <div class="sidebar">
        <div class="sidebar-brand">
          <img src="assets/brand/logo.png" alt="NSEMAS" class="brand-logo-img" />
          <div>
            <div class="name">NSEMAS</div>
            <div class="sub">Ghana Education Service</div>
          </div>
        </div>
        ${navHtml}
        <div class="sidebar-footer">
          ${ctx.user.isDemoAccount ? `<div class="demo-badge">${badge('Demo account', 'gold')}</div>` : ''}
          <div class="user-chip" id="open-profile-chip" style="cursor:pointer" title="Profile &amp; security settings">
            <div class="avatar" style="${ctx.user.profilePicture ? `background-image:url('${ctx.user.profilePicture}'); background-size:cover; background-position:center;` : ''}">${ctx.user.profilePicture ? '' : initial(ctx.user.name)}</div>
            <div class="who">
              <div class="name">${escapeHtml(ctx.user.name)}</div>
              <div class="role">${ctx.user.customTitle || ROLE_LABELS[ctx.user.role] || ctx.user.role} ${ctx.user.mfaEnabled ? badge('2FA', 'green') : ''}</div>
            </div>
          </div>
          <button class="logout-btn" id="logout-btn">Sign out</button>
        </div>
      </div>
      <div class="main">
        <div id="role-tabs-row"></div>
        <div class="topbar">
          <div>
            <div class="crumbs" id="crumb-label">NSEMAS</div>
            <h1 id="page-title">Dashboard</h1>
          </div>
          <div class="flex gap-12">
            <button class="notif-bell" id="notif-bell" title="Notifications">
              🔔<span class="notif-badge" id="notif-badge" style="display:none">0</span>
            </button>
            ${ctx.user.school ? `<div class="mono muted" style="font-size:12px; align-self:center">${escapeHtml(ctx.user.school.name)}</div>` : ''}
          </div>
        </div>
        <div class="content" id="page-content"></div>
      </div>
    </div>
    <div id="chatbot-widget">
      <button id="chatbot-toggle" title="Help">💬</button>
      <div id="chatbot-panel" style="display:none">
        <div class="chatbot-header">
          <strong>NSEMAS Help</strong>
          <button id="chatbot-close">✕</button>
        </div>
        <p class="muted" style="font-size:11px; padding:0 14px; margin:8px 0">Ask how to use the system — this matches your question against common answers, it isn't a general AI.</p>
        <div id="chatbot-messages"></div>
        <form id="chatbot-form">
          <input id="chatbot-input" placeholder="Ask a question…" autocomplete="off" />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  `;

  wireNotificationBell();
  wireAppointmentSwitcher(ctx);
  wireChatbotWidget();

  const profileChip = document.getElementById('open-profile-chip');
  if (profileChip) profileChip.addEventListener('click', () => openMyProfileModal(ctx));

  document.getElementById('logout-btn').addEventListener('click', () => {
    Store.clearToken(); Store.clearUser();
    window.location.hash = '#/login';
    App.boot();
  });
}

// Shared by both the top "Viewing as" tabs and the permanent sidebar
// "My Offices" section — one switching implementation, so there's only
// ever one place this logic can drift or break.
async function doSwitchAppointment(appointmentId, ctx) {
  try {
    const res = await Api.switchRoleView(appointmentId);
    const primaryRole = ctx.user.primaryRole || ctx.user.role;
    const updatedUser = { ...ctx.user, role: res.role };
    Store.setToken(res.token);
    Store.setUser(updatedUser);
    toast(res.actingAs ? `Switched to ${ROLE_LABELS[res.actingAs] || res.actingAs} dashboard` : 'Switched to personal dashboard', 'success');
    window.location.hash = '#/dashboard';
    App.boot();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function wireAppointmentSwitcher(ctx) {
  const holder = document.getElementById('role-tabs-row');
  if (!holder) return;

  // Base identity must be STUDENT or TEACHER (or currently acting as an
  // appointment on top of one) for this to ever be relevant.
  const primaryRole = ctx.user.primaryRole || ctx.user.role;
  if (primaryRole !== 'STUDENT' && primaryRole !== 'TEACHER') return;

  let appointments = [];
  try { appointments = await Api.myAppointments(); } catch { return; }
  if (!appointments.length) return;

  const isActing = ctx.user.role !== primaryRole;

  // Real tabs at the top of the page — "Personal" always first, then one
  // tab per appointment held. Switching is one click on a tab, never a
  // navigation away from the app or anything resembling a login screen.
  const tabs = [
    { value: '', label: `${ROLE_LABELS[primaryRole] || primaryRole} (Personal)`, active: !isActing },
    ...appointments.map((a) => ({ value: a.id, label: ROLE_LABELS[a.role] || a.role, active: isActing && ctx.user.role === a.role })),
  ];

  holder.innerHTML = `
    <div class="role-tabs">
      <span class="role-tabs-label">Viewing as:</span>
      ${tabs.map((t) => `<button class="role-tab ${t.active ? 'active' : ''}" data-switch="${t.value}">${escapeHtml(t.label)}</button>`).join('')}
    </div>
  `;
  holder.querySelectorAll('[data-switch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return; // already there
      doSwitchAppointment(btn.dataset.switch || null, ctx);
    });
  });
}

const ROUTES = [
  { re: /^#\/dashboard$/, title: 'Dashboard', fn: (c, ctx) => Pages.dashboard(c, ctx) },
  { re: /^#\/schools$/, title: 'Schools', fn: (c, ctx) => Pages.schools(c, ctx) },
  { re: /^#\/schools\/([^/?]+)$/, title: 'School Profile', fn: (c, ctx, m) => Pages.schoolDetail(c, ctx, m[1]) },
  { re: /^#\/students$/, title: 'Students', fn: (c, ctx) => Pages.students(c, ctx) },
  { re: /^#\/students\/([^/?]+)$/, title: 'Student Passport', fn: (c, ctx, m) => Pages.studentDetail(c, ctx, m[1]) },
  { re: /^#\/attendance$/, title: 'Attendance', fn: (c, ctx) => Pages.attendance(c, ctx) },
  { re: /^#\/promotion$/, title: 'Promotion & Progression', fn: (c, ctx) => Pages.promotion(c, ctx) },
  { re: /^#\/promotion\/([^/?]+)$/, title: 'Promotion Evaluation', fn: (c, ctx, m) => Pages.promotion(c, ctx, m[1]) },
  { re: /^#\/transfers$/, title: 'Transfers', fn: (c, ctx) => Pages.transfers(c, ctx) },
  { re: /^#\/transfers\/new\/([^/?]+)$/, title: 'New Transfer', fn: (c, ctx, m) => Pages.transfers(c, ctx, m[1]) },
  { re: /^#\/teacher-transfers$/, title: 'Teacher Transfer Requests', fn: (c, ctx) => Pages.teacherTransfers(c, ctx) },
  { re: /^#\/teachers$/, title: 'Teachers', fn: (c, ctx) => Pages.teachers(c, ctx) },
  { re: /^#\/teachers\/detail\/([^/?]+)$/, title: 'Teacher Record', fn: (c, ctx, m) => Pages.teacherDetail(c, ctx, m[1]) },
  { re: /^#\/infrastructure$/, title: 'Infrastructure & Asset Management', fn: (c, ctx) => Pages.infrastructure(c, ctx) },
  { re: /^#\/finance$/, title: 'Finance', fn: (c, ctx) => Pages.finance(c, ctx) },
  { re: /^#\/library$/, title: 'Library', fn: (c, ctx) => Pages.library(c, ctx) },
  { re: /^#\/homepage-media$/, title: 'Homepage Media', fn: (c, ctx) => Pages.homepageMedia(c, ctx) },
  { re: /^#\/vclass$/, title: 'Virtual Class', fn: (c, ctx) => Pages.vclassHome(c, ctx) },
  { re: /^#\/vclass\/room\/([^/]+)$/, title: 'Virtual Class', fn: (c, ctx, m) => Pages.vclassRoom(c, ctx, m[1]) },
  { re: /^#\/ask-and-learn$/, title: 'Ask & Learn', fn: (c, ctx) => Pages.askAndLearn(c, ctx) },
  { re: /^#\/reports$/, title: 'Reports to Supervisor', fn: (c, ctx) => Pages.reports(c, ctx) },
  { re: /^#\/inspections$/, title: 'Inspections & Quality Assurance', fn: (c, ctx) => Pages.inspections(c, ctx) },
  { re: /^#\/gis$/, title: 'GIS Education Mapping', fn: (c, ctx) => Pages.gis(c, ctx) },
  { re: /^#\/ai$/, title: 'AI Education Intelligence', fn: (c, ctx) => Pages.ai(c, ctx) },
  { re: /^#\/announcements$/, title: 'Announcements', fn: (c, ctx) => Pages.announcements(c, ctx) },
  { re: /^#\/academics$/, title: 'Curriculum & Exams', fn: (c, ctx) => Pages.academics(c, ctx) },
  { re: /^#\/academics\/exam\/([^/]+)\/questions$/, title: 'Exam Questions', fn: (c, ctx, m) => Pages.examQuestions(c, ctx, m[1]) },
  { re: /^#\/approvals$/, title: 'Approval Centre', fn: (c, ctx) => Pages.approvalCentre(c, ctx) },
  { re: /^#\/leave$/, title: 'Leave Management', fn: (c, ctx) => Pages.leave(c, ctx) },
  { re: /^#\/tasks$/, title: 'Tasks', fn: (c, ctx) => Pages.tasks(c, ctx) },
  { re: /^#\/messages$/, title: 'Messages', fn: (c, ctx) => Pages.messages(c, ctx) },
  { re: /^#\/messages\/([^/?]+)$/, title: 'Messages', fn: (c, ctx, m) => Pages.messages(c, ctx, decodeURIComponent(m[1])) },
  { re: /^#\/groups$/, title: 'Groups', fn: (c, ctx) => Pages.groups(c, ctx) },
  { re: /^#\/groups\/([^/?]+)$/, title: 'Groups', fn: (c, ctx, m) => Pages.groups(c, ctx, m[1]) },
  { re: /^#\/assignments$/, title: 'Assignments', fn: (c, ctx) => Pages.assignments(c, ctx) },
  { re: /^#\/alumni$/, title: 'Alumni', fn: (c, ctx) => Pages.alumni(c, ctx) },
  { re: /^#\/outbox$/, title: 'Communications Outbox', fn: (c, ctx) => Pages.outbox(c, ctx) },
  { re: /^#\/admin$/, title: 'System Administration', fn: (c, ctx) => Pages.admin(c, ctx) },
];

App.render = function () {
  const hashPath = location.hash.split('?')[0] || '#/dashboard';
  const content = document.getElementById('page-content');
  if (!content) { App.boot(); return; }

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.path === hashPath);
  });

  for (const route of ROUTES) {
    const m = hashPath.match(route.re);
    if (m) {
      document.getElementById('page-title').textContent = route.title;
      document.getElementById('crumb-label').textContent = App.ctx.isPortal ? 'NSEMAS Portal' : 'NSEMAS';
      route.fn(content, App.ctx, m);
      return;
    }
  }
  content.innerHTML = emptyState('Page not found.');
};

App.boot();
