import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const catalogDir = join(process.cwd(), 'public', 'catalog');
    const files = await readdir(catalogDir);

    // Filter for PDF files only
    const pdfFiles = files
      .filter(file => file.endsWith('.pdf'))
      .map(fileName => {
        // Generate title from filename
        const title = fileName
          .replace('.pdf', '')
          .replace(/_s/g, "'s");

        // Categorize based on keywords
        let category = 'Medical Conditions';
        const lower = fileName.toLowerCase();

        if (lower.includes('cancer') || lower.includes('melanoma') || lower.includes('lymphoma') || lower.includes('leukemia')) {
          category = 'Cancer';
        } else if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('coronary') ||
            lower.includes('myocardial') || lower.includes('atrial') || lower.includes('valve')) {
          category = 'Cardiac';
        } else if (lower.includes('anxiety') || lower.includes('depression') || lower.includes('bipolar') ||
            lower.includes('ptsd') || lower.includes('schizophrenia') || lower.includes('adhd') ||
            lower.includes('ocd') || lower.includes('mental') || lower.includes('adjustment disorder') ||
            lower.includes('bereavement') || lower.includes('personality')) {
          category = 'Mental Health';
        } else if (lower.includes('kidney') || lower.includes('renal') || lower.includes('albuminuria') || lower.includes('proteinuria')) {
          category = 'Renal';
        } else if (lower.includes('liver') || lower.includes('hepatitis') || lower.includes('cirrhosis')) {
          category = 'Hepatic';
        } else if (lower.includes('lung') || lower.includes('copd') || lower.includes('asthma') ||
            lower.includes('apnea') || lower.includes('pulmonary') || lower.includes('bronchiectasis')) {
          category = 'Respiratory';
        } else if (lower.includes('stroke') || lower.includes('epilepsy') || lower.includes('parkinson') ||
            lower.includes('sclerosis') || lower.includes('cerebral') || lower.includes('seizure') ||
            lower.includes('dementia') || lower.includes('alzheimer') || lower.includes('migraine') ||
            lower.includes('syncope') || lower.includes('vertigo') || lower.includes('narcolepsy')) {
          category = 'Neurological';
        } else if (lower.includes('diabetes') || lower.includes('thyroid') || lower.includes('pituitary') ||
            lower.includes('cushing') || lower.includes('pheochromocytoma')) {
          category = 'Endocrine';
        } else if (lower.includes('arthritis') || lower.includes('lupus') || lower.includes('sarcoidosis') ||
            lower.includes('scleroderma')) {
          category = 'Autoimmune';
        } else if (lower.includes('alcohol') || lower.includes('drug') || lower.includes('tobacco') ||
            lower.includes('driving') || lower.includes('avocation') || lower.includes('aviation') ||
            lower.includes('build') || lower.includes('obesity')) {
          category = 'Lifestyle';
        } else if (lower.includes('occupation') || lower.includes('aviation')) {
          category = 'Occupational';
        } else if (lower.includes('angioplasty') || lower.includes('bypass') || lower.includes('stent') ||
            lower.includes('transplant') || lower.includes('pacemaker')) {
          category = 'Medical Procedures';
        } else if (lower.includes('nailba') || lower.includes('general use') || lower.includes('all ')) {
          category = 'General';
        }

        return {
          title,
          fileName,
          category
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    return NextResponse.json({ documents: pdfFiles });
  } catch (error) {
    console.error('Error listing catalog files:', error);
    return NextResponse.json({ error: 'Failed to list catalog files' }, { status: 500 });
  }
}
