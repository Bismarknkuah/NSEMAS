/* NSEMAS — thin fetch wrapper against the backend REST API */
const API_BASE = `${(window.NSEMAS_CONFIG && window.NSEMAS_CONFIG.API_BASE) || ''}/api`;
// Same-origin default -> derive from the current page. Split-deployment
// override -> convert the configured http(s) URL to ws(s).
const WS_BASE = (window.NSEMAS_CONFIG && window.NSEMAS_CONFIG.API_BASE)
  ? window.NSEMAS_CONFIG.API_BASE.replace(/^http/, 'ws')
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

const Store = {
  getToken() { return localStorage.getItem('nsemas_token'); },
  setToken(t) { localStorage.setItem('nsemas_token', t); },
  clearToken() { localStorage.removeItem('nsemas_token'); },
  getUser() { try { return JSON.parse(localStorage.getItem('nsemas_user')); } catch { return null; } },
  setUser(u) { localStorage.setItem('nsemas_user', JSON.stringify(u)); },
  clearUser() { localStorage.removeItem('nsemas_user'); },
};

async function apiCall(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Store.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Network error — is the NSEMAS backend running?');
  }

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    if (res.status === 401) {
      Store.clearToken(); Store.clearUser();
      window.location.hash = '#/login';
    }
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

