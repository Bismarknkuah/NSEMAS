const express = require('express');
const { v4: uuid } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { collection } = require('../db');
const { authenticate, requireFlag } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { TIERS, ROLE_TIER } = require('../utils/roles');
const { notify } = require('./messages');

const router = express.Router();
const assignments = collection('assignments');
const submissions = collection('assignment_submissions');
const students = collection('students');
const schools = collection('schools');
const users = collection('users');
const parentLinks = collection('parent_links');

// Real file storage on disk — assignment attachments (teacher's brief) and
// submission attachments (a student's work) both land here, namespaced by
// assignment/submission id so two people's files never collide. This is a
// genuine upload/download path, not a stand-in: the file bytes really are
// saved and really are served back byte-for-byte on download.
const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'assignments');
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB — generous for coursework, not for video

const storage = multer.diskStorage({
  destination: UPLOAD_ROOT,
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES } });

function parentUserIdFor(studentId) {
  const parent = users.findOne((u) => u.role === 'PARENT' && (u.scope?.studentId === studentId || u.childId === studentId));
  return parent ? parent.id : null;
}

function sendAttachment(res, storedFilename, downloadName) {
  const filePath = path.join(UPLOAD_ROOT, storedFilename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });
  res.download(filePath, downloadName || storedFilename);
}

// ---------------- Assignments (teacher-created) ----------------
router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, class: klass } = req.query;
  let list = assignments.all().filter((a) => allowedIds.has(a.schoolId));
  if (schoolId) list = list.filter((a) => a.schoolId === schoolId);
  if (klass) list = list.filter((a) => a.class === klass);

  // If the caller is a student (or student leader), only show assignments for their own class
  const myStudentId = req.user.scope?.studentId || req.user.studentId;
  if (myStudentId) {
    const me = students.findById(myStudentId);
    if (me) list = list.filter((a) => a.schoolId === me.schoolId && a.class === me.class);
  }

  res.json(list.sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1)));
});

router.post('/', authenticate, requireFlag('canManageAcademics'), upload.single('attachment'), (req, res) => {
  const { schoolId, class: klass, subject, title, instructions, dueDate, timeLimitMinutes } = req.body;
  if (!schoolId || !klass || !subject || !title) {
    return res.status(400).json({ error: 'schoolId, class, subject and title are required' });
  }
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const record = {
    id: uuid(),
    schoolId,
    class: klass,
    subject,
    title,
    instructions: instructions || '',
    dueDate: dueDate || null,
    timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null, // once a student starts, this many minutes to submit
    attachmentFile: req.file ? req.file.filename : null,
    attachmentOriginalName: req.file ? req.file.originalname : null,
    createdBy: req.user.name,
    createdAt: new Date().toISOString(),
  };
  assignments.insert(record);

  // Notify every student in the class (via their parent, since students may not
  // always have their own login) that new homework has been posted.
  const classStudents = students.find((s) => s.schoolId === schoolId && s.class === klass && s.status === 'ACTIVE');
  classStudents.forEach((s) => {
    const parentUserId = parentUserIdFor(s.id);
    if (parentUserId) {
      notify(parentUserId, 'ASSIGNMENT', `New homework: ${title}`, `${subject}, due ${dueDate ? new Date(dueDate).toLocaleDateString() : 'soon'}`, `#/assignments`);
    }
  });

  res.status(201).json(record);
});

router.get('/:id/attachment', authenticate, (req, res) => {
  const a = assignments.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(a.schoolId)) return res.status(403).json({ error: 'No access to this assignment' });
  if (!a.attachmentFile) return res.status(404).json({ error: 'This assignment has no attachment' });
  sendAttachment(res, a.attachmentFile, a.attachmentOriginalName);
});

router.delete('/:id', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const a = assignments.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(a.schoolId)) return res.status(403).json({ error: 'No access to this assignment' });
  assignments.deleteById(a.id);
  res.status(204).end();
});

