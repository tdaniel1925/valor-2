# BUILD PROMPT — Feature 5.5: Saved Filter Presets

## What and Why

Users repeatedly apply the same filter combinations (e.g., "Pending >7 days", "Inforce by Top Agent"). This feature lets them save filter states with custom names for one-click reuse.

Saves time, reduces errors, and makes the dashboard more personalized.

## Current Codebase State

- Dashboard has comprehensive filtering (status, carrier, agent, date range, search, sort)
- Filters managed via URL search params in `components/smartoffice/FilterPanel.tsx`
- Filter state synced with `app/smartoffice/page.tsx` via useSearchParams
- All 3 previous features (5.1, 5.2, 5.3) complete and working
- Database uses Prisma with multi-tenant architecture (tenantId on all models)
- User auth context available via `lib/auth-context.ts`

## Reference Docs Consulted

- `_BUILD/PHASE-5-SPEC.md` - Complete specification for Feature 5.5
- Existing `components/smartoffice/FilterPanel.tsx` - Current filter implementation
- Existing database schema in `prisma/schema.prisma` - Tenant and User models

## Steps in Order

### 1. Database Schema (prisma/schema.prisma)

Add SavedFilter model:
```prisma
model SavedFilter {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String

  name        String   // User-defined name like "Pending >7 days"
  filters     Json     // Stores { status, carrier, agent, dateFrom, dateTo, search, sortBy, sortOrder }
  isDefault   Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tenantId, userId])
  @@map("saved_filters")
}
```

Add relation to Tenant model:
```prisma
savedFilters SavedFilter[]
```

Add relation to User model:
```prisma
savedFilters SavedFilter[]
```

### 2. API Routes

**`app/api/smartoffice/saved-filters/route.ts`** - List and create
- GET: List all saved filters for current user (ordered by createdAt desc)
- POST: Create new saved filter (validate name, filters object)

**`app/api/smartoffice/saved-filters/[id]/route.ts`** - Update and delete
- PUT: Update filter name or filters object (only by owner)
- DELETE: Delete filter (only by owner)

### 3. Save Filter Dialog Component

**`components/smartoffice/SaveFilterDialog.tsx`** - Modal for saving current filter state

### 4. Saved Filters Dropdown Component

**`components/smartoffice/SavedFilters.tsx`** - Display and apply saved filters

### 5. Update FilterPanel Component

**`components/smartoffice/FilterPanel.tsx`** - Add "Save Current Filter" button

### 6. Update Dashboard to Show Saved Filters

**`components/smartoffice/DashboardContent.tsx`** - Add SavedFilters component to header

## CodeBakers Patterns

**Multi-tenancy:**
- All queries filtered by tenantId
- User can only see/edit their own saved filters
- RLS enforced at database level

**State Management:**
- Filter state in URL params (existing)
- Saved filters fetched on mount
- Apply filter = update URL params (existing mechanism)

**Error Handling:**
- Loading states with spinners
- Empty states (no saved filters)
- Error messages in dialogs
- Confirmation for destructive actions

**Validation:**
- Name required and trimmed
- Filters object validated as object type
- Ownership checked on update/delete

**UI Patterns:**
- Modal dialog for saving
- Dropdown menu for applying
- Star icon for default filter
- Hover actions for edit/delete
- Disabled states during operations

## What NOT to Do

- Don't allow saving empty filter sets (disable button)
- Don't allow duplicate filter names (not enforced - user choice)
- Don't reload page after apply (use router.push)
- Don't show SavedFilters if user has none
- Don't hardcode filter field names (use Object.entries)

## Verification Checklist

1. ✅ Prisma schema includes SavedFilter model with proper relations
2. ✅ Migration file created (will run when DB available)
3. ✅ GET /api/smartoffice/saved-filters returns user's saved filters
4. ✅ POST /api/smartoffice/saved-filters creates filter with validation
5. ✅ PUT /api/smartoffice/saved-filters/[id] updates filter (owner only)
6. ✅ DELETE /api/smartoffice/saved-filters/[id] deletes filter (owner only)
7. ✅ Setting new default unsets previous default
8. ✅ SaveFilterDialog shows current filter preview
9. ✅ SaveFilterDialog validates name before saving
10. ✅ SavedFilters dropdown shows all user's filters
11. ✅ Clicking filter in dropdown applies it (updates URL)
12. ✅ Star icon toggles default status
13. ✅ Delete icon removes filter with confirmation
14. ✅ "Save Filter" button disabled when no filters active
15. ✅ All components properly typed with TypeScript
16. ✅ Mobile-responsive design
17. ✅ Loading and error states handled
18. ✅ Tenant isolation enforced
