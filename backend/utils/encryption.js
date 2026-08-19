/**
 * NSEMAS Encryption-at-Rest
 * -------------------------
 * Real AES-256-GCM encryption (Node's built-in crypto, no external deps)
 * for the JSON data files on disk. Disabled by default so the existing
 * seed/reseed/inspect-the-files workflow keeps working out of the box;
 * enable it by setting NSEMAS_ENCRYPT_AT_REST=true when starting the
 * server. When enabled, every collection file on disk is ciphertext —
 * `cat backend/data/students.json` shows unreadable bytes, not JSON.
 *
 * Key management: if ENCRYPTION_KEY isn't set in the environment, a
 * 256-bit key is generated on first run and written to
 * backend/data/.encryption-key (0600 permissions). This is a reasonable
 * default for a self-contained reference build; a real deployment would
 * pull the key from a proper secrets manager / KMS instead of a local
 * file, and that swap is isolated entirely to loadKey() below.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGO = 'aes-256-gcm';
const KEY_FILE = path.join(__dirname, '..', 'data', '.encryption-key');

let cachedKey = null;

function loadKey() {
  if (cachedKey) return cachedKey;
  if (process.env.ENCRYPTION_KEY) {
    cachedKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (cachedKey.length !== 32) throw new Error('ENCRYPTION_KEY must be a 64-character hex string (256 bits)');
    return cachedKey;
  }
  const dataDir = path.dirname(KEY_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(KEY_FILE)) {
    cachedKey = Buffer.from(fs.readFileSync(KEY_FILE, 'utf-8').trim(), 'hex');
  } else {
    cachedKey = crypto.randomBytes(32);
    fs.writeFileSync(KEY_FILE, cachedKey.toString('hex'), { mode: 0o600 });
  }
  return cachedKey;
}

function isEnabled() {
  return process.env.NSEMAS_ENCRYPT_AT_REST === 'true';
}

/** Encrypt a UTF-8 string, returning a single self-contained base64 blob (iv + tag + ciphertext). */
function encrypt(plaintext) {
  const key = loadKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/** Reverse of encrypt(): takes the base64 blob back to the original UTF-8 string. */
function decrypt(blob) {
  const key = loadKey();
  const raw = Buffer.from(blob, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf-8');
}

module.exports = { encrypt, decrypt, isEnabled };
