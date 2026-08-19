const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { findBestMatch } = require('../utils/textMatch');

const router = express.Router();
const chatLog = collection('chatbot_log');

/**
 * Platform help chatbot
 * -----------------------
 * Same honest heuristic matcher as the academic Q&A (utils/textMatch.js),
 * pointed at a different knowledge base: not schoolwork, but "how do I use
 * NSEMAS" questions. Unlike the academic version, this one is pre-seeded
 * (below) rather than starting empty, since day-one usefulness matters
 * more for a system-help assistant than for a subject-matter one. It's
 * available to every role — a Librarian and a Minister get the same
 * engine, just matched against the same shared FAQ set.
 *
 * When nothing matches well, the bot says so plainly and points at a
 * human channel (Messages) rather than guessing — a wrong confident
 * answer about how to use the system is worse than an honest "I don't
 * know."
 */
const MATCH_THRESHOLD = 0.35;

const FAQS = [
  { q: 'How do I admit a new student', a: 'Go to Students in the sidebar, then click "+ Admit student." Fill in the details — a Ghana Education Unique Learner Number is generated automatically, and you can link or create a parent account in the same form.' },
  { q: 'How do I check attendance', a: 'Open Attendance from the sidebar to see today\'s check-ins, or use the biometric/manual check-in flow from a school-tier account to record it live.' },
  { q: 'How do I create a group', a: 'Go to Groups, click "+ New," name it, and select members. Members you add are invited and must accept before they officially join — or share the join code from an existing group so others can request to join.' },
  { q: 'How do I reset my password', a: 'Click your profile picture in the sidebar, open the Profile tab, and use "Change password" — you\'ll need your current password. If you\'ve forgotten it entirely, ask your school\'s admin to reset it for you.' },
  { q: 'How do I enable two factor authentication 2FA', a: 'Click your profile picture, switch to the Security tab, and click "Enable two-factor authentication." Add the secret key shown to any authenticator app, then confirm with the 6-digit code it generates.' },
  { q: 'How do I create an exam', a: 'Go to Curriculum & Exams, select a class, open the Exams tab, and click "+ New exam." Choose Written for manually-marked exams, or Objective for multiple-choice exams that grade themselves instantly.' },
  { q: 'How do I enter exam scores', a: 'For written exams, open the exam from Curriculum & Exams and click "Enter/view scores." Objective exams grade themselves automatically once a student submits.' },
  { q: 'How do I publish or hold exam results', a: 'Open an objective exam\'s results and use the "Publish now" or "Hold results" button — students only see their score once you\'ve published it, even though grading itself is instant.' },
  { q: 'How do I approve teacher leave', a: 'Go to Leave Management to see pending requests from your school, with an approve/decline action on each one.' },
  { q: 'How do I switch to my executive or leadership role', a: 'If you hold an appointment (like a coordination title or student leadership position), a row of tabs appears at the top of every page — click the one for that role to switch instantly.' },
  { q: 'How do I record a fee payment', a: 'This applies to private schools only. Go to Finance, find the invoice, and click "Record payment" — partial payments are supported, and the balance updates automatically.' },
  { q: 'How do I bulk add members to a group', a: 'When adding members to a group you created, look for the "Quick-select" buttons — they let you add an entire class or role category (like "All Teachers") in one click.' },
  { q: 'How do I message someone', a: 'Go to Messages, click compose, and search for the person\'s name — messaging respects the same scope rules as everything else, so you\'ll only see people within your reach.' },
  { q: 'How do I see my childs results', a: 'From your dashboard, open the Results tab. If you have more than one child, use the child switcher at the top to move between them.' },
];

router.post('/ask', authenticate, (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'message is required' });

  const candidates = FAQS.map((f, i) => ({ id: i, textToMatch: f.q, answer: f.a }));
  const found = findBestMatch(message, candidates, MATCH_THRESHOLD);

  const reply = found
    ? found.match.answer
    : "I don't have a good answer for that yet — it might need a person. Try Messages to reach your school's admin, or rephrase with different words in case I'm just missing the match.";

  chatLog.insert({
    id: uuid(), userId: req.user.id, userRole: req.user.role,
    message: message.trim(), matched: !!found, matchScore: found ? found.score : 0,
    at: new Date().toISOString(),
  });

  res.json({ reply, matched: !!found });
});

module.exports = router;
