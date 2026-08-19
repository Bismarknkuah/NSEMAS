const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireMinLevel } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { sendEmail, sendSMS } = require('../utils/notificationChannels');
const { ROLE_TIER } = require('../utils/roles');

const router = express.Router();
const messages = collection('messages');
const notifications = collection('notifications');
const users = collection('users');
const students = collection('students');
const schools = collection('schools');

/**
 * Simple threaded messaging: a thread is identified by the sorted pair of
 * participant user IDs plus an optional studentId (so a parent and a
 * teacher can have a separate thread per child if needed). Not a full
 * inbox system — but real send/receive/read-state, not a stub.
 */
function threadKey(userA, userB, studentId) {
  return [userA, userB].sort().join(':') + (studentId ? `:${studentId}` : '');
}

function notify(userId, type, title, body, link) {
  notifications.insert({
    id: uuid(), userId, type, title, body, link: link || null,
    read: false, createdAt: new Date().toISOString(),
  });

  // Fan out to email/SMS too, if the user has contact details on file and
  // hasn't opted out. This runs fire-and-forget (like a real system would
  // queue it) so it never blocks or fails the request that triggered it.
  const user = users.findById(userId);
  if (!user) return;
  const prefs = user.notificationPrefs || { email: true, sms: true };
  if (prefs.email !== false && user.email) {
    sendEmail({ to: user.email, subject: title, body }).catch((e) => console.error('sendEmail failed:', e.message));
  }
  if (prefs.sms !== false && user.phone) {
    sendSMS({ to: user.phone, body: `${title} — ${body}`.slice(0, 300) }).catch((e) => console.error('sendSMS failed:', e.message));
  }
}

router.get('/threads', authenticate, (req, res) => {
  const mine = messages.all().filter((m) => m.fromUserId === req.user.id || m.toUserId === req.user.id);
  const byThread = {};
  mine.forEach((m) => {
    byThread[m.threadKey] = byThread[m.threadKey] || [];
    byThread[m.threadKey].push(m);
  });
  const threads = Object.entries(byThread).map(([key, msgs]) => {
    msgs.sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
    const latest = msgs[0];
    const otherUserId = latest.fromUserId === req.user.id ? latest.toUserId : latest.fromUserId;
    const otherUser = users.findById(otherUserId);
    const unread = msgs.filter((m) => m.toUserId === req.user.id && !m.readAt).length;
    return {
      threadKey: key,
      otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, role: otherUser.role } : null,
      studentId: latest.studentId || null,
      lastMessage: latest.body,
      lastSentAt: latest.sentAt,
      unread,
    };
  });
  res.json(threads.sort((a, b) => (a.lastSentAt < b.lastSentAt ? 1 : -1)));
});

router.get('/threads/:threadKey', authenticate, (req, res) => {
  const list = messages
    .find((m) => m.threadKey === req.params.threadKey && (m.fromUserId === req.user.id || m.toUserId === req.user.id))
    .sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1));
  // Mark incoming messages as read
  list.forEach((m) => {
    if (m.toUserId === req.user.id && !m.readAt) {
      messages.updateById(m.id, { readAt: new Date().toISOString() });
    }
  });
  res.json(messages.find((m) => m.threadKey === req.params.threadKey).sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1)));
});

router.post('/send', authenticate, (req, res) => {
  const { toUserId, studentId, body } = req.body;
  if (!toUserId || !body) return res.status(400).json({ error: 'toUserId and body are required' });
  const recipient = users.findById(toUserId);
  if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

  if (studentId) {
    // Tied to a specific student's record — both parties must actually
    // have a relationship to that student/school (e.g. teacher <-> parent).
    const student = students.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
    const recipientAllowedIds = new Set(schoolIdsForUser(recipient, schools.all()));
    const senderOk = allowedIds.has(student.schoolId) || req.user.scope?.studentId === studentId || req.user.childId === studentId;
    const recipientOk = recipientAllowedIds.has(student.schoolId) || recipient.scope?.studentId === studentId || recipient.childId === studentId;
    if (!senderOk || !recipientOk) return res.status(403).json({ error: 'Neither party has access to this student' });
  } else {
    // General peer/colleague messaging (including student <-> student) —
    // allowed when both parties share a school, or when either side sits
    // at circuit tier or above (cross-school oversight messaging).
    const GOV_TIERS = ['CIRCUIT', 'DISTRICT', 'REGIONAL', 'NATIONAL'];
    const senderIsGov = GOV_TIERS.includes(ROLE_TIER[req.user.role]);
    const recipientIsGov = GOV_TIERS.includes(ROLE_TIER[recipient.role]);
    const sameSchool = req.user.scope?.schoolId && req.user.scope.schoolId === recipient.scope?.schoolId;
    if (!sameSchool && !senderIsGov && !recipientIsGov) {
      return res.status(403).json({ error: 'You can only message people at your own school, or government-tier contacts' });
    }
  }

  const key = threadKey(req.user.id, toUserId, studentId);
  const record = {
    id: uuid(),
    threadKey: key,
    fromUserId: req.user.id,
    fromName: req.user.name,
    toUserId,
    studentId: studentId || null,
    body,
    sentAt: new Date().toISOString(),
    readAt: null,
  };
  messages.insert(record);
  notify(toUserId, 'MESSAGE', `New message from ${req.user.name}`, body.slice(0, 120), `#/messages/${key}`);
  res.status(201).json(record);
});

// ---------------- Notifications feed ----------------
router.get('/notifications', authenticate, (req, res) => {
  const list = notifications.find((n) => n.userId === req.user.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(list.slice(0, 50));
});

router.post('/notifications/:id/read', authenticate, (req, res) => {
  const n = notifications.findById(req.params.id);
  if (!n || n.userId !== req.user.id) return res.status(404).json({ error: 'Notification not found' });
  res.json(notifications.updateById(n.id, { read: true }));
});

router.post('/notifications/read-all', authenticate, (req, res) => {
  const mine = notifications.find((n) => n.userId === req.user.id && !n.read);
  mine.forEach((n) => notifications.updateById(n.id, { read: true }));
  res.json({ marked: mine.length });
});

// ---------------- Comms outbox (email/SMS dispatch log) ----------------
// Restricted to senior national roles since this log contains everyone's
// contact details and message content.
const commsOutbox = collection('comms_outbox');
router.get('/outbox', authenticate, requireMinLevel(82), (req, res) => {
  const list = commsOutbox.all().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(list.slice(0, 200));
});

module.exports = router;
module.exports.notify = notify; // exported so other routes can raise notifications on relevant events
