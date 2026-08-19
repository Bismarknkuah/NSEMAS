const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { ROLE_DEFINITIONS, ROLE_LABELS, ROLE_TIER } = require('../utils/roles');
const ALL_ROLE_IDS = ROLE_DEFINITIONS.map((r) => r.id);

const router = express.Router();
const users = collection('users');
const customPositions = collection('custom_positions');
const schools = collection('schools');
const students = collection('students');
const teachers = collection('teachers');
const auditLog = collection('audit_log');
const groups = collection('groups');
const appointments = collection('role_appointments');

/**
 * System Administration console
 * --------------------------------
 * Restricted to NATIONAL_EMIS_ADMIN — the one role in the catalog whose
 * entire job is running the platform itself, distinct from NATIONAL_ICT_ADMIN
 * (infrastructure/systems) or any oversight role (education outcomes).
 * This gives that role genuine upper-level control that no one else has,
 * including national-tier oversight roles: search every account system-
 * wide, create accounts and assign ANY role (including top management —
 * Deputy Minister, Chief Director, Director-General, and so on),
 * reassign an existing account's role, disable/re-enable accounts
 * (immediately, not just at next login — see middleware/auth.js), and
 * inspect the audit trail.
 *
 * The one carve-out: MINISTER accounts are off-limits to admin entirely
 * (cannot be created, edited, disabled, or have their role reassigned
 * by this console) — matching "upper control... apart from the
 * Minister." The Minister sits outside the admin's authority, not under it.
 */
const ADMIN_ROLE = 'NATIONAL_EMIS_ADMIN';
const PROTECTED_ROLE = 'MINISTER';

function publicUserRow(u) {
  const school = u.scope?.schoolId ? schools.findById(u.scope.schoolId) : null;
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    customTitle: u.customTitle || null,
    school: school ? { id: school.id, name: school.name } : null,
    active: u.active !== false,
    isDemoAccount: !!u.isDemoAccount,
    mfaEnabled: !!u.mfaEnabled,
    createdAt: u.createdAt,
  };
}

function usernameFromName(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'user';
  let candidate = base;
  let n = 1;
  while (users.findOne((u) => u.username === candidate)) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

router.get('/roles', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  res.json(ALL_ROLE_IDS.filter((r) => r !== PROTECTED_ROLE).map((r) => ({ role: r, label: ROLE_LABELS[r] || r, tier: ROLE_TIER[r] })));
});

// Region/district reference data, so account creation can collect a real
// jurisdiction instead of leaving scope empty — the exact same list the
// seed data itself is built from, not a second copy that could drift.
router.get('/regions', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  const { REGIONS, DISTRICTS } = require('../utils/seed');
  res.json({ regions: REGIONS, districtsByRegion: DISTRICTS });
});

router.get('/users', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  const { search, role, active } = req.query;
  let list = users.all();
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }
  if (role) list = list.filter((u) => u.role === role);
  if (active === 'true') list = list.filter((u) => u.active !== false);
  if (active === 'false') list = list.filter((u) => u.active === false);
  res.json(list.slice(0, 500).map(publicUserRow)); // capped — this is a search tool, not a full export
});

/**
 * Custom positions
 * -----------------
 * "Admin should be able to add new features or positions like regional and
 * private schools association executives" — but genuinely new permission
 * tiers/flags aren't safe to invent on the fly without touching every
 * authorization check throughout the backend. So this is deliberately
 * narrower and safer: a custom position is a display title layered on top
 * of one of the 67 real roles, inheriting that role's actual tier and
 * permission flags untouched. Someone appointed "Northern Region PTA
 * Association Executive" (baseRole: REGIONAL_DIRECTOR) is, functionally,
 * a Regional Director — every permission check in the system still sees
 * that real role — but their name is shown with their real title
 * everywhere the UI displays it. This gives Admin real flexibility to
 * name new positions without needing engineering work for each one, while
 * every existing security boundary in the codebase stays exactly as
 * tested.
 */
router.post('/custom-positions', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  const { title, description, baseRole } = req.body;
  if (!title || !baseRole) return res.status(400).json({ error: 'title and baseRole are required' });
  if (!ALL_ROLE_IDS.includes(baseRole)) return res.status(400).json({ error: 'Unknown baseRole' });
  if (baseRole === PROTECTED_ROLE) return res.status(403).json({ error: 'Cannot base a custom position on the Minister role' });

  const record = {
    id: uuid(), title, description: description || '', baseRole,
    createdBy: req.user.name, createdAt: new Date().toISOString(),
  };
  customPositions.insert(record);
  res.status(201).json(record);
});

