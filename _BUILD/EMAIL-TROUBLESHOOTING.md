# Email Ingestion Troubleshooting Guide

## Current Status
- ✅ Code deployed (commit 1b04781)
- ✅ Environment variables set in Vercel
- ✅ Tenant email addresses generated
- ⏳ Test email sent - **not processed yet**

## Tenant Email Addresses
- **Valor**: `44k9kfz3@reports.valorfs.app`
- **BotMakers**: `cq9tjrga@reports.valorfs.app`

## Diagnostic Steps

### 1. Check Resend Webhook Logs
Go to Resend Dashboard → Webhooks → View logs

**What to look for:**
- Are webhook calls being made?
- What's the response status? (200 = success, 4xx/5xx = error)
- Any error messages in the payload?

### 2. Verify Webhook Configuration
In Resend Dashboard → Webhooks:

**Expected settings:**
- **URL**: `https://valorfs.app/api/inbound/smartoffice`
- **Events**: Check "email.received" or "inbound email"
- **Status**: Active
- **Signing Secret**: `whsec_/IuTVa+jb0zrc4lpR/WcjVJ3Oz7/+1/m`

### 3. Check Inbound Domain Setup
In Resend Dashboard → Domains → Inbound routing:

**Expected:**
- Domain: `reports.valorfs.app`
- Status: Verified
- MX Records: Pointing to Resend servers

**If not set up:**
You need to add DNS MX records for `reports.valorfs.app`

### 4. Check Email Delivery
In Resend Dashboard → Emails:

**What to look for:**
- Does the test email appear in the list?
- What's its status? (delivered, bounced, rejected)
- Any error messages?

### 5. Test Webhook Manually
Use curl to test the webhook endpoint:

```bash
curl -X POST https://valorfs.app/api/inbound/smartoffice \
  -H "Content-Type: application/json" \
  -H "svix-id: test_123" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test" \
  -d '{
    "type": "email.received",
    "data": {
      "to": "44k9kfz3@reports.valorfs.app",
      "from": "test@smartoffice.com",
      "subject": "Test Report",
      "attachments": []
    }
  }'
```

### 6. Check Application Logs
In Vercel Dashboard → your project → Logs:

**What to look for:**
- POST requests to `/api/inbound/smartoffice`
- Any error messages
- Console.log output from the webhook handler

## Common Issues

### Issue: Webhook not receiving calls
**Cause**: Inbound domain not set up or MX records not propagated
**Fix**: Configure `reports.valorfs.app` as inbound domain in Resend

### Issue: Webhook returns 401/403
**Cause**: Signature verification failing
**Fix**: Verify `RESEND_WEBHOOK_SECRET` matches Resend dashboard

### Issue: Email delivered but not processed
**Cause**: Email address doesn't match tenant
**Fix**: Verify email was sent to exact address (e.g., `44k9kfz3@reports.valorfs.app`)

### Issue: Attachments not parsed
**Cause**: No Excel/CSV files attached, or unsupported format
**Fix**: Ensure attachment is .xlsx, .xls, or .csv

## Debug Scripts

Run these to check system state:

```bash
# Check for any email imports
npx ts-node scripts/check-email-imports.ts

# Check recent sync activity
npx ts-node scripts/check-recent-syncs.ts

# View tenant email addresses
npx ts-node scripts/show-tenant-emails.ts
```

## Next Actions
1. Check Resend webhook logs first (most likely issue)
2. Verify inbound domain configuration
3. Share findings for further troubleshooting