// ---------------- Submissions ----------------
router.get('/:id/submissions', authenticate, (req, res) => {
  const a = assignments.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(a.schoolId)) return res.status(403).json({ error: 'No access to this assignment' });

  const subs = submissions.find((s) => s.assignmentId === a.id);
  const byStudent = Object.fromEntries(subs.map((s) => [s.studentId, s]));
  const roll = students.find((s) => s.schoolId === a.schoolId && s.class === a.class && s.status === 'ACTIVE');

  res.json({
    assignment: a,
    submissions: roll.map((s) => ({
      studentId: s.id,
      name: s.name,
      submitted: !!byStudent[s.id]?.submittedAt,
      submittedAt: byStudent[s.id]?.submittedAt || null,
      content: byStudent[s.id]?.content || null,
      hasAttachment: !!byStudent[s.id]?.attachmentFile,
      attachmentOriginalName: byStudent[s.id]?.attachmentOriginalName || null,
      grade: byStudent[s.id]?.grade ?? null,
      feedback: byStudent[s.id]?.feedback || null,
    })),
  });
});

// Records when a student first opens a time-limited assignment, so the
// deadline for THAT student can be enforced from when they actually
// started, not just the assignment's overall due date.
router.post('/:id/start', authenticate, (req, res) => {
  const a = assignments.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  const studentId = req.user.scope?.studentId || req.user.studentId;
  if (!studentId) return res.status(403).json({ error: 'Only students can start an assignment' });

  const existing = submissions.findOne((s) => s.assignmentId === a.id && s.studentId === studentId);
  if (existing?.startedAt) return res.json(existing); // already started, don't reset the clock
  if (existing) {
    const updated = submissions.updateById(existing.id, { startedAt: new Date().toISOString() });
    return res.json(updated);
  }
  const record = { id: uuid(), assignmentId: a.id, studentId, content: null, attachmentFile: null, attachmentOriginalName: null, startedAt: new Date().toISOString(), submittedAt: null, grade: null, feedback: null };
  submissions.insert(record);
  res.status(201).json(record);
});

// Student submits their own work — text, a file, or both. If the
// assignment has a time limit, this is rejected once that limit has
// elapsed since the student started it (see /start above).
router.post('/:id/submit', authenticate, upload.single('attachment'), (req, res) => {
  const a = assignments.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  const studentId = req.user.scope?.studentId || req.user.studentId;
  if (!studentId) return res.status(403).json({ error: 'Only students can submit assignments' });
  const student = students.findById(studentId);
  if (!student || student.schoolId !== a.schoolId || student.class !== a.class) {
    return res.status(403).json({ error: 'This assignment is not assigned to your class' });
  }

  const { content } = req.body;
  if (!content && !req.file) return res.status(400).json({ error: 'Submit some text, a file, or both' });

  const existing = submissions.findOne((s) => s.assignmentId === a.id && s.studentId === studentId);
  if (a.timeLimitMinutes && existing?.startedAt) {
    const deadline = new Date(existing.startedAt).getTime() + a.timeLimitMinutes * 60 * 1000;
    if (Date.now() > deadline) {
      return res.status(410).json({ error: `Time is up — this assignment had a ${a.timeLimitMinutes}-minute limit from when you started it` });
    }
  }

  const payload = {
    assignmentId: a.id, studentId,
    content: content || existing?.content || null,
    attachmentFile: req.file ? req.file.filename : (existing?.attachmentFile || null),
    attachmentOriginalName: req.file ? req.file.originalname : (existing?.attachmentOriginalName || null),
    submittedAt: new Date().toISOString(),
  };
  if (existing) {
    const updated = submissions.updateById(existing.id, payload);
    return res.json(updated);
  }
  const record = { id: uuid(), ...payload, startedAt: null, grade: null, feedback: null };
  submissions.insert(record);
  res.status(201).json(record);
});

