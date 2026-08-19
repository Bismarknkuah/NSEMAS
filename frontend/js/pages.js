/* NSEMAS — page renderers. Each Pages.X(container, ctx) renders a screen. */
const Pages = {};

// ---------------------------------------------------------------- LOGIN
const DEMO_ROLE_GROUPS = [
  {
    label: 'National leadership',
    roles: [
      { username: 'demo_minister', title: 'Minister of Education', sub: 'Full national oversight' },
      { username: 'demo_deputy_minister', title: 'Deputy Minister', sub: 'Ministry of Education' },
      { username: 'demo_chief_director', title: 'Chief Director', sub: 'Ministry of Education' },
      { username: 'demo_director_general', title: 'Director-General', sub: 'Ghana Education Service' },
      { username: 'demo_deputy_director_general', title: 'Deputy Director-General', sub: 'Ghana Education Service' },
      { username: 'demo_national_director', title: 'National Director', sub: 'GES Directorate' },
      { username: 'demo_national_monitoring', title: 'National Monitoring', sub: 'Cross-country supervision' },
      { username: 'demo_national_qa', title: 'National QA Officer', sub: 'Quality assurance' },
      { username: 'demo_national_emis', title: 'EMIS Administrator', sub: 'System administration' },
      { username: 'demo_national_ict', title: 'National ICT Administrator', sub: 'Infrastructure & systems' },
      { username: 'demo_national_hr', title: 'National HR Officer', sub: 'Staff & leave oversight' },
      { username: 'demo_national_curriculum', title: 'National Curriculum Officer', sub: 'Subject catalog' },
      { username: 'demo_national_exam', title: 'National Examination Officer', sub: 'BECE/WASSCE oversight' },
    ],
  },
  {
    label: 'Regional administration',
    roles: [
      { username: 'demo_regional_director', title: 'Regional Director', sub: 'Greater Accra' },
      { username: 'demo_asst_regional_director', title: 'Assistant Regional Director', sub: 'Greater Accra' },
      { username: 'demo_regional_monitoring', title: 'Regional Monitoring', sub: 'Greater Accra' },
      { username: 'demo_regional_qa', title: 'Regional QA Officer', sub: 'Greater Accra' },
      { username: 'demo_regional_emis', title: 'Regional EMIS Officer', sub: 'Greater Accra' },
      { username: 'demo_regional_ict', title: 'Regional ICT Officer', sub: 'Greater Accra' },
      { username: 'demo_regional_hr', title: 'Regional HR Officer', sub: 'Greater Accra' },
      { username: 'demo_regional_finance', title: 'Regional Finance Officer', sub: 'Greater Accra' },
    ],
  },
  {
    label: 'District & circuit administration',
    roles: [
      { username: 'demo_district_director', title: 'District Director', sub: 'Accra Metro' },
      { username: 'demo_asst_district_director', title: 'Assistant District Director', sub: 'Accra Metro' },
      { username: 'demo_district_monitoring', title: 'District Monitoring', sub: 'Accra Metro' },
      { username: 'demo_district_emis', title: 'District EMIS Officer', sub: 'Accra Metro' },
      { username: 'demo_district_statistics', title: 'District Statistics Officer', sub: 'Accra Metro' },
      { username: 'demo_district_ict', title: 'District ICT Officer', sub: 'Accra Metro' },
      { username: 'demo_district_hr', title: 'District HR Officer', sub: 'Accra Metro' },
      { username: 'demo_circuit_supervisor', title: 'Circuit Supervisor', sub: 'Accra Metro Circuit 1' },
      { username: 'demo_asst_circuit_supervisor', title: 'Assistant Circuit Supervisor', sub: 'Accra Metro Circuit 1' },
    ],
  },
  {
    label: 'School management',
    roles: [
      { username: 'demo_headmaster', title: 'Headmaster', sub: 'Demo Model School (JHS)' },
      { username: 'demo_headmaster_shs', title: 'Headmaster', sub: 'Demo SHS — a separate head from Basic/JHS' },
      { username: 'demo_assistant_head', title: 'Asst. Headmaster (Academic)', sub: 'Demo Model School' },
      { username: 'demo_assistant_head_admin', title: 'Asst. Headmaster (Admin)', sub: 'Demo Model School' },
      { username: 'demo_school_admin', title: 'School Administrator', sub: 'Demo Model School' },
      { username: 'demo_secretary', title: 'Secretary', sub: 'Demo Model School' },
      { username: 'demo_accountant', title: 'Accountant', sub: 'Demo Model School' },
      { username: 'demo_storekeeper', title: 'Storekeeper', sub: 'Demo Model School' },
      { username: 'demo_librarian', title: 'Librarian', sub: 'Demo Model School' },
      { username: 'demo_ict_coordinator', title: 'ICT Coordinator', sub: 'Demo Model School' },
      { username: 'demo_counsellor', title: 'Counsellor', sub: 'Demo Model School' },
      { username: 'demo_nurse', title: 'School Nurse', sub: 'Demo Model School' },
      { username: 'demo_security_officer', title: 'Security Officer', sub: 'Demo Model School' },
    ],
  },
  {
    label: 'Teaching staff',
    roles: [
      { username: 'demo_teacher', title: 'Teacher', sub: 'Mathematics · Demo Model School' },
      { appointmentRole: 'DEPARTMENT_HEAD', baseUsername: 'demo_teacher', title: 'Department Head', sub: 'Appointment on Yaw Boakye (Teacher)' },
      { appointmentRole: 'SUBJECT_COORDINATOR', baseUsername: 'demo_teacher', title: 'Subject Coordinator', sub: 'Appointment on Yaw Boakye (Teacher)' },
      { appointmentRole: 'FORM_MASTER', baseUsername: 'demo_teacher', title: 'Form Master', sub: 'Appointment on Yaw Boakye (Teacher)' },
      { appointmentRole: 'HOUSE_MASTER', baseUsername: 'demo_teacher', title: 'House Master', sub: 'Appointment on Yaw Boakye (Teacher)' },
      { appointmentRole: 'BOARDING_COORDINATOR', baseUsername: 'demo_teacher', title: 'Boarding Coordinator', sub: 'Appointment on Yaw Boakye (Teacher)' },
      { username: 'demo_lab_technician', title: 'Laboratory Technician', sub: 'Demo Model School' },
      { username: 'demo_workshop_instructor', title: 'Workshop Instructor', sub: 'Demo Model School' },
      { appointmentRole: 'SPORTS_COORDINATOR', baseUsername: 'demo_teacher', title: 'Sports Coordinator', sub: 'Appointment on Yaw Boakye (Teacher)' },
    ],
  },
  {
    label: 'Private school board',
    roles: [
      { username: 'demo_proprietor', title: 'Proprietor', sub: 'Demo Annex School (Private)' },
      { username: 'demo_finance_director', title: 'Finance Director', sub: 'Demo Annex School — the only role that manages private-school fees' },
      { username: 'demo_executive_director', title: 'Executive Director', sub: 'Demo Annex School' },
      { username: 'demo_board_chairman', title: 'Board Chairman', sub: 'Demo Annex School' },
      { username: 'demo_board_member', title: 'Board Member', sub: 'Demo Annex School' },
      { username: 'demo_proprietor_rep', title: 'Proprietor Representative', sub: 'Demo Annex School' },
    ],
  },
  {
    label: 'Student leadership',
    roles: [
      { appointmentRole: 'SCHOOL_PREFECT', baseUsername: 'demo_student', title: 'School Prefect', sub: 'Appointment on Ama Serwaa (Student)' },
      { appointmentRole: 'ASSISTANT_PREFECT', baseUsername: 'demo_student', title: 'Assistant Prefect', sub: 'Appointment on Ama Serwaa (Student)' },
      { appointmentRole: 'BOYS_PREFECT', baseUsername: 'demo_student', title: 'Boys Prefect', sub: 'Appointment on Ama Serwaa (Student)' },
      { appointmentRole: 'GIRLS_PREFECT', baseUsername: 'demo_student', title: 'Girls Prefect', sub: 'Appointment on Ama Serwaa (Student)' },
      { appointmentRole: 'CLASS_PREFECT', baseUsername: 'demo_student', title: 'Class Prefect', sub: 'Appointment on Ama Serwaa (Student)' },
      { appointmentRole: 'COURSE_REP', baseUsername: 'demo_student', title: 'Course Representative', sub: 'Appointment on Ama Serwaa (Student)' },
      { appointmentRole: 'SRC_EXECUTIVE', baseUsername: 'demo_student', title: 'SRC Executive', sub: 'Appointment on Ama Serwaa (Student)' },
      { appointmentRole: 'HALL_REP', baseUsername: 'demo_student', title: 'Hall Representative', sub: 'Appointment on Ama Serwaa (Student)' },
      { appointmentRole: 'HOUSE_PREFECT', baseUsername: 'demo_student', title: 'House Prefect', sub: 'Appointment on Ama Serwaa (Student)' },
    ],
  },
  {
    label: 'Students & families',
    roles: [
      { username: 'demo_parent', title: 'Parent portal', sub: 'Comfort Serwaa' },
      { username: 'demo_student', title: 'Student portal', sub: 'Ama Serwaa · JHS2' },
    ],
  },
];



