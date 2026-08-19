const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { notify } = require('./messages');

const router = express.Router();
const students = collection('students');
const schools = collection('schools');
const transfers = collection('transfers');
const attendance = collection('attendance');
const users = collection('users');

function parentUserIdFor(studentId) {
  const parent = users.findOne((u) => u.role === 'PARENT' && (u.scope?.studentId === studentId || u.childId === studentId));
  return parent ? parent.id : null;
}

/**
 * Determine the required approval chain based on how "far" the transfer is,
 * exactly as specified: same school -> same circuit -> same district ->
 * same region different district -> different regions.
 */
function buildApprovalChain(fromSchool, toSchool) {
  if (fromSchool.id === toSchool.id) {
    return ['CLASS_TEACHER', 'HEADMASTER'];
  }
  if (fromSchool.circuit === toSchool.circuit) {
    return ['SENDING_HEADMASTER', 'RECEIVING_HEADMASTER'];
  }
  if (fromSchool.district === toSchool.district) {
    return ['SENDING_HEADMASTER', 'RECEIVING_HEADMASTER', 'CIRCUIT_SUPERVISOR'];
  }
  if (fromSchool.region === toSchool.region) {
    return ['SENDING_HEADMASTER', 'RECEIVING_HEADMASTER', 'DISTRICT_DIRECTOR_SENDING', 'DISTRICT_DIRECTOR_RECEIVING', 'REGIONAL_DIRECTOR'];
  }
  return [
    'SENDING_HEADMASTER', 'RECEIVING_HEADMASTER',
    'DISTRICT_DIRECTOR_SENDING', 'DISTRICT_DIRECTOR_RECEIVING',
    'REGIONAL_DIRECTOR_SENDING', 'REGIONAL_DIRECTOR_RECEIVING',
    'GES_HEADQUARTERS',
  ];
}

/** Role(s) permitted to approve a given chain step, by name only — see
 * isEligibleForStep below for the actual, complete check. This alone is
 * NOT sufficient authorization: it doesn't verify which specific school,
 * district, or region the approver needs to be at. */
function rolesForStep(step) {
  return {
    CLASS_TEACHER: ['TEACHER'],
    HEADMASTER: ['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN'],
    SENDING_HEADMASTER: ['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN'],
    RECEIVING_HEADMASTER: ['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN'],
    CIRCUIT_SUPERVISOR: ['CIRCUIT_SUPERVISOR'],
    DISTRICT_DIRECTOR_SENDING: ['DISTRICT_DIRECTOR'],
    DISTRICT_DIRECTOR_RECEIVING: ['DISTRICT_DIRECTOR'],
    REGIONAL_DIRECTOR: ['REGIONAL_DIRECTOR'],
    REGIONAL_DIRECTOR_SENDING: ['REGIONAL_DIRECTOR'],
    REGIONAL_DIRECTOR_RECEIVING: ['REGIONAL_DIRECTOR'],
    GES_HEADQUARTERS: ['DIRECTOR_GENERAL', 'NATIONAL_EMIS_ADMIN'],
  }[step] || [];
}

/**
 * The real, complete check for whether a specific person can approve a
 * specific step of a specific transfer — role name alone (rolesForStep)
 * was never enough: it doesn't verify which side of the transfer this
 * approver is actually on. Without this, any Headmaster anywhere could
 * approve a "SENDING_HEADMASTER" step, not just the one genuinely at the
 * sending school.
 */
function isEligibleForStep(step, user, fromSchool, toSchool) {
  if (!rolesForStep(step).includes(user.role)) return false;
  const scope = user.scope || {};
  switch (step) {
    case 'CLASS_TEACHER':
    case 'HEADMASTER':
      // Same-school transfer — fromSchool and toSchool are the same school.
      return scope.schoolId === fromSchool.id;
    case 'SENDING_HEADMASTER':
      return scope.schoolId === fromSchool.id;
    case 'RECEIVING_HEADMASTER':
      return scope.schoolId === toSchool.id;
    case 'CIRCUIT_SUPERVISOR':
      return scope.circuit === fromSchool.circuit; // same circuit on both sides in this scenario
    case 'DISTRICT_DIRECTOR_SENDING':
      return scope.district === fromSchool.district;
    case 'DISTRICT_DIRECTOR_RECEIVING':
      return scope.district === toSchool.district;
    case 'REGIONAL_DIRECTOR':
      return scope.region === fromSchool.region; // same region on both sides in this scenario
    case 'REGIONAL_DIRECTOR_SENDING':
      return scope.region === fromSchool.region;
    case 'REGIONAL_DIRECTOR_RECEIVING':
      return scope.region === toSchool.region;
    case 'GES_HEADQUARTERS':
      return true; // genuinely national-tier roles only (DIRECTOR_GENERAL, NATIONAL_EMIS_ADMIN) — no location to check
    default:
      return false;
  }
}

