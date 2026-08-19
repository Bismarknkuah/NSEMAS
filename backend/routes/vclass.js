const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const sessions = collection('vclass_sessions');

/**
 * Virtual classroom — session management
 * -----------------------------------------
 * The REST side of this feature: creating a class/meeting, generating a
 * join code, and listing who's hosting what. The actual video/audio
 * handshake happens over the WebSocket in utils/vclassSignaling.js — see
 * that file for the real substance of how the calling works.
 *
 * Available to every role, as asked: any authenticated user can host a
 * session (a teacher running a lesson, a headmaster running a staff
 * meeting, a district director running a briefing — anyone). Anyone with
 * the session's join code can enter.
 */

router.post('/sessions', authenticate, (req, res) => {
  const { title, subject, scheduledFor } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const record = {
    id: uuid(),
    title, subject: subject || null, scheduledFor: scheduledFor || null,
    hostUserId: req.user.id, hostName: req.user.name, hostRole: req.user.role,
    joinCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    active: true, createdAt: new Date().toISOString(), endedAt: null,
  };
  sessions.insert(record);
  res.status(201).json(record);
});

router.get('/sessions/mine', authenticate, (req, res) => {
  const hosted = sessions.find((s) => s.hostUserId === req.user.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(hosted);
});

router.get('/sessions/by-code/:code', authenticate, (req, res) => {
  const session = sessions.findOne((s) => s.joinCode === req.params.code.toUpperCase());
  if (!session) return res.status(404).json({ error: 'No session found with that code' });
  if (!session.active) return res.status(410).json({ error: 'This session has ended' });
  res.json(session);
});

router.get('/sessions/:id', authenticate, (req, res) => {
  const session = sessions.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.post('/sessions/:id/end', authenticate, (req, res) => {
  const session = sessions.findById(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.hostUserId !== req.user.id) return res.status(403).json({ error: 'Only the host can end this session' });
  const updated = sessions.updateById(session.id, { active: false, endedAt: new Date().toISOString() });
  res.json(updated);
});

module.exports = router;
