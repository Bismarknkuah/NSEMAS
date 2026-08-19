const express = require('express');
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../utils/permissions');
const { schoolIdsForUser } = require('../utils/scope');
const bio = require('../utils/biometrics');

const router = express.Router();
const students = collection('students');
const schools = collection('schools');
const attendance = collection('attendance');
const auditLog = collection('audit_log');
const users = collection('users');
const parentLinks = collection('parent_links');
const appointments = collection('role_appointments');

/**
 * Auto-assign a boarding student to a house
 * --------------------------------------------
 * Rather than invent house names out of nowhere, this looks at which
 * houses actually have a House Master or Matron currently appointed at
 * this school — those are the real, staffed houses. It balances new
 * boarders across them (fewest residents first), so one house doesn't
 * silently end up overcrowded while another sits empty. If a school has
 * no houses staffed yet, there's nothing real to assign to, so the
 * student is left unassigned rather than invented a fake house name —
 * an explicit gap for the Headmaster to notice and appoint someone to.
 */
function autoAssignHouse(schoolId) {
  const houseAppointments = appointments.find(
    (a) => a.active && a.schoolId === schoolId && ['HOUSE_MASTER', 'MATRON'].includes(a.role) && a.house
  );
  const realHouses = [...new Set(houseAppointments.map((a) => a.house))];
  if (!realHouses.length) return null;

  const counts = Object.fromEntries(realHouses.map((h) => [h, 0]));
  students.find((s) => s.schoolId === schoolId && s.house).forEach((s) => {
    if (counts[s.house] !== undefined) counts[s.house] += 1;
  });
  return realHouses.sort((a, b) => counts[a] - counts[b])[0];
}


function userIdForStudent(studentId) {
  const u = users.findOne((u) => (u.scope?.studentId === studentId || u.studentId === studentId) && u.role === 'STUDENT');
  return u ? u.id : null;
}

function attendanceRate(studentId) {
  const records = attendance.find((a) => a.studentId === studentId);
  if (records.length === 0) return null;
  const present = records.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  return Math.round((present / records.length) * 100);
}

// Never ship raw minutiae template data to the client — only its metadata.
function publicStudent(s) {
  const { biometricTemplate, ...rest } = s;
  return {
    ...rest,
    biometricTemplateMeta: biometricTemplate
      ? { quality: biometricTemplate.quality, sampleCount: biometricTemplate.sampleCount, points: biometricTemplate.points.length }
      : null,
  };
}

router.get('/', authenticate, (req, res) => {
  const { schoolId, class: klass, search, status } = req.query;
  let list;

  if (req.user.role === 'PARENT') {
    // A parent's scope.schoolId reflects one child's school, but
    // schoolIdsForUser is built for staff-tier jurisdiction scoping — used
    // as-is here it would (and did) hand back that whole school's roster,
    // not just this parent's own children. Restrict explicitly instead.
    const linkedIds = new Set(parentLinks.find((l) => l.parentUserId === req.user.id).map((l) => l.studentId));
    list = students.all().filter((s) => linkedIds.has(s.id));
  } else {
    const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
    list = students.all().filter((s) => allowedIds.has(s.schoolId));
  }

  if (schoolId) list = list.filter((s) => s.schoolId === schoolId);
  if (klass) list = list.filter((s) => s.class === klass);
  if (status) list = list.filter((s) => s.status === status);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.geuln.toLowerCase().includes(q));
  }

  res.json(
    list.map((s) => ({
      ...publicStudent(s),
      attendanceRate: attendanceRate(s.id),
      userId: userIdForStudent(s.id),
    }))
  );
});

router.get('/:id', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const student = students.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const records = attendance.find((a) => a.studentId === student.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json({
    ...publicStudent(student),
    attendanceRate: attendanceRate(student.id),
    attendanceHistory: records.slice(0, 30),
    userId: userIdForStudent(student.id),
    parentLinked: parentLinks.find((l) => l.studentId === student.id).length > 0,
  });
});

// Edit a student record — currently scoped to the fields school leadership
// actually needs to change day-to-day (house/dormitory assignment being
// the immediate case: it didn't exist as an editable field before, and
// without this endpoint there was no way to set it after admission).
router.patch(
  '/:id',
  authenticate,
  requirePermission('student.edit'),
  (req, res) => {
    const student = students.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
    if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

    const EDITABLE_FIELDS = ['class', 'house', 'boardingStatus', 'address', 'guardianRelationship', 'previousSchool', 'allergies', 'emergencyContactName', 'emergencyContactPhone', 'medical'];
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    // A student newly becoming a boarder, with no house explicitly chosen,
    // gets the same real auto-assignment as a new admission — not left to
    // silently sit with boardingStatus set but no house at all.
    if (updates.boardingStatus === 'BOARDING' && updates.house === undefined && !student.house) {
      updates.house = autoAssignHouse(student.schoolId);
    }
    const updated = students.updateById(student.id, updates);
    res.json(publicStudent(updated));
  }
);