router.get('/custom-positions', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  res.json(customPositions.all().map((p) => ({ ...p, baseRoleLabel: ROLE_LABELS[p.baseRole] || p.baseRole })));
});

router.delete('/custom-positions/:id', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  const inUse = users.findOne((u) => u.customPositionId === req.params.id);
  if (inUse) return res.status(409).json({ error: `Still assigned to ${inUse.name} — reassign them first` });
  customPositions.deleteById(req.params.id);
  res.json({ deleted: true });
});

router.post('/users', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  const { name, role: rawRole, scope, tempPassword, customPositionId } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  let role = rawRole;
  let customTitle = null;
  if (customPositionId) {
    const position = customPositions.findById(customPositionId);
    if (!position) return res.status(404).json({ error: 'Custom position not found' });
    role = position.baseRole;
    customTitle = position.title;
  }
  if (!role) return res.status(400).json({ error: 'role or customPositionId is required' });
  if (!ALL_ROLE_IDS.includes(role)) return res.status(400).json({ error: 'Unknown role' });
  if (role === PROTECTED_ROLE) return res.status(403).json({ error: 'The Minister account is not managed through this console' });

  const username = usernameFromName(name);
  const password = tempPassword || Math.random().toString(36).slice(-10);
  const record = {
    id: uuid(),
    name,
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    customPositionId: customPositionId || null,
    customTitle,
    scope: scope || {},
    active: true,
    createdBy: req.user.name,
    createdAt: new Date().toISOString(),
  };
  users.insert(record);
  auditLog.insert({
    id: uuid(), action: 'ACCOUNT_CREATED', targetUserId: record.id, targetUsername: username,
    performedBy: req.user.name, at: new Date().toISOString(),
  });
  // The temporary password is only ever returned here, once, at creation —
  // never retrievable again, matching how every other credential in this
  // system works.
  res.status(201).json({ ...publicUserRow(record), temporaryPassword: password });
});

router.patch('/users/:id/role', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  const target = users.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === PROTECTED_ROLE) return res.status(403).json({ error: 'The Minister account is not managed through this console' });
  const { role, scope } = req.body;
  if (!role || !ALL_ROLE_IDS.includes(role)) return res.status(400).json({ error: 'Unknown role' });
  if (role === PROTECTED_ROLE) return res.status(403).json({ error: 'The Minister account is not managed through this console' });

  const patch = { role };
  if (scope) patch.scope = scope;
  const updated = users.updateById(target.id, patch);
  auditLog.insert({
    id: uuid(), action: 'ROLE_REASSIGNED', targetUserId: target.id, targetUsername: target.username,
    detail: `${target.role} -> ${role}`, performedBy: req.user.name, at: new Date().toISOString(),
  });
  res.json(publicUserRow(updated));
});

router.post('/users/:id/toggle-active', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  const target = users.findById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'You cannot disable your own account' });
  if (target.role === PROTECTED_ROLE) return res.status(403).json({ error: 'The Minister account is not managed through this console' });

  const newActive = target.active === false; // toggle
  const updated = users.updateById(target.id, { active: newActive });
  auditLog.insert({
    id: uuid(), action: newActive ? 'ACCOUNT_ENABLED' : 'ACCOUNT_DISABLED',
    targetUserId: target.id, targetUsername: target.username,
    performedBy: req.user.name, at: new Date().toISOString(),
  });
  res.json(publicUserRow(updated));
});

router.get('/audit-log', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  const list = auditLog.all().sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 200);
  res.json(list);
});

router.get('/stats', authenticate, requireRole(ADMIN_ROLE), (req, res) => {
  res.json({
    totalUsers: users.count(() => true),
    activeUsers: users.count((u) => u.active !== false),
    disabledUsers: users.count((u) => u.active === false),
    totalSchools: schools.count(() => true),
    totalStudents: students.count((s) => s.status === 'ACTIVE'),
    totalTeachers: teachers.count(() => true),
    activeAppointments: appointments.count((a) => a.active),
    totalGroups: groups.count(() => true),
    demoAccounts: users.count((u) => u.isDemoAccount),
  });
});

module.exports = router;
