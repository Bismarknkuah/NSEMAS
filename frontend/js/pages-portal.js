/**
 * PARENT / STUDENT PORTAL — edit this file directly.
 * The dashboard shown to Parent and Student role accounts — attendance,
 * assignments, results, and (for parents) switching between multiple
 * children, including children at different schools.
 * Depends on: js/components.js, js/pages.js (shared helpers), js/api.js.
 */

Pages.portalHome = async function (container, ctx, preloadedChildren, initialIndex) {
  const isParent = ctx.user.role === 'PARENT';
  container.innerHTML = `<div class="section-title">Loading portal…</div>`;

  let children = preloadedChildren || [];
  let selectedChildIndex = initialIndex || 0;
  let data;
  try {
    if (isParent) {
      if (!children.length) children = await Api.myChildren();
      if (!children.length) { container.innerHTML = emptyState('No children are linked to this account yet — contact your child\'s school to have them linked.'); return; }
      data = children[selectedChildIndex];
    } else {
      data = await Api.myProfile();
    }
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let attRows = (data.recentAttendance || []).slice(0, 10).map((a) => `
    <tr><td>${fmtDate(a.date)}</td><td>${statusBadge(a.status)}</td><td>${a.checkIn || '—'}</td></tr>
  `).join('');

  let tab = 'attendance';

  async function renderTabBody() {
    const el = document.getElementById('portal-tab-body');
    if (!el) return;
    el.innerHTML = `<div class="muted" style="padding:16px">Loading…</div>`;

    if (tab === 'attendance') {
      el.innerHTML = `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Date</th><th>Status</th><th>Time</th></tr></thead>
          <tbody>${attRows || `<tr><td colspan="3">${emptyState('No attendance recorded')}</td></tr>`}</tbody>
        </table></div>`;
    } else if (tab === 'timetable') {
      const tt = await Api.timetable(data.school.id, data.student.class);
      const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
      const grid = {};
      tt.forEach((t) => { grid[`${t.day}-${t.period}`] = t; });
      const maxPeriod = Math.max(3, ...tt.map((t) => t.period), 0);
      el.innerHTML = `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Period</th>${DAYS.map((d) => `<th>${d}</th>`).join('')}</tr></thead>
          <tbody>${Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => `
            <tr><td class="mono">${p}</td>${DAYS.map((d) => {
              const e = grid[`${d}-${p}`];
              return `<td>${e ? `<div style="font-size:12.5px">${escapeHtml(e.subject)}</div>` : '<span class="muted" style="font-size:11px">—</span>'}</td>`;
            }).join('')}</tr>
          `).join('')}</tbody>
        </table></div>`;
    } else if (tab === 'assignments') {
      if (isParent) {
        const list = await Api.childAssignments(data.student.id);
        el.innerHTML = `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Title</th><th>Subject</th><th>Due</th><th>Status</th><th>Grade</th></tr></thead>
            <tbody>${list.map((a) => `
              <tr><td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.subject)}</td><td>${a.dueDate ? fmtDate(a.dueDate) : '—'}</td>
              <td>${a.submitted ? badge('Submitted', 'green') : badge('Not submitted', 'grey')}</td>
              <td>${a.grade != null ? escapeHtml(String(a.grade)) : '—'}${a.feedback ? ` <span class="muted" style="font-size:11px">(${escapeHtml(a.feedback)})</span>` : ''}</td></tr>
            `).join('') || `<tr><td colspan="5">${emptyState('No assignments posted yet')}</td></tr>`}</tbody>
          </table></div>
          <p class="muted mt-16" style="font-size:12px">You can see deadlines and how ${escapeHtml(data.student.name.split(' ')[0])} did — submitting is done by your child, from their own account.</p>`;
      } else {
        const list = await Api.myAssignments();
        el.innerHTML = `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Title</th><th>Subject</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>${list.map((a) => `
              <tr><td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.subject)}</td><td>${a.dueDate ? fmtDate(a.dueDate) : '—'}</td>
              <td>${a.mySubmission ? badge('Submitted', 'green') : badge('Not submitted', 'grey')}</td></tr>
            `).join('') || `<tr><td colspan="4">${emptyState('No assignments posted yet')}</td></tr>`}</tbody>
          </table></div>
          <p class="muted mt-16" style="font-size:12px">Open <a href="#/assignments">Assignments</a> to submit or review feedback.</p>`;
      }
    } else if (tab === 'results') {
      const rc = await Api.reportCard(data.student.id);
      const myExams = !isParent ? await Api.myExams().catch(() => []) : [];
      const takeable = myExams.filter((e) => !e.submitted);
      el.innerHTML = `
        ${takeable.length ? `
          ${card('Exams you can take now', takeable.map((e) => `
            <div class="flex-between mb-8">
              <div><strong style="font-size:13px">${escapeHtml(e.name)}</strong> <span class="muted" style="font-size:12px">— ${escapeHtml(e.subject)}</span></div>
              <button class="btn btn-gold btn-sm" data-take-exam="${e.id}">Take exam</button>
            </div>
          `).join(''))}
          <div class="mt-16"></div>
        ` : ''}
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Remark</th></tr></thead>
          <tbody>${rc.subjects.map((s) => `
            <tr><td>${escapeHtml(s.subject)}</td><td>${s.score}/${s.maxScore}</td>
            <td>${badge('Grade ' + s.grade, GRADE_BADGE[s.grade] || 'grey')}</td><td>${s.remark}</td></tr>
          `).join('') || `<tr><td colspan="4">${emptyState('No results recorded for this term yet')}</td></tr>`}</tbody>
        </table></div>
        ${myExams.filter((e) => e.pending).length ? `<p class="muted mt-8" style="font-size:11.5px">${myExams.filter((e) => e.pending).length} more exam(s) graded and awaiting your teacher's release.</p>` : ''}
        <div class="grid grid-2 mt-16">
          <div><label>Overall average</label><div style="font-size:20px; font-family:var(--font-display)">${rc.overallAverage !== null ? rc.overallAverage + '%' : '—'}</div></div>
          <div><label>Conduct</label><div style="font-size:13px">${escapeHtml(rc.conduct)}</div></div>
        </div>`;
      el.querySelectorAll('[data-take-exam]').forEach((btn) => {
        btn.addEventListener('click', () => openTakeExamModal(btn.dataset.takeExam));
      });
    } else if (tab === 'materials') {
      const list = await Api.materials({ schoolId: data.school.id, class: data.student.class });
      el.innerHTML = list.map((m) => `
        <div class="mb-16">
          <div class="flex-between"><strong style="font-size:13px">${escapeHtml(m.title)}</strong><span class="muted" style="font-size:11px">${escapeHtml(m.subject)}</span></div>
          <div class="muted" style="font-size:12.5px; margin-top:2px">${escapeHtml(m.description || '')}</div>
          ${m.url ? `<a href="${escapeHtml(m.url)}" target="_blank" rel="noopener" style="font-size:12px">${escapeHtml(m.url)}</a>` : ''}
        </div>
      `).join('') || emptyState('No learning materials posted yet');
    } else if (tab === 'fees') {
      const fin = await Api.studentFinanceSummary(data.student.id).catch(() => null);
      if (!fin) { el.innerHTML = emptyState('No fee records yet'); return; }
      el.innerHTML = `
        <div class="grid grid-3 mb-16">
          <div><label>Total billed</label><div style="font-size:17px; font-family:var(--font-display)">GH₵${fin.totalBilled.toLocaleString()}</div></div>
          <div><label>Total paid</label><div style="font-size:17px; font-family:var(--font-display); color:var(--green-ok)">GH₵${fin.totalPaid.toLocaleString()}</div></div>
          <div><label>Balance</label><div style="font-size:17px; font-family:var(--font-display); color:${fin.balance > 0 ? 'var(--red)' : 'var(--green-ok)'}">GH₵${fin.balance.toLocaleString()}</div></div>
        </div>
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Description</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
          <tbody>${fin.invoices.map((i) => `
            <tr>
              <td>${escapeHtml(i.description)} <span class="muted" style="font-size:11px">· Term ${i.term}</span></td>
              <td>GH₵${i.amount.toLocaleString()}</td><td>GH₵${i.paidAmount.toLocaleString()}</td><td>GH₵${i.balance.toLocaleString()}</td>
              <td>${badge(i.status, i.status === 'PAID' ? 'green' : i.overdue ? 'red' : 'gold')}</td>
            </tr>
          `).join('') || `<tr><td colspan="5">${emptyState('No invoices yet')}</td></tr>`}</tbody>
        </table></div>
      `;
    }
  }

  container.innerHTML = `
    <div class="dash-hero">
      <div>
        <div class="dash-hero-eyebrow">${escapeHtml(dateStr)}</div>
        <h2 class="dash-hero-title">${greeting()}, ${escapeHtml((ctx.user.name || '').split(' ')[0])}.</h2>
        <p class="dash-hero-sub">${isParent ? `Here's how ${escapeHtml(data.student.name.split(' ')[0])} is doing at school.` : "Here's your school record — attendance, timetable, homework, and results."}</p>
      </div>
    </div>
    ${isParent && children.length > 1 ? `
      <div class="pill-tabs" id="child-switcher">
        ${children.map((c, i) => `
          <button class="pill-tab ${i === selectedChildIndex ? 'active' : ''}" data-child-index="${i}">
            ${escapeHtml(c.student.name.split(' ')[0])} <span class="mono muted" style="font-size:10px">· ${escapeHtml(c.school?.name || '')}</span>
          </button>
        `).join('')}
      </div>
    ` : ''}
    <div class="card relative mb-16">
      <div class="watermark-seal">${SEAL_SVG}</div>
      <h2>${escapeHtml(data.student.name)}</h2>
      <div class="mono muted" style="font-size:12px">${data.student.geuln} · ${escapeHtml(data.school?.name || '')}</div>
      <hr class="divider" />
      <div class="grid grid-4">
        <div><label>Class</label><div>${data.student.class}</div></div>
        <div><label>Attendance rate</label><div>${data.attendanceRate ?? '—'}%</div></div>
        <div><label>Status</label><div>${statusBadge(data.student.status)}</div></div>
        <div><label>Medical</label><div>${escapeHtml(data.student.medical || 'None')}</div></div>
      </div>
      ${isParent ? `<div class="mt-8">${badge(data.school?.type || '', data.school?.type === 'PRIVATE' ? 'gold' : 'green')} ${badge(data.school?.level || '', 'grey')}</div>` : ''}
    </div>
    <div class="pill-tabs" id="portal-tabs">
      <button class="pill-tab active" data-tab="attendance">Attendance</button>
      <button class="pill-tab" data-tab="timetable">Timetable</button>
      <button class="pill-tab" data-tab="assignments">Assignments</button>
      <button class="pill-tab" data-tab="results">Results</button>
      <button class="pill-tab" data-tab="materials">Learning materials</button>
      ${data.school?.type === 'PRIVATE' ? `<button class="pill-tab" data-tab="fees">Fees</button>` : ''}
    </div>
    <div class="grid grid-2">
      <div>${card('', '<div id="portal-tab-body"></div>')}</div>
      <div>${card('Announcements', (data.announcements || []).map((a) => `
        <div class="mb-8"><strong style="font-size:13px">${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12.5px">${escapeHtml(a.body)}</div></div>
      `).join('') || emptyState('No announcements'))}</div>
    </div>
  `;

  document.querySelectorAll('#child-switcher .pill-tab').forEach((t) => {
    t.addEventListener('click', () => {
      Pages.portalHome(container, ctx, children, Number(t.dataset.childIndex));
    });
  });

  document.querySelectorAll('#portal-tabs .pill-tab').forEach((t) => {
    t.addEventListener('click', () => {
      tab = t.dataset.tab;
      document.querySelectorAll('#portal-tabs .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
      renderTabBody();
    });
  });
  renderTabBody();
};
