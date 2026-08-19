const express = require('express');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const students = collection('students');
const schools = collection('schools');
const promotions = collection('promotions');

/**
 * Alumni register: students whose lifecycle has concluded at a school
 * (graduated or withdrawn) get a dedicated read-oriented view here rather
 * than being mixed into the active student roster. This is the spec's
 * "Alumni records" lifecycle stage — distinct from the day-to-day active
 * roster in routes/students.js.
 */
router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, status, search, graduationYear } = req.query;

  let list = students.all().filter((s) => allowedIds.has(s.schoolId) && ['GRADUATED', 'WITHDRAWN'].includes(s.status));
  if (schoolId) list = list.filter((s) => s.schoolId === schoolId);
  if (status) list = list.filter((s) => s.status === status);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.geuln.toLowerCase().includes(q));
  }
  if (graduationYear) {
    list = list.filter((s) => {
      const finalRecord = (s.academicHistory || []).slice().reverse()[0];
      return finalRecord && finalRecord.academicYear && finalRecord.academicYear.startsWith(graduationYear);
    });
  }

  const schoolById = Object.fromEntries(schools.all().map((s) => [s.id, s]));
  res.json(
    list.map((s) => {
      const finalRecord = (s.academicHistory || []).slice().reverse()[0];
      return {
        id: s.id,
        name: s.name,
        geuln: s.geuln,
        gender: s.gender,
        status: s.status,
        finalClass: s.class,
        finalOutcomeYear: finalRecord?.academicYear || null,
        school: schoolById[s.schoolId] ? { id: schoolById[s.schoolId].id, name: schoolById[s.schoolId].name } : null,
        admissionDate: s.admissionDate,
      };
    }).sort((a, b) => (a.finalOutcomeYear < b.finalOutcomeYear ? 1 : -1))
  );
});

router.get('/:id', authenticate, (req, res) => {
  const student = students.findById(req.params.id);
  if (!student || !['GRADUATED', 'WITHDRAWN'].includes(student.status)) {
    return res.status(404).json({ error: 'Alumni record not found' });
  }
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this record' });

  const school = schools.findById(student.schoolId);
  const history = promotions.find((p) => p.studentId === student.id).sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1));

  res.json({
    student: {
      id: student.id, name: student.name, geuln: student.geuln, gender: student.gender,
      status: student.status, admissionDate: student.admissionDate, dateOfBirth: student.dateOfBirth,
      parentName: student.parentName, parentPhone: student.parentPhone,
    },
    school: school ? { id: school.id, name: school.name, type: school.type, level: school.level } : null,
    lifecycleHistory: history,
    academicHistory: student.academicHistory || [],
  });
});

// Aggregate stats for an "alumni summary" panel — e.g. graduation rate by year
router.get('/summary/:schoolId', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const alumni = students.find((s) => s.schoolId === req.params.schoolId && ['GRADUATED', 'WITHDRAWN'].includes(s.status));
  const graduated = alumni.filter((s) => s.status === 'GRADUATED').length;
  const withdrawn = alumni.filter((s) => s.status === 'WITHDRAWN').length;

  const byYear = {};
  alumni.forEach((s) => {
    const finalRecord = (s.academicHistory || []).slice().reverse()[0];
    const year = finalRecord?.academicYear || 'Unknown';
    byYear[year] = byYear[year] || { graduated: 0, withdrawn: 0 };
    if (s.status === 'GRADUATED') byYear[year].graduated++;
    else byYear[year].withdrawn++;
  });

  res.json({ total: alumni.length, graduated, withdrawn, byYear });
});

module.exports = router;
