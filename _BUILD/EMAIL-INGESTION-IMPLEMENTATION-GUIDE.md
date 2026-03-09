# Email Ingestion & Parsing Service - Implementation Guide

## Overview
This guide provides a complete roadmap for implementing automated email ingestion with Excel/CSV parsing, based on the production-verified system built for Valor Financial.

**What this enables:**
- Users send SmartOffice reports to a unique email address
- System automatically receives, parses, and imports data
- No manual uploads needed
- Email notifications on failures

**Tech stack:**
- Resend (email receiving & webhooks)
- Next.js API routes (webhook handler)
- Prisma (database ORM)
- Custom Excel parser

---

## Architecture Overview

```
SmartOffice Email (with .xlsx attachment)
          ↓
    Resend Inbound Email
          ↓
    Webhook to /api/inbound/smartoffice
          ↓
    Download attachment from Resend API
          ↓
    Parse Excel with existing parser
          ↓
    Import to database with existing import service
          ↓
    Send failure notification (if errors)
```

---

## Phase 1: Database Schema (30 minutes)

### 1.1 Add Email Fields to User/Tenant Table

**For multi-tenant apps (like Valor):**
```prisma
model Tenant {
  // ... existing fields
  inboundEmailAddress String?  @unique  // 8-char random string
  inboundEmailEnabled Boolean  @default(true)
}
```

**For single-tenant apps (like SmartLook 360):**
```prisma
model User {
  // ... existing fields
  inboundEmailAddress String?  @unique  // 8-char random string
  inboundEmailEnabled Boolean  @default(true)
}
```

### 1.2 Create Migration
```bash
npx prisma migrate dev --name add_inbound_email_fields
```

### 1.3 Generate Unique Emails for Existing Records

Create `scripts/generate-inbound-emails.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateEmailAddress(): string {
  return crypto.randomBytes(4).toString('hex'); // 8 characters
}

async function main() {
  // For multi-tenant:
  const tenants = await prisma.tenant.findMany({
    where: { inboundEmailAddress: null }
  });

  for (const tenant of tenants) {
    const address = generateEmailAddress();
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { inboundEmailAddress: address }
    });
    console.log(`✅ ${tenant.name}: ${address}@<your-domain>`);
  }

  // For single-tenant:
  // const users = await prisma.user.findMany({
  //   where: { inboundEmailAddress: null }
  // });
  //
  // for (const user of users) {
  //   const address = generateEmailAddress();
  //   await prisma.user.update({
  //     where: { id: user.id },
  //     data: { inboundEmailAddress: address }
  //   });
  //   console.log(`✅ ${user.email}: ${address}@<your-domain>`);
  // }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/generate-inbound-emails.ts
```

---

## Phase 2: Resend Setup (15 minutes)

### 2.1 Sign Up for Resend
1. Go to https://resend.com
2. Create account (free tier supports inbound email)
3. Get API key from dashboard

### 2.2 Add Environment Variables
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Get this after creating webhook
FROM_EMAIL=notifications@yourdomain.com    # For failure emails
```

### 2.3 Configure Inbound Domain

**Option A: Use Resend's Default Domain (Fastest)**
- Resend provides: `@<random>.resend.app`
- Example: `a7f3k2x9@shwunde745.resend.app`
- ✅ No DNS setup needed
- ✅ Works immediately
- ❌ Not branded

**Option B: Use Your Custom Domain (Branded)**
1. In Resend Dashboard → Domains → Add Domain
2. Add domain: `reports.yourdomain.com`
3. Add these MX records in your DNS:
   ```
   Type: MX
   Host: reports.yourdomain.com
   Value: mx1.resend.com
   Priority: 10

   Type: MX
   Host: reports.yourdomain.com
   Value: mx2.resend.com
   Priority: 20
   ```
4. Wait for verification (5-60 minutes)

**For this guide, we'll use Option A (Resend default) for speed.**

### 2.4 Create Webhook

1. In Resend Dashboard → Webhooks → Create Webhook
2. **URL**: `https://yourdomain.com/api/inbound/smartoffice`
3. **Events**: Check "Email Received" (or similar)
4. **Copy the signing secret** → Add to `.env` as `RESEND_WEBHOOK_SECRET`

---

## Phase 3: Webhook Handler (60 minutes)

### 3.1 Install Resend SDK
```bash
npm install resend
```

### 3.2 Create Webhook Route

