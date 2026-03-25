# Status Column Migration Instructions

## What This Does

Changes the `status` column in the `smartoffice_policies` table from a restricted ENUM to a free TEXT field. This allows the system to accept **any status value** from your SmartOffice spreadsheets without mapping them to predefined values.

## Before Migration

Statuses were limited to: `ACTIVE`, `PENDING`, `ISSUED`, `INFORCE`, `DECLINED`, `LAPSED`, `SURRENDERED`, `UNKNOWN`

Any other status from spreadsheets would be saved as `UNKNOWN`.

## After Migration

The system will preserve **exact status values** from your spreadsheets:
- "Approved - Awaiting Funds"
- "Incomplete"
- "Approved - Awaiting Reqs"
- "Not Taken"
- "Closed"
- "Approved-Conditional"
- "Await Approval"
- "Reissue Requested"
- etc.

## How to Apply

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/buteoznuikfowbwofabs/sql/new

2. Copy and paste the SQL from `change_status_to_string.sql`

3. Click "Run"

4. Verify success by checking the table schema

### Option 2: Command Line (if you have direct database access)

```bash
psql $DATABASE_URL < prisma/migrations/change_status_to_string.sql
```

## After Migration

1. **Re-import your data** using the admin panel or auto-import script
2. All policies will now show their exact status from the spreadsheet
3. No more "UNKNOWN" statuses!

## Rollback (if needed)

If you need to rollback, you'll need to:
1. Recreate the ENUM type
2. Convert the text column back to ENUM
3. Map any new status values back to ENUM values

**Note:** It's recommended to keep the TEXT column for flexibility.