const Api = {
  forgotPassword: (username) => apiCall('POST', '/auth/forgot-password', { username }),
  resetPassword: (username, code, newPassword) => apiCall('POST', '/auth/reset-password', { username, code, newPassword }),
  login: (username, password) => apiCall('POST', '/auth/login', { username, password }),
  me: () => apiCall('GET', '/auth/me'),

  schools: () => apiCall('GET', '/schools'),
  school: (id) => apiCall('GET', `/schools/${id}`),

  students: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall('GET', `/students${qs ? '?' + qs : ''}`);
  },
  student: (id) => apiCall('GET', `/students/${id}`),
  admitStudent: (body) => apiCall('POST', '/students', body),
  bulkAdmitStudents: (rows) => apiCall('POST', '/students/bulk', { rows }),
  enrollBiometric: (id, method) => apiCall('POST', `/students/${id}/enroll-biometric`, { method }),
  captureFingerprint: (id, fingerIndex = 0) => apiCall('POST', `/students/${id}/biometric/capture`, { fingerIndex }),
  trainFingerprint: (id, samples) => apiCall('POST', `/students/${id}/biometric/enroll`, { samples }),
  addStudentNote: (id, type, note) => apiCall('POST', `/students/${id}/notes`, { type, note }),

  checkIn: (studentId, method, simulateImposter) => apiCall('POST', '/attendance/check-in', { studentId, method, simulateImposter }),
  manualRegister: (records) => apiCall('POST', '/attendance/manual-register', { records }),
  todayAttendance: (schoolId, date) => apiCall('GET', `/attendance/school/${schoolId}/today${date ? '?date=' + date : ''}`),
  attendanceReport: (schoolId) => apiCall('GET', `/attendance/school/${schoolId}/report`),
  teacherClock: (teacherId, action) => apiCall('POST', '/attendance/teacher-clock', { teacherId, action }),

  promotionRules: () => apiCall('GET', '/promotion/rules'),
  setPromotionRules: (level, schoolType, rules) => apiCall('POST', '/promotion/rules', { level, schoolType, rules }),
  evaluatePromotion: (studentId, academicScore) => apiCall('POST', `/promotion/evaluate/${studentId}`, { academicScore }),
  decidePromotion: (studentId, body) => apiCall('POST', `/promotion/decide/${studentId}`, body),
  promotionHistory: (studentId) => apiCall('GET', `/promotion/history/${studentId}`),
  schoolPromotions: (schoolId) => apiCall('GET', `/promotion/school/${schoolId}`),

  createTransfer: (studentId, toSchoolId, reason) => apiCall('POST', '/transfers', { studentId, toSchoolId, reason }),
  transfers: (status) => apiCall('GET', `/transfers${status ? '?status=' + status : ''}`),
  transfer: (id) => apiCall('GET', `/transfers/${id}`),
  approveTransfer: (id, decision, comment) => apiCall('POST', `/transfers/${id}/approve`, { decision, comment }),

  teachers: (schoolId) => apiCall('GET', `/teachers${schoolId ? '?schoolId=' + schoolId : ''}`),
  teacher: (id) => apiCall('GET', `/teachers/${id}`),
  submitLessonPlan: (teacherId, body) => apiCall('POST', `/teachers/${teacherId}/lesson-plans`, body),

  inspections: (schoolId) => apiCall('GET', `/inspections${schoolId ? '?schoolId=' + schoolId : ''}`),
  createInspection: (body) => apiCall('POST', '/inspections', body),
  inspectionSummary: (schoolId) => apiCall('GET', `/inspections/school/${schoolId}/summary`),

  dashboardSummary: () => apiCall('GET', '/dashboard/summary'),
  dashboardGis: () => apiCall('GET', '/dashboard/gis'),

  assets: (schoolId) => apiCall('GET', `/infrastructure${schoolId ? '?schoolId=' + schoolId : ''}`),
  createAsset: (body) => apiCall('POST', '/infrastructure', body),
  updateAsset: (id, patch) => apiCall('PATCH', `/infrastructure/${id}`, patch),
  maintenanceRequests: (schoolId) => apiCall('GET', `/infrastructure/maintenance${schoolId ? '?schoolId=' + schoolId : ''}`),
  createMaintenanceRequest: (body) => apiCall('POST', '/infrastructure/maintenance', body),
  updateMaintenanceStatus: (id, status) => apiCall('PATCH', `/infrastructure/maintenance/${id}`, { status }),
  infrastructureSummary: (schoolId) => apiCall('GET', `/infrastructure/school/${schoolId}/summary`),

  aiDropoutRisk: () => apiCall('GET', '/ai/dropout-risk'),
  aiTeacherAbsenteeism: () => apiCall('GET', '/ai/teacher-absenteeism'),
  aiStrugglingSchools: () => apiCall('GET', '/ai/struggling-schools'),
  aiEnrollmentForecast: () => apiCall('GET', '/ai/enrollment-forecast'),

  announcements: () => apiCall('GET', '/announcements'),
  createAnnouncement: (body) => apiCall('POST', '/announcements', body),
  publicAnnouncements: () => apiCall('GET', '/announcements/public'),

  myChild: (studentId) => apiCall('GET', `/portal/my-child${studentId ? '?studentId=' + studentId : ''}`),
  myChildren: () => apiCall('GET', '/portal/my-children'),
  myProfile: () => apiCall('GET', '/portal/my-profile'),

  // Academics: curriculum, timetable, exams, report cards
  subjects: (level) => apiCall('GET', `/academics/subjects${level ? '?level=' + level : ''}`),
  createSubject: (body) => apiCall('POST', '/academics/subjects', body),
  timetable: (schoolId, klass) => apiCall('GET', `/academics/timetable/${schoolId}${klass ? '?class=' + encodeURIComponent(klass) : ''}`),
  setTimetableEntry: (body) => apiCall('POST', '/academics/timetable', body),
  deleteTimetableEntry: (id) => apiCall('DELETE', `/academics/timetable/${id}`),
  exams: (schoolId, klass) => {
    const params = new URLSearchParams();
    if (schoolId) params.set('schoolId', schoolId);
    if (klass) params.set('class', klass);
    return apiCall('GET', `/academics/exams${params.toString() ? '?' + params.toString() : ''}`);
  },
  createExam: (body) => apiCall('POST', '/academics/exams', body),
  examResults: (examId) => apiCall('GET', `/academics/exams/${examId}/results`),
  addExamQuestion: (examId, body) => apiCall('POST', `/academics/exams/${examId}/questions`, body),
  examQuestions: (examId) => apiCall('GET', `/academics/exams/${examId}/questions`),
  submitExam: (examId, answers) => apiCall('POST', `/academics/exams/${examId}/submit`, { answers }),
  publishExamResults: (examId, published) => apiCall('PATCH', `/academics/exams/${examId}/publish-results`, { published }),
  myExams: () => apiCall('GET', '/academics/my-exams'),
  createFeeStructure: (body) => apiCall('POST', '/finance/fee-structures', body),
  feeStructures: (schoolId) => apiCall('GET', `/finance/fee-structures?schoolId=${schoolId}`),
  generateInvoices: (feeId, dueDate) => apiCall('POST', `/finance/fee-structures/${feeId}/generate-invoices`, { dueDate }),
  createInvoice: (body) => apiCall('POST', '/finance/invoices', body),
  studentFinanceSummary: (studentId) => apiCall('GET', `/finance/students/${studentId}/summary`),
  recordPayment: (invoiceId, body) => apiCall('POST', `/finance/invoices/${invoiceId}/payments`, body),
  schoolFinanceSummary: (schoolId) => apiCall('GET', `/finance/schools/${schoolId}/summary`),
  schoolInvoices: (schoolId) => apiCall('GET', `/finance/schools/${schoolId}/invoices`),
  addLibraryBook: (body) => apiCall('POST', '/library/books', body),
  libraryBooks: (params = {}) => apiCall('GET', `/library/books${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  deleteLibraryBook: (id) => apiCall('DELETE', `/library/books/${id}`),
  borrowBook: (id) => apiCall('POST', `/library/books/${id}/borrow`),
  returnLoan: (id) => apiCall('POST', `/library/loans/${id}/return`),
  myLoans: () => apiCall('GET', '/library/my-loans'),
  allLoans: () => apiCall('GET', '/library/loans'),
  purchaseBook: (id) => apiCall('POST', `/library/books/${id}/purchase-request`),
  createVClassSession: (body) => apiCall('POST', '/vclass/sessions', body),
  myVClassSessions: () => apiCall('GET', '/vclass/sessions/mine'),
  vClassSessionByCode: (code) => apiCall('GET', `/vclass/sessions/by-code/${code}`),
  vClassSession: (id) => apiCall('GET', `/vclass/sessions/${id}`),
  endVClassSession: (id) => apiCall('POST', `/vclass/sessions/${id}/end`),
  askQuestion: (questionText, subject) => apiCall('POST', '/qa/ask', { questionText, subject }),
  myQuestions: () => apiCall('GET', '/qa/my-questions'),
  pendingQuestions: () => apiCall('GET', '/qa/pending'),
  answerQuestion: (id, answerText) => apiCall('POST', `/qa/questions/${id}/answer`, { answerText }),
  knowledgeBase: (params = {}) => apiCall('GET', `/qa/knowledge-base${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  askChatbot: (message) => apiCall('POST', '/chatbot/ask', { message }),
  mySupervisor: () => apiCall('GET', '/reports/my-supervisor'),
  submitReport: (subject, body) => apiCall('POST', '/reports', { subject, body }),
  reportsInbox: () => apiCall('GET', '/reports/inbox'),
  reportsSent: () => apiCall('GET', '/reports/sent'),
  respondToReport: (id, status, response) => apiCall('POST', `/reports/${id}/respond`, { status, response }),
  submitExamResults: (examId, scores) => apiCall('POST', `/academics/exams/${examId}/results`, { scores }),
  reportCard: (studentId, academicYear, term) => {
    const params = new URLSearchParams();
    if (academicYear) params.set('academicYear', academicYear);
    if (term) params.set('term', term);
    return apiCall('GET', `/academics/report-card/${studentId}${params.toString() ? '?' + params.toString() : ''}`);
  },

  // Teacher leave management
  leaveRequests: (params = {}) => apiCall('GET', `/leave${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  requestLeave: (body) => apiCall('POST', '/leave', body),
  decideLeave: (id, decision, note) => apiCall('POST', `/leave/${id}/decide`, { decision, note }),
  leaveSummary: (schoolId) => apiCall('GET', `/leave/summary/${schoolId}`),

  // Messaging & notifications
  threads: () => apiCall('GET', '/messages/threads'),
  thread: (threadKey) => apiCall('GET', `/messages/threads/${encodeURIComponent(threadKey)}`),
  sendMessage: (toUserId, body, studentId) => apiCall('POST', '/messages/send', { toUserId, body, studentId }),
  notifications: () => apiCall('GET', '/messages/notifications'),
  markNotificationRead: (id) => apiCall('POST', `/messages/notifications/${id}/read`),
  markAllNotificationsRead: () => apiCall('POST', '/messages/notifications/read-all'),
  outbox: () => apiCall('GET', '/messages/outbox'),

  // Assignments / homework
  assignments: (params = {}) => apiCall('GET', `/assignments${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  createAssignment: (body) => apiCall('POST', '/assignments', body),
  createAssignmentWithFile: async (formElement, schoolId) => {
    const fd = new FormData(formElement);
    fd.set('schoolId', schoolId);
    const fileInput = formElement.querySelector('input[type=file]');
    if (fileInput && (!fileInput.files || fileInput.files.length === 0)) fd.delete(fileInput.name);
    const headers = {};
    const token = Store.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/assignments`, { method: 'POST', headers, body: fd });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'Failed to create assignment');
    return data;
  },
  assignmentSubmissions: (id) => apiCall('GET', `/assignments/${id}/submissions`),
  submitAssignment: (id, content) => apiCall('POST', `/assignments/${id}/submit`, { content }),
  submitAssignmentWithFile: async (id, formElement) => {
    const fd = new FormData(formElement);
    const fileInput = formElement.querySelector('input[type=file]');
    if (fileInput && (!fileInput.files || fileInput.files.length === 0)) fd.delete(fileInput.name);
    const headers = {};
    const token = Store.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/assignments/${id}/submit`, { method: 'POST', headers, body: fd });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'Failed to submit');
    return data;
  },
  startAssignment: (id) => apiCall('POST', `/assignments/${id}/start`),
  myAssignments: () => apiCall('GET', '/assignments/my/list'),
  childAssignments: (studentId) => apiCall('GET', `/assignments/for-child/${studentId}`),
  requestTeacherTransfer: (toSchoolId, reason) => apiCall('POST', '/teacher-transfers', { toSchoolId, reason }),
  myTeacherTransfers: () => apiCall('GET', '/teacher-transfers/mine'),
  teacherTransfersInbox: (status) => apiCall('GET', `/teacher-transfers${status ? `?status=${status}` : ''}`),
  approveTeacherTransfer: (id, decision, comment) => apiCall('POST', `/teacher-transfers/${id}/approve`, { decision, comment }),
  downloadAssignmentAttachment: async (id, filename) => {
    const headers = {};
    const token = Store.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/assignments/${id}/attachment`, { headers });
    if (!res.ok) throw new Error('Could not download the file');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename || 'attachment'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
  downloadSubmissionAttachment: async (id, studentId, filename) => {
    const headers = {};
    const token = Store.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/assignments/${id}/submissions/${studentId}/attachment`, { headers });
    if (!res.ok) throw new Error('Could not download the file');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename || 'submission'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
  deleteAssignment: (id) => apiCall('DELETE', `/assignments/${id}`),
  gradeAssignment: (id, studentId, grade, feedback) => apiCall('POST', `/assignments/${id}/submissions/${studentId}/grade`, { grade, feedback }),

  publicHomepageMedia: () => apiCall('GET', '/homepage-media/active'),
  homepageMediaList: () => apiCall('GET', '/homepage-media'),
  uploadHomepageMedia: async (file, caption) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('caption', caption || '');
    const headers = {};
    const token = Store.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/homepage-media`, { method: 'POST', headers, body: fd });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || 'Failed to publish');
    return data;
  },
  deleteHomepageMedia: (id) => apiCall('DELETE', `/homepage-media/${id}`),

  // Learning materials
  materials: (params = {}) => apiCall('GET', `/academics/materials${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  createMaterial: (body) => apiCall('POST', '/academics/materials', body),
  deleteMaterial: (id) => apiCall('DELETE', `/academics/materials/${id}`),

  // Alumni
  alumni: (params = {}) => apiCall('GET', `/alumni${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  alumnusDetail: (id) => apiCall('GET', `/alumni/${id}`),
  alumniSummary: (schoolId) => apiCall('GET', `/alumni/summary/${schoolId}`),

  // MFA
  mfaSetup: () => apiCall('POST', '/auth/mfa/setup'),
  mfaConfirm: (code) => apiCall('POST', '/auth/mfa/confirm', { code }),
  mfaDisable: (password) => apiCall('POST', '/auth/mfa/disable', { password }),
  mfaVerifyLogin: (pendingToken, code) => apiCall('POST', '/auth/mfa/verify-login', { pendingToken, code }),

  // National Examinations Council (BECE/WASSCE)
  examCandidates: (params = {}) => apiCall('GET', `/national-exams/candidates${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  registerCandidate: (studentId, examType) => apiCall('POST', '/national-exams/candidates/register', { studentId, examType }),
  syncNationalExams: (schoolId) => apiCall('POST', '/national-exams/sync', { schoolId }),
  nationalExamResults: (params = {}) => apiCall('GET', `/national-exams/results${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  verifyNationalExamResult: (indexNumber, serialPin) => apiCall('POST', '/national-exams/verify', { indexNumber, serialPin }),

  // Executive role appointments (student leadership / teacher coordination titles)
  myAppointments: () => apiCall('GET', '/appointments/mine'),
  schoolAppointments: (schoolId) => apiCall('GET', `/appointments${schoolId ? '?schoolId=' + schoolId : ''}`),
  assignAppointment: (userId, role, label, house) => apiCall('POST', '/appointments', { userId, role, label, house }),
  revokeAppointment: (id) => apiCall('POST', `/appointments/${id}/revoke`),
  switchRoleView: (appointmentId) => apiCall('POST', '/appointments/switch', { appointmentId: appointmentId || null }),
  demoQuickLogin: (baseUsername, role) => apiCall('POST', '/appointments/demo-quick-login', { baseUsername, role }),

  // Profile management
  updateProfile: (body) => apiCall('PATCH', '/profile', body),
  changePassword: (currentPassword, newPassword) => apiCall('POST', '/profile/change-password', { currentPassword, newPassword }),
  uploadProfilePicture: (imageDataUri) => apiCall('POST', '/profile/picture', { imageDataUri }),
  removeProfilePicture: () => apiCall('DELETE', '/profile/picture'),

  // Group messaging
  myGroups: () => apiCall('GET', '/groups'),
  createGroup: (name, description, memberUserIds) => apiCall('POST', '/groups', { name, description, memberUserIds }),
  addGroupMember: (groupId, userId) => apiCall('POST', `/groups/${groupId}/members`, { userId }),
  leaveGroup: (groupId) => apiCall('POST', `/groups/${groupId}/leave`),
  groupMessages: (groupId) => apiCall('GET', `/groups/${groupId}/messages`),
  sendGroupText: (groupId, body) => apiCall('POST', `/groups/${groupId}/messages`, { type: 'TEXT', body }),
  sendGroupFile: (groupId, fileName, mimeType, fileDataUri) => apiCall('POST', `/groups/${groupId}/messages`, { type: 'FILE', fileName, mimeType, fileDataUri }),
  sendGroupAudio: (groupId, audioDataUri) => apiCall('POST', `/groups/${groupId}/messages`, { type: 'AUDIO', audioDataUri }),
  addableCandidates: () => apiCall('GET', '/groups/candidates/addable'),
  addGroupMembersBulk: (groupId, userIds) => apiCall('POST', `/groups/${groupId}/members/bulk`, { userIds }),
  myGroupInvites: () => apiCall('GET', '/groups/my-invites'),
  respondToGroupInvite: (groupId, accept) => apiCall('POST', `/groups/${groupId}/invites/respond`, { accept }),
  groupJoinCode: (groupId) => apiCall('GET', `/groups/${groupId}/join-code`),
  joinGroupByCode: (code) => apiCall('POST', `/groups/join/${code}`),
  groupJoinRequests: (groupId) => apiCall('GET', `/groups/${groupId}/join-requests`),
  respondToJoinRequest: (groupId, userId, action) => apiCall('POST', `/groups/${groupId}/join-requests/${userId}/${action}`),

  // System Administration (NATIONAL_EMIS_ADMIN only)
  adminStats: () => apiCall('GET', '/admin/stats'),
  adminSearchUsers: (params = {}) => apiCall('GET', `/admin/users${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`),
  adminToggleActive: (userId) => apiCall('POST', `/admin/users/${userId}/toggle-active`),
  adminRoles: () => apiCall('GET', '/admin/roles'),
  adminRegions: () => apiCall('GET', '/admin/regions'),
  approvalCentre: () => apiCall('GET', '/approvals'),
  adminCreateUser: (body) => apiCall('POST', '/admin/users', body),
  adminReassignRole: (userId, role, scope) => apiCall('PATCH', `/admin/users/${userId}/role`, { role, scope }),
  adminCreateCustomPosition: (body) => apiCall('POST', '/admin/custom-positions', body),
  adminCustomPositions: () => apiCall('GET', '/admin/custom-positions'),
  assignTask: (body) => apiCall('POST', '/tasks', body),
  myTasks: () => apiCall('GET', '/tasks/mine'),
  tasksAssigned: () => apiCall('GET', '/tasks/assigned'),
  updateTaskStatus: (id, status) => apiCall('PATCH', `/tasks/${id}/status`, { status }),
  adminDeleteCustomPosition: (id) => apiCall('DELETE', `/admin/custom-positions/${id}`),
  adminAuditLog: () => apiCall('GET', '/admin/audit-log'),
};

// Export is a file download (binary blob), not JSON, so it bypasses the
// normal apiCall wrapper — but uses the same auth token and base URL.
async function downloadExport(format, title, columns, rows) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Store.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ format, title, columns, rows }),
  });
  if (!res.ok) {
    let msg = 'Export failed';
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const ext = { csv: 'csv', excel: 'xlsx', pdf: 'pdf', word: 'docx' }[format];
  const filename = `${title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'export'}.${ext}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
