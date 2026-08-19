const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireFlag } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const subjects = collection('subjects');
const timetable = collection('timetable');
const exams = collection('exams');
const examQuestions = collection('exam_questions');
const examResults = collection('exam_results');
const students = collection('students');
const schools = collection('schools');
const teachers = collection('teachers');
const attendance = collection('attendance');
const promotions = collection('promotions');
const materials = collection('learning_materials');
const nationalExamResults = collection('national_exam_results');

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const EXAM_TYPES = ['CONTINUOUS_ASSESSMENT', 'MID_TERM', 'END_OF_TERM', 'MOCK', 'BECE', 'WASSCE'];

/**
 * Ghana's actual BECE/WASSCE-style 9-point grading scale, used here for
 * every exam result so the report card reads like a real Ghanaian report
 * card rather than a generic A-F letter grade.
 */
function gradeForPercentage(pct) {
  if (pct >= 80) return { grade: 1, remark: 'Excellent' };
  if (pct >= 75) return { grade: 2, remark: 'Very Good' };
  if (pct >= 70) return { grade: 3, remark: 'Good' };
  if (pct >= 65) return { grade: 4, remark: 'Credit' };
  if (pct >= 60) return { grade: 5, remark: 'Credit' };
  if (pct >= 55) return { grade: 6, remark: 'Credit' };
  if (pct >= 50) return { grade: 7, remark: 'Pass' };
  if (pct >= 40) return { grade: 8, remark: 'Pass' };
  return { grade: 9, remark: 'Fail' };
}

// ---------------- Subject catalog (national curriculum) ----------------
router.get('/subjects', authenticate, (req, res) => {
  const { level } = req.query;
  let list = subjects.all();
  if (level) list = list.filter((s) => s.level === level || s.level === 'ALL');
  res.json(list.sort((a, b) => a.name.localeCompare(b.name)));
});

router.post('/subjects', authenticate, requireFlag('canManageCurriculum'), (req, res) => {
  const { name, code, level, category } = req.body;
  if (!name || !level) return res.status(400).json({ error: 'name and level are required' });
  const record = {
    id: uuid(),
    name,
    code: code || name.slice(0, 4).toUpperCase(),
    level, // KG | PRIMARY | JHS | SHS | ALL
    category: category === 'ELECTIVE' ? 'ELECTIVE' : 'CORE',
    createdAt: new Date().toISOString(),
  };
  subjects.insert(record);
  res.status(201).json(record);
});

// ---------------- Timetable ----------------
router.get('/timetable/:schoolId', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });
  const { class: klass } = req.query;
  let list = timetable.find((t) => t.schoolId === req.params.schoolId);
  if (klass) list = list.filter((t) => t.class === klass);
  res.json(list);
});

router.post('/timetable', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const { schoolId, class: klass, day, period, subject, teacherId, startTime, endTime } = req.body;
  if (!schoolId || !klass || !day || !period || !subject) {
    return res.status(400).json({ error: 'schoolId, class, day, period and subject are required' });
  }
  if (!DAYS.includes(day)) return res.status(400).json({ error: `day must be one of ${DAYS.join(', ')}` });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  // Replace any existing entry in the same slot (class/day/period) rather than stacking duplicates
  const existing = timetable.findOne((t) => t.schoolId === schoolId && t.class === klass && t.day === day && t.period === Number(period));
  const payload = {
    schoolId, class: klass, day, period: Number(period), subject,
    teacherId: teacherId || null,
    startTime: startTime || null,
    endTime: endTime || null,
  };
  if (existing) {
    const updated = timetable.updateById(existing.id, payload);
    return res.json(updated);
  }
  const record = { id: uuid(), ...payload, createdAt: new Date().toISOString() };
  timetable.insert(record);
  res.status(201).json(record);
});

router.delete('/timetable/:id', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const entry = timetable.findById(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Timetable entry not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(entry.schoolId)) return res.status(403).json({ error: 'No access to this school' });
  timetable.deleteById(entry.id);
  res.status(204).end();
});

// ---------------- Exams ----------------
router.get('/exams', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, class: klass } = req.query;
  let list = exams.all().filter((e) => allowedIds.has(e.schoolId));
  if (schoolId) list = list.filter((e) => e.schoolId === schoolId);
  if (klass) list = list.filter((e) => e.class === klass);
  res.json(list.sort((a, b) => (a.date < b.date ? 1 : -1)));
});

