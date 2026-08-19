const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const bio = require('./biometrics');

const REGIONS = [
  { id: 'GAR', name: 'Greater Accra' },
  { id: 'ASH', name: 'Ashanti' },
  { id: 'WR', name: 'Western' },
  { id: 'CR', name: 'Central' },
  { id: 'ER', name: 'Eastern' },
  { id: 'NR', name: 'Northern' },
  { id: 'VR', name: 'Volta' },
  { id: 'UER', name: 'Upper East' },
];

const DISTRICTS = {
  GAR: ['Accra Metro', 'Tema Metro', 'Ga West', 'Ledzokuku'],
  ASH: ['Kumasi Metro', 'Obuasi Municipal', 'Ejisu'],
  WR: ['Sekondi-Takoradi Metro', 'Ahanta West'],
  CR: ['Cape Coast Metro', 'Elmina'],
  ER: ['New Juaben Municipal', 'Akuapem North'],
  NR: ['Tamale Metro', 'Savelugu'],
  VR: ['Ho Municipal', 'Keta Municipal'],
  UER: ['Bolgatanga Municipal', 'Bawku Municipal'],
};

const SCHOOL_NAMES = [
  'Osu Presby', 'Mfantsipim', 'Achimota', 'Wesley Girls', 'Prempeh College',
  'St. Louis', 'Tamale SHS', 'Ho Technical', 'Bolgatanga Girls', 'Adisadel College',
  'Kumasi Anglican', 'Takoradi Methodist', 'Sekondi College', 'Cape Coast Girls',
  'Koforidua Technical', 'Akosombo International', 'Legon Staff Village Basic',
  'La Presby Basic', 'Ashaiman Community', 'Tema Community 1',
];

const SCHOOL_LEVELS = ['KG', 'PRIMARY', 'JHS', 'SHS'];

function hash(pw) {
  return bcrypt.hashSync(pw, 8);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().slice(0, 10);
}

const FIRST_NAMES = ['Kwame', 'Ama', 'Kofi', 'Akua', 'Yaw', 'Abena', 'Kwabena', 'Efua', 'Kwesi', 'Adjoa',
  'Kojo', 'Esi', 'Kwadwo', 'Afua', 'Yaa', 'Nana', 'Akosua', 'Kobina', 'Araba', 'Fiifi'];
const LAST_NAMES = ['Mensah', 'Osei', 'Boateng', 'Owusu', 'Asante', 'Agyeman', 'Appiah', 'Darko',
  'Adjei', 'Amoah', 'Sarpong', 'Frimpong', 'Antwi', 'Acheampong', 'Nkrumah'];

