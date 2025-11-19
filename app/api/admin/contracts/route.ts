import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('[ADMIN_CONTRACTS_API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contracts',
      },
      { status: 500 }
    );
  }
}