// A student's own view of objective exams for their class — which they
// can take, which they've already submitted, and (only once published)
// what they scored.
router.get('/my-exams', authenticate, (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Students only' });
  const studentId = req.user.scope?.studentId;
  const student = studentId ? students.findById(studentId) : null;
  if (!student) return res.status(400).json({ error: 'No student record linked to this account' });

  const classExams = exams.all().filter((e) => e.schoolId === student.schoolId && e.class === student.class && e.format === 'OBJECTIVE');
  res.json(classExams.map((e) => {
    const result = examResults.findOne((r) => r.examId === e.id && r.studentId === studentId);
    return {
      id: e.id, name: e.name, subject: e.subject, maxScore: e.maxScore, date: e.date,
      submitted: !!result,
      score: result && e.resultsPublished ? result.score : null,
      grade: result && e.resultsPublished ? result.grade : null,
      pending: !!result && !e.resultsPublished,
    };
  }));
});

const EXAM_FORMATS = ['WRITTEN', 'OBJECTIVE'];

router.post('/exams', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const { schoolId, name, examType, academicYear, term, class: klass, subject, maxScore, date, format, holdResults } = req.body;
  if (!schoolId || !name || !klass || !subject) {
    return res.status(400).json({ error: 'schoolId, name, class and subject are required' });
  }
  if (examType && !EXAM_TYPES.includes(examType)) return res.status(400).json({ error: `examType must be one of ${EXAM_TYPES.join(', ')}` });
  if (format && !EXAM_FORMATS.includes(format)) return res.status(400).json({ error: `format must be one of ${EXAM_FORMATS.join(', ')}` });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const record = {
    id: uuid(),
    schoolId,
    name,
    examType: examType || 'END_OF_TERM',
    format: format || 'WRITTEN',
    academicYear: academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    term: term || 1,
    class: klass,
    subject,
    maxScore: maxScore ? Number(maxScore) : 100,
    date: date || new Date().toISOString().slice(0, 10),
    // Objective exams auto-grade instantly by default — a teacher can hold
    // results back for later release. Written exams stay hidden from
    // students/parents until a teacher explicitly publishes them, since
    // there's nothing "instant" about manual marking.
    resultsPublished: format === 'OBJECTIVE' ? !holdResults : false,
    createdBy: req.user.name,
    createdAt: new Date().toISOString(),
  };
  exams.insert(record);
  res.status(201).json(record);
});

// Objective exam question bank — teacher-authored MCQs with a correct
// answer and point value per question.
router.post('/exams/:id/questions', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const exam = exams.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  if (exam.format !== 'OBJECTIVE') return res.status(400).json({ error: 'Questions can only be added to objective-format exams' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(exam.schoolId)) return res.status(403).json({ error: 'No access to this exam' });

  const { questionText, options, correctOptionIndex, points } = req.body;
  if (!questionText || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'questionText and at least 2 options are required' });
  }
  if (correctOptionIndex === undefined || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
    return res.status(400).json({ error: 'correctOptionIndex must point at one of the options' });
  }
  const record = {
    id: uuid(), examId: exam.id, questionText, options, correctOptionIndex,
    points: points ? Number(points) : 1, createdAt: new Date().toISOString(),
  };
  examQuestions.insert(record);
  res.status(201).json(record);
});

// For a student sitting the exam — never exposes the correct answer.
router.get('/exams/:id/questions', authenticate, (req, res) => {
  const exam = exams.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(exam.schoolId)) return res.status(403).json({ error: 'No access to this exam' });

  const isStaff = req.user.role !== 'STUDENT' && req.user.role !== 'PARENT';
  const list = examQuestions.find((q) => q.examId === exam.id);
  res.json(list.map((q) => {
    if (isStaff) return q; // teachers can review/edit their own bank, including the answer key
    const { correctOptionIndex, ...safe } = q;
    return safe;
  }));
});

