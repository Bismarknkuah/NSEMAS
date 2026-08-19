const express = require('express');
const bcrypt = require('bcryptjs');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const users = collection('users');
const auditLog = collection('audit_log');
const { v4: uuid } = require('uuid');

const MAX_PICTURE_BYTES = 800 * 1024; // ~800KB, generous for a profile photo, keeps the JSON store sane

// ---------------- Edit contact info ----------------
router.patch('/', authenticate, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { email, phone, name } = req.body;
  const patch = {};
  if (email !== undefined) patch.email = email || null;
  if (phone !== undefined) patch.phone = phone || null;
  // Display name is editable, but deliberately narrow — this isn't an
  // identity-change mechanism, just cosmetic (e.g. preferred name).
  if (name !== undefined && name.trim()) patch.name = name.trim();

  const updated = users.updateById(user.id, patch);
  res.json({ name: updated.name, email: updated.email, phone: updated.phone });
});

// ---------------- Change password ----------------
router.post('/change-password', authenticate, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  users.updateById(user.id, { passwordHash: bcrypt.hashSync(newPassword, 10) });
  auditLog.insert({ id: uuid(), action: 'PASSWORD_CHANGED', userId: user.id, username: user.username, at: new Date().toISOString() });
  res.json({ success: true });
});

// ---------------- Profile picture ----------------
// Stored as a data URI directly on the user record — no separate file/blob
// storage exists in this build, and a profile photo is small enough that
// this is a reasonable tradeoff (capped well under the DB's row size).
router.post('/picture', authenticate, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { imageDataUri } = req.body;
  if (!imageDataUri || !imageDataUri.startsWith('data:image/')) {
    return res.status(400).json({ error: 'imageDataUri must be a data:image/... URI' });
  }
  if (imageDataUri.length > MAX_PICTURE_BYTES * 1.4) { // base64 overhead ~33%
    return res.status(413).json({ error: 'Image too large — please use a smaller photo (under ~600KB)' });
  }

  users.updateById(user.id, { profilePicture: imageDataUri });
  res.json({ success: true });
});

router.delete('/picture', authenticate, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  users.updateById(user.id, { profilePicture: null });
  res.json({ success: true });
});

module.exports = router;
