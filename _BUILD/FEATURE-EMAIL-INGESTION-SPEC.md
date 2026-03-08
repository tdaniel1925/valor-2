# SmartOffice Email Ingestion Automation — FEATURE SPEC

## Gate 0: Vision

### Problem
Current SmartOffice import requires **manual file upload**:
- Users must download Excel from SmartOffice email
- Log into Valor platform
- Navigate to import page
- Upload file manually

This creates friction and prevents **true automation** of the SmartOffice data pipeline.

### Solution
**Automated email ingestion**: SmartOffice sends reports → Resend receives → webhook triggers → data appears in dashboard automatically.

### Users
Insurance agency users who receive SmartOffice reports via email and want hands-free synchronization.

### Success Metrics
1. **Import speed**: <30 seconds from email receipt to database update
2. **Reliability**: 99%+ success rate for valid Excel files
3. **User adoption**: 80%+ of tenants configure email forwarding within first week
4. **Error visibility**: 100% of failures notify all tenant users within 1 minute

---

## Gate 1: Architecture

### Email Flow
```mermaid
graph LR
    A[SmartOffice] -->|Sends Report| B[reports.valorfs.app]
    B -->|Resend Inbound| C[/api/inbound/smartoffice]
    C -->|Extract Attachments| D[Process Excel Files]
    D -->|Success| E[Import to Database]
    D -->|Failure| F[Email All Tenant Users]
    E --> G[Update SmartOfficeSyncLog]
    F --> G
    G --> H[Dashboard Shows New Data]
```

### Technology Choices
- **Inbound Email**: Resend Inbound (already using Resend for outbound)
- **Email Addresses**: Random 8-character alphanumeric per tenant (e.g., `a7f3k2x9@reports.valorfs.app`)
- **Attachment Processing**: In-memory (no Storage bucket needed)
- **Import Logic**: Reuse existing `lib/smartoffice/import-service.ts`
- **Notifications**: Resend email API (already integrated)

### Data Model Changes

**Add to `Tenant` model:**
```prisma
model Tenant {
  // ... existing fields ...

  // Email ingestion
  inboundEmailAddress  String?  @unique  // Random address like "a7f3k2x9"
  inboundEmailEnabled  Boolean  @default(true)

  // ... rest of model ...
}
```

**No other schema changes needed** - reuse `SmartOfficeSyncLog` for tracking.

---

## Gate 2: Features

### P0 (Must Have)
1. **Generate Inbound Email Address** (on tenant creation or migration)
   - 8-character random alphanumeric (lowercase + numbers)
   - Check uniqueness before saving
   - Store in `Tenant.inboundEmailAddress`
   - Full email: `{inboundEmailAddress}@reports.valorfs.app`

2. **Resend Inbound Webhook Handler** (`/api/inbound/smartoffice`)
   - Validate webhook signature (Resend security)
   - Extract recipient (`to` field) → match to tenant
   - Extract all Excel/CSV attachments from email
   - Process each attachment sequentially
   - Return 200 OK (Resend requirement)

3. **Process Attachments**
   - For each `.xlsx`, `.xls`, or `.csv` file:
     - Decode base64 attachment
     - Pass to existing `parseSmartOfficeExcel()` function
     - Call existing `importSmartOfficeData()` function
     - Create `SmartOfficeSyncLog` entry with source="EMAIL"
   - Track success/failure per file

4. **Failure Notifications**
   - If ANY file fails to import:
     - Get all users for tenant
     - Send email to each user with:
       - Error message
       - File name
       - Link to manual upload page
   - Use existing Resend integration

5. **Display Email Address** (2 locations)
   - **Dashboard**: Add widget/card showing "Your SmartOffice Email: `a7f3k2x9@reports.valorfs.app`" with copy button
   - **Settings Page**: Add section in SmartOffice settings with same info + instructions

6. **Migration Script**
   - Generate `inboundEmailAddress` for all existing tenants
   - Ensure no duplicates

### P1 (Nice to Have)
- Rate limiting (max emails per tenant per hour)
- Attachment size validation (reject >50MB)
- Email subject line in sync log

### P2 (Future)
- Allow multiple email addresses per tenant
- Email address regeneration (invalidate old, create new)
- Sender whitelist configuration

---

## Gate 3: Implementation Plan

### Dependency Order

**Step 1: Database Migration** (Complexity: S)
- Add `inboundEmailAddress` and `inboundEmailEnabled` to `Tenant`
- Run migration
- **Files**: `prisma/schema.prisma`, migration file

**Step 2: Email Generator Utility** (Complexity: S)
- Create `lib/email/generate-inbound-address.ts`
- Random alphanumeric generator (8 chars)
- Uniqueness check against database
- **Files**: 1 new

**Step 3: Migration Script** (Complexity: S)
- Script to populate `inboundEmailAddress` for existing tenants
- **Files**: `scripts/generate-inbound-emails.ts`

**Step 4: Resend Inbound Webhook** (Complexity: M)
- Create `/api/inbound/smartoffice/route.ts`
- Parse Resend webhook payload
- Extract attachments (base64 decode)
- Match recipient to tenant
- Process each Excel/CSV file
- Send failure notifications
- Log to `SmartOfficeSyncLog`
- **Files**: 1 new

