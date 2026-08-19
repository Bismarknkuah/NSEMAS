/**
 * STUDENT LEADERSHIP DASHBOARD — edit this file directly.
 * Used when a student is acting under a leadership appointment (School
 * Prefect, Class Prefect, House Prefect, etc.) — a distinct view from
 * their own personal student portal, built around the duty rather than
 * their own grades/attendance.
 * Depends on: js/components.js, js/pages.js (shared helpers), js/api.js.
 */

async function renderStudentLeadershipDashboard(container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  const schoolId = ctx.user.school?.id;
  const role = ctx.user.role;
  let today, students, announcements;
  try {
    today = schoolId ? await Api.todayAttendance(schoolId).catch(() => null) : null;
    students = schoolId ? await Api.students({ schoolId }).catch(() => []) : [];
    announcements = await Api.announcements().catch(() => []);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  // Class-level roles narrow to their own class; school-wide roles (School
  // Prefect, SRC Executive, etc.) see the full student body.
  const CLASS_SCOPED_ROLES = ['CLASS_PREFECT', 'COURSE_REP'];
  const myClass = ctx.user.scope?.studentId ? students.find((s) => s.id === ctx.user.scope.studentId)?.class : null;
  const relevant = CLASS_SCOPED_ROLES.includes(role) && myClass ? students.filter((s) => s.class === myClass) : students;
  const flagged = relevant.filter((s) => (s.behaviourNotes || []).some((n) => n.type === 'SERIOUS') || (s.attendanceRate !== null && s.attendanceRate < 75));

  container.innerHTML = `
    ${dashHero(ctx, `${STUDENT_LEADER_TAGLINES[role] || 'Leadership overview'} at ${escapeHtml(ctx.user.school?.name || 'your school')}.`, `
      <button class="btn btn-gold btn-sm" onclick="location.hash='#/groups'">Message my group</button>
    `)}
    <div class="grid grid-3 mb-16">
      ${statCard(myClass && CLASS_SCOPED_ROLES.includes(role) ? `${myClass} students` : 'Students in scope', relevant.length)}
      ${statCard("Today's attendance", today && today.rate !== null ? today.rate + '%' : '—', today ? `${today.present}/${today.total} checked in` : '')}
      ${statCard('Flagged for follow-up', flagged.length, 'Low attendance or behaviour notes')}
    </div>
    <div class="grid grid-2">
      <div>${card(myClass && CLASS_SCOPED_ROLES.includes(role) ? `${myClass} roster` : 'Student roster', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Student</th><th>Class</th><th>Attendance</th></tr></thead>
          <tbody>${relevant.slice(0, 12).map((s) => `
            <tr><td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${s.attendanceRate !== null ? s.attendanceRate + '%' : '—'}</td></tr>
          `).join('') || `<tr><td colspan="3">${emptyState('No students in view')}</td></tr>`}</tbody>
        </table></div>
        <p class="muted mt-8" style="font-size:11.5px">Something to flag to a teacher? Use Groups or Messages — there's no direct edit access at this level, by design.</p>
      `)}</div>
      <div>${card('Announcements', announcements.slice(0, 6).map((a) => `
        <div class="mb-8"><strong style="font-size:13px">${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12.5px">${escapeHtml(a.body)}</div></div>
      `).join('') || emptyState('No announcements'))}</div>
    </div>
  `;
}

function dashHero(ctx, subtitle, actionsHtml) {
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `
    <div class="dash-hero">
      <div>
        <div class="dash-hero-eyebrow">${escapeHtml(dateStr)}</div>
        <h2 class="dash-hero-title">${greeting()}, ${escapeHtml((ctx.user.name || '').split(' ')[0] || ctx.user.name)}.</h2>
        <p class="dash-hero-sub">${subtitle}</p>
      </div>
      ${actionsHtml ? `<div class="dash-hero-actions">${actionsHtml}</div>` : ''}
    </div>`;
}
