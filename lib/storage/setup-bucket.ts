/**
 * Setup script for Supabase Storage bucket
 * Run this once to create the case-documents bucket
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupBucket() {
  const BUCKET_NAME = "case-documents";

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

    // Create bucket
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    });

    if (error) {
      console.error("Error creating bucket:", error);
      return;
    }

    console.log(`✓ Successfully created bucket '${BUCKET_NAME}'`);

    // Set up RLS policies (if needed)
    // Note: You may need to configure these in Supabase dashboard
    console.log("\nNext steps:");
    console.log("1. Go to Supabase Dashboard > Storage > case-documents");
    console.log("2. Configure RLS policies if needed:");
    console.log("   - Allow authenticated users to upload");
    console.log("   - Allow authenticated users to read their own files");
    console.log("   - Allow service role to manage all files");
  } catch (error) {
    console.error("Setup error:", error);
  }
}

// Run if executed directly
if (require.main === module) {
  setupBucket();
}

export { setupBucket };
