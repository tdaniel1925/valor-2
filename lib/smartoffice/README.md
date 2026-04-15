# SmartOffice Data Architecture

## Single Source of Truth

All SmartOffice data now flows through a **unified data service** that treats the SmartOffice spreadsheet imports as the single source of truth.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│           SmartOffice Excel Spreadsheet                 │
│     (Uploaded via /api/smartoffice/import)              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         excel-parser.ts + import-service.ts             │
│         Parse & Validate Spreadsheet Data               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE TABLES                            │
│  ┌──────────────────┐   ┌──────────────────┐          │
│  │ SmartOfficePolicy│   │ SmartOfficeAgent │          │
│  │  (Policies)      │   │    (Agents)      │          │
│  └──────────────────┘   └──────────────────┘          │
│          ▲                       ▲                      │
│          │                       │                      │
│   SINGLE SOURCE OF TRUTH   SINGLE SOURCE OF TRUTH      │
└──────────┼───────────────────────┼─────────────────────┘
           │                       │
           ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│              data-service.ts                            │
│        Unified Query Layer (lib/smartoffice/)           │
│   - getPolicies()                                       │
│   - getPolicyById()                                     │
│   - getPolicyByNumber()                                 │
│   - getAgents()                                         │
│   - getAgentById()                                      │
│   - getPolicyStats()                                    │
│   - getAgentStats()                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├──────────────────┬──────────────────────┐
                 ▼                  ▼                      ▼
        ┌────────────────┐ ┌────────────────┐  ┌────────────────┐
        │ /api/cases/    │ │ /api/smart     │  │ Other          │
        │   policies     │ │   office/      │  │ Endpoints      │
        │                │ │   agents       │  │                │
        └────────────────┘ └────────────────┘  └────────────────┘
```

## Key Components

### 1. Data Storage (Database)

**`SmartOfficePolicy` table** - Stores all policy data from SmartOffice reports
- Primary key: `id` (UUID)
- Unique constraint: `policyNumber`
- Tenant-scoped with RLS (Row Level Security)
- Full-text search via `searchText` field
- Tracks import metadata (`sourceFile`, `lastSyncDate`, `importId`)

**`SmartOfficeAgent` table** - Stores all agent data from SmartOffice reports
- Primary key: `id` (UUID)
- Tenant-scoped with RLS
- Full-text search via `searchText` field
- Tracks import metadata

### 2. Data Service Layer (`lib/smartoffice/data-service.ts`)

This is the **unified query interface** that all endpoints must use to access SmartOffice data.

#### Policy Functions:
- `getPolicies(tenantId, filters)` - Get all policies with filtering, searching, sorting
- `getPolicyById(tenantId, policyId)` - Get single policy by ID
- `getPolicyByNumber(tenantId, policyNumber)` - Get policy by policy number
- `getPolicyStats(tenantId)` - Get aggregate statistics

#### Agent Functions:
- `getAgents(tenantId, filters)` - Get all agents with pagination, search, filters
- `getAgentById(tenantId, agentId)` - Get single agent by ID
- `getAgentStats(tenantId)` - Get agent statistics

#### Why This Matters:
1. **Consistency** - All endpoints return the same data structure
2. **Maintainability** - Business logic lives in one place
3. **Type Safety** - TypeScript interfaces ensure data shape consistency
4. **Performance** - Query optimization happens in one place
5. **Tenant Isolation** - RLS enforcement through `withTenantContext`

### 3. API Endpoints

All SmartOffice-related endpoints now use the data service:

**`/api/cases/policies`** - List all policies (used by Cases page)
```typescript
import { getPolicies } from '@/lib/smartoffice/data-service';

const result = await getPolicies(tenantId, {
  agent: 'John Doe',
  carrier: 'Life Co',
  status: 'INFORCE',
  search: 'policy123',
  sortBy: 'statusDate',
  sortOrder: 'desc',
});
```

**`/api/smartoffice/agents`** - List all agents
```typescript
import { getAgents } from '@/lib/smartoffice/data-service';

