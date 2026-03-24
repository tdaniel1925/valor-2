# SmartOffice System Enhancements — PROJECT SPEC

## Gate 0: Vision

### Problem
SmartOffice system is functional (90.3% test pass rate) but has critical stability gaps and missing UX features that prevent it from being production-perfect:
- Column position dependency creates data corruption risk
- No permission checks on manual imports
- No data validation before import
- Missing detail pages for policies/agents
- No import audit trail or history
- Basic sync status with no change details
- No column mapping flexibility

### Users
- Insurance agents (view/analyze their policies)
- Office admins (import/manage data)
- System admins (monitor data quality, audit imports)

### Success Metrics
- Zero data corruption incidents from imports
- 100% of imports have audit trail
- Users can map custom column layouts
- All CRUD operations available (detail pages)
- Import validation catches 95%+ of data issues before commit
- Sync status shows actionable change details

## Gate 1: Architecture

### Stack (Existing)
- Next.js 16.0.10 with App Router
- TypeScript (strict mode)
- Prisma ORM 6.19.0
- PostgreSQL (Supabase)
- React with Tailwind CSS
- Anthropic Claude AI (claude-3-5-sonnet-20241022)

### Data Model Changes

New Table: SmartOfficeImport
- id: String (cuid)
- tenantId: String
- userId: String
- fileName: String
- source: String (manual/email/api)
- status: String (PENDING/PROCESSING/COMPLETED/FAILED)
- importMode: String (REPLACE/MERGE/APPEND/UPDATE)
- recordsTotal: Int
- recordsCreated: Int
- recordsUpdated: Int
- recordsFailed: Int
- errors: Json (array of error objects)
- warnings: Json (array of warning objects)
- columnMapping: Json (column name mappings)
- fileUrl: String (Supabase Storage URL)
- startedAt: DateTime
- completedAt: DateTime
- createdAt: DateTime

Add to SmartOfficePolicy and SmartOfficeAgent:
- importId: String (foreign key)
- lastImport: Relation to SmartOfficeImport

## Gate 2: Features

### Phase 1: Stability (P0 - Must Have)

F1.1: Header-Based Column Parsing
- Parse Excel header row to detect column names
- Match columns by name (case-insensitive, fuzzy match)
- Support common variations (Policy # = Policy Number = PolicyNum)
- Fallback to position-based if headers missing
- Acceptance: Import works with columns in any order

F1.2: Permission Checks
- Check user role before allowing import
- Require ADMIN or MANAGER role for manual imports
- Tenant isolation verified on every import
- Acceptance: Non-admin users get 403 error on import attempt

F1.3: Import Validation
- Pre-import validation screen showing all issues
- Required field checks (policy number, insured name, carrier)
- Data type validation (premium = number, dates = valid dates)
- Duplicate detection within import file
- Validation result categorization (errors vs warnings)
- Block import if any errors, allow import with warnings
- Acceptance: Invalid data caught before commit, clear error messages

F1.4: Visual Column Mapper
- Show detected columns from uploaded file
- Dropdown to map each column to system field
- Support Ignore Column option
- Save mapping templates per tenant
- Auto-apply saved mappings for similar files
- Acceptance: User can upload file with non-standard columns and map correctly

### Phase 2: Core UX (P1 - Should Have)

F2.1: Policy & Agent Detail Pages
- Routes: /smartoffice/policies/[id] and /smartoffice/agents/[id]
- Display all policy/agent fields
- Show related data (agent policies, policy history)
- Edit capability (inline editing with save)
- Delete with confirmation
- Breadcrumb navigation back to dashboard
- Acceptance: Click table row opens detail page, can view/edit all fields

F2.2: Import History & Audit Trail
- New page: /smartoffice/imports
- Table showing all imports with filters
- Columns: Date, User, Source, Mode, Records, Status
- Click row to see import details
- Download original file button
- View errors/warnings from import
- Re-run failed imports
- Acceptance: Every import logged, admins can audit all activity

F2.3: Smart Sync Status
- Enhanced sync status card showing:
  * Last sync timestamp
  * Change summary: Added 5 policies, Updated 12 agents
  * Failed record count with link to errors
  * Progress indicator during active import
- Real-time updates via polling (current 30s interval)
- Click to view full import details
- Acceptance: Users see exactly what changed in each sync

## Gate 3: Implementation Plan

Feature Complexity & Time Estimates:
F1.1: Header-Based Column Parsing (M - 4-6 hours)
F1.2: Permission Checks (S - 1-2 hours)
F1.3: Import Validation (L - 8-10 hours)
F1.4: Column Mapping UI (L - 8-10 hours)
F2.1: Detail Pages (M - 6-8 hours)
F2.2: Import History (L - 8-10 hours)
F2.3: Smart Sync Status (M - 4-6 hours)

Total Estimate: 40-52 hours

Files Modified/Created:
- lib/smartoffice/excel-parser.ts (modify)
- lib/smartoffice/column-matcher.ts (NEW)
- lib/smartoffice/validator.ts (NEW)
- lib/smartoffice/import-service.ts (modify)
- lib/smartoffice/mapping-templates.ts (NEW)
- prisma/schema.prisma (modify)
- app/api/smartoffice/import/route.ts (modify)
- app/api/inbound/smartoffice/route.ts (modify)
- app/api/smartoffice/policies/[id]/route.ts (NEW)
- app/api/smartoffice/agents/[id]/route.ts (NEW)
- app/api/smartoffice/imports/route.ts (NEW)
- app/api/smartoffice/imports/[id]/route.ts (NEW)
- app/api/smartoffice/stats/route.ts (modify)
- app/smartoffice/import/page.tsx (modify)
- app/smartoffice/policies/[id]/page.tsx (NEW)
- app/smartoffice/agents/[id]/page.tsx (NEW)
- app/smartoffice/imports/page.tsx (NEW)
- app/smartoffice/imports/[id]/page.tsx (NEW)
- components/smartoffice/ColumnMapper.tsx (NEW)
- components/smartoffice/PolicyDetail.tsx (NEW)
- components/smartoffice/AgentDetail.tsx (NEW)
- components/smartoffice/ImportHistory.tsx (NEW)
- components/smartoffice/DashboardContent.tsx (modify)
- tests/ (update and add new tests)