// Admission - Headmaster/School Admin/District EMIS and above
function usernameFromName(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'parent';
  let candidate = base;
  let n = 1;
  while (users.findOne((u) => u.username === candidate)) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

router.post(
  '/',
  authenticate,
  requirePermission('student.admission'),
  (req, res) => {
    const {
      name, gender, dateOfBirth, class: klass, level, medical, schoolId,
      // Detailed profile fields
      address, nationality, guardianRelationship, previousSchool, boardingStatus, house,
      allergies, emergencyContactName, emergencyContactPhone,
      // Parent linking — either link an existing parent account, or auto-provision a new one
      parentUsername, parentName, parentPhone, parentEmail, createParentAccount,
    } = req.body;
    if (!name || !gender || !klass) {
      return res.status(400).json({ error: 'name, gender, and class are required' });
    }
    const targetSchoolId = schoolId || req.user.scope?.schoolId;
    const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
    if (!targetSchoolId || !allowedIds.has(targetSchoolId)) {
      return res.status(403).json({ error: 'No access to admit students to this school' });
    }
    const school = schools.findById(targetSchoolId);

    const student = {
      id: uuid(),
      geuln: `GEULN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`,
      name,
      gender,
      dateOfBirth: dateOfBirth || null,
      schoolId: targetSchoolId,
      class: klass,
      level: level || school?.level || 'PRIMARY',
      status: 'ACTIVE',
      biometricEnrolled: false,
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      address: address || null,
      nationality: nationality || 'Ghanaian',
      guardianRelationship: guardianRelationship || 'Parent',
      previousSchool: previousSchool || null,
      boardingStatus: boardingStatus || 'DAY',
      house: house || (boardingStatus === 'BOARDING' ? autoAssignHouse(targetSchoolId) : null),
      allergies: allergies || 'None',
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      admissionDate: new Date().toISOString().slice(0, 10),
      medical: medical || 'None',
      behaviourNotes: [],
      academicHistory: [],
      createdAt: new Date().toISOString(),
    };
    students.insert(student);
    auditLog.insert({ id: uuid(), action: 'ADMIT_STUDENT', userId: req.user.id, targetId: student.id, at: new Date().toISOString() });

    // Automatic parent-portal linking — the whole point of collecting a
    // parent identifier at admission time instead of leaving it as free
    // text with no real account behind it.
    let parentLinkResult = null;
    if (parentUsername) {
      const parentUser = users.findOne((u) => u.username === parentUsername && u.role === 'PARENT');
      if (parentUser) {
        parentLinks.insert({ id: uuid(), parentUserId: parentUser.id, studentId: student.id, linkedBy: req.user.name, linkedAt: new Date().toISOString() });
        parentLinkResult = { linked: true, existingAccount: true, username: parentUser.username };
      } else {
        parentLinkResult = { linked: false, error: `No parent account found with username "${parentUsername}"` };
      }
    } else if (createParentAccount && parentName) {
      const username = usernameFromName(parentName);
      const tempPassword = Math.random().toString(36).slice(-10);
      const newParentUser = {
        id: uuid(),
        name: parentName,
        username,
        passwordHash: bcrypt.hashSync(tempPassword, 10),
        role: 'PARENT',
        scope: { region: school?.region, district: school?.district, schoolId: targetSchoolId, studentId: student.id },
        childId: student.id,
        email: parentEmail || null,
        phone: parentPhone || null,
        active: true,
        createdBy: req.user.name,
        createdAt: new Date().toISOString(),
      };
      users.insert(newParentUser);
      parentLinks.insert({ id: uuid(), parentUserId: newParentUser.id, studentId: student.id, linkedBy: req.user.name, linkedAt: new Date().toISOString() });
      parentLinkResult = { linked: true, existingAccount: false, username, temporaryPassword: tempPassword };
    }

    res.status(201).json({ ...student, parentLinkResult });
  }
);

// Bulk admission — same core creation logic as single admission, run once
// per row, with a per-row result so a bad row doesn't silently drop or
// abort the whole batch. Deliberately simpler than the single-admission
// endpoint (no parent auto-linking here) — that's still available per
// student afterward via the portal's link-child flow.
router.post(
  '/bulk',
  authenticate,
  requirePermission('student.admission'),
  (req, res) => {
    const { rows, schoolId } = req.body;
    if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'rows must be a non-empty array' });
    if (rows.length > 1000) return res.status(400).json({ error: 'Max 1000 rows per import — split into smaller batches' });

    const targetSchoolId = schoolId || req.user.scope?.schoolId;
    const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
    if (!targetSchoolId || !allowedIds.has(targetSchoolId)) {
      return res.status(403).json({ error: 'No access to admit students to this school' });
    }
    const school = schools.findById(targetSchoolId);

    const results = rows.map((row, i) => {
      const { name, gender, class: klass, dateOfBirth, parentName, parentPhone } = row;
      if (!name || !gender || !klass) {
        return { row: i + 1, name: name || '(blank)', status: 'skipped', reason: 'name, gender, and class are required' };
      }
      if (!['MALE', 'FEMALE'].includes(String(gender).toUpperCase())) {
        return { row: i + 1, name, status: 'skipped', reason: 'gender must be MALE or FEMALE' };
      }
      const student = {
        id: uuid(),
        geuln: `GEULN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`,
        name, gender: String(gender).toUpperCase(), dateOfBirth: dateOfBirth || null,
        schoolId: targetSchoolId, class: klass, level: school?.level || 'PRIMARY',
        status: 'ACTIVE', biometricEnrolled: false,
        parentName: parentName || null, parentPhone: parentPhone || null,
        address: null, nationality: 'Ghanaian', guardianRelationship: 'Parent',
        previousSchool: null, boardingStatus: 'DAY', allergies: 'None',
        emergencyContactName: null, emergencyContactPhone: null,
        admissionDate: new Date().toISOString().slice(0, 10), medical: 'None',
        behaviourNotes: [], academicHistory: [], createdAt: new Date().toISOString(),
      };
      students.insert(student);
      return { row: i + 1, name, status: 'created', studentId: student.id, geuln: student.geuln };
    });

    auditLog.insert({
      id: uuid(), action: 'BULK_ADMIT_STUDENTS', userId: req.user.id,
      detail: `${results.filter((r) => r.status === 'created').length} created, ${results.filter((r) => r.status === 'skipped').length} skipped`,
      at: new Date().toISOString(),
    });

    res.status(201).json({
      createdCount: results.filter((r) => r.status === 'created').length,
      skippedCount: results.filter((r) => r.status === 'skipped').length,
      results,
    });
  }
);

