/**
 * SmartOffice Storage Helpers
 *
 * Utilities for managing SmartOffice Excel files in Supabase Storage
 */

import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";

const BUCKET_NAME = "smartoffice-reports";

/**
 * Create Supabase client with service role (for webhook access)
 */
function createServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Extract tenant ID from storage file path
 *
 * Expected path format: {tenantId}/filename.xlsx
 * Example: "a1b2c3d4-1234-5678-abcd-123456789abc/policies_2024-01-15.xlsx"
 *
 * @param filePath - Full path to file in storage
 * @returns Tenant UUID or null if invalid format
 */
export function extractTenantIdFromPath(filePath: string): string | null {
  if (!filePath || typeof filePath !== "string") {
    return null;
  }

  // Remove leading slash if present
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

  // Split by '/' and get first segment
  const segments = cleanPath.split("/");

  if (segments.length < 2) {
    // Path must have at least: {tenantId}/{filename}
    return null;
  }

  const tenantId = segments[0];

  // Validate UUID format (basic check)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(tenantId)) {
    return null;
  }

  return tenantId;
}

/**
 * Validate that a tenant exists in the database
 *
 * @param tenantId - Tenant UUID
 * @returns True if tenant exists and is active
 */
export async function validateTenantExists(
  tenantId: string
): Promise<{ exists: boolean; tenant: { id: string; name: string; slug: string } | null }> {
  try {
    // Set tenant context for RLS
    await prisma.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantId}`;

    // Query tenant with RLS context set
    const result = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
    }>>`
      SELECT id, name, slug, status
      FROM tenants
      WHERE id = ${tenantId}::uuid
    `;

    if (!result || result.length === 0) {
      return { exists: false, tenant: null };
    }

    const tenant = result[0];

    // Check if tenant is active or in trial
    const isActive = tenant.status === "ACTIVE" || tenant.status === "TRIAL";

    if (!isActive) {
      console.warn(`[SmartOffice] Tenant ${tenantId} exists but is ${tenant.status}`);
      return { exists: false, tenant: null };
    }

    return {
      exists: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  } catch (error) {
    console.error("[SmartOffice] Error validating tenant:", error);
    return { exists: false, tenant: null };
  }
}

/**
 * Download file buffer from Supabase Storage
 *
 * @param bucketName - Storage bucket name
 * @param filePath - Path to file within bucket
 * @returns File buffer or null on error
 */
export async function downloadFileFromStorage(
  bucketName: string,
  filePath: string
): Promise<{ buffer: Buffer; fileName: string } | null> {
  try {
    const supabase = createServiceClient();

    // Download file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error(`[SmartOffice] Storage download error:`, error);
      return null;
    }

    if (!data) {
      console.error(`[SmartOffice] No data returned from storage for: ${filePath}`);
      return null;
    }

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract filename from path
    const segments = filePath.split("/");
    const fileName = segments[segments.length - 1];

    return { buffer, fileName };
  } catch (error) {
    console.error(`[SmartOffice] Error downloading file from storage:`, error);
    return null;
  }
}

/**
 * Validate file extension is Excel
 *
 * @param fileName - Name of the file
 * @returns True if file is .xlsx or .xls
 */
export function isExcelFile(fileName: string): boolean {
  if (!fileName || typeof fileName !== "string") {
    return false;
  }

  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");
}

/**
 * Extract file metadata from storage object
 *
 * @param storageObject - Storage object from webhook payload
 * @returns Parsed metadata
 */
export interface StorageFileMetadata {
  bucketName: string;
  filePath: string;
  fileName: string;
  tenantId: string | null;
  size: number;
  mimeType: string | null;
  createdAt: string;
}

export function parseStorageObjectMetadata(
  storageObject: any
): StorageFileMetadata | null {
  try {
    if (!storageObject || typeof storageObject !== "object") {
      return null;
    }

    const bucketName = storageObject.bucket_id || storageObject.bucketId;
    const filePath = storageObject.name || storageObject.path;

    if (!bucketName || !filePath) {
      console.error("[SmartOffice] Missing bucket_id or name in storage object");
      return null;
    }

    // Extract tenant ID from path
    const tenantId = extractTenantIdFromPath(filePath);

    // Extract filename
    const segments = filePath.split("/");
    const fileName = segments[segments.length - 1];

    return {
      bucketName,
      filePath,
      fileName,
      tenantId,
      size: storageObject.metadata?.size || 0,
      mimeType: storageObject.metadata?.mimetype || null,
      createdAt: storageObject.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error("[SmartOffice] Error parsing storage object metadata:", error);
    return null;
  }
}

/**
 * Upload SmartOffice file to storage (for manual uploads from UI)
 *
 * @param tenantId - Tenant UUID
 * @param file - File buffer
 * @param fileName - Name of file
 * @returns Upload result with path
 */
export async function uploadSmartOfficeFile(
  tenantId: string,
  file: Buffer,
  fileName: string
): Promise<{ success: boolean; filePath: string | null; error: string | null }> {
  try {
    const supabase = createServiceClient();

    // Validate file is Excel
    if (!isExcelFile(fileName)) {
      return {
        success: false,
        filePath: null,
        error: "Invalid file type. Only .xlsx and .xls files are supported.",
      };
    }

    // Create file path: {tenantId}/{fileName}
    const filePath = `${tenantId}/${fileName}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error("[SmartOffice] Upload error:", error);
      return {
        success: false,
        filePath: null,
        error: error.message || "Failed to upload file",
      };
    }

    return {
      success: true,
      filePath: data.path,
      error: null,
    };
  } catch (error: any) {
    console.error("[SmartOffice] Upload exception:", error);
    return {
      success: false,
      filePath: null,
      error: error.message || "Failed to upload file",
    };
  }
}

/**
 * List all SmartOffice files for a tenant
 *
 * @param tenantId - Tenant UUID
 * @returns Array of file metadata
 */
export async function listTenantFiles(tenantId: string): Promise<
  Array<{
    name: string;
    id: string;
    size: number;
    createdAt: string;
    updatedAt: string;
  }>
> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(tenantId, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("[SmartOffice] List files error:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((file) => ({
      name: file.name,
      id: file.id,
      size: file.metadata?.size || 0,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
    }));
  } catch (error) {
    console.error("[SmartOffice] List files exception:", error);
    return [];
  }
}