router.post('/', authenticate, requireRole(
  'HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'TEACHER', 'PARENT'
), (req, res) => {
  const { studentId, toSchoolId, reason } = req.body;
  const student = students.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (req.user.role !== 'PARENT' && !allowedIds.has(student.schoolId)) {
    return res.status(403).json({ error: 'No access to this student' });
  }
  if (req.user.role === 'PARENT' && req.user.scope?.studentId !== studentId) {
    return res.status(403).json({ error: 'Parents may only request transfer for their own child' });
  }

  const fromSchool = schools.findById(student.schoolId);
  const toSchool = schools.findById(toSchoolId);
  if (!toSchool) return res.status(404).json({ error: 'Destination school not found' });
  if (fromSchool.id === toSchool.id) return res.status(400).json({ error: 'Destination must differ from current school (use class-change for intra-school moves)' });

  const chain = buildApprovalChain(fromSchool, toSchool);
  const record = {
    id: uuid(),
    studentId,
    fromSchoolId: fromSchool.id,
    toSchoolId: toSchool.id,
    reason: reason || '',
    status: 'SUBMITTED',
    approvalChain: chain,
    approvals: [],
    snapshot: {
      profile: { name: student.name, geuln: student.geuln, class: student.class, level: student.level },
      attendance: attendance.find((a) => a.studentId === studentId).length,
      behaviourNotes: student.behaviourNotes || [],
      medical: student.medical,
    },
    submittedBy: req.user.name,
    submittedAt: new Date().toISOString(),
  };
  transfers.insert(record);
  res.status(201).json(record);
});

router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  let list = transfers.all().filter((t) => allowedIds.has(t.fromSchoolId) || allowedIds.has(t.toSchoolId));
  if (req.query.status) list = list.filter((t) => t.status === req.query.status);
  res.json(list.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)));
});

router.get('/:id', authenticate, (req, res) => {
  const t = transfers.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Transfer not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(t.fromSchoolId) && !allowedIds.has(t.toSchoolId)) {
    return res.status(403).json({ error: 'No access to this transfer' });
  }
  res.json(t);
});

router.post('/:id/approve', authenticate, (req, res) => {
  const t = transfers.findById(req.params.id);
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
    return res.status(403).json({ error: `Step "${nextStep}" requires being the ${rolesForStep(nextStep).join(' or ')} at the correct school, district, or region for this transfer — not just holding that role anywhere` });
  }

  const { decision, comment } = req.body; // decision: APPROVE | REJECT
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

  const updated = transfers.updateById(t.id, { approvals, status });

  if (status === 'APPROVED') {
    students.updateById(t.studentId, { schoolId: t.toSchoolId });
    transfers.updateById(t.id, { status: 'COMPLETED', completedAt: new Date().toISOString() });
  }

  const student = students.findById(t.studentId);
  const parentUserId = parentUserIdFor(t.studentId);
  if (parentUserId && student) {
    if (status === 'REJECTED') {
      notify(parentUserId, 'TRANSFER', `Transfer request rejected`, `${student.name}'s transfer request was rejected at the "${nextStep.replace(/_/g, ' ').toLowerCase()}" step.`, `#/transfers`);
    } else if (status === 'APPROVED') {
      notify(parentUserId, 'TRANSFER', `Transfer approved`, `${student.name}'s transfer has been fully approved and completed.`, `#/students/${student.id}`);
    } else {
      notify(parentUserId, 'TRANSFER', `Transfer progressing`, `${student.name}'s transfer request cleared the "${nextStep.replace(/_/g, ' ').toLowerCase()}" step.`, `#/transfers`);
    }
  }

  res.json(transfers.findById(t.id));
});

// Exported alongside the router so the teacher-transfer system (a
// parallel feature, not a modification of this well-tested one) reuses
// the exact same jurisdictional approval-chain logic rather than a
// second, potentially-drifting copy of it.
module.exports = router;
module.exports.buildApprovalChain = buildApprovalChain;
module.exports.rolesForStep = rolesForStep;
module.exports.isEligibleForStep = isEligibleForStep;
