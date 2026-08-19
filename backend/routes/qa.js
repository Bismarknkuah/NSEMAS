const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { tokenize, jaccardSimilarity, findBestMatch } = require('../utils/textMatch');

const router = express.Router();
const qaQuestions = collection('qa_questions');
const schools = collection('schools');

/**
 * Self-study Q&A
 * ---------------
 * IMPORTANT — what this actually is: a heuristic word-overlap matcher, not
 * a trained language model. There is no external AI API wired into this
 * backend. "The system trains itself" means exactly this and nothing more:
 * every teacher-answered question becomes a reusable entry, and a new
 * question is compared against all prior ones using Jaccard similarity
 * (word-set overlap, see utils/textMatch.js) — if a good enough match
 * exists, that answer is returned instantly with no teacher involved. If
 * not, the question queues for a real teacher to answer, after which it
 * too becomes reusable. This genuinely reduces repeat work over time; it
 * does not understand meaning, paraphrase, or reason about the subject
 * matter the way a real model would. Framing it any other way to users
 * would be dishonest about what it can do.
 */

const MATCH_THRESHOLD = 0.4;

function findQaMatch(questionText, subject) {
  const candidates = qaQuestions.find((q) => q.status === 'ANSWERED' && (!subject || q.subject === subject));
  const result = findBestMatch(questionText, candidates, MATCH_THRESHOLD, 'questionText');
  return result;
}

// A student (or teacher, for their own study) asks a question. If a
// similar already-answered question exists, they get that answer back
// immediately — otherwise it queues for a teacher.
router.post('/ask', authenticate, (req, res) => {
  const { questionText, subject } = req.body;
  if (!questionText || questionText.trim().length < 5) {
    return res.status(400).json({ error: 'Please write a fuller question (at least a few words)' });
  }
  const schoolId = req.user.scope?.schoolId || null;
  const found = findQaMatch(questionText, subject);

  const record = {
    id: uuid(),
    askedBy: req.user.id,
    askedByName: req.user.name,
    schoolId,
    subject: subject || null,
    questionText: questionText.trim(),
    status: found ? 'AUTO_ANSWERED' : 'PENDING',
    answerText: found ? found.match.answerText : null,
    answeredBy: found ? `Auto-matched from a similar question (${Math.round(found.score * 100)}% word overlap)` : null,
    matchedFromQuestionId: found ? found.match.id : null,
    askedAt: new Date().toISOString(),
    answeredAt: found ? new Date().toISOString() : null,
  };
  qaQuestions.insert(record);
  res.status(201).json(record);
});

router.get('/my-questions', authenticate, (req, res) => {
  const mine = qaQuestions.find((q) => q.askedBy === req.user.id).sort((a, b) => (a.askedAt < b.askedAt ? 1 : -1));
  res.json(mine);
});

// A teacher's queue — questions from their school still awaiting a real
// answer (the auto-match only fires against already-answered ones, so
// this list only ever contains genuinely novel questions).
router.get('/pending', authenticate, (req, res) => {
  if (!['TEACHER', 'HEADMASTER', 'DEPARTMENT_HEAD', 'SUBJECT_COORDINATOR', 'ASSISTANT_HEAD_ACADEMIC'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only teaching staff can answer questions' });
  }
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const pending = qaQuestions.find((q) => q.status === 'PENDING' && allowedIds.has(q.schoolId));
  res.json(pending.sort((a, b) => (a.askedAt < b.askedAt ? -1 : 1)));
});

router.post('/questions/:id/answer', authenticate, (req, res) => {
  if (!['TEACHER', 'HEADMASTER', 'DEPARTMENT_HEAD', 'SUBJECT_COORDINATOR', 'ASSISTANT_HEAD_ACADEMIC'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only teaching staff can answer questions' });
  }
  const q = qaQuestions.findById(req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(q.schoolId)) return res.status(403).json({ error: 'No access to this question' });

  const { answerText } = req.body;
  if (!answerText || !answerText.trim()) return res.status(400).json({ error: 'answerText is required' });

  const updated = qaQuestions.updateById(q.id, {
    status: 'ANSWERED', answerText: answerText.trim(), answeredBy: req.user.name, answeredAt: new Date().toISOString(),
  });
  res.json(updated);
});

// The browsable knowledge base — every answered question becomes a
// self-study resource, not just a one-off reply to whoever asked it.
router.get('/knowledge-base', authenticate, (req, res) => {
  const { subject, search } = req.query;
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  let list = qaQuestions.find((q) => (q.status === 'ANSWERED' || q.status === 'AUTO_ANSWERED') && allowedIds.has(q.schoolId));
  if (subject) list = list.filter((q) => q.subject === subject);
  if (search) {
    const terms = tokenize(search);
    list = list.filter((q) => {
      const overlap = jaccardSimilarity(terms, tokenize(q.questionText));
      return overlap > 0 || q.questionText.toLowerCase().includes(search.toLowerCase());
    });
  }
  res.json(list.sort((a, b) => (a.answeredAt < b.answeredAt ? 1 : -1)).slice(0, 100));
});

module.exports = router;
