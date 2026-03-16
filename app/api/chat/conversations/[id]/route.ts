import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      return new Response('User not found', { status: 404 });
    }

    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: params.id,
        userId: dbUser.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true
          }
        }
      }
    });

    if (!conversation) {
      return new Response('Not found', { status: 404 });
    }

    return NextResponse.json({ conversation });

  } catch (error: any) {
    console.error('Conversation API error:', error);
    return new Response(error.message, { status: 500 });
  }
}