// Student submits their answers — objective exams grade instantly.
router.post('/exams/:id/submit', authenticate, (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can submit exam answers' });
  const exam = exams.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  if (exam.format !== 'OBJECTIVE') return res.status(400).json({ error: 'Only objective exams can be auto-submitted here' });

  const studentId = req.user.scope?.studentId;
  if (!studentId) return res.status(400).json({ error: 'No student record linked to this account' });
  if (examResults.findOne((r) => r.examId === exam.id && r.studentId === studentId)) {
    return res.status(409).json({ error: 'You have already submitted this exam' });
  }

  const { answers } = req.body; // [{ questionId, selectedOptionIndex }]
  if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers array is required' });
  const questions = examQuestions.find((q) => q.examId === exam.id);
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0) || 1;

  let earned = 0;
  const answerMap = Object.fromEntries(answers.map((a) => [a.questionId, a.selectedOptionIndex]));
  for (const q of questions) {
    if (answerMap[q.id] === q.correctOptionIndex) earned += q.points;
  }
  const pct = Math.round((earned / totalPoints) * 100);
  const scaledScore = Math.round((pct / 100) * exam.maxScore);
  const { grade, remark } = gradeForPercentage(pct);

  const record = {
    id: uuid(), examId: exam.id, studentId, score: scaledScore, grade, remark,
    enteredBy: 'Auto-graded (objective)', enteredAt: new Date().toISOString(), autoGraded: true,
  };
  examResults.insert(record);
  res.status(201).json({
    ...record,
    // Even though grading is instant, the student only sees their own
    // score right away if the exam isn't being held for later release.
    resultVisible: exam.resultsPublished,
  });
});

// Publish/hold results — the teacher's release-timing control.
router.patch('/exams/:id/publish-results', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const exam = exams.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(exam.schoolId)) return res.status(403).json({ error: 'No access to this exam' });
  const { published } = req.body;
  const updated = exams.updateById(exam.id, { resultsPublished: !!published });
  res.json(updated);
});

router.get('/exams/:id/results', authenticate, (req, res) => {
  const exam = exams.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(exam.schoolId)) return res.status(403).json({ error: 'No access to this exam' });

  const isStaff = req.user.role !== 'STUDENT' && req.user.role !== 'PARENT';
  const results = examResults.find((r) => r.examId === exam.id);
  const byStudent = Object.fromEntries(results.map((r) => [r.studentId, r]));
  const roll = students.find((s) => s.schoolId === exam.schoolId && s.class === exam.class && s.status === 'ACTIVE');

  // Staff always see real marks (they entered them, or oversee the class).
  // A student/parent only sees a score once the teacher has published it —
  // even for an auto-graded objective exam, "instant" is the teacher's
  // choice, not an automatic bypass of that control.
  const held = !exam.resultsPublished && !isStaff;

  res.json({
    exam,
    results: roll.map((s) => ({
      studentId: s.id,
      name: s.name,
      score: held ? null : (byStudent[s.id]?.score ?? null),
      grade: held ? null : (byStudent[s.id]?.grade ?? null),
      remark: held ? null : (byStudent[s.id]?.remark ?? null),
      pending: held && !!byStudent[s.id],
    })),
  });
});

// Bulk score entry for a whole class at once
router.post('/exams/:id/results', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const exam = exams.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(exam.schoolId)) return res.status(403).json({ error: 'No access to this exam' });

  const { scores } = req.body; // [{ studentId, score }]
  if (!Array.isArray(scores)) return res.status(400).json({ error: 'scores array is required' });

  const saved = [];
  for (const entry of scores) {
    if (entry.score === null || entry.score === undefined || entry.score === '') continue;
    const score = Number(entry.score);
    const pct = Math.round((score / exam.maxScore) * 100);
    const { grade, remark } = gradeForPercentage(pct);
    const existing = examResults.findOne((r) => r.examId === exam.id && r.studentId === entry.studentId);
    const payload = { examId: exam.id, studentId: entry.studentId, score, grade, remark, enteredBy: req.user.name, enteredAt: new Date().toISOString() };
    if (existing) {
      saved.push(examResults.updateById(existing.id, payload));
    } else {
      const record = { id: uuid(), ...payload };
      examResults.insert(record);
      saved.push(record);
    }
  }
  res.status(201).json({ saved: saved.length });
});