const result = await getAgents(tenantId, {
  page: 1,
  limit: 50,
  search: 'Jane',
  supervisor: 'Manager Name',
});
```

## Import Strategy

**REPLACE MODE** (Current Implementation):
- When a new SmartOffice report is uploaded, **all existing data is deleted**
- New data from the spreadsheet replaces it completely
- This ensures the database always matches the latest SmartOffice report
- No stale data, no orphaned records

```typescript
// From lib/smartoffice/import-service.ts
await db.smartOfficePolicy.deleteMany({ where: { tenantId } });
// Then insert all new records
```

## Data Flow Example

### Uploading a SmartOffice Report:

1. User uploads Excel file to `/api/smartoffice/import`
2. `excel-parser.ts` parses the spreadsheet
3. `validator.ts` validates the data
4. `import-service.ts` deletes old data and inserts new data
5. All endpoints instantly see the updated data via `data-service.ts`

### Viewing Policies:

1. User navigates to `/cases` page
2. Frontend calls `/api/cases/policies`
3. API endpoint calls `getPolicies(tenantId, filters)`
4. Data service queries `SmartOfficePolicy` table with tenant context
5. Results returned to frontend with proper type safety

## Benefits of This Architecture

### ✅ Single Source of Truth
- SmartOffice spreadsheet is the authoritative data source
- No data duplication between tables
- No sync issues or stale data

### ✅ Simplified Maintenance
- One place to update query logic
- Easy to add new endpoints that need policy/agent data
- Centralized error handling and logging

### ✅ Type Safety
- TypeScript interfaces ensure consistent data shapes
- Compile-time errors if data structure changes
- IDE autocomplete for all data fields

### ✅ Tenant Isolation
- All queries automatically scoped to tenant via RLS
- No risk of cross-tenant data leakage
- Security enforced at database level

### ✅ Development Mode Support
- Easy to bypass authentication for local testing
- All data visible in development mode
- Production auth still enforced

## Migration Notes

### Deprecated: Direct Prisma Queries

❌ **DO NOT** query `SmartOfficePolicy` or `SmartOfficeAgent` directly from API routes:

```typescript
// DON'T DO THIS:
const policies = await prisma.smartOfficePolicy.findMany({ ... });
```

✅ **DO** use the data service:

```typescript
// DO THIS:
import { getPolicies } from '@/lib/smartoffice/data-service';
const result = await getPolicies(tenantId, filters);
```

### Legacy `Case` Table

The `Case` table still exists for operational workflow data (notes, commissions, etc.), but **policy display data comes from `SmartOfficePolicy`**.

In the future, the `Case` table can be linked to `SmartOfficePolicy` via `policyNumber` for operational tracking while keeping the spreadsheet as the source of truth for display data.

## Future Enhancements

### Potential Improvements:
1. **Incremental Updates** - Instead of REPLACE mode, support UPSERT mode
2. **Change Tracking** - Log what changed between imports
3. **Data Versioning** - Keep history of previous imports
4. **Real-time Sync** - WebSocket notifications when data changes
5. **Caching Layer** - Redis cache for frequently accessed data
6. **GraphQL API** - Unified query interface with field selection

## Files in This Module

```
lib/smartoffice/
├── README.md              (This file - Architecture overview)
├── data-service.ts        (Unified query interface - SINGLE SOURCE OF TRUTH)
├── excel-parser.ts        (Parse Excel files)
├── import-service.ts      (Import data to database)
├── validator.ts           (Validate parsed data)
└── column-matcher.ts      (Map Excel columns to database fields)
```

## For Developers

### Adding a New Endpoint That Needs Policy Data:

```typescript
// app/api/my-new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPolicies } from '@/lib/smartoffice/data-service';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';

export async function GET(request: NextRequest) {
  const tenantContext = getTenantFromRequest(request);

  // Get policies using the unified data service
  const result = await getPolicies(tenantContext.tenantId, {
    status: 'INFORCE',
    sortBy: 'premium',
    sortOrder: 'desc',
  });

  // Do something with result.policies
  return NextResponse.json({ data: result.policies });
}
```

### Adding a New Filter/Sort Option:

1. Update `PolicyFilters` type in `data-service.ts`
2. Add query logic to `getPolicies()` function
3. All endpoints get the new filter automatically

## Questions?

See the inline documentation in `lib/smartoffice/data-service.ts` for detailed function signatures and usage examples.
