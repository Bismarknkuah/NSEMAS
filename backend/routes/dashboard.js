const express = require('express');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const schools = collection('schools');
const students = collection('students');
const teachers = collection('teachers');
const attendance = collection('attendance');
const teacherAttendance = collection('teacher_attendance');
const inspections = collection('inspections');
const promotions = collection('promotions');
const transfers = collection('transfers');
const announcements = collection('announcements');

router.get('/summary', authenticate, (req, res) => {
  const allSchools = schools.all();
  const allowedIds = new Set(schoolIdsForUser(req.user, allSchools));
  const mySchools = allSchools.filter((s) => allowedIds.has(s.id));
  const myStudents = students.all().filter((s) => allowedIds.has(s.schoolId));
  const myTeachers = teachers.all().filter((t) => allowedIds.has(t.schoolId));
  const myAttendance = attendance.all().filter((a) => allowedIds.has(a.schoolId));
  const myTeacherAttendance = teacherAttendance.all().filter((a) => allowedIds.has(a.schoolId));
  const myInspections = inspections.all().filter((i) => allowedIds.has(i.schoolId));
  const myTransfers = transfers.all().filter((t) => allowedIds.has(t.fromSchoolId) || allowedIds.has(t.toSchoolId));

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = myAttendance.filter((a) => a.date === today);
  const presentToday = todayRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;

  const present = myAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const overallAttendanceRate = myAttendance.length ? Math.round((present / myAttendance.length) * 100) : null;

  const teacherOnTime = myTeacherAttendance.filter((a) => a.status === 'ON_TIME').length;
  const teacherPunctuality = myTeacherAttendance.length ? Math.round((teacherOnTime / myTeacherAttendance.length) * 100) : null;

  const byRegion = {};
  mySchools.forEach((s) => {
    byRegion[s.region] = byRegion[s.region] || { schools: 0, students: 0 };
    byRegion[s.region].schools++;
    byRegion[s.region].students += students.count((st) => st.schoolId === s.id && st.status === 'ACTIVE');
  });

  const schoolRankings = mySchools
    .map((s) => {
      const sRecords = myAttendance.filter((a) => a.schoolId === s.id);
      const sPresent = sRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const sInspections = myInspections.filter((i) => i.schoolId === s.id && i.overallScore !== null);
      const avgInspection = sInspections.length ? Math.round(sInspections.reduce((sum, i) => sum + i.overallScore, 0) / sInspections.length) : null;
      return {
        schoolId: s.id,
        name: s.name,
        region: s.region,
        attendanceRate: sRecords.length ? Math.round((sPresent / sRecords.length) * 100) : null,
        inspectionScore: avgInspection,
        studentCount: students.count((st) => st.schoolId === s.id && st.status === 'ACTIVE'),
      };
    })
    .sort((a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0));

  // 14-day attendance trend across everything in this user's scope
  const byDate = {};
  myAttendance.forEach((a) => {
    byDate[a.date] = byDate[a.date] || { present: 0, total: 0 };
    byDate[a.date].total++;
    if (a.status === 'PRESENT' || a.status === 'LATE') byDate[a.date].present++;
  });
  const trend = Object.entries(byDate)
    .map(([date, v]) => ({ date, rate: v.total ? Math.round((v.present / v.total) * 100) : null }))
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(-14);

  const genderSplit = { MALE: 0, FEMALE: 0 };
  myStudents.filter((s) => s.status === 'ACTIVE').forEach((s) => { if (genderSplit[s.gender] !== undefined) genderSplit[s.gender]++; });

  const levelSplit = {};
  myStudents.filter((s) => s.status === 'ACTIVE').forEach((s) => { levelSplit[s.level] = (levelSplit[s.level] || 0) + 1; });

  res.json({
    counts: {
      schools: mySchools.length,
      students: myStudents.filter((s) => s.status === 'ACTIVE').length,
      teachers: myTeachers.length,
      pendingTransfers: myTransfers.filter((t) => !['COMPLETED', 'REJECTED'].includes(t.status)).length,
    },
    attendanceToday: {
      total: todayRecords.length,
      present: presentToday,
      rate: todayRecords.length ? Math.round((presentToday / todayRecords.length) * 100) : null,
    },
    overallAttendanceRate,
    teacherPunctuality,
    byRegion,
    schoolRankings: schoolRankings.slice(0, 10),
    trend,
    genderSplit,
    levelSplit,
    recentInspections: myInspections.sort((a, b) => (a.conductedAt < b.conductedAt ? 1 : -1)).slice(0, 5),
    announcements: announcements
      .all()
      .filter((a) => a.audience === 'ALL' || a.audience === req.user.role)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 5),
  });
});

router.get('/gis', authenticate, (req, res) => {
  const allSchools = schools.all();
  const allowedIds = new Set(schoolIdsForUser(req.user, allSchools));
  const mySchools = allSchools.filter((s) => allowedIds.has(s.id));

  // Deterministic pseudo-coordinates per region for map visualization (demo only —
  // there's no live GPS/device feed in this environment; a real deployment would
  // plug actual school GPS coordinates in here without changing anything downstream).
  const REGION_COORDS = {
    GAR: [5.6037, -0.187], ASH: [6.6885, -1.6244], WR: [4.9346, -1.7554],
    CR: [5.1053, -1.2466], ER: [6.0851, -0.2593], NR: [9.4035, -0.8393],
    VR: [6.6082, 0.4713], UER: [10.7856, -0.8514],
  };
  const allInspections = inspections.all();
  const allAttendance = attendance.all();

  const points = mySchools.map((s, i) => {
    const base = REGION_COORDS[s.region] || [7.9465, -1.0232];
    const jitter = () => (Math.sin(i * 12.9898) * 0.15);

    const sAttendance = allAttendance.filter((a) => a.schoolId === s.id);
    const present = sAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = sAttendance.length ? Math.round((present / sAttendance.length) * 100) : null;

    const sInspections = allInspections.filter((ins) => ins.schoolId === s.id);
    const infraInspections = sInspections.filter((ins) => ins.area === 'INFRASTRUCTURE' && ins.overallScore !== null);
    const infraScore = infraInspections.length
      ? Math.round(infraInspections.reduce((sum, ins) => sum + ins.overallScore, 0) / infraInspections.length)
      : null;

    return {
      schoolId: s.id,
      name: s.name,
      region: s.region,
      district: s.district,
      type: s.type,
      level: s.level,
      lat: base[0] + jitter(),
      lng: base[1] + jitter() * 1.3,
      studentCount: students.count((st) => st.schoolId === s.id && st.status === 'ACTIVE'),
      attendanceRate,
      inspectionCount: sInspections.length,
      infrastructureScore: infraScore,
      infrastructureGap: infraScore !== null && infraScore < 60,
    };
  });
  res.json(points);
});

module.exports = router;
