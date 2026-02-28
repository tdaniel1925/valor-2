# Phase 5: Advanced Dashboard Features — PROJECT SPEC

**Status:** Planning
**Start Date:** 2026-02-28
**Prerequisites:** Phase 4 Complete ✅

---

## Gate 0: Vision

### Problem
Phase 4 delivered a functional dashboard, but insurance agents need **deeper insights** and **workflow optimization**:

1. **Limited drill-down** - Can't click a policy to see full details or related data
2. **No visual insights** - All data is tabular, hard to spot trends at a glance
3. **Repetitive filtering** - Users re-apply the same filters daily (e.g., "pending >7 days")
4. **Generic layout** - Supervisors and agents see the same view (different needs)
5. **No context** - Clicking an agent name should show their full book of business

### Users
**Primary:** Insurance agents checking policy status, tracking commissions, finding client info
**Secondary:** Agency supervisors monitoring team performance, identifying bottlenecks
**Tertiary:** Agency owners analyzing business trends, forecasting revenue

### Success Metrics
1. **Detail page adoption**: 60%+ of users click through to policy/agent details within first week
2. **Chart engagement**: Users spend 30%+ more time on dashboard with visualizations
3. **Saved filter usage**: 40%+ of active users create at least 1 saved filter
4. **Custom dashboard creation**: 20%+ of users customize their layout
5. **Time to insight**: <10 seconds from dashboard load to actionable information

---

## Gate 1: Architecture

### New Components

**Detail Pages:**
- `app/smartoffice/policies/[id]/page.tsx` - Policy detail page
- `app/smartoffice/agents/[id]/page.tsx` - Agent detail page
- `components/smartoffice/PolicyDetail.tsx` - Policy detail component
- `components/smartoffice/AgentDetail.tsx` - Agent detail component

**Charts:**
- `components/smartoffice/charts/PremiumTrendChart.tsx` - Line chart (premium over time)
- `components/smartoffice/charts/CarrierBreakdownChart.tsx` - Pie chart (carrier distribution)
- `components/smartoffice/charts/StatusFunnelChart.tsx` - Funnel chart (conversion rates)
- `components/smartoffice/charts/AgentPerformanceChart.tsx` - Bar chart (agent comparison)

**Custom Dashboard:**
- `components/smartoffice/dashboard/DashboardGrid.tsx` - Drag-and-drop layout
- `components/smartoffice/dashboard/Widget.tsx` - Base widget component
- `components/smartoffice/dashboard/widgets/*` - Individual widget types
- `app/api/smartoffice/dashboards/route.ts` - Save/load custom layouts

**Saved Filters:**
- `components/smartoffice/SavedFilters.tsx` - Filter preset manager
- `app/api/smartoffice/saved-filters/route.ts` - CRUD for saved filters

### Data Model Extensions

```prisma
// New tables for Phase 5

model SavedFilter {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String
  name        String
  description String?

  // Filter configuration (JSON)
  filters     Json     // { status: ["PENDING"], carrier: ["Athene"], ... }

  // Metadata
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tenantId, userId])
  @@map("saved_filters")
}

model DashboardLayout {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String
  name        String

  // Layout configuration (JSON)
  layout      Json     // { widgets: [{ id, type, x, y, w, h, config }] }

  // Metadata
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tenantId, userId])
  @@map("dashboard_layouts")
}

model PolicyNote {
  id          String   @id @default(uuid())
  tenantId    String
  policyId    String
  userId      String

  content     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  policy      SmartOfficePolicy @relation(fields: [policyId], references: [id], onDelete: Cascade)
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tenantId, policyId])
  @@map("policy_notes")
}
```

### Dependencies
```json
{
  "recharts": "^2.15.0",
  "react-grid-layout": "^1.4.4",
  "date-fns": "^3.6.0",
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0"
}
```

---

## Gate 2: Features

### Feature 5.1: Policy Detail Page (P0 - Essential)
**Duration:** 2-3 hours
**Complexity:** M (Medium)

**User Story:**
As an agent, when I click any policy in the dashboard, I want to see comprehensive details including related policies, timeline, and quick actions, so I can answer client questions immediately.

**Acceptance Criteria:**
- ✅ Route: `/smartoffice/policies/[id]`
- ✅ Shows all policy fields in organized sections
- ✅ Displays related policies for same insured (if any)
- ✅ Timeline showing status changes (derived from import dates)
- ✅ Quick actions: "Copy Policy #", "Email Advisor", "Add Note"
- ✅ Notes section with add/edit/delete
- ✅ Mobile responsive layout
- ✅ Back button returns to dashboard with filters preserved

