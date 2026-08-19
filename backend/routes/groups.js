const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { ROLE_TIER, TIERS, ROLE_LABELS } = require('../utils/roles');

const router = express.Router();
const groups = collection('groups');
const groupMessages = collection('group_messages');
const users = collection('users');
const schools = collection('schools');
const students = collection('students');

/**
 * Group messaging
 * -----------------
 * Who can CREATE a group: anyone except plain Parent/Student accounts
 * (TIERS.PORTAL). Student leadership titles (Course Rep, SRC Executive,
 * etc.), teachers, school staff, and every level of government can all
 * start a group — matching "other executive roles/user types should be
 * able to create groups they want."
 *
 * The seniority barrier: a group's creator can only add members whose
 * tier rank is <= their own. A student leader (tier 1) can add fellow
 * students and other student leaders, but not a teacher or headmaster
 * (tier 2). A teacher/headmaster (tier 2) can add staff and students, but
 * not a District Director (tier 4). This is enforced on every add, not
 * just at creation, so it can't be bypassed by adding members later.
 */
const TIER_RANK = {
  [TIERS.PORTAL]: 0,
  [TIERS.STUDENT_LEADER]: 1,
  [TIERS.SCHOOL]: 2,
  [TIERS.PRIVATE_BOARD]: 2,
  [TIERS.CIRCUIT]: 3,
  [TIERS.DISTRICT]: 4,
  [TIERS.REGIONAL]: 5,
  [TIERS.NATIONAL]: 6,
};

function tierRankOf(role) {
  return TIER_RANK[ROLE_TIER[role]] ?? 0;
}

// A student leader's own class — students.class on the record their
// account (or active appointment) points at. Returns null for non-student
// accounts, where the class restriction below simply doesn't apply.
function creatorClassOf(user) {
  const studentId = user.scope?.studentId || user.studentId;
  if (!studentId) return null;
  const student = students.findById(studentId);
  return student ? student.class : null;
}

// Roles whose remit is genuinely one class (Class Prefect, Course Rep) —
// distinct from school-wide student leadership (Boys/Girls/School Prefect,
// SRC Executive, Hall/House Prefect, Assistant Prefect), which can already
// reach anyone in their own school via the ordinary school-scope check
// below and needs no further narrowing.
const CLASS_SCOPED_LEADER_ROLES = ['CLASS_PREFECT', 'COURSE_REP'];

// The real membership rule, used identically at group creation, at
// add-member time, and to decide what candidates are even offered — so a
// student leader can never end up with someone out-of-bounds in their
// group, regardless of which endpoint they came through.
//   - Tier rank: never add someone who outranks you.
//   - School scope: never add someone outside your visible schools
//     (national tier is exempt — they can organize across schools).
//   - Class scope: a class-level student leader (Class Prefect, Course
//     Rep) adding a plain STUDENT/PARENT can only add their own
//     classmates — but adding another STUDENT_LEADER (a prefect/rep for a
//     different class) is unrestricted, so that person can bring in their
//     own class's members. This is the delegation pattern: a Course Rep
//     can't pull in JHS3 directly, but can add JHS3's Class Prefect, who
//     then adds their own class. School-wide leadership roles (Boys
//     Prefect and similar) skip this narrowing entirely — their remit is
//     the whole school, not one class.
function membershipDecision(creator, member, allowedSchoolIds, isNational) {
  if (tierRankOf(member.role) > tierRankOf(creator.role)) return { ok: false, reason: 'outranks you' };
  if (!isNational && member.scope?.schoolId && !allowedSchoolIds.has(member.scope.schoolId)) return { ok: false, reason: 'outside your scope' };

  if (CLASS_SCOPED_LEADER_ROLES.includes(creator.role) && ROLE_TIER[member.role] === TIERS.PORTAL) {
    const creatorClass = creatorClassOf(creator);
    const memberStudentId = member.scope?.studentId || member.childId;
    const memberStudent = memberStudentId ? students.findById(memberStudentId) : null;
    if (creatorClass && memberStudent && memberStudent.class !== creatorClass) {
      return { ok: false, reason: `only ${creatorClass} classmates — not ${memberStudent.class}` };
    }
  }
  return { ok: true };
}

const MAX_ATTACHMENT_CHARS = 4 * 1024 * 1024; // ~3MB decoded, generous headroom under the 5MB JSON body limit