// ---------------------------------------------------------------- DASHBOARD
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Dashboards are composed differently per role — not just data-scoped, but
// genuinely different widgets — so nobody sees analytics they have no
// reason to act on, and operational roles get the things they actually
// need front and center.
const DASH_SCHOOL_LEADERSHIP = ['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'SCHOOL_ADMIN'];
const DASH_TEACHING = ['TEACHER', 'DEPARTMENT_HEAD', 'SUBJECT_COORDINATOR', 'FORM_MASTER', 'HOUSE_MASTER', 'BOARDING_COORDINATOR', 'SPORTS_COORDINATOR', 'WORKSHOP_INSTRUCTOR', 'LAB_TECHNICIAN'];
const DASH_SUPPORT_MINIMAL = ['SECRETARY', 'ACCOUNTANT', 'STOREKEEPER', 'ICT_COORDINATOR', 'SECURITY_OFFICER', 'LIBRARIAN'];
const DASH_GOVERNANCE = ['EXECUTIVE_DIRECTOR', 'BOARD_CHAIRMAN', 'BOARD_MEMBER', 'PROPRIETOR_REP'];
const DASH_HR_TITLES = ['NATIONAL_HR', 'REGIONAL_HR', 'DISTRICT_HR'];
const DASH_CURRICULUM_TITLES = ['NATIONAL_CURRICULUM_OFFICER'];
const DASH_EXAM_TITLES = ['NATIONAL_EXAM_OFFICER'];
const DASH_TOP_MANAGEMENT = ['MINISTER', 'DEPUTY_MINISTER', 'CHIEF_DIRECTOR', 'DIRECTOR_GENERAL', 'DEPUTY_DIRECTOR_GENERAL'];

Pages.dashboard = async function (container, ctx) {
  if (ctx.isPortal) return Pages.portalHome(container, ctx);
  if (ctx.isStudentLeader) return renderStudentLeadershipDashboard(container, ctx);
  const role = ctx.user.role;

  if (DASH_SCHOOL_LEADERSHIP.includes(role)) return renderSchoolLeadershipDashboard(container, ctx);
  if (role === 'COUNSELLOR') return renderCounsellorDashboard(container, ctx);
  if (role === 'NURSE') return renderNurseDashboard(container, ctx);
  if (DASH_SUPPORT_MINIMAL.includes(role)) return renderSupportDashboard(container, ctx);
  if (DASH_TEACHING.includes(role)) {
    const COORDINATION_ROLES = ['DEPARTMENT_HEAD', 'SUBJECT_COORDINATOR', 'FORM_MASTER', 'HOUSE_MASTER', 'MATRON', 'SENIOR_HOUSE_MASTER', 'BOARDING_COORDINATOR', 'SPORTS_COORDINATOR'];
    return COORDINATION_ROLES.includes(role) ? renderTeacherCoordinationDashboard(container, ctx) : renderTeachingDashboard(container, ctx);
  }
  if (DASH_GOVERNANCE.includes(role)) return renderGovernanceDashboard(container, ctx);
  return renderOversightDashboard(container, ctx); // national/regional/district/circuit tiers
};

const STUDENT_LEADER_TAGLINES = {
  SCHOOL_PREFECT: 'School-wide leadership overview',
  ASSISTANT_PREFECT: 'School-wide leadership overview',
  BOYS_PREFECT: "Overview for the boys' student body",
  GIRLS_PREFECT: "Overview for the girls' student body",
  CLASS_PREFECT: 'Your class overview',
  COURSE_REP: 'Your class overview',
  SRC_EXECUTIVE: 'Student Representative Council overview',
  HALL_REP: 'Your hall/house overview',
  HOUSE_PREFECT: 'Your house overview',
};

// A student leader's duties center on their class or school's welfare, not
// their own personal record — this is deliberately not the same page a
// plain student sees when acting in their personal capacity.

// ---------------- National / Regional / District / Circuit oversight ----------------

// ---------------- School leadership: command center ----------------

// ---------------- Teaching staff: my classes ----------------

// ---------------- Counsellor: student welfare focus ----------------

Pages.schoolDetail = async function (container, ctx, schoolId) {
  container.innerHTML = `<div class="section-title">Loading school…</div>`;
  let school, report, inspectionSummary;
  try {
    school = await Api.school(schoolId);
    report = await Api.attendanceReport(schoolId).catch(() => ({ series: [], atRisk: [] }));
    inspectionSummary = await Api.inspectionSummary(schoolId).catch(() => ({ byArea: {} }));
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const maxBar = Math.max(1, ...report.series.map((s) => s.rate));
  const bars = report.series.slice(-14).map((s) => `
    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex:1">
      <div style="width:100%; height:80px; display:flex; align-items:flex-end;">
        <div style="width:100%; background:var(--forest); border-radius:3px 3px 0 0; height:${(s.rate / maxBar) * 100}%"></div>
      </div>
      <span class="mono" style="font-size:9px; color:var(--ink-soft)">${s.date.slice(5)}</span>
    </div>
  `).join('');

  const atRiskRows = report.atRisk.slice(0, 8).map((s) => `
    <tr><td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${riskBar(100 - s.rate)}</td></tr>
  `).join('');

  container.innerHTML = `
    <div class="flex-between mb-16">
      <div>
        <div class="crumbs"><a href="#/schools">Schools</a> / ${escapeHtml(school.name)}</div>
        <h2>${escapeHtml(school.name)}</h2>
      </div>
      <div class="flex gap-8">
        ${badge(school.type, school.type === 'PUBLIC' ? 'green' : 'gold')}
        ${badge(school.level, 'grey')}
      </div>
    </div>
    <div class="grid grid-4 mb-16">
      ${statCard('Students', school.studentCount)}
      ${statCard('Teachers', school.teacherCount)}
      ${statCard('GPS Address', `<span style="font-size:16px">${school.gpsAddress}</span>`)}
      ${statCard('Established', school.establishedYear)}
    </div>
    <div class="grid grid-2">
      <div>
        ${card('Attendance rate — last 14 recorded days', `<div style="display:flex; gap:6px; align-items:flex-end">${bars || emptyState('No attendance data')}</div>`)}
        <div class="mt-16">
        ${card('Attendance risk watch', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Student</th><th>Class</th><th>Risk</th></tr></thead>
            <tbody>${atRiskRows || `<tr><td colspan="3">${emptyState('No at-risk students')}</td></tr>`}</tbody>
          </table></div>
        `, '< 80% attendance')}
        </div>
      </div>
      <div>
        ${card('Inspection scores by area', `
          <div class="flex-between mb-8"><span>Academic</span><strong>${inspectionSummary.byArea.ACADEMIC ?? '—'}</strong></div>
          <div class="flex-between mb-8"><span>Administration</span><strong>${inspectionSummary.byArea.ADMINISTRATION ?? '—'}</strong></div>
          <div class="flex-between"><span>Infrastructure</span><strong>${inspectionSummary.byArea.INFRASTRUCTURE ?? '—'}</strong></div>
        `)}
        <div class="mt-16">
        ${card('Quick actions', `
          <div class="flex gap-8" style="flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/students?schoolId=${school.id}'">View students</button>
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/attendance?schoolId=${school.id}'">Attendance register</button>
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/teachers?schoolId=${school.id}'">Teachers</button>
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/inspections?schoolId=${school.id}'">Inspections</button>
            <button class="btn btn-outline btn-sm" onclick="location.hash='#/infrastructure?schoolId=${school.id}'">Infrastructure &amp; assets</button>
          </div>
        `)}
        </div>
      </div>
    </div>
  `;
};

// ---------------------------------------------------------------- STUDENTS
Pages.students = async function (container, ctx) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const schoolId = params.get('schoolId') || '';
  container.innerHTML = `<div class="section-title">Loading students…</div>`;

  let students, schools;
  try {
    students = await Api.students(schoolId ? { schoolId } : {});
    schools = ctx.canAdmit ? await Api.schools() : [];
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const canAdmit = ctx.canAdmit;

  const rows = students.map((s) => `
    <tr style="cursor:pointer" onclick="location.hash='#/students/${s.id}'">
      <td class="mono" style="font-size:11.5px">${s.geuln}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${s.class}</td>
      <td>${s.gender}</td>
      <td>${s.attendanceRate !== null ? s.attendanceRate + '%' : '—'}</td>
      <td>${s.biometricEnrolled ? badge('Enrolled', 'green') : badge('Not enrolled', 'grey')}</td>
      <td>${statusBadge(s.status)}</td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="flex-between mb-16">
      <input id="student-search" placeholder="Search by name or GEULN…" style="max-width:300px" />
      <div class="flex gap-8">
        ${exportButton('students-export')}
        ${canAdmit ? `<button class="btn btn-gold" id="admit-btn">+ Admit student</button><button class="btn btn-outline" id="bulk-import-btn">Bulk import (CSV)</button>` : ''}
      </div>
    </div>
    ${card(`Students (${students.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>GEULN</th><th>Name</th><th>Class</th><th>Gender</th><th>Attendance</th><th>Biometric</th><th>Status</th></tr></thead>
        <tbody id="students-tbody">${rows || `<tr><td colspan="7">${emptyState('No students found')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;
  wireExportButton('students-export', () => ({
    title: 'Students',
    columns: [
      { key: 'geuln', label: 'GEULN' }, { key: 'name', label: 'Name' }, { key: 'class', label: 'Class' },
      { key: 'gender', label: 'Gender' }, { key: 'attendanceRate', label: 'Attendance %' }, { key: 'status', label: 'Status' },
    ],
    rows: students.map((s) => ({ geuln: s.geuln, name: s.name, class: s.class, gender: s.gender, attendanceRate: s.attendanceRate ?? '', status: s.status })),
  }));

  document.getElementById('student-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = students.filter((s) => s.name.toLowerCase().includes(q) || s.geuln.toLowerCase().includes(q));
    document.getElementById('students-tbody').innerHTML = filtered.map((s) => `
      <tr style="cursor:pointer" onclick="location.hash='#/students/${s.id}'">
        <td class="mono" style="font-size:11.5px">${s.geuln}</td>
        <td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${s.gender}</td>
        <td>${s.attendanceRate !== null ? s.attendanceRate + '%' : '—'}</td>
        <td>${s.biometricEnrolled ? badge('Enrolled', 'green') : badge('Not enrolled', 'grey')}</td>
        <td>${statusBadge(s.status)}</td>
      </tr>`).join('') || `<tr><td colspan="7">${emptyState('No matches')}</td></tr>`;
  });

  const bulkImportBtn = document.getElementById('bulk-import-btn');
  if (bulkImportBtn) {
    bulkImportBtn.addEventListener('click', () => {
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>Bulk import students</h3>
        <p class="muted" style="font-size:12px; margin-bottom:14px">
          CSV with columns: <code>name,gender,class,dateOfBirth,parentName,parentPhone</code> (first row is a header and is skipped).
          Gender must be MALE or FEMALE. Max 1000 rows.
        </p>
        <input type="file" id="bulk-csv-input" accept=".csv,text/csv" />
        <div id="bulk-preview" class="mt-16"></div>
      `);
      document.getElementById('bulk-csv-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const header = lines[0].split(',').map((h) => h.trim());
        const rows = lines.slice(1).map((line) => {
          const cells = line.split(',').map((c) => c.trim());
          const row = {};
          header.forEach((h, i) => { row[h] = cells[i] || ''; });
          return row;
        });
        document.getElementById('bulk-preview').innerHTML = `
          <p style="font-size:12.5px">${rows.length} row(s) parsed. First few:</p>
          <div class="table-wrap"><table class="ledger">
            <thead><tr>${header.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
            <tbody>${rows.slice(0, 5).map((r) => `<tr>${header.map((h) => `<td>${escapeHtml(r[h] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
          </table></div>
          <button class="btn btn-gold mt-16" id="confirm-bulk-import">Import ${rows.length} student(s)</button>
          <div id="bulk-import-result" class="mt-16"></div>
        `;
        document.getElementById('confirm-bulk-import').addEventListener('click', async () => {
          try {
            const result = await Api.bulkAdmitStudents(rows);
            document.getElementById('bulk-import-result').innerHTML = `
              <div class="card" style="background:var(--green-ok-pale)">
                <strong style="font-size:13px">${result.createdCount} created, ${result.skippedCount} skipped</strong>
                ${result.results.filter((r) => r.status === 'skipped').length ? `
                  <div class="mt-8" style="font-size:11.5px">
                    ${result.results.filter((r) => r.status === 'skipped').map((r) => `Row ${r.row} (${escapeHtml(r.name)}): ${escapeHtml(r.reason)}`).join('<br/>')}
                  </div>
                ` : ''}
              </div>`;
            toast(`Imported ${result.createdCount} students`, 'success');
            App.render();
          } catch (err) { toast(err.message, 'error'); }
        });
      });
    });
  }

  const admitBtn = document.getElementById('admit-btn');
  if (admitBtn) {
    admitBtn.addEventListener('click', () => {
      const schoolOptions = schools.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>Admit new student</h3>
        <p class="muted" style="font-size:12.5px; margin-bottom:16px">Generates a Ghana Education Unique Learner Number automatically.</p>
        <form id="admit-form">
          ${schools.length > 1 ? `<div class="field"><label>School</label><select name="schoolId">${schoolOptions}</select></div>` : ''}
          <div class="field-row">
            <div class="field"><label>Full name</label><input name="name" required /></div>
            <div class="field"><label>Gender</label><select name="gender"><option>MALE</option><option>FEMALE</option></select></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Date of birth</label><input name="dateOfBirth" type="date" /></div>
            <div class="field"><label>Class</label><input name="class" placeholder="e.g. P3, JHS1" required /></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Nationality</label><input name="nationality" value="Ghanaian" /></div>
            <div class="field"><label>Boarding status</label><select name="boardingStatus"><option value="DAY">Day</option><option value="BOARDING">Boarding</option></select></div>
          </div>
          <div class="field"><label>Home address</label><input name="address" /></div>
          <div class="field"><label>Previous school (if transferring)</label><input name="previousSchool" /></div>
          <div class="field-row">
            <div class="field"><label>Medical notes</label><input name="medical" placeholder="None" /></div>
            <div class="field"><label>Allergies</label><input name="allergies" placeholder="None" /></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Emergency contact name</label><input name="emergencyContactName" /></div>
            <div class="field"><label>Emergency contact phone</label><input name="emergencyContactPhone" /></div>
          </div>
          <hr class="divider" />
          <label style="font-size:12.5px; font-weight:600; margin-bottom:8px; display:block">Parent / Guardian — automatically linked to the parent portal</label>
          <div class="field"><label>Relationship</label>
            <select name="guardianRelationship"><option>Parent</option><option>Father</option><option>Mother</option><option>Guardian</option><option>Grandparent</option><option>Other</option></select>
          </div>
          <div class="pill-tabs" id="parent-link-mode" style="margin-bottom:14px">
            <button type="button" class="pill-tab active" data-mode="existing">Link existing account</button>
            <button type="button" class="pill-tab" data-mode="new">Create new account</button>
          </div>
          <div id="parent-link-existing">
            <div class="field"><label>Parent's username</label><input name="parentUsername" placeholder="e.g. demo_parent" /></div>
          </div>
          <div id="parent-link-new" style="display:none">
            <div class="field-row">
              <div class="field"><label>Parent/guardian name</label><input name="parentName" /></div>
              <div class="field"><label>Parent phone</label><input name="parentPhone" /></div>
            </div>
            <div class="field"><label>Parent email (optional)</label><input name="parentEmail" type="email" /></div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%">Admit student</button>
        </form>
        <div id="admit-result" class="mt-16"></div>
      `);

      let parentMode = 'existing';
      m.querySelectorAll('#parent-link-mode .pill-tab').forEach((t) => {
        t.addEventListener('click', () => {
          parentMode = t.dataset.mode;
          m.querySelectorAll('#parent-link-mode .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
          m.querySelector('#parent-link-existing').style.display = parentMode === 'existing' ? 'block' : 'none';
          m.querySelector('#parent-link-new').style.display = parentMode === 'new' ? 'block' : 'none';
        });
      });

      onForm('admit-form', async (data) => {
        const payload = { ...data };
        if (parentMode === 'new') { payload.createParentAccount = true; delete payload.parentUsername; }
        else { delete payload.parentName; delete payload.parentPhone; delete payload.parentEmail; delete payload.createParentAccount; }
        const created = await Api.admitStudent(payload);
        toast('Student admitted', 'success');
        if (created.parentLinkResult?.linked && created.parentLinkResult.temporaryPassword) {
          document.getElementById('admit-result').innerHTML = `
            <div class="card" style="background:var(--green-ok-pale); border-color:var(--green-ok)">
              <strong style="font-size:13px">Parent account created</strong>
              <div class="mono mt-8" style="font-size:12px">Username: ${escapeHtml(created.parentLinkResult.username)}</div>
              <div class="mono" style="font-size:12px">Temporary password: ${escapeHtml(created.parentLinkResult.temporaryPassword)}</div>
              <p class="muted mt-8" style="font-size:11.5px">Share this securely — it won't be shown again.</p>
              <button class="btn btn-outline btn-sm mt-8" onclick="closeModal(this); App.render();">Done</button>
            </div>`;
          document.getElementById('admit-form').style.display = 'none';
        } else {
          if (created.parentLinkResult && !created.parentLinkResult.linked) {
            toast(created.parentLinkResult.error, 'error');
          }
          m.remove();
          App.render();
        }
      });
    });
  }
};

/**
 * Real 3-capture fingerprint enrollment flow: each "Scan" press calls the
 * backend's biometric capture endpoint (which generates a simulated
 * minutiae reading of the student's underlying finger identity), renders
 * the actual returned points as a fingerprint visualization, and once all
 * 3 samples are in, trains a template server-side and reports the
 * resulting quality score — mirroring how a real biometric SDK's
 * multi-sample enrollment works.
 */
function openFingerprintEnrollModal(studentId) {
  const samples = [];
  const m = modal(`
    <button class="close-x" onclick="closeModal(this)">✕</button>
    <h3>Enroll fingerprint</h3>
    <p class="muted" style="font-size:12.5px; margin-bottom:12px">Capture 3 scans of the same finger to train a reliable template.</p>
    <div class="fp-pad-wrap">
      <div class="fp-pad" id="fp-pad">${fingerprintSVG([], { dim: true })}</div>
      <div class="fp-progress" id="fp-progress">
        <span class="fp-dot" data-i="0"></span><span class="fp-dot" data-i="1"></span><span class="fp-dot" data-i="2"></span>
      </div>
    </div>
    <div id="fp-status" class="muted" style="font-size:12.5px; text-align:center; margin:10px 0">Ready to scan (0 of 3)</div>
    <button class="btn btn-primary" id="fp-scan-btn" style="width:100%">Press to scan</button>
    <div id="fp-result" class="mt-16"></div>
  `);

  const pad = m.querySelector('#fp-pad');
  const status = m.querySelector('#fp-status');
  const scanBtn = m.querySelector('#fp-scan-btn');
  const resultEl = m.querySelector('#fp-result');

  function updateDots() {
    m.querySelectorAll('.fp-dot').forEach((d, i) => d.classList.toggle('done', i < samples.length));
  }

  scanBtn.addEventListener('click', async () => {
    scanBtn.disabled = true;
    pad.classList.add('scanning');
    status.textContent = 'Scanning…';
    try {
      const res = await Api.captureFingerprint(studentId, 0);
      pad.innerHTML = fingerprintSVG(res.points);
      samples.push(res.points);
      updateDots();
      pad.classList.remove('scanning');

      if (samples.length < 3) {
        status.textContent = `Captured ${samples.length} of 3 — scan again`;
        scanBtn.disabled = false;
      } else {
        status.textContent = 'Training template…';
        try {
          const trained = await Api.trainFingerprint(studentId, samples);
          const q = trained.biometricTemplateMeta?.quality ?? 0;
          resultEl.innerHTML = `
            <div class="card" style="background:var(--surface-2)">
              <div class="flex-between mb-8"><strong>Template trained</strong>${badge(q + '% quality', q >= 70 ? 'green' : 'gold')}</div>
              <div class="progress-bar"><div style="width:${q}%; background:${q >= 70 ? 'var(--green-ok)' : 'var(--gold)'}"></div></div>
              <p class="muted" style="font-size:11.5px; margin:10px 0 0">Based on ${trained.biometricTemplateMeta?.points ?? 0} consistent minutiae points across all 3 samples.</p>
            </div>`;
          status.textContent = 'Enrollment complete';
          scanBtn.style.display = 'none';
          toast('Fingerprint enrolled', 'success');
          App.render();
        } catch (err) {
          status.textContent = 'Scan quality too low — please try again';
          samples.length = 0;
          updateDots();
          pad.innerHTML = fingerprintSVG([], { dim: true });
          scanBtn.disabled = false;
          toast(err.message, 'error');
        }
      }
    } catch (err) {
      pad.classList.remove('scanning');
      status.textContent = 'Scan failed — try again';
      scanBtn.disabled = false;
      toast(err.message, 'error');
    }
  });
}

Pages.studentDetail = async function (container, ctx, studentId) {
  container.innerHTML = `<div class="section-title">Loading student passport…</div>`;
  let student;
  try { student = await Api.student(studentId); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const historyRows = (student.attendanceHistory || []).slice(0, 12).map((a) => `
    <tr><td>${fmtDate(a.date)}</td><td>${statusBadge(a.status)}</td><td>${a.checkIn || '—'}</td><td>${a.method}</td></tr>
  `).join('');

  const academicRows = (student.academicHistory || []).slice().reverse().map((h) => `
    <tr><td>${h.academicYear}</td><td>${h.class}</td><td>${statusBadge(h.outcome)}</td></tr>
  `).join('');

  const noteRows = (student.behaviourNotes || []).slice().reverse().map((n) => `
    <div class="mb-8"><span class="mono muted" style="font-size:10.5px">${fmtDate(n.at)} · ${n.by}</span><br/>
    ${badge(n.type, n.type === 'SERIOUS' ? 'red' : 'grey')} ${escapeHtml(n.note)}</div>
  `).join('') || emptyState('No behaviour notes');

  container.innerHTML = `
    <div class="crumbs"><a href="#/students">Students</a> / ${escapeHtml(student.name)}</div>
    <div class="card relative" style="margin-bottom:16px">
      <div class="watermark-seal">${SEAL_SVG}</div>
      <div class="flex-between">
        <div>
          <h2>${escapeHtml(student.name)}</h2>
          <div class="mono muted" style="font-size:12px; margin-top:4px">${student.geuln}</div>
        </div>
        <div style="text-align:right">
          ${statusBadge(student.status)}
          <div class="mt-8">${student.biometricEnrolled
            ? badge(`Biometric enrolled · ${student.biometricMethod || ''}${student.biometricTemplateMeta?.quality ? ' · ' + student.biometricTemplateMeta.quality + '% quality' : ''}`, 'green')
            : badge('Biometric not enrolled', 'grey')}</div>
        </div>
      </div>
      <hr class="divider" />
      <div class="grid grid-4">
        <div><label>Class</label><div>${student.class}</div></div>
        <div><label>Gender</label><div>${student.gender}</div></div>
        <div><label>Date of birth</label><div>${fmtDate(student.dateOfBirth)}</div></div>
        <div><label>Attendance rate</label><div>${student.attendanceRate !== null ? student.attendanceRate + '%' : '—'}</div></div>
        <div><label>Nationality</label><div>${escapeHtml(student.nationality || 'Ghanaian')}</div></div>
        <div><label>Boarding status</label><div>${student.boardingStatus === 'BOARDING' ? 'Boarding' : 'Day'}</div></div>
        <div><label>Previous school</label><div>${escapeHtml(student.previousSchool || '—')}</div></div>
        <div><label>Admitted</label><div>${fmtDate(student.admissionDate)}</div></div>
        <div><label>Home address</label><div>${escapeHtml(student.address || '—')}</div></div>
        <div><label>Medical</label><div>${escapeHtml(student.medical || 'None')}</div></div>
        <div><label>Allergies</label><div>${escapeHtml(student.allergies || 'None')}</div></div>
        <div><label>Emergency contact</label><div>${escapeHtml(student.emergencyContactName || '—')} ${student.emergencyContactPhone ? '· ' + escapeHtml(student.emergencyContactPhone) : ''}</div></div>
      </div>
      <hr class="divider" />
      <div class="grid grid-3">
        <div><label>Parent/Guardian</label><div>${escapeHtml(student.parentName || '—')} ${student.guardianRelationship ? `<span class="muted">(${escapeHtml(student.guardianRelationship)})</span>` : ''}</div></div>
        <div><label>Parent phone</label><div>${escapeHtml(student.parentPhone || '—')}</div></div>
        <div><label>Parent portal</label><div>${student.parentLinked ? badge('Linked', 'green') : badge('Not linked', 'grey')}</div></div>
      </div>
      ${ctx.canAdmit ? `
      <hr class="divider" />
      <div class="flex gap-8" style="flex-wrap:wrap">
        ${!student.biometricEnrolled ? `<button class="btn btn-outline btn-sm" id="enroll-fingerprint-btn">Enroll fingerprint</button>
        <button class="btn btn-outline btn-sm" id="enroll-other-btn">Enroll facial / RFID</button>` : ''}
        <button class="btn btn-outline btn-sm" id="note-btn">Add behaviour/medical note</button>
        <button class="btn btn-outline btn-sm" onclick="location.hash='#/promotion/${student.id}'">Promotion evaluation</button>
        <button class="btn btn-outline btn-sm" onclick="location.hash='#/transfers/new/${student.id}'">Initiate transfer</button>
        ${student.userId ? `<button class="btn btn-outline btn-sm" id="assign-leadership-btn">Assign leadership role</button>` : ''}
      </div>
      <div id="student-appointments" class="mt-8"></div>` : ''}
    </div>

    <div class="grid grid-2">
      <div>
        ${card('Recent attendance', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Date</th><th>Status</th><th>Time</th><th>Method</th></tr></thead>
            <tbody>${historyRows || `<tr><td colspan="4">${emptyState('No attendance recorded')}</td></tr>`}</tbody>
          </table></div>
        `)}
      </div>
      <div>
        ${card('Academic / lifecycle history', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Year</th><th>Class</th><th>Outcome</th></tr></thead>
            <tbody>${academicRows || `<tr><td colspan="3">${emptyState('No promotion decisions yet')}</td></tr>`}</tbody>
          </table></div>
        `)}
        <div class="mt-16">
        ${card('Behaviour & medical notes', noteRows)}
        </div>
      </div>
    </div>
  `;

  const enrollOtherBtn = document.getElementById('enroll-other-btn');
  if (enrollOtherBtn) enrollOtherBtn.addEventListener('click', async () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Enroll biometric ID</h3>
      <form id="other-enroll-form">
        <div class="field"><label>Method</label>
          <select name="method"><option value="FACIAL">Facial recognition</option><option value="RFID">RFID / NFC card</option></select>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%">Enroll</button>
      </form>
    `);
    onForm('other-enroll-form', async (data) => {
      await Api.enrollBiometric(student.id, data.method);
      toast('Biometric enrolled', 'success');
      m.remove();
      App.render();
    });
  });

  const enrollFpBtn = document.getElementById('enroll-fingerprint-btn');
  if (enrollFpBtn) enrollFpBtn.addEventListener('click', () => openFingerprintEnrollModal(student.id));

  const noteBtn = document.getElementById('note-btn');
  if (noteBtn) noteBtn.addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Add note</h3>
      <form id="note-form">
        <div class="field"><label>Type</label>
          <select name="type"><option value="GENERAL">General</option><option value="SERIOUS">Serious behaviour</option><option value="MEDICAL">Medical</option><option value="AWARD">Award</option></select>
        </div>
        <div class="field"><label>Note</label><textarea name="note" rows="3" required></textarea></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Save note</button>
      </form>
    `);
    onForm('note-form', async (data) => {
      await Api.addStudentNote(student.id, data.type, data.note);
      toast('Note added', 'success');
      m.remove();
      App.render();
    });
  });

  const appointmentsHolder = document.getElementById('student-appointments');
  const STUDENT_LEADERSHIP_ROLES = ['SCHOOL_PREFECT', 'ASSISTANT_PREFECT', 'BOYS_PREFECT', 'GIRLS_PREFECT', 'CLASS_PREFECT', 'COURSE_REP', 'SRC_EXECUTIVE', 'HALL_REP', 'HOUSE_PREFECT'];
  if (appointmentsHolder && student.userId) {
    Api.schoolAppointments(student.schoolId).then((all) => {
      const mine = all.filter((a) => a.studentOrTeacherId === student.id && a.active);
      appointmentsHolder.innerHTML = mine.length
        ? mine.map((a) => `
          <span class="badge badge-gold" style="margin-right:6px">${escapeHtml(ROLE_LABELS[a.role] || a.role)}
            <button class="revoke-x" data-revoke="${a.id}" title="Revoke">✕</button>
          </span>`).join('')
        : '';
      appointmentsHolder.querySelectorAll('[data-revoke]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await Api.revokeAppointment(btn.dataset.revoke);
          toast('Appointment revoked', 'success');
          App.render();
        });
      });
    });
  }

  const assignLeadershipBtn = document.getElementById('assign-leadership-btn');
  if (assignLeadershipBtn) assignLeadershipBtn.addEventListener('click', () => {
    // SRC and house/hall-based leadership are SHS and boarding concepts —
    // a Primary or JHS day school has no dormitory halls and typically no
    // SRC structure, so offering these roles there just invites a
    // meaningless appointment.
    const SHS_OR_BOARDING_ONLY_ROLES = ['SRC_EXECUTIVE', 'HALL_REP', 'HOUSE_PREFECT'];
    const schoolLevel = ctx.user.school?.level;
    const availableStudentRoles = (schoolLevel === 'SHS')
      ? STUDENT_LEADERSHIP_ROLES
      : STUDENT_LEADERSHIP_ROLES.filter((r) => !SHS_OR_BOARDING_ONLY_ROLES.includes(r));

    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Assign leadership role</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">
        ${escapeHtml(student.name)} keeps their normal student login — this adds an executive title
        they can switch into from the "Viewing as" selector in their sidebar. Revoke it any time.
      </p>
      <form id="assign-appt-form">
        <div class="field"><label>Role</label>
          <select name="role">${availableStudentRoles.map((r) => `<option value="${r}">${escapeHtml(ROLE_LABELS[r] || r)}</option>`).join('')}</select>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%">Assign</button>
      </form>
    `);
    onForm('assign-appt-form', async (data) => {
      await Api.assignAppointment(student.userId, data.role);
      toast('Leadership role assigned', 'success');
      m.remove();
      App.render();
    });
  });
};

// ---------------------------------------------------------------- ATTENDANCE
Pages.attendance = async function (container, ctx) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  let schoolId = params.get('schoolId') || ctx.user.school?.id || '';

  container.innerHTML = `<div class="section-title">Loading attendance…</div>`;
  let schools = [];
  if (!schoolId) {
    try { schools = await Api.schools(); schoolId = schools[0]?.id; } catch (e) { container.innerHTML = emptyState(e.message); return; }
  }
  if (!schoolId) { container.innerHTML = emptyState('No school in scope for attendance.'); return; }

  let today;
  try { today = await Api.todayAttendance(schoolId); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  // Matches routes/attendance.js's isAttendanceEligible exactly — kept as
  // its own list here (not shared code) because this file predates the
  // scoping work, so it has to be updated by hand whenever that changes.
  const ATTENDANCE_TAKER_ROLES = ['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'COURSE_REP', 'HOUSE_MASTER', 'MATRON', 'SENIOR_HOUSE_MASTER'];
  const canRecord = ATTENDANCE_TAKER_ROLES.includes(ctx.user.role) || ctx.user.role === 'STUDENT'; // a delegated house monitor is a STUDENT account — the backend is the real gate either way

  const rows = today.roll.map((r) => `
    <tr>
      <td>${escapeHtml(r.name)}</td>
      <td>${r.class}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${r.checkIn || '—'}</td>
      <td>${r.method || '—'}</td>
      <td>
        ${canRecord && r.status === 'NOT_RECORDED' ? `
          ${r.fingerprintEnrolled
            ? `<button class="btn btn-sm btn-outline" data-checkin="${r.studentId}" data-method="FINGERPRINT">Fingerprint</button>`
            : `<span class="mono muted" style="font-size:10.5px" title="Enroll a fingerprint on this student's passport to enable this">No fingerprint</span>`}
          <button class="btn btn-sm btn-outline" data-checkin="${r.studentId}" data-method="MANUAL">Manual</button>
        ` : ''}
      </td>
    </tr>`).join('');

  const schoolSwitcher = schools.length > 1 ? `
    <select id="school-switch" style="max-width:260px">
      ${schools.map((s) => `<option value="${s.id}" ${s.id === schoolId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
    </select>` : '';

  container.innerHTML = `
    <div class="flex-between mb-16">
      <div class="grid grid-4" style="flex:1; margin-right:16px">
        ${statCard('Present', today.present, `${today.total} on roll`)}
        ${statCard('Absent', today.absent)}
        ${statCard('Not yet recorded', today.notRecorded)}
        ${statCard("Today's rate", today.rate + '%')}
      </div>
    </div>
    <div class="flex-between mb-16">
      ${schoolSwitcher}
      <div class="flex gap-8" style="align-items:center">
        ${canRecord ? `<button class="btn btn-gold btn-sm" id="bulk-manual-btn">Mark register manually</button>` : ''}
        <span class="mono muted" style="font-size:12px">${today.date}</span>
      </div>
    </div>
    ${card(`Daily register`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Check-in</th><th>Method</th><th>Action</th></tr></thead>
        <tbody id="reg-tbody">${rows || `<tr><td colspan="6">${emptyState('No students on roll')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;

  const bulkBtn = document.getElementById('bulk-manual-btn');
  if (bulkBtn) bulkBtn.addEventListener('click', () => openBulkManualModal(today.roll.filter((r) => r.status === 'NOT_RECORDED')));

  const switcher = document.getElementById('school-switch');
  if (switcher) switcher.addEventListener('change', (e) => { location.hash = `#/attendance?schoolId=${e.target.value}`; });

  container.querySelectorAll('[data-checkin]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn.dataset.method === 'FINGERPRINT') {
        openFingerprintCheckInModal(btn.dataset.checkin);
      } else {
        try {
          await Api.checkIn(btn.dataset.checkin, btn.dataset.method);
          toast('Attendance recorded', 'success');
          App.render();
        } catch (e) { toast(e.message, 'error'); }
      }
    });
  });
};

/** Live fingerprint verification at check-in: generates a fresh scan
 * server-side, visualizes it, and reports the actual match score against
 * the student's trained template rather than just accepting a click. */
/** Bulk manual attendance entry — the real alternative to fingerprint
 * check-in for whoever is eligible (Course Rep, House Master/Matron,
 * Teacher, Headmaster tier, or a delegated house monitor). Submits
 * through the same scoped endpoint as everything else; the backend is
 * the actual authority on who can mark whom, so a wider list here than
 * someone's real scope just means some rows come back honestly reported
 * as skipped, not silently mis-marked. */
function openBulkManualModal(notRecorded) {
  if (!notRecorded.length) {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Mark register manually</h3>
      ${emptyState('Everyone within your scope is already recorded for today — nothing left to mark. Come back tomorrow, or use this if a new student is admitted later today.')}
    `);
    return;
  }
  const m = modal(`
    <button class="close-x" onclick="closeModal(this)">✕</button>
    <h3>Mark register manually</h3>
    <p class="muted" style="font-size:12px; margin-bottom:14px">For anyone whose fingerprint isn't working, or when manual entry is simply preferred. Only students within your own scope (class, house, or school, depending on your role) will actually be recorded.</p>
    <form id="bulk-manual-form">
      <div class="table-wrap" style="max-height:360px; overflow-y:auto">
        <table class="ledger">
          <thead><tr><th>Student</th><th>Class</th><th>Status</th></tr></thead>
          <tbody>
            ${notRecorded.map((r) => `
              <tr>
                <td>${escapeHtml(r.name)}</td><td>${r.class}</td>
                <td>
                  <select name="status-${r.studentId}" data-student="${r.studentId}">
                    <option value="">Skip</option>
                    <option value="PRESENT" selected>Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <button class="btn btn-gold mt-16" type="submit" style="width:100%">Submit register</button>
    </form>
    <div id="bulk-manual-result" class="mt-16"></div>
  `);
  onForm('bulk-manual-form', async () => {
    const records = notRecorded
      .map((r) => {
        const select = document.querySelector(`[data-student="${r.studentId}"]`);
        return select && select.value ? { studentId: r.studentId, status: select.value } : null;
      })
      .filter(Boolean);
    if (!records.length) { toast('Nothing selected to submit', 'error'); return; }
    try {
      const result = await Api.manualRegister(records);
      document.getElementById('bulk-manual-result').innerHTML = `
        <div class="card" style="background:var(--green-ok-pale)">
          <strong style="font-size:13px">${result.created} recorded</strong>
          ${result.skippedOutOfScope ? `<div class="muted mt-8" style="font-size:11.5px">${result.skippedOutOfScope} student(s) were outside your scope and were not recorded.</div>` : ''}
        </div>`;
      toast(`${result.created} student(s) recorded`, 'success');
      setTimeout(() => { m.remove(); App.render(); }, 1200);
    } catch (err) { toast(err.message, 'error'); }
  });
}

function openFingerprintCheckInModal(studentId) {
  const m = modal(`
    <button class="close-x" onclick="closeModal(this)">✕</button>
    <h3>Fingerprint check-in</h3>
    <div class="fp-pad-wrap">
      <div class="fp-pad scanning" id="fp-ci-pad">${fingerprintSVG([], { dim: true })}</div>
    </div>
    <div id="fp-ci-status" class="muted" style="font-size:12.5px; text-align:center; margin:12px 0">Scanning…</div>
    <div id="fp-ci-result"></div>
  `);

  const pad = m.querySelector('#fp-ci-pad');
  const status = m.querySelector('#fp-ci-status');
  const resultEl = m.querySelector('#fp-ci-result');

  async function attempt(simulateImposter) {
    pad.classList.add('scanning');
    status.textContent = 'Scanning…';
    resultEl.innerHTML = '';
    try {
      const record = await Api.checkIn(studentId, 'FINGERPRINT', simulateImposter);
      pad.classList.remove('scanning');
      const v = record.verification;
      status.textContent = '';
      resultEl.innerHTML = `
        <div class="card" style="background:var(--green-ok-pale); border-color:var(--green-ok)">
          <div class="flex-between"><strong>Match confirmed</strong>${badge(v.score + '% match', 'green')}</div>
          <div class="muted" style="font-size:11.5px; margin-top:6px">${v.matchedPoints}/${v.templatePoints} minutiae matched · threshold ${v.threshold}%</div>
        </div>`;
      toast('Attendance recorded', 'success');
      setTimeout(() => { m.remove(); App.render(); }, 1100);
    } catch (e) {
      pad.classList.remove('scanning');
      if (e.message.includes('did not match')) {
        status.textContent = '';
        resultEl.innerHTML = `
          <div class="card" style="background:var(--red-pale); border-color:var(--red)">
            <div class="flex-between"><strong>No match</strong>${badge('Rejected', 'red')}</div>
            <div class="muted" style="font-size:11.5px; margin-top:6px">Fingerprint did not match the enrolled template.</div>
          </div>
          <div class="flex gap-8 mt-16">
            <button class="btn btn-outline btn-sm" id="fp-ci-retry" style="flex:1">Scan again</button>
            <button class="btn btn-outline btn-sm" id="fp-ci-manual" style="flex:1">Use manual instead</button>
          </div>`;
        document.getElementById('fp-ci-retry').addEventListener('click', () => attempt(false));
        document.getElementById('fp-ci-manual').addEventListener('click', async () => {
          await Api.checkIn(studentId, 'MANUAL');
          toast('Attendance recorded manually', 'success');
          m.remove();
          App.render();
        });
      } else {
        status.textContent = '';
        resultEl.innerHTML = `<div class="login-error">${escapeHtml(e.message)}</div>`;
      }
    }
  }

  attempt(false);
}

// ---------------------------------------------------------------- PROMOTION
Pages.promotion = async function (container, ctx, studentId) {
  container.innerHTML = `<div class="section-title">Loading promotion engine…</div>`;

  if (!studentId) {
    // School-wide promotion queue
    let schoolId = ctx.user.school?.id;
    let students = [];
    try { students = await Api.students(schoolId ? { schoolId } : {}); } catch (e) { container.innerHTML = emptyState(e.message); return; }

    const rows = students.map((s) => `
      <tr style="cursor:pointer" onclick="location.hash='#/promotion/${s.id}'">
        <td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${s.attendanceRate !== null ? s.attendanceRate + '%' : '—'}</td>
        <td>${badge('Evaluate →', 'gold')}</td>
      </tr>`).join('');

    container.innerHTML = `
      ${card('Promotion, Repetition & Graduation Queue', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th></th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4">${emptyState('No students in scope')}</td></tr>`}</tbody>
        </table></div>
      `, 'Select a student to run the configurable rules engine')}
    `;
    return;
  }

  let student, rules, history;
  try {
    student = await Api.student(studentId);
    rules = await Api.promotionRules();
    history = await Api.promotionHistory(studentId);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  container.innerHTML = `
    <div class="crumbs"><a href="#/promotion">Promotion queue</a> / ${escapeHtml(student.name)}</div>
    <div class="grid grid-2">
      <div>
        ${card('Run evaluation', `
          <p class="muted" style="font-size:13px; margin-bottom:14px">Currently in <strong>${student.class}</strong> · Attendance ${student.attendanceRate ?? '—'}%</p>
          <form id="eval-form">
            <div class="field"><label>Academic score (continuous assessment + exam average, /100)</label><input name="academicScore" type="number" min="0" max="100" required /></div>
            <button class="btn btn-primary" type="submit" style="width:100%">Evaluate against national rules</button>
          </form>
          <div id="eval-result" class="mt-16"></div>
        `, `Min pass: ${rules.default.minAcademicScore} · Min attendance: ${rules.default.minAttendanceRate}%`)}
      </div>
      <div>
        ${card('Decision history', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Year</th><th>From</th><th>To</th><th>Outcome</th><th>By</th></tr></thead>
            <tbody>${history.map((h) => `
              <tr><td>${h.academicYear}</td><td>${h.fromClass}</td><td>${h.toClass}</td><td>${statusBadge(h.outcome)}</td><td>${escapeHtml(h.approvedBy)}</td></tr>
            `).join('') || `<tr><td colspan="5">${emptyState('No decisions recorded yet')}</td></tr>`}</tbody>
          </table></div>
        `)}
      </div>
    </div>
  `;

  onForm('eval-form', async (data) => {
    const result = await Api.evaluatePromotion(studentId, Number(data.academicScore));
    const resultEl = document.getElementById('eval-result');
    resultEl.innerHTML = `
      <div class="card" style="background:var(--surface-2)">
        <div class="flex-between mb-8"><strong>Recommended outcome</strong>${statusBadge(result.outcome)}</div>
        ${result.reasons.length ? `<ul style="margin:0; padding-left:18px; font-size:13px">${result.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : '<p class="muted" style="font-size:13px">Meets all criteria.</p>'}
        ${ctx.canAdmit ? `<button class="btn btn-gold mt-16" id="commit-btn" style="width:100%">Approve &amp; commit decision</button>` : ''}
      </div>
    `;
    const commitBtn = document.getElementById('commit-btn');
    if (commitBtn) commitBtn.addEventListener('click', async () => {
      await Api.decidePromotion(studentId, { outcome: result.outcome, academicScore: Number(data.academicScore) });
      toast('Promotion decision committed', 'success');
      App.render();
    });
  });
};

// ---------------------------------------------------------------- TRANSFERS
Pages.transfers = async function (container, ctx, newForStudentId) {
  container.innerHTML = `<div class="section-title">Loading transfers…</div>`;
  let transfers, schools;
  try {
    transfers = await Api.transfers();
    schools = await Api.schools();
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const STEP_LABELS = {
    CLASS_TEACHER: 'Class Teacher', HEADMASTER: 'Headmaster',
    SENDING_HEADMASTER: 'Sending Headmaster', RECEIVING_HEADMASTER: 'Receiving Headmaster',
    CIRCUIT_SUPERVISOR: 'Circuit Supervisor',
    DISTRICT_DIRECTOR_SENDING: 'District Director (Sending)', DISTRICT_DIRECTOR_RECEIVING: 'District Director (Receiving)',
    REGIONAL_DIRECTOR: 'Regional Director',
    REGIONAL_DIRECTOR_SENDING: 'Regional Director (Sending)', REGIONAL_DIRECTOR_RECEIVING: 'Regional Director (Receiving)',
    GES_HEADQUARTERS: 'GES Headquarters',
  };
  const schoolName = (id) => schools.find((s) => s.id === id)?.name || id;

  const rows = transfers.map((t) => `
    <tr style="cursor:pointer" onclick="Pages.showTransfer('${t.id}')">
      <td>${escapeHtml(schoolName(t.fromSchoolId))} → ${escapeHtml(schoolName(t.toSchoolId))}</td>
      <td>${t.approvalChain.length} step chain</td>
      <td>${t.approvals.length}/${t.approvalChain.length} approved</td>
      <td>${statusBadge(t.status)}</td>
      <td class="mono muted" style="font-size:11px">${fmtDate(t.submittedAt)}</td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="flex-between mb-16">
      <div></div>
      ${ctx.canAdmit ? `<button class="btn btn-gold" id="new-transfer-btn">+ Initiate transfer</button>` : ''}
    </div>
    ${card(`Transfers (${transfers.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Route</th><th>Chain</th><th>Progress</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">${emptyState('No transfers yet')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;

  window.Pages = Pages; // ensure global access for inline onclick

  Pages.showTransfer = async function (id) {
    const t = await Api.transfer(id);
    const stepsHtml = t.approvalChain.map((step, i) => {
      const approval = t.approvals[i];
      const cls = approval ? (approval.decision === 'REJECT' ? 'rejected' : 'done') : (i === t.approvals.length ? 'current' : '');
      return `<div class="approval-step ${cls}">
        <span class="step-dot"></span>
        <span>${STEP_LABELS[step] || step}${approval ? ` — ${escapeHtml(approval.by)} (${fmtDate(approval.at)})` : ''}</span>
      </div>`;
    }).join('');

    const nextStep = t.approvalChain[t.approvals.length];
    const canApprove = ctx.approvalRoleMatch && nextStep && (t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW');

    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>${escapeHtml(schoolName(t.fromSchoolId))} → ${escapeHtml(schoolName(t.toSchoolId))}</h3>
      <p class="muted" style="font-size:12.5px">${escapeHtml(t.reason || 'No reason provided')}</p>
      <hr class="divider" />
      <div>${stepsHtml}</div>
      ${t.status === 'REJECTED' ? `<div class="mt-16">${badge('Rejected', 'red')}</div>` : ''}
      ${t.status === 'COMPLETED' ? `<div class="mt-16">${badge('Transfer completed', 'green')}</div>` : ''}
      ${nextStep && t.status !== 'REJECTED' && t.status !== 'COMPLETED' ? `
        <hr class="divider" />
        <p style="font-size:12.5px" class="muted">Next required approval: <strong>${STEP_LABELS[nextStep]}</strong></p>
        <form id="approve-form">
          <div class="field"><label>Comment (optional)</label><input name="comment" /></div>
          <div class="flex gap-8">
            <button type="submit" name="decision" value="APPROVE" class="btn btn-primary" style="flex:1">Approve step</button>
            <button type="submit" name="decision" value="REJECT" class="btn btn-danger" style="flex:1">Reject</button>
          </div>
        </form>
      ` : ''}
    `);

    const form = document.getElementById('approve-form');
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const decision = e.submitter.value;
      const comment = form.comment.value;
      try {
        await Api.approveTransfer(id, decision, comment);
        toast(`Step ${decision === 'APPROVE' ? 'approved' : 'rejected'}`, decision === 'APPROVE' ? 'success' : 'error');
        m.remove();
        App.render();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  const newBtn = document.getElementById('new-transfer-btn');
  if (newBtn || newForStudentId) {
    const openForm = async () => {
      let students = [];
      try { students = await Api.students(); } catch {}
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>Initiate student transfer</h3>
        <form id="transfer-form">
          <div class="field"><label>Student</label>
            <select name="studentId">${students.map((s) => `<option value="${s.id}" ${s.id === newForStudentId ? 'selected' : ''}>${escapeHtml(s.name)} (${s.class})</option>`).join('')}</select>
          </div>
          <div class="field"><label>Destination school</label>
            <select name="toSchoolId">${schools.map((s) => `<option value="${s.id}">${escapeHtml(s.name)} — ${s.region}/${s.district.replace(/_/g,' ')}</option>`).join('')}</select>
          </div>
          <div class="field"><label>Reason</label><textarea name="reason" rows="2"></textarea></div>
          <button type="submit" class="btn btn-primary" style="width:100%">Submit transfer request</button>
        </form>
      `);
      onForm('transfer-form', async (data) => {
        await Api.createTransfer(data.studentId, data.toSchoolId, data.reason);
        toast('Transfer submitted for approval', 'success');
        m.remove();
        App.render();
      });
    };
    if (newBtn) newBtn.addEventListener('click', openForm);
    if (newForStudentId) openForm();
  }
};

// ---------------------------------------------------------------- TEACHERS
Pages.teachers = async function (container, ctx) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const schoolId = params.get('schoolId') || '';
  container.innerHTML = `<div class="section-title">Loading teachers…</div>`;
  let teachers;
  try { teachers = await Api.teachers(schoolId); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const rows = teachers.map((t) => `
    <tr style="cursor:pointer" onclick="location.hash='#/teachers/detail/${t.id}'">
      <td>${escapeHtml(t.name)}</td>
      <td class="mono" style="font-size:11.5px">${t.staffId}</td>
      <td>${escapeHtml(t.subject)}</td>
      <td>${fmtDate(t.employmentDate)}</td>
      <td>${t.punctualityRate !== null ? t.punctualityRate + '%' : '—'}</td>
      <td>${statusBadge(t.status)}</td>
    </tr>`).join('');

  container.innerHTML = `
    ${card(`Teaching staff (${teachers.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Name</th><th>Staff ID</th><th>Subject</th><th>Employed</th><th>Punctuality</th><th>Status</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6">${emptyState('No teachers found')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;
};

Pages.teacherDetail = async function (container, ctx, teacherId) {
  container.innerHTML = `<div class="section-title">Loading teacher record…</div>`;
  let t;
  try { t = await Api.teacher(teacherId); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const attRows = t.attendanceHistory.slice(0, 10).map((a) => `
    <tr><td>${fmtDate(a.date)}</td><td>${a.clockIn || '—'}</td><td>${a.clockOut || '—'}</td><td>${statusBadge(a.status)}</td></tr>
  `).join('');

  const planRows = t.lessonPlans.slice(0, 10).map((p) => `
    <tr><td>${escapeHtml(p.topic)}</td><td>${p.class || '—'}</td><td>${p.syllabusCoveragePercent !== null ? p.syllabusCoveragePercent + '%' : '—'}</td><td class="mono muted" style="font-size:11px">${fmtDate(p.submittedAt)}</td></tr>
  `).join('');

  container.innerHTML = `
    <div class="crumbs"><a href="#/teachers">Teachers</a> / ${escapeHtml(t.name)}</div>
    <div class="card mb-16">
      <div class="flex-between">
        <div><h2>${escapeHtml(t.name)}</h2><div class="mono muted" style="font-size:12px">${t.staffId}</div></div>
        ${statusBadge(t.status)}
      </div>
      <hr class="divider" />
      <div class="grid grid-4">
        <div><label>Subject</label><div>${escapeHtml(t.subject)}</div></div>
        <div><label>Phone</label><div>${escapeHtml(t.phone)}</div></div>
        <div><label>Employed since</label><div>${fmtDate(t.employmentDate)}</div></div>
        <div><label>Punctuality</label><div>${t.punctualityRate ?? '—'}</div></div>
      </div>
      ${ctx.canAdmit ? `<hr class="divider"/>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" id="add-plan-btn">Submit lesson plan / syllabus update</button>
        ${t.userId ? `<button class="btn btn-outline btn-sm" id="assign-coordination-btn">Assign coordination role</button>` : ''}
      </div>
      <div id="teacher-appointments" class="mt-8"></div>` : ''}
    </div>
    <div class="grid grid-2">
      <div>${card('Clock-in history', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Status</th></tr></thead>
          <tbody>${attRows || `<tr><td colspan="4">${emptyState('No records')}</td></tr>`}</tbody>
        </table></div>
      `)}</div>
      <div>${card('Lesson plans / syllabus coverage', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Topic</th><th>Class</th><th>Coverage</th><th>Date</th></tr></thead>
          <tbody>${planRows || `<tr><td colspan="4">${emptyState('No lesson plans submitted')}</td></tr>`}</tbody>
        </table></div>
      `)}</div>
    </div>
  `;

  const addPlanBtn = document.getElementById('add-plan-btn');
  if (addPlanBtn) addPlanBtn.addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Submit lesson plan</h3>
      <form id="plan-form">
        <div class="field"><label>Topic</label><input name="topic" required /></div>
        <div class="field-row">
          <div class="field"><label>Class</label><input name="class" /></div>
          <div class="field"><label>Week</label><input name="week" /></div>
        </div>
        <div class="field"><label>Syllabus coverage (%)</label><input name="syllabusCoveragePercent" type="number" min="0" max="100" /></div>
        <div class="field"><label>Notes</label><textarea name="notes" rows="2"></textarea></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Submit</button>
      </form>
    `);
    onForm('plan-form', async (data) => {
      await Api.submitLessonPlan(teacherId, { ...data, syllabusCoveragePercent: data.syllabusCoveragePercent ? Number(data.syllabusCoveragePercent) : null });
      toast('Lesson plan submitted', 'success');
      m.remove();
      App.render();
    });
  });

  const teacherApptsHolder = document.getElementById('teacher-appointments');
  const TEACHER_COORDINATION_ROLES = ['DEPARTMENT_HEAD', 'SUBJECT_COORDINATOR', 'FORM_MASTER', 'HOUSE_MASTER', 'MATRON', 'SENIOR_HOUSE_MASTER', 'BOARDING_COORDINATOR', 'SPORTS_COORDINATOR'];
  if (teacherApptsHolder && t.userId) {
    Api.schoolAppointments(t.schoolId).then((all) => {
      const mine = all.filter((a) => a.studentOrTeacherId === t.id && a.active);
      teacherApptsHolder.innerHTML = mine.length
        ? mine.map((a) => `
          <span class="badge badge-gold" style="margin-right:6px">${escapeHtml(ROLE_LABELS[a.role] || a.role)}
            <button class="revoke-x" data-revoke="${a.id}" title="Revoke">✕</button>
          </span>`).join('')
        : '';
      teacherApptsHolder.querySelectorAll('[data-revoke]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await Api.revokeAppointment(btn.dataset.revoke);
          toast('Appointment revoked', 'success');
          App.render();
        });
      });
    });
  }

  const assignCoordBtn = document.getElementById('assign-coordination-btn');
  if (assignCoordBtn) assignCoordBtn.addEventListener('click', () => {
    // House Master, Matron, Senior House Master, and Boarding Coordinator
    // are boarding-house concepts — offering them at a Primary or JHS
    // day school just invites a Headmaster to appoint someone to a duty
    // that doesn't correspond to anything real at their school.
    const BOARDING_ONLY_ROLES = ['HOUSE_MASTER', 'MATRON', 'SENIOR_HOUSE_MASTER', 'BOARDING_COORDINATOR'];
    const schoolLevel = ctx.user.school?.level;
    const availableRoles = (schoolLevel === 'SHS')
      ? TEACHER_COORDINATION_ROLES
      : TEACHER_COORDINATION_ROLES.filter((r) => !BOARDING_ONLY_ROLES.includes(r));

    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Assign coordination role</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">
        ${escapeHtml(t.name)} keeps their normal teacher login — this adds a leadership title they can
        switch into from the "Viewing as" selector in their sidebar. Revoke it any time.
      </p>
      <form id="assign-appt-form">
        <div class="field"><label>Role</label>
          <select name="role" id="assign-appt-role">${availableRoles.map((r) => `<option value="${r}">${escapeHtml(ROLE_LABELS[r] || r)}</option>`).join('')}</select>
        </div>
        <div class="field" id="assign-appt-house-field" style="display:none">
          <label>House / dormitory</label>
          <input name="house" placeholder="e.g. Independence House" />
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%">Assign</button>
      </form>
    `);
    const roleSelect = document.getElementById('assign-appt-role');
    const houseField = document.getElementById('assign-appt-house-field');
    function toggleHouseField() {
      houseField.style.display = ['HOUSE_MASTER', 'MATRON'].includes(roleSelect.value) ? 'block' : 'none';
    }
    roleSelect.addEventListener('change', toggleHouseField);
    toggleHouseField();
    onForm('assign-appt-form', async (data) => {
      await Api.assignAppointment(t.userId, data.role, null, data.house);
      toast('Coordination role assigned', 'success');
      m.remove();
      App.render();
    });
  });
};

// ---------------------------------------------------------------- INFRASTRUCTURE & ASSETS
const ASSET_CATEGORY_LABELS = {
  BUILDING: 'Buildings', FURNITURE: 'Furniture', ICT_EQUIPMENT: 'ICT Equipment',
  LABORATORY: 'Laboratories', LIBRARY: 'Library', WATER_SANITATION: 'Water & Sanitation', OTHER: 'Other',
};
const CONDITION_BADGE = { GOOD: 'green', FAIR: 'gold', POOR: 'red', NEEDS_REPLACEMENT: 'red' };
const PRIORITY_BADGE = { LOW: 'grey', MEDIUM: 'gold', HIGH: 'red', URGENT: 'red' };

Pages.infrastructure = async function (container, ctx) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  let schoolId = params.get('schoolId') || ctx.user.school?.id || '';
  container.innerHTML = `<div class="section-title">Loading infrastructure & assets…</div>`;

  let schools = [];
  if (!schoolId) {
    try { schools = await Api.schools(); schoolId = schools[0]?.id; } catch (e) { container.innerHTML = emptyState(e.message); return; }
  }
  if (!schoolId) { container.innerHTML = emptyState('No school in scope.'); return; }

  let assets, maintenance, summary;
  try {
    [assets, maintenance, summary] = await Promise.all([
      Api.assets(schoolId), Api.maintenanceRequests(schoolId), Api.infrastructureSummary(schoolId),
    ]);
    if (!schools.length) schools = await Api.schools();
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  let tab = 'assets';

  function renderBody() {
    if (tab === 'assets') {
      const rows = assets.map((a) => `
        <tr>
          <td>${escapeHtml(a.name)}</td>
          <td>${ASSET_CATEGORY_LABELS[a.category] || a.category}</td>
          <td>${a.quantity}</td>
          <td>${badge(a.condition.replace(/_/g, ' '), CONDITION_BADGE[a.condition] || 'grey')}</td>
          <td class="mono muted" style="font-size:11px">${fmtDate(a.createdAt)}</td>
        </tr>`).join('');
      return `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Asset</th><th>Category</th><th>Qty</th><th>Condition</th><th>Registered</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5">${emptyState('No assets registered yet')}</td></tr>`}</tbody>
        </table></div>`;
    }
    const rows = maintenance.map((m) => `
      <tr>
        <td>${escapeHtml(m.title)}</td>
        <td>${badge(m.priority, PRIORITY_BADGE[m.priority] || 'grey')}</td>
        <td>${statusBadge(m.status)}</td>
        <td class="mono muted" style="font-size:11px">${fmtDate(m.raisedAt)}</td>
        <td>
          ${ctx.canAdmit && m.status !== 'RESOLVED' ? `
            <select data-maintenance-status="${m.id}" style="width:auto; padding:4px 8px; font-size:11.5px">
              <option value="">Update status…</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DEFERRED">Deferred</option>
            </select>` : ''}
        </td>
      </tr>`).join('');
    return `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Issue</th><th>Priority</th><th>Status</th><th>Raised</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">${emptyState('No maintenance requests')}</td></tr>`}</tbody>
      </table></div>`;
  }

  const schoolSwitcher = schools.length > 1 ? `
    <select id="infra-school-switch" style="max-width:260px">
      ${schools.map((s) => `<option value="${s.id}" ${s.id === schoolId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
    </select>` : '<div></div>';

  container.innerHTML = `
    <div class="grid grid-4 mb-16">
      ${statCard('Total assets', summary.totalAssets)}
      ${statCard('Needs attention', summary.poorCondition, 'Poor / needs replacement')}
      ${statCard('Open maintenance', summary.openMaintenance)}
      ${statCard('Urgent requests', summary.urgentMaintenance, '', summary.urgentMaintenance > 0 ? 'down' : '')}
    </div>
    <div class="flex-between mb-16">
      ${schoolSwitcher}
      <div class="flex gap-8">
        ${ctx.canAdmit ? `<button class="btn btn-outline btn-sm" id="add-maintenance-btn">+ Report issue</button>` : ''}
        ${ctx.canAdmit ? `<button class="btn btn-gold btn-sm" id="add-asset-btn">+ Register asset</button>` : ''}
      </div>
    </div>
    <div class="pill-tabs">
      <button class="pill-tab active" data-tab="assets">Asset register</button>
      <button class="pill-tab" data-tab="maintenance">Maintenance requests</button>
    </div>
    ${card('', renderBody())}
  `;

  function wireStatusSelects() {
    container.querySelectorAll('[data-maintenance-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        if (!sel.value) return;
        await Api.updateMaintenanceStatus(sel.dataset.maintenanceStatus, sel.value);
        toast('Status updated', 'success');
        App.render();
      });
    });
  }
  wireStatusSelects();

  container.querySelectorAll('.pill-tabs .pill-tab').forEach((t) => {
    t.addEventListener('click', () => {
      tab = t.dataset.tab;
      container.querySelectorAll('.pill-tabs .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
      container.querySelector('.card').innerHTML = renderBody();
      wireStatusSelects();
    });
  });

  const switcher = document.getElementById('infra-school-switch');
  if (switcher) switcher.addEventListener('change', (e) => { location.hash = `#/infrastructure?schoolId=${e.target.value}`; });

  const addAssetBtn = document.getElementById('add-asset-btn');
  if (addAssetBtn) addAssetBtn.addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Register asset</h3>
      <form id="asset-form">
        <div class="field"><label>Name</label><input name="name" placeholder="e.g. Classroom desks, Water tank" required /></div>
        <div class="field-row">
          <div class="field"><label>Category</label>
            <select name="category">${Object.entries(ASSET_CATEGORY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
          </div>
          <div class="field"><label>Quantity</label><input name="quantity" type="number" min="1" value="1" /></div>
        </div>
        <div class="field"><label>Condition</label>
          <select name="condition"><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="POOR">Poor</option><option value="NEEDS_REPLACEMENT">Needs replacement</option></select>
        </div>
        <div class="field"><label>Notes</label><textarea name="notes" rows="2"></textarea></div>
        <input type="hidden" name="schoolId" value="${schoolId}" />
        <button class="btn btn-primary" type="submit" style="width:100%">Register</button>
      </form>
    `);
    onForm('asset-form', async (data) => {
      await Api.createAsset(data);
      toast('Asset registered', 'success');
      m.remove();
      App.render();
    });
  });

  const addMaintBtn = document.getElementById('add-maintenance-btn');
  if (addMaintBtn) addMaintBtn.addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Report maintenance issue</h3>
      <form id="maint-form">
        <div class="field"><label>Title</label><input name="title" placeholder="e.g. Leaking roof in JHS2 block" required /></div>
        <div class="field"><label>Description</label><textarea name="description" rows="3"></textarea></div>
        <div class="field"><label>Priority</label>
          <select name="priority"><option value="LOW">Low</option><option value="MEDIUM" selected>Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>
        </div>
        <input type="hidden" name="schoolId" value="${schoolId}" />
        <button class="btn btn-primary" type="submit" style="width:100%">Submit report</button>
      </form>
    `);
    onForm('maint-form', async (data) => {
      await Api.createMaintenanceRequest(data);
      toast('Maintenance request submitted', 'success');
      m.remove();
      App.render();
    });
  });
};

// ---------------------------------------------------------------- INSPECTIONS
Pages.inspections = async function (container, ctx) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const schoolId = params.get('schoolId') || '';
  container.innerHTML = `<div class="section-title">Loading inspections…</div>`;
  let inspections, schools;
  try {
    inspections = await Api.inspections(schoolId);
    schools = ctx.canInspect ? await Api.schools() : [];
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const rows = inspections.map((i) => `
    <tr><td>${badge(i.area, 'grey')}</td><td>${i.overallScore ?? '—'}/100</td><td>${escapeHtml(i.inspector)}</td>
      <td class="mono muted" style="font-size:11px">${fmtDateTime(i.conductedAt)}</td>
      <td>${escapeHtml((i.findings || '').slice(0, 60))}${(i.findings || '').length > 60 ? '…' : ''}</td></tr>
  `).join('');

  container.innerHTML = `
    <div class="flex-between mb-16">
      <div></div>
      ${ctx.canInspect ? `<button class="btn btn-gold" id="new-inspection-btn">+ New inspection</button>` : ''}
    </div>
    ${card(`Inspection records (${inspections.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Area</th><th>Score</th><th>Inspector</th><th>Date</th><th>Findings</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">${emptyState('No inspections recorded')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;

  const newBtn = document.getElementById('new-inspection-btn');
  if (newBtn) newBtn.addEventListener('click', () => {
    const criteriaByArea = {
      ACADEMIC: ['Lesson observation', 'Teaching quality', 'Curriculum coverage', 'Student engagement'],
      ADMINISTRATION: ['Record keeping', 'Attendance compliance', 'Policy implementation'],
      INFRASTRUCTURE: ['Buildings', 'Furniture', 'Water & sanitation', 'Safety'],
    };
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>New inspection</h3>
      <form id="inspection-form">
        <div class="field"><label>School</label>
          <select name="schoolId">${schools.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Area</label>
          <select name="area" id="area-select">
            <option value="ACADEMIC">Academic</option><option value="ADMINISTRATION">Administration</option><option value="INFRASTRUCTURE">Infrastructure</option>
          </select>
        </div>
        <div id="criteria-fields"></div>
        <div class="field"><label>Findings</label><textarea name="findings" rows="3"></textarea></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Submit inspection (digitally signed)</button>
      </form>
    `);
    const criteriaDiv = document.getElementById('criteria-fields');
    const areaSelect = document.getElementById('area-select');
    function renderCriteria() {
      const list = criteriaByArea[areaSelect.value];
      criteriaDiv.innerHTML = list.map((c) => `
        <div class="field"><label>${c} (1-5)</label><input name="score_${c.replace(/\s+/g,'_')}" type="number" min="1" max="5" required /></div>
      `).join('');
    }
    renderCriteria();
    areaSelect.addEventListener('change', renderCriteria);

    onForm('inspection-form', async (data) => {
      const scores = {};
      Object.entries(data).forEach(([k, v]) => { if (k.startsWith('score_')) scores[k.slice(6)] = Number(v); });
      await Api.createInspection({ schoolId: data.schoolId, area: data.area, scores, findings: data.findings });
      toast('Inspection recorded', 'success');
      m.remove();
      App.render();
    });
  });
};

// ---------------------------------------------------------------- GIS MAPPING
const GIS_PROJECTION = { lngMin: -3.6, lngMax: 1.6, latMin: 4.4, latMax: 11.6, width: 440, height: 560 };
function projectGis(lat, lng) {
  const { lngMin, lngMax, latMin, latMax, width, height } = GIS_PROJECTION;
  return {
    x: ((lng - lngMin) / (lngMax - lngMin)) * width,
    y: ((latMax - lat) / (latMax - latMin)) * height,
  };
}

Pages.gis = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading national map…</div>`;
  let points;
  try { points = await Api.dashboardGis(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const MODES = {
    attendance: {
      label: 'Attendance',
      color: (p) => p.attendanceRate === null ? '#b7bcae' : p.attendanceRate >= 85 ? '#2f6b3f' : p.attendanceRate >= 70 ? '#d7a83e' : '#9c2b2b',
      legend: [['≥ 85%', '#2f6b3f'], ['70–84%', '#d7a83e'], ['< 70%', '#9c2b2b'], ['No data', '#b7bcae']],
    },
    inspection: {
      label: 'Inspection coverage',
      color: (p) => p.inspectionCount === 0 ? '#9c2b2b' : p.inspectionCount < 2 ? '#d7a83e' : '#2f6b3f',
      legend: [['2+ inspections', '#2f6b3f'], ['1 inspection', '#d7a83e'], ['Not yet inspected', '#9c2b2b']],
    },
    infrastructure: {
      label: 'Infrastructure gaps',
      color: (p) => p.infrastructureGap ? '#9c2b2b' : p.infrastructureScore !== null ? '#2f6b3f' : '#b7bcae',
      legend: [['Gap flagged (< 60/100)', '#9c2b2b'], ['Adequate', '#2f6b3f'], ['Not assessed', '#b7bcae']],
    },
    density: {
      label: 'Enrollment density',
      color: () => '#0b3d2e',
      legend: [['Circle size = enrolled students', '#0b3d2e']],
    },
  };

  let mode = 'attendance';

  function renderMap() {
    const maxStudents = Math.max(1, ...points.map((p) => p.studentCount));
    const cfg = MODES[mode];
    const dots = points.map((p) => {
      const { x, y } = projectGis(p.lat, p.lng);
      const r = 3 + (p.studentCount / maxStudents) * 9;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${cfg.color(p)}" fill-opacity="0.78" stroke="#fff" stroke-width="1" style="cursor:pointer" data-school="${p.schoolId}"><title>${escapeHtml(p.name)} — ${p.studentCount} students${p.attendanceRate !== null ? ' · ' + p.attendanceRate + '% attendance' : ''}</title></circle>`;
    }).join('');

    return `
      <div class="gis-wrap">
        <svg viewBox="0 0 ${GIS_PROJECTION.width} ${GIS_PROJECTION.height}" class="gis-svg">
          <rect x="0" y="0" width="${GIS_PROJECTION.width}" height="${GIS_PROJECTION.height}" fill="var(--surface-2)" rx="10" />
          ${gisGridLines()}
          ${dots}
        </svg>
        <div class="gis-legend">
          <div class="gis-legend-title">${cfg.label}</div>
          ${cfg.legend.map(([label, color]) => `
            <div class="gis-legend-row"><span class="gis-legend-dot" style="background:${color}"></span>${escapeHtml(label)}</div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function gisGridLines() {
    // Faint reference lines only — this is a schematic proportional map
    // (points positioned by real lat/lng), not a literal coastline trace.
    let lines = '';
    for (let i = 1; i < 4; i++) {
      const y = (GIS_PROJECTION.height / 4) * i;
      lines += `<line x1="0" y1="${y}" x2="${GIS_PROJECTION.width}" y2="${y}" stroke="var(--paper-line)" stroke-width="1" />`;
    }
    return lines;
  }

  container.innerHTML = `
    <div class="flex-between mb-16">
      <div class="pill-tabs" id="gis-mode-tabs">
        ${Object.entries(MODES).map(([key, m]) => `<button class="pill-tab ${key === mode ? 'active' : ''}" data-mode="${key}">${m.label}</button>`).join('')}
      </div>
      <span class="mono muted" style="font-size:11px">${points.length} schools plotted</span>
    </div>
    ${card('National school map', renderMap(), 'Schematic proportional map — positioned by each school\'s real region coordinates')}
  `;

  function wireSchoolDots() {
    container.querySelectorAll('[data-school]').forEach((el) => {
      el.addEventListener('click', () => { location.hash = `#/schools/${el.dataset.school}`; });
    });
  }
  wireSchoolDots();

  container.querySelectorAll('#gis-mode-tabs .pill-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode;
      container.querySelectorAll('#gis-mode-tabs .pill-tab').forEach((t) => t.classList.toggle('active', t === tab));
      container.querySelector('.card').outerHTML = card('National school map', renderMap(), 'Schematic proportional map — positioned by each school\'s real region coordinates');
      wireSchoolDots();
    });
  });
};


Pages.ai = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Running education intelligence…</div>`;
  let dropout, teacherRisk, struggling, forecast;
  try {
    [dropout, teacherRisk, struggling, forecast] = await Promise.all([
      Api.aiDropoutRisk(), Api.aiTeacherAbsenteeism(), Api.aiStrugglingSchools(), Api.aiEnrollmentForecast(),
    ]);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  container.innerHTML = `
    <div class="card mb-16" style="background:var(--surface-2)">
      <p style="font-size:12.5px; margin:0" class="muted">
        These insights are produced by <strong>transparent, rule-based heuristics</strong> over NSEMAS's own attendance,
        inspection, and behaviour data — not a trained predictive model. Every score below can be traced to the exact
        factors listed, which matters for a government accountability system.
      </p>
    </div>
    <div class="grid grid-2">
      <div>
        ${card('Dropout risk — students', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Student</th><th>Class</th><th>Risk</th><th>Factors</th></tr></thead>
            <tbody>${dropout.students.slice(0, 12).map((s) => `
              <tr><td>${escapeHtml(s.name)}</td><td>${s.class}</td><td>${riskBar(s.riskScore)}</td>
              <td style="font-size:11.5px" class="muted">${s.factors.join('; ')}</td></tr>
            `).join('') || `<tr><td colspan="4">${emptyState('No elevated risk detected')}</td></tr>`}</tbody>
          </table></div>
        `)}
      </div>
      <div>
        ${card('Struggling schools', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>School</th><th>Region</th><th>Concern</th><th>Reasons</th></tr></thead>
            <tbody>${struggling.schools.slice(0, 12).map((s) => `
              <tr><td>${escapeHtml(s.name)}</td><td>${s.region}</td><td>${riskBar(s.concernScore)}</td>
              <td style="font-size:11.5px" class="muted">${s.reasons.join('; ')}</td></tr>
            `).join('') || `<tr><td colspan="4">${emptyState('No struggling schools flagged')}</td></tr>`}</tbody>
          </table></div>
        `)}
        <div class="mt-16">
        ${card('Teacher absenteeism flags', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Teacher ID</th><th>Late rate</th><th>Records</th></tr></thead>
            <tbody>${teacherRisk.flagged.slice(0, 10).map((t) => `
              <tr><td class="mono" style="font-size:11px">${t.teacherId.slice(0,8)}</td><td>${t.lateRate}%</td><td>${t.total}</td></tr>
            `).join('') || `<tr><td colspan="3">${emptyState('No teachers flagged')}</td></tr>`}</tbody>
          </table></div>
        `)}
        </div>
        <div class="mt-16">
        ${card('Enrollment forecast', `
          <div class="flex-between mb-8"><span class="muted">Projected admissions, ${forecast.forecast.year}</span><strong style="font-family:var(--font-display); font-size:22px">${forecast.forecast.projectedAdmissions}</strong></div>
          <div class="muted" style="font-size:11.5px">Based on linear trend across ${forecast.historical.length} recorded year(s), ${forecast.schoolsInScope} school(s) in scope.</div>
        `)}
        </div>
      </div>
    </div>
  `;
};

// ---------------------------------------------------------------- ANNOUNCEMENTS
Pages.announcements = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading announcements…</div>`;
  let list;
  try { list = await Api.announcements(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  container.innerHTML = `
    <div class="flex-between mb-16">
      <div></div>
      ${ctx.canAnnounce ? `<button class="btn btn-gold" id="new-ann-btn">+ New announcement</button>` : ''}
    </div>
    ${card(`Announcements (${list.length})`, list.map((a) => `
      <div class="mb-16">
        <div class="flex-between"><strong>${escapeHtml(a.title)}</strong><span class="mono muted" style="font-size:10.5px">${fmtDate(a.createdAt)}</span></div>
        <div style="font-size:13px; margin-top:4px">${escapeHtml(a.body)}</div>
        <div class="mono muted" style="font-size:10.5px; margin-top:4px">${escapeHtml(a.createdBy)} · audience: ${a.audience}</div>
      </div><hr class="divider"/>
    `).join('') || emptyState('No announcements'))}
  `;

  const btn = document.getElementById('new-ann-btn');
  if (btn) btn.addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>New announcement</h3>
      <form id="ann-form">
        <div class="field"><label>Title</label><input name="title" required /></div>
        <div class="field"><label>Body</label><textarea name="body" rows="4" required></textarea></div>
        <div class="field"><label>Audience</label>
          <select name="audience"><option value="ALL">Everyone</option><option value="HEADMASTER">Headmasters</option><option value="TEACHER">Teachers</option><option value="PARENT">Parents</option></select>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%">Publish</button>
      </form>
    `);
    onForm('ann-form', async (data) => {
      await Api.createAnnouncement(data);
      toast('Announcement published', 'success');
      m.remove();
      App.render();
    });
  });
};

// ---------------------------------------------------------------- PARENT / STUDENT PORTAL

// Student takes an objective exam — instant client-side selection, real
// server-side grading on submit (never trust a client-computed score).
async function openTakeExamModal(examId) {
  const questions = await Api.examQuestions(examId);
  if (!questions.length) { toast('This exam has no questions yet — check back later', 'error'); return; }
  const m = modal(`
    <button class="close-x" onclick="closeModal(this)">✕</button>
    <h3>Exam</h3>
    <p class="muted" style="font-size:12px; margin-bottom:16px">Answer every question, then submit. You can't retake once submitted.</p>
    <form id="take-exam-form">
      ${questions.map((q, i) => `
        <div class="mb-16">
          <strong style="font-size:13px">${i + 1}. ${escapeHtml(q.questionText)}</strong>
          <div class="mt-8">
            ${q.options.map((opt, oi) => `
              <label style="display:flex; align-items:center; gap:8px; font-weight:400; font-size:13px; margin-bottom:6px">
                <input type="radio" name="q_${q.id}" value="${oi}" required style="width:auto" /> ${escapeHtml(opt)}
              </label>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <button class="btn btn-primary" type="submit" style="width:100%">Submit exam</button>
    </form>
    <div id="take-exam-result" class="mt-16"></div>
  `);
  onForm('take-exam-form', async (data) => {
    const answers = questions.map((q) => ({ questionId: q.id, selectedOptionIndex: Number(data[`q_${q.id}`]) }));
    try {
      const result = await Api.submitExam(examId, answers);
      document.getElementById('take-exam-form').style.display = 'none';
      document.getElementById('take-exam-result').innerHTML = result.resultVisible
        ? `<div class="card" style="background:var(--green-ok-pale)"><strong>Submitted — you scored ${result.score}%</strong><div class="muted" style="font-size:12px; margin-top:4px">Grade ${result.grade} · ${escapeHtml(result.remark)}</div></div>`
        : `<div class="card" style="background:var(--gold-pale)"><strong>Submitted</strong><div class="muted" style="font-size:12px; margin-top:4px">Your teacher hasn't released results for this exam yet.</div></div>`;
      toast('Exam submitted', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ---------------------------------------------------------------- ACADEMICS (curriculum, timetable, exams, report cards)
const GRADE_BADGE = { 1: 'green', 2: 'green', 3: 'green', 4: 'gold', 5: 'gold', 6: 'gold', 7: 'gold', 8: 'grey', 9: 'red' };
const EXAM_TYPE_LABELS = {
  CONTINUOUS_ASSESSMENT: 'Continuous Assessment', MID_TERM: 'Mid-Term', END_OF_TERM: 'End of Term',
  MOCK: 'Mock Exam', BECE: 'BECE', WASSCE: 'WASSCE',
};

Pages.academics = async function (container, ctx) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  let schoolId = params.get('schoolId') || ctx.user.school?.id || '';
  container.innerHTML = `<div class="section-title">Loading curriculum &amp; exams…</div>`;

  let schools = [];
  if (!schoolId) {
    try { schools = await Api.schools(); schoolId = schools[0]?.id; } catch (e) { container.innerHTML = emptyState(e.message); return; }
  }
  if (!schoolId) { container.innerHTML = emptyState('No school in scope.'); return; }

  let subjects, exams, students;
  try {
    [subjects, exams, students] = await Promise.all([
      Api.subjects(), Api.exams(schoolId), Api.students({ schoolId }),
    ]);
    if (!schools.length) schools = await Api.schools();
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const classes = [...new Set(students.map((s) => s.class))].sort();
  let tab = 'timetable';
  let selectedClass = classes[0] || '';

  async function loadTimetable() {
    return Api.timetable(schoolId, selectedClass);
  }

  async function renderBody() {
    const bodyEl = document.getElementById('academics-body');
    if (!bodyEl) return;

    if (tab === 'timetable') {
      const tt = await loadTimetable();
      const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
      const periods = [1, 2, 3, 4, 5, 6, 7, 8];
      const grid = {};
      tt.forEach((t) => { grid[`${t.day}-${t.period}`] = t; });
      const maxPeriod = Math.max(3, ...tt.map((t) => t.period), 0);

      bodyEl.innerHTML = `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Period</th>${DAYS.map((d) => `<th>${d}</th>`).join('')}</tr></thead>
          <tbody>
            ${periods.slice(0, maxPeriod).map((p) => `
              <tr><td class="mono">${p}</td>
                ${DAYS.map((d) => {
                  const entry = grid[`${d}-${p}`];
                  return `<td>${entry ? `<div style="font-size:12.5px">${escapeHtml(entry.subject)}</div>${entry.startTime ? `<div class="mono muted" style="font-size:10px">${entry.startTime}-${entry.endTime}</div>` : ''}` : '<span class="muted" style="font-size:11px">—</span>'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table></div>
      `;
    } else if (tab === 'exams') {
      const classExams = exams.filter((e) => e.class === selectedClass);
      bodyEl.innerHTML = `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Exam</th><th>Subject</th><th>Type</th><th>Format</th><th>Date</th><th>Max</th><th></th></tr></thead>
          <tbody>${classExams.map((e) => `
            <tr>
              <td>${escapeHtml(e.name)}</td><td>${escapeHtml(e.subject)}</td>
              <td>${badge(EXAM_TYPE_LABELS[e.examType] || e.examType, 'grey')}</td>
              <td>${e.format === 'OBJECTIVE' ? badge('Objective · auto-graded', 'gold') : badge('Written', 'grey')}</td>
              <td>${fmtDate(e.date)}</td><td>${e.maxScore}</td>
              <td class="flex gap-8">
                ${e.format === 'OBJECTIVE' ? `<button class="btn btn-sm btn-outline" data-questions="${e.id}">Questions</button>` : ''}
                <button class="btn btn-sm btn-outline" data-exam="${e.id}">${e.format === 'OBJECTIVE' ? 'Results' : 'Enter/view scores'}</button>
              </td>
            </tr>
          `).join('') || `<tr><td colspan="7">${emptyState('No exams recorded for this class')}</td></tr>`}</tbody>
        </table></div>
      `;
      bodyEl.querySelectorAll('[data-exam]').forEach((btn) => {
        btn.addEventListener('click', () => openExamScoresModal(btn.dataset.exam));
      });
      bodyEl.querySelectorAll('[data-questions]').forEach((btn) => {
        btn.addEventListener('click', () => { location.hash = `#/academics/exam/${btn.dataset.questions}/questions`; });
      });
    } else if (tab === 'reportcards') {
      const classStudents = students.filter((s) => s.class === selectedClass);
      bodyEl.innerHTML = `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Student</th><th></th></tr></thead>
          <tbody>${classStudents.map((s) => `
            <tr><td>${escapeHtml(s.name)}</td><td><button class="btn btn-sm btn-outline" data-reportcard="${s.id}">View report card</button></td></tr>
          `).join('') || `<tr><td colspan="2">${emptyState('No students in this class')}</td></tr>`}</tbody>
        </table></div>
      `;
      bodyEl.querySelectorAll('[data-reportcard]').forEach((btn) => {
        btn.addEventListener('click', () => openReportCardModal(btn.dataset.reportcard));
      });
    } else if (tab === 'subjects') {
      bodyEl.innerHTML = `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Subject</th><th>Code</th><th>Level</th><th>Category</th></tr></thead>
          <tbody>${subjects.map((s) => `
            <tr><td>${escapeHtml(s.name)}</td><td class="mono">${s.code}</td><td>${s.level}</td><td>${badge(s.category, s.category === 'CORE' ? 'green' : 'gold')}</td></tr>
          `).join('')}</tbody>
        </table></div>
      `;
    } else if (tab === 'national') {
      const candidates = await Api.examCandidates({ schoolId });
      bodyEl.innerHTML = `
        <div class="card mb-16" style="background:var(--surface-2)">
          <p style="font-size:12px; margin:0" class="muted">
            Candidate registration assigns a real WAEC-format index number. "Sync" pulls any results the
            examination body has published for this school's registered candidates — a genuine reconciliation
            operation against a seeded feed standing in for WAEC's real results system, which isn't reachable
            from here. Verify an individual result with index number + serial PIN using the checker below.
          </p>
        </div>
        <div class="flex gap-8 mb-16">
          ${ctx.canManageAcademics ? `
            <button class="btn btn-outline btn-sm" id="register-candidate-btn">+ Register candidate</button>
            <button class="btn btn-gold btn-sm" id="sync-national-btn">Sync with National Examinations Council</button>
          ` : ''}
          <button class="btn btn-outline btn-sm" id="checker-btn">Results checker</button>
        </div>
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Candidate</th><th>Exam</th><th>Index number</th><th>Status</th></tr></thead>
          <tbody>${candidates.map((c) => `
            <tr>
              <td>${escapeHtml(c.studentName)}</td>
              <td>${badge(c.examType, 'grey')}</td>
              <td class="mono" style="font-size:11.5px">${c.indexNumber}</td>
              <td>${c.resultStatus === 'PUBLISHED' ? badge('Published', 'green') : badge('Pending', 'gold')}</td>
            </tr>
          `).join('') || `<tr><td colspan="4">${emptyState('No candidates registered yet')}</td></tr>`}</tbody>
        </table></div>
      `;

      const registerBtn = document.getElementById('register-candidate-btn');
      if (registerBtn) registerBtn.addEventListener('click', () => {
        const eligible = students.filter((s) => s.class === 'JHS3' || s.class === 'SHS3');
        const m = modal(`
          <button class="close-x" onclick="closeModal(this)">✕</button>
          <h3>Register examination candidate</h3>
          <form id="register-candidate-form">
            <div class="field"><label>Student</label>
              <select name="studentId">${eligible.map((s) => `<option value="${s.id}">${escapeHtml(s.name)} (${s.class})</option>`).join('') || '<option>No JHS3/SHS3 students found</option>'}</select>
            </div>
            <div class="field"><label>Examination</label>
              <select name="examType"><option value="BECE">BECE (JHS3)</option><option value="WASSCE">WASSCE (SHS3)</option></select>
            </div>
            <button class="btn btn-primary" type="submit" style="width:100%">Register</button>
          </form>
        `);
        onForm('register-candidate-form', async (data) => {
          const candidate = await Api.registerCandidate(data.studentId, data.examType);
          toast(`Registered — index number ${candidate.indexNumber}`, 'success');
          m.remove();
          renderBody();
        });
      });

      const syncBtn = document.getElementById('sync-national-btn');
      if (syncBtn) syncBtn.addEventListener('click', async () => {
        const result = await Api.syncNationalExams(schoolId);
        toast(`Synced ${result.newlySynced} new result(s) · ${result.stillPendingAtExamBody} still pending`, result.newlySynced > 0 ? 'success' : 'default');
        renderBody();
      });

      const checkerBtn = document.getElementById('checker-btn');
      if (checkerBtn) checkerBtn.addEventListener('click', () => {
        const cm = modal(`
          <button class="close-x" onclick="closeModal(this)">✕</button>
          <h3>Results checker</h3>
          <p class="muted" style="font-size:12px; margin-bottom:14px">Enter the candidate's index number and serial PIN — the same information a real WAEC results-checker scratch card provides.</p>
          <form id="checker-form">
            <div class="field"><label>Index number</label><input name="indexNumber" required /></div>
            <div class="field"><label>Serial PIN</label><input name="serialPin" required /></div>
            <button class="btn btn-primary" type="submit" style="width:100%">Check result</button>
          </form>
          <div id="checker-result" class="mt-16"></div>
        `);
        onForm('checker-form', async (data) => {
          const resultEl = document.getElementById('checker-result');
          try {
            const result = await Api.verifyNationalExamResult(data.indexNumber, data.serialPin);
            if (result.status === 'PENDING') {
              resultEl.innerHTML = `<div class="card" style="background:var(--surface-2)">${badge('Pending', 'gold')} <p style="font-size:12.5px; margin-top:8px">${escapeHtml(result.message)}</p></div>`;
            } else {
              resultEl.innerHTML = `
                <div class="card" style="background:var(--green-ok-pale); border-color:var(--green-ok)">
                  <div class="flex-between"><strong>${escapeHtml(result.candidateName)}</strong>${badge(result.examType, 'green')}</div>
                  <div class="muted" style="font-size:12px; margin:4px 0 10px">${escapeHtml(result.school)}</div>
                  <div class="table-wrap"><table class="ledger">
                    <thead><tr><th>Subject</th><th>Grade</th></tr></thead>
                    <tbody>${result.subjects.map((s) => `<tr><td style="font-size:12.5px">${escapeHtml(s.subject)}</td><td>${badge('Grade ' + s.grade, GRADE_BADGE[s.grade] || 'grey')}</td></tr>`).join('')}</tbody>
                  </table></div>
                  <div class="mt-8"><strong>Overall: </strong>${escapeHtml(result.overallResult)}</div>
                </div>`;
            }
          } catch (err) {
            resultEl.innerHTML = `<div class="login-error">${escapeHtml(err.message)}</div>`;
          }
        });
      });
    }
  }

  function openExamScoresModal(examId) {
    Api.examResults(examId).then(({ exam, results }) => {
      if (exam.format === 'OBJECTIVE') {
        const m = modal(`
          <button class="close-x" onclick="closeModal(this)">✕</button>
          <h3>${escapeHtml(exam.name)} — ${escapeHtml(exam.subject)}</h3>
          <p class="muted" style="font-size:12px; margin-bottom:14px">Auto-graded objective exam · Max score: ${exam.maxScore} · ${exam.class}</p>
          <div class="card mb-16" style="background:${exam.resultsPublished ? 'var(--green-ok-pale)' : 'var(--gold-pale)'}">
            <div class="flex-between">
              <strong style="font-size:13px">${exam.resultsPublished ? 'Results are published — students can see their scores' : 'Results are held — students cannot see scores yet'}</strong>
              <button class="btn btn-sm ${exam.resultsPublished ? 'btn-outline' : 'btn-gold'}" id="toggle-publish-btn">${exam.resultsPublished ? 'Hold results' : 'Publish now'}</button>
            </div>
          </div>
          <div class="flex-between mb-8">
            <div></div>
            ${exportButton('exam-results-export')}
          </div>
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Student</th><th>Score</th><th>Grade</th></tr></thead>
            <tbody>${results.map((r) => `
              <tr><td>${escapeHtml(r.name)}</td>
                <td>${r.score !== null ? r.score : (r.pending ? '<span class="muted">Submitted — held</span>' : '<span class="muted">Not submitted</span>')}</td>
                <td>${r.grade ?? '—'}</td></tr>
            `).join('')}</tbody>
          </table></div>
        `);
        wireExportButton('exam-results-export', () => ({
          title: `${exam.name} results`,
          columns: [{ key: 'name', label: 'Student' }, { key: 'score', label: 'Score' }, { key: 'grade', label: 'Grade' }],
          rows: results.filter((r) => r.score !== null).map((r) => ({ name: r.name, score: r.score, grade: r.grade })),
        }));
        document.getElementById('toggle-publish-btn').addEventListener('click', async () => {
          await Api.publishExamResults(examId, !exam.resultsPublished);
          toast(exam.resultsPublished ? 'Results held back' : 'Results published', 'success');
          m.remove();
          openExamScoresModal(examId);
        });
        return;
      }
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>${escapeHtml(exam.name)} — ${escapeHtml(exam.subject)}</h3>
        <p class="muted" style="font-size:12px; margin-bottom:14px">Max score: ${exam.maxScore} · ${exam.class}</p>
        <form id="scores-form">
          <div style="max-height:340px; overflow-y:auto">
            ${results.map((r) => `
              <div class="field-row mb-8" style="align-items:center">
                <div style="font-size:13px">${escapeHtml(r.name)}</div>
                <input type="number" min="0" max="${exam.maxScore}" name="score_${r.studentId}" value="${r.score ?? ''}" placeholder="Score" />
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary mt-16" type="submit" style="width:100%">Save scores</button>
        </form>
      `);
      onForm('scores-form', async (data) => {
        const scores = results.map((r) => ({ studentId: r.studentId, score: data[`score_${r.studentId}`] }));
        await Api.submitExamResults(examId, scores);
        toast('Scores saved', 'success');
        m.remove();
        renderBody();
      });
    });
  }

  function openReportCardModal(studentId) {
    Api.reportCard(studentId).then((rc) => {
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <div class="relative">
          <div class="watermark-seal" style="right:8px; top:8px">${SEAL_SVG}</div>
          <h3>${escapeHtml(rc.student.name)}</h3>
          <div class="mono muted" style="font-size:11.5px">${rc.student.geuln} · ${escapeHtml(rc.school?.name || '')}</div>
          <div class="muted" style="font-size:12px; margin-top:4px">${rc.academicYear} · Term ${rc.term}</div>
          <hr class="divider" />
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Subject</th><th>Score</th><th>Grade</th><th>Remark</th></tr></thead>
            <tbody>${rc.subjects.map((s) => `
              <tr><td style="font-size:12.5px">${escapeHtml(s.subject)}</td><td>${s.score}/${s.maxScore}</td>
              <td>${badge('Grade ' + s.grade, GRADE_BADGE[s.grade] || 'grey')}</td><td style="font-size:12px">${s.remark}</td></tr>
            `).join('') || `<tr><td colspan="4">${emptyState('No exam results recorded yet for this term')}</td></tr>`}</tbody>
          </table></div>
          <div class="grid grid-2 mt-16">
            <div><label>Overall average</label><div style="font-size:20px; font-family:var(--font-display)">${rc.overallAverage !== null ? rc.overallAverage + '%' : '—'}</div></div>
            <div><label>Attendance</label><div style="font-size:20px; font-family:var(--font-display)">${rc.attendanceRate !== null ? rc.attendanceRate + '%' : '—'}</div></div>
          </div>
          <div class="mt-16"><label>Conduct</label><div style="font-size:13px">${escapeHtml(rc.conduct)}</div></div>
          ${(rc.nationalExamResults || []).length ? `
            <hr class="divider" />
            <strong style="font-size:12.5px">Official National Examination Results</strong>
            ${rc.nationalExamResults.map((n) => `
              <div class="card mt-8" style="background:var(--gold-pale)">
                <div class="flex-between"><strong>${n.examType}</strong>${badge('National Examinations Council', 'gold')}</div>
                <div class="mono muted" style="font-size:11px; margin:4px 0 8px">Index: ${n.indexNumber}</div>
                <div class="table-wrap"><table class="ledger">
                  <thead><tr><th>Subject</th><th>Grade</th></tr></thead>
                  <tbody>${n.subjects.map((s) => `<tr><td style="font-size:12.5px">${escapeHtml(s.subject)}</td><td>${badge('Grade ' + s.grade, GRADE_BADGE[s.grade] || 'grey')}</td></tr>`).join('')}</tbody>
                </table></div>
                <div class="mt-8"><strong>Overall: </strong>${escapeHtml(n.overallResult)}</div>
              </div>
            `).join('')}
          ` : ''}
        </div>
      `);
    });
  }

  container.innerHTML = `
    <div class="flex-between mb-16">
      <div class="pill-tabs" id="academics-tabs">
        <button class="pill-tab active" data-tab="timetable">Timetable</button>
        <button class="pill-tab" data-tab="exams">Exams</button>
        <button class="pill-tab" data-tab="reportcards">Report cards</button>
        <button class="pill-tab" data-tab="subjects">Subject catalog</button>
        <button class="pill-tab" data-tab="national">National Exams (BECE/WASSCE)</button>
      </div>
      ${classes.length ? `<select id="class-select" style="max-width:160px">${classes.map((c) => `<option value="${c}">${c}</option>`).join('')}</select>` : ''}
    </div>
    ${ctx.canManageAcademics && classes.length ? `
      <div class="flex gap-8 mb-16">
        <button class="btn btn-outline btn-sm" id="add-timetable-btn">+ Add timetable slot</button>
        <button class="btn btn-gold btn-sm" id="add-exam-btn">+ New exam</button>
      </div>
    ` : ''}
    ${card('', '<div id="academics-body"></div>')}
  `;

  document.getElementById('class-select')?.addEventListener('change', (e) => { selectedClass = e.target.value; renderBody(); });
  document.querySelectorAll('#academics-tabs .pill-tab').forEach((t) => {
    t.addEventListener('click', () => {
      tab = t.dataset.tab;
      document.querySelectorAll('#academics-tabs .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
      renderBody();
    });
  });

  const addTimetableBtn = document.getElementById('add-timetable-btn');
  if (addTimetableBtn) addTimetableBtn.addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Add timetable slot</h3>
      <form id="tt-form">
        <div class="field-row">
          <div class="field"><label>Day</label><select name="day"><option>MON</option><option>TUE</option><option>WED</option><option>THU</option><option>FRI</option></select></div>
          <div class="field"><label>Period</label><input name="period" type="number" min="1" max="8" value="1" required /></div>
        </div>
        <div class="field"><label>Subject</label>
          <select name="subject">${subjects.map((s) => `<option>${escapeHtml(s.name)}</option>`).join('')}</select>
        </div>
        <div class="field-row">
          <div class="field"><label>Start time</label><input name="startTime" type="time" /></div>
          <div class="field"><label>End time</label><input name="endTime" type="time" /></div>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%">Save slot</button>
      </form>
    `);
    onForm('tt-form', async (data) => {
      await Api.setTimetableEntry({ schoolId, class: selectedClass, day: data.day, period: Number(data.period), subject: data.subject, startTime: data.startTime, endTime: data.endTime });
      toast('Timetable updated', 'success');
      m.remove();
      renderBody();
    });
  });

  const addExamBtn = document.getElementById('add-exam-btn');
  if (addExamBtn) addExamBtn.addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>New exam</h3>
      <form id="exam-form">
        <div class="field"><label>Exam name</label><input name="name" placeholder="e.g. End of Term 2 Examination" required /></div>
        <div class="field-row">
          <div class="field"><label>Subject</label><select name="subject">${subjects.map((s) => `<option>${escapeHtml(s.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Type</label>
            <select name="examType">${Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
          </div>
        </div>
        <div class="field"><label>Format</label>
          <select name="format" id="exam-format-select">
            <option value="WRITTEN">Written — manually marked, you enter scores</option>
            <option value="OBJECTIVE">Objective — multiple choice, auto-graded instantly</option>
          </select>
        </div>
        <div class="field-row">
          <div class="field"><label>Max score</label><input name="maxScore" type="number" value="100" /></div>
          <div class="field"><label>Date</label><input name="date" type="date" /></div>
        </div>
        <div class="field" id="hold-results-field" style="display:none">
          <label style="display:flex; align-items:center; gap:8px; font-weight:400">
            <input type="checkbox" name="holdResults" style="width:auto" />
            Hold results back — students won't see their score until I publish it, even though it's graded instantly
          </label>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%">Create exam</button>
      </form>
    `);
    document.getElementById('exam-format-select').addEventListener('change', (e) => {
      document.getElementById('hold-results-field').style.display = e.target.value === 'OBJECTIVE' ? 'block' : 'none';
    });
    onForm('exam-form', async (data) => {
      const created = await Api.createExam({ ...data, schoolId, class: selectedClass, maxScore: Number(data.maxScore), holdResults: !!data.holdResults });
      toast(created.format === 'OBJECTIVE' ? 'Objective exam created — add questions next' : 'Exam created', 'success');
      m.remove();
      if (created.format === 'OBJECTIVE') { location.hash = `#/academics/exam/${created.id}/questions`; }
      App.render();
    });
  });

  renderBody();
};

// ---------------------------------------------------------------- LEAVE MANAGEMENT
const LEAVE_TYPE_LABELS = {
  SICK: 'Sick Leave', ANNUAL: 'Annual Leave', MATERNITY: 'Maternity Leave', PATERNITY: 'Paternity Leave',
  STUDY: 'Study Leave', COMPASSIONATE: 'Compassionate Leave', UNPAID: 'Unpaid Leave',
};

Pages.leave = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading leave requests…</div>`;
  const schoolId = ctx.user.school?.id;
  let requests, summary, teachers;
  try {
    requests = await Api.leaveRequests(schoolId ? { schoolId } : {});
    summary = schoolId ? await Api.leaveSummary(schoolId) : null;
    teachers = ctx.isTeacher || ctx.canApproveLeave ? await Api.teachers(schoolId) : [];
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const rows = requests.map((l) => `
    <tr>
      <td>${escapeHtml(l.teacherName)}</td>
      <td>${badge(LEAVE_TYPE_LABELS[l.type] || l.type, 'grey')}</td>
      <td>${fmtDate(l.startDate)} – ${fmtDate(l.endDate)}</td>
      <td>${l.days}</td>
      <td>${statusBadge(l.status === 'APPROVED' ? 'APPROVED' : l.status === 'REJECTED' ? 'REJECTED' : 'SUBMITTED')}</td>
      <td>
        ${ctx.canApproveLeave && l.status === 'PENDING' ? `
          <button class="btn btn-sm btn-outline" data-leave-decide="${l.id}" data-decision="APPROVED">Approve</button>
          <button class="btn btn-sm btn-outline" data-leave-decide="${l.id}" data-decision="REJECTED">Reject</button>
        ` : (l.decisionNote ? `<span class="muted" style="font-size:11px">${escapeHtml(l.decisionNote)}</span>` : '')}
      </td>
    </tr>`).join('');

  container.innerHTML = `
    ${summary ? `
      <div class="grid grid-4 mb-16">
        ${statCard('Pending', summary.pending)}
        ${statCard('Approved', summary.approved)}
        ${statCard('Rejected', summary.rejected)}
        ${statCard('Approved leave-days', summary.totalDaysApproved)}
      </div>
    ` : ''}
    <div class="flex-between mb-16">
      <div></div>
      <button class="btn btn-gold btn-sm" id="request-leave-btn">+ Request leave</button>
    </div>
    ${card(`Leave requests (${requests.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Teacher</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6">${emptyState('No leave requests yet')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;

  container.querySelectorAll('[data-leave-decide]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const note = btn.dataset.decision === 'REJECTED' ? prompt('Optional note for this decision:') || '' : '';
      await Api.decideLeave(btn.dataset.leaveDecide, btn.dataset.decision, note);
      toast(`Leave ${btn.dataset.decision.toLowerCase()}`, btn.dataset.decision === 'APPROVED' ? 'success' : 'error');
      App.render();
    });
  });

  const reqBtn = document.getElementById('request-leave-btn');
  if (reqBtn) reqBtn.addEventListener('click', () => {
    const myTeacherId = ctx.user.teacherId;
    const teacherOptions = teachers.length
      ? teachers.map((t) => `<option value="${t.id}" ${t.id === myTeacherId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')
      : '';
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Request leave</h3>
      <form id="leave-form">
        ${teacherOptions ? `<div class="field"><label>Teacher</label><select name="teacherId">${teacherOptions}</select></div>` : ''}
        <div class="field"><label>Type</label>
          <select name="type">${Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        </div>
        <div class="field-row">
          <div class="field"><label>Start date</label><input name="startDate" type="date" required /></div>
          <div class="field"><label>End date</label><input name="endDate" type="date" required /></div>
        </div>
        <div class="field"><label>Reason</label><textarea name="reason" rows="2"></textarea></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Submit request</button>
      </form>
    `);
    onForm('leave-form', async (data) => {
      await Api.requestLeave(data);
      toast('Leave request submitted', 'success');
      m.remove();
      App.render();
    });
  });
};

// ---------------------------------------------------------------- MESSAGES
Pages.messages = async function (container, ctx, openThreadKey) {
  container.innerHTML = `<div class="section-title">Loading messages…</div>`;
  let threads;
  try { threads = await Api.threads(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const threadRows = threads.map((t) => `
    <div class="msg-thread-row ${t.threadKey === openThreadKey ? 'active' : ''}" data-thread="${t.threadKey}">
      <div class="flex-between">
        <strong style="font-size:13px">${escapeHtml(t.otherUser?.name || 'Unknown')}</strong>
        ${t.unread > 0 ? `<span class="badge badge-red">${t.unread}</span>` : ''}
      </div>
      <div class="muted" style="font-size:11.5px">${ROLE_LABELS[t.otherUser?.role] || t.otherUser?.role || ''}</div>
      <div class="muted" style="font-size:12px; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escapeHtml(t.lastMessage)}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="msg-layout">
      <div class="msg-sidebar">
        <div class="msg-sidebar-header flex-between">
          <strong style="font-size:13px">Conversations</strong>
          <button class="btn btn-sm btn-outline" id="new-message-btn">+ New</button>
        </div>
        <div id="thread-list">${threadRows || emptyState('No conversations yet')}</div>
      </div>
      <div class="msg-panel" id="msg-panel">
        ${emptyState('Select a conversation to view messages')}
      </div>
    </div>
  `;

  async function openThread(threadKey) {
    const panel = document.getElementById('msg-panel');
    panel.innerHTML = `<div class="muted" style="padding:20px">Loading…</div>`;
    const msgs = await Api.thread(threadKey);
    const thread = threads.find((t) => t.threadKey === threadKey);
    panel.innerHTML = `
      <div class="msg-panel-header">
        <strong>${escapeHtml(thread?.otherUser?.name || 'Conversation')}</strong>
        <div class="muted" style="font-size:11.5px">${ROLE_LABELS[thread?.otherUser?.role] || ''}</div>
      </div>
      <div class="msg-history" id="msg-history">
        ${msgs.map((m) => `
          <div class="msg-bubble ${m.fromUserId === ctx.user.id ? 'mine' : ''}">
            <div>${escapeHtml(m.body)}</div>
            <div class="mono" style="font-size:9.5px; opacity:0.7; margin-top:4px">${fmtDateTime(m.sentAt)}</div>
          </div>
        `).join('')}
      </div>
      <form id="reply-form" class="msg-compose">
        <input name="body" placeholder="Type a message…" autocomplete="off" required />
        <button class="btn btn-primary btn-sm" type="submit">Send</button>
      </form>
    `;
    const historyEl = document.getElementById('msg-history');
    if (historyEl) historyEl.scrollTop = historyEl.scrollHeight;

    onForm('reply-form', async (data, form) => {
      await Api.sendMessage(thread.otherUser.id, data.body, thread.studentId);
      form.reset();
      openThread(threadKey);
    });
  }

  document.querySelectorAll('[data-thread]').forEach((row) => {
    row.addEventListener('click', () => {
      document.querySelectorAll('[data-thread]').forEach((r) => r.classList.remove('active'));
      row.classList.add('active');
      openThread(row.dataset.thread);
    });
  });

  if (openThreadKey) openThread(openThreadKey);

  document.getElementById('new-message-btn').addEventListener('click', async () => {
    // Simple recipient picker: school staff can message any teacher in their school scope;
    // parents/students can message a teacher at their child's/own school.
    let recipients = [];
    let studentIdForThread = ctx.user.scope?.studentId || null;
    try {
      const schoolId = ctx.isPortal
        ? (ctx.user.role === 'PARENT' ? (await Api.myChild()).school?.id : (await Api.myProfile()).school?.id)
        : ctx.user.school?.id;
      const teachersAtSchool = await Api.teachers(schoolId);
      recipients = teachersAtSchool.filter((t) => t.userId).map((t) => ({ label: `${t.name} (Teacher)`, userId: t.userId }));
    } catch {}

    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>New message</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">Messaging is scoped to people connected through the same student/school record.</p>
      <form id="new-msg-form">
        <div class="field"><label>Recipient</label>
          <select name="recipientIndex">${recipients.map((r, i) => `<option value="${i}">${escapeHtml(r.label)}</option>`).join('') || '<option>No eligible recipients found</option>'}</select>
        </div>
        <div class="field"><label>Message</label><textarea name="body" rows="3" required></textarea></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Send</button>
      </form>
    `);
    onForm('new-msg-form', async (data) => {
      const chosen = recipients[Number(data.recipientIndex)];
      if (!chosen) { toast('No recipient available', 'error'); return; }
      await Api.sendMessage(chosen.userId, data.body, studentIdForThread);
      toast('Message sent', 'success');
      m.remove();
      App.render();
    });
  });
};

// ---------------------------------------------------------------- ASSIGNMENTS / HOMEWORK
Pages.assignments = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading assignments…</div>`;

  if (ctx.user.role === 'PARENT') {
    // This page is the student/staff submission view — a parent reaching
    // it directly (old bookmark, typed URL) should land on the real,
    // read-only view instead of a submit button that was never meant for
    // them. That view already exists on the Portal Home's own tabs.
    window.location.hash = '#/dashboard';
    App.render();
    return;
  }

  if (ctx.isPortal || ctx.isStudentLeader) {
    // Student-facing view
    let list;
    try { list = await Api.myAssignments(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

    const rows = list.map((a) => `
      <tr>
        <td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.subject)}</td>
        <td>${a.dueDate ? fmtDate(a.dueDate) : '—'}</td>
        <td>${a.mySubmission ? badge('Submitted', 'green') : badge('Not submitted', 'grey')}</td>
        <td>${a.mySubmission?.grade != null ? badge('Grade ' + a.mySubmission.grade, GRADE_BADGE[a.mySubmission.grade] || 'grey') : '—'}</td>
        <td><button class="btn btn-sm btn-outline" data-assignment="${a.id}">${a.mySubmission ? 'View / resubmit' : 'Submit'}</button></td>
      </tr>`).join('');

    container.innerHTML = `
      ${card(`My assignments (${list.length})`, `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Title</th><th>Subject</th><th>Due</th><th>Status</th><th>Grade</th><th></th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6">${emptyState('No assignments posted yet')}</td></tr>`}</tbody>
        </table></div>
      `)}
    `;

    container.querySelectorAll('[data-assignment]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const a = list.find((x) => x.id === btn.dataset.assignment);
        const m = modal(`
          <button class="close-x" onclick="closeModal(this)">✕</button>
          <h3>${escapeHtml(a.title)}</h3>
          <div class="muted" style="font-size:12px; margin-bottom:10px">${escapeHtml(a.subject)} · Due ${a.dueDate ? fmtDate(a.dueDate) : 'no date set'}${a.timeLimitMinutes ? ` · Time limit ${a.timeLimitMinutes} min once started` : ''}</div>
          <p style="font-size:13.5px">${escapeHtml(a.instructions || 'No further instructions provided.')}</p>
          ${a.attachmentFile ? `<button class="btn btn-sm btn-outline mt-8" id="download-brief-btn">Download brief: ${escapeHtml(a.attachmentOriginalName || 'attachment')}</button>` : ''}
          <hr class="divider" />
          ${a.mySubmission?.feedback ? `
            <div class="card" style="background:var(--surface-2); margin-bottom:14px">
              <strong style="font-size:12.5px">Teacher feedback</strong>
              <p style="font-size:13px; margin:6px 0 0">${escapeHtml(a.mySubmission.feedback)}</p>
              ${a.mySubmission.grade != null ? `<div class="mt-8">${badge('Grade ' + a.mySubmission.grade, GRADE_BADGE[a.mySubmission.grade] || 'grey')}</div>` : ''}
            </div>
          ` : ''}
          <div id="time-limit-status"></div>
          ${(a.timeLimitMinutes && !a.mySubmission?.startedAt && !a.mySubmission?.submittedAt) ? `
            <button class="btn btn-gold" id="start-assignment-btn" style="width:100%">Start (starts your ${a.timeLimitMinutes}-minute timer)</button>
          ` : `
            <form id="submit-form">
              <div class="field"><label>Your work</label><textarea name="content" rows="4" placeholder="Type your answer or notes here…">${escapeHtml(a.mySubmission?.content || '')}</textarea></div>
              <div class="field"><label>Attach a file (optional)</label><input type="file" name="attachment" /></div>
              ${a.mySubmission?.attachmentFile ? `<button type="button" class="btn btn-sm btn-outline mb-16" id="download-my-submission-btn">Current file: ${escapeHtml(a.mySubmission.attachmentOriginalName)}</button>` : ''}
              <button class="btn btn-primary" type="submit" style="width:100%">${a.mySubmission?.submittedAt ? 'Resubmit' : 'Submit'}</button>
            </form>
          `}
        `);
        const briefBtn = document.getElementById('download-brief-btn');
        if (briefBtn) briefBtn.addEventListener('click', () => Api.downloadAssignmentAttachment(a.id, a.attachmentOriginalName).catch((e) => toast(e.message, 'error')));
        const myDlBtn = document.getElementById('download-my-submission-btn');
        if (myDlBtn) myDlBtn.addEventListener('click', () => Api.downloadSubmissionAttachment(a.id, ctx.user.scope?.studentId, a.mySubmission.attachmentOriginalName).catch((e) => toast(e.message, 'error')));

        const startBtn = document.getElementById('start-assignment-btn');
        if (startBtn) startBtn.addEventListener('click', async () => {
          try { await Api.startAssignment(a.id); toast('Timer started — good luck', 'success'); m.remove(); App.render(); }
          catch (err) { toast(err.message, 'error'); }
        });

        onForm('submit-form', async (data, formEl) => {
          try {
            await Api.submitAssignmentWithFile(a.id, formEl);
            toast('Assignment submitted', 'success');
            m.remove();
            App.render();
          } catch (err) { toast(err.message, 'error'); }
        });
      });
    });
    return;
  }

  // Teacher/staff-facing view
  const schoolId = ctx.user.school?.id;
  let list, students;
  try {
    list = await Api.assignments(schoolId ? { schoolId } : {});
    students = await Api.students(schoolId ? { schoolId } : {});
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const classes = [...new Set(students.map((s) => s.class))].sort();
  const rows = list.map((a) => `
    <tr>
      <td>${escapeHtml(a.title)}</td><td>${a.class}</td><td>${escapeHtml(a.subject)}</td>
      <td>${a.dueDate ? fmtDate(a.dueDate) : '—'}</td>
      <td><button class="btn btn-sm btn-outline" data-view-assignment="${a.id}">View submissions</button></td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="flex-between mb-16">
      <div></div>
      ${ctx.canManageAcademics ? `<button class="btn btn-gold btn-sm" id="new-assignment-btn">+ New assignment</button>` : ''}
    </div>
    ${card(`Assignments (${list.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Due</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">${emptyState('No assignments posted yet')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;

  container.querySelectorAll('[data-view-assignment]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { assignment, submissions } = await Api.assignmentSubmissions(btn.dataset.viewAssignment);
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>${escapeHtml(assignment.title)}</h3>
        <div class="muted" style="font-size:12px; margin-bottom:14px">${escapeHtml(assignment.subject)} · ${assignment.class}</div>
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Student</th><th>Status</th><th>Grade</th><th></th></tr></thead>
          <tbody>${submissions.map((s) => `
            <tr>
              <td>${escapeHtml(s.name)}</td>
              <td>${s.submitted ? badge('Submitted', 'green') : badge('Not submitted', 'grey')}</td>
              <td>${s.grade != null ? badge('Grade ' + s.grade, GRADE_BADGE[s.grade] || 'grey') : '—'}</td>
              <td>${s.submitted ? `<button class="btn btn-sm btn-outline" data-grade-student="${s.studentId}">Review &amp; grade</button>` : ''}</td>
            </tr>`).join('')}</tbody>
        </table></div>
      `);
      m.querySelectorAll('[data-grade-student]').forEach((gradeBtn) => {
        gradeBtn.addEventListener('click', () => {
          const s = submissions.find((x) => x.studentId === gradeBtn.dataset.gradeStudent);
          const gm = modal(`
            <button class="close-x" onclick="closeModal(this)">✕</button>
            <h3>${escapeHtml(s.name)}'s submission</h3>
            <div class="card" style="background:var(--surface-2); margin-bottom:14px">
              <p style="font-size:13px; white-space:pre-wrap">${escapeHtml(s.content || '(No written answer — see attached file)')}</p>
              <div class="mono muted" style="font-size:10.5px; margin-top:6px">Submitted ${fmtDateTime(s.submittedAt)}</div>
            </div>
            ${s.hasAttachment ? `<button type="button" class="btn btn-sm btn-outline mb-16" id="download-student-file-btn">Download file: ${escapeHtml(s.attachmentOriginalName || 'attachment')}</button>` : ''}
            <form id="grade-form">
              <div class="field"><label>Grade (1-9, WAEC scale)</label><input name="grade" type="number" min="1" max="9" value="${s.grade ?? ''}" /></div>
              <div class="field"><label>Feedback</label><textarea name="feedback" rows="3">${escapeHtml(s.feedback || '')}</textarea></div>
              <button class="btn btn-primary" type="submit" style="width:100%">Save</button>
            </form>
          `);
          const dlBtn = document.getElementById('download-student-file-btn');
          if (dlBtn) dlBtn.addEventListener('click', () => Api.downloadSubmissionAttachment(assignment.id, s.studentId, s.attachmentOriginalName).catch((e) => toast(e.message, 'error')));
          onForm('grade-form', async (data) => {
            await Api.gradeAssignment(assignment.id, s.studentId, data.grade ? Number(data.grade) : null, data.feedback);
            toast('Feedback saved', 'success');
            gm.remove();
            m.remove();
            App.render();
          });
        });
      });
    });
  });

  const newBtn = document.getElementById('new-assignment-btn');
  if (newBtn) newBtn.addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>New assignment</h3>
      <form id="new-assignment-form">
        <div class="field"><label>Title</label><input name="title" required /></div>
        <div class="field-row">
          <div class="field"><label>Class</label><select name="class">${classes.map((c) => `<option>${c}</option>`).join('')}</select></div>
          <div class="field"><label>Subject</label><input name="subject" required /></div>
        </div>
        <div class="field"><label>Instructions</label><textarea name="instructions" rows="3"></textarea></div>
        <div class="field-row">
          <div class="field"><label>Due date</label><input name="dueDate" type="date" /></div>
          <div class="field"><label>Time limit once started (minutes, optional)</label><input name="timeLimitMinutes" type="number" min="1" placeholder="e.g. 30" /></div>
        </div>
        <div class="field"><label>Attach a file (optional)</label><input type="file" name="attachment" /></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Post assignment</button>
      </form>
    `);
    onForm('new-assignment-form', async (data, formEl) => {
      try {
        await Api.createAssignmentWithFile(formEl, schoolId);
        toast('Assignment posted', 'success');
        m.remove();
        App.render();
      } catch (err) { toast(err.message, 'error'); }
    });
  });
};

// ---------------------------------------------------------------- ALUMNI
Pages.alumni = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading alumni register…</div>`;
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const schoolId = params.get('schoolId') || ctx.user.school?.id || '';

  let list, summary;
  try {
    list = await Api.alumni(schoolId ? { schoolId } : {});
    summary = schoolId ? await Api.alumniSummary(schoolId) : null;
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const rows = list.map((a) => `
    <tr style="cursor:pointer" onclick="Pages.showAlumnus('${a.id}')">
      <td>${escapeHtml(a.name)}</td>
      <td class="mono" style="font-size:11px">${a.geuln}</td>
      <td>${a.finalClass}</td>
      <td>${statusBadge(a.status)}</td>
      <td>${a.finalOutcomeYear || '—'}</td>
      <td>${escapeHtml(a.school?.name || '')}</td>
    </tr>`).join('');

  const yearRows = summary ? Object.entries(summary.byYear).map(([year, v]) => `
    <tr><td>${year}</td><td>${v.graduated}</td><td>${v.withdrawn}</td></tr>
  `).join('') : '';

  container.innerHTML = `
    ${summary ? `
      <div class="grid grid-4 mb-16">
        ${statCard('Total alumni', summary.total)}
        ${statCard('Graduated', summary.graduated)}
        ${statCard('Withdrawn', summary.withdrawn)}
      </div>
    ` : ''}
    <div class="grid grid-2">
      <div>
        ${card(`Alumni register (${list.length})`, `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Name</th><th>GEULN</th><th>Final class</th><th>Status</th><th>Year</th><th>School</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="6">${emptyState('No graduated or withdrawn students on record yet')}</td></tr>`}</tbody>
          </table></div>
        `)}
      </div>
      <div>
        ${summary ? card('By academic year', `
          <div class="table-wrap"><table class="ledger">
            <thead><tr><th>Year</th><th>Graduated</th><th>Withdrawn</th></tr></thead>
            <tbody>${yearRows || `<tr><td colspan="3">${emptyState('No data yet')}</td></tr>`}</tbody>
          </table></div>
        `) : ''}
      </div>
    </div>
  `;

  window.Pages = Pages;
  Pages.showAlumnus = async function (id) {
    const data = await Api.alumnusDetail(id);
    modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <div class="relative">
        <div class="watermark-seal" style="right:8px; top:8px">${SEAL_SVG}</div>
        <h3>${escapeHtml(data.student.name)}</h3>
        <div class="mono muted" style="font-size:11.5px">${data.student.geuln} · ${escapeHtml(data.school?.name || '')}</div>
        <hr class="divider" />
        <div class="grid grid-2">
          <div><label>Status</label><div>${statusBadge(data.student.status)}</div></div>
          <div><label>Admitted</label><div>${fmtDate(data.student.admissionDate)}</div></div>
          <div><label>Gender</label><div>${data.student.gender}</div></div>
          <div><label>Parent/Guardian</label><div>${escapeHtml(data.student.parentName || '—')}</div></div>
        </div>
        <hr class="divider" />
        <strong style="font-size:12.5px">Lifecycle history</strong>
        <div class="table-wrap mt-8"><table class="ledger">
          <thead><tr><th>Year</th><th>From</th><th>To</th><th>Outcome</th></tr></thead>
          <tbody>${data.lifecycleHistory.map((h) => `
            <tr><td>${h.academicYear}</td><td>${h.fromClass}</td><td>${h.toClass}</td><td>${statusBadge(h.outcome)}</td></tr>
          `).join('') || `<tr><td colspan="4">${emptyState('No lifecycle records')}</td></tr>`}</tbody>
        </table></div>
      </div>
    `);
  };
};

// ---------------------------------------------------------------- COMMS OUTBOX (admin)
Pages.outbox = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading dispatch log…</div>`;
  let list;
  try { list = await Api.outbox(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const rows = list.map((o) => `
    <tr>
      <td>${badge(o.channel, o.channel === 'EMAIL' ? 'grey' : 'gold')}</td>
      <td>${escapeHtml(o.to)}</td>
      <td>${escapeHtml(o.subject || o.body.slice(0, 50))}</td>
      <td>${badge(o.status, o.status === 'SENT' ? 'green' : o.status === 'FAILED' ? 'red' : 'grey')}</td>
      <td class="mono muted" style="font-size:10.5px">${o.mode}</td>
      <td class="mono muted" style="font-size:10.5px">${fmtDateTime(o.createdAt)}</td>
    </tr>`).join('');

  container.innerHTML = `
    <div class="card mb-16" style="background:var(--surface-2)">
      <p style="font-size:12.5px; margin:0" class="muted">
        Every notification NSEMAS sends attempts email and/or SMS dispatch alongside the in-app notification.
        This environment has no real SMTP server or SMS gateway reachable, so dispatches are logged here rather
        than actually delivered — the code path is the genuine transport API (nodemailer / Twilio-shaped), and
        would deliver for real the moment SMTP/Twilio credentials are configured in the environment.
      </p>
    </div>
    ${card(`Dispatch log (${list.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Channel</th><th>To</th><th>Subject</th><th>Status</th><th>Mode</th><th>Sent</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6">${emptyState('No dispatches yet')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;
};

// ---------------------------------------------------------------- GROUPS (group chat)
Pages.groups = async function (container, ctx, openGroupId) {
  container.innerHTML = `<div class="section-title">Loading groups…</div>`;
  let groupList, myInvites;
  try {
    groupList = await Api.myGroups();
    myInvites = await Api.myGroupInvites().catch(() => []);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  const canCreate = ROLE_CATALOG[ctx.user.role]?.tier !== 'PORTAL';

  const groupRows = groupList.map((g) => `
    <div class="msg-thread-row ${g.id === openGroupId ? 'active' : ''}" data-group="${g.id}">
      <div class="flex-between">
        <strong style="font-size:13px">${escapeHtml(g.name)}</strong>
        <span class="mono muted" style="font-size:10px">${g.memberCount} members</span>
      </div>
      <div class="muted" style="font-size:12px; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
        ${g.lastMessage ? `${escapeHtml(g.lastMessage.fromName)}: ${escapeHtml(g.lastMessage.preview)}` : 'No messages yet'}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    ${myInvites.length ? `
      <div class="card mb-16" style="background:var(--gold-pale); border-color:var(--gold-bright)">
        <strong style="font-size:13px">Group invitations (${myInvites.length})</strong>
        <div id="invites-list" class="mt-8">
          ${myInvites.map((i) => `
            <div class="flex-between mb-8">
              <div style="font-size:13px">${escapeHtml(i.groupName)} <span class="muted" style="font-size:11.5px">— invited by ${escapeHtml(i.invitedBy)}</span></div>
              <div class="flex gap-8">
                <button class="btn btn-sm btn-gold" data-invite-respond="${i.groupId}" data-accept="true">Accept</button>
                <button class="btn btn-sm btn-outline" data-invite-respond="${i.groupId}" data-accept="false">Decline</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    <div class="msg-layout">
      <div class="msg-sidebar">
        <div class="msg-sidebar-header flex-between">
          <strong style="font-size:13px">My groups</strong>
          <div class="flex gap-8">
            <button class="btn btn-sm btn-outline" id="join-by-code-btn">Join by code</button>
            ${canCreate ? `<button class="btn btn-sm btn-outline" id="new-group-btn">+ New</button>` : ''}
          </div>
        </div>
        <div id="group-list">${groupRows || emptyState(canCreate ? 'No groups yet — create one' : 'No groups yet. A teacher or student leader can add you to one.')}</div>
      </div>
      <div class="msg-panel" id="group-panel">
        ${emptyState('Select a group to view messages')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-invite-respond]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const accept = btn.dataset.accept === 'true';
      try {
        await Api.respondToGroupInvite(btn.dataset.inviteRespond, accept);
        toast(accept ? 'Joined the group' : 'Invitation declined', 'success');
        App.render();
      } catch (err) { toast(err.message, 'error'); }
    });
  });

  document.getElementById('join-by-code-btn').addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Join a group by code</h3>
      <p class="muted" style="font-size:12.5px; margin-bottom:14px">Ask the group's creator for their 6-character join code.</p>
      <form id="join-code-form">
        <div class="field"><label>Join code</label><input name="code" style="text-transform:uppercase" maxlength="6" required /></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Request to join</button>
      </form>
      <div id="join-code-result" class="mt-16"></div>
    `);
    onForm('join-code-form', async (data) => {
      try {
        const res = await Api.joinGroupByCode(data.code.toUpperCase());
        document.getElementById('join-code-result').innerHTML = `<div class="card" style="background:var(--green-ok-pale)">Request sent to join "${escapeHtml(res.groupName)}" — waiting on the group creator to approve.</div>`;
        document.getElementById('join-code-form').style.display = 'none';
      } catch (err) { toast(err.message, 'error'); }
    });
  });

  let recordingState = null; // { mediaRecorder, chunks, startedAt, timerInterval }
  let openGroupCallId = 0; // guards against overlapping openGroup() calls (e.g. a fast double-navigation) writing stale DOM

  async function openGroup(groupId) {
    const myCallId = ++openGroupCallId;
    const panel = document.getElementById('group-panel');
    if (!panel) return;
    panel.innerHTML = `<div class="muted" style="padding:20px">Loading…</div>`;
    const [msgs, group] = await Promise.all([Api.groupMessages(groupId), Promise.resolve(groupList.find((g) => g.id === groupId))]);

    // A newer call started (and possibly already finished) while this one
    // was awaiting — let that one own the DOM instead of overwriting it.
    if (myCallId !== openGroupCallId) return;
    const panelNow = document.getElementById('group-panel');
    if (!panelNow || !group) return;

    panelNow.innerHTML = `
      <div class="msg-panel-header flex-between">
        <div>
          <strong>${escapeHtml(group.name)}</strong>
          <div class="muted" style="font-size:11.5px">${group.memberCount} members · started by ${escapeHtml(group.createdByName)}</div>
        </div>
        <div class="flex gap-8">
          ${group.createdBy === ctx.user.id ? `
            <button class="btn btn-sm btn-outline" id="add-member-btn">+ Add member</button>
            <button class="btn btn-sm btn-outline" id="share-link-btn">Share join link</button>
          ` : ''}
          <button class="btn btn-sm btn-outline" id="leave-group-btn">Leave</button>
        </div>
      </div>
      <div class="msg-history" id="group-history">
        ${msgs.map((m) => renderGroupMessage(m, ctx)).join('')}
      </div>
      <div class="group-compose">
        <button class="btn btn-outline btn-sm" id="attach-file-btn" title="Attach file">📎</button>
        <input type="file" id="file-input" style="display:none" />
        <button class="btn btn-outline btn-sm" id="record-btn" title="Record audio">🎙</button>
        <form id="group-text-form" style="flex:1; display:flex; gap:8px">
          <input name="body" placeholder="Type a message…" autocomplete="off" required />
          <button class="btn btn-primary btn-sm" type="submit">Send</button>
        </form>
      </div>
      <div id="record-status" class="muted" style="font-size:11.5px; padding:0 18px 10px; display:none"></div>
    `;
    const historyEl = document.getElementById('group-history');
    if (historyEl) historyEl.scrollTop = historyEl.scrollHeight;

    onForm('group-text-form', async (data, form) => {
      await Api.sendGroupText(groupId, data.body);
      form.reset();
      openGroup(groupId);
    });

    document.getElementById('attach-file-btn').addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) { toast('Please choose a file under 3MB', 'error'); return; }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await Api.sendGroupFile(groupId, file.name, file.type, reader.result);
          openGroup(groupId);
        } catch (err) { toast(err.message, 'error'); }
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('record-btn').addEventListener('click', () => toggleRecording(groupId));

    document.getElementById('leave-group-btn').addEventListener('click', async () => {
      if (!confirm(`Leave "${group.name}"?`)) return;
      await Api.leaveGroup(groupId);
      toast('Left group', 'success');
      App.render();
    });

    const shareLinkBtn = document.getElementById('share-link-btn');
    if (shareLinkBtn) shareLinkBtn.addEventListener('click', async () => {
      const [{ joinCode }, requests] = await Promise.all([Api.groupJoinCode(groupId), Api.groupJoinRequests(groupId)]);
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>Share join link</h3>
        <p class="muted" style="font-size:12.5px; margin-bottom:8px">Share this code with anyone who should be able to request joining — for example, another class's prefect who'll bring in their own classmates.</p>
        <div class="card mb-16" style="background:var(--surface-2)">
          <div class="mono" style="font-size:22px; letter-spacing:0.1em; text-align:center">${joinCode}</div>
        </div>
        <label style="font-size:12.5px; font-weight:600; margin-bottom:8px; display:block">Pending join requests</label>
        <div id="join-requests-list">
          ${requests.map((r) => `
            <div class="flex-between mb-8">
              <div style="font-size:13px">${escapeHtml(r.name)}</div>
              <div class="flex gap-8">
                <button class="btn btn-sm btn-gold" data-jr-approve="${r.userId}">Approve</button>
                <button class="btn btn-sm btn-outline" data-jr-reject="${r.userId}">Reject</button>
              </div>
            </div>
          `).join('') || emptyState('No pending requests')}
        </div>
      `);
      m.querySelectorAll('[data-jr-approve]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await Api.respondToJoinRequest(groupId, btn.dataset.jrApprove, 'approve');
          toast('Request approved', 'success');
          m.remove();
          shareLinkBtn.click();
        });
      });
      m.querySelectorAll('[data-jr-reject]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await Api.respondToJoinRequest(groupId, btn.dataset.jrReject, 'reject');
          toast('Request rejected', 'success');
          m.remove();
          shareLinkBtn.click();
        });
      });
    });

    const addMemberBtn = document.getElementById('add-member-btn');
    if (addMemberBtn) addMemberBtn.addEventListener('click', async () => {
      const { candidates, buckets } = await Api.addableCandidates();
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>Add member</h3>
        <p class="muted" style="font-size:12px; margin-bottom:14px">Only people at or below your own level can be added.</p>
        ${buckets.length ? `
          <div class="mb-16">
            <label style="font-size:11px; font-weight:600; margin-bottom:6px; display:block">Add in bulk</label>
            <div class="flex gap-8" style="flex-wrap:wrap">
              ${buckets.map((b) => `<button class="btn btn-outline btn-sm" data-bulk-add="${b.key}">+ ${escapeHtml(b.label)} (${b.userIds.length})</button>`).join('')}
            </div>
          </div>
          <hr class="divider" />
        ` : ''}
        <form id="add-member-form">
          <div class="field"><label>Or add one person</label>
            <select name="userId">${candidates.map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(ROLE_LABELS[c.role] || c.role)}${c.studentClass ? ' · ' + c.studentClass : ''}</option>`).join('') || '<option>No eligible people found</option>'}</select>
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%">Add</button>
        </form>
      `);
      m.querySelectorAll('[data-bulk-add]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const bucket = buckets.find((b) => b.key === btn.dataset.bulkAdd);
          try {
            const result = await Api.addGroupMembersBulk(groupId, bucket.userIds);
            toast(`Invited ${result.addedCount} — waiting on their acceptance${result.rejected.length ? `, ${result.rejected.length} skipped` : ''}`, 'success');
            m.remove();
            openGroup(groupId);
          } catch (err) { toast(err.message, 'error'); }
        });
      });
      onForm('add-member-form', async (data) => {
        try {
          await Api.addGroupMember(groupId, data.userId);
          toast('Invitation sent — waiting on their acceptance', 'success');
          m.remove();
          openGroup(groupId);
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  }

  async function toggleRecording(groupId) {
    const btn = document.getElementById('record-btn');
    const statusEl = document.getElementById('record-status');

    if (recordingState) {
      recordingState.mediaRecorder.stop();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast('Audio recording is not available in this browser context', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordingState.timerInterval);
        statusEl.style.display = 'none';
        btn.textContent = '🎙';
        recordingState = null;
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            await Api.sendGroupAudio(groupId, reader.result);
            openGroup(groupId);
          } catch (err) { toast(err.message, 'error'); }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      const startedAt = Date.now();
      statusEl.style.display = 'block';
      btn.textContent = '⏹';
      const timerInterval = setInterval(() => {
        statusEl.textContent = `Recording… ${Math.floor((Date.now() - startedAt) / 1000)}s (click 🎙 again to stop)`;
      }, 250);
      recordingState = { mediaRecorder, chunks, startedAt, timerInterval };
    } catch (err) {
      toast('Microphone access was denied or unavailable', 'error');
    }
  }

  document.querySelectorAll('[data-group]').forEach((row) => {
    row.addEventListener('click', () => {
      document.querySelectorAll('[data-group]').forEach((r) => r.classList.remove('active'));
      row.classList.add('active');
      openGroup(row.dataset.group);
    });
  });

  if (openGroupId) openGroup(openGroupId);

  const newGroupBtn = document.getElementById('new-group-btn');
  if (newGroupBtn) newGroupBtn.addEventListener('click', async () => {
    const { candidates, buckets } = await Api.addableCandidates();
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>New group</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">You can only add people at or below your own level — this keeps students from adding senior staff, for example.</p>
      <form id="new-group-form">
        <div class="field"><label>Group name</label><input name="name" required /></div>
        <div class="field"><label>Description (optional)</label><input name="description" /></div>
        ${buckets.length ? `
          <div class="field">
            <label>Quick-select</label>
            <div class="flex gap-8" style="flex-wrap:wrap">
              ${buckets.map((b) => `<button type="button" class="btn btn-outline btn-sm" data-bulk-select="${b.key}">+ ${escapeHtml(b.label)} (${b.userIds.length})</button>`).join('')}
            </div>
          </div>
        ` : ''}
        <div class="field"><label>Members</label>
          <select name="memberUserIds" multiple size="8" style="height:auto">
            ${candidates.map((c) => `<option value="${c.id}">${escapeHtml(c.name)} — ${escapeHtml(ROLE_LABELS[c.role] || c.role)}${c.studentClass ? ' · ' + c.studentClass : ''}</option>`).join('') || '<option disabled>No eligible people found</option>'}
          </select>
          <div class="muted" style="font-size:11px; margin-top:4px">Cmd/Ctrl-click to select multiple, or use Quick-select above</div>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%">Create group</button>
      </form>
    `);
    m.querySelectorAll('[data-bulk-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bucket = buckets.find((b) => b.key === btn.dataset.bulkSelect);
        const select = m.querySelector('[name=memberUserIds]');
        const idSet = new Set(bucket.userIds);
        [...select.options].forEach((opt) => { if (idSet.has(opt.value)) opt.selected = true; });
        toast(`${bucket.userIds.length} selected — add more or create the group`, 'success');
      });
    });
    document.getElementById('new-group-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.querySelector('[name=name]').value;
      const description = form.querySelector('[name=description]').value;
      const memberSelect = form.querySelector('[name=memberUserIds]');
      const memberUserIds = [...memberSelect.selectedOptions].map((o) => o.value);
      if (!memberUserIds.length) { toast('Select at least one member', 'error'); return; }
      try {
        const group = await Api.createGroup(name, description, memberUserIds);
        toast('Group created', 'success');
        m.remove();
        location.hash = `#/groups/${group.id}`;
        App.render();
      } catch (err) { toast(err.message, 'error'); }
    });
  });
};

function renderGroupMessage(m, ctx) {
  const mine = m.fromUserId === ctx.user.id;
  let inner = '';
  if (m.type === 'TEXT') {
    inner = `<div>${escapeHtml(m.body)}</div>`;
  } else if (m.type === 'FILE') {
    inner = `<div>📎 <a href="${m.fileDataUri}" download="${escapeHtml(m.fileName)}" style="color:inherit; text-decoration:underline">${escapeHtml(m.fileName)}</a></div>`;
  } else if (m.type === 'AUDIO') {
    inner = `<audio controls src="${m.audioDataUri}" style="max-width:220px; height:32px"></audio>`;
  }
  return `
    <div class="msg-bubble ${mine ? 'mine' : ''}">
      ${!mine ? `<div class="mono" style="font-size:10px; opacity:0.75; margin-bottom:3px">${escapeHtml(m.fromName)}</div>` : ''}
      ${inner}
      <div class="mono" style="font-size:9.5px; opacity:0.7; margin-top:4px">${fmtDateTime(m.sentAt)}</div>
    </div>
  `;
}

// ---------------------------------------------------------------- SYSTEM ADMINISTRATION (NATIONAL_EMIS_ADMIN only)
Pages.admin = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading system administration…</div>`;
  let stats;
  try { stats = await Api.adminStats(); }
  catch (e) { container.innerHTML = emptyState(e.message); return; }

  let tab = 'users';

  container.innerHTML = `
    ${dashHero(ctx, "System-wide administration — accounts, access, and audit trail across every school and region.", '')}
    <div class="grid grid-4 mb-16">
      ${statCard('Total accounts', stats.totalUsers)}
      ${statCard('Active accounts', stats.activeUsers)}
      ${statCard('Disabled accounts', stats.disabledUsers, '', stats.disabledUsers > 0 ? 'down' : 'up')}
      ${statCard('Schools in system', stats.totalSchools)}
    </div>
    <div class="grid grid-4 mb-16">
      ${statCard('Active students', stats.totalStudents)}
      ${statCard('Teachers', stats.totalTeachers)}
      ${statCard('Active appointments', stats.activeAppointments)}
      ${statCard('Groups', stats.totalGroups)}
    </div>
    <div class="pill-tabs" id="admin-tabs">
      <button class="pill-tab active" data-tab="users">Accounts</button>
      <button class="pill-tab" data-tab="audit">Audit log</button>
    </div>
    <div id="admin-tab-body"></div>
  `;

  async function renderUsersTab() {
    const body = document.getElementById('admin-tab-body');
    body.innerHTML = `
      <div class="flex-between mb-16" style="flex-wrap:wrap; gap:8px">
        <div class="flex gap-8" style="flex-wrap:wrap">
          <input id="admin-user-search" placeholder="Search by name or username…" style="max-width:280px" />
          <select id="admin-active-filter" style="max-width:160px">
            <option value="">All accounts</option>
            <option value="true">Active only</option>
            <option value="false">Disabled only</option>
          </select>
        </div>
        <button class="btn btn-gold btn-sm" id="create-account-btn">+ Create account &amp; assign role</button>
        <button class="btn btn-outline btn-sm" id="manage-positions-btn">Custom positions</button>
      </div>
      ${card('Accounts', '<div id="admin-users-table"></div>')}
    `;

    document.getElementById('create-account-btn').addEventListener('click', openCreateAccountModal);
    document.getElementById('manage-positions-btn').addEventListener('click', openManagePositionsModal);

    async function runSearch() {
      const search = document.getElementById('admin-user-search').value;
      const active = document.getElementById('admin-active-filter').value;
      const params = {};
      if (search) params.search = search;
      if (active) params.active = active;
      const list = await Api.adminSearchUsers(params);
      document.getElementById('admin-users-table').innerHTML = `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>School</th><th>Status</th><th></th></tr></thead>
          <tbody>${list.map((u) => `
            <tr>
              <td>${escapeHtml(u.name)} ${u.isDemoAccount ? badge('Demo', 'gold') : ''}</td>
              <td class="mono" style="font-size:11.5px">${escapeHtml(u.username)}</td>
              <td>${u.customTitle ? `${escapeHtml(u.customTitle)}<div class="muted" style="font-size:10.5px">${escapeHtml(ROLE_LABELS[u.role] || u.role)} permissions</div>` : escapeHtml(ROLE_LABELS[u.role] || u.role)}</td>
              <td>${escapeHtml(u.school?.name || '—')}</td>
              <td>${u.active ? badge('Active', 'green') : badge('Disabled', 'red')}</td>
              <td class="flex gap-8">
                ${u.role === 'MINISTER' ? '<span class="muted" style="font-size:11px">Protected</span>' : `
                  <button class="btn btn-sm btn-outline" data-toggle-user="${u.id}">${u.active ? 'Disable' : 'Enable'}</button>
                  <button class="btn btn-sm btn-outline" data-reassign-user="${u.id}">Reassign role</button>
                `}
              </td>
            </tr>
          `).join('') || `<tr><td colspan="6">${emptyState('No matching accounts')}</td></tr>`}</tbody>
        </table></div>
      `;
      document.querySelectorAll('[data-toggle-user]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const userId = btn.dataset.toggleUser;
          const row = list.find((u) => u.id === userId);
          if (row.active && !confirm(`Disable ${row.name}'s account? They'll be signed out immediately and can't log back in until re-enabled.`)) return;
          try {
            await Api.adminToggleActive(userId);
            toast(row.active ? 'Account disabled' : 'Account enabled', 'success');
            runSearch();
          } catch (err) { toast(err.message, 'error'); }
        });
      });
      document.querySelectorAll('[data-reassign-user]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const row = list.find((u) => u.id === btn.dataset.reassignUser);
          openReassignRoleModal(row, runSearch);
        });
      });
    }

    document.getElementById('admin-user-search').addEventListener('input', debounce(runSearch, 300));
    document.getElementById('admin-active-filter').addEventListener('change', runSearch);
    runSearch();
  }

  async function openCreateAccountModal() {
    const [roles, positions, regionData, schoolsList] = await Promise.all([
      Api.adminRoles(), Api.adminCustomPositions(), Api.adminRegions(), Api.schools(),
    ]);
    const roleTierMap = Object.fromEntries(roles.map((r) => [r.role, r.tier]));
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Create account &amp; assign role</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">
        A username and temporary password are generated automatically — the password is shown once, here, and never
        retrievable again. The Minister's account isn't managed through this console.
      </p>
      <form id="create-account-form">
        <div class="field"><label>Full name</label><input name="name" required /></div>
        <div class="pill-tabs" id="create-account-mode" style="margin-bottom:14px">
          <button type="button" class="pill-tab active" data-mode="standard">Standard role</button>
          <button type="button" class="pill-tab" data-mode="custom">Custom position</button>
        </div>
        <div id="mode-standard">
          <div class="field"><label>Role</label>
            <select name="role" id="create-account-role">${roles.map((r) => `<option value="${r.role}">${escapeHtml(r.label)}</option>`).join('')}</select>
          </div>
        </div>
        <div id="mode-custom" style="display:none">
          <div class="field"><label>Position</label>
            <select name="customPositionId">${positions.map((p) => `<option value="${p.id}">${escapeHtml(p.title)} (${escapeHtml(p.baseRoleLabel)})</option>`).join('') || '<option disabled>No custom positions defined yet</option>'}</select>
          </div>
          <p class="muted" style="font-size:11.5px">This person will have the same real permissions as a ${positions[0] ? escapeHtml(positions[0].baseRoleLabel) : '...'} — the title shown everywhere is just their custom name.</p>
        </div>
        <div id="create-account-scope-fields"></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Create account</button>
      </form>
      <div id="create-account-result" class="mt-16"></div>
    `);

    // The jurisdiction fields genuinely change what this account can see —
    // an empty scope isn't a safe default, it's a broken one, since
    // schoolIdsForUser has nothing to match against. Render exactly what
    // this role's tier actually needs, nothing more.
    function renderScopeFields() {
      const role = document.getElementById('create-account-role').value;
      const tier = roleTierMap[role];
      const holder = document.getElementById('create-account-scope-fields');
      if (tier === 'NATIONAL') {
        holder.innerHTML = `<p class="muted" style="font-size:11.5px; margin:6px 0 14px">National-tier role — no region or school scope needed.</p>`;
        return;
      }
      const regionOptions = regionData.regions.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('');
      if (tier === 'REGIONAL') {
        holder.innerHTML = `<div class="field"><label>Region</label><select name="region">${regionOptions}</select></div>`;
        return;
      }
      if (tier === 'DISTRICT' || tier === 'CIRCUIT') {
        holder.innerHTML = `
          <div class="field"><label>Region</label><select name="region" id="scope-region">${regionOptions}</select></div>
          <div class="field"><label>District</label><select name="district" id="scope-district"></select></div>
        `;
        const regionSelect = document.getElementById('scope-region');
        const fillDistricts = () => {
          const districts = regionData.districtsByRegion[regionSelect.value] || [];
          document.getElementById('scope-district').innerHTML = districts.map((d) => `<option value="${d}">${escapeHtml(d)}</option>`).join('');
        };
        regionSelect.addEventListener('change', fillDistricts);
        fillDistricts();
        return;
      }
      // School-tier, teaching staff, student leadership, portal roles — all
      // resolve to an actual school. Region/district come along with it so
      // the full jurisdiction chain is set, matching how seeding does it.
      holder.innerHTML = `
        <div class="field"><label>School</label>
          <select name="schoolId">${schoolsList.map((s) => `<option value="${s.id}" data-region="${s.region}" data-district="${s.district}">${escapeHtml(s.name)} — ${escapeHtml(s.district)}</option>`).join('')}</select>
        </div>
      `;
    }
    document.getElementById('create-account-role').addEventListener('change', renderScopeFields);
    renderScopeFields();

    let mode = 'standard';
    m.querySelectorAll('#create-account-mode .pill-tab').forEach((t) => {
      t.addEventListener('click', () => {
        mode = t.dataset.mode;
        m.querySelectorAll('#create-account-mode .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
        m.querySelector('#mode-standard').style.display = mode === 'standard' ? 'block' : 'none';
        m.querySelector('#mode-custom').style.display = mode === 'custom' ? 'block' : 'none';
      });
    });
    onForm('create-account-form', async (data) => {
      try {
        const scope = {};
        if (data.region) scope.region = data.region;
        if (data.district) {
          // Districts are stored as a slug (e.g. "Accra Metro" -> "ACCRA_METRO"),
          // matching exactly how seed.js derives it — using the display name
          // directly here would silently create an account scoped to a
          // district that doesn't match any real school.
          const districtId = data.district.replace(/\s+/g, '_').toUpperCase();
          scope.district = districtId;
          scope.circuit = `${districtId}_C1`;
        }
        if (data.schoolId) {
          scope.schoolId = data.schoolId;
          const opt = document.querySelector(`#create-account-scope-fields option[value="${data.schoolId}"]`);
          if (opt) { scope.region = opt.dataset.region; scope.district = opt.dataset.district; }
        }
        const payload = mode === 'custom'
          ? { name: data.name, customPositionId: data.customPositionId, scope }
          : { name: data.name, role: data.role, scope };
        const created = await Api.adminCreateUser(payload);
        document.getElementById('create-account-result').innerHTML = `
          <div class="card" style="background:var(--green-ok-pale); border-color:var(--green-ok)">
            <strong style="font-size:13px">Account created</strong>
            <div class="mono mt-8" style="font-size:12px">Username: ${escapeHtml(created.username)}</div>
            <div class="mono" style="font-size:12px">Temporary password: ${escapeHtml(created.temporaryPassword)}</div>
            ${created.customTitle ? `<div class="mt-8" style="font-size:12px">Position: ${escapeHtml(created.customTitle)}</div>` : ''}
            <p class="muted mt-8" style="font-size:11.5px">Share this password securely — it will not be shown again.</p>
          </div>
        `;
        document.getElementById('create-account-form').style.display = 'none';
        renderUsersTab();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  async function openManagePositionsModal() {
    const [positions, roles] = await Promise.all([Api.adminCustomPositions(), Api.adminRoles()]);
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Custom positions</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">Define a new title (e.g. "Regional PTA Association Executive") that carries the real permissions of an existing role.</p>
      <form id="new-position-form" class="mb-16">
        <div class="field"><label>Title</label><input name="title" placeholder="e.g. Private Schools Association Executive" required /></div>
        <div class="field"><label>Description (optional)</label><input name="description" /></div>
        <div class="field"><label>Inherits permissions of</label>
          <select name="baseRole">${roles.map((r) => `<option value="${r.role}">${escapeHtml(r.label)}</option>`).join('')}</select>
        </div>
        <button class="btn btn-gold btn-sm" type="submit">+ Add position</button>
      </form>
      <div id="positions-list">
        ${positions.map((p) => `
          <div class="flex-between mb-8">
            <div><strong style="font-size:13px">${escapeHtml(p.title)}</strong> <span class="muted" style="font-size:11.5px">— inherits ${escapeHtml(p.baseRoleLabel)}</span></div>
            <button class="btn btn-sm btn-outline" data-delete-position="${p.id}">Delete</button>
          </div>
        `).join('') || emptyState('No custom positions defined yet')}
      </div>
    `);
    onForm('new-position-form', async (data) => {
      try {
        await Api.adminCreateCustomPosition(data);
        toast('Position created', 'success');
        m.remove();
        openManagePositionsModal();
      } catch (err) { toast(err.message, 'error'); }
    });
    m.querySelectorAll('[data-delete-position]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await Api.adminDeleteCustomPosition(btn.dataset.deletePosition);
          toast('Position deleted', 'success');
          m.remove();
          openManagePositionsModal();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  }

  function openReassignRoleModal(row, onDone) {
    Api.adminRoles().then((roles) => {
      const m = modal(`
        <button class="close-x" onclick="closeModal(this)">✕</button>
        <h3>Reassign role</h3>
        <p class="muted" style="font-size:12px; margin-bottom:14px">${escapeHtml(row.name)} is currently ${escapeHtml(ROLE_LABELS[row.role] || row.role)}.</p>
        <form id="reassign-role-form">
          <div class="field"><label>New role</label>
            <select name="role">${roles.map((r) => `<option value="${r.role}" ${r.role === row.role ? 'selected' : ''}>${escapeHtml(r.label)}</option>`).join('')}</select>
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%">Reassign</button>
        </form>
      `);
      onForm('reassign-role-form', async (data) => {
        try {
          await Api.adminReassignRole(row.id, data.role);
          toast('Role reassigned', 'success');
          m.remove();
          onDone();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  }

  async function renderAuditTab() {
    const body = document.getElementById('admin-tab-body');
    const log = await Api.adminAuditLog();
    body.innerHTML = card('Audit log', `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Action</th><th>Detail</th><th>Performed by</th><th>When</th></tr></thead>
        <tbody>${log.map((l) => `
          <tr>
            <td>${badge(l.action, l.action.includes('DISABLED') || l.action.includes('REVOKED') ? 'red' : 'green')}</td>
            <td class="mono" style="font-size:11px">${escapeHtml(l.targetUsername || l.username || l.userId || '—')}</td>
            <td>${escapeHtml(l.performedBy || 'System')}</td>
            <td class="mono muted" style="font-size:10.5px">${fmtDateTime(l.at)}</td>
          </tr>
        `).join('') || `<tr><td colspan="4">${emptyState('No audit events recorded yet')}</td></tr>`}</tbody>
      </table></div>
    `, `${log.length} recent events`);
  }

  document.querySelectorAll('#admin-tabs .pill-tab').forEach((t) => {
    t.addEventListener('click', () => {
      tab = t.dataset.tab;
      document.querySelectorAll('#admin-tabs .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
      if (tab === 'users') renderUsersTab(); else renderAuditTab();
    });
  });
  renderUsersTab();
};

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ---------------------------------------------------------------- OBJECTIVE EXAM QUESTION AUTHORING (teacher)
Pages.examQuestions = async function (container, ctx, examId) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  let exam, questions;
  try {
    const results = await Api.examResults(examId);
    exam = results.exam;
    questions = await Api.examQuestions(examId);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  function renderList() {
    container.innerHTML = `
      <div class="crumbs"><a href="#/academics">Curriculum &amp; Exams</a> / ${escapeHtml(exam.name)} questions</div>
      <div class="card mb-16">
        <h2>${escapeHtml(exam.name)}</h2>
        <p class="muted" style="font-size:12.5px">${escapeHtml(exam.subject)} · ${exam.class} · Objective (auto-graded) · ${questions.length} question(s), ${questions.reduce((s, q) => s + q.points, 0)} total points</p>
      </div>
      ${card('Question bank', `
        <button class="btn btn-gold btn-sm mb-16" id="add-question-btn">+ Add question</button>
        ${questions.map((q, i) => `
          <div class="mb-16" style="padding-bottom:14px; border-bottom:1px solid var(--paper-line)">
            <strong style="font-size:13px">${i + 1}. ${escapeHtml(q.questionText)}</strong>
            <span class="mono muted" style="font-size:11px"> · ${q.points} pt${q.points !== 1 ? 's' : ''}</span>
            <div class="mt-8">
              ${q.options.map((opt, oi) => `
                <div style="font-size:12.5px; ${oi === q.correctOptionIndex ? 'color:var(--green-ok); font-weight:600' : ''}">
                  ${oi === q.correctOptionIndex ? '✓ ' : '· '}${escapeHtml(opt)}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('') || emptyState('No questions yet — students can\'t take this exam until you add at least one.')}
      `)}
    `;
    document.getElementById('add-question-btn').addEventListener('click', openAddQuestionModal);
  }

  function openAddQuestionModal() {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Add question</h3>
      <form id="add-question-form">
        <div class="field"><label>Question</label><input name="questionText" required /></div>
        <div class="field"><label>Option A</label><input name="opt0" required /></div>
        <div class="field"><label>Option B</label><input name="opt1" required /></div>
        <div class="field"><label>Option C (optional)</label><input name="opt2" /></div>
        <div class="field"><label>Option D (optional)</label><input name="opt3" /></div>
        <div class="field"><label>Correct option</label>
          <select name="correctOptionIndex"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select>
        </div>
        <div class="field"><label>Points</label><input name="points" type="number" value="1" min="1" /></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Add question</button>
      </form>
    `);
    onForm('add-question-form', async (data) => {
      const options = [data.opt0, data.opt1, data.opt2, data.opt3].filter((o) => o && o.trim());
      const correctIdx = Number(data.correctOptionIndex);
      if (correctIdx >= options.length) { toast('Correct option must have text filled in', 'error'); return; }
      const created = await Api.addExamQuestion(examId, { questionText: data.questionText, options, correctOptionIndex: correctIdx, points: Number(data.points) });
      questions.push(created);
      toast('Question added', 'success');
      m.remove();
      renderList();
    });
  }

  renderList();
};

// ---------------------------------------------------------------- FINANCE (private schools — fees, invoices, payments)
Pages.finance = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading finance…</div>`;
  const schoolId = ctx.user.school?.id;
  if (!schoolId) { container.innerHTML = emptyState('No school on your account'); return; }

  let summary, feeList, invoiceList;
  try {
    [summary, feeList, invoiceList] = await Promise.all([
      Api.schoolFinanceSummary(schoolId),
      Api.feeStructures(schoolId),
      Api.schoolInvoices(schoolId),
    ]);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  function render() {
    container.innerHTML = `
      ${dashHero(ctx, 'Fee structures, invoices, and payments for your school.', `
        <button class="btn btn-outline btn-sm" id="new-fee-btn">+ New fee structure</button>
        <button class="btn btn-gold btn-sm" id="new-invoice-btn">+ Ad-hoc invoice</button>
      `)}
      <div class="grid grid-4 mb-16">
        ${statCard('Total billed', 'GH₵' + summary.totalBilled.toLocaleString())}
        ${statCard('Collected', 'GH₵' + summary.totalCollected.toLocaleString(), '', 'up')}
        ${statCard('Outstanding', 'GH₵' + summary.totalOutstanding.toLocaleString(), '', summary.totalOutstanding > 0 ? 'down' : 'up')}
        ${statCard('Overdue invoices', summary.overdueCount, '', summary.overdueCount > 0 ? 'down' : 'up')}
      </div>
      ${card('Fee structures', feeList.map((f) => `
        <div class="flex-between mb-8">
          <div><strong style="font-size:13px">${escapeHtml(f.name)}</strong> <span class="muted" style="font-size:12px">— ${f.class} · Term ${f.term} · GH₵${f.amount.toLocaleString()}</span></div>
          <button class="btn btn-sm btn-outline" data-generate="${f.id}">Generate invoices</button>
        </div>
      `).join('') || emptyState('No fee structures yet'))}
      <div class="mt-16">${card('Invoices', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Student</th><th>Description</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
          <tbody>${invoiceList.map((i) => `
            <tr>
              <td>${escapeHtml(i.studentName)}</td><td>${escapeHtml(i.description)}</td>
              <td>GH₵${i.amount.toLocaleString()}</td><td>GH₵${i.paidAmount.toLocaleString()}</td>
              <td>GH₵${i.balance.toLocaleString()}</td>
              <td>${badge(i.status, i.status === 'PAID' ? 'green' : i.overdue ? 'red' : 'gold')}</td>
              <td>${i.balance > 0 ? `<button class="btn btn-sm btn-outline" data-pay="${i.id}">Record payment</button>` : ''}</td>
            </tr>
          `).join('') || `<tr><td colspan="7">${emptyState('No invoices yet')}</td></tr>`}</tbody>
        </table></div>
      `, exportButton('invoices-export'))}</div>
    `;

    wireExportButton('invoices-export', () => ({
      title: 'Invoices',
      columns: [
        { key: 'studentName', label: 'Student' }, { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount (GHS)' }, { key: 'paidAmount', label: 'Paid (GHS)' },
        { key: 'balance', label: 'Balance (GHS)' }, { key: 'status', label: 'Status' },
      ],
      rows: invoiceList.map((i) => ({ studentName: i.studentName, description: i.description, amount: i.amount, paidAmount: i.paidAmount, balance: i.balance, status: i.status })),
    }));

    document.getElementById('new-fee-btn').addEventListener('click', openNewFeeModal);
    document.getElementById('new-invoice-btn').addEventListener('click', openNewInvoiceModal);
    container.querySelectorAll('[data-generate]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const dueDate = prompt('Due date (YYYY-MM-DD), or leave blank:') || null;
        try {
          const res = await Api.generateInvoices(btn.dataset.generate, dueDate);
          toast(`${res.createdCount} invoice(s) created${res.skippedCount ? `, ${res.skippedCount} already existed` : ''}`, 'success');
          await refresh();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
    container.querySelectorAll('[data-pay]').forEach((btn) => {
      btn.addEventListener('click', () => openPaymentModal(btn.dataset.pay));
    });
  }

  async function refresh() {
    [summary, feeList, invoiceList] = await Promise.all([
      Api.schoolFinanceSummary(schoolId), Api.feeStructures(schoolId), Api.schoolInvoices(schoolId),
    ]);
    render();
  }

  function openNewFeeModal() {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>New fee structure</h3>
      <form id="fee-form">
        <div class="field"><label>Name</label><input name="name" placeholder="e.g. Term 1 Tuition" required /></div>
        <div class="field-row">
          <div class="field"><label>Amount (GH₵)</label><input name="amount" type="number" required /></div>
          <div class="field"><label>Term</label><select name="term"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>
        </div>
        <div class="field"><label>Class (or "ALL" for the whole school)</label><input name="class" value="ALL" /></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Create</button>
      </form>
    `);
    onForm('fee-form', async (data) => {
      await Api.createFeeStructure({ ...data, schoolId, amount: Number(data.amount), term: Number(data.term) });
      toast('Fee structure created', 'success');
      m.remove();
      await refresh();
    });
  }

  function openNewInvoiceModal() {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Ad-hoc invoice</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">For a one-off charge (uniform, trip, etc.) rather than a termly fee.</p>
      <form id="invoice-form">
        <div class="field"><label>Student ID</label><input name="studentId" placeholder="Paste from the student's profile" required /></div>
        <div class="field"><label>Description</label><input name="description" required /></div>
        <div class="field"><label>Amount (GH₵)</label><input name="amount" type="number" required /></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Create invoice</button>
      </form>
    `);
    onForm('invoice-form', async (data) => {
      try {
        await Api.createInvoice({ ...data, amount: Number(data.amount) });
        toast('Invoice created', 'success');
        m.remove();
        await refresh();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  function openPaymentModal(invoiceId) {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Record payment</h3>
      <form id="payment-form">
        <div class="field"><label>Amount (GH₵)</label><input name="amount" type="number" required /></div>
        <div class="field"><label>Method</label>
          <select name="method"><option value="CASH">Cash</option><option value="MOBILE_MONEY">Mobile Money</option><option value="BANK_TRANSFER">Bank Transfer</option><option value="CHEQUE">Cheque</option></select>
        </div>
        <div class="field"><label>Reference (optional)</label><input name="reference" /></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Record</button>
      </form>
    `);
    onForm('payment-form', async (data) => {
      await Api.recordPayment(invoiceId, { ...data, amount: Number(data.amount) });
      toast('Payment recorded', 'success');
      m.remove();
      await refresh();
    });
  }

  render();
};

// ---------------------------------------------------------------- ASK & LEARN (self-study Q&A)
Pages.askAndLearn = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  const isTeacher = ctx.user.role !== 'STUDENT';
  let myQuestions = [], pending = [], kb = [];
  try {
    if (!isTeacher) myQuestions = await Api.myQuestions();
    if (isTeacher) pending = await Api.pendingQuestions();
    kb = await Api.knowledgeBase();
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  function render() {
    container.innerHTML = `
      ${dashHero(ctx, isTeacher
        ? 'Answer student questions — every answer becomes reusable for similar future questions.'
        : "Ask a question. If it's similar to one already answered, you'll get the answer instantly.", '')}
      ${!isTeacher ? `
        ${card('Ask a question', `
          <form id="ask-form">
            <div class="field"><label>Subject (optional)</label><input name="subject" placeholder="e.g. Mathematics" /></div>
            <div class="field"><label>Your question</label><textarea name="questionText" rows="3" required style="width:100%; font-family:var(--font-body); padding:10px; border:1px solid var(--paper-line); border-radius:8px"></textarea></div>
            <button class="btn btn-gold" type="submit">Ask</button>
          </form>
          <div id="ask-result" class="mt-16"></div>
        `)}
        <div class="mt-16">${card('Your questions', myQuestions.map((q) => `
          <div class="mb-16" style="padding-bottom:12px; border-bottom:1px solid var(--paper-line)">
            <strong style="font-size:13px">${escapeHtml(q.questionText)}</strong>
            <div class="mt-4">${q.status === 'PENDING' ? badge('Awaiting a teacher', 'gold') : badge(q.status === 'AUTO_ANSWERED' ? 'Instant match' : 'Answered', 'green')}</div>
            ${q.answerText ? `<div class="muted mt-8" style="font-size:12.5px">${escapeHtml(q.answerText)}</div>` : ''}
          </div>
        `).join('') || emptyState('No questions asked yet'))}</div>
      ` : `
        ${card(`Pending questions (${pending.length})`, pending.map((q) => `
          <div class="flex-between mb-12">
            <div><strong style="font-size:13px">${escapeHtml(q.questionText)}</strong> <span class="muted" style="font-size:11.5px">— ${escapeHtml(q.askedByName)}${q.subject ? ' · ' + escapeHtml(q.subject) : ''}</span></div>
            <button class="btn btn-sm btn-gold" data-answer="${q.id}">Answer</button>
          </div>
        `).join('') || emptyState('No pending questions — nice and caught up'))}
      `}
      <div class="mt-16">${card('Knowledge base', `
        <input id="kb-search" placeholder="Search past questions…" class="mb-16" />
        <div id="kb-list">${renderKbList(kb)}</div>
      `)}</div>
    `;

    if (!isTeacher) {
      onForm('ask-form', async (data) => {
        const res = await Api.askQuestion(data.questionText, data.subject);
        const resultBox = document.getElementById('ask-result');
        resultBox.innerHTML = res.status === 'AUTO_ANSWERED'
          ? `<div class="card" style="background:var(--green-ok-pale)"><strong>Instant answer</strong><div class="muted mt-8" style="font-size:12.5px">${escapeHtml(res.answerText)}</div><div class="muted mt-8" style="font-size:11px">${escapeHtml(res.answeredBy)}</div></div>`
          : `<div class="card" style="background:var(--gold-pale)"><strong>Question sent to your teacher</strong><div class="muted mt-8" style="font-size:12px">No close match found yet — you'll see the answer here once a teacher responds.</div></div>`;
        myQuestions.unshift(res);
        toast(res.status === 'AUTO_ANSWERED' ? 'Instant answer found!' : 'Question sent to a teacher', 'success');
      });
    } else {
      container.querySelectorAll('[data-answer]').forEach((btn) => {
        btn.addEventListener('click', () => openAnswerModal(btn.dataset.answer));
      });
    }

    document.getElementById('kb-search').addEventListener('input', debounce(async (e) => {
      const results = await Api.knowledgeBase({ search: e.target.value });
      document.getElementById('kb-list').innerHTML = renderKbList(results);
    }, 350));
  }

  function renderKbList(list) {
    return list.map((q) => `
      <div class="mb-12" style="padding-bottom:10px; border-bottom:1px solid var(--paper-line)">
        <strong style="font-size:13px">${escapeHtml(q.questionText)}</strong>
        <div class="muted mt-4" style="font-size:12.5px">${escapeHtml(q.answerText)}</div>
      </div>
    `).join('') || emptyState('No answered questions yet');
  }

  function openAnswerModal(id) {
    const q = pending.find((p) => p.id === id);
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Answer question</h3>
      <p class="muted" style="font-size:12.5px; margin-bottom:14px">${escapeHtml(q.questionText)}</p>
      <form id="answer-form">
        <div class="field"><label>Your answer</label><textarea name="answerText" rows="4" required style="width:100%; font-family:var(--font-body); padding:10px; border:1px solid var(--paper-line); border-radius:8px"></textarea></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Submit answer</button>
      </form>
    `);
    onForm('answer-form', async (data) => {
      await Api.answerQuestion(id, data.answerText);
      toast('Answer submitted', 'success');
      m.remove();
      pending = pending.filter((p) => p.id !== id);
      kb = await Api.knowledgeBase();
      render();
    });
  }

  render();
};

// ---------------------------------------------------------------- REPORTS TO SUPERVISOR
Pages.reports = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  let supervisor, inbox, sent;
  try {
    [supervisor, inbox, sent] = await Promise.all([
      Api.mySupervisor(), Api.reportsInbox().catch(() => []), Api.reportsSent().catch(() => []),
    ]);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  let tab = 'send';

  function render() {
    container.innerHTML = `
      ${dashHero(ctx, supervisor
        ? `Your reports go to ${escapeHtml(supervisor.name)} (${ROLE_LABELS[supervisor.role] || supervisor.role}).`
        : "You're at the top of the reporting chain — no supervisor to report to.", '')}
      <div class="pill-tabs mb-16" id="reports-tabs">
        <button class="pill-tab active" data-rtab="send">Send a report</button>
        <button class="pill-tab" data-rtab="inbox">Inbox ${inbox.filter((r) => r.status === 'PENDING').length ? `(${inbox.filter((r) => r.status === 'PENDING').length})` : ''}</button>
        <button class="pill-tab" data-rtab="sent">Sent</button>
      </div>
      <div id="reports-body"></div>
    `;
    document.querySelectorAll('#reports-tabs .pill-tab').forEach((t) => {
      t.addEventListener('click', () => {
        tab = t.dataset.rtab;
        document.querySelectorAll('#reports-tabs .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
        renderBody();
      });
    });
    renderBody();
  }

  function renderBody() {
    const body = document.getElementById('reports-body');
    if (tab === 'send') {
      body.innerHTML = !supervisor ? emptyState('No one is currently assigned above you in the reporting chain.') : card('New report', `
        <form id="report-form">
          <div class="field"><label>Subject</label><input name="subject" required /></div>
          <div class="field"><label>Details</label><textarea name="body" rows="5" required style="width:100%; font-family:var(--font-body); padding:10px; border:1px solid var(--paper-line); border-radius:8px"></textarea></div>
          <button class="btn btn-gold" type="submit">Send to ${escapeHtml(supervisor.name)}</button>
        </form>
      `);
      onForm('report-form', async (data) => {
        const created = await Api.submitReport(data.subject, data.body);
        sent.unshift(created);
        toast('Report sent', 'success');
        document.getElementById('report-form').reset();
      });
    } else if (tab === 'inbox') {
      body.innerHTML = card('Reports addressed to you', inbox.map((r) => `
        <div class="mb-16" style="padding-bottom:12px; border-bottom:1px solid var(--paper-line)">
          <div class="flex-between">
            <strong style="font-size:13px">${escapeHtml(r.subject)}</strong>
            ${badge(r.status, r.status === 'RESOLVED' ? 'green' : r.status === 'ACKNOWLEDGED' ? 'gold' : 'grey')}
          </div>
          <div class="muted" style="font-size:11.5px; margin:4px 0">From ${escapeHtml(r.fromName)} · ${fmtDateTime(r.submittedAt)}</div>
          <div style="font-size:12.5px">${escapeHtml(r.body)}</div>
          ${r.response ? `<div class="muted mt-8" style="font-size:12px"><strong>Your response:</strong> ${escapeHtml(r.response)}</div>` : ''}
          ${r.status === 'PENDING' ? `<button class="btn btn-sm btn-outline mt-8" data-respond="${r.id}">Respond</button>` : ''}
        </div>
      `).join('') || emptyState('Nothing in your inbox'));
      body.querySelectorAll('[data-respond]').forEach((btn) => {
        btn.addEventListener('click', () => openRespondModal(btn.dataset.respond));
      });
    } else if (tab === 'sent') {
      body.innerHTML = card('Reports you sent', sent.map((r) => `
        <div class="mb-16" style="padding-bottom:12px; border-bottom:1px solid var(--paper-line)">
          <div class="flex-between">
            <strong style="font-size:13px">${escapeHtml(r.subject)}</strong>
            ${badge(r.status, r.status === 'RESOLVED' ? 'green' : r.status === 'ACKNOWLEDGED' ? 'gold' : r.status === 'UNASSIGNED' ? 'red' : 'grey')}
          </div>
          <div class="muted" style="font-size:11.5px; margin:4px 0">To ${escapeHtml(r.toName || 'Unassigned')} · ${fmtDateTime(r.submittedAt)}</div>
          <div style="font-size:12.5px">${escapeHtml(r.body)}</div>
          ${r.response ? `<div class="muted mt-8" style="font-size:12px"><strong>Response:</strong> ${escapeHtml(r.response)}</div>` : ''}
        </div>
      `).join('') || emptyState('No reports sent yet'));
    }
  }

  function openRespondModal(id) {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Respond to report</h3>
      <form id="respond-form">
        <div class="field"><label>Response (optional)</label><textarea name="response" rows="3" style="width:100%; font-family:var(--font-body); padding:10px; border:1px solid var(--paper-line); border-radius:8px"></textarea></div>
        <div class="field"><label>Status</label>
          <select name="status"><option value="ACKNOWLEDGED">Acknowledged — I've seen this</option><option value="RESOLVED">Resolved</option></select>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%">Submit</button>
      </form>
    `);
    onForm('respond-form', async (data) => {
      const updated = await Api.respondToReport(id, data.status, data.response);
      inbox = inbox.map((r) => (r.id === id ? updated : r));
      toast('Response recorded', 'success');
      m.remove();
      renderBody();
    });
  }

  render();
};

// ---------------------------------------------------------------- LIBRARY
Pages.library = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading library…</div>`;
  const isStaff = ctx.user.role !== 'STUDENT';
  const schoolId = ctx.user.school?.id;
  const isPrivate = ctx.user.school?.type === 'PRIVATE';
  let books, loans, myLoans;
  try {
    books = await Api.libraryBooks(schoolId ? { schoolId } : {});
    if (isStaff) loans = await Api.allLoans().catch(() => []);
    else myLoans = await Api.myLoans().catch(() => []);
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  let tab = 'catalog';

  function render() {
    container.innerHTML = `
      ${dashHero(ctx, isStaff ? 'Manage the book catalog and track loans.' : 'Browse, borrow, and check your loans.', isStaff ? `
        <button class="btn btn-gold btn-sm" id="add-book-btn">+ Add book</button>
      ` : '')}
      <div class="pill-tabs mb-16" id="library-tabs">
        <button class="pill-tab active" data-ltab="catalog">Catalog</button>
        <button class="pill-tab" data-ltab="${isStaff ? 'loans' : 'myloans'}">${isStaff ? 'All loans' : 'My loans'}</button>
      </div>
      <div id="library-body"></div>
    `;
    document.querySelectorAll('#library-tabs .pill-tab').forEach((t) => {
      t.addEventListener('click', () => {
        tab = t.dataset.ltab;
        document.querySelectorAll('#library-tabs .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
        renderBody();
      });
    });
    if (isStaff) document.getElementById('add-book-btn').addEventListener('click', openAddBookModal);
    renderBody();
  }

  function renderBody() {
    const body = document.getElementById('library-body');
    if (tab === 'catalog') {
      body.innerHTML = `
        <input id="book-search" placeholder="Search title or author…" class="mb-16" style="max-width:320px" />
        <div class="grid grid-3" id="book-grid">${renderBookGrid(books)}</div>
      `;
      wireBookGrid();
      document.getElementById('book-search').addEventListener('input', debounce(async (e) => {
        books = await Api.libraryBooks(schoolId ? { schoolId, search: e.target.value } : { search: e.target.value });
        document.getElementById('book-grid').innerHTML = renderBookGrid(books);
        wireBookGrid();
      }, 350));
    } else if (tab === 'loans') {
      body.innerHTML = card('All active & past loans', `
        <div class="table-wrap"><table class="ledger">
          <thead><tr><th>Book</th><th>Student</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>${loans.map((l) => `
            <tr>
              <td>${escapeHtml(l.bookTitle)}</td><td>${escapeHtml(l.studentName)}</td>
              <td>${fmtDate(l.dueDate)}</td>
              <td>${l.status === 'RETURNED' ? badge('Returned', 'grey') : l.overdue ? badge('Overdue', 'red') : badge('Borrowed', 'gold')}</td>
              <td>${l.status === 'BORROWED' ? `<button class="btn btn-sm btn-outline" data-return="${l.id}">Mark returned</button>` : ''}</td>
            </tr>
          `).join('') || `<tr><td colspan="5">${emptyState('No loans on record')}</td></tr>`}</tbody>
        </table></div>
      `);
      body.querySelectorAll('[data-return]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await Api.returnLoan(btn.dataset.return);
          toast('Marked as returned', 'success');
          loans = await Api.allLoans();
          renderBody();
        });
      });
    } else if (tab === 'myloans') {
      body.innerHTML = card('My loans', myLoans.map((l) => `
        <div class="flex-between mb-8">
          <div><strong style="font-size:13px">${escapeHtml(l.bookTitle)}</strong> <span class="muted" style="font-size:11.5px">by ${escapeHtml(l.bookAuthor)}</span></div>
          <div>${l.status === 'RETURNED' ? badge('Returned', 'grey') : l.overdue ? badge('Overdue — due ' + fmtDate(l.dueDate), 'red') : badge('Due ' + fmtDate(l.dueDate), 'gold')}</div>
        </div>
      `).join('') || emptyState('No loans yet — borrow something from the catalog'));
    }
  }

  function renderBookGrid(list) {
    return list.map((b) => `
      <div class="card">
        <strong style="font-size:13px">${escapeHtml(b.title)}</strong>
        <div class="muted" style="font-size:12px; margin:2px 0 8px">by ${escapeHtml(b.author)} · ${escapeHtml(b.category)}</div>
        <div class="flex-between">
          <span class="mono" style="font-size:11px; color:${b.availableCopies > 0 ? 'var(--green-ok)' : 'var(--red)'}">${b.availableCopies}/${b.totalCopies} available</span>
          ${isStaff ? `<button class="btn btn-sm btn-outline" data-remove-book="${b.id}">Remove</button>` : ''}
        </div>
        ${!isStaff ? `
          <div class="flex gap-8 mt-8">
            <button class="btn btn-sm btn-gold" data-borrow="${b.id}" ${b.availableCopies <= 0 ? 'disabled' : ''}>Borrow</button>
            ${isPrivate && b.price ? `<button class="btn btn-sm btn-outline" data-buy="${b.id}">Buy — GH₵${b.price}</button>` : ''}
          </div>
        ` : ''}
      </div>
    `).join('') || emptyState('No books in the catalog yet');
  }

  function wireBookGrid() {
    document.querySelectorAll('[data-borrow]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await Api.borrowBook(btn.dataset.borrow);
          toast('Borrowed — enjoy the read', 'success');
          books = await Api.libraryBooks(schoolId ? { schoolId } : {});
          if (!isStaff) myLoans = await Api.myLoans().catch(() => myLoans);
          document.getElementById('book-grid').innerHTML = renderBookGrid(books);
          wireBookGrid();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
    document.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const res = await Api.purchaseBook(btn.dataset.buy);
          toast(`Invoice created for GH₵${res.invoice.amount} — check Fees on your dashboard`, 'success');
        } catch (err) { toast(err.message, 'error'); }
      });
    });
    document.querySelectorAll('[data-remove-book]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await Api.deleteLibraryBook(btn.dataset.removeBook);
          toast('Book removed', 'success');
          books = await Api.libraryBooks(schoolId ? { schoolId } : {});
          document.getElementById('book-grid').innerHTML = renderBookGrid(books);
          wireBookGrid();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  }

  function openAddBookModal() {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Add book</h3>
      <form id="add-book-form">
        <div class="field"><label>Title</label><input name="title" required /></div>
        <div class="field"><label>Author</label><input name="author" required /></div>
        <div class="field-row">
          <div class="field"><label>Category</label><input name="category" value="General" /></div>
          <div class="field"><label>Copies</label><input name="totalCopies" type="number" value="1" min="1" /></div>
        </div>
        ${isPrivate ? `<div class="field"><label>Price (GH₵, optional — enables "Buy")</label><input name="price" type="number" /></div>` : ''}
        <button class="btn btn-primary" type="submit" style="width:100%">Add book</button>
      </form>
    `);
    onForm('add-book-form', async (data) => {
      await Api.addLibraryBook({ ...data, totalCopies: Number(data.totalCopies), price: data.price ? Number(data.price) : undefined });
      toast('Book added', 'success');
      m.remove();
      books = await Api.libraryBooks(schoolId ? { schoolId } : {});
      renderBody();
    });
  }

  render();
};

// ---------------------------------------------------------------- VIRTUAL CLASSROOM
Pages.vclassHome = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  let mySessions;
  try { mySessions = await Api.myVClassSessions(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  container.innerHTML = `
    ${dashHero(ctx, 'Host or join a live class or meeting — real video and audio, right in the browser.', `
      <button class="btn btn-gold btn-sm" id="new-session-btn">+ Start a session</button>
    `)}
    <div class="card mb-16">
      <label style="font-size:12.5px; font-weight:600; margin-bottom:8px; display:block">Join with a code</label>
      <form id="join-code-form" class="flex gap-8">
        <input name="code" placeholder="6-character code" style="text-transform:uppercase; max-width:200px" maxlength="6" required />
        <button class="btn btn-primary" type="submit">Join</button>
      </form>
      <div id="join-error" class="mt-8"></div>
    </div>
    <p class="muted" style="font-size:11px; margin-bottom:16px">
      Real peer-to-peer video and audio between browsers. Works reliably on most networks; a small number of very
      restrictive institutional firewalls may block the direct connection since this build has no relay server.
    </p>
    ${card('Sessions you\'ve hosted', mySessions.map((s) => `
      <div class="flex-between mb-8">
        <div>
          <strong style="font-size:13px">${escapeHtml(s.title)}</strong>
          <span class="muted" style="font-size:11.5px"> — code ${s.joinCode}${s.subject ? ' · ' + escapeHtml(s.subject) : ''}</span>
        </div>
        <div class="flex gap-8">
          ${s.active ? `<button class="btn btn-sm btn-gold" data-enter="${s.id}">Enter</button>` : badge('Ended', 'grey')}
        </div>
      </div>
    `).join('') || emptyState('No sessions hosted yet'))}
  `;

  document.getElementById('new-session-btn').addEventListener('click', () => {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Start a session</h3>
      <form id="new-session-form">
        <div class="field"><label>Title</label><input name="title" placeholder="e.g. JHS2 Mathematics — Fractions" required /></div>
        <div class="field"><label>Subject (optional)</label><input name="subject" /></div>
        <button class="btn btn-gold" type="submit" style="width:100%">Start now</button>
      </form>
    `);
    onForm('new-session-form', async (data) => {
      const session = await Api.createVClassSession(data);
      m.remove();
      location.hash = `#/vclass/room/${session.id}`;
      App.render();
    });
  });

  onForm('join-code-form', async (data) => {
    try {
      const session = await Api.vClassSessionByCode(data.code.toUpperCase());
      location.hash = `#/vclass/room/${session.id}`;
      App.render();
    } catch (err) {
      document.getElementById('join-error').innerHTML = `<div class="login-error">${escapeHtml(err.message)}</div>`;
    }
  });

  container.querySelectorAll('[data-enter]').forEach((btn) => {
    btn.addEventListener('click', () => { location.hash = `#/vclass/room/${btn.dataset.enter}`; App.render(); });
  });
};

// The room itself — real getUserMedia + RTCPeerConnection, one connection
// per other participant (full mesh), signaled over the WebSocket built in
// backend/utils/vclassSignaling.js. STUN only, no TURN relay in this
// build — see the note on the lobby page for what that means in practice.
Pages.vclassRoom = async function (container, ctx, sessionId) {
  container.innerHTML = `<div class="section-title">Connecting…</div>`;
  let session;
  try { session = await Api.vClassSession(sessionId); } catch (e) { container.innerHTML = emptyState(e.message); return; }
  if (!session.active) { container.innerHTML = emptyState('This session has ended'); return; }

  const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  const peers = {}; // userId -> RTCPeerConnection
  let localStream = null;
  let screenStream = null;
  let ws = null;
  let selfId = null;
  let isHost = session.hostUserId === ctx.user.id;
  let muted = false;
  let videoOff = false;
  let handRaised = false;

  container.innerHTML = `
    <div class="vclass-room">
      <div class="vclass-main">
        <div class="vclass-header">
          <div>
            <strong style="font-size:15px">${escapeHtml(session.title)}</strong>
            <span class="mono muted" style="font-size:11px; margin-left:10px">Code: ${session.joinCode}</span>
          </div>
          <div class="flex gap-8">
            ${isHost ? `<button class="btn btn-sm btn-danger" id="end-session-btn">End for everyone</button>` : ''}
            <button class="btn btn-sm btn-outline" id="leave-btn">Leave</button>
          </div>
        </div>
        <div class="vclass-grid" id="video-grid"></div>
        <div class="vclass-controls">
          <button class="vclass-ctrl" id="toggle-mute-btn" title="Mute/unmute">🎤</button>
          <button class="vclass-ctrl" id="toggle-video-btn" title="Camera on/off">📹</button>
          <button class="vclass-ctrl" id="toggle-hand-btn" title="Raise hand">✋</button>
          <button class="vclass-ctrl" id="toggle-share-btn" title="Share screen">🖥</button>
          <button class="vclass-ctrl" id="toggle-chat-btn" title="Chat">💬</button>
        </div>
      </div>
      <div class="vclass-side" id="vclass-side" style="display:none">
        <div class="vclass-side-tabs">
          <button class="pill-tab active" data-side="participants">Participants</button>
          <button class="pill-tab" data-side="chat">Chat</button>
        </div>
        <div id="vclass-side-body"></div>
      </div>
    </div>
  `;

  const videoGrid = document.getElementById('video-grid');
  let participants = [];
  let chatLog = [];
  let sideTab = 'participants';

  function addVideoTile(id, label, stream, isLocal) {
    let tile = document.getElementById(`tile-${id}`);
    if (!tile) {
      tile = document.createElement('div');
      tile.className = 'vclass-tile';
      tile.id = `tile-${id}`;
      tile.innerHTML = `<video autoplay playsinline ${isLocal ? 'muted' : ''}></video><div class="vclass-tile-label"></div>`;
      videoGrid.appendChild(tile);
    }
    const video = tile.querySelector('video');
    if (video.srcObject !== stream) video.srcObject = stream;
    tile.querySelector('.vclass-tile-label').textContent = label;
  }
  function removeVideoTile(id) {
    document.getElementById(`tile-${id}`)?.remove();
  }

  function renderSide() {
    const body = document.getElementById('vclass-side-body');
    if (sideTab === 'participants') {
      body.innerHTML = participants.map((p) => `
        <div class="flex-between mb-8">
          <span style="font-size:13px">${escapeHtml(p.name)} ${p.isHost ? badge('Host', 'gold') : ''} ${p.handRaised ? '✋' : ''}</span>
          <span class="muted" style="font-size:11px">${p.muted ? '🔇' : '🎤'} ${p.videoOff ? '📷' : ''}</span>
          ${isHost && p.userId !== selfId ? `<button class="btn btn-sm btn-outline" data-remove-participant="${p.userId}">Remove</button>` : ''}
        </div>
      `).join('');
      body.querySelectorAll('[data-remove-participant]').forEach((btn) => {
        btn.addEventListener('click', () => ws.send(JSON.stringify({ type: 'host-remove', userId: btn.dataset.removeParticipant })));
      });
    } else {
      body.innerHTML = `
        <div id="chat-messages">${chatLog.map((m) => `<div class="mb-8"><strong style="font-size:12px">${escapeHtml(m.from)}:</strong> <span style="font-size:12.5px">${escapeHtml(m.text)}</span></div>`).join('')}</div>
        <form id="chat-form" class="flex gap-8 mt-8">
          <input id="chat-input" placeholder="Message…" />
          <button class="btn btn-sm btn-primary" type="submit">Send</button>
        </form>
      `;
      document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        if (input.value.trim()) { ws.send(JSON.stringify({ type: 'chat-send', text: input.value.trim() })); input.value = ''; }
      });
    }
  }

  async function createPeerConnection(peerId, initiator) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peers[peerId] = pc;
    if (localStream) localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onicecandidate = (e) => {
      if (e.candidate) ws.send(JSON.stringify({ type: 'signal', to: peerId, data: { candidate: e.candidate } }));
    };
    pc.ontrack = (e) => {
      const name = participants.find((p) => p.userId === peerId)?.name || 'Participant';
      addVideoTile(peerId, name, e.streams[0], false);
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) removeVideoTile(peerId);
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: 'signal', to: peerId, data: { sdp: offer } }));
    }
    return pc;
  }

  async function handleSignal(from, data) {
    let pc = peers[from];
    if (!pc) pc = await createPeerConnection(from, false);
    if (data.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if (data.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'signal', to: from, data: { sdp: answer } }));
      }
    } else if (data.candidate) {
      try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* benign race, ignore */ }
    }
  }

  async function start() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      addVideoTile('self', `${ctx.user.name} (you)`, localStream, true);
    } catch (err) {
      toast('Camera/microphone not available — joining audio/video-off. ' + err.message, 'error');
    }

    ws = new WebSocket(`${WS_BASE}/ws/vclass`);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'join', token: Store.getToken(), sessionId }));
    });
    ws.addEventListener('message', async (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'joined') {
        selfId = msg.selfId;
        for (const p of msg.existingParticipants) await createPeerConnection(p.userId, true);
      } else if (msg.type === 'peer-joined') {
        // The new arrival initiates to us in their own 'joined' handler —
        // we just wait for their offer.
      } else if (msg.type === 'peer-left') {
        peers[msg.userId]?.close();
        delete peers[msg.userId];
        removeVideoTile(msg.userId);
      } else if (msg.type === 'signal') {
        await handleSignal(msg.from, msg.data);
      } else if (msg.type === 'room-state') {
        participants = msg.participants;
        if (sideTab) renderSide();
      } else if (msg.type === 'chat') {
        chatLog.push(msg.message);
        if (sideTab === 'chat') renderSide();
      } else if (msg.type === 'removed') {
        toast('You were removed from the session by the host', 'error');
        leaveRoom();
      } else if (msg.type === 'session-ended') {
        toast('The host ended this session', 'success');
        leaveRoom();
      }
    });
  }

  function leaveRoom() {
    Object.values(peers).forEach((pc) => pc.close());
    localStream?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    ws?.close();
    location.hash = '#/vclass';
    App.render();
  }

  document.getElementById('leave-btn').addEventListener('click', leaveRoom);
  const endBtn = document.getElementById('end-session-btn');
  if (endBtn) endBtn.addEventListener('click', async () => {
    if (confirm('End this session for everyone?')) { ws.send(JSON.stringify({ type: 'host-end-session' })); leaveRoom(); }
  });

  document.getElementById('toggle-mute-btn').addEventListener('click', (e) => {
    muted = !muted;
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
    e.target.classList.toggle('active', muted);
    ws.send(JSON.stringify({ type: 'update-state', muted }));
  });
  document.getElementById('toggle-video-btn').addEventListener('click', (e) => {
    videoOff = !videoOff;
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !videoOff; });
    e.target.classList.toggle('active', videoOff);
    ws.send(JSON.stringify({ type: 'update-state', videoOff }));
  });
  document.getElementById('toggle-hand-btn').addEventListener('click', (e) => {
    handRaised = !handRaised;
    e.target.classList.toggle('active', handRaised);
    ws.send(JSON.stringify({ type: 'update-state', handRaised }));
  });
  document.getElementById('toggle-share-btn').addEventListener('click', async (e) => {
    try {
      if (!screenStream) {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        Object.values(peers).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => { document.getElementById('toggle-share-btn').click(); };
        e.target.classList.add('active');
      } else {
        screenStream.getTracks().forEach((t) => t.stop());
        screenStream = null;
        const camTrack = localStream?.getVideoTracks()[0];
        Object.values(peers).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video' || !s.track);
          if (sender && camTrack) sender.replaceTrack(camTrack);
        });
        e.target.classList.remove('active');
      }
    } catch (err) { toast('Screen share unavailable: ' + err.message, 'error'); }
  });
  document.getElementById('toggle-chat-btn').addEventListener('click', () => {
    const side = document.getElementById('vclass-side');
    side.style.display = side.style.display === 'none' ? 'flex' : 'none';
    renderSide();
  });
  container.querySelectorAll('.vclass-side-tabs .pill-tab').forEach((t) => {
    t.addEventListener('click', () => {
      sideTab = t.dataset.side;
      container.querySelectorAll('.vclass-side-tabs .pill-tab').forEach((x) => x.classList.toggle('active', x === t));
      renderSide();
    });
  });

  start();
};

