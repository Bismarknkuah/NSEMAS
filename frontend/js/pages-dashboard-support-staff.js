/**
 * SUPPORT STAFF DASHBOARDS — edit this file directly.
 * Contains three related dashboards for non-teaching school staff:
 *   - renderCounsellorDashboard (student welfare focus)
 *   - renderNurseDashboard (health focus)
 *   - renderSupportDashboard (Secretary, Accountant, Storekeeper, ICT
 *     Coordinator, Security Officer, Librarian — minimal shared shell)
 * Depends on: js/components.js, js/pages.js (shared helpers), js/api.js.
 */

async function renderCounsellorDashboard(container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  const schoolId = ctx.user.school?.id;
  let students, announcements;
  try {
    students = schoolId ? await Api.students({ schoolId }).catch(() => []) : [];
    announcements = await Api.announcements().catch(() => []);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const flagged = students
    .map((s) => ({ ...s, seriousCount: (s.behaviourNotes || []).filter((n) => n.type === 'SERIOUS').length }))
    .filter((s) => s.seriousCount > 0 || (s.attendanceRate !== null && s.attendanceRate < 75))
    .sort((a, b) => b.seriousCount - a.seriousCount);

  container.innerHTML = `
    ${dashHero(ctx, `Student welfare overview for ${escapeHtml(ctx.user.school?.name || 'your school')}.`, '')}
    <div class="grid grid-2 mb-16">
      ${statCard('Students flagged', flagged.length, 'Behaviour notes or low attendance')}
      ${statCard('Serious incidents on file', students.reduce((sum, s) => sum + (s.behaviourNotes || []).filter((n) => n.type === 'SERIOUS').length, 0))}
    </div>
    <div class="grid grid-2">
      <div>${card('Students needing follow-up', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Student</th><th>Class</th><th>Incidents</th><th>Attendance</th></tr></thead>
          <tbody>${flagged.slice(0, 12).map((s) => `
            <tr style="cursor:pointer" onclick="location.hash='#/students/${s.id}'">
              <td>${escapeHtml(s.name)}</td><td>${s.class}</td>
              <td>${s.seriousCount > 0 ? badge(s.seriousCount + ' serious', 'red') : '—'}</td>
              <td>${s.attendanceRate !== null ? s.attendanceRate + '%' : '—'}</td>
            </tr>`).join('') || `<tr><td colspan="4">${emptyState('No students currently flagged')}</td></tr>`}</tbody>
        </table></div>
      `)}</div>
      <div>${card('Announcements', announcements.slice(0, 5).map((a) => `
        <div class="mb-8"><strong style="font-size:13px">${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12.5px">${escapeHtml(a.body)}</div></div>
      `).join('') || emptyState('No announcements'))}</div>
    </div>
  `;
}

// ---------------- Nurse: health focus ----------------
async function renderNurseDashboard(container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  const schoolId = ctx.user.school?.id;
  let students, announcements;
  try {
    students = schoolId ? await Api.students({ schoolId }).catch(() => []) : [];
    announcements = await Api.announcements().catch(() => []);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const withConditions = students.filter((s) => s.medical && s.medical !== 'None');

  container.innerHTML = `
    ${dashHero(ctx, `Health overview for ${escapeHtml(ctx.user.school?.name || 'your school')}.`, '')}
    <div class="grid grid-2 mb-16">
      ${statCard('Students with a condition on file', withConditions.length)}
      ${statCard('Total students', students.length)}
    </div>
    <div class="grid grid-2">
      <div>${card('Medical records', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Student</th><th>Class</th><th>Condition</th></tr></thead>
          <tbody>${withConditions.slice(0, 15).map((s) => `
            <tr style="cursor:pointer" onclick="location.hash='#/students/${s.id}'"><td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${escapeHtml(s.medical)}</td></tr>
          `).join('') || `<tr><td colspan="3">${emptyState('No conditions on file')}</td></tr>`}</tbody>
        </table></div>
      `)}</div>
      <div>${card('Announcements', announcements.slice(0, 5).map((a) => `
        <div class="mb-8"><strong style="font-size:13px">${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12.5px">${escapeHtml(a.body)}</div></div>
      `).join('') || emptyState('No announcements'))}</div>
    </div>
  `;
}

// ---------------- Support staff: deliberately minimal ----------------
const SUPPORT_ROLE_TAGLINES = {
  SECRETARY: "Here's today's admin overview.",
  ACCOUNTANT: "Here's the asset & infrastructure position.",
  STOREKEEPER: "Here's the current inventory overview.",
  ICT_COORDINATOR: "Here's the school's ICT & systems overview.",
  SECURITY_OFFICER: "Here's who's on campus today.",
  LIBRARIAN: "Here's the learning resources overview.",
};

async function renderSupportDashboard(container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  const schoolId = ctx.user.school?.id;
  const role = ctx.user.role;
  let school, announcements;
  try {
    school = schoolId ? await Api.school(schoolId).catch(() => null) : null;
    announcements = await Api.announcements().catch(() => []);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  container.innerHTML = `
    ${dashHero(ctx, SUPPORT_ROLE_TAGLINES[role] || `Welcome back. Here's what's happening at ${escapeHtml(school?.name || 'your school')}.`, '')}
    <div class="grid grid-3 mb-16">
      ${statCard('Students', school?.studentCount ?? '—')}
      ${statCard('Teachers', school?.teacherCount ?? '—')}
      ${statCard('School type', school?.type || '—')}
    </div>
    <div class="grid grid-2">
      <div id="role-specific-widget">${emptyState('Loading…')}</div>
      <div>${card('Announcements', announcements.slice(0, 8).map((a) => `
        <div class="mb-8"><strong style="font-size:13px">${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12.5px">${escapeHtml(a.body)}</div></div>
      `).join('') || emptyState('No announcements'))}</div>
    </div>
  `;

  const widgetHolder = document.getElementById('role-specific-widget');
  if (!schoolId) { widgetHolder.innerHTML = ''; return; }

  if (role === 'SECRETARY') {
    Api.students({ schoolId }).then((students) => {
      const recent = [...students].sort((a, b) => (a.admissionDate < b.admissionDate ? 1 : -1)).slice(0, 8);
      widgetHolder.innerHTML = card('Recent admissions', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Student</th><th>Class</th><th>Admitted</th></tr></thead>
          <tbody>${recent.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${fmtDate(s.admissionDate)}</td></tr>`).join('') || `<tr><td colspan="3">${emptyState('No records')}</td></tr>`}</tbody>
        </table></div>
        <button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/students'">Open student records</button>
      `);
    }).catch(() => { widgetHolder.innerHTML = ''; });
  } else if (role === 'ACCOUNTANT') {
    Api.infrastructureSummary(schoolId).then((summary) => {
      widgetHolder.innerHTML = card('Asset & infrastructure position', `
        ${statCard('Total assets on record', summary.totalAssets ?? '—')}
        <div class="mt-8">${statCard('Open maintenance requests', summary.openMaintenance ?? '—', '', (summary.openMaintenance || 0) > 0 ? 'down' : 'up')}</div>
        <button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/infrastructure'">Open infrastructure records</button>
      `);
    }).catch(() => { widgetHolder.innerHTML = ''; });
  } else if (role === 'STOREKEEPER') {
    Api.assets(schoolId).then((assets) => {
      widgetHolder.innerHTML = card('Inventory overview', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Item</th><th>Category</th><th>Condition</th></tr></thead>
          <tbody>${assets.slice(0, 8).map((a) => `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.category || '—')}</td><td>${badge(a.condition || 'UNKNOWN', a.condition === 'GOOD' ? 'green' : a.condition === 'POOR' ? 'red' : 'grey')}</td></tr>`).join('') || `<tr><td colspan="3">${emptyState('No assets on record')}</td></tr>`}</tbody>
        </table></div>
        <button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/infrastructure'">Manage inventory</button>
      `);
    }).catch(() => { widgetHolder.innerHTML = ''; });
  } else if (role === 'ICT_COORDINATOR') {
    Api.assets(schoolId).then((assets) => {
      const ict = assets.filter((a) => a.category === 'ICT_EQUIPMENT');
      widgetHolder.innerHTML = card('ICT & systems overview', `
        ${statCard('ICT assets on record', ict.length)}
        <div class="table-wrap mt-8"><table class="ledger">
          <thead><tr><th>Item</th><th>Condition</th></tr></thead>
          <tbody>${ict.slice(0, 6).map((a) => `<tr><td>${escapeHtml(a.name)}</td><td>${badge(a.condition || 'UNKNOWN', a.condition === 'GOOD' ? 'green' : 'grey')}</td></tr>`).join('') || `<tr><td colspan="2">${emptyState('No ICT assets tagged yet')}</td></tr>`}</tbody>
        </table></div>
        <button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/infrastructure'">Open infrastructure records</button>
      `);
    }).catch(() => { widgetHolder.innerHTML = ''; });
  } else if (role === 'SECURITY_OFFICER') {
    Api.todayAttendance(schoolId).then((today) => {
      widgetHolder.innerHTML = card("Today's campus presence", `
        ${statCard('Checked in today', today ? `${today.present}/${today.total}` : '—')}
        ${statCard('Attendance rate', today && today.rate !== null ? today.rate + '%' : '—')}
        <button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/attendance'">Open attendance register</button>
      `);
    }).catch(() => { widgetHolder.innerHTML = ''; });
  } else if (role === 'LIBRARIAN') {
    Api.materials({ schoolId }).then((materials) => {
      widgetHolder.innerHTML = card('Learning resources overview', `
        ${statCard('Materials posted', materials.length)}
        <div class="table-wrap mt-8"><table class="ledger">
          <thead><tr><th>Title</th><th>Subject</th></tr></thead>
          <tbody>${materials.slice(0, 6).map((m) => `<tr><td>${escapeHtml(m.title)}</td><td>${escapeHtml(m.subject)}</td></tr>`).join('') || `<tr><td colspan="2">${emptyState('No materials posted yet')}</td></tr>`}</tbody>
        </table></div>
      `);
    }).catch(() => { widgetHolder.innerHTML = ''; });
  } else {
    widgetHolder.innerHTML = '';
  }
}

// ---------------- Private school board / governance ----------------
