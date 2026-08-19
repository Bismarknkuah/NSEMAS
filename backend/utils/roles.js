/**
 * NSEMAS Role Registry
 * --------------------
 * The single source of truth for every role in the system, matching the
 * spec's "User Roles" section (6) role-for-role rather than the earlier
 * ~20 broad buckets. Each role carries:
 *
 *   - tier: which level of the national hierarchy it sits at. Only
 *     NATIONAL/REGIONAL/DISTRICT/CIRCUIT tiers get special scope handling
 *     in utils/scope.js (they see everything under them); every other
 *     tier resolves to "their own school" via scope.schoolId, which is
 *     already the generic fallback — so adding new school-level or
 *     student-level roles here doesn't require touching scope.js at all.
 *   - level: seniority number for requireMinLevel() checks.
 *   - flags: fine-grained capability flags used by route permission
 *     checks and by the frontend to decide what UI to show. Not every
 *     role that can *see* something can *do* something with it — e.g. a
 *     Librarian sits at SCHOOL tier (sees their school's data) but does
 *     not get canAdmit (can't admit students or decide promotions).
 */

const TIERS = {
  NATIONAL: 'NATIONAL',
  REGIONAL: 'REGIONAL',
  DISTRICT: 'DISTRICT',
  CIRCUIT: 'CIRCUIT',
  SCHOOL: 'SCHOOL',           // resolves to scope.schoolId
  STUDENT_LEADER: 'STUDENT_LEADER',
  PORTAL: 'PORTAL',           // parent / student
  PRIVATE_BOARD: 'PRIVATE_BOARD',
};

function role(id, label, tier, level, flags = {}) {
  return {
    id, label, tier, level,
    flags: {
      canAdmit: false,        // admit students, biometric enroll, attendance check-in, promotion decide, notes
      canInspect: false,      // create school inspections
      canAnnounce: false,     // publish announcements
      canApproveLeave: false, // approve teacher leave requests
      canManageAcademics: false, // create/edit timetable, exams, enter scores
      canManageCurriculum: false, // create/edit the national subject catalog
      canManageFinance: false, // fee structures, invoices, payments (private schools)
      canMessage: true,       // can use internal messaging (almost everyone)
      ...flags,
    },
  };
}

