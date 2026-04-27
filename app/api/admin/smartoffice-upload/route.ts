import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { prisma } from '@/lib/db/prisma';
import { parseSmartOfficeExcel, parseSmartOfficeCSV } from '@/lib/smartoffice/excel-parser';
import { importSmartOfficeData } from '@/lib/smartoffice/import-service';

/**
 * Validate file magic bytes against the declared extension.
 * Prevents attackers from renaming arbitrary files as xlsx/xls/csv.
 */
function validateMagicBytes(buffer: Buffer, filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'xlsx') {
    // xlsx is a ZIP archive: PK\x03\x04
    return buffer.length >= 4 &&
      buffer[0] === 0x50 && buffer[1] === 0x4B &&
      buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  if (ext === 'xls') {
    // xls is OLE2/CFB: D0 CF 11 E0
    return buffer.length >= 4 &&
      buffer[0] === 0xD0 && buffer[1] === 0xCF &&
      buffer[2] === 0x11 && buffer[3] === 0xE0;
  }

  if (ext === 'csv') {
    // No fixed magic bytes; reject binary content by checking
    // that the first 512 bytes contain no null bytes.
    const sample = buffer.slice(0, Math.min(512, buffer.length));
    return !sample.includes(0x00);
  }

  return false;
}

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

    // Look up the user's tenant from the database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tenantId: true },
    });

    if (!dbUser?.tenantId) {
      return NextResponse.json(
        { error: 'Could not determine tenant for this user.' },
        { status: 400 }
      );
    }

    const tenantId = dbUser.tenantId;

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

        // Validate magic bytes before parsing
        if (!validateMagicBytes(buffer, file.name)) {
          errors.push(`${file.name}: file content does not match its extension`);
          continue;
        }

        // Determine file type and parse accordingly
        const isCSV = file.name.toLowerCase().endsWith('.csv');
        const parseResult = isCSV
          ? parseSmartOfficeCSV(buffer, file.name)
          : parseSmartOfficeExcel(buffer, file.name);

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
