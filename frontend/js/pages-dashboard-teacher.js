/**
 * TEACHER DASHBOARDS — edit this file directly.
 * Contains two related but distinct dashboards:
 *   - renderTeachingDashboard: a teacher's own personal classroom view
 *   - renderTeacherCoordinationDashboard: the genuinely different view
 *     shown when a teacher switches into a coordination duty (Department
 *     Head, Form Master, Boarding Coordinator, etc.)
 * Depends on: js/components.js, js/pages.js (shared helpers), js/api.js.
 */

const TEACHING_ROLE_TAGLINES = {
  TEACHER: "Here's your teaching day at",
  WORKSHOP_INSTRUCTOR: "Here's your workshop overview at",
  LAB_TECHNICIAN: "Here's your laboratory overview at",
};

// Coordination titles held on top of a base teacher account, via the
// appointment mechanic — same pattern as student leadership, and for the
// same reason: a Department Head switching into that role should see a
// dashboard built around that duty, not their personal teaching load
// with a different sentence at the top.
const COORDINATION_TAGLINES = {
  DEPARTMENT_HEAD: 'Department overview',
  SUBJECT_COORDINATOR: 'Subject coordination overview',
  FORM_MASTER: "Your form's overview",
  HOUSE_MASTER: 'House overview',
  BOARDING_COORDINATOR: 'Boarding overview',
  SPORTS_COORDINATOR: 'Sports & activities overview',
};
const ACADEMIC_COORDINATION_ROLES = ['DEPARTMENT_HEAD', 'SUBJECT_COORDINATOR'];
const PASTORAL_COORDINATION_ROLES = ['FORM_MASTER'];

