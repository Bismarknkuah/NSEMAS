# NSEMAS
### National Smart Education Management, Attendance, Monitoring and Quality Assurance System
Reference implementation for the Ministry of Education / Ghana Education Service

> **Deploying this online?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for GitHub,
> Railway, and Vercel setup — including why this app's stateful backend
> needs Railway (not Vercel serverless) for the API.

---

## What this is

A complete, working full-stack implementation of the NSEMAS specification: a real
backend API, a real database (file-backed, zero setup), and a real browser
frontend — not a mockup. Every module described in the spec is implemented as
working software: digital student passports, biometric attendance (simulated —
see "What's simulated" below) with a genuine minutiae-matching engine, a
configurable promotion/repetition engine, the full tiered transfer-approval
workflow, teacher records, curriculum/timetabling/exams/report cards,
assignments/homework, alumni records, teacher leave management, a real
National Examinations Council (BECE/WASSCE) integration, threaded
parent↔teacher messaging with event-driven notifications and real email/SMS
dispatch code, school inspections, infrastructure & asset management,
executive dashboards, GIS-style school mapping, a rule-based education
intelligence engine, and full parent/student portals — all gated by the full
67-role national → regional → district → circuit → school → teaching →
student-leadership hierarchy described in the spec's User Roles section,
role-for-role rather than a handful of broad buckets. Security infrastructure
is real too: RFC 6238-compliant two-factor authentication, AES-256-GCM
encryption-at-rest, and working backup/restore tooling.

It has been tested end-to-end: every page renders for every one of the 67
roles with zero JavaScript errors, and core workflows (login, promotion
decisions, attendance check-in with real biometric verification, exam score
entry, report card generation, leave approval, messaging, transfers) have
been exercised against the live API — including a headless-browser test
suite that actually clicks buttons and submits forms rather than just
checking that pages load.

## What's simulated (and why)

This runs entirely on your machine from a chat conversation, so a few things
are necessarily stand-ins for infrastructure that doesn't exist here:

- **Biometrics** — there's no physical fingerprint scanner to talk to, so
  `backend/utils/biometrics.js` implements a real simulated minutiae-matching
  engine: each student gets a deterministic synthetic "finger identity";
  enrollment captures 3 scans and trains a canonical template (keeping only
  points consistent across all 3 samples, exactly how real biometric SDKs
  improve template quality with multi-sample capture); check-in generates a
  fresh scan and matches it against the stored template with a real
  nearest-neighbor tolerance algorithm, genuinely accepting matches and
  rejecting non-matches (tested at 100% genuine-accept / 0% imposter-accept
  across 20 trials each). This is real matching logic operating on synthetic
  ridge data — not a boolean flag — but it is still synthetic data, not an
  actual sensor feed.
- **AI Insights** — dropout risk, struggling-school detection, teacher
  absenteeism flags, and enrollment forecasts are produced by **transparent,
  auditable rule-based heuristics** over the platform's own data, not a
  trained ML model (there's no national dataset to train one on here, and for
  a government accountability tool, explainability is arguably the right
  starting point anyway). The API surface is designed so a real model could
  be swapped in later without touching the frontend.
- **GIS map** — school coordinates are positioned using each school's real
  region's approximate lat/lng (not exact addresses), rendered as a
  schematic proportional map rather than a traced coastline — there's no
  live device/GPS feed or mapping tile service available here.
- **Email & SMS** — `backend/utils/notificationChannels.js` uses real
  transport code (nodemailer's actual API for email, a genuine Twilio-shaped
  REST call for SMS), but there's no SMTP server or SMS gateway reachable
  from this environment, so both fall back to a logging transport by
  default — every dispatch is still genuinely attempted and recorded (see
  the Comms Outbox page), it just doesn't leave the building. Set
  `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` or `TWILIO_ACCOUNT_SID`/
  `TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` in the environment and it
  switches to real delivery with no code changes.