const ROLE_DEFINITIONS = [
  // ---------------- National Administration ----------------
  role('MINISTER', 'Minister of Education', TIERS.NATIONAL, 100, { canAnnounce: true }),
  role('DEPUTY_MINISTER', 'Deputy Minister', TIERS.NATIONAL, 98, { canAnnounce: true }),
  role('CHIEF_DIRECTOR', 'Chief Director', TIERS.NATIONAL, 96, { canAnnounce: true }),
  role('DIRECTOR_GENERAL', 'Director-General, GES', TIERS.NATIONAL, 95, { canAnnounce: true }),
  role('DEPUTY_DIRECTOR_GENERAL', 'Deputy Director-General', TIERS.NATIONAL, 93, { canAnnounce: true }),
  role('NATIONAL_DIRECTOR', 'National Director', TIERS.NATIONAL, 90, { canAnnounce: true }),
  role('NATIONAL_MONITORING', 'National Monitoring Supervisor', TIERS.NATIONAL, 88, { canInspect: true, canAnnounce: true }),
  role('NATIONAL_QA', 'National Quality Assurance Officer', TIERS.NATIONAL, 88, { canInspect: true, canAnnounce: true }),
  role('NATIONAL_EMIS_ADMIN', 'National EMIS Administrator', TIERS.NATIONAL, 88, { canAnnounce: true, canManageCurriculum: true }),
  role('NATIONAL_ICT_ADMIN', 'National ICT Administrator', TIERS.NATIONAL, 82),
  role('NATIONAL_HR', 'National HR Officer', TIERS.NATIONAL, 82, { canApproveLeave: true }),
  role('NATIONAL_CURRICULUM_OFFICER', 'National Curriculum Officer', TIERS.NATIONAL, 82, { canManageCurriculum: true }),
  role('NATIONAL_EXAM_OFFICER', 'National Examination Officer', TIERS.NATIONAL, 82, { canManageAcademics: true }),

  // ---------------- Regional Administration ----------------
  role('REGIONAL_DIRECTOR', 'Regional Director', TIERS.REGIONAL, 74, { canAnnounce: true }),
  role('ASSISTANT_REGIONAL_DIRECTOR', 'Assistant Regional Director', TIERS.REGIONAL, 70, { canAnnounce: true }),
  role('REGIONAL_MONITORING', 'Regional Monitoring Supervisor', TIERS.REGIONAL, 68, { canInspect: true }),
  role('REGIONAL_QA', 'Regional Quality Assurance Officer', TIERS.REGIONAL, 68, { canInspect: true }),
  role('REGIONAL_EMIS', 'Regional EMIS Officer', TIERS.REGIONAL, 66),
  role('REGIONAL_ICT', 'Regional ICT Officer', TIERS.REGIONAL, 62),
  role('REGIONAL_HR', 'Regional HR Officer', TIERS.REGIONAL, 62, { canApproveLeave: true }),
  role('REGIONAL_FINANCE', 'Regional Finance Officer', TIERS.REGIONAL, 62),

  // ---------------- District Administration ----------------
  role('DISTRICT_DIRECTOR', 'District Director', TIERS.DISTRICT, 58, { canAnnounce: true }),
  role('ASSISTANT_DISTRICT_DIRECTOR', 'Assistant District Director', TIERS.DISTRICT, 54, { canAnnounce: true }),
  role('DISTRICT_MONITORING', 'District Monitoring Supervisor', TIERS.DISTRICT, 52, { canInspect: true }),
  role('DISTRICT_EMIS', 'District EMIS Officer', TIERS.DISTRICT, 50),
  role('DISTRICT_STATISTICS', 'District Statistics Officer', TIERS.DISTRICT, 48),
  role('DISTRICT_ICT', 'District ICT Officer', TIERS.DISTRICT, 48),
  role('DISTRICT_HR', 'District HR Officer', TIERS.DISTRICT, 48, { canApproveLeave: true }),

  // ---------------- Circuit Administration ----------------
  role('CIRCUIT_SUPERVISOR', 'Circuit Supervisor', TIERS.CIRCUIT, 42, { canInspect: true }),
  role('ASSISTANT_CIRCUIT_SUPERVISOR', 'Assistant Circuit Supervisor', TIERS.CIRCUIT, 38, { canInspect: true }),

  // ---------------- School Management ----------------
  role('HEADMASTER', 'Headmaster', TIERS.SCHOOL, 32, { canAdmit: true, canAnnounce: true, canManageAcademics: true, canApproveLeave: true }),
  role('ASSISTANT_HEAD_ACADEMIC', 'Assistant Headmaster (Academic)', TIERS.SCHOOL, 29, { canAdmit: true, canManageAcademics: true }),
  role('ASSISTANT_HEAD_ADMIN', 'Assistant Headmaster (Administration)', TIERS.SCHOOL, 29, { canAdmit: true, canApproveLeave: true }),
  role('SCHOOL_ADMIN', 'School Administrator', TIERS.SCHOOL, 25, { canAdmit: true, canManageAcademics: true }),
  role('SECRETARY', 'Secretary', TIERS.SCHOOL, 18),
  role('ACCOUNTANT', 'Accountant', TIERS.SCHOOL, 18),
  role('STOREKEEPER', 'Storekeeper', TIERS.SCHOOL, 16),
  role('LIBRARIAN', 'Librarian', TIERS.SCHOOL, 16),
  role('ICT_COORDINATOR', 'ICT Coordinator', TIERS.SCHOOL, 18),
  role('COUNSELLOR', 'Counsellor', TIERS.SCHOOL, 20),
  role('NURSE', 'School Nurse', TIERS.SCHOOL, 18),
  role('SECURITY_OFFICER', 'Security Officer', TIERS.SCHOOL, 14),

  // ---------------- Teaching Staff ----------------
  role('TEACHER', 'Teacher', TIERS.SCHOOL, 20, { canAdmit: true, canManageAcademics: true }),
  role('DEPARTMENT_HEAD', 'Department Head', TIERS.SCHOOL, 23, { canManageAcademics: true }),
  role('SUBJECT_COORDINATOR', 'Subject Coordinator', TIERS.SCHOOL, 22, { canManageAcademics: true }),
  role('FORM_MASTER', 'Form Master', TIERS.SCHOOL, 21, { canAdmit: true, canManageAcademics: true }),
  role('HOUSE_MASTER', 'House Master', TIERS.SCHOOL, 20),
  role('MATRON', 'Matron', TIERS.SCHOOL, 20), // same duty as House Master — the title used for a girls' house at many schools
  role('SENIOR_HOUSE_MASTER', 'Senior House Master', TIERS.SCHOOL, 24), // oversees every house at the school, not just one
  role('BOARDING_COORDINATOR', 'Boarding Coordinator', TIERS.SCHOOL, 20),
  role('LAB_TECHNICIAN', 'Laboratory Technician', TIERS.SCHOOL, 18),
  role('WORKSHOP_INSTRUCTOR', 'Workshop Instructor', TIERS.SCHOOL, 18, { canManageAcademics: true }),
  role('SPORTS_COORDINATOR', 'Sports Coordinator', TIERS.SCHOOL, 18),

  // ---------------- Private School Additional Roles ----------------
  role('PROPRIETOR', 'Proprietor', TIERS.SCHOOL, 32, { canAdmit: true, canAnnounce: true, canManageAcademics: true, canApproveLeave: true }),
  role('FINANCE_DIRECTOR', 'Finance Director', TIERS.SCHOOL, 26, { canManageFinance: true }),
  role('EXECUTIVE_DIRECTOR', 'Executive Director', TIERS.PRIVATE_BOARD, 30, { canAnnounce: true }),
  role('BOARD_CHAIRMAN', 'School Board Chairman', TIERS.PRIVATE_BOARD, 30),
  role('BOARD_MEMBER', 'Board Member', TIERS.PRIVATE_BOARD, 27),
  role('PROPRIETOR_REP', 'Proprietor Representative', TIERS.PRIVATE_BOARD, 27),

  // ---------------- Student Leadership (Basic Schools) ----------------
  role('SCHOOL_PREFECT', 'School Prefect', TIERS.STUDENT_LEADER, 6),
  role('ASSISTANT_PREFECT', 'Assistant Prefect', TIERS.STUDENT_LEADER, 6),
  role('BOYS_PREFECT', 'Boys Prefect', TIERS.STUDENT_LEADER, 6),
  role('GIRLS_PREFECT', 'Girls Prefect', TIERS.STUDENT_LEADER, 6),
  role('CLASS_PREFECT', 'Class Prefect', TIERS.STUDENT_LEADER, 5),

  // ---------------- Student Leadership (Secondary Schools) ----------------
  role('COURSE_REP', 'Course Representative', TIERS.STUDENT_LEADER, 5),
  role('SRC_EXECUTIVE', 'SRC Executive', TIERS.STUDENT_LEADER, 6),
  role('HALL_REP', 'Hall Representative', TIERS.STUDENT_LEADER, 5),
  role('HOUSE_PREFECT', 'House Prefect', TIERS.STUDENT_LEADER, 5),

  // ---------------- End Users ----------------
  role('PARENT', 'Parent', TIERS.PORTAL, 3),
  role('STUDENT', 'Student', TIERS.PORTAL, 2),
];

