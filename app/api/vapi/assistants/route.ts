/**
 * VAPI Assistants API Routes
 * GET - List assistants
 * POST - Create assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';
import { CreateAssistantRequest } from '@/lib/integrations/vapi/types';
import { requireAuth } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const assistants = await vapiClient.listAssistants();
    return NextResponse.json({ assistants });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to list VAPI assistants:', error);
    return NextResponse.json(
      { error: 'Failed to list assistants', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const body: CreateAssistantRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.model || !body.voice) {
      return NextResponse.json(
        { error: 'name, model, and voice are required' },
        { status: 400 }
      );
    }

    const assistant = await vapiClient.createAssistant(body);
    return NextResponse.json(assistant, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create VAPI assistant:', error);
    return NextResponse.json(
      { error: 'Failed to create assistant', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}







