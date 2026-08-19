const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { TIERS, ROLE_TIER } = require('../utils/roles');

const router = express.Router();
const reports = collection('reports');
const users = collection('users');
const schools = collection('schools');

/**
 * Reports to supervisor
 * -----------------------
 * "Immediate supervisor" is resolved from the same tier/jurisdiction data
 * that already drives every other permission check in this system
 * (utils/scope.js) — not a separately maintained org chart that could
 * drift out of sync. The chain, one hop at a time:
 *
 *   Teaching/support/student-leader/portal (at a school) -> that school's
 *     own leadership (Headmaster/Proprietor/School Admin)
 *   School leadership                       -> their District Director
 *   Circuit tier                            -> their District Director
 *   District tier                           -> their Regional Director
 *   Regional tier                           -> the Director-General
 *   National tier (non-top-management)      -> the Director-General
 *   Director-General / Deputy               -> the Minister
 *   Minister                                -> top of the chain, no one above
 *
 * If nobody currently holds the target role in that jurisdiction (a
 * realistic gap — not every seat is always filled), the report is still
 * saved with a null recipient and a clear "unassigned" status, rather
 * than silently failing or picking an arbitrary stand-in.
 */

const SCHOOL_LEADERSHIP_ROLES = ['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'SCHOOL_ADMIN'];

function findSupervisor(user) {
  const tier = ROLE_TIER[user.role];
  const scope = user.scope || {};

  const bySchoolLeadership = () => {
    if (!scope.schoolId) return null;
    return users.findOne((u) => u.active !== false && u.scope?.schoolId === scope.schoolId
      && (u.role === 'HEADMASTER' || u.role === 'PROPRIETOR'))
      || users.findOne((u) => u.active !== false && u.scope?.schoolId === scope.schoolId && SCHOOL_LEADERSHIP_ROLES.includes(u.role));
  };
  const byRegion = () => {
    if (!scope.region) return null;
    return users.findOne((u) => u.active !== false && u.scope?.region === scope.region && u.role === 'REGIONAL_DIRECTOR')
      || users.findOne((u) => u.active !== false && u.scope?.region === scope.region && u.role === 'ASSISTANT_REGIONAL_DIRECTOR');
  };
  const directorGeneral = () => users.findOne((u) => u.active !== false && u.role === 'DIRECTOR_GENERAL')
    || users.findOne((u) => u.active !== false && u.role === 'DEPUTY_DIRECTOR_GENERAL');
  const minister = () => users.findOne((u) => u.active !== false && u.role === 'MINISTER');

  if (SCHOOL_LEADERSHIP_ROLES.includes(user.role)) {
    // A school leader's own supervisor needs the SCHOOL's district, not
    // the user's own scope.district (usually unset for school accounts).
    const school = scope.schoolId ? schools.findById(scope.schoolId) : null;
    if (school?.district) return users.findOne((u) => u.active !== false && u.scope?.district === school.district && u.role === 'DISTRICT_DIRECTOR')
      || users.findOne((u) => u.active !== false && u.scope?.district === school.district && u.role === 'ASSISTANT_DISTRICT_DIRECTOR');
    return null;
  }
  if (tier === TIERS.SCHOOL || tier === TIERS.PRIVATE_BOARD || tier === TIERS.STUDENT_LEADER || tier === TIERS.PORTAL) {
    return bySchoolLeadership();
  }
  if (tier === TIERS.CIRCUIT) {
    const school = scope.schoolId ? schools.findById(scope.schoolId) : null;
    const district = scope.district || school?.district;
    if (!district) return null;
    return users.findOne((u) => u.active !== false && u.scope?.district === district && u.role === 'DISTRICT_DIRECTOR')
      || users.findOne((u) => u.active !== false && u.scope?.district === district && u.role === 'ASSISTANT_DISTRICT_DIRECTOR');
  }
  if (tier === TIERS.DISTRICT) return byRegion();
  if (tier === TIERS.REGIONAL) return directorGeneral();
  if (user.role === 'MINISTER') return null; // top of the chain — must be checked before the generic NATIONAL fallback below, since Minister is also NATIONAL tier
  if (user.role === 'DIRECTOR_GENERAL' || user.role === 'DEPUTY_DIRECTOR_GENERAL') return minister();
  if (tier === TIERS.NATIONAL) return directorGeneral();
  return null;
}

router.get('/my-supervisor', authenticate, (req, res) => {
  const supervisor = findSupervisor(req.user);
  res.json(supervisor ? { id: supervisor.id, name: supervisor.name, role: supervisor.role } : null);
});

router.post('/', authenticate, (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'subject and body are required' });

  const supervisor = findSupervisor(req.user);
  const record = {
    id: uuid(),
    fromUserId: req.user.id,
    fromName: req.user.name,
    fromRole: req.user.role,
    toUserId: supervisor ? supervisor.id : null,
    toName: supervisor ? supervisor.name : null,
    subject, body,
    status: supervisor ? 'PENDING' : 'UNASSIGNED',
    submittedAt: new Date().toISOString(),
    respondedAt: null,
    response: null,
  };
  reports.insert(record);
  res.status(201).json(record);
});

router.get('/inbox', authenticate, (req, res) => {
  const mine = reports.find((r) => r.toUserId === req.user.id).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  res.json(mine);
});

router.get('/sent', authenticate, (req, res) => {
  const mine = reports.find((r) => r.fromUserId === req.user.id).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  res.json(mine);
});

router.post('/:id/respond', authenticate, (req, res) => {
  const report = reports.findById(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  if (report.toUserId !== req.user.id) return res.status(403).json({ error: 'Only the addressed supervisor can respond' });

  const { response, status } = req.body;
  if (!['ACKNOWLEDGED', 'RESOLVED'].includes(status)) return res.status(400).json({ error: 'status must be ACKNOWLEDGED or RESOLVED' });

  const updated = reports.updateById(report.id, { status, response: response || null, respondedAt: new Date().toISOString() });
  res.json(updated);
});

module.exports = router;
