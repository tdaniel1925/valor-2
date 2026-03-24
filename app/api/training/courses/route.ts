import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';

    const where: any = {
      tenantId: tenantContext.tenantId,
      status: 'PUBLISHED',
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        level: true,
        category: true,
        duration: true,
        instructor: true,
        status: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    // Map enrollment count (rating removed as field doesn't exist in schema)
    const coursesWithCount = courses.map((course) => ({
      ...course,
      enrollmentCount: course._count.enrollments,
      instructorName: course.instructor,
      rating: 0, // TODO: Add rating field to Enrollment model
    }));

    // Remove _count and instructor from response
    const response = coursesWithCount.map(({ _count, instructor, ...course }) => course);

    return NextResponse.json(response);
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Courses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
