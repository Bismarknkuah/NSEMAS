const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { notify } = require('./messages');
const { buildApprovalChain, rolesForStep, isEligibleForStep } = require('./transfers');

const router = express.Router();
const teacherTransfers = collection('teacher_transfers');
const teachers = collection('teachers');
const schools = collection('schools');
const users = collection('users');

/**
 * Teacher transfer requests
 * ----------------------------
 * A parallel feature to student transfers, not a modification of that
 * well-tested system — genuinely different actors (a teacher requesting
 * their own move, rather than a school or parent requesting a student's),
 * but the same real, jurisdiction-aware approval chain: how many steps a
 * request needs, and who can approve each one, depends on how "far" the
 * move actually is — same school is trivial, a different region needs
 * sign-off from both regions plus GES headquarters. That logic already
 * exists and is tested in routes/transfers.js; this file reuses it
 * directly rather than keeping a second copy that could drift.
 */

router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Only a teacher can request their own transfer' });
  const { toSchoolId, reason } = req.body;
  if (!toSchoolId) return res.status(400).json({ error: 'toSchoolId is required' });

  const fromSchoolId = req.user.scope?.schoolId;
  const fromSchool = schools.findById(fromSchoolId);
  const toSchool = schools.findById(toSchoolId);
  if (!fromSchool) return res.status(400).json({ error: 'Your account has no current school on record' });
  if (!toSchool) return res.status(404).json({ error: 'Destination school not found' });
  if (fromSchool.id === toSchool.id) return res.status(400).json({ error: 'Destination must differ from your current school' });

  const existing = teacherTransfers.findOne((t) => t.teacherUserId === req.user.id && !['REJECTED', 'COMPLETED'].includes(t.status));
  if (existing) return res.status(409).json({ error: 'You already have a transfer request in progress' });

  const chain = buildApprovalChain(fromSchool, toSchool);
  const record = {
    id: uuid(),
    teacherUserId: req.user.id,
    teacherName: req.user.name,
    teacherId: req.user.teacherId || null,
    fromSchoolId: fromSchool.id,
    fromSchoolName: fromSchool.name,
    toSchoolId: toSchool.id,
    toSchoolName: toSchool.name,
    reason: reason || '',
    status: 'SUBMITTED',
    approvalChain: chain,
    approvals: [],
    submittedAt: new Date().toISOString(),
  };
  teacherTransfers.insert(record);
  res.status(201).json(record);
});

// The requesting teacher tracks their own request specifically — exactly
// what was asked for, separate from the general jurisdiction-scoped list
// below (which is for the people approving it, not the person waiting).
router.get('/mine', authenticate, (req, res) => {
  const mine = teacherTransfers.find((t) => t.teacherUserId === req.user.id).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  res.json(mine);
});

router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  let list = teacherTransfers.all().filter((t) => allowedIds.has(t.fromSchoolId) || allowedIds.has(t.toSchoolId));
  if (req.query.status) list = list.filter((t) => t.status === req.query.status);
  res.json(list.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)));
});

router.get('/:id', authenticate, (req, res) => {
  const t = teacherTransfers.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const isOwner = t.teacherUserId === req.user.id;
  if (!isOwner && !allowedIds.has(t.fromSchoolId) && !allowedIds.has(t.toSchoolId)) {
    return res.status(403).json({ error: 'No access to this transfer request' });
  }
  res.json(t);
});

router.post('/:id/approve', authenticate, (req, res) => {
  const t = teacherTransfers.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  if (t.status !== 'SUBMITTED' && t.status !== 'UNDER_REVIEW') {
    return res.status(400).json({ error: `Transfer already ${t.status}` });
  }

  const nextStepIndex = t.approvals.length;
  const nextStep = t.approvalChain[nextStepIndex];
  if (!nextStep) return res.status(400).json({ error: 'All approval steps already completed' });

  const fromSchool = schools.findById(t.fromSchoolId);
  const toSchool = schools.findById(t.toSchoolId);
  if (!isEligibleForStep(nextStep, req.user, fromSchool, toSchool)) {
    return res.status(403).json({ error: `Step "${nextStep}" requires being the ${rolesForStep(nextStep).join(' or ')} at the correct school, district, or region for this transfer` });
  }

  const { decision, comment } = req.body;
  const approvals = [
    ...t.approvals,
    { step: nextStep, decision: decision || 'APPROVE', by: req.user.name, role: req.user.role, comment: comment || '', at: new Date().toISOString() },
  ];

  let status = 'UNDER_REVIEW';
  if (decision === 'REJECT') {
    status = 'REJECTED';
  } else if (approvals.length === t.approvalChain.length) {
    status = 'APPROVED';
  }

  teacherTransfers.updateById(t.id, { approvals, status });

  if (status === 'APPROVED') {
    // Move the teacher's own account scope to the new school — and their
    // linked teacher record, if that link exists (see the known gap
    // where admin-created accounts aren't always linked to one).
    const teacherUser = users.findById(t.teacherUserId);
    if (teacherUser) {
      users.updateById(teacherUser.id, { scope: { ...teacherUser.scope, schoolId: t.toSchoolId } });
    }
    if (t.teacherId) {
      teachers.updateById(t.teacherId, { schoolId: t.toSchoolId });
    }
    teacherTransfers.updateById(t.id, { status: 'COMPLETED', completedAt: new Date().toISOString() });
  }

  const readableStep = nextStep.replace(/_/g, ' ').toLowerCase();
  if (status === 'REJECTED') {
    notify(t.teacherUserId, 'TRANSFER', 'Transfer request rejected', `Your transfer request was rejected at the "${readableStep}" step.`, `#/teacher-transfers`);
  } else if (status === 'APPROVED') {
    notify(t.teacherUserId, 'TRANSFER', 'Transfer approved', `Your transfer to ${t.toSchoolName} has been fully approved and completed.`, `#/teacher-transfers`);
  } else {
    notify(t.teacherUserId, 'TRANSFER', 'Transfer progressing', `Your transfer request cleared the "${readableStep}" step.`, `#/teacher-transfers`);
  }

  res.json(teacherTransfers.findById(t.id));
});

module.exports = router;
