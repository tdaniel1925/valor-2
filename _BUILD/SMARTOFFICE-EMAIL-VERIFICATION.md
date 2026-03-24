# SmartOffice Email-to-Dashboard Verification Guide

**Status:** ⚠️ **NEEDS MANUAL VERIFICATION**

The automated tests verified the UI components work, but we need to verify the **COMPLETE email processing flow** actually works end-to-end.

---

## What We've Tested ✅

1. **UI Components** - All dashboard cards, tables, charts work correctly (66/72 tests passed)
2. **API Endpoints** - Stats, policies, agents APIs return data correctly
3. **Database Schema** - All tables have correct structure and relationships
4. **Tenant Isolation** - Multi-tenancy works correctly
5. **Code Quality** - Import service, parser, validator all have correct logic

## What We Haven't Tested ❌

1. **Actual Email Receipt** - Does sending an email actually trigger the webhook?
2. **File Download from Storage** - Does the webhook successfully download the file?
3. **Real Spreadsheet Processing** - Does a real Excel file from email get parsed?
4. **Data Appearing on Dashboard** - After email, do the numbers update?
5. **REPLACE Mode** - Does new data replace old data correctly?

---

## Manual Verification Steps

### Step 1: Get Your SmartOffice Email Address

1. Log into your tenant account
2. Go to `/smartoffice`
3. Look for the "Inbound Email" card
4. Your email should be something like: `yourslug-smartoffice@valortest.com`

**Current production domain:** Check your environment variables for `INBOUND_EMAIL_DOMAIN`

### Step 2: Prepare a Test Spreadsheet

Create an Excel file with these columns:

**For Policies:**
```
Policy # | Primary Advisor | Product Name | Carrier Name | Primary Insured | Status Date | Type | Target Amount | Comm Annualized Prem | Status
POL-001  | John Smith      | Whole Life   | Test Carrier | Bob Johnson     | 2024-03-01  | WHOLE_LIFE | 500000 | 12000 | INFORCE
POL-002  | Jane Doe        | Term Life 20 | Guardian     | Sarah Williams  | 2024-03-02  | TERM_LIFE  | 750000 | 8500  | INFORCE
POL-003  | Mike Chen       | Universal    | MetLife      | David Lee       | 2024-03-03  | UNIVERSAL_LIFE | 1000000 | 15000 | PENDING
```

**For Agents:**
```
Last Name | First Name | Email | Phones | Supervisor | NPN
Smith     | John       | john@test.com | (555) 123-4567 | Manager | 12345678
Doe       | Jane       | jane@test.com | (555) 234-5678 | Manager | 23456789
```

### Step 3: Send the Email

1. **From:** Your email address
2. **To:** `{your-tenant-slug}-smartoffice@valortest.com`
3. **Subject:** SmartOffice Data Upload
4. **Attachment:** Your Excel file (policies.xlsx or agents.xlsx)
5. **Send!**

### Step 4: Monitor Processing

**Check Supabase Storage:**
1. Go to Supabase Dashboard → Storage → `smartoffice-reports`
2. Look for folder: `{your-tenant-id}/`
3. Your file should appear there within 1-2 minutes