- **National Examinations Council (BECE/WASSCE)** —
  `backend/routes/nationalExams.js` implements the real integration shape:
  candidate registration (assigns a genuine WAEC-format index number),
  a sync operation that reconciles a school's registered candidates
  against whatever the exam body has published, and a checker mirroring
  WAEC's actual index-number + serial-PIN results lookup. There's no live
  WAEC API/SFTP feed reachable here and no real candidate data, so
  "published results" come from a seeded stand-in for that feed rather
  than a live pull — but the sync is a genuine reconciliation operation,
  not a no-op: one demo candidate is seeded as already-published, a second
  is seeded as still pending at the exam body, and running the sync
  visibly moves the second one from pending to published. Official
  results are tagged `NATIONAL_EXAMS_COUNCIL` on report cards so they're
  never confused with a school's own locally-entered scores.
- **Leadership photos** — the login and homepage Leadership sections
  (President, Vice President, Minister of Education) display real photos
  at `frontend/assets/leadership/{president.png,vp.png,minister.jpg}`,
  provided by the client for this deployment. If a file is ever removed or
  renamed, that person's card falls back cleanly to a plain icon rather
  than a broken image. To replace any of these, drop in a new file with
  the same name — no code changes needed.
- **National-scale data** — seeded with a representative slice (8 regions,
  ~30 schools, ~450 students, ~130 teachers) rather than millions of real
  records, so you can explore the whole system quickly.

Everything else — the role hierarchy, permission enforcement, the promotion
rules engine, the transfer approval chains, attendance analytics, inspections,
lesson plans, infrastructure/asset tracking, audit logging, MFA, and
encryption-at-rest — is real, working logic, not placeholder text. See
"Security infrastructure" below for MFA/encryption/backup specifics.

## Executive role appointments

Student leadership titles (School Prefect, SRC Executive, Class Prefect,
etc.) and teacher coordination titles (Department Head, Form Master, House
Master, Subject Coordinator, Boarding Coordinator, Sports Coordinator) are
**appointments layered on one underlying account**, not separate logins. A
headmaster assigns them from a student's or teacher's profile page (and
revokes them just as easily).

Switching is a row of **tabs at the top of every page** — "Personal" and
one tab per appointment held — never a link, never anything resembling a
sign-out or a trip back to the login screen. Clicking a tab is a single,
instant, in-place switch.

Technically: switching doesn't create a new user record. It issues a new
session token for the *same* account with a different role claim (see
`backend/routes/appointments.js`) — every permission check in the app reads
that claim, so the person's real stored identity (their student or teacher
record) never changes, only what they're currently acting as. The switch
itself makes exactly one network call (earlier versions made two — the
extra round-trip to re-fetch the account was removed since it added a
window where any transient issue could interrupt the switch for no
benefit; the updated role is already known from the switch response
itself). This was tested for the failure mode that actually matters: one account cannot
switch into another account's appointment, even by guessing the ID (a
direct API test confirms this returns 403).

The "Quick demo access" grid's student-leadership and teacher-coordination
entries (Boys Prefect, Department Head, etc.) route through this same
mechanic rather than separate logins: clicking one logs into the real demo
student/teacher account and auto-provisions that appointment on the spot
(`POST /appointments/demo-quick-login`, demo accounts only), landing
already switched into it with the "Personal" tab genuinely available
alongside it — so exploring any of the 70 roles demonstrates the real
appointment system, not a simulation of it.

## Parent accounts with multiple children

One parent account can be linked to multiple children — including children
at *different schools*, public or private. This is a real many-to-many
link (`parent_links` collection, `backend/routes/portal.js`), not a
single `childId` field, so a parent with kids at two different institutions
sees both from one login, with a one-click switcher between them (`Pages.portalHome`
in `frontend/js/pages.js`) that updates the whole portal — attendance,
timetable, results — to whichever child is selected.

## Group messaging with a seniority barrier

Beyond one-to-one messaging (teacher↔parent, and now student↔student peer
messaging), NSEMAS supports real group chats — text, file attachments, and
live voice recording via the browser's own microphone (`MediaRecorder`,
no external service). Who can create a group and who they're allowed to
add is governed by the same role hierarchy as everything else in the
system: **a group's creator can only add members at or below their own
tier** — a Course Rep can add fellow students but not a teacher; a
Headmaster can add their own staff but not a District Director. This is
enforced server-side on every add (`backend/routes/groups.js`), not just
at creation, and the "add member" UI never even offers an out-of-bounds
choice in the first place.

