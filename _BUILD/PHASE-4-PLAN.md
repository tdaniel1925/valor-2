# PHASE 4: SMARTOFFICE DASHBOARD - BUILD PLAN

## Requirements Confirmed

1. ✅ **AI Provider**: Anthropic Claude
2. ✅ **User Roles**: No role-based filtering - all tenant users see everything for their tenant
3. ✅ **Mobile**: Responsive design required (mobile-first approach)
4. ✅ **Export**: CSV primary, but handle Excel naming variations
5. ✅ **Wireframe**: Approved

---

## Build Order (Dependency-Based)

### MILESTONE 1: Foundation (2-3 hours)
Get basic page rendering and data flowing

**1.1 Create Route Structure**
- `app/smartoffice/page.tsx` - Main dashboard
- `app/smartoffice/layout.tsx` - Shared layout
- `app/api/smartoffice/policies/route.ts` - Data API
- `app/api/smartoffice/agents/route.ts` - Data API

**1.2 Data API Endpoints**
- GET `/api/smartoffice/policies` - Query with filters
  - Query params: status, carrier, dateFrom, dateTo, search
  - Return: policies array + metadata (total count)
  - RLS: Filter by tenantId from session
- GET `/api/smartoffice/agents` - Query with filters
  - Query params: supervisor, search
  - Return: agents array + metadata

**1.3 Basic Page Layout**
- Create dashboard shell
- Add navigation breadcrumbs
- Test data loads from API

**Verification:**
```bash
# Navigate to /smartoffice
# Should see: Loading state → Data grid appears
# Check: Network tab shows API calls returning data
```

---

### MILESTONE 2: Data Grid (2-3 hours)
Build the core table with sorting, pagination, mobile-responsive

**2.1 Install Dependencies**
```bash
npm install @tanstack/react-table
```

**2.2 Create PolicyDataTable Component**
- `components/smartoffice/PolicyDataTable.tsx`
- Columns: Policy #, Advisor, Product, Carrier, Insured, Status, Premium
- Features:
  - Column sorting (click header)
  - Pagination (25/50/100 per page)
  - Mobile responsive (stack columns on small screens)
  - Row click → Expand details

**2.3 Create AgentDataTable Component**
- `components/smartoffice/AgentDataTable.tsx`
- Columns: Name, Email, Supervisor, NPN, Contract Count
- Same features as PolicyDataTable

**2.4 Server-Side Pagination**
- API accepts: page, pageSize, sortBy, sortOrder
- Return: { data, totalCount, page, pageSize }

**Verification:**
```bash
# Click column headers → Data re-sorts
# Click page 2 → New data loads
# Resize browser → Mobile view activates
# Click row → Details expand
```

---

### MILESTONE 3: Quick Actions & Metrics (1-2 hours)
Add the "two-click" access buttons

**3.1 Create QuickActionCard Component**
- `components/smartoffice/QuickActionCard.tsx`
- Props: title, value, icon, onClick
- Responsive grid (4 cols desktop, 2 cols mobile)

**3.2 Implement Quick Actions**
- **My Policies**: Show all policies (no filter, just count)
- **Pending**: Filter status=PENDING
- **This Month**: Filter statusDate >= first day of current month
- **Top 5 Carriers**: Group by carrier, show top 5 pie chart

**3.3 Create MetricsCards Component**
- `components/smartoffice/MetricsCards.tsx`
- Cards: Total Policies, Total FYC, Total Renewal
- Auto-update when filters change
- Add trend indicators (+12 MTD)

**3.4 Click Handling**
- Quick action card click → Updates URL params
- Grid auto-filters based on URL params
- Metrics recalculate

**Verification:**
```bash
# Click "Pending" card
# URL changes: /smartoffice?status=PENDING
# Grid shows only pending policies
# Metrics update to pending totals
```

---

### MILESTONE 4: AI Chat Interface (3-4 hours)
Natural language query with Anthropic Claude

**4.1 Install Dependencies**
```bash
npm install ai @anthropic-ai/sdk
```

**4.2 Create Chat API Endpoint**
- `app/api/smartoffice/chat/route.ts`
- POST /api/smartoffice/chat
- Body: { message, sessionId, context }
- Flow:
  1. Parse user question with Claude
  2. Generate Prisma query
  3. Execute with RLS (tenantId filter)
  4. Format results
  5. Save to SmartOfficeChatHistory
  6. Return answer + data

**4.3 Prompt Engineering**
```typescript
const systemPrompt = `
You are SmartOffice Intelligence Assistant for Valor Financial.

Available Data:
- SmartOfficePolicy: policyNumber, primaryAdvisor, carrierName, status, commAnnualizedPrem, etc.
- SmartOfficeAgent: fullName, email, supervisor, contractList, npn

User's Tenant: ${tenantId}
All queries MUST filter by tenantId.

