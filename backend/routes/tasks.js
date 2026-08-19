const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');
const { notify } = require('./messages');

const router = express.Router();
const tasks = collection('tasks');
const users = collection('users');
const schools = collection('schools');

/**
 * Task assignment
 * -------------------
 * Headmasters (and the equivalent tier at every level above them —
 * Assistant Heads, District/Regional/National oversight, the Minister)
 * can hand a real task to a specific teacher or student and track
 * whether it's actually been done, not just discussed. Deliberately not
 * open to everyone: this is a managerial action, matching the same
 * roles that can already admit students or approve leave.
 */
const CAN_ASSIGN_TASKS = [
  'HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'SCHOOL_ADMIN',
  'CIRCUIT_SUPERVISOR', 'ASSISTANT_CIRCUIT_SUPERVISOR',
  'DISTRICT_DIRECTOR', 'ASSISTANT_DISTRICT_DIRECTOR',
  'REGIONAL_DIRECTOR', 'ASSISTANT_REGIONAL_DIRECTOR',
  'DIRECTOR_GENERAL', 'DEPUTY_DIRECTOR_GENERAL', 'NATIONAL_EMIS_ADMIN',
  'MINISTER', 'DEPUTY_MINISTER',
];

router.post('/', authenticate, (req, res) => {
  if (!CAN_ASSIGN_TASKS.includes(req.user.role)) {
    return res.status(403).json({ error: 'Your role is not authorized to assign tasks' });
  }
  const { assignedToUserId, title, description, dueDate, priority } = req.body;
  if (!assignedToUserId || !title) return res.status(400).json({ error: 'assignedToUserId and title are required' });

  const assignee = users.findById(assignedToUserId);
  if (!assignee) return res.status(404).json({ error: 'Assignee not found' });

  // Can only assign to someone within your own actual jurisdiction — a
  // Headmaster can't hand a task to a teacher at a different school, the
  // same real boundary that governs everything else in this system.
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const assigneeSchoolId = assignee.scope?.schoolId;
  if (req.user.role !== 'MINISTER' && req.user.role !== 'DEPUTY_MINISTER' && req.user.role !== 'DIRECTOR_GENERAL' && req.user.role !== 'DEPUTY_DIRECTOR_GENERAL' && req.user.role !== 'NATIONAL_EMIS_ADMIN') {
    if (!assigneeSchoolId || !allowedIds.has(assigneeSchoolId)) {
      return res.status(403).json({ error: 'You can only assign tasks to people within your own jurisdiction' });
    }
  }

  const record = {
    id: uuid(),
    title,
    description: description || '',
    assignedByUserId: req.user.id,
    assignedByName: req.user.name,
    assignedToUserId,
    assignedToName: assignee.name,
    dueDate: dueDate || null,
    priority: priority || 'NORMAL', // LOW | NORMAL | HIGH
    status: 'PENDING', // PENDING | IN_PROGRESS | DONE
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  tasks.insert(record);
  notify(assignedToUserId, 'TASK', `New task: ${title}`, `Assigned by ${req.user.name}${dueDate ? `, due ${new Date(dueDate).toLocaleDateString()}` : ''}`, '#/tasks');
  res.status(201).json(record);
});

// The tasks someone has been given — what they actually need to see day
// to day, separate from the tasks they've handed out to others.
router.get('/mine', authenticate, (req, res) => {
  const list = tasks.find((t) => t.assignedToUserId === req.user.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(list);
});

// The tasks someone has assigned to others — theirs to follow up on.
router.get('/assigned', authenticate, (req, res) => {
  if (!CAN_ASSIGN_TASKS.includes(req.user.role)) return res.status(403).json({ error: 'Your role does not assign tasks' });
  const list = tasks.find((t) => t.assignedByUserId === req.user.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(list);
});

router.patch('/:id/status', authenticate, (req, res) => {
  const task = tasks.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  // Only the assignee updates their own progress — not the person who
  // handed it out, and not anyone else who happens to know the ID.
  if (task.assignedToUserId !== req.user.id) return res.status(403).json({ error: 'Only the assignee can update this task' });

  const { status } = req.body;
  if (!['PENDING', 'IN_PROGRESS', 'DONE'].includes(status)) return res.status(400).json({ error: 'status must be PENDING, IN_PROGRESS, or DONE' });

  const updates = { status };
  if (status === 'DONE') updates.completedAt = new Date().toISOString();
  const updated = tasks.updateById(task.id, updates);

  if (status === 'DONE') {
    notify(task.assignedByUserId, 'TASK', `Task completed: ${task.title}`, `${req.user.name} marked this done`, '#/tasks');
  }
  res.json(updated);
});

module.exports = router;