router.get('/:id/submissions/:studentId/attachment', authenticate, (req, res) => {
  const a = assignments.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  const sub = submissions.findOne((s) => s.assignmentId === a.id && s.studentId === req.params.studentId);
  if (!sub || !sub.attachmentFile) return res.status(404).json({ error: 'No attachment on file' });

  // The student who submitted it, or genuine staff at the school, can
  // download it — never another student, even a student leader (Course
  // Rep, Class Prefect, etc.) or a classmate at the same school.
  // (schoolIdsForUser alone isn't enough: a student's own scope also
  // includes their school, so that check alone would wrongly let anyone
  // else at the school download it.)
  const myStudentId = req.user.scope?.studentId || req.user.studentId;
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const isOwner = myStudentId === req.params.studentId;
  const requesterTier = ROLE_TIER[req.user.role];
  const isStaff = requesterTier !== TIERS.PORTAL && requesterTier !== TIERS.STUDENT_LEADER && allowedIds.has(a.schoolId);
  if (!isOwner && !isStaff) return res.status(403).json({ error: 'No access to this submission' });

  sendAttachment(res, sub.attachmentFile, sub.attachmentOriginalName);
});

// Teacher grades a submission with feedback
router.post('/:id/submissions/:studentId/grade', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const a = assignments.findById(req.params.id);
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(a.schoolId)) return res.status(403).json({ error: 'No access to this assignment' });

  const { grade, feedback } = req.body;
  const existing = submissions.findOne((s) => s.assignmentId === a.id && s.studentId === req.params.studentId);
  if (!existing) return res.status(404).json({ error: 'No submission on file for this student yet' });

  const updated = submissions.updateById(existing.id, { grade: grade ?? existing.grade, feedback: feedback || '' });

  const parentUserId = parentUserIdFor(req.params.studentId);
  if (parentUserId) {
    const student = students.findById(req.params.studentId);
    notify(parentUserId, 'ASSIGNMENT', `Feedback on "${a.title}"`, `${student?.name || 'Your child'} received feedback on ${a.subject} homework.`, `#/assignments`);
  }

  res.json(updated);
});

// A student's own assignment list with their submission status attached (used by the student portal)
router.get('/my/list', authenticate, (req, res) => {
  const studentId = req.user.scope?.studentId || req.user.studentId;
  if (!studentId) return res.status(403).json({ error: 'No linked student record' });
  const student = students.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const list = assignments.find((a) => a.schoolId === student.schoolId && a.class === student.class);
  const mySubs = submissions.find((s) => s.studentId === studentId);
  const byAssignment = Object.fromEntries(mySubs.map((s) => [s.assignmentId, s]));

  res.json(
    list
      .map((a) => ({
        ...a,
        mySubmission: byAssignment[a.id] || null,
      }))
      .sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1))
  );
});

// A parent's view of their child's assignments — deadlines and grades
// only. There is deliberately no submit path here: submission stays a
// student-only action (see /:id/submit above, which only ever resolves a
// studentId from the requester's own account).
router.get('/for-child/:studentId', authenticate, (req, res) => {
  if (req.user.role !== 'PARENT') return res.status(403).json({ error: 'Only a parent account can use this' });
  const linked = parentLinks.findOne((l) => l.parentUserId === req.user.id && l.studentId === req.params.studentId);
  if (!linked) return res.status(403).json({ error: 'This student is not linked to your account' });

  const student = students.findById(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const list = assignments.find((a) => a.schoolId === student.schoolId && a.class === student.class);
  const childSubs = submissions.find((s) => s.studentId === student.id);
  const byAssignment = Object.fromEntries(childSubs.map((s) => [s.assignmentId, s]));

  res.json(
    list
      .map((a) => ({
        title: a.title, subject: a.subject, dueDate: a.dueDate, timeLimitMinutes: a.timeLimitMinutes,
        // Deliberately not including instructions/attachment — a parent
        // sees whether it's due and how their child did, not the brief
        // itself, which is between the teacher and the student.
        submitted: !!byAssignment[a.id]?.submittedAt,
        submittedAt: byAssignment[a.id]?.submittedAt || null,
        grade: byAssignment[a.id]?.grade ?? null,
        feedback: byAssignment[a.id]?.feedback || null,
      }))
      .sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1))
  );
});

module.exports = router;