When user asks a question:
1. Identify intent (search, aggregate, compare, report)
2. Generate Prisma query
3. Return JSON:
{
  "query": "prisma.smartOfficePolicy.findMany(...)",
  "explanation": "Here are your 12 pending policies...",
  "visualizationType": "table" | "chart" | "metric",
  "followUps": ["Show only over $100k", "Group by carrier"]
}

Examples:
User: "Show me my pending policies"
Response: {
  "query": "prisma.smartOfficePolicy.findMany({ where: { tenantId, status: 'PENDING' } })",
  "explanation": "I found 12 pending policies",
  "visualizationType": "table"
}
`;
```

**4.4 Create SmartOfficeChat Component**
- `components/smartoffice/SmartOfficeChat.tsx`
- Input field (prominent at top)
- Suggested questions (clickable chips)
- Chat history (collapsible)
- Streaming responses
- Result rendering (table, chart, or text)

**4.5 Security Validation**
- Validate AI-generated queries before execution
- Ensure tenantId is always in WHERE clause
- Block any UPDATE/DELETE operations
- Rate limiting (10 queries per minute)

**Verification:**
```bash
# Type: "Show me pending policies"
# See: Streaming response → Table appears
# Type: "How much FYC this month?"
# See: Number card with total
# Check: Database has SmartOfficeChatHistory records
```

---

### MILESTONE 5: Filters & Search (1-2 hours)
Advanced filtering panel

**5.1 Create FilterPanel Component**
- `components/smartoffice/FilterPanel.tsx`
- Collapsible (closed by default)
- Filters:
  - Status (multi-select dropdown)
  - Carrier (multi-select dropdown, populated from data)
  - Date Range (date picker: from/to)
  - Premium Range (slider: $0-$500k)
  - Search (policy #, client name, advisor)

**5.2 Filter State Management**
- Use URL search params for state
- Debounce search input (300ms)
- "Clear All" button
- "Apply Filters" button

**5.3 Filter Logic in API**
- API builds Prisma where clause from params
- Example:
  ```typescript
  where: {
    AND: [
      { tenantId },
      { status: { in: statusArray } },
      { carrierName: { in: carrierArray } },
      { statusDate: { gte: dateFrom, lte: dateTo } },
      { OR: [
        { policyNumber: { contains: search } },
        { primaryInsured: { contains: search } },
      ]}
    ]
  }
  ```

**Verification:**
```bash
# Open filter panel
# Select: Status=PENDING, Carrier=Guardian
# Click Apply
# Grid filters to 3 results matching both
# URL: /smartoffice?status=PENDING&carrier=Guardian
```

---

### MILESTONE 6: Export Functionality (1 hour)
CSV/Excel download

**6.1 Create Export API**
- `app/api/smartoffice/export/route.ts`
- GET /api/smartoffice/export
- Query params: same as data API + format (csv|excel)
- Returns: file stream

**6.2 CSV Export**
```typescript
import { stringify } from 'csv-stringify/sync';

const csv = stringify(data, {
  header: true,
  columns: ['policyNumber', 'primaryAdvisor', 'carrierName', ...]
});

return new Response(csv, {
  headers: {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="smartoffice-policies-${date}.csv"`
  }
});
```

**6.3 Handle Excel Naming Variations**
- Map database columns to Excel-friendly names
- Support variations:
  - `policyNumber` → "Policy #" or "Policy Number" or "Pol #"
  - `primaryAdvisor` → "Primary Advisor" or "Advisor" or "Agent"
- Configurable column mapping

**6.4 Export Button Component**
- `components/smartoffice/ExportButton.tsx`
- Dropdown: CSV | Excel
- Shows loading state during generation
- Respects current filters

**Verification:**
```bash
# Apply filter: Status=PENDING
# Click Export → CSV
# Download file: smartoffice-policies-2026-02-28.csv
# Open: Contains only 12 pending policies
# Check: Column headers match "Policy #", "Primary Advisor"
```

---

### MILESTONE 7: Mobile Optimization (1-2 hours)
Ensure everything works on small screens

**7.1 Responsive Design Checklist**
- Chat input: Full width on mobile
- Quick actions: 2 columns (not 4)
- Metrics cards: Stack vertically
- Data grid: Horizontal scroll OR card view
- Filter panel: Full-screen modal on mobile

**7.2 Mobile-Specific Components**
- Create `MobilePolicyCard.tsx` for card view
- Switch between table/card based on screen size
- Touch-friendly tap targets (min 44px)

**7.3 Test on Real Devices**
- iPhone (Safari)
- Android (Chrome)
- iPad (tablet view)

**Verification:**
```bash
# Open on mobile (or DevTools mobile emulation)
# Check: All features work
# Check: No horizontal scroll (except table)
# Check: Buttons are tappable
# Check: Chat input is accessible
```

---

### MILESTONE 8: Polish & Performance (1-2 hours)
Loading states, error handling, optimizations

**8.1 Loading States**
- Skeleton screens for tables
- Spinner for AI responses
- Shimmer effect for metric cards

**8.2 Error Handling**
- API errors → Toast notifications
- Empty states → Friendly messages
- Failed AI queries → Fallback suggestions

**8.3 Performance Optimizations**
- Server components where possible
- Debounced search
- Memoized table columns
- Lazy load chat history

**8.4 Accessibility**
- Keyboard navigation
- ARIA labels
- Focus management
- Screen reader support

**Verification:**
```bash
# Lighthouse score: >90 Performance, >90 Accessibility
# Keyboard-only navigation works
# Network throttle (Slow 3G) → Still usable
```

---

## File Structure

```
app/
  smartoffice/
    page.tsx              # Main dashboard
    layout.tsx            # Layout with breadcrumbs
    agents/
      page.tsx            # Agent list view
  api/
    smartoffice/
      policies/
        route.ts          # GET /api/smartoffice/policies
      agents/
        route.ts          # GET /api/smartoffice/agents
      chat/
        route.ts          # POST /api/smartoffice/chat
      export/
        route.ts          # GET /api/smartoffice/export

