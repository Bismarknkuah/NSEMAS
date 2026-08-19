const express = require('express');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireFlag } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const candidates = collection('national_exam_candidates');
const incomingFeed = collection('national_incoming_feed');
const officialResults = collection('national_exam_results');
const students = collection('students');
const schools = collection('schools');

/**
 * National Examinations Council Integration (BECE / WASSCE)
 * ------------------------------------------------------------
 * This is the piece of the spec that genuinely can't be built against a
 * real system here: there's no reachable WAEC (West African Examinations
 * Council) API or SFTP feed from this sandbox, and no real candidate data
 * to pull. What's real is the *integration shape* — exactly how a school
 * EMIS actually interacts with the exam body in production:
 *
 *   1. REGISTRATION — before the exam, the school registers each JHS3/
 *      SHS3 candidate, which assigns a WAEC-format index number.
 *   2. PUBLICATION — after marking, the exam body publishes results to
 *      its own systems (simulated here as `national_incoming_feed` — the
 *      thing a real integration would receive over an API/SFTP drop).
 *   3. SYNC — the school (or NSEMAS centrally) pulls newly published
 *      results into its own official record store. This is a real,
 *      working operation here: it reads whatever's sitting in the
 *      incoming feed and reconciles it against registered candidates,
 *      exactly like a production nightly sync job would, just against
 *      seeded data instead of a live WAEC feed.
 *   4. VERIFICATION — results can be independently checked by index
 *      number + serial PIN, mirroring WAEC's actual public results
 *      checker (candidates buy a scratch-card PIN; same mechanic here).
 *
 * Results pulled in this way are tagged `source: 'NATIONAL_EXAMS_COUNCIL'`
 * everywhere they appear (report cards, student records) so they're never
 * confused with a school's own locally-entered continuous assessment or
 * mock exam scores.
 */

const EXAM_TYPES = ['BECE', 'WASSCE'];
const REGISTRATION_CLASS = { BECE: 'JHS3', WASSCE: 'SHS3' };

function generateIndexNumber(schoolId, examType) {
  const school = schools.findById(schoolId);
  const regionCode = (school?.region || 'GH').slice(0, 2).toUpperCase();
  const year = new Date().getFullYear();
  const serial = String(Math.floor(100000 + Math.random() * 899999));
  return `${regionCode}${examType === 'BECE' ? '1' : '2'}${year}${serial}`;
}

function generateSerialPin() {
  return crypto.randomBytes(6).toString('hex').toUpperCase(); // 12-char PIN, scratch-card style
}

// ---------------- Candidate registration ----------------
router.get('/candidates', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, examType } = req.query;
  let list = candidates.all().filter((c) => allowedIds.has(c.schoolId));
  if (schoolId) list = list.filter((c) => c.schoolId === schoolId);
  if (examType) list = list.filter((c) => c.examType === examType);

  const officialByIndex = Object.fromEntries(officialResults.all().map((r) => [r.indexNumber, r]));
  res.json(
    list.map((c) => {
      const student = students.findById(c.studentId);
      return {
        ...c,
        studentName: student?.name || 'Unknown',
        resultStatus: officialByIndex[c.indexNumber] ? 'PUBLISHED' : 'PENDING',
      };
    })
  );
});

router.post('/candidates/register', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const { studentId, examType } = req.body;
  if (!EXAM_TYPES.includes(examType)) return res.status(400).json({ error: `examType must be one of ${EXAM_TYPES.join(', ')}` });
  const student = students.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });
  if (student.class !== REGISTRATION_CLASS[examType]) {
    return res.status(400).json({ error: `${examType} registration requires the student to be in ${REGISTRATION_CLASS[examType]}` });
  }
  const existing = candidates.findOne((c) => c.studentId === studentId && c.examType === examType);
  if (existing) return res.status(409).json({ error: 'Student already registered for this examination', candidate: existing });

  const record = {
    id: uuid(),
    studentId,
    schoolId: student.schoolId,
    examType,
    indexNumber: generateIndexNumber(student.schoolId, examType),
    serialPin: generateSerialPin(),
    academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    registeredBy: req.user.name,
    registeredAt: new Date().toISOString(),
  };
  candidates.insert(record);
  res.status(201).json(record);
});