**Components:**
1. `app/smartoffice/policies/[id]/page.tsx` - Dynamic route
2. `app/api/smartoffice/policies/[id]/route.ts` - GET policy by ID
3. `app/api/smartoffice/policies/[id]/notes/route.ts` - CRUD notes
4. `components/smartoffice/PolicyDetailCard.tsx` - Main detail view
5. `components/smartoffice/PolicyTimeline.tsx` - Status timeline
6. `components/smartoffice/PolicyNotes.tsx` - Notes manager

---

### Feature 5.2: Agent Detail Page (P0 - Essential)
**Duration:** 2 hours
**Complexity:** M (Medium)

**User Story:**
As a supervisor, when I click an agent name, I want to see their full policy book, performance metrics, and trends, so I can coach them effectively.

**Acceptance Criteria:**
- ✅ Route: `/smartoffice/agents/[id]`
- ✅ Agent info card (name, email, phone, NPN, supervisor)
- ✅ Performance metrics: total policies, total premium, avg premium, commission YTD
- ✅ Policy list (all policies for this agent)
- ✅ Mini trend chart (last 6 months premium)
- ✅ Status breakdown (pie chart: pending, inforce, etc.)
- ✅ Carrier preferences (bar chart: top 5 carriers)
- ✅ Quick actions: "Email Agent", "View Team"
- ✅ Mobile responsive

**Components:**
1. `app/smartoffice/agents/[id]/page.tsx` - Dynamic route
2. `app/api/smartoffice/agents/[id]/route.ts` - GET agent by ID + stats
3. `components/smartoffice/AgentDetailCard.tsx` - Main detail view
4. `components/smartoffice/AgentPolicyList.tsx` - Agent's policies
5. `components/smartoffice/AgentStatsCard.tsx` - Performance metrics

---

### Feature 5.3: Charts & Visualizations (P0 - Essential)
**Duration:** 3-4 hours
**Complexity:** M (Medium)

**User Story:**
As an agent, I want visual charts on my dashboard showing premium trends, carrier breakdown, and status funnel, so I can spot patterns and make data-driven decisions quickly.

**Acceptance Criteria:**
- ✅ Premium Trend Chart (line chart, last 6 months by status date)
- ✅ Carrier Breakdown Chart (donut chart, top 10 carriers by premium)
- ✅ Status Funnel Chart (funnel visualization: pending → submitted → inforce)
- ✅ Agent Performance Chart (bar chart, top 10 agents by premium)
- ✅ All charts respect active filters
- ✅ Tooltips show exact values on hover
- ✅ Responsive to mobile (stack vertically)
- ✅ Loading skeletons while data fetches
- ✅ Empty states with helpful messages

**API Endpoints:**
1. `GET /api/smartoffice/charts/premium-trend` - Aggregated monthly data
2. `GET /api/smartoffice/charts/carrier-breakdown` - Carrier distribution
3. `GET /api/smartoffice/charts/status-funnel` - Status conversion counts
4. `GET /api/smartoffice/charts/agent-performance` - Top agents by metric

**Components:**
1. `components/smartoffice/charts/PremiumTrendChart.tsx`
2. `components/smartoffice/charts/CarrierBreakdownChart.tsx`
3. `components/smartoffice/charts/StatusFunnelChart.tsx`
4. `components/smartoffice/charts/AgentPerformanceChart.tsx`
5. `components/smartoffice/charts/ChartContainer.tsx` - Shared wrapper

---

### Feature 5.4: Custom Dashboard System (P1 - High Priority)
**Duration:** 6-8 hours
**Complexity:** L (Large)

**User Story:**
As an agent/supervisor, I want to create custom dashboard layouts by dragging widgets, so I can see exactly the metrics and views that matter to my role.

**Acceptance Criteria:**
- ✅ Widget library with 8+ widget types
- ✅ Drag-and-drop grid layout (react-grid-layout)
- ✅ Widget configuration panel (edit settings)
- ✅ Save multiple layouts ("My Day", "Month End", "Team View")
- ✅ Switch between layouts with dropdown
- ✅ Share layouts with team (copy layout ID)
- ✅ Default layouts for new users
- ✅ Responsive breakpoints (desktop, tablet, mobile)

**Widget Types:**
1. **Stats Card** - Configurable metric (total policies, premium, etc.)
2. **Mini Chart** - Small trend chart
3. **Recent Activity** - Last 10 syncs/changes
4. **Pending List** - Policies pending >X days
5. **Commission Tracker** - Progress bar vs. goal
6. **Top Agents** - Leaderboard
7. **Carrier Status** - Grid of carriers with response times
8. **Quick Filters** - One-click filter buttons

