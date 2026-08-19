const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const inspections = collection('inspections');
const schools = collection('schools');

const INSPECTOR_ROLES = [
  'CIRCUIT_SUPERVISOR', 'DISTRICT_DIRECTOR', 'DISTRICT_EMIS',
  'REGIONAL_QA', 'REGIONAL_DIRECTOR', 'NATIONAL_QA', 'NATIONAL_MONITORING',
];

router.get('/', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  let list = inspections.all().filter((i) => allowedIds.has(i.schoolId));
  if (req.query.schoolId) list = list.filter((i) => i.schoolId === req.query.schoolId);
  res.json(list.sort((a, b) => (a.conductedAt < b.conductedAt ? 1 : -1)));
});

router.post('/', authenticate, requireRole(...INSPECTOR_ROLES), (req, res) => {
  const { schoolId, area, scores, findings, photos, gps } = req.body;
  // area: ACADEMIC | ADMINISTRATION | INFRASTRUCTURE
  const school = schools.findById(schoolId);
  if (!school) return res.status(404).json({ error: 'School not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const validAreas = ['ACADEMIC', 'ADMINISTRATION', 'INFRASTRUCTURE'];
  if (!validAreas.includes(area)) return res.status(400).json({ error: `area must be one of ${validAreas.join(', ')}` });

  // scores: object of criterion -> 1-5 rating
  const values = Object.values(scores || {});
  const overallScore = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 20) : null; // normalize to /100

  const record = {
    id: uuid(),
    schoolId,
    area,
    scores: scores || {},
    overallScore,
    findings: findings || '',
    photos: photos || [],
    gps: gps || null,
    inspector: req.user.name,
    inspectorRole: req.user.role,
    conductedAt: new Date().toISOString(),
    digitallySigned: true,
  };
  inspections.insert(record);
  res.status(201).json(record);
});

router.get('/school/:schoolId/summary', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });
  const list = inspections.find((i) => i.schoolId === req.params.schoolId);
  const byArea = {};
  ['ACADEMIC', 'ADMINISTRATION', 'INFRASTRUCTURE'].forEach((area) => {
    const areaRecords = list.filter((i) => i.area === area && i.overallScore !== null);
    byArea[area] = areaRecords.length
      ? Math.round(areaRecords.reduce((sum, r) => sum + r.overallScore, 0) / areaRecords.length)
      : null;
  });
  res.json({ totalInspections: list.length, byArea, latest: list.sort((a, b) => (a.conductedAt < b.conductedAt ? 1 : -1)).slice(0, 5) });
});

module.exports = router;