**Check Webhook Logs:**
Run this SQL in Supabase SQL Editor:
```sql
SELECT
  id,
  tenant_id,
  sync_type,
  status,
  records_created,
  records_failed,
  files_processed_list,
  triggered_by,
  created_at
FROM smartoffice_sync_logs
WHERE tenant_id = '{your-tenant-id}'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
- `status` = 'success'
- `records_created` = number of rows in your spreadsheet
- `triggered_by` = 'webhook'
- `files_processed_list` contains your filename

### Step 5: Verify Dashboard Updates

1. Go to `/smartoffice` dashboard
2. **Check Stats Cards:**
   - Total Policies should match your data
   - Total Premium should be sum of all premiums
   - Last Sync should show recent timestamp

3. **Check Policies Tab:**
   - Click "Policies" tab
   - Should see your policies listed
   - Policy numbers should match your spreadsheet
   - Premiums should be formatted correctly

4. **Check Agents Tab:**
   - Click "Agents" tab
   - Should see your agents listed
   - Names, emails should match

5. **Check Charts:**
   - Premium Trend should show data points
   - Carrier Breakdown should show your carriers
   - Agent Performance should show your advisors

### Step 6: Test REPLACE Mode

1. Create a NEW Excel file with DIFFERENT data:
```
Policy # | Primary Advisor | Product Name | Carrier Name | Primary Insured | Status Date | Type | Target Amount | Comm Annualized Prem | Status
POL-101  | New Advisor     | New Product  | New Carrier  | New Client      | 2024-03-10  | WHOLE_LIFE | 600000 | 13000 | INFORCE
```

2. Send this to the same SmartOffice email
3. Wait 2-3 minutes
4. Refresh dashboard

**Expected Result:**
- Old policies (POL-001, POL-002, POL-003) should be GONE
- New policy (POL-101) should be the ONLY one visible
- Total Policies count should be 1
- Total Premium should be $13,000

This confirms REPLACE mode is working (deletes old data before importing new).

---

## Verification Checklist

Use this checklist to confirm everything works:

### Email Processing
- [ ] Email sent to SmartOffice address
- [ ] File appears in Supabase Storage within 2 minutes
- [ ] Webhook processes file (check sync logs)
- [ ] No errors in webhook processing

### Data Import
- [ ] Records created in database (check sync logs)
- [ ] Policy count matches spreadsheet row count
- [ ] Agent count matches spreadsheet row count
- [ ] No failed records in sync logs

### Dashboard Display
- [ ] Stats card "Total Policies" shows correct number
- [ ] Stats card "Total Agents" shows correct number
- [ ] Stats card "Total Premium" shows correct sum
- [ ] Stats card "Last Sync" shows recent timestamp
- [ ] Policies table shows all imported policies
- [ ] Agents table shows all imported agents
- [ ] Policy numbers match spreadsheet exactly
- [ ] Premium amounts match spreadsheet exactly
- [ ] Advisor names match spreadsheet exactly

### Charts
- [ ] Premium Trend chart displays data
- [ ] Carrier Breakdown shows correct carriers
- [ ] Agent Performance shows correct advisors
- [ ] Status Funnel shows correct statuses

### REPLACE Mode
- [ ] Send new spreadsheet with different data
- [ ] Old data is completely removed
- [ ] Only new data is visible
- [ ] Stats reflect new data only

### Tenant Isolation
- [ ] Data only visible to your tenant
- [ ] Other tenants cannot see your policies/agents
- [ ] SmartOffice email is unique per tenant

---

## Troubleshooting

### File doesn't appear in Storage
**Check:**
- Is your email domain configured correctly? (INBOUND_EMAIL_DOMAIN)
- Is Supabase email forwarding set up?
- Check spam folder

### Webhook doesn't process
**Check:**
- Run SQL: `SELECT * FROM smartoffice_sync_logs WHERE triggered_by = 'webhook' ORDER BY created_at DESC LIMIT 5`
- Look for errors in `errors` column
- Check webhook URL is accessible

### Data doesn't appear on dashboard
**Check:**
- Did webhook succeed? (check sync logs)
- Is tenant ID correct?
- Try refreshing page (F5)
- Check browser console for errors

### Wrong data appears
**Check:**
- Are you logged into the correct tenant?
- Check tenant isolation by looking at tenant_id in database
- Verify no cross-tenant data leakage

---

## Database Queries for Verification

### Check if policies were imported
```sql
SELECT
  policy_number,
  primary_advisor,
  carrier_name,
  comm_annualized_prem,
  created_at
FROM smartoffice_policies
WHERE tenant_id = '{your-tenant-id}'
ORDER BY created_at DESC
LIMIT 20;
```

### Check if agents were imported
```sql
SELECT
  full_name,
  email,
  npn,
  created_at
FROM smartoffice_agents
WHERE tenant_id = '{your-tenant-id}'
ORDER BY created_at DESC
LIMIT 20;
```

### Check import history
```sql
SELECT
  id,
  file_name,
  source,
  status,
  records_created,
  records_failed,
  validation_errors,
  created_at
FROM smartoffice_imports
WHERE tenant_id = '{your-tenant-id}'
ORDER BY created_at DESC
LIMIT 10;
```

### Check sync logs
```sql
SELECT
  sync_type,
  status,
  records_created,
  duration,
  errors,
  triggered_by,
  created_at
FROM smartoffice_sync_logs
WHERE tenant_id = '{your-tenant-id}'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Success Criteria

The SmartOffice email-to-dashboard flow is **100% working** if:

1. ✅ Email arrives and file appears in Storage
2. ✅ Webhook processes within 5 seconds
3. ✅ All records imported successfully (0 failed)
4. ✅ Dashboard shows updated stats immediately
5. ✅ Policies/Agents tables show correct data
6. ✅ Charts reflect the new data
7. ✅ REPLACE mode removes old data
8. ✅ Only your tenant sees the data
9. ✅ AI chat can query the new data
10. ✅ Search/filter works on imported data

---

## Current Status

**Automated Tests:** ✅ 66/72 tests passing (91%)
**Integration Flow:** ⚠️ **NEEDS MANUAL TESTING**

**Next Step:** Follow this guide to manually verify the email-to-dashboard flow works correctly with real data.
