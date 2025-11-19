import { NextRequest, NextResponse } from "next/server";
import {
  getDocument,
  deleteDocument,
  updateDocumentMetadata,
} from "@/lib/storage/documents";
import { getUserIdOrDemo } from "@/lib/auth/supabase";

/**
 * GET /api/cases/:id/documents/:documentId
 * Get a specific document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id: caseId, documentId } = await params;

    const document = await getDocument(caseId, documentId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get document" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/:id/documents/:documentId
 * Update document metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id: caseId, documentId } = await params;
    const body = await request.json();
    const { notes, documentType } = body;

    const userId = await getUserIdOrDemo();

    const updatedDocument = await updateDocumentMetadata(
      caseId,
      documentId,
      { notes, documentType },
      userId
    );

    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error: any) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cases/:id/documents/:documentId
 * Delete a document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id: caseId, documentId } = await params;

    const userId = await getUserIdOrDemo();

    await deleteDocument(caseId, documentId, userId);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}
