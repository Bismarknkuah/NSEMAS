const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { run: seed } = require('./utils/seed');

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Railway (and most PaaS hosts) sit behind a reverse proxy — this makes
// req.protocol / req.ip reflect the real client instead of the proxy hop.
app.set('trust proxy', 1);

// CORS: permissive by default (this API is Bearer-token authenticated, not
// cookie-based, so an open origin policy doesn't carry the usual CSRF risk
// cookie auth would). Set CORS_ORIGIN to a comma-separated list of allowed
// origins to lock it down for a production deployment where the frontend
// is hosted separately (e.g. on Vercel) from this API (e.g. on Railway).
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true; // reflect any origin
app.use(cors({ origin: corsOrigins }));

app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// Startup checks that matter once this leaves localhost
if (NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('\n⚠️  WARNING: JWT_SECRET is not set. Using the built-in development ' +
    'secret in production means anyone can forge login tokens. Set JWT_SECRET ' +
    'in your Railway/hosting environment variables before going live.\n');
}
if (process.env.NSEMAS_ENCRYPT_AT_REST === 'true' && !process.env.ENCRYPTION_KEY) {
  console.warn('\n⚠️  NSEMAS_ENCRYPT_AT_REST is on but ENCRYPTION_KEY is not set — a key ' +
    'was auto-generated and stored in backend/data/.encryption-key. Make sure that ' +
    'file lives on a persistent volume, or data encrypted with it becomes unrecoverable ' +
    'on the next deploy.\n');
}

// Ensure data exists on first run
seed();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'NSEMAS', env: NODE_ENV, time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/promotion', require('./routes/promotion'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/infrastructure', require('./routes/infrastructure'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/academics', require('./routes/academics'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/national-exams', require('./routes/nationalExams'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/qa', require('./routes/qa'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/export', require('./routes/export'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/library', require('./routes/library'));
app.use('/api/vclass', require('./routes/vclass'));
app.use('/api/homepage-media', require('./routes/homepageMedia'));
app.use('/api/teacher-transfers', require('./routes/teacherTransfers'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/approvals', require('./routes/approvals'));

// Serve the frontend (static files) so the whole system can run from one
// service (this is what a single Railway deployment does). If you deploy
// the frontend separately to Vercel, this block still harmlessly serves it
// here too — Vercel just won't be pointed at it.
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File is too large (max 15MB)' });
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  // A fileFilter callback rejecting a file (e.g. wrong file type) throws a
  // plain Error, not a MulterError — still a client input problem, not a
  // server fault, so it belongs here too rather than falling through to
  // the generic 500 handler below.
  if (err && err.message && /only images|only video|not allowed|file type/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const http = require('http');
const server = http.createServer(app);
require('./utils/vclassSignaling')(server); // attaches the WebSocket signaling server for virtual classrooms

server.listen(PORT, () => {
  console.log(`\nNSEMAS backend running on port ${PORT} (${NODE_ENV})`);
  console.log(`Frontend served from same origin: http://localhost:${PORT}`);
});
