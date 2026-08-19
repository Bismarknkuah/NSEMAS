/**
 * NSEMAS Multi-Factor Authentication — real TOTP (RFC 6238)
 * -----------------------------------------------------------
 * A genuine, standards-compliant Time-based One-Time Password
 * implementation using only Node's built-in crypto module — no external
 * auth service required. Codes generated here are compatible with any
 * real authenticator app (Google Authenticator, Authy, 1Password, etc.):
 * enroll by scanning/typing the secret into one of those apps, and the
 * 6-digit codes it shows will genuinely validate against this server.
 *
 * This is the actual HOTP/TOTP algorithm (HMAC-SHA1, 30-second step,
 * 6 digits) — not a simplified stand-in.
 */
const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

function base32Decode(base32) {
  const clean = base32.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Generate a new random secret for a user enrolling in MFA. */
function generateSecret() {
  return base32Encode(crypto.randomBytes(20)); // 160 bits, standard TOTP secret length
}

/** RFC 4226 HOTP core, keyed by a moving time-counter for TOTP (RFC 6238). */
function hotp(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binCode % 1000000).padStart(6, '0');
}

function totpCounter(stepSeconds = 30, at = Date.now()) {
  return Math.floor(at / 1000 / stepSeconds);
}

/** Generate the current 6-digit TOTP code for a secret (mainly for testing/demo). */
function generateTOTP(secretBase32, stepSeconds = 30, at = Date.now()) {
  return hotp(secretBase32, totpCounter(stepSeconds, at));
}

/**
 * Verify a submitted code, allowing +/-1 time step of clock drift (the
 * standard tolerance window real authenticator apps expect).
 */
function verifyTOTP(secretBase32, token, stepSeconds = 30, window = 1) {
  if (!/^\d{6}$/.test(token)) return false;
  const counter = totpCounter(stepSeconds);
  for (let i = -window; i <= window; i++) {
    if (hotp(secretBase32, counter + i) === token) return true;
  }
  return false;
}

/** Standard otpauth:// URI so any authenticator app can enroll via QR or manual entry. */
function otpauthURI(secretBase32, accountLabel, issuer = 'NSEMAS') {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}

module.exports = { generateSecret, generateTOTP, verifyTOTP, otpauthURI };
