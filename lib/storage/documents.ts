import { prisma } from "@/lib/db/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STORAGE_BUCKET = "case-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export interface DocumentMetadata {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  notes?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX`,
    };
  }

  return { valid: true };
}

/**
 * Upload a document to Supabase Storage
 */
export async function uploadDocument(
  caseId: string,
  file: File,
  documentType: string,
  uploadedBy: string,
  notes?: string
): Promise<DocumentMetadata> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Verify case exists
  const caseExists = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!caseExists) {
    throw new Error("Case not found");
  }

  // Generate unique file name
  const fileExt = file.name.split(".").pop();
  const fileName = `${caseId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  // Convert File to ArrayBuffer for Node.js environment
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  const documentMetadata: DocumentMetadata = {
    id: crypto.randomUUID(),
    caseId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    documentType,
    uploadedBy,
    uploadedAt: new Date(),
    url: urlData.publicUrl,
    notes,
  };

  // Update case documentUrls JSON field
  const currentCase = await prisma.case.findUnique({
    where: { id: caseId },
  });

  const documentUrls = (currentCase?.documentUrls as DocumentMetadata[]) || [];
  documentUrls.push(documentMetadata);

  await prisma.case.update({
    where: { id: caseId },
    data: {
      documentUrls,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: uploadedBy,
      action: "DOCUMENT_UPLOAD",
      entityType: "CASE",
      entityId: caseId,
      changes: JSON.stringify({
        documentId: documentMetadata.id,
        fileName: file.name,
        documentType,
        fileSize: file.size,
      }),
    },
  });

  return documentMetadata;
}

/**
 * Get all documents for a case
 */
export async function getCaseDocuments(
  caseId: string
): Promise<DocumentMetadata[]> {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    select: { documentUrls: true },
  });

  if (!caseData) {
    throw new Error("Case not found");
  }

  return (caseData.documentUrls as DocumentMetadata[]) || [];
}

/**
 * Delete a document
 */
export async function deleteDocument(
  caseId: string,
  documentId: string,
  deletedBy: string
): Promise<void> {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!caseData) {
    throw new Error("Case not found");
  }

  const documentUrls = (caseData.documentUrls as DocumentMetadata[]) || [];
  const documentToDelete = documentUrls.find((doc) => doc.id === documentId);

  if (!documentToDelete) {
    throw new Error("Document not found");
  }

  // Extract storage path from URL
  const urlParts = documentToDelete.url.split("/");
  const storagePath = urlParts.slice(-2).join("/"); // Get "caseId/filename.ext"

  // Delete from Supabase Storage
  const { error: deleteError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (deleteError) {
    console.error("Storage deletion error:", deleteError);
    // Continue anyway to remove from database
  }

  // Remove from case documentUrls
  const updatedDocuments = documentUrls.filter((doc) => doc.id !== documentId);

  await prisma.case.update({
    where: { id: caseId },
    data: {
      documentUrls: updatedDocuments,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: deletedBy,
      action: "DOCUMENT_DELETE",
      entityType: "CASE",
      entityId: caseId,
      changes: JSON.stringify({
        documentId,
        fileName: documentToDelete.fileName,
        documentType: documentToDelete.documentType,
      }),
    },
  });
}

/**
 * Get document by ID
 */
export async function getDocument(
  caseId: string,
  documentId: string
): Promise<DocumentMetadata | null> {
  const documents = await getCaseDocuments(caseId);
  return documents.find((doc) => doc.id === documentId) || null;
}

/**
 * Update document metadata (notes, documentType)
 */
export async function updateDocumentMetadata(
  caseId: string,
  documentId: string,
  updates: { notes?: string; documentType?: string },
  updatedBy: string
): Promise<DocumentMetadata> {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!caseData) {
    throw new Error("Case not found");
  }

  const documentUrls = (caseData.documentUrls as DocumentMetadata[]) || [];
  const documentIndex = documentUrls.findIndex((doc) => doc.id === documentId);

  if (documentIndex === -1) {
    throw new Error("Document not found");
  }

  // Update document metadata
  documentUrls[documentIndex] = {
    ...documentUrls[documentIndex],
    ...updates,
  };

  await prisma.case.update({
    where: { id: caseId },
    data: {
      documentUrls,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: "DOCUMENT_UPDATE",
      entityType: "CASE",
      entityId: caseId,
      changes: JSON.stringify({
        documentId,
        updates,
      }),
    },
  });

  return documentUrls[documentIndex];
}

/**
 * Get documents by type
 */
export async function getDocumentsByType(
  caseId: string,
  documentType: string
): Promise<DocumentMetadata[]> {
  const documents = await getCaseDocuments(caseId);
  return documents.filter((doc) => doc.documentType === documentType);
}

/**
 * Get storage statistics for a case
 */
export async function getCaseStorageStats(caseId: string): Promise<{
  totalDocuments: number;
  totalSize: number;
  documentsByType: Record<string, number>;
}> {
  const documents = await getCaseDocuments(caseId);

  const stats = {
    totalDocuments: documents.length,
    totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
    documentsByType: documents.reduce(
      (acc, doc) => {
        acc[doc.documentType] = (acc[doc.documentType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return stats;
}
