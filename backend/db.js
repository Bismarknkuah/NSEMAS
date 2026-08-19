/**
 * NSEMAS Data Engine
 * ------------------
 * A lightweight, dependency-free, file-backed JSON data store.
 * Chosen over native-binding DBs (e.g. better-sqlite3) so that the whole
 * platform runs anywhere with just Node.js installed - no compilers,
 * no native modules, no external DB server required for this reference build.
 *
 * In a real national deployment this module would be swapped for
 * PostgreSQL / a managed EMIS-grade RDBMS. The rest of the codebase
 * talks to `db.collection('students')` style calls, so that swap only
 * touches this one file.
 */
const fs = require('fs');
const path = require('path');
const { encrypt, decrypt, isEnabled } = require('./utils/encryption');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const cache = {};

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function load(name) {
  if (cache[name]) return cache[name];
  const fp = filePath(name);
  if (fs.existsSync(fp)) {
    const raw = fs.readFileSync(fp, 'utf-8');
    // Encrypted files are a single base64 blob (no leading '['/'{'); plain
    // JSON files start with one of those. This lets existing unencrypted
    // data keep loading fine even if NSEMAS_ENCRYPT_AT_REST is toggled on
    // for a fresh deployment later.
    const looksEncrypted = isEnabled() && !raw.trimStart().startsWith('[') && !raw.trimStart().startsWith('{');
    cache[name] = JSON.parse(looksEncrypted ? decrypt(raw) : raw);
  } else {
    cache[name] = [];
  }
  return cache[name];
}

function persist(name) {
  const json = JSON.stringify(cache[name], null, 2);
  fs.writeFileSync(filePath(name), isEnabled() ? encrypt(json) : json, 'utf-8');
}

class Collection {
  constructor(name) {
    this.name = name;
    load(name);
  }
  all() {
    return load(this.name);
  }
  find(predicate) {
    return this.all().filter(predicate);
  }
  findOne(predicate) {
    return this.all().find(predicate);
  }
  findById(id) {
    return this.all().find((r) => r.id === id);
  }
  insert(record) {
    const rows = this.all();
    rows.push(record);
    persist(this.name);
    return record;
  }
  insertMany(records) {
    const rows = this.all();
    rows.push(...records);
    persist(this.name);
    return records;
  }
  updateById(id, patch) {
    const rows = this.all();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() };
    persist(this.name);
    return rows[idx];
  }
  deleteById(id) {
    const rows = this.all();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows.splice(idx, 1);
    persist(this.name);
    return true;
  }
  count(predicate) {
    return predicate ? this.find(predicate).length : this.all().length;
  }
  replaceAll(records) {
    cache[this.name] = records;
    persist(this.name);
  }
}

function collection(name) {
  return new Collection(name);
}

module.exports = { collection, DATA_DIR };
