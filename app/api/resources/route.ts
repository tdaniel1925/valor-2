import { NextRequest, NextResponse } from 'next/server';

// Mock resource data
const mockResources = [
  {
    id: 'res-1',
    title: 'Term Life Sales Brochure',
    description: 'Professional brochure for term life insurance products with carrier comparisons.',
    type: 'Marketing Material',
    category: 'Life Insurance',
    fileName: 'term-life-brochure-2024.pdf',
    fileSize: 2458624, // ~2.4 MB
    fileUrl: '/resources/term-life-brochure-2024.pdf',
    version: 2,
    views: 342,
    downloads: 156,
    uploadedBy: 'Sarah Johnson',
    createdAt: '2024-10-15T10:00:00Z',
    isFavorite: true,
  },
  {
    id: 'res-2',
    title: 'Fixed Indexed Annuity Guide',
    description: 'Comprehensive product guide covering FIA features, benefits, and illustrations.',
    type: 'Product Info',
    category: 'Annuities',
    fileName: 'fia-product-guide.pdf',
    fileSize: 3145728, // ~3 MB
    fileUrl: '/resources/fia-product-guide.pdf',
    version: 1,
    views: 218,
    downloads: 89,
    uploadedBy: 'Michael Chen',
    createdAt: '2024-11-01T09:30:00Z',
    isFavorite: false,
  },
  {
    id: 'res-3',
    title: 'New Application Form - Life',
    description: 'Standard life insurance application form for all carriers.',
    type: 'Form',
    category: 'Life Insurance',
    fileName: 'life-application-form.pdf',
    fileSize: 524288, // ~512 KB
    fileUrl: '/resources/life-application-form.pdf',
    version: 3,
    views: 892,
    downloads: 645,
    uploadedBy: 'Emily Rodriguez',
    createdAt: '2024-09-10T14:00:00Z',
    isFavorite: true,
  },
  {
    id: 'res-4',
    title: 'Needs Analysis Worksheet',
    description: 'Client needs analysis tool for determining appropriate coverage amounts.',
    type: 'Form',
    category: 'Sales Tools',
    fileName: 'needs-analysis-worksheet.xlsx',
    fileSize: 98304, // ~96 KB
    fileUrl: '/resources/needs-analysis-worksheet.xlsx',
    version: 1,
    views: 456,
    downloads: 312,
    uploadedBy: 'David Thompson',
    createdAt: '2024-10-20T11:15:00Z',
    isFavorite: false,
  },
  {
    id: 'res-5',
    title: 'Compliance Training Slides',
    description: 'Annual compliance training presentation covering regulations and best practices.',
    type: 'Presentation',
    category: 'Compliance',
    fileName: 'compliance-training-2024.pptx',
    fileSize: 7340032, // ~7 MB
    fileUrl: '/resources/compliance-training-2024.pptx',
    version: 1,
    views: 567,
    downloads: 234,
    uploadedBy: 'Jennifer Martinez',
    createdAt: '2024-08-15T08:00:00Z',
    isFavorite: false,
  },
  {
    id: 'res-6',
    title: 'Product Comparison Matrix',
    description: 'Side-by-side comparison of all life insurance products across carriers.',
    type: 'Product Info',
    category: 'Life Insurance',
    fileName: 'product-comparison-matrix.xlsx',
    fileSize: 163840, // ~160 KB
    fileUrl: '/resources/product-comparison-matrix.xlsx',
    version: 4,
    views: 723,
    downloads: 498,
    uploadedBy: 'Robert Williams',
    createdAt: '2024-11-05T10:30:00Z',
    isFavorite: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';

    let filteredResources = [...mockResources];

    if (search) {
      filteredResources = filteredResources.filter(
        resource =>
          resource.title.toLowerCase().includes(search) ||
          resource.description.toLowerCase().includes(search) ||
          resource.fileName.toLowerCase().includes(search)
      );
    }

    if (type) {
      filteredResources = filteredResources.filter(resource => resource.type === type);
    }

    if (category) {
      filteredResources = filteredResources.filter(resource => resource.category === category);
    }

    return NextResponse.json(filteredResources);
  } catch (error) {
    console.error('Resources API error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}
