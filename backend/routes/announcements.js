const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireMinLevel } = require('../middleware/auth');

const router = express.Router();
const announcements = collection('announcements');

// Public, unauthenticated subset — for the login page's notice ticker.
// Only ever "ALL"-audience announcements, and only title/date (no body
// preview) so nothing sensitive ever surfaces pre-login.
router.get('/public', (req, res) => {
  const list = announcements
    .all()
    .filter((a) => a.audience === 'ALL')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 10)
    .map((a) => ({ title: a.title, createdAt: a.createdAt }));
  res.json(list);
});

router.get('/', authenticate, (req, res) => {
  const list = announcements
    .all()
    .filter((a) => a.audience === 'ALL' || a.audience === req.user.role)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(list);
});

router.post('/', authenticate, requireMinLevel(40), (req, res) => {
  const { title, body, audience } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });
  const record = {
    id: uuid(),
    title,
    body,
    audience: audience || 'ALL',
    createdBy: req.user.name,
    createdAt: new Date().toISOString(),
  };
  announcements.insert(record);
  res.status(201).json(record);
});

module.exports = router;
