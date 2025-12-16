/**
 * VAPI Phone Numbers API Route
 * GET - List phone numbers
 */

import { NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';

export async function GET() {
  try {
    const phoneNumbers = await vapiClient.getPhoneNumbers();
    return NextResponse.json({ phoneNumbers });
  } catch (error) {
    console.error('Failed to list VAPI phone numbers:', error);
    return NextResponse.json(
      { error: 'Failed to list phone numbers', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}