function fullName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function run() {
  const users = collection('users');
  const schools = collection('schools');
  const students = collection('students');
  const teachers = collection('teachers');
  const attendance = collection('attendance');
  const promotions = collection('promotions');
  const transfers = collection('transfers');
  const inspections = collection('inspections');
  const announcements = collection('announcements');
  const auditLog = collection('audit_log');
  const subjects = collection('subjects');
  const assignments = collection('assignments');
  const assignmentSubmissions = collection('assignment_submissions');
  const materials = collection('learning_materials');
  const parentLinks = collection('parent_links');
  const nationalExamCandidates = collection('national_exam_candidates');
  const nationalIncomingFeed = collection('national_incoming_feed');
  const nationalExamResults = collection('national_exam_results');
  const timetable = collection('timetable');
  const exams = collection('exams');
  const examResults = collection('exam_results');
  const leaveRequests = collection('leave_requests');
  const messages = collection('messages');
  const notifications = collection('notifications');

  if (users.count() > 0) {
    console.log('Data already seeded. Skipping. Delete backend/data/*.json to reseed.');
    return;
  }

  const now = new Date().toISOString();
  const allUsers = [];
  const allSchools = [];
  const allStudents = [];
  const allTeachers = [];
  const allAttendance = [];

  // ---- National level users ----
  const nationalRoles = [
    ['MINISTER', 'Hon. Minister of Education'],
    ['CHIEF_DIRECTOR', 'Chief Director, MoE'],
    ['DIRECTOR_GENERAL', 'Director-General, GES'],
    ['NATIONAL_MONITORING', 'National Monitoring Supervisor'],
    ['NATIONAL_QA', 'National Quality Assurance Officer'],
    ['NATIONAL_EMIS_ADMIN', 'National EMIS Administrator'],
  ];
  nationalRoles.forEach(([role, title], i) => {
    allUsers.push({
      id: uuid(),
      name: title,
      username: `national${i + 1}`,
      passwordHash: hash('password123'),
      role,
      scope: {},
      createdAt: now,
    });
  });

  // ---- Regional & District users, schools, students ----
  REGIONS.forEach((region) => {
    allUsers.push({
      id: uuid(),
      name: `${region.name} Regional Director`,
      username: `regdir_${region.id.toLowerCase()}`,
      passwordHash: hash('password123'),
      role: 'REGIONAL_DIRECTOR',
      scope: { region: region.id },
      createdAt: now,
    });
    allUsers.push({
      id: uuid(),
      name: `${region.name} Regional QA Officer`,
      username: `regqa_${region.id.toLowerCase()}`,
      passwordHash: hash('password123'),
      role: 'REGIONAL_QA',
      scope: { region: region.id },
      createdAt: now,
    });

    (DISTRICTS[region.id] || []).forEach((districtName) => {
      const districtId = districtName.replace(/\s+/g, '_').toUpperCase();
      allUsers.push({
        id: uuid(),
        name: `${districtName} District Director`,
        username: `distdir_${districtId.toLowerCase()}`,
        passwordHash: hash('password123'),
        role: 'DISTRICT_DIRECTOR',
        scope: { region: region.id, district: districtId },
        createdAt: now,
      });

      const circuitId = `${districtId}_C1`;
      allUsers.push({
        id: uuid(),
        name: `${districtName} Circuit Supervisor`,
        username: `circuit_${districtId.toLowerCase()}`,
        passwordHash: hash('password123'),
        role: 'CIRCUIT_SUPERVISOR',
        scope: { region: region.id, district: districtId, circuit: circuitId },
        createdAt: now,
      });

      // 1-2 schools per district
      const numSchools = 1 + Math.floor(Math.random() * 2);
      for (let s = 0; s < numSchools; s++) {
        const schoolId = uuid();
        const schoolName = `${pick(SCHOOL_NAMES)} ${pick(['Basic', 'JHS', 'SHS', 'Academy'])}`;
        const level = pick(SCHOOL_LEVELS);
        const isPrivate = Math.random() < 0.25;
        const school = {
          id: schoolId,
          name: schoolName,
          level,
          type: isPrivate ? 'PRIVATE' : 'PUBLIC',
          region: region.id,
          district: districtId,
          circuit: circuitId,
          gpsAddress: `GA-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          establishedYear: 1960 + Math.floor(Math.random() * 60),
          gender: pick(['MIXED', 'MIXED', 'MIXED', 'BOYS', 'GIRLS']),
          boarding: level === 'SHS' ? pick([true, false]) : false,
          createdAt: now,
        };
        allSchools.push(school);

        // Headmaster
        const headId = uuid();
        allUsers.push({
          id: headId,
          name: `${fullName()} (Head)`,
          username: `head_${schoolId.slice(0, 8)}`,
          passwordHash: hash('password123'),
          role: isPrivate ? 'PROPRIETOR' : 'HEADMASTER',
          scope: { region: region.id, district: districtId, circuit: circuitId, schoolId },
          createdAt: now,
        });

        // Teachers (3-6 per school)
        const numTeachers = 3 + Math.floor(Math.random() * 4);
        const subjectPool = ['Mathematics', 'English Language', 'Integrated Science', 'Social Studies',
          'ICT', 'French', 'RME', 'Creative Arts', 'Physical Education', 'Career Technology'];
        for (let t = 0; t < numTeachers; t++) {
          const teacherId = uuid();
          const teacherName = fullName();
          allUsers.push({
            id: uuid(),
            name: teacherName,
            username: `teacher_${teacherId.slice(0, 8)}`,
            passwordHash: hash('password123'),
            role: 'TEACHER',
            scope: { region: region.id, district: districtId, circuit: circuitId, schoolId },
            teacherId,
            createdAt: now,
          });
          allTeachers.push({
            id: teacherId,
            name: teacherName,
            staffId: `GES-${Math.floor(100000 + Math.random() * 899999)}`,
            schoolId,
            subject: pick(subjectPool),
            phone: `02${Math.floor(10000000 + Math.random() * 89999999)}`,
            employmentDate: randDate(2005, 2023),
            status: 'ACTIVE',
            createdAt: now,
          });
        }

        // Students (10-20 per school)
        const numStudents = 10 + Math.floor(Math.random() * 11);
        const classes = level === 'KG' ? ['KG1', 'KG2']
          : level === 'PRIMARY' ? ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']
          : level === 'JHS' ? ['JHS1', 'JHS2', 'JHS3']
          : ['SHS1', 'SHS2', 'SHS3'];

        for (let st = 0; st < numStudents; st++) {
          const studentId = uuid();
          const studentName = fullName();
          const gender = pick(['MALE', 'FEMALE']);
          const klass = pick(classes);
          const geuln = `GEULN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`;
          const isEnrolled = Math.random() < 0.7;
          const student = {
            id: studentId,
            geuln,
            name: studentName,
            gender,
            dateOfBirth: randDate(2006, 2019),
            schoolId,
            class: klass,
            level,
            status: 'ACTIVE',
            biometricEnrolled: isEnrolled,
            biometricMethod: isEnrolled ? 'FINGERPRINT' : undefined,
            // Real trained template (3-sample capture, same engine used by the live
            // enrollment endpoint) so seeded "enrolled" students can actually pass
            // fingerprint verification at check-in, not just carry a boolean flag.
            biometricTemplate: isEnrolled
              ? bio.buildTemplate([0, 1, 2].map(() => bio.generateScan(`${studentId}:finger:0`, 0.03)))
              : undefined,
            biometricEnrolledAt: isEnrolled ? now : undefined,
            parentName: fullName(),
            parentPhone: `02${Math.floor(10000000 + Math.random() * 89999999)}`,
            admissionDate: randDate(2018, 2025),
            medical: pick(['None', 'None', 'None', 'Asthma', 'Allergy - Peanuts', 'Sickle Cell Trait']),
            behaviourNotes: [],
            academicHistory: [],
            createdAt: now,
          };
          if (student.biometricTemplate) student.biometricQuality = student.biometricTemplate.quality;
          allStudents.push(student);

          // Attendance history: last 20 school days
          for (let d = 0; d < 20; d++) {
            const date = new Date();
            date.setDate(date.getDate() - d);
            if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends
            const present = Math.random() > 0.08;
            allAttendance.push({
              id: uuid(),
              studentId,
              schoolId,
              date: date.toISOString().slice(0, 10),
              status: present ? (Math.random() > 0.9 ? 'LATE' : 'PRESENT') : 'ABSENT',
              method: pick(['FINGERPRINT', 'FACIAL', 'RFID', 'PIN', 'MANUAL']),
              checkIn: present ? `0${7 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
              recordedAt: now,
            });
          }
        }
      }
    });
  });

  // ----------------------------------------------------------------------
  // Fixed-username demo accounts — one per role type in the system, all on
  // password "demo123", anchored to a single dedicated "Demo Model School"
  // so quick-login buttons on the frontend always work no matter how the
  // rest of the (randomized) national data seeds out.
  // ----------------------------------------------------------------------
  const demoRegion = REGIONS[0]; // Greater Accra
  const demoDistrictName = DISTRICTS[demoRegion.id][0];
  const demoDistrictId = demoDistrictName.replace(/\s+/g, '_').toUpperCase();
  const demoCircuitId = `${demoDistrictId}_C1`;
  const demoSchoolId = uuid();

  const demoSchool = {
    id: demoSchoolId,
    name: 'NSEMAS Demo Model School',
    level: 'JHS',
    type: 'PUBLIC',
    region: demoRegion.id,
    district: demoDistrictId,
    circuit: demoCircuitId,
    gpsAddress: 'GA-000-0000',
    establishedYear: 1990,
    gender: 'MIXED',
    boarding: false,
    createdAt: now,
    isDemoAnchor: true,
  };
  allSchools.push(demoSchool);

  // A second school purely so the demo transfer/promotion flows have a
  // believable "receiving school" to move students to.
  const demoSchool2Id = uuid();
  const demoSchool2 = {
    id: demoSchool2Id,
    name: 'NSEMAS Demo Annex School',
    level: 'JHS',
    type: 'PRIVATE',
    region: demoRegion.id,
    district: demoDistrictId,
    circuit: demoCircuitId,
    gpsAddress: 'GA-000-0001',
    establishedYear: 1995,
    gender: 'MIXED',
    boarding: false,
    createdAt: now,
    isDemoAnchor: true,
  };
  allSchools.push(demoSchool2);

  // A third fixed demo school at SHS level — Ghana's Basic (KG/Primary/JHS)
  // and Senior High School levels are genuinely separate institutions,
  // each with their own Headmaster, not one head across all levels. The
  // two schools above are both JHS; this one exists so that's actually
  // demonstrable rather than just true in the abstract.
  const demoSchool3Id = uuid();
  const demoSchool3 = {
    id: demoSchool3Id,
    name: 'NSEMAS Demo SHS',
    level: 'SHS',
    type: 'PUBLIC',
    region: demoRegion.id,
    district: demoDistrictId,
    circuit: demoCircuitId,
    gpsAddress: 'GA-000-0002',
    establishedYear: 1965,
    gender: 'MIXED',
    boarding: true,
    createdAt: now,
    isDemoAnchor: true,
  };
  allSchools.push(demoSchool3);

  // A few named students at the demo school for the promotion/transfer/
  // parent/student portal demos to point at.
  const demoStudentAId = uuid();
  const demoStudentATemplate = bio.buildTemplate([0, 1, 2].map(() => bio.generateScan(`${demoStudentAId}:finger:0`, 0.03)));
  const demoStudentA = {
    id: demoStudentAId,
    geuln: `GEULN-${new Date().getFullYear()}-000001`,
    name: 'Ama Serwaa',
    gender: 'FEMALE',
    dateOfBirth: '2012-03-14',
    schoolId: demoSchoolId,
    class: 'JHS2',
    level: 'JHS',
    status: 'ACTIVE',
    biometricEnrolled: true,
    biometricMethod: 'FINGERPRINT',
    biometricTemplate: demoStudentATemplate,
    biometricQuality: demoStudentATemplate.quality,
    parentName: 'Comfort Serwaa',
    parentPhone: '0244000001',
    admissionDate: '2019-09-02',
    medical: 'None',
    behaviourNotes: [],
    academicHistory: [],
    createdAt: now,
  };
  const demoStudentB = {
    id: uuid(),
    geuln: `GEULN-${new Date().getFullYear()}-000002`,
    name: 'Kwame Nkansah',
    gender: 'MALE',
    dateOfBirth: '2011-11-02',
    schoolId: demoSchoolId,
    class: 'JHS3',
    level: 'JHS',
    status: 'ACTIVE',
    biometricEnrolled: false,
    parentName: 'Comfort Serwaa',
    parentPhone: '0244000001',
    admissionDate: '2018-09-01',
    medical: 'None',
    behaviourNotes: [],
    academicHistory: [],
    createdAt: now,
  };
  // A couple of concluded-lifecycle students so the Alumni register has
  // real data to show immediately, rather than only populating once a
  // live promotion decision graduates someone during the demo.
  const demoAlumnusGraduated = {
    id: uuid(),
    geuln: `GEULN-2025-000003`,
    name: 'Yaw Mensah',
    gender: 'MALE',
    dateOfBirth: '2010-05-20',
    schoolId: demoSchoolId,
    class: 'JHS3',
    level: 'JHS',
    status: 'GRADUATED',
    biometricEnrolled: false,
    parentName: 'Abena Mensah',
    parentPhone: '0244000003',
    admissionDate: '2017-09-01',
    medical: 'None',
    behaviourNotes: [],
    academicHistory: [
      { academicYear: '2024/2025', class: 'JHS3', outcome: 'GRADUATED', decidedAt: '2025-07-20T00:00:00.000Z' },
    ],
    createdAt: now,
  };
  const demoAlumnusWithdrawn = {
    id: uuid(),
    geuln: `GEULN-2024-000004`,
    name: 'Efua Owusu',
    gender: 'FEMALE',
    dateOfBirth: '2011-02-11',
    schoolId: demoSchoolId,
    class: 'JHS1',
    level: 'JHS',
    status: 'WITHDRAWN',
    biometricEnrolled: false,
    parentName: 'Kofi Owusu',
    parentPhone: '0244000004',
    admissionDate: '2019-09-01',
    medical: 'None',
    behaviourNotes: [],
    academicHistory: [
      { academicYear: '2023/2024', class: 'JHS1', outcome: 'WITHDRAWN', decidedAt: '2024-03-15T00:00:00.000Z' },
    ],
    createdAt: now,
  };
  allStudents.push(demoStudentA, demoStudentB, demoAlumnusGraduated, demoAlumnusWithdrawn);
  for (const stu of [demoStudentA, demoStudentB]) {
    for (let d = 0; d < 20; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const present = Math.random() > 0.06;
      allAttendance.push({
        id: uuid(),
        studentId: stu.id,
        schoolId: demoSchoolId,
        date: date.toISOString().slice(0, 10),
        status: present ? (Math.random() > 0.9 ? 'LATE' : 'PRESENT') : 'ABSENT',
        method: pick(['FINGERPRINT', 'FACIAL', 'RFID', 'MANUAL']),
        checkIn: present ? `0${7 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
        recordedAt: now,
      });
    }
  }

  const demoTeacherId = uuid();
  allTeachers.push({
    id: demoTeacherId,
    name: 'Yaw Boakye',
    staffId: 'GES-000001',
    schoolId: demoSchoolId,
    subject: 'Mathematics',
    phone: '0244000002',
    employmentDate: '2015-09-01',
    status: 'ACTIVE',
    createdAt: now,
  });

  const DEMO_SCOPE_SCHOOL = { region: demoRegion.id, district: demoDistrictId, circuit: demoCircuitId, schoolId: demoSchoolId };
  const DEMO_SCOPE_ANNEX = { region: demoRegion.id, district: demoDistrictId, circuit: demoCircuitId, schoolId: demoSchool2Id };
  const DEMO_SCOPE_SHS = { region: demoRegion.id, district: demoDistrictId, circuit: demoCircuitId, schoolId: demoSchool3Id };

  // ---- National Examinations Council demo data ----
  // demoStudentB (Kwame Nkansah, JHS3) is registered for BECE with a result
  // already published/synced, so the report card and checker have real data
  // to show immediately. A second candidate is registered but left
  // *unsynced* — the exam body has published their result in the seeded
  // incoming feed, but the school hasn't pulled it in yet — so clicking
  // "Sync with National Examinations Council" in the UI has a genuine,
  // visible effect during a demo rather than a no-op.
  const beceIndexA = `GA1${new Date().getFullYear()}${String(341829).padStart(6, '0')}`;
  const beceSerialA = 'DEMO1A2B3C4D';
  nationalExamCandidates.insert({
    id: uuid(), studentId: demoStudentB.id, schoolId: demoSchoolId, examType: 'BECE',
    indexNumber: beceIndexA, serialPin: beceSerialA,
    academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    registeredBy: 'Headmaster, Demo Model School', registeredAt: now,
  });
  nationalExamResults.insert({
    id: uuid(), indexNumber: beceIndexA, candidateId: null, studentId: demoStudentB.id, schoolId: demoSchoolId,
    examType: 'BECE',
    subjects: [
      { subject: 'Mathematics', grade: 2, remark: 'Very Good' },
      { subject: 'English Language', grade: 3, remark: 'Good' },
      { subject: 'Integrated Science', grade: 1, remark: 'Excellent' },
      { subject: 'Social Studies', grade: 2, remark: 'Very Good' },
    ],
    overallResult: 'Aggregate 8 — Qualified for SHS placement',
    source: 'NATIONAL_EXAMS_COUNCIL',
    publishedAt: now, syncedAt: now, syncedBy: 'Headmaster, Demo Model School',
  });

  // Find a real random JHS3 student elsewhere in the national dataset to
  // register as the "pending sync" demo candidate.
  const someOtherJhs3 = allStudents.find((s) => s.class === 'JHS3' && s.id !== demoStudentB.id && s.schoolId !== demoSchoolId);
  if (someOtherJhs3) {
    const beceIndexB = `GA1${new Date().getFullYear()}${String(552017).padStart(6, '0')}`;
    const beceSerialB = 'DEMO5E6F7G8H';
    nationalExamCandidates.insert({
      id: uuid(), studentId: someOtherJhs3.id, schoolId: someOtherJhs3.schoolId, examType: 'BECE',
      indexNumber: beceIndexB, serialPin: beceSerialB,
      academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      registeredBy: 'System', registeredAt: now,
    });
    nationalIncomingFeed.insert({
      id: uuid(), indexNumber: beceIndexB, examType: 'BECE',
      subjects: [
        { subject: 'Mathematics', grade: 4, remark: 'Credit' },
        { subject: 'English Language', grade: 5, remark: 'Credit' },
        { subject: 'Integrated Science', grade: 3, remark: 'Good' },
      ],
      overallResult: 'Aggregate 12 — Qualified for SHS placement',
      publishedAt: now,
    });
  }

  const NAT = {}; // national tier accounts have no geographic scope
  const REG = { region: demoRegion.id };
  const DIST = { region: demoRegion.id, district: demoDistrictId };
  const CIRC = { region: demoRegion.id, district: demoDistrictId, circuit: demoCircuitId };

  const demoAccounts = [
    // ---------------- National Administration ----------------
    { username: 'demo_minister', name: 'Hon. Minister of Education (Demo)', role: 'MINISTER', scope: NAT },
    { username: 'demo_deputy_minister', name: 'Deputy Minister of Education (Demo)', role: 'DEPUTY_MINISTER', scope: NAT },
    { username: 'demo_chief_director', name: 'Chief Director, MoE (Demo)', role: 'CHIEF_DIRECTOR', scope: NAT },
    { username: 'demo_director_general', name: 'Director-General, GES (Demo)', role: 'DIRECTOR_GENERAL', scope: NAT },
    { username: 'demo_deputy_director_general', name: 'Deputy Director-General, GES (Demo)', role: 'DEPUTY_DIRECTOR_GENERAL', scope: NAT },
    { username: 'demo_national_director', name: 'National Director (Demo)', role: 'NATIONAL_DIRECTOR', scope: NAT },
    { username: 'demo_national_monitoring', name: 'National Monitoring Supervisor (Demo)', role: 'NATIONAL_MONITORING', scope: NAT },
    { username: 'demo_national_qa', name: 'National QA Officer (Demo)', role: 'NATIONAL_QA', scope: NAT },
    { username: 'demo_national_emis', name: 'National EMIS Administrator (Demo)', role: 'NATIONAL_EMIS_ADMIN', scope: NAT },
    { username: 'demo_national_ict', name: 'National ICT Administrator (Demo)', role: 'NATIONAL_ICT_ADMIN', scope: NAT },
    { username: 'demo_national_hr', name: 'National HR Officer (Demo)', role: 'NATIONAL_HR', scope: NAT },
    { username: 'demo_national_curriculum', name: 'National Curriculum Officer (Demo)', role: 'NATIONAL_CURRICULUM_OFFICER', scope: NAT },
    { username: 'demo_national_exam', name: 'National Examination Officer (Demo)', role: 'NATIONAL_EXAM_OFFICER', scope: NAT },

    // ---------------- Regional Administration ----------------
    { username: 'demo_regional_director', name: `${demoRegion.name} Regional Director (Demo)`, role: 'REGIONAL_DIRECTOR', scope: REG },
    { username: 'demo_asst_regional_director', name: `${demoRegion.name} Assistant Regional Director (Demo)`, role: 'ASSISTANT_REGIONAL_DIRECTOR', scope: REG },
    { username: 'demo_regional_monitoring', name: `${demoRegion.name} Regional Monitoring Supervisor (Demo)`, role: 'REGIONAL_MONITORING', scope: REG },
    { username: 'demo_regional_qa', name: `${demoRegion.name} Regional QA Officer (Demo)`, role: 'REGIONAL_QA', scope: REG },
    { username: 'demo_regional_emis', name: `${demoRegion.name} Regional EMIS Officer (Demo)`, role: 'REGIONAL_EMIS', scope: REG },
    { username: 'demo_regional_ict', name: `${demoRegion.name} Regional ICT Officer (Demo)`, role: 'REGIONAL_ICT', scope: REG },
    { username: 'demo_regional_hr', name: `${demoRegion.name} Regional HR Officer (Demo)`, role: 'REGIONAL_HR', scope: REG },
    { username: 'demo_regional_finance', name: `${demoRegion.name} Regional Finance Officer (Demo)`, role: 'REGIONAL_FINANCE', scope: REG },

    // ---------------- District Administration ----------------
    { username: 'demo_district_director', name: `${demoDistrictName} District Director (Demo)`, role: 'DISTRICT_DIRECTOR', scope: DIST },
    { username: 'demo_asst_district_director', name: `${demoDistrictName} Assistant District Director (Demo)`, role: 'ASSISTANT_DISTRICT_DIRECTOR', scope: DIST },
    { username: 'demo_district_monitoring', name: `${demoDistrictName} District Monitoring Supervisor (Demo)`, role: 'DISTRICT_MONITORING', scope: DIST },
    { username: 'demo_district_emis', name: `${demoDistrictName} District EMIS Officer (Demo)`, role: 'DISTRICT_EMIS', scope: DIST },
    { username: 'demo_district_statistics', name: `${demoDistrictName} District Statistics Officer (Demo)`, role: 'DISTRICT_STATISTICS', scope: DIST },
    { username: 'demo_district_ict', name: `${demoDistrictName} District ICT Officer (Demo)`, role: 'DISTRICT_ICT', scope: DIST },
    { username: 'demo_district_hr', name: `${demoDistrictName} District HR Officer (Demo)`, role: 'DISTRICT_HR', scope: DIST },

    // ---------------- Circuit Administration ----------------
    { username: 'demo_circuit_supervisor', name: `${demoDistrictName} Circuit Supervisor (Demo)`, role: 'CIRCUIT_SUPERVISOR', scope: CIRC },
    { username: 'demo_asst_circuit_supervisor', name: `${demoDistrictName} Assistant Circuit Supervisor (Demo)`, role: 'ASSISTANT_CIRCUIT_SUPERVISOR', scope: CIRC },

    // ---------------- School Management ----------------
    { username: 'demo_headmaster', name: 'Headmaster, Demo Model School', role: 'HEADMASTER', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_headmaster_shs', name: 'Headmaster, Demo SHS', role: 'HEADMASTER', scope: DEMO_SCOPE_SHS },
    { username: 'demo_assistant_head', name: 'Assistant Headmaster (Academic), Demo Model School', role: 'ASSISTANT_HEAD_ACADEMIC', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_assistant_head_admin', name: 'Assistant Headmaster (Administration), Demo Model School', role: 'ASSISTANT_HEAD_ADMIN', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_school_admin', name: 'School Administrator, Demo Model School', role: 'SCHOOL_ADMIN', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_secretary', name: 'Secretary, Demo Model School', role: 'SECRETARY', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_accountant', name: 'Accountant, Demo Model School', role: 'ACCOUNTANT', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_storekeeper', name: 'Storekeeper, Demo Model School', role: 'STOREKEEPER', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_librarian', name: 'Librarian, Demo Model School', role: 'LIBRARIAN', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_ict_coordinator', name: 'ICT Coordinator, Demo Model School', role: 'ICT_COORDINATOR', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_counsellor', name: 'School Counsellor, Demo Model School', role: 'COUNSELLOR', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_nurse', name: 'School Nurse, Demo Model School', role: 'NURSE', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_security_officer', name: 'Security Officer, Demo Model School', role: 'SECURITY_OFFICER', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_proprietor', name: 'Proprietor, Demo Annex School', role: 'PROPRIETOR', scope: DEMO_SCOPE_ANNEX },
    { username: 'demo_finance_director', name: 'Finance Director, Demo Annex School', role: 'FINANCE_DIRECTOR', scope: DEMO_SCOPE_ANNEX },

    // ---------------- Teaching Staff ----------------
    { username: 'demo_teacher', name: 'Yaw Boakye (Demo Teacher)', role: 'TEACHER', scope: DEMO_SCOPE_SCHOOL, teacherId: demoTeacherId, email: 'yaw.boakye@nsemas.demo', phone: '0244000002' },
    { username: 'demo_department_head', name: 'Department Head, Demo Model School', role: 'DEPARTMENT_HEAD', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_subject_coordinator', name: 'Subject Coordinator, Demo Model School', role: 'SUBJECT_COORDINATOR', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_form_master', name: 'Form Master, Demo Model School', role: 'FORM_MASTER', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_house_master', name: 'House Master, Demo Model School', role: 'HOUSE_MASTER', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_boarding_coordinator', name: 'Boarding Coordinator, Demo Model School', role: 'BOARDING_COORDINATOR', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_lab_technician', name: 'Laboratory Technician, Demo Model School', role: 'LAB_TECHNICIAN', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_workshop_instructor', name: 'Workshop Instructor, Demo Model School', role: 'WORKSHOP_INSTRUCTOR', scope: DEMO_SCOPE_SCHOOL },
    { username: 'demo_sports_coordinator', name: 'Sports Coordinator, Demo Model School', role: 'SPORTS_COORDINATOR', scope: DEMO_SCOPE_SCHOOL },

    // ---------------- Private School Board ----------------
    { username: 'demo_executive_director', name: 'Executive Director, Demo Annex School', role: 'EXECUTIVE_DIRECTOR', scope: DEMO_SCOPE_ANNEX },
    { username: 'demo_board_chairman', name: 'Board Chairman, Demo Annex School', role: 'BOARD_CHAIRMAN', scope: DEMO_SCOPE_ANNEX },
    { username: 'demo_board_member', name: 'Board Member, Demo Annex School', role: 'BOARD_MEMBER', scope: DEMO_SCOPE_ANNEX },
    { username: 'demo_proprietor_rep', name: 'Proprietor Representative, Demo Annex School', role: 'PROPRIETOR_REP', scope: DEMO_SCOPE_ANNEX },

    // ---------------- Student Leadership ----------------
    { username: 'demo_student_leader', name: 'Kwame Nkansah (School Prefect, Demo)', role: 'SCHOOL_PREFECT', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentB.id }, studentId: demoStudentB.id },
    { username: 'demo_assistant_prefect', name: 'Assistant Prefect (Demo Student)', role: 'ASSISTANT_PREFECT', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentB.id }, studentId: demoStudentB.id },
    { username: 'demo_boys_prefect', name: 'Boys Prefect (Demo Student)', role: 'BOYS_PREFECT', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentB.id }, studentId: demoStudentB.id },
    { username: 'demo_girls_prefect', name: 'Girls Prefect (Demo Student)', role: 'GIRLS_PREFECT', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentA.id }, studentId: demoStudentA.id },
    { username: 'demo_class_prefect', name: 'Class Prefect (Demo Student)', role: 'CLASS_PREFECT', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentA.id }, studentId: demoStudentA.id },
    { username: 'demo_course_rep', name: 'Course Representative (Demo Student)', role: 'COURSE_REP', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentB.id }, studentId: demoStudentB.id },
    { username: 'demo_src_executive', name: 'SRC Executive (Demo Student)', role: 'SRC_EXECUTIVE', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentB.id }, studentId: demoStudentB.id },
    { username: 'demo_hall_rep', name: 'Hall Representative (Demo Student)', role: 'HALL_REP', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentA.id }, studentId: demoStudentA.id },
    { username: 'demo_house_prefect', name: 'House Prefect (Demo Student)', role: 'HOUSE_PREFECT', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentA.id }, studentId: demoStudentA.id },

    // ---------------- End Users ----------------
    { username: 'demo_parent', name: 'Comfort Serwaa (Demo Parent)', role: 'PARENT', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentA.id }, childId: demoStudentA.id, email: 'comfort.serwaa@nsemas.demo', phone: '0244000001' },
    { username: 'demo_student', name: 'Ama Serwaa (Demo Student)', role: 'STUDENT', scope: { ...DEMO_SCOPE_SCHOOL, studentId: demoStudentA.id }, studentId: demoStudentA.id },
  ];

  demoAccounts.forEach((acc) => {
    allUsers.push({
      id: uuid(),
      name: acc.name,
      username: acc.username,
      passwordHash: hash('demo123'),
      role: acc.role,
      scope: acc.scope,
      teacherId: acc.teacherId,
      childId: acc.childId,
      studentId: acc.studentId,
      email: acc.email || null,
      phone: acc.phone || null,
      isDemoAccount: true,
      createdAt: now,
    });
  });

  // Kept for backwards compatibility with anyone who bookmarked these from
  // the previous seed version — same credentials style, still work.
  allUsers.push({
    id: uuid(), name: 'System Administrator', username: 'admin',
    passwordHash: hash('admin123'), role: 'NATIONAL_EMIS_ADMIN', scope: {}, createdAt: now,
  });

  // Sample announcements
  announcements.insertMany([
    {
      id: uuid(),
      title: 'National BECE Registration Opens',
      body: 'Registration for the Basic Education Certificate Examination opens next month. Headmasters should update student records.',
      audience: 'ALL',
      createdBy: 'NATIONAL_EMIS_ADMIN',
      createdAt: now,
    },
    {
      id: uuid(),
      title: 'Attendance Compliance Reminder',
      body: 'All schools must synchronize biometric attendance devices daily by 4:00pm.',
      audience: 'HEADMASTER',
      createdBy: 'NATIONAL_MONITORING',
      createdAt: now,
    },
  ]);

  // ---------------------------------------------------------------------
  // Subject catalog, timetable, exams/results, leave requests, and a demo
  // message thread — sample data for the newly added curriculum/exam,
  // leave management, and messaging modules.
  // ---------------------------------------------------------------------
  const NATIONAL_SUBJECTS = [
    ['English Language', 'ENGL', 'ALL', 'CORE'],
    ['Mathematics', 'MATH', 'ALL', 'CORE'],
    ['Integrated Science', 'SCI', 'JHS', 'CORE'],
    ['Social Studies', 'SOST', 'JHS', 'CORE'],
    ['Religious & Moral Education', 'RME', 'JHS', 'CORE'],
    ['Creative Arts & Design', 'CRDT', 'PRIMARY', 'CORE'],
    ['Computing (ICT)', 'ICT', 'ALL', 'CORE'],
    ['French', 'FREN', 'JHS', 'ELECTIVE'],
    ['Career Technology', 'CARR', 'JHS', 'CORE'],
    ['Physical Education', 'PE', 'ALL', 'CORE'],
    ['Physics', 'PHYS', 'SHS', 'ELECTIVE'],
    ['Chemistry', 'CHEM', 'SHS', 'ELECTIVE'],
    ['Biology', 'BIOL', 'SHS', 'ELECTIVE'],
    ['Elective Mathematics', 'EMTH', 'SHS', 'ELECTIVE'],
    ['Economics', 'ECON', 'SHS', 'ELECTIVE'],
    ['Geography', 'GEOG', 'SHS', 'ELECTIVE'],
  ];
  const seededSubjects = NATIONAL_SUBJECTS.map(([name, code, level, category]) => ({
    id: uuid(), name, code, level, category, createdAt: now,
  }));
  subjects.insertMany(seededSubjects);

  // Sample assignments + one existing submission with feedback, so the
  // Assignments module and student portal have something to show immediately.
  const seededAssignments = [
    {
      id: uuid(), schoolId: demoSchoolId, class: 'JHS2', subject: 'Mathematics',
      title: 'Fractions worksheet', instructions: 'Complete exercises 1-10 on page 42.',
      dueDate: '2026-08-15', createdBy: 'Yaw Boakye (Demo Teacher)', createdAt: now,
    },
    {
      id: uuid(), schoolId: demoSchoolId, class: 'JHS3', subject: 'English Language',
      title: 'Essay: My Community', instructions: 'Write a 300-word essay describing your community.',
      dueDate: '2026-08-10', createdBy: 'Yaw Boakye (Demo Teacher)', createdAt: now,
    },
  ];
  assignments.insertMany(seededAssignments);
  assignmentSubmissions.insertMany([
    {
      id: uuid(), assignmentId: seededAssignments[0].id, studentId: demoStudentA.id,
      content: 'Completed all 10 exercises, attached working shown for each.',
      submittedAt: now, grade: 2, feedback: 'Well done — clear working shown throughout.',
    },
  ]);

  const seededMaterials = [
    {
      id: uuid(), schoolId: demoSchoolId, class: 'JHS2', subject: 'Mathematics',
      title: 'Fractions revision notes', description: 'Summary notes covering equivalent fractions and simplification.',
      url: null, postedBy: 'Yaw Boakye (Demo Teacher)', createdAt: now,
    },
    {
      id: uuid(), schoolId: demoSchoolId, class: 'JHS2', subject: 'Integrated Science',
      title: 'GES curriculum reference', description: 'Official GES syllabus reference for JHS Integrated Science.',
      url: 'https://ges.gov.gh', postedBy: 'Yaw Boakye (Demo Teacher)', createdAt: now,
    },
  ];
  materials.insertMany(seededMaterials);

  // A weekly timetable for the demo school's JHS2 and JHS3 classes
  const timetableSubjectPool = ['Mathematics', 'English Language', 'Integrated Science', 'Social Studies', 'Computing (ICT)', 'Religious & Moral Education'];
  const seededTimetable = [];
  const currentAcademicYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  ['JHS2', 'JHS3'].forEach((klass) => {
    ['MON', 'TUE', 'WED', 'THU', 'FRI'].forEach((day) => {
      for (let period = 1; period <= 5; period++) {
        seededTimetable.push({
          id: uuid(),
          schoolId: demoSchoolId,
          class: klass,
          day,
          period,
          subject: pick(timetableSubjectPool),
          teacherId: demoTeacherId,
          startTime: `0${7 + period}:00`,
          endTime: `0${7 + period}:40`,
          createdAt: now,
        });
      }
    });
  });
  timetable.insertMany(seededTimetable);

  // A completed end-of-term exam session for demo student A & B's classes,
  // with real scores + WAEC-style grades already entered, so the report
  // card page has something to show immediately.
  function gradeFor(pct) {
    if (pct >= 80) return { grade: 1, remark: 'Excellent' };
    if (pct >= 75) return { grade: 2, remark: 'Very Good' };
    if (pct >= 70) return { grade: 3, remark: 'Good' };
    if (pct >= 65) return { grade: 4, remark: 'Credit' };
    if (pct >= 60) return { grade: 5, remark: 'Credit' };
    if (pct >= 55) return { grade: 6, remark: 'Credit' };
    if (pct >= 50) return { grade: 7, remark: 'Pass' };
    if (pct >= 40) return { grade: 8, remark: 'Pass' };
    return { grade: 9, remark: 'Fail' };
  }
  const seededExams = [];
  const seededExamResults = [];
  ['JHS2', 'JHS3'].forEach((klass) => {
    const classStudents = allStudents.filter((s) => s.schoolId === demoSchoolId && s.class === klass);
    ['Mathematics', 'English Language', 'Integrated Science'].forEach((subject) => {
      const exam = {
        id: uuid(),
        schoolId: demoSchoolId,
        name: `End of Term 1 Examination`,
        examType: 'END_OF_TERM',
        academicYear: currentAcademicYear,
        term: 1,
        class: klass,
        subject,
        maxScore: 100,
        date: new Date().toISOString().slice(0, 10),
        createdBy: 'Headmaster, Demo Model School',
        createdAt: now,
      };
      seededExams.push(exam);
      classStudents.forEach((s) => {
        const score = 35 + Math.floor(Math.random() * 60);
        const { grade, remark } = gradeFor(score);
        seededExamResults.push({
          id: uuid(), examId: exam.id, studentId: s.id, score, grade, remark,
          enteredBy: 'Yaw Boakye (Demo Teacher)', enteredAt: now,
        });
      });
    });
  });
  exams.insertMany(seededExams);
  examResults.insertMany(seededExamResults);

  // A couple of leave requests: one pending, one already approved
  leaveRequests.insertMany([
    {
      id: uuid(), teacherId: demoTeacherId, teacherName: 'Yaw Boakye (Demo Teacher)', schoolId: demoSchoolId,
      type: 'SICK', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10),
      days: 1, reason: 'Flu — doctor recommended rest', status: 'PENDING',
      submittedBy: 'Yaw Boakye (Demo Teacher)', submittedAt: now, decidedBy: null, decidedAt: null, decisionNote: null,
    },
    {
      id: uuid(), teacherId: demoTeacherId, teacherName: 'Yaw Boakye (Demo Teacher)', schoolId: demoSchoolId,
      type: 'ANNUAL', startDate: '2026-08-10', endDate: '2026-08-14',
      days: 5, reason: 'Annual leave — family travel', status: 'APPROVED',
      submittedBy: 'Yaw Boakye (Demo Teacher)', submittedAt: now,
      decidedBy: 'Headmaster, Demo Model School', decidedAt: now, decisionNote: 'Approved — cover arranged.',
    },
  ]);

  // A sample message thread between the demo parent and demo teacher about demo student A
  const parentUser = allUsers.find((u) => u.username === 'demo_parent');
  const teacherUser = allUsers.find((u) => u.username === 'demo_teacher');
  const headmasterUser = allUsers.find((u) => u.username === 'demo_headmaster');

  // One parent, multiple children, different schools — a real sibling of
  // Ama's enrolled at a *different, private* school elsewhere in the
  // national dataset, demonstrating that a single parent account isn't
  // tied to one child or one institution type.
  if (parentUser) {
    const privateSchool = allSchools.find((s) => s.type === 'PRIVATE' && s.id !== demoSchoolId && s.id !== demoSchool2Id);
    let secondChild = null;
    if (privateSchool) {
      secondChild = {
        id: uuid(),
        geuln: `GEULN-${new Date().getFullYear()}-000005`,
        name: 'Kofi Serwaa',
        gender: 'MALE',
        dateOfBirth: { KG: '2020-09-10', PRIMARY: '2016-09-10', JHS: '2013-09-10', SHS: '2010-09-10' }[privateSchool.level] || '2016-09-10',
        schoolId: privateSchool.id,
        class: { KG: 'KG2', PRIMARY: 'P2', JHS: 'JHS1', SHS: 'SHS1' }[privateSchool.level] || 'P2',
        level: privateSchool.level,
        status: 'ACTIVE',
        biometricEnrolled: false,
        parentName: 'Comfort Serwaa',
        parentPhone: '0244000001',
        admissionDate: '2023-09-01',
        medical: 'None',
        behaviourNotes: [],
        academicHistory: [],
        createdAt: now,
      };
      allStudents.push(secondChild);
      for (let d = 0; d < 15; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const present = Math.random() > 0.07;
        allAttendance.push({
          id: uuid(), studentId: secondChild.id, schoolId: privateSchool.id,
          date: date.toISOString().slice(0, 10),
          status: present ? (Math.random() > 0.9 ? 'LATE' : 'PRESENT') : 'ABSENT',
          method: pick(['FINGERPRINT', 'FACIAL', 'MANUAL']),
          checkIn: present ? `0${7 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
          recordedAt: now,
        });
      }
    }

    parentLinks.insertMany([
      { id: uuid(), parentUserId: parentUser.id, studentId: demoStudentA.id, linkedBy: 'System (bootstrap)', linkedAt: now },
      ...(secondChild ? [{ id: uuid(), parentUserId: parentUser.id, studentId: secondChild.id, linkedBy: 'System (bootstrap)', linkedAt: now }] : []),
    ]);
  }

  if (parentUser && teacherUser) {
    const tKey = [parentUser.id, teacherUser.id].sort().join(':') + `:${demoStudentA.id}`;
    messages.insertMany([
      {
        id: uuid(), threadKey: tKey, fromUserId: teacherUser.id, fromName: teacherUser.name,
        toUserId: parentUser.id, studentId: demoStudentA.id,
        body: `Good afternoon — Ama did really well in this term's Mathematics exam. Keep encouraging her practice at home!`,
        sentAt: now, readAt: null,
      },
    ]);
    notifications.insert({
      id: uuid(), userId: parentUser.id, type: 'MESSAGE', title: `New message from ${teacherUser.name}`,
      body: `Good afternoon — Ama did really well in this term's Mathematics exam...`,
      link: `#/messages/${tKey}`, read: false, createdAt: now,
    });
  }
  if (headmasterUser) {
    notifications.insert({
      id: uuid(), userId: headmasterUser.id, type: 'SYSTEM', title: 'Welcome to NSEMAS',
      body: 'Your school profile, staff, and student records are ready to explore.',
      link: '#/dashboard', read: false, createdAt: now,
    });
  }

  users.insertMany(allUsers);
  schools.insertMany(allSchools);
  students.insertMany(allStudents);
  teachers.insertMany(allTeachers);
  attendance.insertMany(allAttendance);
  promotions.replaceAll([]);
  transfers.replaceAll([]);
  inspections.replaceAll([]);
  auditLog.replaceAll([]);

  console.log(`Seeded:
  - ${allUsers.length} users
  - ${allSchools.length} schools
  - ${allStudents.length} students
  - ${allTeachers.length} teachers
  - ${allAttendance.length} attendance records
  `);
  console.log('Fixed demo accounts (all password: demo123) — one per role, always available:');
  demoAccounts.forEach((a) => console.log(`  ${a.username.padEnd(26)} -> ${a.name}`));
  console.log('\nAlso available: admin / admin123 (National EMIS Administrator)');
  console.log('Run `node utils/list-logins.js` for the full generated login sheet (headmasters/teachers per school).');
}

if (require.main === module) run();
module.exports = { run, REGIONS, DISTRICTS };
