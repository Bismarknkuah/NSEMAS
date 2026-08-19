const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const assets = collection('assets');
const maintenanceRequests = collection('maintenance_requests');
const schools = collection('schools');

const ASSET_CATEGORIES = ['BUILDING', 'FURNITURE', 'ICT_EQUIPMENT', 'LABORATORY', 'LIBRARY', 'WATER_SANITATION', 'OTHER'];
const CONDITIONS = ['GOOD', 'FAIR', 'POOR', 'NEEDS_REPLACEMENT'];

const MANAGE_ROLES = ['HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'ASSISTANT_HEAD_ADMIN', 'SCHOOL_ADMIN'];
const REQUEST_ROLES = [...MANAGE_ROLES, 'TEACHER'];

// ---- Asset register ----
router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, category } = req.query;
  let list = assets.all().filter((a) => allowedIds.has(a.schoolId));
  if (schoolId) list = list.filter((a) => a.schoolId === schoolId);
  if (category) list = list.filter((a) => a.category === category);
  res.json(list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
});

router.post('/', authenticate, requireRole(...MANAGE_ROLES), (req, res) => {
  const { schoolId, name, category, condition, quantity, notes } = req.body;
  if (!schoolId || !name || !category) return res.status(400).json({ error: 'schoolId, name and category are required' });
  if (!ASSET_CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of ${ASSET_CATEGORIES.join(', ')}` });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const record = {
    id: uuid(),
    schoolId,
    name,
    category,
    condition: CONDITIONS.includes(condition) ? condition : 'GOOD',
    quantity: quantity ? Number(quantity) : 1,
    notes: notes || '',
    registeredBy: req.user.name,
    createdAt: new Date().toISOString(),
  };
  assets.insert(record);
  res.status(201).json(record);
});

router.patch('/:id', authenticate, requireRole(...MANAGE_ROLES), (req, res) => {
  const asset = assets.findById(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(asset.schoolId)) return res.status(403).json({ error: 'No access to this asset' });

  const { condition, quantity, notes } = req.body;
  const patch = {};
  if (condition) {
    if (!CONDITIONS.includes(condition)) return res.status(400).json({ error: `condition must be one of ${CONDITIONS.join(', ')}` });
    patch.condition = condition;
  }
  if (quantity !== undefined) patch.quantity = Number(quantity);
  if (notes !== undefined) patch.notes = notes;
  const updated = assets.updateById(asset.id, patch);
  res.json(updated);
});

// ---- Maintenance requests ----
router.get('/maintenance', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const { schoolId, status } = req.query;
  let list = maintenanceRequests.all().filter((m) => allowedIds.has(m.schoolId));
  if (schoolId) list = list.filter((m) => m.schoolId === schoolId);
  if (status) list = list.filter((m) => m.status === status);
  res.json(list.sort((a, b) => (a.raisedAt < b.raisedAt ? 1 : -1)));
});

router.post('/maintenance', authenticate, requireRole(...REQUEST_ROLES), (req, res) => {
  const { schoolId, assetId, title, description, priority } = req.body;
  if (!schoolId || !title) return res.status(400).json({ error: 'schoolId and title are required' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const record = {
    id: uuid(),
    schoolId,
    assetId: assetId || null,
    title,
    description: description || '',
    priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority) ? priority : 'MEDIUM',
    status: 'OPEN',
    raisedBy: req.user.name,
    raisedAt: new Date().toISOString(),
  };
  maintenanceRequests.insert(record);
  res.status(201).json(record);
});

router.patch('/maintenance/:id', authenticate, requireRole(...MANAGE_ROLES, 'DISTRICT_DIRECTOR', 'DISTRICT_EMIS'), (req, res) => {
  const reqRecord = maintenanceRequests.findById(req.params.id);
  if (!reqRecord) return res.status(404).json({ error: 'Maintenance request not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(reqRecord.schoolId)) return res.status(403).json({ error: 'No access to this request' });

  const { status } = req.body;
  const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DEFERRED'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: `status must be one of ${validStatuses.join(', ')}` });
  const updated = maintenanceRequests.updateById(reqRecord.id, { status, resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : reqRecord.resolvedAt });
  res.json(updated);
});

// ---- Summary (feeds the "infrastructure status" indicator on executive dashboards) ----
router.get('/school/:schoolId/summary', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const list = assets.find((a) => a.schoolId === req.params.schoolId);
  const byCategory = {};
  ASSET_CATEGORIES.forEach((c) => { byCategory[c] = list.filter((a) => a.category === c).length; });
  const poorCondition = list.filter((a) => a.condition === 'POOR' || a.condition === 'NEEDS_REPLACEMENT').length;

  const openMaintenance = maintenanceRequests.count((m) => m.schoolId === req.params.schoolId && m.status !== 'RESOLVED');
  const urgentMaintenance = maintenanceRequests.count((m) => m.schoolId === req.params.schoolId && m.status !== 'RESOLVED' && m.priority === 'URGENT');

  res.json({ totalAssets: list.length, byCategory, poorCondition, openMaintenance, urgentMaintenance });
});

module.exports = router;
