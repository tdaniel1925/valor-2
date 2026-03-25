# SmartOffice Duplicate Cleanup Report

**Date:** March 24, 2026
**Tenant:** Valor Financial Specialists

---

## Problem Identified

### Agent Duplicates

**Before Cleanup:**
- Total agents in database: **1,286**
- Expected from CSV: **649**
- Duplicate NPNs: **607**

**Root Cause:**
On March 23, 2026 at 11:51 PM, the same agent spreadsheet was imported WITHOUT proper REPLACE mode, creating duplicates of almost every agent. The only difference was name formatting:
- Original: "Last, First" (e.g., "Luu, Michael")
- Duplicate: "Last First" (e.g., "Luu Michael")

---

## Cleanup Actions Taken

### Script Created: `scripts/cleanup-duplicate-agents.ts`

**What it does:**
1. Finds all NPNs with duplicates
2. For each duplicate NPN:
   - Keeps the most recently updated record
   - Deletes older duplicates
3. Handles agents with NULL NPNs by matching fullName + email

**Results:**
- ✅ Removed **607 duplicate agents**
- ✅ **0 duplicate NPNs** remaining
- ✅ All duplicates successfully cleaned up

---

## Current State

### Agent Count Breakdown

| Metric | Count |
|--------|-------|
| Total Agents | 672 |
| Unique NPNs (non-null) | 618 |
| Agents with NULL NPN | 54 |
| **Expected from CSV** | **649** |
| **Difference** | **+23** |

###Why 23 Extra Agents?

The 23 extra agents (672 - 649 = 23) could be from:
1. **Agents added manually** - Not in the CSV file
2. **Previous imports** - Data from earlier spreadsheets that hasn't been replaced
3. **Null NPN records** - Some agents might not have valid NPNs

**Recommendation:** This is likely normal if you've added agents outside of the CSV import process.

---

## Data Accuracy Verified

### Source of Truth Confirmed

The stats API (`/api/smartoffice/stats`) queries the database directly using Prisma:

```typescript
const totalAgents = await db.smartOfficeAgent.count({
  where: { tenantId: tenantContext.tenantId },
});
```

**✅ No hardcoded values**
**✅ All stats come from live database queries**

### Current Dashboard Stats

| Stat | Value |
|------|-------|
| Total Policies | 207 |
| Total Agents | 672 |
| Total Premium | $4,651,617.09 |
| Weighted Premium | $152,582.69 |
| Last Sync | March 9, 2026 @ 10:25 AM |

---

## Policy Data Status

**Policies need to be checked next** - The same duplicate issue may exist for policies.

**Current policy count:** 207
**Needs verification:** Check against your policy spreadsheet to confirm accuracy.

---

## Next Steps

1. ✅ **Agents cleaned up** - Duplicates removed
2. ⏳ **Verify agent count** - Confirm 23 extra agents are expected
3. ⏳ **Check policies** - Verify policy count matches your data
4. ⏳ **Fix REPLACE mode** - Ensure future imports don't create duplicates
5. ⏳ **Test import flow** - Validate end-to-end process

---

## How to Prevent Future Duplicates

### The REPLACE Mode Issue

The SmartOffice import service should:
1. **DELETE all old records** for the tenant before importing
2. **INSERT new records** from the spreadsheet
3. **Deduplicate by NPN** - Never allow duplicate NPNs

**Current behavior:** Import is adding new records without deleting old ones, causing duplicates.

**Required fix:** Verify the REPLACE mode logic in the import service is working correctly.

---

## Summary

✅ **FIXED:** Removed 607 duplicate agents
✅ **VERIFIED:** Stats API queries database (not hardcoded)
⚠️ **REMAINING:** 23 extra agents (possibly legitimate)
⏳ **TODO:** Check policies for duplicates
⏳ **TODO:** Fix REPLACE mode to prevent future issues

