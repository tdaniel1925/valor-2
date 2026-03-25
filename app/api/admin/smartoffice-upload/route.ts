import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { parseSmartOfficeExcel } from '@/lib/smartoffice/excel-parser';
import { importSmartOfficeData } from '@/lib/smartoffice/import-service';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is ADMINISTRATOR
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!userData || userData.role !== 'ADMINISTRATOR') {
      return NextResponse.json(
        { error: 'Access denied. Administrator role required.' },
        { status: 403 }
      );
    }

    // Get tenant ID (assuming valor-default-tenant for now)
    const tenantId = 'valor-default-tenant';

    // Parse the form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    let policiesImported = 0;
    let agentsImported = 0;
    const filesProcessed: string[] = [];
    const errors: string[] = [];

    // Process each file
    for (const file of files) {
      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse the Excel file
        const parseResult = parseSmartOfficeExcel(buffer, file.name);

        if (!parseResult.success) {
          errors.push(`${file.name}: ${parseResult.errors.join(', ')}`);
          continue;
        }

        // Import the data
        const importResult = await importSmartOfficeData(
          tenantId,
          parseResult,
          'admin-upload',
          user.id
        );

        if (importResult.success) {
          filesProcessed.push(file.name);

          if (parseResult.type === 'policies') {
            policiesImported += importResult.recordsCreated;
          } else if (parseResult.type === 'agents') {
            agentsImported += importResult.recordsCreated;
          }
        } else {
          errors.push(`${file.name}: ${importResult.errors.join(', ')}`);
        }

      } catch (error: any) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }

    // Return results
    if (errors.length > 0 && filesProcessed.length === 0) {
      return NextResponse.json(
        { error: 'All files failed to import', details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filesProcessed,
      policiesImported,
      agentsImported,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