const ROLES = Object.fromEntries(ROLE_DEFINITIONS.map((r) => [r.id, r.id]));
const ROLE_LABELS = Object.fromEntries(ROLE_DEFINITIONS.map((r) => [r.id, r.label]));
const ROLE_LEVEL = Object.fromEntries(ROLE_DEFINITIONS.map((r) => [r.id, r.level]));
const ROLE_FLAGS = Object.fromEntries(ROLE_DEFINITIONS.map((r) => [r.id, r.flags]));
const ROLE_TIER = Object.fromEntries(ROLE_DEFINITIONS.map((r) => [r.id, r.tier]));

const rolesInTier = (tier) => ROLE_DEFINITIONS.filter((r) => r.tier === tier).map((r) => r.id);
const rolesWithFlag = (flag) => ROLE_DEFINITIONS.filter((r) => r.flags[flag]).map((r) => r.id);

const NATIONAL_ROLE_IDS = rolesInTier(TIERS.NATIONAL);
const REGIONAL_ROLE_IDS = rolesInTier(TIERS.REGIONAL);
const DISTRICT_ROLE_IDS = rolesInTier(TIERS.DISTRICT);
const CIRCUIT_ROLE_IDS = rolesInTier(TIERS.CIRCUIT);
const STUDENT_LEADER_ROLE_IDS = rolesInTier(TIERS.STUDENT_LEADER);
const PORTAL_ROLE_IDS = rolesInTier(TIERS.PORTAL);

const CAN_ADMIT_ROLE_IDS = rolesWithFlag('canAdmit');
const CAN_INSPECT_ROLE_IDS = rolesWithFlag('canInspect');
const CAN_ANNOUNCE_ROLE_IDS = rolesWithFlag('canAnnounce');
const CAN_APPROVE_LEAVE_ROLE_IDS = rolesWithFlag('canApproveLeave');
const CAN_MANAGE_ACADEMICS_ROLE_IDS = rolesWithFlag('canManageAcademics');
const CAN_MANAGE_CURRICULUM_ROLE_IDS = rolesWithFlag('canManageCurriculum');

module.exports = {
  TIERS, ROLE_DEFINITIONS, ROLES, ROLE_LABELS, ROLE_LEVEL, ROLE_FLAGS, ROLE_TIER,
  NATIONAL_ROLE_IDS, REGIONAL_ROLE_IDS, DISTRICT_ROLE_IDS, CIRCUIT_ROLE_IDS,
  STUDENT_LEADER_ROLE_IDS, PORTAL_ROLE_IDS,
  CAN_ADMIT_ROLE_IDS, CAN_INSPECT_ROLE_IDS, CAN_ANNOUNCE_ROLE_IDS,
  CAN_APPROVE_LEAVE_ROLE_IDS, CAN_MANAGE_ACADEMICS_ROLE_IDS, CAN_MANAGE_CURRICULUM_ROLE_IDS,
};