router.get('/', authenticate, (req, res) => {
  const mine = groups.find((g) => g.memberIds.includes(req.user.id));
  res.json(
    mine.map((g) => {
      const lastMsg = groupMessages.find((m) => m.groupId === g.id).sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))[0];
      return { ...g, memberCount: g.memberIds.length, lastMessage: lastMsg ? { preview: lastMsg.type === 'TEXT' ? lastMsg.body : `[${lastMsg.type}]`, sentAt: lastMsg.sentAt, fromName: lastMsg.fromName } : null };
    }).sort((a, b) => {
      const at = a.lastMessage?.sentAt || a.createdAt;
      const bt = b.lastMessage?.sentAt || b.createdAt;
      return at < bt ? 1 : -1;
    })
  );
});

router.post('/', authenticate, (req, res) => {
  if (ROLE_TIER[req.user.role] === TIERS.PORTAL) {
    return res.status(403).json({ error: 'Students and parents cannot create groups — but students can message classmates directly, or join a group a teacher/student leader creates.' });
  }
  const { name, description, memberUserIds } = req.body;
  if (!name || !Array.isArray(memberUserIds) || !memberUserIds.length) {
    return res.status(400).json({ error: 'name and at least one memberUserIds entry are required' });
  }

  const allowedSchoolIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const isNational = ROLE_TIER[req.user.role] === TIERS.NATIONAL;

  const validMembers = [];
  const rejected = [];
  for (const uid of memberUserIds) {
    const member = users.findById(uid);
    if (!member) continue;
    const decision = membershipDecision(req.user, member, allowedSchoolIds, isNational);
    if (!decision.ok) { rejected.push({ userId: uid, name: member.name, reason: decision.reason }); continue; }
    validMembers.push(uid);
  }

  if (!validMembers.length) {
    return res.status(400).json({ error: 'No valid members — everyone requested was either out of your scope or outranks you', rejected });
  }

  const now = new Date().toISOString();
  const record = {
    id: uuid(),
    name,
    description: description || '',
    createdBy: req.user.id,
    createdByName: req.user.name,
    createdByRole: req.user.role,
    schoolId: req.user.scope?.schoolId || null,
    // Only the creator is an active member at creation — everyone else is
    // invited and must accept before they're really "in" the group.
    memberIds: [req.user.id],
    pendingInvites: validMembers.map((uid) => ({ userId: uid, invitedBy: req.user.name, invitedAt: now })),
    joinRequests: [],
    joinCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    createdAt: now,
  };
  groups.insert(record);
  res.status(201).json({ ...record, rejected: rejected.length ? rejected : undefined });
});

// A person's own pending invitations across every group — the inbox that
// makes "you must accept before you join" a real, visible flow rather
// than a silent backend rule nobody sees.
router.get('/my-invites', authenticate, (req, res) => {
  const mine = groups.all()
    .map((g) => ({ group: g, invite: g.pendingInvites?.find((i) => i.userId === req.user.id) }))
    .filter((x) => x.invite)
    .map((x) => ({ groupId: x.group.id, groupName: x.group.name, invitedBy: x.invite.invitedBy, invitedAt: x.invite.invitedAt }));
  res.json(mine);
});

router.post('/:id/invites/respond', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  const invite = (group.pendingInvites || []).find((i) => i.userId === req.user.id);
  if (!invite) return res.status(404).json({ error: 'You have no pending invite to this group' });

  const { accept } = req.body;
  const remainingInvites = group.pendingInvites.filter((i) => i.userId !== req.user.id);
  if (accept) {
    const updated = groups.updateById(group.id, {
      pendingInvites: remainingInvites,
      memberIds: [...new Set([...group.memberIds, req.user.id])],
    });
    return res.json({ joined: true, group: updated });
  }
  const updated = groups.updateById(group.id, { pendingInvites: remainingInvites });
  res.json({ joined: false, group: updated });
});

// Shareable join link — the creator hands out a short code (e.g. to
// another class's prefect); anyone who submits it requests to join, and
// the creator approves or rejects, same as any other addition.
router.get('/:id/join-code', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.createdBy !== req.user.id) return res.status(403).json({ error: 'Only the group creator can share the join code' });
  res.json({ joinCode: group.joinCode });
});

