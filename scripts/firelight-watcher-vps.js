const fs = require("fs");
const path = require("path");

const VALOR_API_URL = process.env.VALOR_API_URL;
const API_KEY = process.env.FIRELIGHT_INBOUND_API_KEY;
const TENANT_ID = process.env.VALOR_TENANT_ID;
const WATCH_DIR = process.env.SFTP_WATCH_DIR;
const SOURCE_ENV = process.env.SOURCE_ENVIRONMENT || "prod";
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || "10000", 10);

if (!VALOR_API_URL || !API_KEY || !TENANT_ID || !WATCH_DIR) {
  console.error("Missing required env vars");
  process.exit(1);
}

const PROCESSED_DIR = path.join(WATCH_DIR, "processed");
const FAILED_DIR = path.join(WATCH_DIR, "failed");

function log(level, message, meta) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...meta }));
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  log("info", "Processing file: " + fileName);
  const xmlContent = fs.readFileSync(filePath, "utf-8");
  if (!xmlContent.includes("DataFeedObject")) {
    log("warn", "Skipping non-FireLight file: " + fileName);
    return;
  }
  const response = await fetch(VALOR_API_URL + "/api/inbound/firelight", {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      "x-api-key": API_KEY,
      "x-tenant-id": TENANT_ID,
      "x-source-environment": SOURCE_ENV,
      "x-source-filename": fileName,
    },
    body: xmlContent,
  });
  const result = await response.json();
  if (response.ok) {
    log("info", "Success: " + fileName, { submissionId: result.submissionId, caseId: result.caseId });
    fs.renameSync(filePath, path.join(PROCESSED_DIR, Date.now() + "_" + fileName));
  } else {
    log("error", "Failed: " + fileName, { status: response.status, error: result.error });
    fs.renameSync(filePath, path.join(FAILED_DIR, Date.now() + "_" + fileName));
  }
}

async function poll() {
  try {
    const files = fs.readdirSync(WATCH_DIR).filter(function(f) {
      return f.toLowerCase().endsWith(".xml") && !f.startsWith(".");
    });
    for (const file of files) {
      const filePath = path.join(WATCH_DIR, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
      await new Promise(function(r) { setTimeout(r, 1000); });
      const stat2 = fs.statSync(filePath);
      if (stat.size !== stat2.size) { log("info", "Still writing: " + file); continue; }
      try { await processFile(filePath); } catch (err) {
        log("error", "Error processing " + file + ": " + err.message);
        try { fs.renameSync(filePath, path.join(FAILED_DIR, Date.now() + "_" + file)); } catch (e) {}
      }
    }
  } catch (err) { log("error", "Poll error: " + err.message); }
}

log("info", "FireLight watcher started", { watchDir: WATCH_DIR, apiUrl: VALOR_API_URL });

async function main() {
  while (true) {
    await poll();
    await new Promise(function(r) { setTimeout(r, POLL_INTERVAL); });
  }
}

main().catch(function(err) { log("error", "Fatal: " + err.message); process.exit(1); });
