/**
 * VAPI Phone Numbers API Route
 * GET - List phone numbers
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';
import { requireAuth } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const phoneNumbers = await vapiClient.getPhoneNumbers();
    return NextResponse.json({ phoneNumbers });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to list VAPI phone numbers:', error);
    return NextResponse.json(
      { error: 'Failed to list phone numbers', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}







