const { NATIONAL_ROLE_IDS, REGIONAL_ROLE_IDS, DISTRICT_ROLE_IDS, CIRCUIT_ROLE_IDS } = require('./roles');

/**
 * Given a logged-in user (from JWT) and a list of schools, return the subset
 * of school IDs that user is permitted to see, based on where they sit in
 * the national -> regional -> district -> circuit -> school hierarchy.
 *
 * The role lists driving each tier live in utils/roles.js (the central role
 * registry) — every one of the ~67 roles in the spec is tagged with a tier
 * there, so adding a new role never requires touching this function; only
 * NATIONAL/REGIONAL/DISTRICT/CIRCUIT tiers get special handling here, and
 * every other role (school staff, teaching staff, student leaders, parents,
 * students) already falls through to the generic "their own school" rule.
 */
function schoolIdsForUser(user, allSchools) {
  const role = user.role;
  const scope = user.scope || {};

  if (NATIONAL_ROLE_IDS.includes(role)) {
    return allSchools.map((s) => s.id);
  }
  if (REGIONAL_ROLE_IDS.includes(role)) {
    return allSchools.filter((s) => s.region === scope.region).map((s) => s.id);
  }
  if (DISTRICT_ROLE_IDS.includes(role)) {
    return allSchools.filter((s) => s.district === scope.district).map((s) => s.id);
  }
  if (CIRCUIT_ROLE_IDS.includes(role)) {
    return allSchools.filter((s) => s.circuit === scope.circuit).map((s) => s.id);
  }
  // School-level, teaching staff, student leaders, parents, students: single school only
  if (scope.schoolId) return [scope.schoolId];
  return [];
}

function canAccessSchool(user, schoolId, allSchools) {
  return schoolIdsForUser(user, allSchools).includes(schoolId);
}

module.exports = { schoolIdsForUser, canAccessSchool };
