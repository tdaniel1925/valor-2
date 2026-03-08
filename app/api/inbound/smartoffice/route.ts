import { NextRequest, NextResponse } from 'next/server';
import { parseSmartOfficeExcel } from '@/lib/smartoffice/excel-parser';
import { importSmartOfficeData } from '@/lib/smartoffice/import-service';
import { prisma } from '@/lib/db/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Extract recipient email (format: a7f3k2x9@reports.valorfs.app)
    const to = payload.to;
    if (!to) {
      return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
    }

    // Extract address before @
    const address = to.split('@')[0];

    // Find tenant by inbound email address
    const tenant = await prisma.tenant.findUnique({
      where: { inboundEmailAddress: address },
      include: { users: true }
    });

    if (!tenant) {
      console.error(`No tenant found for address: ${address}`);
      return NextResponse.json({ error: 'Unknown recipient' }, { status: 404 });
    }

    if (!tenant.inboundEmailEnabled) {
      console.error(`Inbound email disabled for tenant: ${tenant.slug}`);
      return NextResponse.json({ error: 'Inbound email disabled' }, { status: 403 });
    }

    // Extract attachments
    const attachments = payload.attachments || [];
    const excelAttachments = attachments.filter((att: any) => {
      const filename = att.filename?.toLowerCase() || '';
      return filename.endsWith('.xlsx') || filename.endsWith('.xls') || filename.endsWith('.csv');
    });

    if (excelAttachments.length === 0) {
      console.log(`No Excel attachments found in email to ${address}`);
      return NextResponse.json({ message: 'No Excel files to process' }, { status: 200 });
    }

    console.log(`Processing ${excelAttachments.length} Excel file(s) for tenant: ${tenant.slug}`);

    // Process each attachment
    const results = [];
    const errors = [];

    for (const attachment of excelAttachments) {
      try {
        const filename = attachment.filename;

        // Decode base64 content to buffer
        const buffer = Buffer.from(attachment.content, 'base64');

        // Parse Excel
        const parseResult = parseSmartOfficeExcel(buffer, filename);

        if (!parseResult.success) {
          throw new Error(`Parse failed: ${parseResult.errors.join(', ')}`);
        }

        // Import to database
        const importResult = await importSmartOfficeData(
          tenant.id,
          parseResult,
          'EMAIL' // triggeredBy
        );

        results.push({
          filename,
          success: importResult.success,
          created: importResult.recordsCreated,
          updated: importResult.recordsUpdated,
          failed: importResult.recordsFailed
        });

        if (!importResult.success) {
          errors.push({
            filename,
            errors: importResult.errors
          });
        }

      } catch (error: any) {
        console.error(`Failed to process ${attachment.filename}:`, error);
        errors.push({
          filename: attachment.filename,
          errors: [error.message]
        });
      }
    }

    // Send failure notification if any errors
    if (errors.length > 0) {
      await sendFailureNotification(tenant, errors);
    }

    console.log(`✅ Processed ${results.length} files for ${tenant.slug}`);

    return NextResponse.json({
      success: true,
      filesProcessed: results.length,
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function sendFailureNotification(
  tenant: any,
  errors: Array<{ filename: string; errors: string[] }>
) {
  try {
    const emailList = tenant.users.map((u: any) => u.email);

    if (emailList.length === 0) {
      console.warn(`No users to notify for tenant: ${tenant.slug}`);
      return;
    }

    const errorDetails = errors.map(e => `
      <li>
        <strong>${e.filename}</strong><br>
        ${e.errors.map(err => `• ${err}`).join('<br>')}
      </li>
    `).join('');

    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: emailList,
      subject: 'SmartOffice Import Failed',
      html: `
        <h2>SmartOffice Import Failed</h2>
        <p>We encountered errors while importing your SmartOffice reports:</p>
        <ul>${errorDetails}</ul>
        <p>You can manually upload the files at: <a href="https://${tenant.slug}.valorfs.app/smartoffice/import">https://${tenant.slug}.valorfs.app/smartoffice/import</a></p>
      `
    });

    console.log(`📧 Sent failure notification to ${emailList.length} users`);
  } catch (error: any) {
    console.error('Failed to send notification:', error);
  }
}