Create `app/api/inbound/smartoffice/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseSmartOfficeExcel } from '@/lib/smartoffice/excel-parser'; // Your existing parser
import { importSmartOfficeData } from '@/lib/smartoffice/import-service'; // Your existing import
import { prisma } from '@/lib/db/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('📧 Received webhook:', JSON.stringify(payload, null, 2));

    // Extract recipient email (format: uniqueid@domain.com)
    const to = payload.data?.to?.[0]; // Resend format: { data: { to: ["email@..."] } }
    if (!to) {
      return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
    }

    // Extract unique ID before @
    const emailAddress = to.split('@')[0];
    console.log(`Looking for user with email address: ${emailAddress}`);

    // Find user/tenant by email address
    // MULTI-TENANT VERSION:
    const tenant = await prisma.tenant.findUnique({
      where: { inboundEmailAddress: emailAddress },
      include: { users: true } // For notifications
    });

    if (!tenant) {
      console.error(`No tenant found for: ${emailAddress}`);
      return NextResponse.json({ error: 'Unknown recipient' }, { status: 404 });
    }

    if (!tenant.inboundEmailEnabled) {
      console.error(`Email disabled for: ${tenant.slug}`);
      return NextResponse.json({ error: 'Email disabled' }, { status: 403 });
    }

    // SINGLE-TENANT VERSION (use instead of above):
    // const user = await prisma.user.findUnique({
    //   where: { inboundEmailAddress: emailAddress }
    // });
    //
    // if (!user || !user.inboundEmailEnabled) {
    //   return NextResponse.json({ error: 'Unknown recipient' }, { status: 404 });
    // }

    // Extract attachments metadata
    const attachmentsMeta = payload.data?.attachments || [];
    const excelAttachments = attachmentsMeta.filter((att: any) => {
      const filename = att.filename?.toLowerCase() || '';
      return filename.endsWith('.xlsx') || filename.endsWith('.xls') || filename.endsWith('.csv');
    });

    if (excelAttachments.length === 0) {
      console.log('No Excel attachments found');
      return NextResponse.json({ message: 'No files to process' }, { status: 200 });
    }

    console.log(`Processing ${excelAttachments.length} file(s) for: ${tenant.slug}`);

    // Get email ID for fetching attachments
    const emailId = payload.data?.email_id;
    if (!emailId) {
      return NextResponse.json({ error: 'Missing email_id' }, { status: 400 });
    }

    // Process each attachment
    const results = [];
    const errors = [];

    for (const attachmentMeta of excelAttachments) {
      try {
        const filename = attachmentMeta.filename;
        const attachmentId = attachmentMeta.id;

        // Fetch attachment content from Resend API
        console.log(`Fetching attachment ${attachmentId}...`);
        const attachmentResponse = await fetch(
          `https://api.resend.com/emails/receiving/${emailId}/attachments/${attachmentId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`
            }
          }
        );

        if (!attachmentResponse.ok) {
          throw new Error(`Failed to fetch attachment: ${attachmentResponse.statusText}`);
        }

        const attachmentData = await attachmentResponse.json();
        const downloadUrl = attachmentData.download_url;

        if (!downloadUrl) {
          throw new Error('No download URL in response');
        }

        // Download the file
        const fileResponse = await fetch(downloadUrl);
        if (!fileResponse.ok) {
          throw new Error(`Failed to download: ${fileResponse.statusText}`);
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse Excel (use your existing parser)
        const parseResult = parseSmartOfficeExcel(buffer, filename);

        if (!parseResult.success) {
          throw new Error(`Parse failed: ${parseResult.errors.join(', ')}`);
        }

        // Import to database (use your existing import service)
        const importResult = await importSmartOfficeData(
          tenant.id, // or user.id for single-tenant
          parseResult,
          'EMAIL' // triggeredBy flag
        );

        results.push({
          filename,
          success: importResult.success,
          created: importResult.recordsCreated,
          updated: importResult.recordsUpdated,
          failed: importResult.recordsFailed
        });

        if (!importResult.success) {
          errors.push({
            filename,
            errors: importResult.errors
          });
        }

      } catch (error: any) {
        console.error(`Failed to process ${attachmentMeta.filename}:`, error);
        errors.push({
          filename: attachmentMeta.filename,
          errors: [error.message]
        });
      }
    }

    // Send failure notification if errors occurred
    if (errors.length > 0) {
      await sendFailureNotification(tenant, errors);
    }

    console.log(`✅ Processed ${results.length} files`);

    return NextResponse.json({
      success: true,
      filesProcessed: results.length,
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function sendFailureNotification(
  tenant: any, // or user for single-tenant
  errors: Array<{ filename: string; errors: string[] }>
) {
  try {
    // Multi-tenant: notify all users in tenant
    const emailList = tenant.users.map((u: any) => u.email);

    // Single-tenant: notify the user
    // const emailList = [user.email];

    if (emailList.length === 0) {
      console.warn('No users to notify');
      return;
    }

    const errorDetails = errors.map(e => `
      <li>
        <strong>${e.filename}</strong><br>
        ${e.errors.map(err => `• ${err}`).join('<br>')}
      </li>
    `).join('');

    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: emailList,
      subject: 'SmartOffice Import Failed',
      html: `
        <h2>SmartOffice Import Failed</h2>
        <p>We encountered errors while importing your SmartOffice reports:</p>
        <ul>${errorDetails}</ul>
        <p>You can manually upload at: <a href="https://yourapp.com/upload">yourapp.com/upload</a></p>
      `
    });

    console.log(`📧 Sent failure notification to ${emailList.length} user(s)`);
  } catch (error: any) {
    console.error('Failed to send notification:', error);
  }
}
```

### 3.3 Make Endpoint Public (No Auth)

**If using middleware.ts:**
```typescript
// In middleware.ts, exclude the webhook path from auth:
const publicPaths = [
  '/api/auth',
  '/api/inbound/smartoffice', // ← Add this
  // ...
];
```

**If using route-level auth:**
Ensure the route handler does NOT call auth checks.

---

## Phase 4: Dashboard Integration (30 minutes)

### 4.1 Display Email Address to Users

**Example component:**
```typescript
// components/InboundEmailCard.tsx
'use client';

