/**
 * Script to rename catalog PDF files to shorter, cleaner names
 *
 * This script removes the "articlesUnderwriting Questionnaires" prefix
 * from all catalog PDF filenames to make them more manageable.
 *
 * Usage: node scripts/rename-catalog-pdfs.js
 */

const fs = require('fs');
const path = require('path');

const catalogDir = path.join(process.cwd(), 'public', 'catalog');

console.log('Starting catalog PDF rename process...');
console.log(`Catalog directory: ${catalogDir}\n`);

// Get all PDF files in the catalog directory
const files = fs.readdirSync(catalogDir).filter(file => file.endsWith('.pdf'));

console.log(`Found ${files.length} PDF files to process\n`);

let renamed = 0;
let skipped = 0;
let errors = 0;

files.forEach((filename, index) => {
  try {
    // Remove the "articlesUnderwriting Questionnaires" prefix
    // This handles both with and without space after "articlesUnderwriting"
    let newName = filename
      .replace(/^articlesUnderwriting\s*Questionnaires/, '')
      .trim();

    // If the name didn't change, skip it
    if (newName === filename) {
      console.log(`[${index + 1}/${files.length}] SKIP: ${filename} (already clean)`);
      skipped++;
      return;
    }

    const oldPath = path.join(catalogDir, filename);
    const newPath = path.join(catalogDir, newName);

    // Check if target file already exists
    if (fs.existsSync(newPath)) {
      console.log(`[${index + 1}/${files.length}] ERROR: ${newName} already exists!`);
      errors++;
      return;
    }

    // Rename the file
    fs.renameSync(oldPath, newPath);
    console.log(`[${index + 1}/${files.length}] ✓ Renamed:`);
    console.log(`    FROM: ${filename}`);
    console.log(`    TO:   ${newName}`);
    renamed++;

  } catch (error) {
    console.error(`[${index + 1}/${files.length}] ERROR processing ${filename}:`, error.message);
    errors++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('SUMMARY:');
console.log(`  Total files:  ${files.length}`);
console.log(`  Renamed:      ${renamed}`);
console.log(`  Skipped:      ${skipped}`);
console.log(`  Errors:       ${errors}`);
console.log('='.repeat(60));

if (renamed > 0) {
  console.log('\n✓ Catalog PDFs have been renamed successfully!');
  console.log('  You may need to restart your dev server for changes to take effect.');
} else {
  console.log('\nNo files were renamed.');
}
