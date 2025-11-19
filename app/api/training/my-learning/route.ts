import { NextResponse } from 'next/server';

// Mock enrollment data
const mockEnrollments = [
  {
    id: 'enroll-1',
    courseId: 'course-1',
    courseTitle: 'Life Insurance Fundamentals',
    courseCategory: 'Product Training',
    progress: 65,
    status: 'IN_PROGRESS',
    enrolledAt: '2024-10-15T10:00:00Z',
    totalLessons: 12,
    completedLessons: 8,
    lastAccessedAt: '2024-11-15T14:30:00Z',
  },
  {
    id: 'enroll-2',
    courseId: 'course-3',
    courseTitle: 'Compliance and Ethics',
    courseCategory: 'Compliance',
    progress: 100,
    status: 'COMPLETED',
    enrolledAt: '2024-09-01T09:00:00Z',
    completedAt: '2024-10-01T16:45:00Z',
    score: 92,
    totalLessons: 8,
    completedLessons: 8,
    lastAccessedAt: '2024-10-01T16:45:00Z',
  },
  {
    id: 'enroll-3',
    courseId: 'course-4',
    courseTitle: 'Consultative Selling Techniques',
    courseCategory: 'Sales Skills',
    progress: 35,
    status: 'IN_PROGRESS',
    enrolledAt: '2024-11-01T11:00:00Z',
    totalLessons: 15,
    completedLessons: 5,
    lastAccessedAt: '2024-11-10T09:15:00Z',
  },
];

export async function GET() {
  try {
    return NextResponse.json(mockEnrollments);
  } catch (error) {
    console.error('My Learning API error:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}
