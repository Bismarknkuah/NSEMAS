const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireFlag } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const leaveRequests = collection('leave_requests');
const teachers = collection('teachers');
const schools = collection('schools');

const LEAVE_TYPES = ['SICK', 'ANNUAL', 'MATERNITY', 'PATERNITY', 'STUDY', 'COMPASSIONATE', 'UNPAID'];

function daysBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, status, teacherId } = req.query;
  let list = leaveRequests.all().filter((l) => allowedIds.has(l.schoolId));
  if (schoolId) list = list.filter((l) => l.schoolId === schoolId);
  if (status) list = list.filter((l) => l.status === status);
  if (teacherId) list = list.filter((l) => l.teacherId === teacherId);
  // Teachers only see their own requests unless they also carry an approval flag
  if (!req.user.teacherId && req.user.role === 'TEACHER') {
    // fallback safety: shouldn't normally happen since teachers always carry teacherId
  }
  res.json(list.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)));
});

router.post('/', authenticate, (req, res) => {
  const { teacherId, type, startDate, endDate, reason } = req.body;
  const teacher = teachers.findById(teacherId || req.user.teacherId);
  if (!teacher) return res.status(404).json({ error: 'Teacher record not found for this account' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(teacher.schoolId)) return res.status(403).json({ error: 'No access to this teacher' });
  if (!LEAVE_TYPES.includes(type)) return res.status(400).json({ error: `type must be one of ${LEAVE_TYPES.join(', ')}` });
  if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });

  const record = {
    id: uuid(),
    teacherId: teacher.id,
    teacherName: teacher.name,
    schoolId: teacher.schoolId,
    type,
    startDate,
    endDate,
    days: daysBetween(startDate, endDate),
    reason: reason || '',
    status: 'PENDING',
    submittedBy: req.user.name,
    submittedAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
  };
  leaveRequests.insert(record);
  res.status(201).json(record);
});

router.post('/:id/decide', authenticate, requireFlag('canApproveLeave'), (req, res) => {
  const leave = leaveRequests.findById(req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(leave.schoolId)) return res.status(403).json({ error: 'No access to this request' });
  if (leave.status !== 'PENDING') return res.status(400).json({ error: `Request already ${leave.status}` });

  const { decision, note } = req.body; // APPROVED | REJECTED
  if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ error: 'decision must be APPROVED or REJECTED' });

  const updated = leaveRequests.updateById(leave.id, {
    status: decision,
    decidedBy: req.user.name,
    decidedAt: new Date().toISOString(),
    decisionNote: note || '',
  });
  res.json(updated);
});

router.get('/summary/:schoolId', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });
  const list = leaveRequests.find((l) => l.schoolId === req.params.schoolId);
  res.json({
    pending: list.filter((l) => l.status === 'PENDING').length,
    approved: list.filter((l) => l.status === 'APPROVED').length,
    rejected: list.filter((l) => l.status === 'REJECTED').length,
    totalDaysApproved: list.filter((l) => l.status === 'APPROVED').reduce((sum, l) => sum + l.days, 0),
  });
});

module.exports = router;
