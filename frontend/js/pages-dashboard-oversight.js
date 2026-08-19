/**
 * OVERSIGHT DASHBOARD — edit this file directly.
 * Used by National, Regional, District, and Circuit tier roles (Minister,
 * Director-General, Regional/District Directors, Circuit Supervisor, etc.)
 * — jurisdiction-scoped views of everything under that office.
 * Depends on: js/components.js, js/pages.js (shared helpers), js/api.js.
 */

async function renderOversightDashboard(container, ctx) {
  container.innerHTML = `<div class="section-title">Loading overview…</div>`;
  let data;
  try { data = await Api.dashboardSummary(); }
  catch (e) { container.innerHTML = emptyState(e.message); return; }

  const rankRows = data.schoolRankings.map((s, i) => `
    <tr style="cursor:pointer" onclick="location.hash='#/schools/${s.schoolId}'">
      <td class="mono">${i + 1}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${s.region}</td>
      <td>${s.studentCount}</td>
      <td>${s.attendanceRate !== null ? s.attendanceRate + '%' : '—'}</td>
      <td>${s.inspectionScore !== null ? s.inspectionScore + '/100' : badge('Not inspected', 'grey')}</td>
    </tr>`).join('');

  const regionRows = Object.entries(data.byRegion).map(([region, v]) => `
    <tr><td>${region}</td><td>${v.schools}</td><td>${v.students}</td></tr>
  `).join('');

  const annItems = data.announcements.map((a) => `
    <div class="mb-16">
      <div class="flex-between"><strong style="font-size:13.5px">${escapeHtml(a.title)}</strong><span class="mono muted" style="font-size:10.5px">${fmtDate(a.createdAt)}</span></div>
      <div class="muted" style="font-size:13px; margin-top:2px">${escapeHtml(a.body)}</div>
    </div>`).join('') || emptyState('No announcements yet');

  const trendVals = data.trend.map((t) => t.rate ?? 0);
  const maxTrend = Math.max(10, ...trendVals);
  const sparkline = data.trend.map((t) => `
    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex:1">
      <div style="width:100%; height:56px; display:flex; align-items:flex-end;">
        <div style="width:100%; background:${t.rate >= 85 ? 'var(--green-ok)' : t.rate >= 70 ? 'var(--gold-bright)' : 'var(--red)'}; border-radius:3px 3px 0 0; height:${((t.rate ?? 0) / maxTrend) * 100}%; min-height:2px"></div>
      </div>
      <span class="mono" style="font-size:8.5px; color:var(--ink-soft)">${t.date.slice(5)}</span>
    </div>
  `).join('');

  const totalStudentsForSplit = (data.genderSplit.MALE || 0) + (data.genderSplit.FEMALE || 0);
  const malePct = totalStudentsForSplit ? Math.round((data.genderSplit.MALE / totalStudentsForSplit) * 100) : 0;

  const levelEntries = Object.entries(data.levelSplit).sort((a, b) => b[1] - a[1]);
  const maxLevel = Math.max(1, ...levelEntries.map(([, v]) => v));

  const subtitle = ctx.isNational ? 'Here is the national picture across every region.' :
    ctx.isRegional ? 'Here is the regional picture across your districts.' :
    ctx.isDistrict ? 'Here is the district picture across your circuits and schools.' :
    ctx.isCircuit ? 'Here is your circuit at a glance.' : 'Here is your dashboard.';

  container.innerHTML = `
    ${dashHero(ctx, subtitle, `
      <button class="btn btn-gold btn-sm" onclick="location.hash='#/attendance'">Take attendance</button>
      <button class="btn btn-outline btn-sm" onclick="location.hash='#/ai'">View AI insights</button>
    `)}
    <div class="grid grid-4 mb-16">
      ${statCard('Schools in scope', data.counts.schools)}
      ${statCard('Active students', data.counts.students)}
      ${statCard('Teachers', data.counts.teachers)}
      ${statCard("Today's attendance", data.attendanceToday.rate !== null ? data.attendanceToday.rate + '%' : '—',
        `${data.attendanceToday.present}/${data.attendanceToday.total} checked in`,
        (data.attendanceToday.rate || 0) >= 85 ? 'up' : 'down')}
    </div>

    <div class="grid mb-16" style="grid-template-columns: 2fr 1fr; gap:16px">
      <div>
        ${card('14-day attendance trend', `<div style="display:flex; gap:6px; align-items:flex-end">${sparkline || emptyState('No attendance recorded yet')}</div>`,
          `Overall rate: ${data.overallAttendanceRate !== null ? data.overallAttendanceRate + '%' : '—'}`)}
      </div>
      <div>
        ${card('Student demographics', `
          <div class="mb-16">
            <div class="flex-between mb-8" style="font-size:12px"><span>Male ${malePct}%</span><span>Female ${100 - malePct}%</span></div>
            <div class="progress-bar"><div style="width:${malePct}%"></div></div>
          </div>
          ${levelEntries.map(([level, count]) => `
            <div class="mb-8">
              <div class="flex-between" style="font-size:12px; margin-bottom:3px"><span>${level}</span><span class="mono muted">${count}</span></div>
              <div class="progress-bar"><div style="width:${(count / maxLevel) * 100}%; background:var(--gold)"></div></div>
            </div>
          `).join('')}
        `)}
      </div>
    </div>

    <div class="grid grid-2 mb-16" style="margin-top:16px">
      ${statCard('Teacher punctuality', data.teacherPunctuality !== null ? data.teacherPunctuality + '%' : '—', 'On-time clock-ins')}
      ${statCard('Pending transfers', data.counts.pendingTransfers, 'Awaiting approval in the chain')}
    </div>

    <div class="grid grid-2">
      <div>
        ${card('School performance ranking', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>#</th><th>School</th><th>Region</th><th>Students</th><th>Attendance</th><th>Inspection</th></tr></thead>
            <tbody>${rankRows || `<tr><td colspan="6">${emptyState('No schools in scope')}</td></tr>`}</tbody>
          </table></div>
        `, 'Ranked by attendance rate')}
        <div class="mt-16">
        ${card('Regional distribution', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Region</th><th>Schools</th><th>Students</th></tr></thead>
            <tbody>${regionRows || `<tr><td colspan="3">${emptyState('No regions in scope')}</td></tr>`}</tbody>
          </table></div>
        `)}
        </div>
      </div>
      <div>
        ${card('Announcements', annItems)}
        <div class="mt-16">
        ${card('Recent inspections', data.recentInspections.map((i) => `
          <div class="flex-between mb-8">
            <span style="font-size:13px">${escapeHtml(i.area)} · ${escapeHtml(i.inspector)}</span>
            <span class="mono" style="font-size:11px">${i.overallScore !== null ? i.overallScore + '/100' : '—'}</span>
          </div>
        `).join('') || emptyState('No inspections recorded'))}
        </div>
        <div class="mt-16" id="role-overlay-widget"></div>
      </div>
    </div>
  `;

  // Role-specific overlay: HR/Curriculum/Exam officer titles get one extra
  // card relevant to their specific portfolio, layered onto the same
  // tier-scoped oversight view everyone at their level gets.
  const overlayHolder = document.getElementById('role-overlay-widget');
  const role = ctx.user.role;
  if (role === 'MINISTER') {
    // The Minister gets the single richest view in the system — every
    // analytics widget that exists anywhere else, combined in one place,
    // rather than the narrower portfolio-specific slice every other
    // national-tier role sees.
    Promise.all([
      Api.aiStrugglingSchools().catch(() => ({ schools: [] })),
      Api.aiDropoutRisk().catch(() => ({ students: [] })),
      Api.aiTeacherAbsenteeism().catch(() => ({ flagged: [] })),
      Api.leaveRequests({ status: 'PENDING' }).catch(() => []),
      Api.subjects().catch(() => []),
      Api.examCandidates().catch(() => []),
    ]).then(([struggling, dropout, absenteeism, pendingLeave, subjects, examCandidates]) => {
      const regionBars = Object.entries(data.byRegion).map(([region, v]) => {
        const rate = data.schoolRankings.filter((s) => s.region === region).reduce((sum, s, _, arr) => sum + (s.attendanceRate || 0) / arr.length, 0);
        return { region, students: v.students, rate: Math.round(rate) };
      });
      const maxStudents = Math.max(1, ...regionBars.map((r) => r.students));
      const pendingExams = examCandidates.filter((c) => c.resultStatus === 'PENDING').length;

      overlayHolder.innerHTML = `
        ${card('National risk summary', `
          <div class="grid grid-3">
            ${statCard('Struggling schools', struggling.schools.length, 'Flagged by AI insights', struggling.schools.length > 0 ? 'down' : 'up')}
            ${statCard('Students at dropout risk', dropout.students.length)}
            ${statCard('Teachers flagged for absenteeism', absenteeism.flagged.length)}
          </div>
          <button class="btn btn-outline btn-sm mt-16" onclick="location.hash='#/ai'">Open full AI insights</button>
        `)}
        <div class="grid grid-3 mt-16">
          ${statCard('Leave requests pending nationally', pendingLeave.length)}
          ${statCard('Subjects in national catalog', subjects.length)}
          ${statCard('Exam results awaiting publication', pendingExams)}
        </div>
        <div class="mt-16">
        ${card('Enrollment by region', regionBars.map((r) => `
          <div class="mb-8">
            <div class="flex-between" style="font-size:12px; margin-bottom:3px"><span>${r.region}</span><span class="mono muted">${r.students} students</span></div>
            <div class="progress-bar"><div style="width:${(r.students / maxStudents) * 100}%; background:var(--forest)"></div></div>
          </div>
        `).join(''))}
        </div>
      `;
    }).catch(() => {});
  } else if (DASH_TOP_MANAGEMENT.includes(role)) {
    Promise.all([
      Api.aiStrugglingSchools().catch(() => ({ schools: [] })),
      Api.aiDropoutRisk().catch(() => ({ students: [] })),
      Api.aiTeacherAbsenteeism().catch(() => ({ flagged: [] })),
    ]).then(([struggling, dropout, absenteeism]) => {
      const regionBars = Object.entries(data.byRegion).map(([region, v]) => {
        const rate = data.schoolRankings.filter((s) => s.region === region).reduce((sum, s, _, arr) => sum + (s.attendanceRate || 0) / arr.length, 0);
        return { region, students: v.students, rate: Math.round(rate) };
      });
      const maxStudents = Math.max(1, ...regionBars.map((r) => r.students));
      overlayHolder.innerHTML = `
        ${card('National risk summary', `
          <div class="grid grid-3">
            ${statCard('Struggling schools', struggling.schools.length, 'Flagged by AI insights', struggling.schools.length > 0 ? 'down' : 'up')}
            ${statCard('Students at dropout risk', dropout.students.length)}
            ${statCard('Teachers flagged for absenteeism', absenteeism.flagged.length)}
          </div>
          <button class="btn btn-outline btn-sm mt-16" onclick="location.hash='#/ai'">Open full AI insights</button>
        `)}
        <div class="mt-16">
        ${card('Enrollment by region', regionBars.map((r) => `
          <div class="mb-8">
            <div class="flex-between" style="font-size:12px; margin-bottom:3px"><span>${r.region}</span><span class="mono muted">${r.students} students</span></div>
            <div class="progress-bar"><div style="width:${(r.students / maxStudents) * 100}%; background:var(--forest)"></div></div>
          </div>
        `).join(''))}
        </div>
      `;
    }).catch(() => {});
  } else if (DASH_HR_TITLES.includes(role)) {
    Api.leaveRequests({ status: 'PENDING' }).then((list) => {
      overlayHolder.innerHTML = card('Leave requests awaiting decision', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Teacher</th><th>Type</th><th>Days</th></tr></thead>
          <tbody>${list.slice(0, 6).map((l) => `<tr><td>${escapeHtml(l.teacherName)}</td><td>${l.type}</td><td>${l.days}</td></tr>`).join('') || `<tr><td colspan="3">${emptyState('Nothing pending')}</td></tr>`}</tbody>
        </table></div>
      `, `${list.length} pending`);
    }).catch(() => {});
  } else if (DASH_CURRICULUM_TITLES.includes(role)) {
    Api.subjects().then((list) => {
      overlayHolder.innerHTML = card('National subject catalog', `
        <p class="muted" style="font-size:13px">${list.length} subjects registered across ${new Set(list.map((s) => s.level)).size} levels.</p>
        <button class="btn btn-outline btn-sm mt-8" onclick="location.hash='#/academics'">Manage catalog</button>
      `);
    }).catch(() => {});
  } else if (DASH_EXAM_TITLES.includes(role)) {
    Api.examCandidates().then((list) => {
      const pending = list.filter((c) => c.resultStatus === 'PENDING').length;
      overlayHolder.innerHTML = card('National Examinations oversight', `
        ${statCard('Candidates registered', list.length)}
        <div class="mt-8">${statCard('Awaiting exam body publication', pending)}</div>
      `);
    }).catch(() => {});
  }
}
