/**
 * FireLight SFTP File Watcher
 *
 * Runs on the VPS that hosts the SFTP server. Watches for new XML files
 * dropped by FireLight, reads them, and POSTs to the Valor inbound API.
 *
 * Usage:
 *   VALOR_API_URL=https://app.valorfs.app \
 *   FIRELIGHT_INBOUND_API_KEY=your-key \
 *   VALOR_TENANT_ID=your-tenant-id \
 *   SFTP_WATCH_DIR=/home/firelight/PROD \
 *   npx ts-node scripts/firelight-watcher.ts
 *
 * Env vars:
 *   VALOR_API_URL           - Base URL of Valor app (required)
 *   FIRELIGHT_INBOUND_API_KEY - API key for /api/inbound/firelight (required)
 *   VALOR_TENANT_ID         - Tenant ID to submit under (required)
 *   SFTP_WATCH_DIR          - Directory to watch for new XML files (required)
 *   SOURCE_ENVIRONMENT      - test | uat | prod (default: prod)
 *   POLL_INTERVAL_MS        - How often to check for files (default: 10000)
 */

import * as fs from "fs";
import * as path from "path";

const VALOR_API_URL = process.env.VALOR_API_URL;
const API_KEY = process.env.FIRELIGHT_INBOUND_API_KEY;
const TENANT_ID = process.env.VALOR_TENANT_ID;
const WATCH_DIR = process.env.SFTP_WATCH_DIR;
const SOURCE_ENV = process.env.SOURCE_ENVIRONMENT ?? "prod";
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS ?? "10000", 10);

if (!VALOR_API_URL || !API_KEY || !TENANT_ID || !WATCH_DIR) {
  console.error("Missing required environment variables:");
  if (!VALOR_API_URL) console.error("  - VALOR_API_URL");
  if (!API_KEY) console.error("  - FIRELIGHT_INBOUND_API_KEY");
  if (!TENANT_ID) console.error("  - VALOR_TENANT_ID");
  if (!WATCH_DIR) console.error("  - SFTP_WATCH_DIR");
  process.exit(1);
}

const PROCESSED_DIR = path.join(WATCH_DIR, "processed");
const FAILED_DIR = path.join(WATCH_DIR, "failed");

// Ensure subdirectories exist
for (const dir of [PROCESSED_DIR, FAILED_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

function log(level: string, message: string, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

async function processFile(filePath: string): Promise<void> {
  const fileName = path.basename(filePath);
  log("info", `Processing file: ${fileName}`);

  const xmlContent = fs.readFileSync(filePath, "utf-8");

  if (!xmlContent.includes("DataFeedObject")) {
    log("warn", `Skipping non-FireLight file: ${fileName}`);
    return;
  }

  const response = await fetch(`${VALOR_API_URL}/api/inbound/firelight`, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      "x-api-key": API_KEY!,
      "x-tenant-id": TENANT_ID!,
      "x-source-environment": SOURCE_ENV,
      "x-source-filename": fileName,
    },
    body: xmlContent,
  });

  const result = await response.json();

  if (response.ok) {
    log("info", `Successfully processed: ${fileName}`, {
      submissionId: result.submissionId,
      caseId: result.caseId,
      status: result.status,
    });

    // Move to processed
    const dest = path.join(PROCESSED_DIR, `${Date.now()}_${fileName}`);
    fs.renameSync(filePath, dest);
  } else {
    log("error", `Failed to process: ${fileName}`, {
      status: response.status,
      error: result.error,
    });

    // Move to failed
    const dest = path.join(FAILED_DIR, `${Date.now()}_${fileName}`);
    fs.renameSync(filePath, dest);
  }
}

async function pollDirectory(): Promise<void> {
  try {
    const files = fs.readdirSync(WATCH_DIR!).filter((f) => {
      const lower = f.toLowerCase();
      return lower.endsWith(".xml") && !lower.startsWith(".");
    });

    for (const file of files) {
      const filePath = path.join(WATCH_DIR!, file);

      // Skip if not a regular file
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      // Wait for file to finish writing (check if size is stable)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const stat2 = fs.statSync(filePath);
      if (stat.size !== stat2.size) {
        log("info", `File still being written, skipping: ${file}`);
        continue;
      }

      try {
        await processFile(filePath);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log("error", `Unhandled error processing ${file}: ${message}`);

        // Move to failed
        try {
          const dest = path.join(FAILED_DIR, `${Date.now()}_${file}`);
          fs.renameSync(filePath, dest);
        } catch {
          log("error", `Could not move failed file: ${file}`);
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", `Poll error: ${message}`);
  }
}

// Main loop
log("info", "FireLight file watcher started", {
  watchDir: WATCH_DIR,
  apiUrl: VALOR_API_URL,
  pollInterval: POLL_INTERVAL,
  sourceEnvironment: SOURCE_ENV,
});

async function main() {
  while (true) {
    await pollDirectory();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

main().catch((err) => {
  log("error", `Fatal error: ${err.message}`);
  process.exit(1);
});
