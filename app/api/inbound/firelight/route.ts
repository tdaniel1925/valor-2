import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@supabase/supabase-js";
import {
  parseFireLightXml,
  mapToCase,
  getPrimaryInsuredName,
  getAdvisorName,
} from "@/lib/firelight/xml-parser";
import * as crypto from "crypto";

const STORAGE_BUCKET = "case-documents";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Verify the inbound API key from the file watcher
 */
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.FIRELIGHT_INBOUND_API_KEY;
  if (!expectedKey) return false;
  if (!apiKey) return false;

  // Constant-time comparison
  const a = Buffer.from(apiKey);
  const b = Buffer.from(expectedKey);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Match a FireLight agent to a Valor user via firelightAgentId, gaid, or name
 */
async function matchAgent(
  tenantId: string,
  agentIdNumber: string | null,
  agentSsn: string | null,
  agentFirstName: string | null,
  agentLastName: string | null
): Promise<string | null> {
  // Try matching by FireLight agent ID first
  if (agentIdNumber) {
    const profile = await prisma.userProfile.findFirst({
      where: {
        firelightAgentId: agentIdNumber,
        user: { tenantId },
      },
      select: { userId: true },
    });
    if (profile) return profile.userId;

    // Also try matching against GAID
    const gaidProfile = await prisma.userProfile.findFirst({
      where: {
        gaid: agentIdNumber,
        user: { tenantId },
      },
      select: { userId: true },
    });
    if (gaidProfile) return gaidProfile.userId;
  }

  // Fall back to name match
  if (agentFirstName && agentLastName) {
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        firstName: { equals: agentFirstName, mode: "insensitive" },
        lastName: { equals: agentLastName, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (user) return user.id;
  }

  return null;
}

/**
 * Upload a PDF buffer to Supabase Storage
 */
async function uploadPdf(
  caseId: string,
  pdfBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  const supabase = getSupabase();
  const storagePath = `${caseId}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error(`FireLight PDF upload failed: ${error.message}`);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

/**
 * POST /api/inbound/firelight
 *
 * Receives FireLight NVP XML from the file watcher script.
 * Parses the XML, matches the agent, creates/updates a case,
 * stores PDFs, and records the submission.
 *
 * Headers:
 *   x-api-key: FIRELIGHT_INBOUND_API_KEY
 *   x-tenant-id: Tenant ID (required)
 *   x-source-environment: test | uat | prod (optional)
 *   x-source-filename: Original SFTP filename (optional)
 *
 * Body: Raw NVP XML
 */
export async function POST(request: NextRequest) {
  try {
    // Auth
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json({ error: "Missing x-tenant-id header" }, { status: 400 });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const sourceEnvironment = request.headers.get("x-source-environment") ?? undefined;
    const sourceFileName = request.headers.get("x-source-filename") ?? undefined;

    // Parse XML
    const rawXml = await request.text();
    if (!rawXml.trim()) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    let parsed;
    try {
      parsed = parseFireLightXml(rawXml);
    } catch (err) {
      const message = err instanceof Error ? err.message : "XML parse error";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!parsed.transactionId) {
      return NextResponse.json({ error: "Missing TransactionID in XML" }, { status: 400 });
    }

    // Check for duplicate submission (idempotency)
    const existing = await prisma.fireLightSubmission.findUnique({
      where: { transactionId: parsed.transactionId },
    });
    if (existing) {
      return NextResponse.json({
        status: "duplicate",
        submissionId: existing.id,
        message: "This transaction has already been processed",
      }, { status: 200 });
    }

    // Map NVP fields to case data
    const mapped = mapToCase(parsed.dataItems);

    // Match agent
    const matchedUserId = await matchAgent(
      tenantId,
      mapped.agentIdNumber,
      mapped.agentSsn,
      mapped.agentFirstName,
      mapped.agentLastName
    );

    // Run all DB operations in a transaction with RLS context
    const primaryInsured = getPrimaryInsuredName(mapped);
    const primaryAdvisor = getAdvisorName(mapped);

    // If no agent matched, assign to tenant's first admin user
    let assignedUserId = matchedUserId;
    if (!assignedUserId) {
      const adminUser = await prisma.user.findFirst({
        where: { tenantId, role: "ADMINISTRATOR" },
        select: { id: true },
      });
      assignedUserId = adminUser?.id ?? null;
    }

    if (!assignedUserId) {
      return NextResponse.json({ error: "No user found to assign case to" }, { status: 400 });
    }

    let submission;
    let caseRecord;
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Set RLS tenant context
        await tx.$executeRawUnsafe(
          `SET LOCAL app.current_tenant_id = '${tenantId}'`
        );

        // Create the submission record
        const sub = await tx.fireLightSubmission.create({
          data: {
            tenantId,
            transactionId: parsed.transactionId,
            applicationId: parsed.applicationId,
            dti: parsed.dti,
            matchedUserId,
            agentFirstName: mapped.agentFirstName,
            agentLastName: mapped.agentLastName,
            agentSsn: mapped.agentSsn,
            agentIdNumber: mapped.agentIdNumber,
            clientFirstName: mapped.clientFirstName,
            clientLastName: mapped.clientLastName,
            clientDob: mapped.clientDob,
            clientEmail: mapped.clientEmail,
            clientSsn: mapped.clientSsn,
            productName: mapped.productName,
            productType: mapped.productType,
            investmentAmount: mapped.investmentAmount,
            rawXml,
            extractedFields: parsed.dataItems,
            status: "PROCESSING",
            sourceEnvironment,
            sourceFileName,
          },
        });

        // Create the Case
        const cas = await tx.case.create({
          data: {
            tenantId,
            userId: assignedUserId!,
            policyNumber: parsed.dti,
            primaryInsured,
            primaryAdvisor,
            carrier: mapped.productName ?? "Unknown",
            productName: mapped.productName ?? "Unknown",
            productType: mapped.productType ?? "Annuity",
            targetAmount: mapped.investmentAmount,
            status: "SUBMITTED",
            clientName: primaryInsured ?? "Unknown",
            clientEmail: mapped.clientEmail,
            externalId: parsed.applicationId,
            externalSystem: "FireLight",
            submittedAt: parsed.transactionDateTime ? new Date(parsed.transactionDateTime) : new Date(),
          },
        });

        return { submission: sub, caseRecord: cas };
      });

      submission = result.submission;
      caseRecord = result.caseRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      return NextResponse.json({ error: "Failed to process submission", detail: message }, { status: 500 });
    }

    // Upload PDFs and create document records (outside transaction for large file uploads)
    const documents: Array<{ formName: string | null; fileName: string; pdfUrl: string | null }> = [];
    for (let i = 0; i < parsed.pdfs.length; i++) {
      const formName = parsed.forms[i] ?? null;
      const pdfFileName = formName
        ? `${parsed.dti ?? parsed.transactionId}_${formName.replace(/\s+/g, "_")}.pdf`
        : `${parsed.dti ?? parsed.transactionId}.pdf`;

      const pdfUrl = await uploadPdf(caseRecord.id, parsed.pdfs[i], pdfFileName);

      await prisma.fireLightDocument.create({
        data: {
          submissionId: submission.id,
          formName,
          fileName: pdfFileName,
          pdfUrl,
          sizeBytes: parsed.pdfs[i].length,
        },
      });

      documents.push({ formName, fileName: pdfFileName, pdfUrl });
    }

    // Update submission as completed
    await prisma.fireLightSubmission.update({
      where: { id: submission.id },
      data: {
        status: "COMPLETED",
        caseId: caseRecord.id,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: "success",
      submissionId: submission.id,
      caseId: caseRecord.id,
      agentMatched: !!matchedUserId,
      documentsProcessed: documents.length,
      transactionId: parsed.transactionId,
    }, { status: 201 });

  } catch (err) {
    console.error("FireLight inbound error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
