const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { notify } = require('./messages');

const router = express.Router();
const students = collection('students');
const schools = collection('schools');
const promotions = collection('promotions');
const promotionRules = collection('promotion_rules');
const attendance = collection('attendance');
const users = collection('users');

function parentUserIdFor(studentId) {
  const parent = users.findOne((u) => u.role === 'PARENT' && (u.scope?.studentId === studentId || u.childId === studentId));
  return parent ? parent.id : null;
}

const CLASS_SEQUENCE = ['KG1', 'KG2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'JHS1', 'JHS2', 'JHS3', 'SHS1', 'SHS2', 'SHS3'];

function nextClass(current) {
  const idx = CLASS_SEQUENCE.indexOf(current);
  if (idx === -1 || idx === CLASS_SEQUENCE.length - 1) return null; // graduating class
  return CLASS_SEQUENCE[idx + 1];
}

/** Default national rule set, overridable per level/school-type without code changes */
function defaultRules() {
  return {
    minAttendanceRate: 75,
    minAcademicScore: 40, // out of 100, continuous assessment + exams combined
    conditionalPromotionScoreRange: [35, 40],
    behaviourFailThreshold: 3, // 3+ serious behaviour notes => requires headmaster review
  };
}

function getEffectiveRules(level, schoolType) {
  const custom = promotionRules.findOne(
    (r) => r.level === level && (r.schoolType === schoolType || r.schoolType === 'ALL')
  );
  return custom ? { ...defaultRules(), ...custom.rules } : defaultRules();
}

function attendanceRateFor(studentId) {
  const records = attendance.find((a) => a.studentId === studentId);
  if (!records.length) return 100;
  const present = records.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  return Math.round((present / records.length) * 100);
}

// View/update configurable rules (national/regional EMIS admins)
router.get('/rules', authenticate, (req, res) => {
  res.json({ default: defaultRules(), overrides: promotionRules.all() });
});

router.post('/rules', authenticate, requireRole('NATIONAL_EMIS_ADMIN', 'NATIONAL_QA', 'DIRECTOR_GENERAL'), (req, res) => {
  const { level, schoolType, rules } = req.body;
  if (!level || !rules) return res.status(400).json({ error: 'level and rules are required' });
  const existing = promotionRules.findOne((r) => r.level === level && r.schoolType === (schoolType || 'ALL'));
  if (existing) {
    const updated = promotionRules.updateById(existing.id, { rules });
    return res.json(updated);
  }
  const record = promotionRules.insert({ id: uuid(), level, schoolType: schoolType || 'ALL', rules, createdAt: new Date().toISOString() });
  res.status(201).json(record);
});

// Evaluate a single student against the rules (dry run, does not commit)
router.post('/evaluate/:studentId', authenticate, requireRole(
  'HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'TEACHER'
), (req, res) => {
  const student = students.findById(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const school = schools.findById(student.schoolId);
  const rules = getEffectiveRules(student.level, school?.type);
  const { academicScore } = req.body; // 0-100, supplied by teacher's continuous assessment + exam average

  const attendanceRate = attendanceRateFor(student.id);
  const seriousBehaviourCount = (student.behaviourNotes || []).filter((n) => n.type === 'SERIOUS').length;

  let outcome;
  let reasons = [];

  if (attendanceRate < rules.minAttendanceRate) {
    reasons.push(`Attendance ${attendanceRate}% below required ${rules.minAttendanceRate}%`);
  }
  if (seriousBehaviourCount >= rules.behaviourFailThreshold) {
    reasons.push(`${seriousBehaviourCount} serious behaviour incidents - requires headmaster review`);
  }

  if (academicScore === undefined || academicScore === null) {
    outcome = 'PENDING_ASSESSMENT';
    reasons.push('Academic score not yet submitted');
  } else if (academicScore >= rules.minAcademicScore && attendanceRate >= rules.minAttendanceRate && seriousBehaviourCount < rules.behaviourFailThreshold) {
    outcome = 'PROMOTED';
  } else if (
    academicScore >= rules.conditionalPromotionScoreRange[0] &&
    academicScore < rules.conditionalPromotionScoreRange[1]
  ) {
    outcome = 'CONDITIONAL_PROMOTION';
    reasons.push(`Score ${academicScore} in conditional range [${rules.conditionalPromotionScoreRange.join('-')})`);
  } else {
    outcome = 'REPEAT';
    reasons.push(`Score ${academicScore} below minimum ${rules.minAcademicScore}`);
  }

  const isGraduatingClass = nextClass(student.class) === null;
  if (outcome === 'PROMOTED' && isGraduatingClass) outcome = 'GRADUATED';

  res.json({
    studentId: student.id,
    currentClass: student.class,
    proposedNextClass: outcome === 'PROMOTED' ? nextClass(student.class) : student.class,
    attendanceRate,
    seriousBehaviourCount,
    academicScore: academicScore ?? null,
    rulesApplied: rules,
    outcome,
    reasons,
  });
});

// Commit a promotion decision (requires headmaster approval per spec)
router.post('/decide/:studentId', authenticate, requireRole(
  'HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN'
), (req, res) => {
  const student = students.findById(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const { outcome, academicScore, teacherRecommendation, notes } = req.body;
  const validOutcomes = ['PROMOTED', 'REPEAT', 'CONDITIONAL_PROMOTION', 'GRADUATED', 'WITHDRAWN', 'DEFERRED'];
  if (!validOutcomes.includes(outcome)) return res.status(400).json({ error: `outcome must be one of ${validOutcomes.join(', ')}` });

  const academicYear = req.body.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  const record = {
    id: uuid(),
    studentId: student.id,
    schoolId: student.schoolId,
    academicYear,
    fromClass: student.class,
    toClass: outcome === 'PROMOTED' ? nextClass(student.class) : student.class,
    outcome,
    academicScore: academicScore ?? null,
    teacherRecommendation: teacherRecommendation || null,
    approvedBy: req.user.name,
    notes: notes || '',
    decidedAt: new Date().toISOString(),
  };
  promotions.insert(record);

  // Apply to student record
  const patch = {
    academicHistory: [
      ...(student.academicHistory || []),
      { academicYear, class: student.class, outcome, decidedAt: record.decidedAt },
    ],
  };
  if (outcome === 'PROMOTED' && record.toClass) patch.class = record.toClass;
  if (outcome === 'GRADUATED') patch.status = 'GRADUATED';
  if (outcome === 'WITHDRAWN') patch.status = 'WITHDRAWN';
  students.updateById(student.id, patch);

  const parentUserId = parentUserIdFor(student.id);
  if (parentUserId) {
    notify(
      parentUserId,
      'PROMOTION',
      `${student.name}'s end-of-year result is in`,
      `${student.name} has been marked "${outcome.replace(/_/g, ' ').toLowerCase()}" for the ${academicYear} academic year.`,
      `#/students/${student.id}`
    );
  }

  res.status(201).json(record);
});

router.get('/history/:studentId', authenticate, (req, res) => {
  const student = students.findById(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });
  res.json(promotions.find((p) => p.studentId === student.id).sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1)));
});

router.get('/school/:schoolId', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });
  res.json(promotions.find((p) => p.schoolId === req.params.schoolId).sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1)));
});

module.exports = router;