components/
  smartoffice/
    PolicyDataTable.tsx   # Main policy grid
    AgentDataTable.tsx    # Agent grid
    QuickActionCard.tsx   # Metric card with click
    MetricsCards.tsx      # KPI summary
    SmartOfficeChat.tsx   # AI chat interface
    FilterPanel.tsx       # Advanced filters
    ExportButton.tsx      # Export dropdown
    MobilePolicyCard.tsx  # Mobile card view

lib/
  smartoffice/
    queries.ts            # Reusable Prisma queries
    ai-prompt.ts          # Claude prompt templates
    export-helpers.ts     # CSV/Excel generators
```

---

## Dependencies to Install

```bash
# Data table
npm install @tanstack/react-table

# AI
npm install ai @anthropic-ai/sdk

# CSV export
npm install csv-stringify

# Date handling
npm install date-fns

# Already have:
# - @prisma/client
# - next
# - react
# - tailwindcss
# - shadcn/ui components
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Already have:
# DATABASE_URL=...
# NEXT_PUBLIC_SUPABASE_URL=...

# NEW - Add this:
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## Success Criteria

**Functional:**
- ✅ Load 639 agents + 209 policies from database
- ✅ Quick action cards filter data (2 clicks)
- ✅ AI chat answers questions (1 comment)
- ✅ Data table sorts, paginates, filters
- ✅ Export to CSV with current filters
- ✅ Works on mobile (responsive)

**Performance:**
- ✅ Page load < 2 seconds
- ✅ AI response < 5 seconds
- ✅ Table pagination < 500ms
- ✅ Lighthouse score > 90

**User Experience:**
- ✅ Zero learning curve (intuitive)
- ✅ All features accessible via keyboard
- ✅ Error states are helpful
- ✅ Loading states prevent confusion

---

## Estimated Timeline

**MVP (Milestones 1-6):**
- Foundation: 2-3 hours
- Data Grid: 2-3 hours
- Quick Actions: 1-2 hours
- AI Chat: 3-4 hours
- Filters: 1-2 hours
- Export: 1 hour
**Total: 10-15 hours**

**Full Build (Milestones 1-8):**
- Mobile: +1-2 hours
- Polish: +1-2 hours
**Total: 12-19 hours**

---

## Risk Mitigation

**Risk 1: AI generates invalid queries**
- Mitigation: Query validation layer before execution
- Fallback: If validation fails, show error + suggested rephrasing

**Risk 2: Large datasets slow down table**
- Mitigation: Server-side pagination from start
- Limit: Max 100 rows per page

**Risk 3: Mobile layout breaks**
- Mitigation: Mobile-first CSS, test early
- Fallback: Card view for small screens

**Risk 4: Export fails with special characters**
- Mitigation: Sanitize data before CSV generation
- Test: Policy names with quotes, commas

---

## Testing Plan

**Manual Tests:**
1. Load dashboard → See data grid
2. Click "Pending" → Grid filters
3. Type "Show me pending" in chat → Same result
4. Open filters → Select carrier → Apply
5. Export CSV → Download works
6. Resize to mobile → Layout adapts
7. Keyboard-only navigation → Works
8. Empty state (new tenant) → Friendly message

**Automated Tests (Future):**
- Unit: AI prompt generator
- Integration: API endpoints return correct data
- E2E: Full user flow with Playwright

---

## Post-Launch Enhancements (Phase 5)

**P1 Features (Next Phase):**
- Saved views (save filter combinations)
- Charts/visualizations (commission trends)
- Agent detail page (click agent → see their policies)
- Sync status widget (last sync timestamp)
- Team dashboard for supervisors

**P2 Features (Future):**
- Scheduled reports (email digest)
- Real-time notifications (new policy imported)
- Mobile app (PWA)
- Data quality alerts (missing commission)

---

**READY TO BUILD!**

Say **GO** and I'll start with Milestone 1: Foundation

Or say **PAUSE** if you need to review anything first.
