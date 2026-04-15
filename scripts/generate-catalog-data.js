/**
 * Script to generate catalog data from actual PDF files
 *
 * This script scans the public/catalog folder and generates
 * the catalogDocs array with correct filenames
 *
 * Usage: node scripts/generate-catalog-data.js
 */

const fs = require('fs');
const path = require('path');

const catalogDir = path.join(process.cwd(), 'public', 'catalog');

console.log('Scanning catalog directory for PDFs...\n');

// Get all PDF files
const files = fs.readdirSync(catalogDir)
  .filter(file => file.endsWith('.pdf'))
  .sort();

console.log(`Found ${files.length} PDF files\n`);

// Category mapping based on keywords in filename
function categorizeFile(filename) {
  const lower = filename.toLowerCase();

  if (lower.includes('cancer') || lower.includes('melanoma') || lower.includes('lymphoma') || lower.includes('leukemia')) {
    return 'Cancer';
  }
  if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('coronary') ||
      lower.includes('myocardial') || lower.includes('atrial') || lower.includes('valve')) {
    return 'Cardiac';
  }
  if (lower.includes('anxiety') || lower.includes('depression') || lower.includes('bipolar') ||
      lower.includes('ptsd') || lower.includes('schizophrenia') || lower.includes('adhd') ||
      lower.includes('ocd') || lower.includes('mental') || lower.includes('adjustment disorder') ||
      lower.includes('bereavement') || lower.includes('personality')) {
    return 'Mental Health';
  }
  if (lower.includes('kidney') || lower.includes('renal') || lower.includes('albuminuria') || lower.includes('proteinuria')) {
    return 'Renal';
  }
  if (lower.includes('liver') || lower.includes('hepatitis') || lower.includes('cirrhosis')) {
    return 'Hepatic';
  }
  if (lower.includes('lung') || lower.includes('copd') || lower.includes('asthma') ||
      lower.includes('apnea') || lower.includes('pulmonary') || lower.includes('bronchiectasis')) {
    return 'Respiratory';
  }
  if (lower.includes('stroke') || lower.includes('epilepsy') || lower.includes('parkinson') ||
      lower.includes('sclerosis') || lower.includes('cerebral') || lower.includes('seizure') ||
      lower.includes('dementia') || lower.includes('alzheimer') || lower.includes('migraine') ||
      lower.includes('syncope') || lower.includes('vertigo') || lower.includes('narcolepsy')) {
    return 'Neurological';
  }
  if (lower.includes('diabetes') || lower.includes('thyroid') || lower.includes('pituitary') ||
      lower.includes('cushing') || lower.includes('pheochromocytoma')) {
    return 'Endocrine';
  }
  if (lower.includes('arthritis') || lower.includes('lupus') || lower.includes('sarcoidosis') ||
      lower.includes('scleroderma')) {
    return 'Autoimmune';
  }
  if (lower.includes('alcohol') || lower.includes('drug') || lower.includes('tobacco') ||
      lower.includes('driving') || lower.includes('avocation') || lower.includes('aviation') ||
      lower.includes('build') || lower.includes('obesity')) {
    return 'Lifestyle';
  }
  if (lower.includes('occupation') || lower.includes('aviation')) {
    return 'Occupational';
  }
  if (lower.includes('angioplasty') || lower.includes('bypass') || lower.includes('stent') ||
      lower.includes('transplant') || lower.includes('pacemaker')) {
    return 'Medical Procedures';
  }
  if (lower.includes('nailba') || lower.includes('general use') || lower.includes('all ')) {
    return 'General';
  }

  return 'Medical Conditions';
}

// Generate title from filename
function generateTitle(filename) {
  return filename
    .replace('.pdf', '')
    .replace(/_s/g, "'s")
    .trim();
}

// Generate the TypeScript array
const catalogData = files.map(filename => {
  const title = generateTitle(filename);
  const category = categorizeFile(filename);

  return {
    title,
    fileName: filename,
    category
  };
});

// Output as TypeScript code
console.log('========================================');
console.log('Copy this into app/catalog/page.tsx:');
console.log('========================================\n');

console.log('const catalogDocs: CatalogDocument[] = [');
catalogData.forEach((doc, index) => {
  const comma = index < catalogData.length - 1 ? ',' : '';
  console.log(`  { title: "${doc.title}", fileName: "${doc.fileName}", category: "${doc.category}" }${comma}`);
});
console.log('];');

console.log('\n========================================');
console.log(`Total: ${catalogData.length} documents`);
console.log('========================================');
