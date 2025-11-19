import { NextRequest, NextResponse } from "next/server";
import {
  uploadDocument,
  getCaseDocuments,
  getCaseStorageStats,
} from "@/lib/storage/documents";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/cases/:id/documents
 * Get all documents for a case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("includeStats") === "true";

    const documents = await getCaseDocuments(caseId);

    const response: any = {
      success: true,
      data: {
        documents,
      },
    };

    if (includeStats) {
      const stats = await getCaseStorageStats(caseId);
      response.data.stats = stats;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get documents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases/:id/documents
 * Upload a document to a case
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const formData = await request.formData();

    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const notes = formData.get("notes") as string | undefined;

    if (!file) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: "documentType is required" },
        { status: 400 }
      );
    }

    const userId = await getUserIdOrDemo();

    const document = await uploadDocument(
      caseId,
      file,
      documentType,
      userId,
      notes
    );

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}