export function InboundEmailCard({
  emailAddress,
  domain = 'shwunde745.resend.app'
}: {
  emailAddress: string;
  domain?: string;
}) {
  const fullEmail = `${emailAddress}@${domain}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullEmail);
    alert('Email copied!');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        Your SmartOffice Email
      </h3>
      <div className="flex items-center gap-2">
        <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1">
          {fullEmail}
        </code>
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Copy
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Forward SmartOffice reports here to auto-import
      </p>
    </div>
  );
}
```

**Add to dashboard:**
```typescript
// app/dashboard/page.tsx
import { InboundEmailCard } from '@/components/InboundEmailCard';

export default async function Dashboard() {
  const user = await getCurrentUser();

  return (
    <div>
      {user.inboundEmailAddress && (
        <InboundEmailCard emailAddress={user.inboundEmailAddress} />
      )}
    </div>
  );
}
```

### 4.2 Update Signup Flow

**Generate email on user creation:**
```typescript
// In signup handler
import crypto from 'crypto';

const newUser = await prisma.user.create({
  data: {
    email: formData.email,
    name: formData.name,
    inboundEmailAddress: crypto.randomBytes(4).toString('hex'), // ← Add this
    inboundEmailEnabled: true
  }
});
```

---

## Phase 5: Testing (30 minutes)

### 5.1 Create Diagnostic Scripts

**Check tenant emails:**
```typescript
// scripts/show-tenant-emails.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, inboundEmailAddress: true }
  });

  console.log('\n📧 User Email Addresses:\n');
  users.forEach(u => {
    console.log(`${u.email}: ${u.inboundEmailAddress}@shwunde745.resend.app`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

**Check import history:**
```typescript
// scripts/check-email-imports.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const imports = await prisma.smartOfficeSyncLog.findMany({
    where: { triggeredBy: 'EMAIL' },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log(`📧 Found ${imports.length} email imports\n`);

  imports.forEach((log, i) => {
    console.log(`${i + 1}. ${log.status}`);
    console.log(`   Created: ${log.recordsCreated || 0} | Updated: ${log.recordsUpdated || 0}`);
    console.log(`   Files: ${log.filesProcessedList?.join(', ')}`);
    console.log(`   Time: ${log.createdAt}\n`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

### 5.2 Test End-to-End

1. **Get test email:**
   ```bash
   npx ts-node scripts/show-tenant-emails.ts
   ```

2. **Send test email:**
   - From your personal email
   - To: `<unique-id>@shwunde745.resend.app`
   - Subject: "Test SmartOffice Report"
   - Attach a valid SmartOffice Excel file

3. **Check Resend logs:**
   - Go to Resend Dashboard → Webhooks
   - Check for webhook calls
   - Status should be 200 OK

4. **Check application logs:**
   - Vercel Dashboard → Logs (if deployed)
   - Or local console output
   - Should see: "Processing N file(s)"

5. **Verify import:**
   ```bash
   npx ts-node scripts/check-email-imports.ts
   ```

### 5.3 Test Failure Notification

Send an email with:
- Invalid Excel file (corrupted or wrong format)
- Check you receive failure notification email

---

## Phase 6: Deployment (15 minutes)

### 6.1 Add Environment Variables to Production

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Add:
   ```
   RESEND_API_KEY=re_xxxxx
   RESEND_WEBHOOK_SECRET=whsec_xxxxx
   FROM_EMAIL=notifications@yourdomain.com
   ```

**Other platforms:** Use their env var configuration

### 6.2 Update Webhook URL

In Resend Dashboard → Webhooks:
- Change URL from `http://localhost:3000/api/inbound/smartoffice`
- To: `https://yourproductiondomain.com/api/inbound/smartoffice`

### 6.3 Deploy
```bash
git add .
git commit -m "Add email ingestion feature"
git push
```

---

## Troubleshooting

### Issue: Webhook returns 404
**Cause:** Route not publicly accessible
**Fix:** Exclude `/api/inbound/smartoffice` from auth middleware

### Issue: Webhook returns 401
**Cause:** Signature verification (if you added it)
**Fix:** Verify `RESEND_WEBHOOK_SECRET` matches dashboard

### Issue: Email received but not processed
**Cause:** Email address doesn't match database
**Fix:**
```bash
npx ts-node scripts/show-tenant-emails.ts
# Verify exact email address
```

### Issue: Attachments not downloading
**Cause:** Wrong API endpoint or missing auth
**Fix:** Verify using `https://api.resend.com/emails/receiving/{emailId}/attachments/{attachmentId}`

### Issue: No Excel files found
**Cause:** Attachment filtering too strict
**Fix:** Log `payload.data.attachments` to debug

---

## Production Checklist

- [ ] Database migration applied
- [ ] All users/tenants have `inboundEmailAddress` populated
- [ ] Resend account created
- [ ] Resend API key added to env vars
- [ ] Webhook created in Resend
- [ ] Webhook secret added to env vars
- [ ] FROM_EMAIL configured for notifications
- [ ] Webhook route created and deployed
- [ ] Webhook route excluded from auth
- [ ] Dashboard shows email address to users
- [ ] Signup flow generates email for new users
- [ ] Tested with real SmartOffice file
- [ ] Verified import in database
- [ ] Tested failure notification email
- [ ] Production webhook URL updated in Resend
- [ ] Diagnostic scripts available for debugging

---

## Performance Notes

**From Valor production (verified working):**
- Processes 2 Excel files (207 policies + 638 agents) in <10 seconds
- No timeouts or memory issues
- Handles concurrent emails (multiple tenants)
- Resend webhook delivery: <2 seconds

---

## Cost Estimate

**Resend (as of 2024):**
- Free tier: 100 emails/day, 3,000 emails/month
- Paid: $10/month for 50,000 emails
- **Inbound emails:** Free on all plans

**For most use cases:** Free tier is sufficient.

---

## Summary

**Total implementation time:** ~3-4 hours

**Files to create:**
1. Migration for email fields
2. Script to generate email addresses
3. Webhook route handler (`/api/inbound/smartoffice/route.ts`)
4. Dashboard component to display email
5. Two diagnostic scripts

**External dependencies:**
- Resend account (free)
- Environment variables (3 total)

**Maintenance:**
- Near zero (webhook is stateless)
- Monitor Resend logs occasionally

---

## Reference Implementation

**Live example:** Valor Financial Platform
**Verified:** 2026-03-09
**Status:** Production, processing emails successfully
**Code location:** `C:\dev\valor-2\app\api\inbound\smartoffice\route.ts`

---

## Next Steps

After email ingestion is working:

1. **Add email management UI**
   - Toggle email on/off per user
   - Regenerate email address
   - View import history

2. **Add more file formats**
   - Support .csv directly
   - Support .xls (older Excel)

3. **Add email rules**
   - Only process from specific senders
   - Require subject line keyword

4. **Add rate limiting**
   - Limit emails per hour/day
   - Prevent abuse

---

**Questions?** Reference the Valor implementation or check Resend docs at https://resend.com/docs/send-with-nextjs
