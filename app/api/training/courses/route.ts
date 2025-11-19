import { NextRequest, NextResponse } from 'next/server';

// Mock course data
const mockCourses = [
  {
    id: 'course-1',
    title: 'Life Insurance Fundamentals',
    description: 'Master the basics of life insurance products, underwriting, and sales strategies.',
    thumbnail: '',
    level: 'BEGINNER',
    category: 'Product Training',
    duration: 120,
    instructorName: 'Sarah Johnson',
    enrollmentCount: 245,
    rating: 4.8,
    status: 'PUBLISHED',
  },
  {
    id: 'course-2',
    title: 'Advanced Annuity Sales',
    description: 'Learn advanced techniques for selling fixed and indexed annuities to clients.',
    thumbnail: '',
    level: 'ADVANCED',
    category: 'Product Training',
    duration: 180,
    instructorName: 'Michael Chen',
    enrollmentCount: 132,
    rating: 4.9,
    status: 'PUBLISHED',
  },
  {
    id: 'course-3',
    title: 'Compliance and Ethics',
    description: 'Stay compliant with industry regulations and ethical selling practices.',
    thumbnail: '',
    level: 'INTERMEDIATE',
    category: 'Compliance',
    duration: 90,
    instructorName: 'Emily Rodriguez',
    enrollmentCount: 412,
    rating: 4.7,
    status: 'PUBLISHED',
  },
  {
    id: 'course-4',
    title: 'Consultative Selling Techniques',
    description: 'Master the art of needs-based selling and building long-term client relationships.',
    thumbnail: '',
    level: 'INTERMEDIATE',
    category: 'Sales Skills',
    duration: 150,
    instructorName: 'David Thompson',
    enrollmentCount: 289,
    rating: 4.8,
    status: 'PUBLISHED',
  },
  {
    id: 'course-5',
    title: 'CRM and Technology Tools',
    description: 'Learn to leverage technology and CRM systems to boost productivity.',
    thumbnail: '',
    level: 'BEGINNER',
    category: 'Technology',
    duration: 60,
    instructorName: 'Jennifer Martinez',
    enrollmentCount: 198,
    rating: 4.6,
    status: 'PUBLISHED',
  },
  {
    id: 'course-6',
    title: 'Leadership for Managers',
    description: 'Develop essential leadership skills for managing and motivating teams.',
    thumbnail: '',
    level: 'ADVANCED',
    category: 'Leadership',
    duration: 200,
    instructorName: 'Robert Williams',
    enrollmentCount: 87,
    rating: 4.9,
    status: 'PUBLISHED',
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';

    let filteredCourses = mockCourses.filter(course => course.status === 'PUBLISHED');

    if (search) {
      filteredCourses = filteredCourses.filter(
        course =>
          course.title.toLowerCase().includes(search) ||
          course.description.toLowerCase().includes(search)
      );
    }

    if (category) {
      filteredCourses = filteredCourses.filter(course => course.category === category);
    }

    if (level) {
      filteredCourses = filteredCourses.filter(course => course.level === level);
    }

    return NextResponse.json(filteredCourses);
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
