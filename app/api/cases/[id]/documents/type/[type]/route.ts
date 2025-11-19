import { NextRequest, NextResponse } from "next/server";
import { getDocumentsByType } from "@/lib/storage/documents";

/**
 * GET /api/cases/:id/documents/type/:type
 * Get documents by type for a case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  try {
    const { id: caseId, type: documentType } = await params;

    const documents = await getDocumentsByType(caseId, documentType);

    return NextResponse.json({
      success: true,
      data: {
        documentType,
        count: documents.length,
        documents,
      },
    });
  } catch (error: any) {
    console.error("Get documents by type error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get documents" },
      { status: 500 }
    );
  }
}