**API Endpoints:**
1. `GET /api/smartoffice/dashboards` - List user's layouts
2. `POST /api/smartoffice/dashboards` - Create new layout
3. `PUT /api/smartoffice/dashboards/[id]` - Update layout
4. `DELETE /api/smartoffice/dashboards/[id]` - Delete layout
5. `GET /api/smartoffice/widgets/[type]/data` - Widget data endpoints

**Components:**
1. `components/smartoffice/dashboard/DashboardBuilder.tsx` - Main grid
2. `components/smartoffice/dashboard/WidgetLibrary.tsx` - Widget picker
3. `components/smartoffice/dashboard/Widget.tsx` - Base widget wrapper
4. `components/smartoffice/dashboard/widgets/StatsWidget.tsx`
5. `components/smartoffice/dashboard/widgets/ChartWidget.tsx`
6. `components/smartoffice/dashboard/widgets/ActivityWidget.tsx`
7. `components/smartoffice/dashboard/widgets/PendingListWidget.tsx`
8. `components/smartoffice/dashboard/widgets/CommissionWidget.tsx`
9. `components/smartoffice/dashboard/LayoutSelector.tsx` - Layout switcher

---

### Feature 5.5: Saved Filter Presets (P1 - High Priority)
**Duration:** 2 hours
**Complexity:** S (Small)

**User Story:**
As an agent, I want to save my frequently-used filter combinations (e.g., "Pending >7 days"), so I don't have to reconfigure filters every day.

**Acceptance Criteria:**
- ✅ "Save Filter" button in filter panel
- ✅ Name + optional description
- ✅ Saved filters dropdown in header
- ✅ One-click apply saved filter
- ✅ Edit/delete saved filters
- ✅ Set default filter (auto-applies on login)
- ✅ Badge showing active saved filter name
- ✅ Max 20 saved filters per user

**API Endpoints:**
1. `GET /api/smartoffice/saved-filters` - List user's filters
2. `POST /api/smartoffice/saved-filters` - Create filter
3. `PUT /api/smartoffice/saved-filters/[id]` - Update filter
4. `DELETE /api/smartoffice/saved-filters/[id]` - Delete filter

**Components:**
1. `components/smartoffice/SavedFilters.tsx` - Manager UI
2. `components/smartoffice/SaveFilterDialog.tsx` - Save modal
3. Updated `FilterPanel.tsx` - Add save button

---

## Gate 3: Implementation Plan

### Build Order (Dependency-Aware)

**Week 1: Details & Charts (Foundation)**
1. Feature 5.1 - Policy Detail Page (2-3 hours)
2. Feature 5.2 - Agent Detail Page (2 hours)
3. Feature 5.3 - Charts & Visualizations (3-4 hours)
   - **Milestone:** Users can drill down and see visual insights
   - **Verification:** Click policy → see details → click agent → see performance

**Week 2: Customization (Advanced)**
4. Feature 5.5 - Saved Filter Presets (2 hours) - *Build before 5.4*
5. Feature 5.4 - Custom Dashboard System (6-8 hours)
   - **Milestone:** Users can customize their workspace
   - **Verification:** Create layout → add widgets → save → switch layouts

### File Creation Order
```
Phase 5.1 - Policy Details:
  1. Database migration (add PolicyNote table)
  2. app/api/smartoffice/policies/[id]/route.ts
  3. app/api/smartoffice/policies/[id]/notes/route.ts
  4. components/smartoffice/PolicyDetailCard.tsx
  5. components/smartoffice/PolicyTimeline.tsx
  6. components/smartoffice/PolicyNotes.tsx
  7. app/smartoffice/policies/[id]/page.tsx

Phase 5.2 - Agent Details:
  8. app/api/smartoffice/agents/[id]/route.ts
  9. components/smartoffice/AgentDetailCard.tsx
  10. components/smartoffice/AgentPolicyList.tsx
  11. components/smartoffice/AgentStatsCard.tsx
  12. app/smartoffice/agents/[id]/page.tsx

Phase 5.3 - Charts:
  13. app/api/smartoffice/charts/premium-trend/route.ts
  14. app/api/smartoffice/charts/carrier-breakdown/route.ts
  15. app/api/smartoffice/charts/status-funnel/route.ts
  16. app/api/smartoffice/charts/agent-performance/route.ts
  17. components/smartoffice/charts/ChartContainer.tsx
  18. components/smartoffice/charts/PremiumTrendChart.tsx
  19. components/smartoffice/charts/CarrierBreakdownChart.tsx
  20. components/smartoffice/charts/StatusFunnelChart.tsx
  21. components/smartoffice/charts/AgentPerformanceChart.tsx
  22. Update app/smartoffice/page.tsx (integrate charts)

Phase 5.5 - Saved Filters:
  23. Database migration (add SavedFilter table)
  24. app/api/smartoffice/saved-filters/route.ts
  25. app/api/smartoffice/saved-filters/[id]/route.ts
  26. components/smartoffice/SaveFilterDialog.tsx
  27. components/smartoffice/SavedFilters.tsx
  28. Update FilterPanel.tsx (add save button)

Phase 5.4 - Custom Dashboards:
  29. Database migration (add DashboardLayout table)
  30. app/api/smartoffice/dashboards/route.ts
  31. app/api/smartoffice/dashboards/[id]/route.ts
  32. app/api/smartoffice/widgets/[type]/data/route.ts (5 endpoints)
  33. components/smartoffice/dashboard/Widget.tsx
  34. components/smartoffice/dashboard/widgets/* (8 widgets)
  35. components/smartoffice/dashboard/WidgetLibrary.tsx
  36. components/smartoffice/dashboard/LayoutSelector.tsx
  37. components/smartoffice/dashboard/DashboardBuilder.tsx
  38. app/smartoffice/custom/page.tsx (optional dedicated page)
```