// ---------------- Sync with the exam body's published results ----------------
// In production this hits WAEC's real results feed; here it reconciles
// against the seeded `national_incoming_feed`, which stands in for "results
// the exam body has already published but the school hasn't pulled yet."
router.post('/sync', authenticate, requireFlag('canManageAcademics'), (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId } = req.body;
  if (!schoolId || !allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const myCandidates = candidates.find((c) => c.schoolId === schoolId);
  const alreadySynced = new Set(officialResults.all().map((r) => r.indexNumber));

  let syncedCount = 0;
  let stillPendingAtExamBody = 0;
  const newlySynced = [];
  for (const candidate of myCandidates) {
    if (alreadySynced.has(candidate.indexNumber)) continue;
    const feedEntry = incomingFeed.findOne((f) => f.indexNumber === candidate.indexNumber);
    if (!feedEntry) { stillPendingAtExamBody++; continue; }

    const record = {
      id: uuid(),
      indexNumber: candidate.indexNumber,
      candidateId: candidate.id,
      studentId: candidate.studentId,
      schoolId: candidate.schoolId,
      examType: candidate.examType,
      subjects: feedEntry.subjects,
      overallResult: feedEntry.overallResult,
      source: 'NATIONAL_EXAMS_COUNCIL',
      publishedAt: feedEntry.publishedAt,
      syncedAt: new Date().toISOString(),
      syncedBy: req.user.name,
    };
    officialResults.insert(record);
    newlySynced.push(record);
    syncedCount++;
  }

  res.json({
    candidatesChecked: myCandidates.length,
    newlySynced: syncedCount,
    stillPendingAtExamBody,
    results: newlySynced,
  });
});

router.get('/results', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, studentId } = req.query;
  let list = officialResults.all().filter((r) => allowedIds.has(r.schoolId));
  if (schoolId) list = list.filter((r) => r.schoolId === schoolId);
  if (studentId) list = list.filter((r) => r.studentId === studentId);
  res.json(list.sort((a, b) => (a.syncedAt < b.syncedAt ? 1 : -1)));
});

// ---------------- Public-style checker (index number + serial PIN) ----------------
// Mirrors WAEC's real results-checker mechanic: anyone with the candidate's
// index number AND their scratch-card serial PIN can verify the result —
// this is intentionally not scoped by school, matching how the real
// national checker service works, but it does still require an
// authenticated NSEMAS session and the correct PIN (not just the index
// number) to prevent casual enumeration.
router.post('/verify', authenticate, (req, res) => {
  const { indexNumber, serialPin } = req.body;
  if (!indexNumber || !serialPin) return res.status(400).json({ error: 'indexNumber and serialPin are required' });

  const candidate = candidates.findOne((c) => c.indexNumber === indexNumber);
  if (!candidate || candidate.serialPin !== serialPin.toUpperCase()) {
    return res.status(404).json({ error: 'No matching result found — check the index number and PIN' });
  }
  const result = officialResults.findOne((r) => r.indexNumber === indexNumber);
  if (!result) {
    return res.json({ status: 'PENDING', message: 'This candidate is registered but the exam body has not yet published a result.' });
  }
  const student = students.findById(candidate.studentId);
  const school = schools.findById(candidate.schoolId);
  res.json({
    status: 'PUBLISHED',
    indexNumber,
    examType: result.examType,
    candidateName: student?.name || 'Unknown',
    school: school?.name || 'Unknown',
    subjects: result.subjects,
    overallResult: result.overallResult,
    publishedAt: result.publishedAt,
  });
});

module.exports = router;
