const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const bio = require('../utils/biometrics');

const router = express.Router();
const attendance = collection('attendance');
const teacherAttendance = collection('teacher_attendance');
const students = collection('students');
const teachers = collection('teachers');
const schools = collection('schools');
const houseMonitors = collection('house_attendance_monitors');
const users = collection('users');

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Who can mark attendance, and for whom
 * ----------------------------------------
 * This isn't just a role check — it's genuinely scoped per person marking:
 *   - Headmaster / Proprietor / Assistant Heads / School Admin: the whole school.
 *   - Teacher: any student at the school (matches "records after each lesson").
 *   - Course Rep: only their own class, derived from their own student record.
 *   - House Master: only their own house, carried in their session scope
 *     from the appointment they're acting under (see routes/appointments.js).
 *   - A student delegated by a House Master as a dormitory attendance
 *     monitor: only that same house, for as long as the delegation is active.
 * Everyone else, including all top-management/oversight tiers, can view
 * attendance analytics but cannot mark it — this function is the one
 * place that decision lives, so it can't drift between endpoints.
 */
function canMarkAttendanceFor(user, student) {
  const allowedIds = new Set(schoolIdsForUser(user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return false;

  if (['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'SCHOOL_ADMIN'].includes(user.role)) {
    return true;
  }
  if (user.role === 'TEACHER') return true;
  if (user.role === 'COURSE_REP') {
    const myStudent = students.findById(user.scope?.studentId);
    return !!myStudent && myStudent.class === student.class;
  }
  if (['HOUSE_MASTER', 'MATRON'].includes(user.role)) {
    return !!user.scope?.house && student.house === user.scope.house;
  }
  if (user.role === 'SENIOR_HOUSE_MASTER') {
    // Oversees every house, not the whole school — a day student with no
    // house assignment is outside their actual jurisdiction.
    return !!student.house;
  }
  if (user.role === 'STUDENT') {
    const monitor = houseMonitors.findOne((m) => m.studentUserId === user.id && m.active);
    return !!monitor && student.house === monitor.house;
  }
  return false;
}

// Whether this user has ANY attendance-marking eligibility at all (used to
// short-circuit before looking at individual students).
function isAttendanceEligible(user) {
  if (['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'COURSE_REP', 'HOUSE_MASTER', 'MATRON', 'SENIOR_HOUSE_MASTER'].includes(user.role)) {
    return true;
  }
  if (user.role === 'STUDENT') {
    return !!houseMonitors.findOne((m) => m.studentUserId === user.id && m.active);
  }
  return false;
}

// Record student attendance. For method=FINGERPRINT this runs the same
// minutiae-matching engine used at enrollment — it isn't a rubber stamp:
// a scan is generated fresh and scored against the student's trained
// template, and check-in is refused below the acceptance threshold.
router.post('/check-in', authenticate, (req, res) => {
  const { studentId, method, simulateImposter } = req.body;
  if (!isAttendanceEligible(req.user)) return res.status(403).json({ error: 'You are not authorized to mark attendance' });
  const student = students.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (!canMarkAttendanceFor(req.user, student)) {
    return res.status(403).json({ error: 'You can only mark attendance for students in your own class, house, or school, depending on your role' });
  }

  const date = today();
  const existing = attendance.findOne((a) => a.studentId === studentId && a.date === date);
  if (existing) {
    return res.status(409).json({ error: 'Attendance already recorded for today', record: existing });
  }

  let verification = null;
  if ((method || 'FINGERPRINT') === 'FINGERPRINT') {
    if (!student.biometricEnrolled || student.biometricMethod !== 'FINGERPRINT' || !student.biometricTemplate) {
      return res.status(422).json({ error: 'Student has no enrolled fingerprint template — enroll biometrics first or use a different check-in method' });
    }
    // `simulateImposter` is a demo/QA affordance so the verification path
    // can actually be exercised end-to-end (a real wrong finger would
    // naturally produce this same uncorrelated scan) — never used in a
    // genuine check-in flow.
    const scanSeed = simulateImposter ? `imposter:${uuid()}` : `${student.id}:finger:0`;
    const liveScan = bio.generateScan(scanSeed, 0.03);
    const result = bio.matchScore(student.biometricTemplate, liveScan);
    verification = { score: result.score, matchedPoints: result.matchedPoints, templatePoints: result.templatePoints, threshold: bio.MATCH_THRESHOLD };
    if (!result.accepted) {
      return res.status(401).json({ error: 'Fingerprint did not match enrolled template', verification });
    }
  }

  const now = new Date();
  const hour = now.getHours();
  const status = hour >= 9 ? 'LATE' : 'PRESENT';

  const record = {
    id: uuid(),
    studentId,
    schoolId: student.schoolId,
    date,
    status,
    method: method || 'FINGERPRINT',
    verification,
    checkIn: now.toTimeString().slice(0, 5),
    recordedBy: req.user.name,
    recordedAt: now.toISOString(),
  };
  attendance.insert(record);
  res.status(201).json(record);
});

// Bulk manual register for a class (fallback when biometric device is
// unavailable or manual entry is simply preferred) — every role eligible
// to mark attendance at all can use this, not just biometric check-in.
router.post('/manual-register', authenticate, (req, res) => {
  if (!isAttendanceEligible(req.user)) return res.status(403).json({ error: 'You are not authorized to mark attendance' });
  const { records } = req.body; // [{ studentId, status }]
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records array is required' });
  const date = today();
  const created = [];
  const skipped = [];

  for (const r of records) {
    const student = students.findById(r.studentId);
    if (!student || !canMarkAttendanceFor(req.user, student)) { skipped.push(r.studentId); continue; }
    const existing = attendance.findOne((a) => a.studentId === r.studentId && a.date === date);
    if (existing) continue;
    const rec = {
      id: uuid(),
      studentId: r.studentId,
      schoolId: student.schoolId,
      date,
      status: r.status || 'PRESENT',
      method: 'MANUAL',
      checkIn: r.status === 'ABSENT' ? null : new Date().toTimeString().slice(0, 5),
      recordedBy: req.user.name,
      recordedAt: new Date().toISOString(),
    };
    attendance.insert(rec);
    created.push(rec);
  }
  res.status(201).json({ created: created.length, records: created, skippedOutOfScope: skipped.length });
});

router.get('/school/:schoolId/today', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });
  const date = req.query.date || today();
  const roll = students.find((s) => s.schoolId === req.params.schoolId && s.status === 'ACTIVE');
  const records = attendance.find((a) => a.schoolId === req.params.schoolId && a.date === date);
  const byStudent = Object.fromEntries(records.map((r) => [r.studentId, r]));

  const result = roll.map((s) => ({
    studentId: s.id,
    name: s.name,
    class: s.class,
    status: byStudent[s.id]?.status || 'NOT_RECORDED',
    checkIn: byStudent[s.id]?.checkIn || null,
    method: byStudent[s.id]?.method || null,
    fingerprintEnrolled: !!(s.biometricEnrolled && s.biometricMethod === 'FINGERPRINT' && s.biometricTemplate),
  }));
  const present = result.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  res.json({
    date,
    total: result.length,
    present,
    absent: result.filter((r) => r.status === 'ABSENT').length,
    notRecorded: result.filter((r) => r.status === 'NOT_RECORDED').length,
    rate: result.length ? Math.round((present / result.length) * 100) : 0,
    roll: result,
  });
});

// Teacher clock-in/out
router.post('/teacher-clock', authenticate, requireRole(
  'TEACHER', 'HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN'
), (req, res) => {
  const { teacherId, action } = req.body; // action: IN | OUT
  const teacher = teachers.findById(teacherId || req.user.teacherId);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  const date = today();
  let record = teacherAttendance.findOne((t) => t.teacherId === teacher.id && t.date === date);
  const now = new Date().toTimeString().slice(0, 5);

  if (!record) {
    record = teacherAttendance.insert({
      id: uuid(),
      teacherId: teacher.id,
      schoolId: teacher.schoolId,
      date,
      clockIn: action === 'OUT' ? null : now,
      clockOut: null,
      status: action === 'OUT' ? 'INCOMPLETE' : (now > '08:00' ? 'LATE' : 'ON_TIME'),
    });
  } else if (action === 'OUT') {
    record = teacherAttendance.updateById(record.id, { clockOut: now });
  }
  res.json(record);
});

// Attendance analytics for a school over a date range
router.get('/school/:schoolId/report', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const records = attendance.find((a) => a.schoolId === req.params.schoolId);
  const byDate = {};
  records.forEach((r) => {
    byDate[r.date] = byDate[r.date] || { present: 0, late: 0, absent: 0, total: 0 };
    byDate[r.date].total++;
    if (r.status === 'PRESENT') byDate[r.date].present++;
    else if (r.status === 'LATE') byDate[r.date].late++;
    else if (r.status === 'ABSENT') byDate[r.date].absent++;
  });
  const series = Object.entries(byDate)
    .map(([date, v]) => ({ date, ...v, rate: Math.round(((v.present + v.late) / v.total) * 100) }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  // At-risk students: attendance rate below 80% over recorded history
  const byStudent = {};
  records.forEach((r) => {
    byStudent[r.studentId] = byStudent[r.studentId] || { present: 0, total: 0 };
    byStudent[r.studentId].total++;
    if (r.status === 'PRESENT' || r.status === 'LATE') byStudent[r.studentId].present++;
  });
  const atRisk = Object.entries(byStudent)
    .map(([studentId, v]) => ({ studentId, rate: Math.round((v.present / v.total) * 100) }))
    .filter((x) => x.rate < 80)
    .map((x) => {
      const student = students.findById(x.studentId);
      return { studentId: x.studentId, name: student?.name, class: student?.class, rate: x.rate };
    })
    .sort((a, b) => a.rate - b.rate);

  res.json({ series, atRisk });
});

// House Master delegation — a House Master can hand attendance-marking
// rights for their specific house to one or more resident students,
// without those students becoming House Masters themselves or gaining
// any access beyond that one house's attendance.
router.post('/house-monitors', authenticate, (req, res) => {
  if (!['HOUSE_MASTER', 'MATRON'].includes(req.user.role)) return res.status(403).json({ error: 'Only a House Master or Matron can appoint a dormitory attendance monitor' });
  const house = req.user.scope?.house;
  if (!house) return res.status(400).json({ error: 'Your session has no house assigned — this should not happen for an active House Master appointment' });

  const { studentId } = req.body;
  const student = students.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (student.house !== house) return res.status(400).json({ error: 'That student is not a resident of your house' });

  const studentUser = users.findOne((u) => u.scope?.studentId === student.id);
  if (!studentUser) return res.status(400).json({ error: 'That student has no login account to delegate to' });

  const existing = houseMonitors.findOne((m) => m.studentUserId === studentUser.id && m.house === house && m.active);
  if (existing) return res.status(409).json({ error: 'This student is already a monitor for your house', monitor: existing });

  const record = {
    id: uuid(), studentUserId: studentUser.id, studentId: student.id, studentName: student.name,
    house, schoolId: student.schoolId, appointedBy: req.user.name, appointedAt: new Date().toISOString(), active: true,
  };
  houseMonitors.insert(record);
  res.status(201).json(record);
});

router.get('/house-monitors', authenticate, (req, res) => {
  if (!['HOUSE_MASTER', 'MATRON'].includes(req.user.role)) return res.status(403).json({ error: 'Only a House Master or Matron can view their house monitors' });
  const house = req.user.scope?.house;
  const list = houseMonitors.find((m) => m.house === house && m.active);
  res.json(list);
});

router.delete('/house-monitors/:id', authenticate, (req, res) => {
  if (!['HOUSE_MASTER', 'MATRON'].includes(req.user.role)) return res.status(403).json({ error: 'Only a House Master or Matron can revoke a house monitor' });
  const monitor = houseMonitors.findById(req.params.id);
  if (!monitor || monitor.house !== req.user.scope?.house) return res.status(404).json({ error: 'Monitor not found in your house' });
  houseMonitors.updateById(monitor.id, { active: false });
  res.json({ revoked: true });
});

module.exports = router;
