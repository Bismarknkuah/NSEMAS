/**
 * GOVERNANCE DASHBOARD — edit this file directly.
 * Used by private-school board members and other governance-tier roles —
 * an oversight view of enrollment, attendance, compliance, and the
 * schools table.
 * Depends on: js/components.js, js/pages.js (shared helpers), js/api.js.
 */

async function renderGovernanceDashboard(container, ctx) {
  let summary;
  try { summary = await Api.dashboardSummary(); }
  catch (e) { container.innerHTML = emptyState(e.message); return; }

  container.innerHTML = `
    ${dashHero(ctx, 'A governance-level view of your institution — enrollment, attendance, and compliance.', '')}
    <div class="grid grid-4 mb-16">
      ${statCard('Students enrolled', summary.counts.students)}
      ${statCard('Teachers', summary.counts.teachers)}
      ${statCard('Overall attendance rate', summary.overallAttendanceRate !== null ? summary.overallAttendanceRate + '%' : '—')}
      ${statCard('Recent inspections', summary.recentInspections.length)}
    </div>
    <div class="grid grid-2">
      <div>${card('School performance', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>School</th><th>Students</th><th>Attendance</th><th>Inspection</th></tr></thead>
          <tbody>${summary.schoolRankings.map((s) => `
            <tr><td>${escapeHtml(s.name)}</td><td>${s.studentCount}</td><td>${s.attendanceRate !== null ? s.attendanceRate + '%' : '—'}</td><td>${s.inspectionScore !== null ? s.inspectionScore + '/100' : '—'}</td></tr>
          `).join('') || `<tr><td colspan="4">${emptyState('No data yet')}</td></tr>`}</tbody>
        </table></div>
      `)}</div>
      <div>${card('Announcements', summary.announcements.map((a) => `
        <div class="mb-8"><strong style="font-size:13px">${escapeHtml(a.title)}</strong><div class="muted" style="font-size:12.5px">${escapeHtml(a.body)}</div></div>
      `).join('') || emptyState('No announcements'))}</div>
    </div>
  `;
}

// ---------------------------------------------------------------- SCHOOLS
Pages.schools = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading schools…</div>`;
  let schools;
  try { schools = await Api.schools(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  let activeType = '';
  let activeCategory = '';

  function rowHtml(s) {
    return `
    <tr style="cursor:pointer" onclick="location.hash='#/schools/${s.id}'">
      <td>${escapeHtml(s.name)}</td>
      <td>${badge(s.level, 'grey')}</td>
      <td>${badge(s.category === 'SECONDARY' ? 'Secondary' : 'Basic', s.category === 'SECONDARY' ? 'gold' : 'green')}</td>
      <td>${badge(s.type, s.type === 'PUBLIC' ? 'green' : 'gold')}</td>
      <td>${s.region} / ${s.district.replace(/_/g, ' ')}</td>
      <td>${s.studentCount}</td>
      <td>${s.teacherCount}</td>
    </tr>`;
  }

  function applyFilters() {
    const q = (document.getElementById('school-search')?.value || '').toLowerCase();
    const filtered = schools.filter((s) =>
      s.name.toLowerCase().includes(q) &&
      (!activeType || s.type === activeType) &&
      (!activeCategory || s.category === activeCategory)
    );
    document.getElementById('schools-tbody').innerHTML = filtered.map(rowHtml).join('') || `<tr><td colspan="7">${emptyState('No matches')}</td></tr>`;
    document.getElementById('schools-count').textContent = filtered.length;
  }

  container.innerHTML = `
    <div class="flex-between mb-16" style="flex-wrap:wrap; gap:12px">
      <input id="school-search" placeholder="Search schools…" style="max-width:280px" />
      <div class="flex gap-8" style="flex-wrap:wrap">
        <div class="pill-tabs" id="category-filter" style="margin:0">
          <button class="pill-tab active" data-category="">All levels</button>
          <button class="pill-tab" data-category="BASIC">Basic Education</button>
          <button class="pill-tab" data-category="SECONDARY">Secondary Education</button>
        </div>
        <div class="pill-tabs" id="type-filter" style="margin:0">
          <button class="pill-tab active" data-type="">Public &amp; Private</button>
          <button class="pill-tab" data-type="PUBLIC">Public only</button>
          <button class="pill-tab" data-type="PRIVATE">Private only</button>
        </div>
      </div>
    </div>
    ${card('Schools', `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Name</th><th>Level</th><th>Category</th><th>Type</th><th>Region / District</th><th>Students</th><th>Teachers</th></tr></thead>
        <tbody id="schools-tbody">${schools.map(rowHtml).join('') || `<tr><td colspan="7">${emptyState('No schools in scope')}</td></tr>`}</tbody>
      </table></div>
    `, `<span id="schools-count">${schools.length}</span> shown`)}
  `;

  document.getElementById('school-search').addEventListener('input', applyFilters);
  document.querySelectorAll('#category-filter .pill-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      document.querySelectorAll('#category-filter .pill-tab').forEach((b) => b.classList.toggle('active', b === btn));
      applyFilters();
    });
  });
  document.querySelectorAll('#type-filter .pill-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeType = btn.dataset.type;
      document.querySelectorAll('#type-filter .pill-tab').forEach((b) => b.classList.toggle('active', b === btn));
      applyFilters();
    });
  });
};