// ---------------- Report card ----------------
router.get('/report-card/:studentId', authenticate, (req, res) => {
  const student = students.findById(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });

  const academicYear = req.query.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  const term = req.query.term ? Number(req.query.term) : 1;
  const school = schools.findById(student.schoolId);

  const relevantExams = exams.find((e) => e.schoolId === student.schoolId && e.class === student.class && e.academicYear === academicYear && e.term === term);
  const isStaff = req.user.role !== 'STUDENT' && req.user.role !== 'PARENT';
  const subjectRows = relevantExams
    .filter((exam) => isStaff || exam.resultsPublished)
    .map((exam) => {
    const result = examResults.findOne((r) => r.examId === exam.id && r.studentId === student.id);
    return {
      subject: exam.subject,
      examType: exam.examType,
      score: result?.score ?? null,
      maxScore: exam.maxScore,
      grade: result?.grade ?? null,
      remark: result?.remark ?? null,
    };
  }).filter((r) => r.score !== null);

  const overallAverage = subjectRows.length
    ? Math.round(subjectRows.reduce((sum, r) => sum + (r.score / r.maxScore) * 100, 0) / subjectRows.length)
    : null;

  const attendanceRecords = attendance.find((a) => a.studentId === student.id);
  const present = attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attendanceRate = attendanceRecords.length ? Math.round((present / attendanceRecords.length) * 100) : null;

  const seriousBehaviour = (student.behaviourNotes || []).filter((n) => n.type === 'SERIOUS').length;
  const latestPromotion = promotions.find((p) => p.studentId === student.id).sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1))[0];

  // Official BECE/WASSCE results (if any) are pulled in separately from
  // school-entered continuous assessment/mock scores and shown distinctly,
  // tagged with their source, so a report card never conflates a school's
  // own marking with a certified national result.
  const officialResults = nationalExamResults.find((r) => r.studentId === student.id);

  res.json({
    student: { id: student.id, name: student.name, geuln: student.geuln, class: student.class },
    school: school ? { name: school.name, type: school.type, level: school.level } : null,
    academicYear,
    term,
    subjects: subjectRows,
    nationalExamResults: officialResults.map((r) => ({
      examType: r.examType,
      indexNumber: r.indexNumber,
      subjects: r.subjects,
      overallResult: r.overallResult,
      source: 'NATIONAL_EXAMS_COUNCIL',
      publishedAt: r.publishedAt,
    })),
    overallAverage,
    attendanceRate,
    daysPresent: present,
    daysRecorded: attendanceRecords.length,
    conduct: seriousBehaviour > 0 ? `${seriousBehaviour} serious incident(s) on record` : 'Satisfactory',
    latestPromotionOutcome: latestPromotion ? latestPromotion.outcome : null,
    generatedAt: new Date().toISOString(),
  });
});

// ---------------- Learning materials ----------------
// Text/link-based resources (no file upload in this environment) that
// teachers post per class/subject, and students access from their portal.
router.get('/materials', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, class: klass } = req.query;
  let list = materials.all().filter((m) => allowedIds.has(m.schoolId));
  if (schoolId) list = list.filter((m) => m.schoolId === schoolId);
  if (klass) list = list.filter((m) => m.class === klass);

  const myStudentId = req.user.scope?.studentId || req.user.studentId;
  if (myStudentId) {
    const me = students.findById(myStudentId);
    if (me) list = list.filter((m) => m.schoolId === me.schoolId && m.class === me.class);
  }
  res.json(list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
});

router.post('/materials', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const { schoolId, class: klass, subject, title, description, url } = req.body;
  if (!schoolId || !klass || !subject || !title) {
    return res.status(400).json({ error: 'schoolId, class, subject and title are required' });
  }
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const record = {
    id: uuid(), schoolId, class: klass, subject, title,
    description: description || '', url: url || null,
    postedBy: req.user.name, createdAt: new Date().toISOString(),
  };
  materials.insert(record);
  res.status(201).json(record);
});

router.delete('/materials/:id', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const m = materials.findById(req.params.id);
  if (!m) return res.status(404).json({ error: 'Material not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(m.schoolId)) return res.status(403).json({ error: 'No access to this material' });
  materials.deleteById(m.id);
  res.status(204).end();
});

module.exports = router;