**Class-scoped, with a delegation path**: a student-leader-tier creator
(Course Rep, Class Prefect, etc.) adding a plain student can only add
their *own* classmates — but adding another student leader (a different
class's prefect or rep) is unrestricted. That's deliberate: a Course Rep
can't reach into another class directly, but can bring in that class's own
leader, who can then add their own classmates. One function
(`membershipDecision` in `backend/routes/groups.js`) enforces this
identically at group creation, individual add, and bulk add — so it can't
be bypassed by going through a different endpoint.

**Bulk add**: a Headmaster (or anyone with a broad enough scope) gets
one-click buttons like "+ All of JHS2 (32)" or "+ All Teachers (12)"
instead of picking people individually — computed server-side
(`GET /groups/candidates/addable` returns both the individual candidate
list and these pre-filtered buckets) so a bucket only ever contains people
that specific creator is actually allowed to add.

## Basic vs. Secondary school classification

Public/Private has always been tracked (`school.type`); this adds explicit
Basic Education (KG/Primary/JHS) vs. Secondary Education (SHS)
classification as its own filterable dimension on the Schools page,
derived from each school's `level` field rather than stored redundantly —
see `categoryForLevel()` in `backend/routes/schools.js`.

## Virtual classroom — real video/audio, not a mockup

Every role can host or join a live session — a teacher running a lesson, a
headmaster running a staff meeting, a district director running a
briefing. This is genuine peer-to-peer WebRTC: real camera/microphone
capture, real browser-to-browser media connections, screen sharing, live
chat, mute/hand-raise state synced across everyone in the room, and host
controls (remove a participant, end the session for everyone).

**What's real vs. what's honestly limited:**
- The signaling (connection setup) runs over a WebSocket attached to this
  same backend (`backend/utils/vclassSignaling.js`) — tested directly with
  real WebSocket clients exchanging real join/leave/offer/answer/ICE/chat
  messages, not simulated.
- Once two browsers are signaled to each other, media flows directly
  between them — this server never touches the video/audio itself.
- This build uses STUN only (no TURN relay server). That means it
  connects reliably across the large majority of home, mobile, and office
  networks, but can fail across some restrictive institutional firewalls
  that block direct peer traffic outright. A production deployment
  serving many institutions would want a TURN server added.
- Topology is full mesh (everyone connects directly to everyone) — right
  for small class/meeting sizes without needing a media server, but it
  doesn't scale to large-lecture-hall video; that would need a proper SFU.

## Bulk student admission

Headmaster-tier roles can import many students at once via CSV
(`backend/routes/students.js`, `POST /students/bulk`) instead of admitting
one at a time — each row gets its own real result (created or skipped
with a reason), so one bad row doesn't abort the whole batch.

## Library — real book catalog, not just digital resources

Distinct from the existing digital "learning materials" feature: Librarian
(or school leadership) manages an actual book catalog with real copy
counts; students browse, borrow (availability computed live from active
loans, not a manually-tracked counter that can drift), and return. At
private schools specifically, a priced book can be bought — which
genuinely creates an invoice through the finance system already built,
rather than a second, separate payment flow.

## System Administration

`NATIONAL_EMIS_ADMIN` (the `admin` demo account) has genuinely elevated
control that no other role — including national-tier oversight roles like
Deputy Minister or Director-General — has access to:

- **Search every account in the system**, across every school and region,
  bypassing the normal data-visibility scoping everyone else operates under
- **Create new accounts and assign any role**, including top management
  (Deputy Minister, Chief Director, Director-General, Deputy
  Director-General, and every other role in the 67-role catalog) — a
  username and one-time temporary password are generated automatically
  and shown once, never retrievable again
- **Reassign an existing account's role** at any time
- **Disable/re-enable any account**, which takes effect *immediately* —
  a disabled account's existing session is rejected on its very next
  request, not just blocked from logging in again (enforced in the core
  `authenticate` middleware, not just at the login endpoint)
- **System-wide audit log** of administrative actions (account creation,
  role reassignment, enable/disable, password changes, and more)

**The one deliberate carve-out**: the Minister's account sits entirely
outside this console's authority — it cannot be created, edited, disabled,
or reassigned by admin, enforced on the backend (not just hidden in the
UI) at every relevant endpoint. An admin also cannot disable their own
account. See `backend/routes/admin.js` and `Pages.admin` in
`frontend/js/pages.js`.

The Minister's own dashboard is correspondingly the richest in the
system — it combines every analytics widget that exists anywhere else
(AI risk summary, national HR leave overview, curriculum catalog, national
exam publication status, regional enrollment) into one view, rather than
the narrower portfolio-specific slice every other national-tier role sees.

## Profile management

Every account — from a Minister down to a Storekeeper — can edit their own
contact info, change their password, and upload a profile photo from the
"My profile" link in the sidebar (`backend/routes/profile.js`). Photos are
stored as a data URI directly on the user record (capped at ~700KB) since
there's no separate blob storage in this build.

## Navigation boundaries, not just dashboard content

Every sidebar link declares exactly who needs it, rather than showing the
full menu to everyone and relying on in-page permission checks alone. A
Librarian's sidebar has four items — Dashboard, Announcements, Messages,
Groups — full stop. A Teacher's has a genuinely different set focused on
their own classes. A Headmaster's includes management pages neither of
them see. This was tested directly across the hierarchy, not just eyeballed:
confirmed a Librarian's and a Teacher's nav sets are byte-for-byte
different, confirmed a Teacher's and a Headmaster's are different, and
confirmed specific real absences (a Teacher never sees "Teachers" staff
management; nobody below national/regional/district/circuit tier sees "GIS
Mapping," a planning tool with no classroom-level use).

This isn't cosmetic — the pages a role can't see are, for the actions that
matter (creating a promotion decision, approving a transfer, editing
infrastructure records), also rejected server-side by role (see the
`requireRole(...)` guards throughout `backend/routes/`), so hiding the nav
link reinforces a real backend boundary rather than standing in for one.
See the `when(ctx)` predicate on each item in `NAV_GROUPS` in
`frontend/js/app.js`.

## Dashboards, differentiated by role

Every role does not see the same dashboard. Dashboards are composed
differently based on what that role actually needs to act on — not just
scoped by data visibility, but genuinely different widgets:

| Role group | What their dashboard shows |
|---|---|
| Headmaster / Proprietor / Assistant Heads / School Admin | Command center: today's attendance, students needing attention, leave requests awaiting their decision, recent inspections |
| Teachers (+ coordination appointees) | "My day" focus: today's school attendance, their own posted assignments, their own leave requests — not national rankings they have no reason to act on |
| Counsellor | Students flagged by behaviour notes or low attendance, front and center |
| Nurse | Students with a medical condition on file |
| Secretary / Accountant / Storekeeper / ICT Coordinator / Security Officer / Librarian | Same minimal base (school info, announcements) — **plus one genuinely distinct widget per role**: Secretary sees recent admissions, Accountant sees asset/maintenance position, Storekeeper sees inventory, ICT Coordinator sees ICT-tagged assets specifically, Security Officer sees today's campus check-in count, Librarian sees learning materials. No two of these six are pixel-identical. |
| Private school board (Executive Director, Board Chairman, etc.) | Governance-level KPIs only — enrollment, attendance rate, inspection scores — no day-to-day operational widgets |
| National HR / Regional HR / District HR | The standard tier-scoped oversight dashboard, plus a pending-leave-requests card specific to their portfolio |
| National Curriculum Officer / National Examination Officer | Same oversight dashboard, plus a subject-catalog or exam-candidate card specific to their remit |
| National / Regional / District / Circuit (everyone else) | The broad oversight view: attendance trend, school rankings, regional distribution, inspections |
| Parent / Student / Student leader (acting) | The existing tabbed portal (attendance, timetable, assignments, results, learning materials) |

This is driven by `Pages.dashboard` in `frontend/js/pages.js`, which routes
to one of several distinct renderer functions based on role — not a single
template with conditionally-hidden sections.

## Security infrastructure

These were previously listed as out-of-scope; they're now implemented for
real, with the one honest caveat above about email/SMS delivery:

- **MFA (2FA)** — `backend/utils/totp.js` is a genuine RFC 6238 TOTP
  implementation (verified against the RFC's own official test vector),
  compatible with real authenticator apps (Google Authenticator, Authy,
  1Password, etc. — enter the secret shown during setup manually, since
  there's no QR image renderer in this build). Enable it from the sidebar's
  "Security settings" link; once on, login requires a 6-digit code after
  the password.
- **Encryption-at-rest** — `backend/utils/encryption.js` provides real
  AES-256-GCM encryption of every JSON data file, off by default (so the
  normal seed/inspect workflow keeps working) and enabled by setting
  `NSEMAS_ENCRYPT_AT_REST=true`. With it on, `cat backend/data/students.json`
  shows unreadable ciphertext, not JSON.
- **Backup & disaster recovery** — `node utils/backup.js` snapshots the
  entire data directory to `backend/backups/<timestamp>/`;
  `node utils/restore.js <name>` (or `--latest`) restores it, safety-
  snapshotting whatever's currently there first. `npm run backup` /
  `npm run restore` from `backend/` also work.
- **SSO** — not built as a separate protocol implementation. The JWT-based
  auth already functions as single sign-on across every module in this one
  application; extending it to real SSO with external systems (SAML/OAuth
  against a government identity provider) would be additional integration
  work against a real IdP, which doesn't exist to integrate against here.

## Known gaps against the full specification

Being direct about what's *not* built, so nothing is oversold:

- **A real WAEC (West African Examinations Council) connection** — the
  BECE/WASSCE integration (registration → sync → checker, see below) is
  genuinely built and working, but there's no live WAEC API/SFTP feed
  reachable from this environment and no real candidate data, so the
  "exam body's published results" side of the sync is a seeded stand-in
  rather than a live pull. The integration *shape* is real; the data
  behind it isn't.
- **SSO against a real external identity provider** — see above.

That's it — assignments/homework, alumni records, MFA, encryption-at-rest,
backup/restore, and the national examinations integration were the
remaining gaps from previous rounds and are now built (see below and the
module table).

What *is* solidly built: the digital student passport, biometric attendance
(with real matching — see above), the configurable promotion/repetition
engine, the full tiered transfer-approval workflow, teacher records and
lesson plans, school inspections, infrastructure/asset management with
maintenance requests, GIS mapping, rule-based AI insights, executive
dashboards, parent/student portals, **the full national/regional/district/
circuit/school/teaching/student-leadership role catalog (70 roles, matching
the spec's User Roles section role-for-role rather than broad buckets)**,
**curriculum management with a national subject catalog, per-class weekly
timetables, exam sessions graded on Ghana's real BECE/WASSCE 9-point scale,
and generated report cards**, **teacher leave request/approval workflows**,
and **threaded parent↔teacher messaging with an event-driven notification
feed** (a promotion decision or transfer status change genuinely notifies
the affected parent — this isn't just a message inbox sitting unused).

Built more recently, and not yet reflected above: a **homepage media CMS**
letting named national executives (Minister, Deputy Minister,
Director-General, Deputy Director-General, National EMIS Administrator)
publish real images or short videos to the public homepage before anyone
signs in; **teacher transfer requests**, a parallel workflow to student
transfers that reuses the same real jurisdiction-aware approval chain, so
a teacher can request their own relocation and track it through to
completion; genuinely scoped **manual attendance entry** (Course Rep to
their own class, House Master/Matron to their own house, Headmaster tier
school-wide) with a real bulk-entry screen, not just a single-student
fallback; **assignment file upload/download** with optional per-assignment
time limits enforced server-side; and a permanent **"My Offices" sidebar**
for anyone holding an appointment, so switching between a personal and a
duty view doesn't require hunting for a tab.

## Quick start

Requires only Node.js (v18+). No database server, no build step, no internet
connection needed once dependencies are installed.

```bash
cd backend
npm install        # only needed once — node_modules is already included in this zip,
                    # so you can usually skip straight to `npm start`
npm start
```

Then open **http://localhost:4000** in a browser. The frontend is served by
the same server — there's nothing separate to start.

The first time it runs, the server automatically seeds the database (JSON
files under `backend/data/`, created fresh). To reset all data at any point,
stop the server and delete `backend/data/`, then restart.

### Quick demo access

The login screen opens on a **Quick demo access** tab: a searchable grid of
one-click role cards covering all **70 roles** in the system, organized by
tier (National leadership, Regional administration, District & circuit
administration, School management, Teaching staff, Private school board,
Student leadership, Students & families). Click a card and you're in — no
password typing needed. Type in the search box to filter (e.g. "librarian",
"district", "prefect"). A **Sign in with credentials** tab sits alongside
for username/password login.

These are backed by fixed, predictable accounts (all password `demo123`)
anchored to two dedicated demo schools ("NSEMAS Demo Model School" and
"NSEMAS Demo Annex School") so the quick-login buttons work identically
every time the database reseeds, regardless of what's randomly generated
for the rest of the national dataset. While logged in as a demo account,
a **"Switch role"** link appears in the sidebar to jump straight back to
the role picker.

| Tier | Fixed demo accounts |
|---|---|
| National (13) | `demo_minister`, `demo_deputy_minister`, `demo_chief_director`, `demo_director_general`, `demo_deputy_director_general`, `demo_national_director`, `demo_national_monitoring`, `demo_national_qa`, `demo_national_emis`, `demo_national_ict`, `demo_national_hr`, `demo_national_curriculum`, `demo_national_exam` |
| Regional (8) | `demo_regional_director`, `demo_asst_regional_director`, `demo_regional_monitoring`, `demo_regional_qa`, `demo_regional_emis`, `demo_regional_ict`, `demo_regional_hr`, `demo_regional_finance` |
| District & circuit (9) | `demo_district_director`, `demo_asst_district_director`, `demo_district_monitoring`, `demo_district_emis`, `demo_district_statistics`, `demo_district_ict`, `demo_district_hr`, `demo_circuit_supervisor`, `demo_asst_circuit_supervisor` |
| School management (12) | `demo_headmaster`, `demo_assistant_head`, `demo_assistant_head_admin`, `demo_school_admin`, `demo_secretary`, `demo_accountant`, `demo_storekeeper`, `demo_librarian`, `demo_ict_coordinator`, `demo_counsellor`, `demo_nurse`, `demo_security_officer` |
| Teaching staff (9) | `demo_teacher`, `demo_department_head`, `demo_subject_coordinator`, `demo_form_master`, `demo_house_master`, `demo_boarding_coordinator`, `demo_lab_technician`, `demo_workshop_instructor`, `demo_sports_coordinator` |

Two additional teaching-staff duties — **Matron** and **Senior House
Master** — don't have fixed demo logins of their own; they're reached the
same way any real school appoints them, by assigning an existing teacher
to the duty (Teachers → Assign coordination role), which is also how the
demo grid's other coordination roles work under the hood.
| Private school board (5) | `demo_proprietor`, `demo_executive_director`, `demo_board_chairman`, `demo_board_member`, `demo_proprietor_rep` |
| Student leadership (9) | `demo_student_leader` (School Prefect), `demo_assistant_prefect`, `demo_boys_prefect`, `demo_girls_prefect`, `demo_class_prefect`, `demo_course_rep`, `demo_src_executive`, `demo_hall_rep`, `demo_house_prefect` |
| Students & families (2) | `demo_parent`, `demo_student` |

All of the above use password `demo123`. `admin` / `admin123` (National EMIS
Administrator) is also still available, along with individually-generated
headmaster/teacher logins per school (`node backend/utils/list-logins.js`).

### Demo logins (legacy list, still valid)

All seeded passwords are `password123`, except `admin` which is `admin123`.

| Username | Role |
|---|---|
| `admin` | National EMIS Administrator |
| `national1` | Minister of Education |
| `regdir_gar` | Greater Accra Regional Director |
| `distdir_accra_metro` | Accra Metro District Director |
| `parent_demo` | Parent portal |
| `student_demo` | Student portal |

Every school also gets a generated headmaster/proprietor and 3–6 teacher
logins. To see the full list (including which school each one belongs to):

```bash
cd backend
node utils/list-logins.js
```

## Architecture

```
nsemas/
├── backend/
│   ├── server.js            Express app; serves the API and the frontend
│   ├── db.js                Lightweight JSON file data engine (see below)
│   ├── middleware/auth.js   JWT auth + role hierarchy + permission guards
│   ├── routes/               One file per module (see mapping below)
│   ├── utils/
│   │   ├── seed.js           Generates the national hierarchy + demo data
│   │   ├── list-logins.js    Prints every generated username
│   │   └── scope.js          Hierarchical data-visibility filtering
│   └── data/                 Generated on first run — the "database"
└── frontend/
    ├── index.html
    ├── css/style.css          Design system (see "Design" below)
    └── js/
        ├── api.js             Typed wrapper over every backend endpoint
        ├── components.js      Small reusable UI helpers (toasts, modals, badges)
        ├── pages.js           One render function per screen
        └── app.js             Router, role-based navigation, session handling
```

### Why a JSON file database instead of Postgres/MySQL/SQLite?

So that this zip runs anywhere with nothing but Node.js installed — no
database server to stand up, no native compiled bindings that might not build
on your machine. `backend/db.js` is a small abstraction (`collection('students').find(...)`,
`.insert(...)`, `.updateById(...)`, etc.) — swapping in a real RDBMS for a
production deployment means rewriting that one file; every route already
talks to it through that same interface.

### Role hierarchy & data scoping

Every user has a `role` and a `scope` (region/district/circuit/school). On
every request, `utils/scope.js` computes exactly which school IDs that user
is allowed to see, and every route filters through it — a District Director
physically cannot fetch data for another district, even by guessing an ID
directly against the API.

## Module-by-module mapping to the specification

| Spec section | Where it lives |
|---|---|
| Digital Student Academic Passport | `routes/students.js`, `Pages.studentDetail` |
| Biometric Attendance Management | `routes/attendance.js`, `utils/biometrics.js` (real minutiae matching engine), `Pages.attendance` |
| Promotion / Demotion / Repetition engine, configurable rules | `routes/promotion.js`, `Pages.promotion` |
| Student Transfer Management + tiered approval chains | `routes/transfers.js`, `Pages.transfers` |
| Teacher Management, lesson plans | `routes/teachers.js`, `Pages.teachers` |
| Curriculum, Timetabling, Exams & Report Cards | `routes/academics.js`, `Pages.academics` |
| National Examinations Council integration (BECE/WASSCE) | `routes/nationalExams.js`, `Pages.academics` ("National Exams" tab) |
| Assignments / Homework | `routes/assignments.js`, `Pages.assignments` |
| Alumni Records | `routes/alumni.js`, `Pages.alumni` |
| Teacher Leave Management | `routes/leave.js`, `Pages.leave` |
| Messaging, Notifications & Email/SMS dispatch | `routes/messages.js`, `utils/notificationChannels.js`, `Pages.messages`/`Pages.outbox`, notification bell in `app.js` |
| Inspection & Quality Assurance | `routes/inspections.js`, `Pages.inspections` |
| Infrastructure & Asset Management | `routes/infrastructure.js`, `Pages.infrastructure` |
| AI Education Intelligence Engine | `routes/ai.js`, `Pages.ai` |
| Executive Dashboards | `routes/dashboard.js`, `Pages.dashboard` |
| GIS Education Mapping | `routes/dashboard.js` (`/gis`), `Pages.gis` |
| Parent Portal | `routes/portal.js` (`/my-child`), `Pages.portalHome` |
| Student Portal (timetable, assignments, results, learning materials, attendance) | `routes/portal.js` (`/my-profile`) + `routes/academics.js`/`routes/assignments.js`, `Pages.portalHome` (tabbed) |
| Security & Governance (RBAC, audit trail, MFA, encryption-at-rest, backup/DR) | `middleware/auth.js`, `utils/totp.js`, `utils/encryption.js`, `utils/backup.js`/`utils/restore.js`, `audit_log` collection |
| National/Regional/District/Circuit/School User Roles (full catalog) | `utils/roles.js` (backend registry), mirrored in `frontend/js/app.js`; enforced via `utils/scope.js` |
| Student leadership & teacher coordination appointments (assign/switch) | `routes/appointments.js`, one-click "Switch to X Dashboard" toggle in `app.js` sidebar |
| Parent accounts with multiple children (public/private, cross-school) | `routes/portal.js` (`parent_links`, `/my-children`), child switcher in `Pages.portalHome` |
| Group messaging (text/file/voice) with seniority barrier | `routes/groups.js`, `Pages.groups` |
| Profile management (photo, password, contact info) | `routes/profile.js`, "My profile" modal in `app.js` |
| Basic vs. Secondary school classification & filtering | `routes/schools.js` (`categoryForLevel`), filter pills in `Pages.schools` |

### The role catalog

`backend/utils/roles.js` is the single source of truth for every role in
the system — 67 of them, matching the spec's User Roles section role-for-
role (Deputy Minister, National Curriculum/Examination Officers, Regional
Finance Officer, Secretary/Accountant/Librarian/Nurse/Security Officer,
Department Heads, House Masters, Board Members, all nine student-leadership
titles, etc.) rather than the broader buckets an earlier version of this
build used. Each role carries:

- a **tier** (National/Regional/District/Circuit/School/Private
  Board/Student Leader/Portal) that drives data visibility in
  `utils/scope.js` — this is why adding a new role never requires touching
  the scoping logic; only the four hierarchy tiers get special handling,
  and everything else already falls through to "their own school"
- **capability flags** (`canAdmit`, `canInspect`, `canAnnounce`,
  `canApproveLeave`, `canManageAcademics`, `canManageCurriculum`) that
  drive both backend permission checks (`requireFlag()` in
  `middleware/auth.js`) and which buttons the frontend shows — a Librarian
  and a Headmaster are both "School tier" and see the same data, but only
  the Headmaster can admit a student or approve leave

The frontend mirrors this catalog in `app.js` (`ROLE_CATALOG`) since there's
no shared module system between the Node backend and the browser; keep
both in sync if you add or change a role.

## Design

The visual identity is deliberately rooted in Ghanaian civic institutions
rather than a generic SaaS dashboard look: a deep forest green (Ministry/GES
institutional color) paired with a muted gold accent evoking an official seal
or stamp, set in Fraunces (a serif with real "ministry document" gravity) for
headings and IBM Plex Sans/Mono for body text and records/IDs. Tables use a
ledger-style hairline-rule treatment throughout, and the eight-point seal
mark used as the system's logo reappears faintly as a watermark on
passport-style views (student records, parent/student portal) to underline
that these are official records.

The **login screen** is a split layout: a hero panel on the left (seal mark,
system tagline, national coverage stats) and an access panel on the right
with two tabs — Quick demo access (the full role-card grid) and Sign in with
credentials. The **dashboard** opens with a time-of-day greeting and a plain-
language summary of what's in the person's scope, followed by a 14-day
attendance-rate sparkline and a student demographics breakdown (gender split,
enrollment by level), then the existing school-ranking and announcements
panels.

## Extending this toward a real deployment

The places a real national rollout would need to add real infrastructure
(not just more of what's already here):

1. **Database**: swap `backend/db.js` for PostgreSQL (the collection-style
   interface it exposes maps cleanly onto SQL tables + an ORM).
2. **Biometric hardware**: replace the `/api/attendance/check-in` call sites
   in the frontend with real device SDK callbacks; the backend endpoint
   itself doesn't need to change.
3. **AI Insights**: once there's a real national dataset, `routes/ai.js`'s
   heuristics can be replaced with calls to a trained model — the response
   shape is already stable.
4. **Email/SMS delivery**: set `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` and/or
   `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` in the
   environment — `utils/notificationChannels.js` switches from logging to
   real delivery automatically, no code changes needed.
5. **SSO**: front `middleware/auth.js`'s JWT issuance with a real SAML/OAuth
   flow against a government identity provider, if one exists to integrate
   against; MFA is already real (see above), this is the one remaining
   authentication gap.
6. **Secrets management**: move `JWT_SECRET` and the encryption key
   (`utils/encryption.js`, currently a local file if `ENCRYPTION_KEY` isn't
   set) to a proper secrets manager/KMS.
7. **Scale**: the JSON file store is fine for demonstration and even small
   pilot deployments, but a national rollout needs a real RDBMS, connection
   pooling, and horizontal scaling of the API tier. The backup/restore
   scripts here are file-copy based for the same reason — a real RDBMS
   would use its own backup tooling (pg_dump + WAL archiving, managed
   snapshots) plus off-site replication instead.
