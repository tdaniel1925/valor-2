import { NextRequest, NextResponse } from "next/server";
import { parseSmartOfficeExcel } from "@/lib/smartoffice/excel-parser";
import { importSmartOfficeData } from "@/lib/smartoffice/import-service";
import {
  downloadFileFromStorage,
  extractTenantIdFromPath,
  validateTenantExists,
  parseStorageObjectMetadata,
  isExcelFile,
} from "@/lib/storage/smartoffice-storage";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/smartoffice/webhook
 *
 * Supabase Storage webhook handler for automatic SmartOffice file processing
 *
 * Triggered when a new file is uploaded to the smartoffice-reports bucket
 *
 * Expected webhook payload structure:
 * {
 *   type: "INSERT",
 *   table: "objects",
 *   schema: "storage",
 *   record: {
 *     bucket_id: "smartoffice-reports",
 *     name: "{tenantId}/filename.xlsx",
 *     metadata: { size: 12345, mimetype: "application/vnd.openxmlformats..." },
 *     created_at: "2024-01-15T10:30:00Z"
 *   },
 *   old_record: null
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ============================================
    // 1. READ AND VERIFY WEBHOOK PAYLOAD
    // ============================================

    // Read body once as text for signature verification
    const rawBody = await request.text();
    let payload;

    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error("[SmartOffice Webhook] Invalid JSON payload");
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Verify webhook is from Supabase using HMAC signature
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = request.headers.get("x-supabase-signature");

      if (!signature) {
        console.warn("[SmartOffice Webhook] Missing signature header");
        return NextResponse.json(
          { error: "Missing webhook signature" },
          { status: 401 }
        );
      }

      // Verify HMAC-SHA256 signature
      try {
        const crypto = require('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');

        const isValid = crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        );

        if (!isValid) {
          console.error("[SmartOffice Webhook] Invalid signature");
          return NextResponse.json(
            { error: "Invalid webhook signature" },
            { status: 401 }
          );
        }

        console.log("[SmartOffice Webhook] Signature verified successfully");
      } catch (error) {
        console.error("[SmartOffice Webhook] Signature verification error:", error);
        return NextResponse.json(
          { error: "Signature verification failed" },
          { status: 401 }
        );
      }
    } else {
      console.warn(
        "[SmartOffice Webhook] SUPABASE_WEBHOOK_SECRET not configured - skipping signature verification"
      );
    }

    // ============================================
    // 2. PARSE WEBHOOK PAYLOAD
    // ============================================

    console.log("[SmartOffice Webhook] Received payload:", {
      type: payload.type,
      table: payload.table,
      bucket: payload.record?.bucket_id,
      path: payload.record?.name,
    });

    // Validate payload structure
    if (payload.type !== "INSERT") {
      console.log(`[SmartOffice Webhook] Ignoring ${payload.type} event`);
      return NextResponse.json({
        success: true,
        message: "Event ignored (not INSERT)",
      });
    }

    if (!payload.record) {
      console.error("[SmartOffice Webhook] No record in payload");
      return NextResponse.json(
        { error: "Invalid payload: missing record" },
        { status: 400 }
      );
    }

    // Parse storage object metadata
    const fileMetadata = parseStorageObjectMetadata(payload.record);

    if (!fileMetadata) {
      console.error("[SmartOffice Webhook] Failed to parse storage object metadata");
      return NextResponse.json(
        { error: "Invalid storage object metadata" },
        { status: 400 }
      );
    }

    // Verify bucket is smartoffice-reports
    if (fileMetadata.bucketName !== "smartoffice-reports") {
      console.log(
        `[SmartOffice Webhook] Ignoring file from bucket: ${fileMetadata.bucketName}`
      );
      return NextResponse.json({
        success: true,
        message: `Ignored file from ${fileMetadata.bucketName}`,
      });
    }

    // Verify file is Excel
    if (!isExcelFile(fileMetadata.fileName)) {
      console.warn(
        `[SmartOffice Webhook] Ignoring non-Excel file: ${fileMetadata.fileName}`
      );
      return NextResponse.json({
        success: true,
        message: "Ignored non-Excel file",
      });
    }

    // ============================================
    // 3. EXTRACT & VALIDATE TENANT
    // ============================================

    const tenantId = fileMetadata.tenantId;

    if (!tenantId) {
      console.error(
        `[SmartOffice Webhook] Invalid file path (missing tenant ID): ${fileMetadata.filePath}`
      );
      return NextResponse.json(
        {
          error: "Invalid file path. Expected format: {tenantId}/filename.xlsx",
          filePath: fileMetadata.filePath,
        },
        { status: 400 }
      );
    }

    // Validate tenant exists in database
    const { exists, tenant } = await validateTenantExists(tenantId);

    if (!exists || !tenant) {
      console.error(
        `[SmartOffice Webhook] Tenant not found or inactive: ${tenantId}`
      );
      return NextResponse.json(
        {
          error: "Tenant not found or inactive",
          tenantId,
        },
        { status: 404 }
      );
    }

    console.log(
      `[SmartOffice Webhook] Processing file for tenant: ${tenant.name} (${tenant.slug})`
    );

    // ============================================
    // 4. DOWNLOAD FILE FROM STORAGE
    // ============================================

    const downloadResult = await downloadFileFromStorage(
      fileMetadata.bucketName,
      fileMetadata.filePath
    );

    if (!downloadResult) {
      console.error(
        `[SmartOffice Webhook] Failed to download file: ${fileMetadata.filePath}`
      );
      return NextResponse.json(
        {
          error: "Failed to download file from storage",
          filePath: fileMetadata.filePath,
        },
        { status: 500 }
      );
    }

    const { buffer, fileName } = downloadResult;

    console.log(
      `[SmartOffice Webhook] Downloaded file: ${fileName} (${buffer.length} bytes)`
    );

    // ============================================
    // 5. PARSE EXCEL FILE
    // ============================================

    console.log(`[SmartOffice Webhook] Parsing Excel file: ${fileName}`);

    const parseResult = parseSmartOfficeExcel(buffer, fileName);

    if (!parseResult.success) {
      console.error(`[SmartOffice Webhook] Parse failed:`, parseResult.errors);

      // Log failed parse to database
      await prisma.smartOfficeSyncLog.create({
        data: {
          tenantId: tenant.id,
          syncType: "auto",
          status: "failed",
          filesProcessed: 1,
          filesProcessedList: [fileName],
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          recordsFailed: 0,
          completedAt: new Date(),
          duration: Date.now() - startTime,
          errors: parseResult.errors,
          triggeredBy: "webhook",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse Excel file",
          details: parseResult.errors,
          fileName,
        },
        { status: 400 }
      );
    }

    console.log(
      `[SmartOffice Webhook] Parsed ${parseResult.type}: ${parseResult.records.length} records`
    );

    // ============================================
    // 6. IMPORT TO DATABASE
    // ============================================

    console.log(
      `[SmartOffice Webhook] Importing ${parseResult.records.length} ${parseResult.type}`
    );

    const importResult = await importSmartOfficeData(
      tenant.id,
      parseResult,
      "webhook"
    );

    console.log(`[SmartOffice Webhook] Import complete:`, {
      success: importResult.success,
      created: importResult.recordsCreated,
      updated: importResult.recordsUpdated,
      failed: importResult.recordsFailed,
      duration: importResult.duration,
    });

    // Update tenant's lastSyncAt timestamp
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { lastSyncAt: new Date() },
    });

    // ============================================
    // 7. RETURN SUCCESS RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${importResult.recordsCreated + importResult.recordsUpdated} ${parseResult.type}`,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        file: {
          name: fileName,
          size: fileMetadata.size,
          path: fileMetadata.filePath,
        },
        import: {
          type: importResult.type,
          recordsProcessed: importResult.recordsProcessed,
          recordsCreated: importResult.recordsCreated,
          recordsUpdated: importResult.recordsUpdated,
          recordsSkipped: importResult.recordsSkipped,
          recordsFailed: importResult.recordsFailed,
          duration: importResult.duration,
          syncLogId: importResult.syncLogId,
        },
        errors: importResult.errors.length > 0 ? importResult.errors : undefined,
        warnings:
          importResult.warnings.length > 0 ? importResult.warnings : undefined,
      },
    });
  } catch (error: any) {
    console.error("[SmartOffice Webhook] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/smartoffice/webhook
 *
 * Health check endpoint - confirms webhook is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/smartoffice/webhook",
    message: "SmartOffice webhook endpoint is active",
    expectedMethod: "POST",
    expectedPayload: {
      type: "INSERT",
      table: "objects",
      schema: "storage",
      record: {
        bucket_id: "smartoffice-reports",
        name: "{tenantId}/filename.xlsx",
      },
    },
  });
}