// ---------------------------------------------------------------- HOMEPAGE MEDIA MANAGEMENT
// Reachable from the sidebar for national executives — the public
// homepage itself is only ever shown to logged-out visitors, so
// management genuinely has to live here in the authenticated app, not
// bolted onto the public page where a signed-in exec would never see it.
Pages.homepageMedia = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  let list;
  try { list = await Api.homepageMediaList(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  function render() {
    container.innerHTML = `
      ${dashHero(ctx, 'Publish images or short videos to the public NSEMAS homepage, seen by anyone before they sign in.', `
        <button class="btn btn-gold btn-sm" id="publish-media-btn">+ Publish media</button>
      `)}
      ${card(`Published items (${list.filter((m) => m.active).length} live)`, `
        <div class="home-media-grid" style="margin-top:4px">
          ${list.map((m) => `
            <div class="home-media-card" style="${m.active ? '' : 'opacity:0.45'}">
              ${m.type === 'VIDEO'
                ? `<video src="${API_BASE}/homepage-media/file/${m.file}" controls preload="metadata"></video>`
                : `<img src="${API_BASE}/homepage-media/file/${m.file}" alt="" />`}
              <div class="home-media-caption">${escapeHtml(m.caption || '(no caption)')}
                <div class="muted" style="font-size:10.5px; margin-top:4px">By ${escapeHtml(m.publishedBy)} · ${fmtDateTime(m.publishedAt)} ${m.active ? '' : '· Removed'}</div>
              </div>
              ${m.active ? `<button class="home-media-remove" data-remove-media="${m.id}" title="Remove from homepage">✕</button>` : ''}
            </div>
          `).join('') || emptyState('Nothing published yet')}
        </div>
      `)}
    `;
    document.getElementById('publish-media-btn').addEventListener('click', openPublishModal);
    container.querySelectorAll('[data-remove-media]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this from the homepage?')) return;
        await Api.deleteHomepageMedia(btn.dataset.removeMedia);
        toast('Removed from the homepage', 'success');
        list = await Api.homepageMediaList();
        render();
      });
    });
  }

  function openPublishModal() {
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Publish to the homepage</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">Visible to everyone, including people who haven't signed in. Images (JPEG/PNG/WebP/GIF) or short videos (MP4/WebM/MOV), up to 40MB.</p>
      <form id="publish-media-form">
        <div class="field"><label>File</label><input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" required /></div>
        <div class="field"><label>Caption (optional)</label><input name="caption" placeholder="e.g. Minister visits Demo Model School" /></div>
        <button class="btn btn-gold" type="submit" style="width:100%">Publish</button>
      </form>
    `);
    onForm('publish-media-form', async (data, formEl) => {
      const file = formEl.querySelector('input[type=file]').files[0];
      if (!file) { toast('Choose a file first', 'error'); return; }
      try {
        await Api.uploadHomepageMedia(file, data.caption);
        toast('Published to the homepage', 'success');
        m.remove();
        list = await Api.homepageMediaList();
        render();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  render();
};

// ---------------------------------------------------------------- TEACHER TRANSFER REQUESTS
// A teacher requests their own relocation; approvers see it as an
// inbox item alongside their other approval work. Same visual language
// as student transfers (Pages.transfers above) since it's the same real
// concept — a multi-step chain someone can track — just a different
// requester and a different thing being moved.
Pages.teacherTransfers = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  const STEP_LABELS = {
    CLASS_TEACHER: 'Class Teacher', HEADMASTER: 'Headmaster',
    SENDING_HEADMASTER: 'Sending Headmaster', RECEIVING_HEADMASTER: 'Receiving Headmaster',
    CIRCUIT_SUPERVISOR: 'Circuit Supervisor',
    DISTRICT_DIRECTOR_SENDING: 'District Director (Sending)', DISTRICT_DIRECTOR_RECEIVING: 'District Director (Receiving)',
    REGIONAL_DIRECTOR: 'Regional Director',
    REGIONAL_DIRECTOR_SENDING: 'Regional Director (Sending)', REGIONAL_DIRECTOR_RECEIVING: 'Regional Director (Receiving)',
    GES_HEADQUARTERS: 'GES Headquarters',
  };

  const isRequester = ctx.user.role === 'TEACHER';
  let list;
  try {
    list = isRequester ? await Api.myTeacherTransfers() : await Api.teacherTransfersInbox();
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  function renderSteps(t) {
    return t.approvalChain.map((step, i) => {
      const approval = t.approvals[i];
      const cls = approval ? (approval.decision === 'REJECT' ? 'rejected' : 'done') : (i === t.approvals.length ? 'current' : '');
      return `<div class="approval-step ${cls}">
        <span class="step-dot"></span>
        <span>${STEP_LABELS[step] || step}${approval ? ` — ${escapeHtml(approval.by)} (${fmtDate(approval.at)})` : ''}</span>
      </div>`;
    }).join('');
  }

  function rowHtml(t) {
    return `
    <tr style="cursor:pointer" data-view="${t.id}">
      <td>${escapeHtml(t.teacherName)}</td>
      <td>${escapeHtml(t.fromSchoolName)} → ${escapeHtml(t.toSchoolName)}</td>
      <td>${t.approvals.length}/${t.approvalChain.length} approved</td>
      <td>${statusBadge(t.status)}</td>
      <td class="mono muted" style="font-size:11px">${fmtDate(t.submittedAt)}</td>
    </tr>`;
  }

  container.innerHTML = `
    ${isRequester ? `
      <div class="flex-between mb-16">
        <div></div>
        <button class="btn btn-gold" id="request-transfer-btn">+ Request transfer</button>
      </div>
    ` : ''}
    ${card(isRequester ? `My transfer requests (${list.length})` : `Transfer requests requiring approval (${list.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Teacher</th><th>Route</th><th>Progress</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>${list.map(rowHtml).join('') || `<tr><td colspan="5">${emptyState(isRequester ? 'You have no transfer requests' : 'Nothing pending your approval')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;

  async function openDetail(id) {
    const t = list.find((x) => x.id === id);
    if (!t) return;
    const nextStep = t.approvalChain[t.approvals.length];
    const canApprove = !isRequester && nextStep && (t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW');

    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>${escapeHtml(t.teacherName)}</h3>
      <p class="muted" style="font-size:12.5px">${escapeHtml(t.fromSchoolName)} → ${escapeHtml(t.toSchoolName)}</p>
      ${t.reason ? `<p style="font-size:13px; margin-top:8px">${escapeHtml(t.reason)}</p>` : ''}
      <hr class="divider" />
      <div>${renderSteps(t)}</div>
      ${t.status === 'REJECTED' ? `<div class="mt-16">${badge('Rejected', 'red')}</div>` : ''}
      ${t.status === 'COMPLETED' ? `<div class="mt-16">${badge('Transfer completed', 'green')}</div>` : ''}
      ${canApprove ? `
        <hr class="divider" />
        <p style="font-size:12.5px" class="muted">Next required approval: <strong>${STEP_LABELS[nextStep]}</strong></p>
        <form id="approve-teacher-transfer-form">
          <div class="field"><label>Comment (optional)</label><input name="comment" /></div>
          <div class="flex gap-8">
            <button type="submit" name="decision" value="APPROVE" class="btn btn-primary" style="flex:1">Approve step</button>
            <button type="submit" name="decision" value="REJECT" class="btn btn-danger" style="flex:1">Reject</button>
          </div>
        </form>
      ` : ''}
    `);
    const form = document.getElementById('approve-teacher-transfer-form');
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const decision = e.submitter.value;
      try {
        await Api.approveTeacherTransfer(id, decision, form.comment.value);
        toast(`Step ${decision === 'APPROVE' ? 'approved' : 'rejected'}`, decision === 'APPROVE' ? 'success' : 'error');
        m.remove();
        App.render();
      } catch (err) { toast(err.message, 'error'); }
    });
  }
  container.querySelectorAll('[data-view]').forEach((row) => {
    row.addEventListener('click', () => openDetail(row.dataset.view));
  });

  const reqBtn = document.getElementById('request-transfer-btn');
  if (reqBtn) reqBtn.addEventListener('click', async () => {
    let schoolsList = [];
    try { schoolsList = await Api.schools(); } catch {}
    const otherSchools = schoolsList.filter((s) => s.id !== ctx.user.school?.id);
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Request a transfer</h3>
      <p class="muted" style="font-size:12px; margin-bottom:14px">This starts a real approval chain — the number of steps depends on how far the move is (same circuit, district, region, or a different region entirely).</p>
      <form id="request-transfer-form">
        <div class="field"><label>Destination school</label>
          <select name="toSchoolId">${otherSchools.map((s) => `<option value="${s.id}">${escapeHtml(s.name)} — ${escapeHtml(s.district)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Reason</label><textarea name="reason" rows="3" placeholder="e.g. family relocation"></textarea></div>
        <button class="btn btn-gold" type="submit" style="width:100%">Submit request</button>
      </form>
    `);
    onForm('request-transfer-form', async (data) => {
      try {
        await Api.requestTeacherTransfer(data.toSchoolId, data.reason);
        toast('Transfer request submitted', 'success');
        m.remove();
        App.render();
      } catch (err) { toast(err.message, 'error'); }
    });
  });
};

// ---------------------------------------------------------------- TASKS
// Headmasters and equivalent managerial tiers assign real, trackable
// work to a specific teacher or student — genuinely different from a
// message or announcement, since it has a status the assignee updates
// and the assigner can follow up on.
const CAN_ASSIGN_TASKS_ROLES = [
  'HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'SCHOOL_ADMIN',
  'CIRCUIT_SUPERVISOR', 'ASSISTANT_CIRCUIT_SUPERVISOR', 'DISTRICT_DIRECTOR', 'ASSISTANT_DISTRICT_DIRECTOR',
  'REGIONAL_DIRECTOR', 'ASSISTANT_REGIONAL_DIRECTOR', 'DIRECTOR_GENERAL', 'DEPUTY_DIRECTOR_GENERAL',
  'NATIONAL_EMIS_ADMIN', 'MINISTER', 'DEPUTY_MINISTER',
];
const TASK_STATUS_BADGE = { PENDING: 'grey', IN_PROGRESS: 'gold', DONE: 'green' };

Pages.tasks = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  const canAssign = CAN_ASSIGN_TASKS_ROLES.includes(ctx.user.role);

  let myTasks = [];
  let assignedTasks = [];
  try {
    myTasks = await Api.myTasks();
    if (canAssign) assignedTasks = await Api.tasksAssigned();
  } catch (e) { container.innerHTML = emptyState(e.message); return; }

  function taskRow(t, isMine) {
    return `
      <tr>
        <td>${escapeHtml(t.title)}</td>
        <td>${escapeHtml(isMine ? t.assignedByName : t.assignedToName)}</td>
        <td>${t.dueDate ? fmtDate(t.dueDate) : '—'}</td>
        <td>${badge(t.priority, t.priority === 'HIGH' ? 'red' : t.priority === 'LOW' ? 'grey' : 'gold')}</td>
        <td>${badge(t.status.replace('_', ' '), TASK_STATUS_BADGE[t.status])}</td>
        ${isMine ? `<td>${t.status !== 'DONE' ? `<select data-task-status="${t.id}"><option value="PENDING" ${t.status === 'PENDING' ? 'selected' : ''}>Pending</option><option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>In progress</option><option value="DONE">Mark done</option></select>` : '—'}</td>` : ''}
      </tr>`;
  }

  container.innerHTML = `
    ${canAssign ? `
      <div class="flex-between mb-16"><div></div><button class="btn btn-gold" id="assign-task-btn">+ Assign a task</button></div>
    ` : ''}
    ${card(`My tasks (${myTasks.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Task</th><th>From</th><th>Due</th><th>Priority</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>${myTasks.map((t) => taskRow(t, true)).join('') || `<tr><td colspan="6">${emptyState('No tasks assigned to you')}</td></tr>`}</tbody>
      </table></div>
    `)}
    ${canAssign ? card(`Tasks I've assigned (${assignedTasks.length})`, `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Task</th><th>Assigned to</th><th>Due</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>${assignedTasks.map((t) => taskRow(t, false)).join('') || `<tr><td colspan="5">${emptyState('You have not assigned any tasks yet')}</td></tr>`}</tbody>
      </table></div>
    `) : ''}
  `;

  container.querySelectorAll('[data-task-status]').forEach((sel) => {
    sel.addEventListener('change', async () => {
      try {
        await Api.updateTaskStatus(sel.dataset.taskStatus, sel.value);
        toast('Task updated', 'success');
        App.render();
      } catch (err) { toast(err.message, 'error'); }
    });
  });

  const assignBtn = document.getElementById('assign-task-btn');
  if (assignBtn) assignBtn.addEventListener('click', async () => {
    let teachersList = [];
    let studentsList = [];
    try { [teachersList, studentsList] = await Promise.all([Api.teachers(), Api.students()]); } catch {}
    const m = modal(`
      <button class="close-x" onclick="closeModal(this)">✕</button>
      <h3>Assign a task</h3>
      <form id="assign-task-form">
        <div class="field"><label>Assign to</label>
          <select name="assignedToUserId">
            <optgroup label="Teachers">${teachersList.filter((t) => t.userId).map((t) => `<option value="${t.userId}">${escapeHtml(t.name)}</option>`).join('')}</optgroup>
            <optgroup label="Students">${studentsList.filter((s) => s.userId).map((s) => `<option value="${s.userId}">${escapeHtml(s.name)} — ${escapeHtml(s.class)}</option>`).join('')}</optgroup>
          </select>
        </div>
        <div class="field"><label>Title</label><input name="title" required /></div>
        <div class="field"><label>Description</label><textarea name="description" rows="3"></textarea></div>
        <div class="field-row">
          <div class="field"><label>Due date</label><input name="dueDate" type="date" /></div>
          <div class="field"><label>Priority</label><select name="priority"><option value="NORMAL" selected>Normal</option><option value="HIGH">High</option><option value="LOW">Low</option></select></div>
        </div>
        <button class="btn btn-gold" type="submit" style="width:100%">Assign task</button>
      </form>
    `);
    onForm('assign-task-form', async (data) => {
      try {
        await Api.assignTask(data);
        toast('Task assigned', 'success');
        m.remove();
        App.render();
      } catch (err) { toast(err.message, 'error'); }
    });
  });
};

// ---------------------------------------------------------------- APPROVAL CENTRE
// One real console for everything currently waiting on this specific
// person's decision — not a fabricated summary, a genuine aggregation
// of leave requests and transfer approvals filtered down to exactly
// what they're eligible to act on right now.
const APPROVAL_KIND_ICON = { LEAVE_REQUEST: '⏱', STUDENT_TRANSFER: '⇄', TEACHER_TRANSFER: '⇉' };
const APPROVAL_KIND_LABEL = { LEAVE_REQUEST: 'Leave request', STUDENT_TRANSFER: 'Student transfer', TEACHER_TRANSFER: 'Teacher transfer' };

Pages.approvalCentre = async function (container, ctx) {
  container.innerHTML = `<div class="section-title">Loading…</div>`;
  let data;
  try { data = await Api.approvalCentre(); } catch (e) { container.innerHTML = emptyState(e.message); return; }

  container.innerHTML = `
    ${dashHero(ctx, `${data.counts.total} item${data.counts.total === 1 ? '' : 's'} waiting on your decision.`, '')}
    <div class="stat-grid mb-16">
      ${statCard('Leave requests', data.counts.LEAVE_REQUEST, '⏱')}
      ${statCard('Student transfers', data.counts.STUDENT_TRANSFER, '⇄')}
      ${statCard('Teacher transfers', data.counts.TEACHER_TRANSFER, '⇉')}
    </div>
    ${card('Everything pending your approval', `
      <div class="table-wrap"><table class="ledger">
        <thead><tr><th>Type</th><th>Item</th><th>Detail</th><th>Submitted</th><th></th></tr></thead>
        <tbody>${data.items.map((i) => `
          <tr>
            <td>${APPROVAL_KIND_ICON[i.kind] || '•'} ${escapeHtml(APPROVAL_KIND_LABEL[i.kind] || i.kind)}</td>
            <td>${escapeHtml(i.title)}</td>
            <td class="muted" style="font-size:12px">${escapeHtml(i.detail)}</td>
            <td class="mono muted" style="font-size:11px">${fmtDate(i.submittedAt)}</td>
            <td><a href="${i.link}" class="btn btn-sm btn-outline">Review</a></td>
          </tr>
        `).join('') || `<tr><td colspan="5">${emptyState('Nothing pending your approval right now')}</td></tr>`}</tbody>
      </table></div>
    `)}
  `;
};
