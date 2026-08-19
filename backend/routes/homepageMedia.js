const express = require('express');
const { v4: uuid } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const media = collection('homepage_media');

/**
 * Homepage media
 * -----------------
 * Lets national-level executives publish real images or short videos to
 * the public homepage, seen by anyone before they even sign in. This is
 * deliberately restricted to a named list of national-executive roles,
 * not the shared canAnnounce flag — Headmasters also hold canAnnounce,
 * but that's for school-level announcements, a completely different
 * scope from publishing to the entire nation's public homepage.
 */
const NATIONAL_EXECUTIVE_ROLES = ['MINISTER', 'DEPUTY_MINISTER', 'DIRECTOR_GENERAL', 'DEPUTY_DIRECTOR_GENERAL', 'NATIONAL_EMIS_ADMIN'];

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'homepage-media');
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024; // 40MB — enough for a short video, not a movie

const storage = multer.diskStorage({
  destination: UPLOAD_ROOT,
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$|^video\/(mp4|webm|quicktime)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only images (JPEG/PNG/WebP/GIF) or short videos (MP4/WebM/MOV) are allowed'), ok);
  },
});

router.post('/', authenticate, requireRole(...NATIONAL_EXECUTIVE_ROLES), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'A file is required' });
  const { caption } = req.body;
  const record = {
    id: uuid(),
    type: req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    file: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    caption: caption || '',
    active: true,
    publishedBy: req.user.name,
    publishedAt: new Date().toISOString(),
  };
  media.insert(record);
  res.status(201).json(record);
});

// Public — the homepage itself is public, so this needs no auth. Only
// active items, newest first, and capped so one enthusiastic uploader
// can't turn the homepage into an infinite scroll.
router.get('/active', (req, res) => {
  const list = media.find((m) => m.active).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, 20);
  res.json(list);
});

router.get('/file/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_ROOT, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.sendFile(filePath);
});

router.get('/', authenticate, requireRole(...NATIONAL_EXECUTIVE_ROLES), (req, res) => {
  res.json(media.all().sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)));
});

router.delete('/:id', authenticate, requireRole(...NATIONAL_EXECUTIVE_ROLES), (req, res) => {
  const item = media.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  media.updateById(item.id, { active: false });
  res.json({ deactivated: true });
});

module.exports = router;
