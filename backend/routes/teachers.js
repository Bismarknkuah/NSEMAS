const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const teachers = collection('teachers');
const schools = collection('schools');
const teacherAttendance = collection('teacher_attendance');
const lessonPlans = collection('lesson_plans');
const users = collection('users');

function userIdForTeacher(teacherId) {
  const u = users.findOne((u) => u.teacherId === teacherId);
  return u ? u.id : null;
}

router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  let list = teachers.all().filter((t) => allowedIds.has(t.schoolId));
  if (req.query.schoolId) list = list.filter((t) => t.schoolId === req.query.schoolId);
  res.json(
    list.map((t) => {
      const records = teacherAttendance.find((a) => a.teacherId === t.id);
      const onTime = records.filter((r) => r.status === 'ON_TIME').length;
      return { ...t, userId: userIdForTeacher(t.id), punctualityRate: records.length ? Math.round((onTime / records.length) * 100) : null };
    })
  );
});

router.get('/:id', authenticate, (req, res) => {
  const teacher = teachers.findById(req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(teacher.schoolId)) return res.status(403).json({ error: 'No access to this teacher' });
  const attendanceHistory = teacherAttendance.find((a) => a.teacherId === teacher.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const plans = lessonPlans.find((p) => p.teacherId === teacher.id).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  res.json({ ...teacher, attendanceHistory, lessonPlans: plans, userId: userIdForTeacher(teacher.id) });
});

// Submit a lesson plan / syllabus progress entry
router.post('/:id/lesson-plans', authenticate, requireRole('TEACHER', 'HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN'), (req, res) => {
  const teacher = teachers.findById(req.params.id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(teacher.schoolId)) return res.status(403).json({ error: 'No access to this teacher' });

  const { topic, week, class: klass, syllabusCoveragePercent, notes } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic is required' });
  const plan = {
    id: uuid(),
    teacherId: teacher.id,
    schoolId: teacher.schoolId,
    topic,
    week: week || null,
    class: klass || null,
    syllabusCoveragePercent: syllabusCoveragePercent ?? null,
    notes: notes || '',
    submittedAt: new Date().toISOString(),
  };
  lessonPlans.insert(plan);
  res.status(201).json(plan);
});

module.exports = router;
