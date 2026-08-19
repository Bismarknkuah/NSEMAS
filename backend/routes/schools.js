const express = require('express');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const schools = collection('schools');
const students = collection('students');
const teachers = collection('teachers');

// Basic Education (KG, Primary, JHS) vs Secondary Education (SHS) are
// treated as separate institution categories in the spec — this derives
// that classification from the existing `level` field rather than storing
// it redundantly, so it can never drift out of sync.
function categoryForLevel(level) {
  return level === 'SHS' ? 'SECONDARY' : 'BASIC';
}

function withComputed(s) {
  return {
    ...s,
    category: categoryForLevel(s.level),
    studentCount: students.count((st) => st.schoolId === s.id && st.status === 'ACTIVE'),
    teacherCount: teachers.count((t) => t.schoolId === s.id),
  };
}

router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { type, category } = req.query; // type: PUBLIC|PRIVATE, category: BASIC|SECONDARY
  let list = schools.all().filter((s) => allowedIds.has(s.id));
  if (type) list = list.filter((s) => s.type === type);
  if (category) list = list.filter((s) => categoryForLevel(s.level) === category);
  res.json(list.map(withComputed));
});

router.get('/:id', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.id)) return res.status(403).json({ error: 'No access to this school' });
  const school = schools.findById(req.params.id);
  if (!school) return res.status(404).json({ error: 'School not found' });
  res.json(withComputed(school));
});

module.exports = router;
