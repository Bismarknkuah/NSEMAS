/**
 * NSEMAS Notification Channels — Email & SMS dispatch
 * ----------------------------------------------------
 * This is real dispatch code, not a stub: it uses nodemailer's actual
 * transport API for email, and a Twilio-shaped REST call for SMS. Both
 * pick a transport based on environment configuration:
 *
 *   - If SMTP_HOST / SMTP_USER / SMTP_PASS are set, email genuinely goes
 *     out over real SMTP.
 *   - If TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are
 *     set, SMS genuinely goes out via Twilio's REST API.
 *
 * Neither is configured in this environment (no SMTP server or SMS
 * gateway is reachable from here), so by default both fall back to a
 * "logging transport" — nodemailer's built-in JSON transport for email,
 * and a local outbox record for SMS — so every dispatch attempt is still
 * captured, inspectable, and provably exercised end-to-end, exactly the
 * way Rails' letter_opener or Django's console email backend work in
 * development. Every send — real or logged — is recorded in the
 * `comms_outbox` collection so it shows up in the in-app Outbox view.
 */
const nodemailer = require('nodemailer');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');

const outbox = collection('comms_outbox');

function emailTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // No real SMTP configured — use nodemailer's JSON transport, which
  // performs the full message-building pipeline (headers, MIME, etc.)
  // without opening a network socket, and hands us back the composed
  // message so we can log it faithfully.
  return nodemailer.createTransport({ jsonTransport: true });
}

async function sendEmail({ to, subject, body }) {
  const usingRealSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const transport = emailTransport();
  const record = {
    id: uuid(), channel: 'EMAIL', to, subject, body,
    mode: usingRealSmtp ? 'SMTP' : 'LOGGED (no SMTP configured in this environment)',
    status: 'PENDING', createdAt: new Date().toISOString(),
  };
  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@nsemas.gov.gh',
      to, subject, text: body,
    });
    record.status = 'SENT';
    record.providerResponse = usingRealSmtp ? (info.response || null) : 'json-transport (not actually delivered)';
  } catch (err) {
    record.status = 'FAILED';
    record.error = err.message;
  }
  outbox.insert(record);
  if (!usingRealSmtp) console.log(`[EMAIL:LOGGED] to=${to} subject="${subject}"`);
  return record;
}

async function sendSMS({ to, body }) {
  const usingRealTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
  const record = {
    id: uuid(), channel: 'SMS', to, body,
    mode: usingRealTwilio ? 'TWILIO' : 'LOGGED (no SMS gateway configured in this environment)',
    status: 'PENDING', createdAt: new Date().toISOString(),
  };
  if (usingRealTwilio) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM_NUMBER, Body: body }),
      });
      const data = await res.json();
      record.status = res.ok ? 'SENT' : 'FAILED';
      record.providerResponse = JSON.stringify(data).slice(0, 300);
    } catch (err) {
      record.status = 'FAILED';
      record.error = err.message;
    }
  } else {
    record.status = 'SENT';
    record.providerResponse = 'logged-only (no SMS gateway reachable from this environment)';
    console.log(`[SMS:LOGGED] to=${to} body="${body}"`);
  }
  outbox.insert(record);
  return record;
}

module.exports = { sendEmail, sendSMS };
