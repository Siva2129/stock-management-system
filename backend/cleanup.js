/**
 * cleanup.js — Removes all leftover Python backend files.
 * Run once with: node cleanup.js
 * Then delete this file itself.
 */

const fs   = require('fs');
const path = require('path');

const baseDir = __dirname;

// Files to delete
const filesToDelete = [
  'main.py',
  'requirements.txt',
  'runtime.txt',
  'stock_management.db',
];

// Directories to delete recursively
const dirsToDelete = [
  'core',
  'models',
  'services',
  'schemas',
  '__pycache__',
];

function deletePath(p) {
  if (!fs.existsSync(p)) return;
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    fs.readdirSync(p).forEach(child => deletePath(path.join(p, child)));
    fs.rmdirSync(p);
    console.log(`🗑️  Deleted dir : ${p}`);
  } else {
    fs.unlinkSync(p);
    console.log(`🗑️  Deleted file: ${p}`);
  }
}

// Also clean up .py files inside routes/ (keep .js files)
function cleanRoutesDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.py') || f === '__init__.py') {
      const full = path.join(dir, f);
      fs.unlinkSync(full);
      console.log(`🗑️  Deleted file: ${full}`);
    }
    if (f === '__pycache__') {
      deletePath(path.join(dir, f));
    }
  });
}

console.log('🧹 Cleaning up Python backend files...\n');

filesToDelete.forEach(f => deletePath(path.join(baseDir, f)));
dirsToDelete.forEach(d => deletePath(path.join(baseDir, d)));
cleanRoutesDir(path.join(baseDir, 'routes'));
cleanRoutesDir(path.join(baseDir, 'middleware'));
cleanRoutesDir(path.join(baseDir, 'utils'));

// Delete this cleanup script itself
console.log('\n✅ Cleanup complete!');
console.log('   You can now delete this cleanup.js file.');
