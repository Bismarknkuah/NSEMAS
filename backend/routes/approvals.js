const express = require('express');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { rolesForStep, isEligibleForStep } = require('./transfers');

const router = express.Router();
const leaveRequests = collection('leave_requests');
const studentTransfers = collection('transfers');
const teacherTransfers = collection('teacher_transfers');
const schools = collection('schools');
const students = collection('students');
const teachers = collection('teachers');

/**
 * Approval Centre
 * -------------------
 * One real console instead of scattered pages — but it only ever shows
 * items this specific person is genuinely eligible to act on right now,
 * not everything pending anywhere. A Headmaster sees leave requests for
 * their own school and transfer requests where the next required
 * approval step matches their own role; a District Director sees the
 * district-level step of a transfer, not the school-level one that
 * already happened before it reached them.
 */
router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));

  const pendingLeave = leaveRequests
    .find((l) => l.status === 'PENDING' && allowedIds.has(l.schoolId))
    .map((l) => {
      const teacher = teachers.findById(l.teacherId);
      return {
        kind: 'LEAVE_REQUEST', id: l.id, title: `${l.type} leave — ${teacher ? teacher.name : 'Unknown'}`,
        detail: `${l.startDate} to ${l.endDate}`, submittedAt: l.requestedAt || l.createdAt, link: '#/leave',
      };
    });

  const pendingStudentTransfers = studentTransfers
    .find((t) => ['SUBMITTED', 'UNDER_REVIEW'].includes(t.status))
    .filter((t) => {
      const nextStep = t.approvalChain[t.approvals.length];
      if (!nextStep) return false;
      const fromSchool = schools.findById(t.fromSchoolId);
      const toSchool = schools.findById(t.toSchoolId);
      return isEligibleForStep(nextStep, req.user, fromSchool, toSchool);
    })
    .map((t) => {
      const student = students.findById(t.studentId);
      return {
        kind: 'STUDENT_TRANSFER', id: t.id, title: `Student transfer — ${student ? student.name : t.studentId}`,
        detail: `${t.fromSchoolName || ''} → ${t.toSchoolName || ''}`, submittedAt: t.submittedAt, link: '#/transfers',
      };
    });

  const pendingTeacherTransfers = teacherTransfers
    .find((t) => ['SUBMITTED', 'UNDER_REVIEW'].includes(t.status))
    .filter((t) => {
      const nextStep = t.approvalChain[t.approvals.length];
      if (!nextStep) return false;
      const fromSchool = schools.findById(t.fromSchoolId);
      const toSchool = schools.findById(t.toSchoolId);
      return isEligibleForStep(nextStep, req.user, fromSchool, toSchool);
    })
    .map((t) => ({
      kind: 'TEACHER_TRANSFER', id: t.id, title: `Teacher transfer — ${t.teacherName}`,
      detail: `${t.fromSchoolName} → ${t.toSchoolName}`, submittedAt: t.submittedAt, link: '#/teacher-transfers',
    }));

  const all = [...pendingLeave, ...pendingStudentTransfers, ...pendingTeacherTransfers]
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  const counts = {
    LEAVE_REQUEST: pendingLeave.length,
    STUDENT_TRANSFER: pendingStudentTransfers.length,
    TEACHER_TRANSFER: pendingTeacherTransfers.length,
    total: all.length,
  };

  res.json({ counts, items: all });
});

module.exports = router;
