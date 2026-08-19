const jwt = require('jsonwebtoken');
const { ROLES, ROLE_LEVEL, ROLE_LABELS, ROLE_FLAGS, ROLE_TIER } = require('../utils/roles');
const { collection } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'nsemas-dev-secret-change-in-production';

/**
 * Role hierarchy used across NSEMAS.
 * Every user has exactly one `role` plus a `scope` (region/district/circuit/school id)
 * that determines which slice of national data they can see. The full role
 * catalog (67 roles matching the spec's User Roles section) lives in
 * utils/roles.js; this module just re-exports what auth/permission checks
 * need plus the JWT machinery.
 */

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      scope: user.scope, // { region, district, circuit, schoolId, studentId? }
      name: user.name,
      teacherId: user.teacherId || null,
      studentId: user.studentId || user.scope?.studentId || null,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // An admin disabling an account should take effect immediately, not
    // just block the next login — a live session shouldn't outlive that.
    const users = collection('users');
    const account = users.findById(payload.id);
    if (!account || account.active === false) {
      return res.status(403).json({ error: 'This account has been disabled' });
    }
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Restrict a route to a set of roles */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}

/** Restrict a route to at least a minimum seniority level */
function requireMinLevel(level) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if ((ROLE_LEVEL[req.user.role] || 0) < level) {
      return res.status(403).json({ error: 'Insufficient seniority for this action' });
    }
    next();
  };
}

/** Restrict a route to roles carrying a given capability flag (see utils/roles.js) */
function requireFlag(flagName) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!ROLE_FLAGS[req.user.role] || !ROLE_FLAGS[req.user.role][flagName]) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}

module.exports = {
  signToken, authenticate, requireRole, requireMinLevel, requireFlag,
  ROLES, ROLE_LEVEL, ROLE_LABELS, ROLE_FLAGS, ROLE_TIER, JWT_SECRET,
};
