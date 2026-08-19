/**
 * NSEMAS Backup & Disaster Recovery
 * ----------------------------------
 * Creates a timestamped snapshot of the entire data directory (every
 * collection file, whatever encryption state they're in) under
 * backend/backups/. Real, working file-copy logic — not a placeholder.
 *
 * Usage:
 *   node utils/backup.js              # create a new timestamped backup
 *   node utils/backup.js --list       # list available backups
 *
 * For restore, see utils/restore.js.
 *
 * In a real national deployment this would be replaced by your database's
 * own backup tooling (pg_dump + WAL archiving, managed snapshots, etc.)
 * plus off-site replication — this file-copy approach is right-sized for
 * the JSON file store used in this reference build, not for a production
 * RDBMS at national scale.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUPS_DIR = path.join(__dirname, '..', 'backups');

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function listBackups() {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  return fs.readdirSync(BACKUPS_DIR).filter((f) => fs.statSync(path.join(BACKUPS_DIR, f)).isDirectory()).sort().reverse();
}

function createBackup() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error('No data directory found — nothing to back up. Start the server at least once first.');
    process.exit(1);
  }
  const backupName = `backup-${timestamp()}`;
  const backupPath = path.join(BACKUPS_DIR, backupName);
  fs.mkdirSync(backupPath, { recursive: true });

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') || f.startsWith('.encryption-key'));
  let totalBytes = 0;
  for (const file of files) {
    const src = path.join(DATA_DIR, file);
    const dest = path.join(backupPath, file);
    fs.copyFileSync(src, dest);
    totalBytes += fs.statSync(dest).size;
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    fileCount: files.length,
    totalBytes,
    files,
  };
  fs.writeFileSync(path.join(backupPath, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`Backup created: backend/backups/${backupName}`);
  console.log(`  ${files.length} files, ${(totalBytes / 1024).toFixed(1)} KB total`);
  return backupPath;
}

if (require.main === module) {
  if (process.argv.includes('--list')) {
    const backups = listBackups();
    if (!backups.length) console.log('No backups found. Run `node utils/backup.js` to create one.');
    else backups.forEach((b) => console.log(' ', b));
  } else {
    createBackup();
  }
}

module.exports = { createBackup, listBackups, BACKUPS_DIR, DATA_DIR };