**Step 5: UI Components** (Complexity: S)
- Dashboard widget: `components/smartoffice/InboundEmailCard.tsx`
- Settings section: update `app/settings/smartoffice/page.tsx` (or create if doesn't exist)
- Copy-to-clipboard functionality
- **Files**: 1-2 new/modified

**Step 6: Resend Configuration** (Complexity: Manual)
- Add inbound domain in Resend dashboard: `reports.valorfs.app`
- Configure DNS (MX records)
- Set webhook URL: `https://valorfs.app/api/inbound/smartoffice`
- **Files**: None (external configuration)

**Step 7: Testing** (Complexity: M)
- Send test email with sample Excel attachment
- Verify import works
- Test failure notification
- Verify both UI locations show address
- **Files**: Test email + manual verification

---

## Gate 4: Infrastructure

### Environment Variables
```bash
# Resend (already configured)
RESEND_API_KEY=re_...
FROM_EMAIL=notifications@valorfs.app

# New (optional - for webhook signature validation)
RESEND_WEBHOOK_SECRET=whsec_...
```

### Resend Inbound Configuration

**Domain Setup:**
1. Add inbound domain: `reports.valorfs.app`
2. Configure MX records in DNS:
   ```
   Type: MX
   Name: reports.valorfs.app
   Value: inbound-smtp.resend.com
   Priority: 10
   ```
3. Wait for DNS propagation (can take 1-24 hours)

**Webhook Setup:**
1. Create webhook endpoint in Resend dashboard
2. URL: `https://valorfs.app/api/inbound/smartoffice`
3. Events: `email.received`
4. Get signing secret → add to `.env` as `RESEND_WEBHOOK_SECRET`

### Deployment Steps
1. Deploy database migration to production
2. Run migration script to generate email addresses
3. Configure Resend inbound domain + webhook
4. Deploy API route + UI updates
5. Test with real SmartOffice email

---

## Gate 5: Launch Checklist

### Security
- [x] Webhook signature validation (Resend HMAC)
- [x] Tenant isolation (only import to correct tenant)
- [x] File type validation (only .xlsx, .xls, .csv)
- [x] Unique email addresses (no collisions)
- [x] Rate limiting considerations (P1 - can add later)

### Performance
- [x] In-memory attachment processing (no disk I/O)
- [x] Reuse existing import logic (no duplication)
- [x] Background processing consideration (webhook must return 200 quickly)
- [ ] Consider job queue if imports take >10 seconds (NextJS timeout)

### User Experience
- [x] Clear instructions on where to find email address
- [x] Copy-to-clipboard for easy sharing
- [x] Failure notifications with actionable info
- [x] Silent success (no email spam)

### Monitoring
- [x] SmartOfficeSyncLog tracks all imports (source="EMAIL")
- [x] Error emails notify users of failures
- [ ] Optional: Sentry integration for webhook errors (future)

### Documentation
- [ ] Update `README.md` with Resend Inbound setup instructions
- [ ] Add to `_BUILD/STARTUP.md` for new environments
- [ ] User-facing docs: "How to configure SmartOffice email forwarding"

---

## Acceptance Criteria

**✅ Feature complete when:**
1. Existing tenants have `inboundEmailAddress` populated
2. New tenants get email address on signup
3. Email address visible on dashboard + settings with copy button
4. Sending email with Excel attachment to `{address}@reports.valorfs.app` triggers import
5. Data appears in SmartOffice dashboard within 30 seconds
6. Failed imports send email to all tenant users
7. `SmartOfficeSyncLog` shows source="EMAIL" for email imports
8. Resend inbound domain configured and DNS propagated

---

## File Summary

**Files to Create (5):**
1. `lib/email/generate-inbound-address.ts` - Random address generator
2. `scripts/generate-inbound-emails.ts` - Migration script for existing tenants
3. `app/api/inbound/smartoffice/route.ts` - Resend webhook handler
4. `components/smartoffice/InboundEmailCard.tsx` - Dashboard widget
5. Migration file for Tenant schema

**Files to Modify (2-3):**
1. `prisma/schema.prisma` - Add Tenant fields
2. `app/smartoffice/page.tsx` OR create new settings page - Show email address
3. `app/api/auth/signup/route.ts` - Generate email address on tenant creation

**Total Complexity**: Medium (M)
**Estimated Duration**: 4-6 hours (single session)

---

## Risks & Mitigations

### Risk 1: DNS Propagation Delay
- **Impact**: Email won't work until MX records propagate (1-24 hours)
- **Mitigation**: Configure DNS first, test with `dig` before deploying code

### Risk 2: Large Attachments
- **Impact**: Files >10MB might timeout webhook
- **Mitigation**: P1 feature - reject files >50MB, return error to Resend

### Risk 3: Webhook Failures
- **Impact**: Resend will retry, might duplicate imports
- **Mitigation**: `importSmartOfficeData()` already uses upsert logic (idempotent)

### Risk 4: Malicious Emails
- **Impact**: Spam or malware sent to random addresses
- **Mitigation**:
  - Random 8-char addresses hard to guess (62^8 = 218 trillion combinations)
  - File type validation
  - Excel parsing errors caught and logged
  - No arbitrary code execution

---

**Last Updated**: 2026-03-08
**Status**: SPEC COMPLETE - Ready for GO
