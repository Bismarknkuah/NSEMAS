/**
 * NSEMAS Restore — companion to utils/backup.js
 * -----------------------------------------------
 * Usage:
 *   node utils/restore.js --list                 # show available backups
 *   node utils/restore.js backup-2026-07-31T...   # restore a specific one
 *   node utils/restore.js --latest                # restore the most recent backup
 *
 * Restoring first safety-copies whatever is currently in backend/data/ into
 * backend/backups/pre-restore-<timestamp>/ so a bad restore is itself
 * recoverable, then overwrites backend/data/ with the chosen snapshot.
 */
const fs = require('fs');
const path = require('path');
const { listBackups, BACKUPS_DIR, DATA_DIR } = require('./backup');

function restore(backupName) {
  const backupPath = path.join(BACKUPS_DIR, backupName);
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup not found: ${backupName}`);
    console.error('Available backups:');
    listBackups().forEach((b) => console.error('  ' + b));
    process.exit(1);
  }

  // Safety net: snapshot current state before overwriting it
  if (fs.existsSync(DATA_DIR)) {
    const safetyName = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const safetyPath = path.join(BACKUPS_DIR, safetyName);
    fs.mkdirSync(safetyPath, { recursive: true });
    fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).forEach((f) => {
      fs.copyFileSync(path.join(DATA_DIR, f), path.join(safetyPath, f));
    });
    console.log(`Safety snapshot of current data saved to backend/backups/${safetyName}`);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const files = fs.readdirSync(backupPath).filter((f) => f !== 'manifest.json');
  files.forEach((f) => fs.copyFileSync(path.join(backupPath, f), path.join(DATA_DIR, f)));

  console.log(`Restored ${files.length} files from backend/backups/${backupName} into backend/data/`);
  console.log('Restart the server for the restored data to take effect.');
}

if (require.main === module) {
  const arg = process.argv[2];
  if (!arg || arg === '--list') {
    const backups = listBackups();
    if (!backups.length) console.log('No backups found. Run `node utils/backup.js` to create one.');
    else { console.log('Available backups:'); backups.forEach((b) => console.log('  ' + b)); }
  } else if (arg === '--latest') {
    const backups = listBackups();
    if (!backups.length) { console.error('No backups found.'); process.exit(1); }
    restore(backups[0]);
  } else {
    restore(arg);
  }
}

module.exports = { restore };