router.post('/join/:code', authenticate, (req, res) => {
  const group = groups.findOne((g) => g.joinCode === req.params.code.toUpperCase());
  if (!group) return res.status(404).json({ error: 'Invalid or expired join code' });
  if (group.memberIds.includes(req.user.id)) return res.status(409).json({ error: 'You are already a member of this group' });
  if ((group.pendingInvites || []).some((i) => i.userId === req.user.id)) return res.status(409).json({ error: 'You already have a pending invite to this group — check your invitations' });
  if ((group.joinRequests || []).some((r) => r.userId === req.user.id)) return res.status(409).json({ error: 'You already requested to join this group' });

  const creator = users.findById(group.createdBy);
  const allowedSchoolIds = new Set(schoolIdsForUser(creator, schools.all()));
  const isNational = ROLE_TIER[creator.role] === TIERS.NATIONAL;
  const decision = membershipDecision(creator, req.user, allowedSchoolIds, isNational);
  if (!decision.ok) return res.status(403).json({ error: `You can't join this group — ${decision.reason}` });

  const updated = groups.updateById(group.id, {
    joinRequests: [...(group.joinRequests || []), { userId: req.user.id, requestedAt: new Date().toISOString() }],
  });
  res.json({ requested: true, groupName: group.name, group: updated });
});

router.get('/:id/join-requests', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.createdBy !== req.user.id) return res.status(403).json({ error: 'Only the group creator can view join requests' });
  const withNames = (group.joinRequests || []).map((r) => ({ ...r, name: users.findById(r.userId)?.name || 'Unknown' }));
  res.json(withNames);
});

router.post('/:id/join-requests/:userId/:action', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.createdBy !== req.user.id) return res.status(403).json({ error: 'Only the group creator can act on join requests' });
  const { action, userId } = req.params;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'action must be approve or reject' });

  const remaining = (group.joinRequests || []).filter((r) => r.userId !== userId);
  const patch = { joinRequests: remaining };
  if (action === 'approve') patch.memberIds = [...new Set([...group.memberIds, userId])];
  const updated = groups.updateById(group.id, patch);
  res.json(updated);
});

router.post('/:id/members', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.createdBy !== req.user.id) return res.status(403).json({ error: 'Only the group creator can add members' });

  const { userId } = req.body;
  const member = users.findById(userId);
  if (!member) return res.status(404).json({ error: 'User not found' });
  const allowedSchoolIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const isNational = ROLE_TIER[req.user.role] === TIERS.NATIONAL;
  const decision = membershipDecision(req.user, member, allowedSchoolIds, isNational);
  if (!decision.ok) {
    return res.status(403).json({ error: `Can't add ${member.name} — ${decision.reason}` });
  }
  if (group.memberIds.includes(userId)) return res.status(409).json({ error: 'Already a member' });
  if ((group.pendingInvites || []).some((i) => i.userId === userId)) return res.status(409).json({ error: 'Already invited — waiting on their response' });

  const updated = groups.updateById(group.id, {
    pendingInvites: [...(group.pendingInvites || []), { userId, invitedBy: req.user.name, invitedAt: new Date().toISOString() }],
  });
  res.json(updated);
});

// Bulk add — same membership rule applied to every id, one group update
// instead of N round trips. Used by the "Add all of JHS2" / "Add all
// Teachers" bucket buttons.
router.post('/:id/members/bulk', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (group.createdBy !== req.user.id) return res.status(403).json({ error: 'Only the group creator can add members' });

  const { userIds } = req.body;
  if (!Array.isArray(userIds) || !userIds.length) return res.status(400).json({ error: 'userIds must be a non-empty array' });

  const allowedSchoolIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const isNational = ROLE_TIER[req.user.role] === TIERS.NATIONAL;
  const alreadyPending = new Set((group.pendingInvites || []).map((i) => i.userId));

  const added = [];
  const rejected = [];
  const now = new Date().toISOString();
  for (const uid of userIds) {
    if (group.memberIds.includes(uid) || alreadyPending.has(uid)) continue; // already in or already invited — silently skip
    const member = users.findById(uid);
    if (!member) continue;
    const decision = membershipDecision(req.user, member, allowedSchoolIds, isNational);
    if (!decision.ok) { rejected.push({ userId: uid, name: member.name, reason: decision.reason }); continue; }
    added.push({ userId: uid, invitedBy: req.user.name, invitedAt: now });
  }

  const updated = groups.updateById(group.id, { pendingInvites: [...(group.pendingInvites || []), ...added] });
  res.json({ group: updated, addedCount: added.length, rejected });
});

