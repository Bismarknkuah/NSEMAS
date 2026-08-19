/**
 * SCHOOL LEADERSHIP DASHBOARD — edit this file directly.
 * Used by Headmaster, Proprietor, Assistant Heads, School Admin — the
 * "command center" view of a single school.
 * Depends on: js/components.js, js/pages.js (shared helpers), js/api.js.
 */

async function renderSchoolLeadershipDashboard(container, ctx) {
  container.innerHTML = `<div class="section-title">Loading school overview…</div>`;
  const schoolId = ctx.user.school?.id;
  let summary, atRisk, leaveList, leaveSummary;
  try {
    summary = await Api.dashboardSummary();
    const report = schoolId ? await Api.attendanceReport(schoolId).catch(() => ({ atRisk: [] })) : { atRisk: [] };
    atRisk = report.atRisk || [];
    leaveList = schoolId ? await Api.leaveRequests({ schoolId, status: 'PENDING' }).catch(() => []) : [];
    leaveSummary = schoolId ? await Api.leaveSummary(schoolId).catch(() => null) : null;
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  container.innerHTML = `
    ${dashHero(ctx, `Here's how ${escapeHtml(ctx.user.school?.name || 'your school')} is doing today.`, `
      <button class="btn btn-gold btn-sm" onclick="location.hash='#/attendance'">Take attendance</button>
      <button class="btn btn-outline btn-sm" onclick="location.hash='#/leave'">Review leave</button>
    `)}
    <div class="grid grid-4 mb-16">
      ${statCard('Students', summary.counts.students)}
      ${statCard('Teachers', summary.counts.teachers)}
      ${statCard("Today's attendance", summary.attendanceToday.rate !== null ? summary.attendanceToday.rate + '%' : '—',
        `${summary.attendanceToday.present}/${summary.attendanceToday.total} checked in`, (summary.attendanceToday.rate || 0) >= 85 ? 'up' : 'down')}
      ${statCard('Leave requests pending', leaveList.length, leaveSummary ? `${leaveSummary.approved} approved this year` : '')}
    </div>
    <div class="grid grid-2 mb-16">
      <div>
        ${card('Students needing attention', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Student</th><th>Class</th><th>Attendance</th></tr></thead>
            <tbody>${atRisk.slice(0, 8).map((s) => `
              <tr style="cursor:pointer" onclick="location.hash='#/students/${s.studentId}'"><td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${riskBar(100 - s.rate)}</td></tr>
            `).join('') || `<tr><td colspan="3">${emptyState('No students flagged — nice work')}</td></tr>`}</tbody>
          </table></div>
        `, '< 80% attendance')}
      </div>
      <div>
        ${card('Leave requests awaiting your decision', `
          ${leaveList.slice(0, 6).map((l) => `
            <div class="flex-between mb-8">
              <span style="font-size:13px">${escapeHtml(l.teacherName)} · ${l.type}</span>
              <span class="mono muted" style="font-size:11px">${l.days} day(s)</span>
            </div>
          `).join('') || emptyState('Nothing pending')}
          ${leaveList.length ? `<button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/leave'">Review all</button>` : ''}
        `)}
      </div>
    </div>
    <div class="grid grid-2">
      <div>${card('Recent inspections', summary.recentInspections.map((i) => `
        <div class="flex-between mb-8"><span style="font-size:13px">${escapeHtml(i.area)} · ${escapeHtml(i.inspector)}</span>
        <span class="mono" style="font-size:11px">${i.overallScore !== null ? i.overallScore + '/100' : '—'}</span></div>
      `).join('') || emptyState('No inspections recorded'))}</div>
      <div>${card('Announcements', summary.announcements.map((a) => `
        <div class="mb-8"><strong style="font-size:13px">${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12.5px">${escapeHtml(a.body)}</div></div>
      `).join('') || emptyState('No announcements'))}</div>
    </div>
  `;
}
