# Project Setup — New Machine

## Prerequisites

### Required Software
- **Node.js**: v18.17.0 or higher (LTS recommended)
  - Check: `node --version`
  - Install from: https://nodejs.org/
- **npm**: v9.0.0 or higher (comes with Node.js)
  - Check: `npm --version`
- **Git**: Latest version
  - Check: `git --version`
  - Install from: https://git-scm.com/

### Required Accounts
- **Supabase** account (https://supabase.com) - For database & storage
- **Vercel** account (https://vercel.com) - For hosting
- **Anthropic** account (https://anthropic.com) - For AI chat (Claude API)
- **Zapier** account (https://zapier.com) - For email → storage integration
- **Gmail/Google Workspace** - For report email inbox

---

## 1. Install Dependencies

From the project root (`C:\dev\valor-2\`), run:

```bash
npm install
```

**Expected packages** (from package.json):
- Next.js 16.0.10
- React 19
- Prisma 6.19.0
- Supabase client libraries
- Playwright 1.58.2
- And 50+ other dependencies

**Verify installation**:
```bash
npm list --depth=0
```

---

## 2. Environment Variables

### Step 2.1: Copy the example file

```bash
# Windows (PowerShell)
copy .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

### Step 2.2: Fill in real values

Open `.env.local` in your editor and replace ALL placeholder values:

#### **Database** (Supabase)
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database
2. Copy the **Connection Pooling** URL (port 6543)
3. Copy the **Direct Connection** URL (port 5432)
4. Paste into:
   ```env
   DATABASE_URL="your-pooling-url-here"
   DIRECT_URL="your-direct-url-here"
   ```

#### **Authentication** (Supabase)
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### **SmartOffice Intelligence** (New for this build)
```env
SMARTOFFICE_SYNC_ENABLED=true
SMARTOFFICE_STORAGE_BUCKET="smartoffice-reports"
SMARTOFFICE_WEBHOOK_SECRET="generate-random-32-char-string"
```

#### **Anthropic AI** (For chat assistant)
1. Go to: https://console.anthropic.com/settings/keys
2. Create API key
3. Paste into:
   ```env
   ANTHROPIC_API_KEY="sk-ant-YOUR-KEY-HERE"
   ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
   ```

#### **Multi-Tenancy** (New for this build)
```env
NEXT_PUBLIC_ROOT_DOMAIN="valorfs.app"
NEXT_PUBLIC_WILDCARD_SUBDOMAIN_ENABLED=true
```

#### **Email Notifications** (Optional but recommended)
Sign up for Resend (https://resend.com):
```env
RESEND_API_KEY="re_YOUR-KEY-HERE"
FROM_EMAIL="notifications@valorfs.app"
```

**⚠️ NEVER commit `.env.local` to git!** It contains secrets.

---

## 3. Database Setup

### Step 3.1: Verify database connection

```bash
npx prisma db pull
```

If successful, you'll see: "Prisma schema loaded from prisma\schema.prisma"

### Step 3.2: Run migrations

```bash
# This will apply all database schema changes
npx prisma migrate deploy
```

**Expected output**:
```
✔ Applied migrations:
  └─ 20260227154921_initial_schema
  └─ (future migrations will appear here)
```

### Step 3.3: Generate Prisma Client

```bash
npx prisma generate
```

**Expected output**:
```
✔ Generated Prisma Client (v6.19.0) to .\node_modules\@prisma\client
```

### Step 3.4: Seed the database (optional)

```bash
# For development/testing only - adds sample data
npm run db:seed
```

**Warning**: This will DELETE existing data and add sample users/organizations.

---

## 4. Verify Setup

### Run Type Checking

```bash
npm run type-check
```

**Expected**: No TypeScript errors (warnings are okay for now)

### Run Tests

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Or just smoke tests
npm run test:smoke
```

**Expected**: Tests pass (some may be skipped if features aren't built yet)

### Build the Project

```bash
npm run build
```

**Expected**: Next.js builds successfully without errors

---

## 5. Start Development Server

```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 16.0.10 (Turbopack)
- Local:         http://localhost:2050
- Network:       http://YOUR-IP:2050

✓ Starting...
✓ Ready in 2.2s
```

### Access the app:
- **Main site**: http://localhost:2050
- **Dashboard**: http://localhost:2050/dashboard
- **SmartOffice**: http://localhost:2050/smartoffice (after build)

### Test multi-tenancy locally:
Add to your hosts file (`C:\Windows\System32\drivers\etc\hosts` on Windows):
```
127.0.0.1  test-agency.localhost
127.0.0.1  demo.localhost
```

Then visit: `http://test-agency.localhost:2050`

---

## 6. Supabase Storage Setup (Required for SmartOffice)

### Step 6.1: Create storage bucket

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
2. Click "New bucket"
3. Name: `smartoffice-reports`
4. Public: **OFF** (keep private)
5. Click "Create"

### Step 6.2: Set up webhook

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/database/hooks
2. Click "Create a new hook"
3. Name: `smartoffice-file-upload`
4. Table: `storage.objects`
5. Events: `INSERT`
6. Type: `HTTP Request`
7. Method: `POST`
8. URL: `https://YOUR-DOMAIN.vercel.app/api/smartoffice/webhook`
9. Headers:
   ```json
   {
     "Authorization": "Bearer YOUR_WEBHOOK_SECRET",
     "Content-Type": "application/json"
   }
   ```
10. Click "Create hook"

---

## 7. Zapier Setup (After deployment)

**Note**: This is done AFTER deploying to production, not in local dev.

1. Log in to Zapier
2. Create new Zap
3. **Trigger**: Gmail - New Email
   - Connect Gmail account (use dedicated inbox)
   - Filter: To address contains `@reports.valorfs.app`
4. **Action 1**: Formatter - Extract Email Data
   - Extract: Attachments
5. **Action 2**: Supabase - Upload File
   - Bucket: `smartoffice-reports`
   - File: Use attachment from step 4
   - Path: `{tenant-slug}/{timestamp}-{filename}`
6. **Action 3**: Webhooks - POST (optional)
   - URL: `https://YOUR-DOMAIN/api/smartoffice/sync/trigger`
   - Body: `{"tenantSlug": "{extracted-from-email}"}`
7. Test the Zap
8. Turn it on

---

## 8. Resume Build

Once all setup steps are complete, tell Claude Code:

```
setup done
```

Claude will verify the setup and continue with the build process.

---

## Troubleshooting

### "Can't reach database server"
- Check DATABASE_URL is correct
- Verify your IP is allowed in Supabase dashboard (Settings → Database → Connection pooling → Restrict access)
- Try using DIRECT_URL instead of DATABASE_URL temporarily

### "Prisma Client not generated"
Run: `npx prisma generate` again

### "Module not found"
Run: `npm install` again
Clear Next.js cache: `npm run clean` (if available) or delete `.next` folder

### "Port 2050 already in use"
- Check running processes: `netstat -ano | findstr :2050`
- Kill the process: `taskkill /PID <process-id> /F`
- Or change port: `npm run dev -- -p 3000`

### Tests failing
- Ensure database is accessible
- Check all environment variables are set
- Run `npm run db:seed` to get test data
- Some tests may require deployed webhook (skip locally)

---

## Next Steps

After setup is verified:
1. Read `_BUILD/PROJECT-SPEC.md` for complete feature specifications
2. Read `_BUILD/MASTER.md` for build order and timeline
3. Start with Phase 1: Multi-Tenant Foundation
4. Follow CLAUDE.md process (PPBV: Plan → Prompt → Build → Verify)

---

**Questions or issues?**
Create a GitHub issue or check existing documentation in `_BUILD/` directory.

**Last Updated**: 2026-02-27