router.post('/:id/leave', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.memberIds.includes(req.user.id)) return res.status(400).json({ error: 'You are not a member of this group' });
  const updated = groups.updateById(group.id, { memberIds: group.memberIds.filter((id) => id !== req.user.id) });
  res.json(updated);
});

// ---------------- Group messages ----------------
router.get('/:id/messages', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.memberIds.includes(req.user.id)) return res.status(403).json({ error: 'Not a member of this group' });

  const list = groupMessages.find((m) => m.groupId === group.id).sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1));
  res.json(list);
});

router.post('/:id/messages', authenticate, (req, res) => {
  const group = groups.findById(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.memberIds.includes(req.user.id)) return res.status(403).json({ error: 'Not a member of this group' });

  const { type, body, fileName, mimeType, fileDataUri, audioDataUri } = req.body;
  const messageType = type || 'TEXT';
  if (!['TEXT', 'FILE', 'AUDIO'].includes(messageType)) {
    return res.status(400).json({ error: 'type must be TEXT, FILE, or AUDIO' });
  }

  const record = {
    id: uuid(),
    groupId: group.id,
    fromUserId: req.user.id,
    fromName: req.user.name,
    type: messageType,
    sentAt: new Date().toISOString(),
  };

  if (messageType === 'TEXT') {
    if (!body) return res.status(400).json({ error: 'body is required for a text message' });
    record.body = body;
  } else if (messageType === 'FILE') {
    if (!fileDataUri || !fileName) return res.status(400).json({ error: 'fileDataUri and fileName are required for a file message' });
    if (fileDataUri.length > MAX_ATTACHMENT_CHARS) return res.status(413).json({ error: 'File too large' });
    record.fileName = fileName;
    record.mimeType = mimeType || 'application/octet-stream';
    record.fileDataUri = fileDataUri;
  } else if (messageType === 'AUDIO') {
    if (!audioDataUri) return res.status(400).json({ error: 'audioDataUri is required for an audio message' });
    if (audioDataUri.length > MAX_ATTACHMENT_CHARS) return res.status(413).json({ error: 'Audio clip too large' });
    record.audioDataUri = audioDataUri;
  }

  groupMessages.insert(record);
  res.status(201).json(record);
});

// Candidate list for "add member" — everyone in the creator's scope that
// they're actually allowed to add, so the UI never even offers an
// out-of-bounds choice. Also returns "buckets" — bulk-select groupings
// (by class, by role) so a Headmaster can "Add all of JHS2" or "Add all
// Teachers" in one click instead of picking people one at a time.
router.get('/candidates/addable', authenticate, (req, res) => {
  const allowedSchoolIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const isNational = ROLE_TIER[req.user.role] === TIERS.NATIONAL;

  const candidates = users.all()
    .filter((u) => u.id !== req.user.id)
    .filter((u) => membershipDecision(req.user, u, allowedSchoolIds, isNational).ok)
    .map((u) => {
      const studentId = u.scope?.studentId || u.studentId;
      const student = ROLE_TIER[u.role] === TIERS.PORTAL && studentId ? students.findById(studentId) : null;
      return { id: u.id, name: u.name, role: u.role, studentClass: student ? student.class : null };
    });

  const buckets = [];
  const byClass = {};
  candidates.forEach((c) => { if (c.studentClass) (byClass[c.studentClass] ||= []).push(c.id); });
  Object.entries(byClass).forEach(([cls, ids]) => {
    if (ids.length > 1) buckets.push({ key: `class:${cls}`, label: `All of ${cls}`, userIds: ids });
  });

  const byRole = {};
  candidates.forEach((c) => { (byRole[c.role] ||= []).push(c.id); });
  Object.entries(byRole).forEach(([role, ids]) => {
    if (ids.length > 1) buckets.push({ key: `role:${role}`, label: `All ${ROLE_LABELS[role] || role}s`, userIds: ids });
  });

  res.json({ candidates, buckets });
});

module.exports = router;
