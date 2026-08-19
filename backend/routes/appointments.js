const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireFlag, signToken } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const appointments = collection('role_appointments');
const students = collection('students');
const teachers = collection('teachers');
const schools = collection('schools');
const users = collection('users');

/**
 * Executive role appointments
 * ----------------------------
 * Student leadership titles (School Prefect, SRC Executive, etc.) and
 * teacher coordination titles (Department Head, Form Master, House
 * Master, Subject Coordinator, Boarding Coordinator, Sports Coordinator)
 * are *appointments* layered on top of one underlying account — not
 * separate logins. A headmaster assigns/revokes them at any time, and the
 * person holding one switches between "my normal view" and "my executive
 * view" from the same session via POST /appointments/switch.
 *
 * This intentionally does NOT create a second user record: the JWT's
 * `role`/`scope` claims are what every permission check in the app reads
 * (see middleware/auth.js), so "switching" just issues a new token for
 * the same underlying account with a different role claim. The person's
 * real stored identity (their students.json / teachers.json / users.json
 * records) never changes.
 */

const STUDENT_APPOINTABLE_ROLES = [
  'SCHOOL_PREFECT', 'ASSISTANT_PREFECT', 'BOYS_PREFECT', 'GIRLS_PREFECT', 'CLASS_PREFECT',
  'COURSE_REP', 'SRC_EXECUTIVE', 'HALL_REP', 'HOUSE_PREFECT',
];
const TEACHER_APPOINTABLE_ROLES = [
  'DEPARTMENT_HEAD', 'SUBJECT_COORDINATOR', 'FORM_MASTER', 'HOUSE_MASTER', 'MATRON', 'SENIOR_HOUSE_MASTER',
  'BOARDING_COORDINATOR', 'SPORTS_COORDINATOR',
];
const APPOINTABLE_ROLES = [...STUDENT_APPOINTABLE_ROLES, ...TEACHER_APPOINTABLE_ROLES];

function baseKindFor(role) {
  if (STUDENT_APPOINTABLE_ROLES.includes(role)) return 'STUDENT';
  if (TEACHER_APPOINTABLE_ROLES.includes(role)) return 'TEACHER';
  return null;
}

// ---------------- List / assign / revoke (headmaster-tier action) ----------------
router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId } = req.query;
  let list = appointments.all().filter((a) => allowedIds.has(a.schoolId));
  if (schoolId) list = list.filter((a) => a.schoolId === schoolId);

  res.json(
    list.map((a) => {
      const person = a.baseKind === 'STUDENT' ? students.findById(a.studentOrTeacherId) : teachers.findById(a.studentOrTeacherId);
      return { ...a, personName: person?.name || 'Unknown' };
    }).sort((a, b) => (a.appointedAt < b.appointedAt ? 1 : -1))
  );
});

router.get('/mine', authenticate, (req, res) => {
  const mine = appointments.find((a) => a.userId === req.user.id && a.active);
  res.json(mine);
});