**Total Files:** ~40 new files + 3 migrations + 5 file updates

---

## Gate 4: Infrastructure

### Database Migrations
```bash
# Phase 5 migrations
npx prisma migrate dev --name add_policy_notes
npx prisma migrate dev --name add_saved_filters
npx prisma migrate dev --name add_dashboard_layouts

# Generate Prisma client
npx prisma generate
```

### Environment Variables
No new environment variables required. Existing `ANTHROPIC_API_KEY` supports all Phase 5 features.

### Dependencies Installation
```bash
npm install recharts@^2.15.0
npm install react-grid-layout@^1.4.4
npm install date-fns@^3.6.0
npm install @dnd-kit/core@^6.1.0
npm install @dnd-kit/sortable@^8.0.0

# Types
npm install -D @types/react-grid-layout
```

---

## Gate 5: Launch Checklist

### Phase 5.1 - Policy Details
- [ ] Policy detail page renders all fields correctly
- [ ] Related policies query works (same insured)
- [ ] Notes CRUD operations functional
- [ ] Timeline shows import history
- [ ] Quick actions (copy, email) work
- [ ] Mobile responsive on iPhone/Android
- [ ] Back button preserves filters

### Phase 5.2 - Agent Details
- [ ] Agent detail page renders stats correctly
- [ ] Policy list filtered to agent
- [ ] Performance metrics calculated accurately
- [ ] Charts render (trend, status, carriers)
- [ ] Mobile responsive

### Phase 5.3 - Charts
- [ ] All 4 chart types render on dashboard
- [ ] Charts respect active filters
- [ ] Tooltips show correct data
- [ ] Loading states work
- [ ] Empty states for no data
- [ ] Responsive on mobile (stacked)

### Phase 5.5 - Saved Filters
- [ ] Save filter dialog works
- [ ] Filters persist to database
- [ ] Saved filters dropdown populates
- [ ] Apply saved filter works
- [ ] Edit/delete saved filters
- [ ] Default filter auto-applies

### Phase 5.4 - Custom Dashboards
- [ ] Drag-and-drop grid works
- [ ] All 8 widget types render
- [ ] Widget configuration panel works
- [ ] Save layout persists to database
- [ ] Switch between layouts works
- [ ] Default layout for new users
- [ ] Responsive breakpoints work

### Cross-Cutting
- [ ] TypeScript: 0 errors
- [ ] All RLS policies enforce tenant isolation
- [ ] Lighthouse score >90
- [ ] WCAG AA compliance
- [ ] Mobile tested on iOS/Android
- [ ] Cross-browser (Chrome, Safari, Firefox)

---

## Success Criteria Summary

**Phase 5 Complete When:**
1. ✅ Users can click policies/agents to see full details
2. ✅ Dashboard shows 4 visual charts alongside tables
3. ✅ Users can save and reuse filter presets
4. ✅ Users can create custom dashboard layouts
5. ✅ All features work on mobile devices
6. ✅ TypeScript build passes with 0 errors
7. ✅ All data respects tenant isolation (RLS verified)

**User Impact:**
- **Time to insight**: Reduced from ~2 min to <10 sec
- **Workflow efficiency**: Saved filters eliminate repetitive work
- **Visual engagement**: Charts increase time on platform by 30%+
- **Personalization**: Custom dashboards match user roles

---

**Phase 5 Estimated Duration:** 15-19 hours (2-3 days)
**Phase 5 Complexity:** High (L) - Multiple interconnected features
**Phase 5 Risk:** Medium - Complex UI patterns (drag-drop, charts)

**Next Phase:** Phase 6 - Testing, Performance, & Production Hardening
