import { NextRequest, NextResponse } from 'next/server';
import { iGoClient } from '@/lib/integrations/igo/client';
import type { IGoApplicationRequest } from '@/lib/integrations/igo/types';

export async function POST(request: NextRequest) {
  try {
    const body: IGoApplicationRequest = await request.json();

    // Validate required fields
    if (!body.applicant || !body.beneficiaries || !body.payment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!body.hipaaAuthorization || !body.electronicConsent) {
      return NextResponse.json(
        { success: false, error: 'Required authorizations not provided' },
        { status: 400 }
      );
    }

    // Submit application to iGO
    const result = await iGoClient.createApplication(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[LIFE_APPLICATION_API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit application',
      },
      { status: 500 }
    );
  }
}