// Biometric fingerprint enrollment — real simulated minutiae capture + training.
// Step 1: capture a single scan sample (called 3x by the client to build a template).
router.post('/:id/biometric/capture', authenticate, requirePermission('student.biometric'), (req, res) => {
  const student = students.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const fingerIndex = req.body?.fingerIndex ?? 0;
  const fingerSeed = `${student.id}:finger:${fingerIndex}`;
  // Small per-capture noise simulates natural variance in finger placement/pressure
  // across repeated scans of the *same* physical finger during enrollment.
  const scan = bio.generateScan(fingerSeed, 0.03);
  res.json({ points: scan });
});

// Step 2: submit the 3 captured samples to train a canonical template.
router.post('/:id/biometric/enroll', authenticate, requirePermission('student.biometric'), (req, res) => {
  const student = students.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const { samples } = req.body;
  if (!Array.isArray(samples) || samples.length < 3) {
    return res.status(400).json({ error: 'At least 3 enrollment scans are required to train a reliable template' });
  }

  const template = bio.buildTemplate(samples);
  if (template.quality < 40) {
    return res.status(422).json({ error: 'Scan quality too low/inconsistent to enroll — please re-capture all 3 samples', quality: template.quality });
  }

  const updated = students.updateById(student.id, {
    biometricEnrolled: true,
    biometricMethod: 'FINGERPRINT',
    biometricTemplate: template,
    biometricQuality: template.quality,
    biometricEnrolledAt: new Date().toISOString(),
  });
  auditLog.insert({ id: uuid(), action: 'BIOMETRIC_ENROLL', userId: req.user.id, targetId: student.id, quality: template.quality, at: new Date().toISOString() });
  res.status(201).json(publicStudent(updated));
});

// Non-fingerprint methods (facial/RFID) — simpler boolean enrollment, as before.
router.post('/:id/enroll-biometric', authenticate, requirePermission('student.biometric'), (req, res) => {
  const student = students.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const { method } = req.body; // FACIAL | RFID
  const updated = students.updateById(student.id, {
    biometricEnrolled: true,
    biometricMethod: method || 'FACIAL',
    biometricEnrolledAt: new Date().toISOString(),
  });
  res.json(publicStudent(updated));
});

// Add behaviour note / medical update
router.post('/:id/notes', authenticate, requirePermission('student.notes'), (req, res) => {
  const student = students.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const { type, note } = req.body;
  if (!note) return res.status(400).json({ error: 'note is required' });
  const entry = { id: uuid(), type: type || 'GENERAL', note, by: req.user.name, at: new Date().toISOString() };
  const notes = [...(student.behaviourNotes || []), entry];
  const updated = students.updateById(student.id, { behaviourNotes: notes });
  res.json(publicStudent(updated));
});

module.exports = router;