async function renderTeachingDashboard(container, ctx) {
  container.innerHTML = `<div class="section-title">Loading your dashboard…</div>`;
  const schoolId = ctx.user.school?.id;
  const role = ctx.user.role;
  let today, assignments, myLeave;
  try {
    today = schoolId ? await Api.todayAttendance(schoolId).catch(() => null) : null;
    assignments = schoolId ? await Api.assignments({ schoolId }).catch(() => []) : [];
    myLeave = await Api.leaveRequests({}).catch(() => []);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const myAssignments = assignments.filter((a) => a.createdBy === ctx.user.name);
  const myOwnLeave = myLeave.filter((l) => l.teacherId === ctx.user.teacherId);

  container.innerHTML = `
    ${dashHero(ctx, `${TEACHING_ROLE_TAGLINES[role] || "Here's your day at"} ${escapeHtml(ctx.user.school?.name || 'your school')}.`, `
      <button class="btn btn-gold btn-sm" onclick="location.hash='#/attendance'">Take attendance</button>
      <button class="btn btn-outline btn-sm" onclick="location.hash='#/academics'">Enter scores</button>
    `)}
    <div class="grid grid-3 mb-16">
      ${statCard("Today's school attendance", today && today.rate !== null ? today.rate + '%' : '—', today ? `${today.present}/${today.total} checked in` : '')}
      ${statCard('My assignments posted', myAssignments.length)}
      ${statCard('My leave requests', myOwnLeave.length, myOwnLeave.filter((l) => l.status === 'PENDING').length ? `${myOwnLeave.filter((l) => l.status === 'PENDING').length} pending` : '')}
    </div>
    <div class="grid grid-2">
      <div>
        ${card('My assignments', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Title</th><th>Class</th><th>Due</th></tr></thead>
            <tbody>${myAssignments.slice(0, 8).map((a) => `<tr><td>${escapeHtml(a.title)}</td><td>${a.class}</td><td>${a.dueDate ? fmtDate(a.dueDate) : '—'}</td></tr>`).join('') || `<tr><td colspan="3">${emptyState('No assignments posted yet')}</td></tr>`}</tbody>
          </table></div>
          <button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/assignments'">Post / grade assignments</button>
        `)}
      </div>
      <div>
        ${card('Quick actions', `
          <div class="flex gap-8" style="flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/students'">My students</button>
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/academics'">Timetable &amp; exams</button>
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/leave'">Request leave</button>
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/messages'">Messages</button>
          </div>
        `)}
        <div class="mt-16">
        ${card('My recent leave requests', myOwnLeave.slice(0, 5).map((l) => `
          <div class="flex-between mb-8"><span style="font-size:13px">${l.type} · ${fmtDate(l.startDate)}</span>${statusBadge(l.status === 'APPROVED' ? 'APPROVED' : l.status === 'REJECTED' ? 'REJECTED' : 'SUBMITTED')}</div>
        `).join('') || emptyState('No leave requests on file'))}
        </div>
      </div>
    </div>
  `;
}

// A teacher's coordination duty (Department Head, Form Master, etc.) is a
// genuinely different job than their own classroom teaching — this is a
// distinct dashboard built around that duty, not the personal teaching
// dashboard with a different headline.
async function renderTeacherCoordinationDashboard(container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  const schoolId = ctx.user.school?.id;
  const role = ctx.user.role;
  let students = [], subjects = [], teachers = [], today;
  try {
    students = schoolId ? await Api.students({ schoolId }).catch(() => []) : [];
    subjects = ctx.user.school?.level ? await Api.subjects(ctx.user.school.level).catch(() => []) : [];
    teachers = schoolId ? await Api.teachers(schoolId).catch(() => []) : [];
    today = schoolId ? await Api.todayAttendance(schoolId).catch(() => null) : null;
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  let widget;
  if (ACADEMIC_COORDINATION_ROLES.includes(role)) {
    widget = card('Subjects in scope', `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Subject</th><th>Level</th></tr></thead>
        <tbody>${subjects.slice(0, 12).map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${s.level || '—'}</td></tr>`).join('') || `<tr><td colspan="2">${emptyState('No subjects on file')}</td></tr>`}</tbody>
      </table></div>
      <p class="muted mt-8" style="font-size:11.5px">${teachers.length} teaching staff at this school</p>
    `);
  } else if (['HOUSE_MASTER', 'MATRON'].includes(role)) {
    const myHouse = ctx.user.scope?.house;
    const residents = students.filter((s) => s.house === myHouse);
    widget = card(`${escapeHtml(myHouse || 'Your house')} — residents (${residents.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Name</th><th>Class</th><th>Emergency contact</th></tr></thead>
        <tbody>${residents.slice(0, 15).map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${escapeHtml(s.emergencyContactName || '—')}</td></tr>`).join('') || `<tr><td colspan="3">${emptyState('No residents recorded for this house yet')}</td></tr>`}</tbody>
      </table></div>
      <p class="muted mt-8" style="font-size:11.5px">You can appoint a resident as a dormitory attendance monitor from Attendance → House Monitors.</p>
    `);
  } else if (role === 'SENIOR_HOUSE_MASTER') {
    const boarders = students.filter((s) => s.house);
    const byHouse = {};
    boarders.forEach((s) => { byHouse[s.house] = (byHouse[s.house] || 0) + 1; });
    widget = card(`All houses (${boarders.length} boarding students)`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>House</th><th>Residents</th></tr></thead>
        <tbody>${Object.entries(byHouse).map(([house, count]) => `<tr><td>${escapeHtml(house)}</td><td>${count}</td></tr>`).join('') || `<tr><td colspan="2">${emptyState('No houses recorded yet')}</td></tr>`}</tbody>
      </table></div>
      <p class="muted mt-8" style="font-size:11.5px">Oversees every house at the school — individual House Masters and Matrons manage their own house's day-to-day.</p>
    `);
  } else if (PASTORAL_COORDINATION_ROLES.includes(role)) {
    const flagged = students.filter((s) => (s.attendanceRate !== null && s.attendanceRate < 75) || (s.behaviourNotes || []).some((n) => n.type === 'SERIOUS'));
    widget = card('Students needing follow-up', flagged.slice(0, 10).map((s) => `
      <div class="flex-between mb-8"><span style="font-size:13px">${escapeHtml(s.name)} — ${s.class}</span><span class="muted" style="font-size:11.5px">${s.attendanceRate !== null ? s.attendanceRate + '% attendance' : ''}</span></div>
    `).join('') || emptyState('Nobody currently flagged — good sign'));
  } else if (role === 'BOARDING_COORDINATOR') {
    const boarders = students.filter((s) => s.boardingStatus === 'BOARDING');
    widget = card(`Boarding students (${boarders.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Name</th><th>Class</th><th>Emergency contact</th></tr></thead>
        <tbody>${boarders.slice(0, 12).map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${escapeHtml(s.emergencyContactName || '—')}</td></tr>`).join('') || `<tr><td colspan="3">${emptyState('No boarding students recorded')}</td></tr>`}</tbody>
      </table></div>
    `);
  } else {
    // SPORTS_COORDINATOR — no dedicated sports data model yet, but this is
    // still a genuinely different widget from the personal teaching view.
    widget = card('School activity snapshot', `
      <p class="muted" style="font-size:12.5px">${students.length} students, ${teachers.length} staff at this school. Coordinate through Messages or Groups for now — dedicated sports/activity tracking isn't built out yet.</p>
      <button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/groups'">Open Groups</button>
    `);
  }

  container.innerHTML = `
    ${dashHero(ctx, `${COORDINATION_TAGLINES[role] || 'Coordination overview'} at ${escapeHtml(ctx.user.school?.name || 'your school')}.`, '')}
    <div class="grid grid-3 mb-16">
      ${statCard("Today's attendance", today && today.rate !== null ? today.rate + '%' : '—', today ? `${today.present}/${today.total} checked in` : '')}
      ${statCard('Students in scope', students.length)}
      ${statCard('Teaching staff', teachers.length)}
    </div>
    ${widget}
  `;
}