router.post('/', authenticate, requireFlag('canAdmit'), (req, res) => {
  const { userId, role, label, house } = req.body;
  if (!APPOINTABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${APPOINTABLE_ROLES.join(', ')}` });
  }
  if (['HOUSE_MASTER', 'MATRON'].includes(role) && !house) {
    return res.status(400).json({ error: 'house is required when appointing a House Master — which house/dormitory they oversee' });
  }
  const targetUser = users.findById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const kind = baseKindFor(role);
  const personId = kind === 'STUDENT' ? (targetUser.scope?.studentId || targetUser.studentId) : targetUser.teacherId;
  if (!personId) return res.status(400).json({ error: `Target account has no linked ${kind.toLowerCase()} record` });

  const schoolId = targetUser.scope?.schoolId;
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!schoolId || !allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const existing = appointments.findOne((a) => a.userId === userId && a.role === role && a.active);
  if (existing) return res.status(409).json({ error: 'This person already holds this appointment', appointment: existing });

  const record = {
    id: uuid(),
    userId,
    baseKind: kind,
    studentOrTeacherId: personId,
    schoolId,
    role,
    label: label || null,
    house: ['HOUSE_MASTER', 'MATRON'].includes(role) ? house : null,
    active: true,
    appointedBy: req.user.name,
    appointedAt: new Date().toISOString(),
    revokedBy: null,
    revokedAt: null,
  };
  appointments.insert(record);
  res.status(201).json(record);
});

router.post('/:id/revoke', authenticate, requireFlag('canAdmit'), (req, res) => {
  const appt = appointments.findById(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(appt.schoolId)) return res.status(403).json({ error: 'No access to this appointment' });
  if (!appt.active) return res.status(400).json({ error: 'Appointment is already inactive' });

  const updated = appointments.updateById(appt.id, {
    active: false, revokedBy: req.user.name, revokedAt: new Date().toISOString(),
  });
  res.json(updated);
});

// ---------------- Switching between "my normal view" and an appointment ----------------
router.post('/switch', authenticate, (req, res) => {
  const { appointmentId } = req.body; // omit/null to switch back to the primary role
  const baseUser = users.findById(req.user.id);
  if (!baseUser) return res.status(404).json({ error: 'User not found' });

  if (!appointmentId) {
    // Switch back to the account's real stored role/scope
    const token = signToken(baseUser);
    return res.json({ token, role: baseUser.role, actingAs: null });
  }

  const appt = appointments.findById(appointmentId);
  if (!appt || appt.userId !== baseUser.id || !appt.active) {
    return res.status(403).json({ error: 'You do not hold an active appointment with that id' });
  }

  // Same underlying account (same id, so audit trails / student & teacher
  // links stay correct) — only the role/scope claims in the token change.
  const token = signToken({
    id: baseUser.id,
    name: baseUser.name,
    role: appt.role,
    scope: appt.house ? { ...baseUser.scope, house: appt.house } : baseUser.scope, // schoolId/studentId/teacherId already point at the right records; house is added for House Master appointments specifically
    teacherId: baseUser.teacherId,
    studentId: baseUser.studentId,
  });
  res.json({ token, role: appt.role, actingAs: appt.role });
});

// ---------------- Demo quick-login (self-service, demo accounts only) ----------------
// The "Quick demo access" grid on the login page has always let anyone try
// any of the 67 roles with one click. For student-leader and teacher-
// coordination roles specifically, that role only really exists as an
// appointment on top of a base Student/Teacher account — so clicking
// "Boys Prefect" here logs into the real demo student/teacher account and
// auto-provisions (or reuses) that appointment, landing already switched
// into it, with the "Personal" tab genuinely available to switch back to.
// This never touches non-demo accounts — isDemoAccount is checked first.
router.post('/demo-quick-login', (req, res) => {
  const { baseUsername, role } = req.body;
  if (!APPOINTABLE_ROLES.includes(role)) return res.status(400).json({ error: 'Unknown appointable role' });

  const baseUser = users.findOne((u) => u.username === baseUsername);
  if (!baseUser || !baseUser.isDemoAccount) {
    return res.status(403).json({ error: 'Demo quick-login is only available for demo accounts' });
  }
  const kind = baseKindFor(role);
  if (baseUser.role !== kind) {
    return res.status(400).json({ error: `${role} must be provisioned on a ${kind} account` });
  }

  let appt = appointments.findOne((a) => a.userId === baseUser.id && a.role === role && a.active);
  if (!appt) {
    appt = {
      id: uuid(),
      userId: baseUser.id,
      baseKind: kind,
      studentOrTeacherId: kind === 'STUDENT' ? (baseUser.scope?.studentId || baseUser.studentId) : baseUser.teacherId,
      schoolId: baseUser.scope?.schoolId,
      role,
      label: null,
      house: ['HOUSE_MASTER', 'MATRON'].includes(role) ? 'Independence House' : null, // demo default, so the demo grid works end-to-end without a manual assignment step
      active: true,
      appointedBy: 'Demo self-service',
      appointedAt: new Date().toISOString(),
      revokedBy: null,
      revokedAt: null,
    };
    appointments.insert(appt);
  }

  const token = signToken({
    id: baseUser.id, name: baseUser.name, role: appt.role,
    scope: appt.house ? { ...baseUser.scope, house: appt.house } : baseUser.scope,
    teacherId: baseUser.teacherId,
    studentId: baseUser.studentId,
  });
  res.json({ token, role: appt.role, actingAs: appt.role });
});

module.exports = router;
