const express = require('express');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const schools = collection('schools');
const students = collection('students');
const attendance = collection('attendance');
const teacherAttendance = collection('teacher_attendance');
const inspections = collection('inspections');

/**
 * This engine produces its recommendations via transparent, explainable
 * heuristics over the platform's own data (attendance trends, inspection
 * scores, teacher punctuality) rather than a trained machine-learning
 * model. It is intentionally readable/auditable end-to-end, which matters
 * for a government accountability system, and can be swapped for a real
 * trained model later without changing the API surface below.
 */

function studentAttendanceTrend(studentId) {
  const records = attendance.find((a) => a.studentId === studentId).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (records.length < 6) return null;
  const half = Math.floor(records.length / 2);
  const rate = (arr) => {
    const present = arr.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    return arr.length ? present / arr.length : 1;
  };
  const early = rate(records.slice(0, half));
  const recent = rate(records.slice(half));
  return { early, recent, decline: early - recent };
}

router.get('/dropout-risk', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const myStudents = students.all().filter((s) => allowedIds.has(s.schoolId) && s.status === 'ACTIVE');

  const risks = myStudents
    .map((s) => {
      const trend = studentAttendanceTrend(s.id);
      const seriousBehaviour = (s.behaviourNotes || []).filter((n) => n.type === 'SERIOUS').length;
      let score = 0;
      const factors = [];
      if (trend) {
        if (trend.recent < 0.75) { score += 40; factors.push(`Recent attendance ${Math.round(trend.recent * 100)}% (below 75%)`); }
        if (trend.decline > 0.15) { score += 30; factors.push(`Attendance declined ${Math.round(trend.decline * 100)} points recently`); }
      }
      if (seriousBehaviour > 0) { score += seriousBehaviour * 10; factors.push(`${seriousBehaviour} serious behaviour incident(s)`); }
      if (s.medical && s.medical !== 'None') { score += 5; factors.push(`Health condition on file: ${s.medical}`); }
      return { studentId: s.id, name: s.name, schoolId: s.schoolId, class: s.class, riskScore: Math.min(100, score), factors };
    })
    .filter((r) => r.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore);

  res.json({ method: 'rule-based heuristic over attendance trend, behaviour notes, and health flags', students: risks.slice(0, 50) });
});

router.get('/teacher-absenteeism', authenticate, (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const records = teacherAttendance.all().filter((a) => allowedIds.has(a.schoolId));
  const byTeacher = {};
  records.forEach((r) => {
    byTeacher[r.teacherId] = byTeacher[r.teacherId] || { late: 0, total: 0 };
    byTeacher[r.teacherId].total++;
    if (r.status === 'LATE' || r.status === 'INCOMPLETE') byTeacher[r.teacherId].late++;
  });
  const flagged = Object.entries(byTeacher)
    .map(([teacherId, v]) => ({ teacherId, lateRate: Math.round((v.late / v.total) * 100), total: v.total }))
    .filter((x) => x.lateRate > 20)
    .sort((a, b) => b.lateRate - a.lateRate);
  res.json({ method: 'rule-based: flags teachers with >20% late/incomplete clock records', flagged });
});

router.get('/struggling-schools', authenticate, (req, res) => {
  const allSchools = schools.all();
  const allowedIds = new Set(schoolIdsForUser(req.user, allSchools));
  const mySchools = allSchools.filter((s) => allowedIds.has(s.id));

  const result = mySchools.map((s) => {
    const sAttendance = attendance.find((a) => a.schoolId === s.id);
    const present = sAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = sAttendance.length ? present / sAttendance.length : 1;

    const sInspections = inspections.find((i) => i.schoolId === s.id && i.overallScore !== null);
    const avgInspection = sInspections.length ? sInspections.reduce((a, i) => a + i.overallScore, 0) / sInspections.length : null;

    let concernScore = 0;
    const reasons = [];
    if (attendanceRate < 0.8) { concernScore += 40; reasons.push(`Attendance rate ${Math.round(attendanceRate * 100)}%`); }
    if (avgInspection !== null && avgInspection < 60) { concernScore += 40; reasons.push(`Average inspection score ${avgInspection}/100`); }
    if (sInspections.length === 0) { concernScore += 10; reasons.push('No inspection on record'); }

    return { schoolId: s.id, name: s.name, region: s.region, district: s.district, concernScore, reasons };
  })
  .filter((r) => r.concernScore > 0)
  .sort((a, b) => b.concernScore - a.concernScore);

  res.json({ method: 'rule-based composite of attendance rate and inspection scores', schools: result.slice(0, 20) });
});

router.get('/enrollment-forecast', authenticate, (req, res) => {
  const allSchools = schools.all();
  const allowedIds = new Set(schoolIdsForUser(req.user, allSchools));
  const mySchools = allSchools.filter((s) => allowedIds.has(s.id));

  // Simple linear projection based on current admissions-by-year distribution
  const byYear = {};
  students.all().filter((s) => allowedIds.has(s.schoolId)).forEach((s) => {
    const year = (s.admissionDate || '').slice(0, 4);
    if (!year) return;
    byYear[year] = (byYear[year] || 0) + 1;
  });
  const years = Object.keys(byYear).sort();
  const counts = years.map((y) => byYear[y]);
  const avgGrowth = counts.length > 1
    ? counts.slice(1).reduce((sum, c, i) => sum + (c - counts[i]), 0) / (counts.length - 1)
    : 0;
  const lastCount = counts[counts.length - 1] || 0;
  const nextYear = parseInt(years[years.length - 1] || new Date().getFullYear(), 10) + 1;

  res.json({
    method: 'linear trend extrapolation on historical admissions',
    historical: years.map((y) => ({ year: y, admissions: byYear[y] })),
    forecast: { year: nextYear, projectedAdmissions: Math.max(0, Math.round(lastCount + avgGrowth)) },
    schoolsInScope: mySchools.length,
  });
});

module.exports = router;
