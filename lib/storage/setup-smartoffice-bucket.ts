/**
 * Setup script for SmartOffice Supabase Storage bucket
 * Run this once to create the smartoffice-reports bucket with tenant-scoped folders
 *
 * Usage:
 *   npx ts-node lib/storage/setup-smartoffice-bucket.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupSmartOfficeBucket() {
  const BUCKET_NAME = "smartoffice-reports";

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (bucketExists) {
      console.log(`✓ Bucket '${BUCKET_NAME}' already exists`);
      return;
    }

    // Create bucket with tenant-scoped access
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false, // Private bucket - tenant isolation enforced
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream", // Some Excel files report as this
      ],
    });

    if (error) {
      console.error("Error creating bucket:", error);
      return;
    }

    console.log(`✓ Successfully created bucket '${BUCKET_NAME}'`);

    // Instructions for RLS setup
    console.log("\n" + "=".repeat(60));
    console.log("NEXT STEPS - Configure RLS Policies");
    console.log("=".repeat(60));
    console.log("\n1. Go to Supabase Dashboard → Storage → smartoffice-reports → Policies");
    console.log("\n2. Add the following RLS policies:\n");

    console.log("Policy 1: Tenant Upload Access");
    console.log("-".repeat(40));
    console.log("Name: Tenant can upload to their folder");
    console.log("Policy: INSERT");
    console.log("Target: authenticated");
    console.log("SQL:\n");
    console.log(`  (storage.foldername(name))[1] =
    (SELECT tenant_id::text FROM users WHERE id = auth.uid())\n`);

    console.log("Policy 2: Tenant Read Access");
    console.log("-".repeat(40));
    console.log("Name: Tenant can read their own files");
    console.log("Policy: SELECT");
    console.log("Target: authenticated");
    console.log("SQL:\n");
    console.log(`  (storage.foldername(name))[1] =
    (SELECT tenant_id::text FROM users WHERE id = auth.uid())\n`);

    console.log("Policy 3: Service Role Full Access");
    console.log("-".repeat(40));
    console.log("Name: Service role has full access");
    console.log("Policy: ALL");
    console.log("Target: authenticated");
    console.log("SQL:\n");
    console.log(`  auth.jwt()->>'role' = 'service_role'\n`);

    console.log("=".repeat(60));
    console.log("\n3. Configure Webhook:");
    console.log("   - Go to Database → Webhooks");
    console.log("   - Create webhook for Storage INSERT events");
    console.log("   - URL: https://yourapp.valorfs.app/api/smartoffice/webhook");
    console.log("   - Table: storage.objects");
    console.log("   - Events: INSERT");
    console.log("   - Filter: bucket_id = 'smartoffice-reports'");
    console.log("\n4. Save the webhook secret to .env.local:");
    console.log("   SUPABASE_WEBHOOK_SECRET=<your-secret>\n");

    console.log("=".repeat(60));
    console.log("\nFolder Structure:");
    console.log("  smartoffice-reports/");
    console.log("    ├── {tenant-uuid-1}/");
    console.log("    │   ├── policies_2024-01-15.xlsx");
    console.log("    │   └── agents_2024-01-15.xlsx");
    console.log("    └── {tenant-uuid-2}/");
    console.log("        └── policies_2024-01-16.xlsx\n");

  } catch (error) {
    console.error("Setup error:", error);
  }
}

// Run if executed directly
if (require.main === module) {
  setupSmartOfficeBucket();
}

export { setupSmartOfficeBucket };
