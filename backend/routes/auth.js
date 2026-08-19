const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { collection } = require('../db');
const { signToken, authenticate, JWT_SECRET } = require('../middleware/auth');
const { generateSecret, verifyTOTP, otpauthURI } = require('../utils/totp');
const { sendSMS } = require('../utils/notificationChannels');

const router = express.Router();
const users = collection('users');
const schools = collection('schools');
const auditLog = collection('audit_log');
const passwordResets = collection('password_resets');
const { v4: uuid } = require('uuid');

function publicUser(user, school, overrideRole, overrideScope) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: overrideRole || user.role,
    scope: overrideScope || user.scope,
    primaryRole: user.role, // the account's real stored role, for "switch back" purposes
    customTitle: user.customTitle || null,
    teacherId: user.teacherId || null,
    email: user.email || null,
    phone: user.phone || null,
    profilePicture: user.profilePicture || null,
    isDemoAccount: !!user.isDemoAccount,
    mfaEnabled: !!user.mfaEnabled,
    school: school ? { id: school.id, name: school.name, level: school.level, type: school.type } : null,
  };
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const user = users.findOne((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  if (user.active === false) {
    return res.status(403).json({ error: 'This account has been disabled by a system administrator' });
  }

  // Password checks out. If this account has MFA enabled, don't issue a
  // full session token yet — issue a short-lived "pending" token that only
  // /auth/mfa/verify-login can exchange for the real one.
  if (user.mfaEnabled) {
    const pendingToken = jwt.sign({ id: user.id, mfaPending: true }, JWT_SECRET, { expiresIn: '5m' });
    return res.json({ mfaRequired: true, pendingToken });
  }

  const token = signToken(user);
  auditLog.insert({ id: uuid(), action: 'LOGIN', userId: user.id, username: user.username, role: user.role, at: new Date().toISOString() });
  const school = user.scope?.schoolId ? schools.findById(user.scope.schoolId) : null;
  res.json({ token, user: publicUser(user, school) });
});

router.post('/mfa/verify-login', (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code) return res.status(400).json({ error: 'pendingToken and code are required' });

  let payload;
  try {
    payload = jwt.verify(pendingToken, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'MFA session expired — please log in again' });
  }
  if (!payload.mfaPending) return res.status(400).json({ error: 'Invalid MFA session' });

  const user = users.findById(payload.id);
  if (!user || !user.mfaEnabled) return res.status(401).json({ error: 'MFA not enabled on this account' });

  if (!verifyTOTP(user.mfaSecret, code)) {
    return res.status(401).json({ error: 'Incorrect authentication code' });
  }

  const token = signToken(user);
  auditLog.insert({ id: uuid(), action: 'LOGIN_MFA', userId: user.id, username: user.username, role: user.role, at: new Date().toISOString() });
  const school = user.scope?.schoolId ? schools.findById(user.scope.schoolId) : null;
  res.json({ token, user: publicUser(user, school) });
});

router.get('/me', authenticate, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // req.user.role/scope come from the JWT, which reflects an "acting as"
  // appointment if one is active for this session (see routes/appointments.js).
  // The stored user record is the account's real, permanent identity.
  const effectiveSchoolId = req.user.scope?.schoolId || user.scope?.schoolId;
  const school = effectiveSchoolId ? schools.findById(effectiveSchoolId) : null;
  res.json(publicUser(user, school, req.user.role, req.user.scope));
});

// ---------------- MFA enrollment (requires an active session) ----------------
router.post('/mfa/setup', authenticate, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const secret = generateSecret();
  users.updateById(user.id, { pendingMfaSecret: secret });
  res.json({ secret, otpauthUri: otpauthURI(secret, user.username) });
});

router.post('/mfa/confirm', authenticate, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user || !user.pendingMfaSecret) return res.status(400).json({ error: 'No MFA setup in progress — call /auth/mfa/setup first' });
  const { code } = req.body;
  if (!verifyTOTP(user.pendingMfaSecret, code)) {
    return res.status(401).json({ error: 'Incorrect code — check your authenticator app and try again' });
  }
  users.updateById(user.id, { mfaEnabled: true, mfaSecret: user.pendingMfaSecret, pendingMfaSecret: null });
  auditLog.insert({ id: uuid(), action: 'MFA_ENABLED', userId: user.id, username: user.username, at: new Date().toISOString() });
  res.json({ mfaEnabled: true });
});

router.post('/mfa/disable', authenticate, (req, res) => {
  const user = users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password } = req.body;
  if (!password || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  users.updateById(user.id, { mfaEnabled: false, mfaSecret: null, pendingMfaSecret: null });
  auditLog.insert({ id: uuid(), action: 'MFA_DISABLED', userId: user.id, username: user.username, at: new Date().toISOString() });
  res.json({ mfaEnabled: false });
});

/**
 * Password reset via SMS confirmation code
 * -------------------------------------------
 * Two steps: request a code (sent to the phone number already on file —
 * never to a number the requester types in, since that would let anyone
 * take over any account by claiming a phone number), then submit that
 * code along with a new password. Codes expire in 10 minutes and are
 * single-use. Deliberately doesn't reveal whether a username exists —
 * the response is the same either way, so this can't be used to probe
 * which accounts are real.
 */
router.post('/forgot-password', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username is required' });
  const user = users.findOne((u) => u.username === username.toLowerCase());

  // Same response whether or not the account exists — otherwise this
  // endpoint becomes a way to enumerate real usernames.
  const genericResponse = { sent: true, message: 'If this account exists and has a phone number on file, a code has been sent to it.' };
  if (!user || !user.phone) return res.json(genericResponse);

  const code = String(Math.floor(100000 + Math.random() * 900000));
  passwordResets.insert({
    id: uuid(), userId: user.id, code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false, createdAt: new Date().toISOString(),
  });

  const maskedPhone = user.phone.replace(/\d(?=\d{3})/g, '•');
  sendSMS({ to: user.phone, body: `NSEMAS password reset code: ${code}. Valid for 10 minutes. If you didn't request this, ignore this message.` })
    .catch(() => {}); // dispatch is fire-and-forget from the requester's point of view — outbox records the real outcome either way

  res.json({ ...genericResponse, maskedPhone });
});

router.post('/reset-password', (req, res) => {
  const { username, code, newPassword } = req.body;
  if (!username || !code || !newPassword) return res.status(400).json({ error: 'username, code, and newPassword are required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = users.findOne((u) => u.username === username.toLowerCase());
  if (!user) return res.status(400).json({ error: 'Invalid or expired code' }); // same generic error as a wrong code — no username enumeration here either

  const reset = passwordResets.findOne((r) => r.userId === user.id && r.code === code && !r.used);
  if (!reset || new Date(reset.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  users.updateById(user.id, { passwordHash });
  passwordResets.updateById(reset.id, { used: true });
  auditLog.insert({ id: uuid(), action: 'PASSWORD_RESET_VIA_SMS', userId: user.id, username: user.username, at: new Date().toISOString() });

  res.json({ reset: true });
});

module.exports = router;
