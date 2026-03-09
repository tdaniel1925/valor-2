import { NextRequest, NextResponse } from 'next/server';
import { parseSmartOfficeExcel } from '@/lib/smartoffice/excel-parser';
import { importSmartOfficeData } from '@/lib/smartoffice/import-service';
import { prisma } from '@/lib/db/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Extract recipient email (format: a7f3k2x9@shwunde745.resend.app)
    // Resend sends: { type: "email.received", data: { to: ["email@..."], ... } }
    const to = payload.data?.to?.[0];
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

    // Extract attachments metadata from Resend payload
    const attachmentsMeta = payload.data?.attachments || [];
    const excelAttachments = attachmentsMeta.filter((att: any) => {
      const filename = att.filename?.toLowerCase() || '';
      return filename.endsWith('.xlsx') || filename.endsWith('.xls') || filename.endsWith('.csv');
    });

    if (excelAttachments.length === 0) {
      console.log(`No Excel attachments found in email to ${address}`);
      return NextResponse.json({ message: 'No Excel files to process' }, { status: 200 });
    }

    console.log(`Processing ${excelAttachments.length} Excel file(s) for tenant: ${tenant.slug}`);

    // Get email ID for fetching attachments
    const emailId = payload.data?.email_id;
    if (!emailId) {
      return NextResponse.json({ error: 'Missing email_id' }, { status: 400 });
    }

    // Process each attachment
    const results = [];
    const errors = [];

    for (const attachmentMeta of excelAttachments) {
      try {
        const filename = attachmentMeta.filename;
        const attachmentId = attachmentMeta.id;

        // Fetch attachment content from Resend API
        console.log(`Fetching attachment ${attachmentId} for email ${emailId}`);
        const attachmentResponse = await fetch(
          `https://api.resend.com/emails/${emailId}/attachments/${attachmentId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`
            }
          }
        );

        console.log(`Attachment API response status: ${attachmentResponse.status}`);

        if (!attachmentResponse.ok) {
          const errorText = await attachmentResponse.text();
          console.error(`Attachment API error: ${errorText}`);
          throw new Error(`Failed to fetch attachment: ${attachmentResponse.statusText} - ${errorText}`);
        }

        const attachmentData = await attachmentResponse.json();
        console.log(`Attachment data:`, JSON.stringify(attachmentData));

        const downloadUrl = attachmentData.download_url;

        if (!downloadUrl) {
          console.error('No download_url in response:', attachmentData);
          throw new Error('No download URL in attachment response');
        }

        console.log(`Downloading from: ${downloadUrl}`);

        // Download the actual file
        const fileResponse = await fetch(downloadUrl);
        console.log(`Download response status: ${fileResponse.status}, content-type: ${fileResponse.headers.get('content-type')}`);

        if (!fileResponse.ok) {
          throw new Error(`Failed to download file: ${fileResponse.statusText}`);
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        console.log(`Downloaded ${arrayBuffer.byteLength} bytes`);

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('Downloaded file is empty');
        }

        const buffer = Buffer.from(arrayBuffer);

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
        console.error(`Failed to process ${attachmentMeta.filename}:`, error);
        errors.push({
          filename: attachmentMeta.filename,
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
