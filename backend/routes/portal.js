const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { STUDENT_LEADER_ROLE_IDS } = require('../utils/roles');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const students = collection('students');
const attendance = collection('attendance');
const promotions = collection('promotions');
const schools = collection('schools');
const announcements = collection('announcements');
const parentLinks = collection('parent_links');
const users = collection('users');

/**
 * Parent <-> child linking
 * -------------------------
 * A parent account is not tied to a single child. `parent_links` is a real
 * many-to-many table: one parent can be linked to multiple children, and
 * those children can attend *different* schools (public or private) —
 * exactly the real-world case of siblings at different institutions.
 * `scope.studentId`/`childId` on the user record (from earlier in the
 * build) are treated as a bootstrap link only, migrated into this table
 * lazily so existing accounts keep working without a data migration step.
 */
function linkedStudentIds(parentUserId, parentUser) {
  const links = parentLinks.find((l) => l.parentUserId === parentUserId).map((l) => l.studentId);
  if (links.length) return [...new Set(links)];
  // Bootstrap: no explicit links yet — fall back to the legacy single-child field
  const legacy = parentUser?.scope?.studentId || parentUser?.childId;
  return legacy ? [legacy] : [];
}

function studentIdForUser(req) {
  // For students (and student-leader appointments acting on top of a
  // student account) — not parents, who go through linkedStudentIds above.
  return req.user.scope?.studentId || req.user.studentId;
}

function childSummary(studentId) {
  const student = students.findById(studentId);
  if (!student) return null;
  const school = schools.findById(student.schoolId);
  const records = attendance.find((a) => a.studentId === studentId).sort((a, b) => (a.date < b.date ? 1 : -1));
  const present = records.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  return {
    student,
    school: school ? { id: school.id, name: school.name, type: school.type, level: school.level } : null,
    attendanceRate: records.length ? Math.round((present / records.length) * 100) : null,
    recentAttendance: records.slice(0, 15),
    academicHistory: promotions.find((p) => p.studentId === studentId),
  };
}

// All of a parent's children, in one call — the basis for a child switcher
// in the portal UI. Works across schools, public or private, no restriction.
router.get('/my-children', authenticate, requireRole('PARENT'), (req, res) => {
  const parentUser = users.findById(req.user.id);
  const ids = linkedStudentIds(req.user.id, parentUser);
  const children = ids.map(childSummary).filter(Boolean);
  res.json(children);
});

// Backward-compatible single-child endpoint — returns the first linked
// child, or a specific one via ?studentId=, still validated against the
// parent's actual links so one parent can never pull up someone else's kid.
router.get('/my-child', authenticate, requireRole('PARENT'), (req, res) => {
  const parentUser = users.findById(req.user.id);
  const ids = linkedStudentIds(req.user.id, parentUser);
  if (!ids.length) return res.status(404).json({ error: 'No linked student record found for this account' });

  const requested = req.query.studentId;
  const studentId = requested && ids.includes(requested) ? requested : ids[0];
  const summary = childSummary(studentId);
  if (!summary) return res.status(404).json({ error: 'Linked student record not found' });
  res.json(summary);
});

// Link an additional child to a parent account. Restricted to school-tier
// staff (the people who'd actually be verifying a parent's relationship to
// a child during admission/enrollment), not the parent themselves — a
// parent self-linking to any student by ID would be a real privacy hole.
router.post('/link-child', authenticate, (req, res) => {
  const { parentUserId, studentId } = req.body;
  const parentUser = users.findById(parentUserId);
  if (!parentUser || parentUser.role !== 'PARENT') return res.status(404).json({ error: 'Parent account not found' });
  const student = students.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const existing = parentLinks.findOne((l) => l.parentUserId === parentUserId && l.studentId === studentId);
  if (existing) return res.status(409).json({ error: 'Already linked' });

  const record = { id: uuid(), parentUserId, studentId, linkedBy: req.user.name, linkedAt: new Date().toISOString() };
  parentLinks.insert(record);
  res.status(201).json(record);
});

router.get('/my-profile', authenticate, requireRole('STUDENT', ...STUDENT_LEADER_ROLE_IDS), (req, res) => {
  const studentId = studentIdForUser(req);
  const student = students.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student record not found' });
  const school = schools.findById(student.schoolId);
  const records = attendance.find((a) => a.studentId === studentId).sort((a, b) => (a.date < b.date ? 1 : -1));
  const present = records.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;

  res.json({
    student,
    school: school ? { id: school.id, name: school.name } : null,
    attendanceRate: records.length ? Math.round((present / records.length) * 100) : null,
    recentAttendance: records.slice(0, 15),
    announcements: announcements.all().filter((a) => a.audience === 'ALL').slice(0, 5),
  });
});

module.exports = router;
