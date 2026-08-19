/**
 * Permission engine (proof of concept)
 * ----------------------------------------
 * Rather than every route file hardcoding its own list of role names —
 * which is exactly what students.js still does today, and what this
 * file exists to eventually replace — permissions are computed from a
 * role's base grant, combined with modifiers for the school it's being
 * exercised against (level, ownership). A capability like
 * "student.admission" is granted to a role once, here, instead of being
 * copy-pasted into every endpoint that happens to need it.
 *
 * This is deliberately scoped to prove the pattern on one real module
 * (students) rather than attempt every route file at once — migrating
 * ~30 files to this model is a genuine rearchitecture, not something to
 * rush through without the same level of testing every other change in
 * this system has gotten.
 */

// Base grants per role — the permissions a role has everywhere, before
// any school-specific modifier is applied. Matches what students.js's
// six role-array checks actually grant today, exactly, so migrating to
// this doesn't silently change anyone's access.
const BASE_GRANTS = {
  HEADMASTER: ['student.view', 'student.admission', 'student.edit', 'student.transfer', 'student.biometric', 'student.notes'],
  PROPRIETOR: ['student.view', 'student.admission', 'student.edit', 'student.transfer', 'student.biometric', 'student.notes'],
  ASSISTANT_HEAD_ACADEMIC: ['student.view', 'student.admission', 'student.edit', 'student.transfer', 'student.biometric', 'student.notes'],
  ASSISTANT_HEAD_ADMIN: ['student.view', 'student.admission', 'student.edit', 'student.transfer', 'student.biometric', 'student.notes'],
  SCHOOL_ADMIN: ['student.view', 'student.admission', 'student.edit', 'student.transfer', 'student.biometric'],
  DISTRICT_EMIS: ['student.view', 'student.admission', 'student.edit', 'student.transfer'],
  NATIONAL_EMIS_ADMIN: ['student.view', 'student.admission', 'student.edit', 'student.transfer'],
  TEACHER: ['student.view', 'student.biometric', 'student.notes'],
  COUNSELLOR: ['student.view', 'student.notes'],
};

// Modifiers: a permission a role would otherwise have, withdrawn (or
// added) for a specific kind of school. Empty for now — this is exactly
// where "a Private school Headmaster can also manage fees, a Public
// school Headmaster's transfers route through GES" would eventually
// live, without touching BASE_GRANTS or any route file.
const SCHOOL_LEVEL_MODIFIERS = {};

function computePermissions(role, school) {
  const base = new Set(BASE_GRANTS[role] || []);
  const modifier = school ? SCHOOL_LEVEL_MODIFIERS[school.level] : null;
  if (modifier) {
    (modifier.grant || []).forEach((p) => base.add(p));
    (modifier.revoke || []).forEach((p) => base.delete(p));
  }
  return base;
}

function hasPermission(user, school, permission) {
  return computePermissions(user.role, school).has(permission);
}

/** Express middleware — same shape as requireRole/requireFlag, so it
 * drops into an existing route with minimal disruption. Expects the
 * student (or other school-scoped record) to already be loaded onto
 * req so its school can be resolved; falls back to the user's own
 * school scope when nothing more specific is available. */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const school = req.permissionSchool || (req.user.school ? req.user.school : null);
    if (!hasPermission(req.user, school, permission)) {
      return res.status(403).json({ error: `Missing permission: ${permission}` });
    }
    next();
  };
}

module.exports = { computePermissions, hasPermission, requirePermission, BASE_GRANTS };
