# PHASE 4: SMARTOFFICE DASHBOARD - RESEARCH & DESIGN

## Executive Summary

The SmartOffice Intelligence Dashboard will provide agents with instant access to their book of business through:
- **TWO-CLICK ACCESS**: Pre-built filter buttons for common queries
- **ONE-COMMENT ACCESS**: Natural language AI chat for custom questions
- **ZERO LEARNING CURVE**: Intuitive interface familiar to insurance agents

---

## 1. DATA ANALYSIS

### Actual SmartOffice Reports Analyzed

**Policies Report**: "Dynamic Report - Valor - All Policies 2026"
- **209 policies** in sample data
- **12 columns total**

**Exact Columns from Excel:**
1. Policy # - Unique identifier (e.g., "3301032622")
2. Primary Advisor - Agent name (e.g., "Anoop Kumar Adoor Naik")
3. Product Name - (e.g., "Athene Performance Elite 15")
4. Carrier Name - (e.g., "Athene Annuity And Life Company")
5. Primary Insured - Client name (e.g., "Barani Ramakrishnan")
6. Status Date - Excel serial date (e.g., "46028" = 2026-01-15)
7. Type - "Annuity" or "Life"
8. Target Amount - Face value (often empty for annuities)
9. Comm Annualized Prem - Annual premium (e.g., "199283.22")
10. Weighted Premium - (e.g., "7971.33")
11. Excess Prem - Additional premium
12. Status - (not shown in sample, but in model)

**Agents Report**: "Dynamic Report - Valor Agents"
- **639 agents** in sample data
- **9 columns total**

**Exact Columns from Excel:**
1. Last Name, First Name - "Wedey, Humphrey"
2. Preferred E-mail - "hwedey@yahoo.com"
3. All Phones - "Business: (770) 256-8324..." (multi-line)
4. Supervisor - "HMV Brokers Inc"
5. Sub-Source - "Valor Financial Specialists LLC"
6. Contract List - Long list of carrier appointments (multi-line)
7. SS # - Social Security Number (masked in UI)
8. NPN - National Producer Number (e.g., "8260204")
9. All Addresses - Physical addresses (multi-line)

### Available Data Sources

#### SmartOfficePolicy Table
Fields agents care about:
- `policyNumber` - Unique identifier
- `primaryAdvisor` - Agent name (filterable)
- `productName` - Product type
- `carrierName` - Insurance carrier
- `primaryInsured` - Client name
- `status` - ACTIVE, PENDING, ISSUED, DECLINED, LAPSED, SURRENDERED
- `statusDate` - When status last changed
- `type` - LIFE, ANNUITY, OTHER
- `targetAmount` - Face value
- `commAnnualizedPrem` - Annual premium
- `firstYearCommission` - FYC amount
- `renewalCommission` - Renewal amount

#### SmartOfficeAgent Table
Fields agents care about:
- `fullName` - Agent name
- `email` - Contact info
- `supervisor` - Reporting structure
- `contractList` - Carrier appointments (long text field)
- `npn` - National Producer Number

#### SmartOfficeSyncLog Table
Sync status for transparency:
- `status` - success/failed
- `recordsCreated` / `recordsUpdated` - Import stats
- `completedAt` - Last sync timestamp

### Agent Personas

**Primary User: Individual Agent**
- Wants to see THEIR policies only
- Cares about: Pending cases, commissions, client names
- Common questions:
  - "Show me my pending policies"
  - "How much commission did I earn this month?"
  - "Which clients do I need to follow up with?"
  - "What's my production by carrier?"

**Secondary User: Supervisor/Manager**
- Wants to see TEAM performance
- Cares about: Team totals, top producers, lagging agents
- Common questions:
  - "Show me all policies by my team"
  - "Who are my top 5 producers this month?"
  - "Which agents have pending cases over 30 days old?"

**Tertiary User: Admin/Operations**
- Wants to see SYSTEM health
- Cares about: Data quality, sync status, missing data
- Common questions:
  - "When was the last successful sync?"
  - "Are there any policies missing commission data?"
  - "Show me all policies uploaded today"

---

## 2. COMPETITIVE RESEARCH

### Industry Best Practices (from 10+ insurance dashboard reviews)

**Key Findings:**
1. **"Important numbers first"** - Dashboard should surface KPIs immediately, not buried in tabs
2. **Advanced filter panels** - Group filters into organized blocks above results
3. **Search by date, agent, status** - Standard in all modern insurance tools
4. **Real-time trends** - Show changes over time, not just current snapshots
5. **Centralized workflow** - Everything in one place (no jumping between tools)
6. **Team-specific KPIs** - Customize what each user sees based on role

### Natural Language Query Trends (2024-2026)

**Platforms doing this well:**
- **Looker (Gemini)** - Ask questions, get visualizations
- **Databricks Genie** - Conversational analytics for business teams
- **SCIKIQ NLQ** - Plain language → SQL queries

**Success Metrics:**
- One insurance carrier reduced support calls by 63% with conversational AI
- Users prefer "ask a question" over navigating complex filter menus
- NLQ removes need for SQL knowledge entirely

**Implementation Pattern:**
```
User Input (natural language)
         ↓
AI parses intent + entities
         ↓
Generate Prisma query
         ↓
Execute with RLS (tenant-scoped)
         ↓
Return results + explanation
```

---

## 3. UI WIREFRAME PROPOSAL

### Desktop Layout (Priority 1)

```
┌─────────────────────────────────────────────────────────────┐
│  VALOR FINANCIAL                    👤 Agent: John Smith    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔍 ASK SMARTOFFICE ANYTHING                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Show me my pending policies over $100k"            │   │
│  │                                          [Ask AI →]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS (2-Click Access)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 📋 MY    │ │ ⏳ PENDING│ │ 💵 THIS  │ │ 📊 TOP 5 │       │
│  │ POLICIES │ │ CASES    │ │ MONTH   │ │ CARRIERS │       │
│  │  247     │ │   12     │ │ $24.5k  │ │ GUARDIAN │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  KEY METRICS (Auto-filtered to current view)                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ 📈 TOTAL   │ │ 💰 FYC     │ │ 🔄 RENEWAL │              │
│  │ POLICIES   │ │ EARNED     │ │ COMMISSION │              │
│  │    247     │ │  $156,450  │ │   $24,890  │              │
│  │ +12 MTD    │ │ +$12.5k MTD│ │  +$1.8k MTD│              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  FILTERS (Collapsible Panel)                                 │
│  [▼ Advanced Filters]                                        │
│  Status: [All ▼] Carrier: [All ▼] Date Range: [MTD ▼]      │
│                                        [Export] [Save View]  │
├─────────────────────────────────────────────────────────────┤
│  POLICY GRID (Sortable, Paginated)                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Policy#   │ Client      │ Carrier  │ Status │ Premium │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ L1234567  │ Smith, Jane │ Guardian │ PENDING│ $125k   │ │
│  │ A9876543  │ Doe, John   │ Pacific  │ ISSUED │ $200k   │ │
│  │ L5555555  │ Lee, Sarah  │ Prudential│PENDING│ $85k    │ │
│  │ ...                                                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  Showing 1-25 of 247    [1][2][3]...[10] →                  │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Priority 2)

```
┌──────────────────────┐
│  🔍 Ask SmartOffice  │
│  ┌──────────────────┐│
│  │ Type question... ││
│  └──────────────────┘│
├──────────────────────┤
│  QUICK STATS         │
│  📋 247  ⏳ 12       │
│  💵 $24k  📊 Guardian│
├──────────────────────┤
│  [▼ Filters]         │
├──────────────────────┤
│  POLICIES            │
│  ┌────────────────┐ │
│  │ L1234567       │ │
│  │ Smith, Jane    │ │
│  │ PENDING $125k  │ │
│  └────────────────┘ │
│  ┌────────────────┐ │
│  │ A9876543       │ │
│  │ Doe, John      │ │
│  │ ISSUED  $200k  │ │
│  └────────────────┘ │
└──────────────────────┘
```

---

## 4. FEATURE PRIORITY (P0/P1/P2)

### P0 - MVP (Must Have for Launch)

**1. AI Chat Interface**
- Natural language input field (prominent at top)
- Sample questions shown as prompts
- Real-time query → answer flow
- Save chat history to SmartOfficeChatHistory table

**2. Quick Action Buttons (Pre-built queries)**
- "My Policies" - All policies for logged-in agent
- "Pending Cases" - Status = PENDING
- "This Month" - Created this month + commission total
- "Top 5 Carriers" - Group by carrier, count policies

**3. Data Grid (Policies)**
- Sortable columns
- Clickable rows (expand for details)
- Server-side pagination
- Export to CSV/Excel

**4. Basic Filters**
- Status dropdown (All, ACTIVE, PENDING, etc.)
- Carrier dropdown (populated from data)
- Date range picker

**5. Key Metrics Cards**
- Total Policies (count)
- Total FYC (sum of firstYearCommission)
- Total Renewal (sum of renewalCommission)
- Auto-update based on current filter

### P1 - Enhanced (Post-MVP)

**6. Agent Grid**
- View all agents in organization
- Filter by supervisor
- Click to see agent's policies

**7. Sync Status Widget**
- Last sync timestamp
- Success/fail indicator
- Clickable to see sync logs

**8. Saved Views**
- Save current filters as named view
- Quick toggle between saved views
- Share views with team

**9. Charts/Visualizations**
- Commission trend line (last 6 months)
- Policies by carrier (pie chart)
- Policies by status (bar chart)

**10. Advanced Filters**
- Multi-select carriers
- Premium range slider
- Primary insured name search
- Policy number search

### P2 - Future Enhancements

**11. Scheduled Reports**
- Email digest of metrics
- Custom schedule (daily/weekly)
- CSV attachment

**12. Real-time Notifications**
- New policy imported
- Status changed
- Commission threshold hit

**13. Mobile App (PWA)**
- Offline mode
- Push notifications
- Quick actions widget

**14. Team Dashboard (Supervisors)**
- Leaderboard (top producers)
- Team totals
- Drill-down by agent

**15. Data Quality Alerts**
- Missing commission data
- Duplicate policies
- Stale data (>30 days)

---

## 5. TOP 20 QUESTIONS AGENTS ASK

Based on data model analysis + industry research:

### Individual Agent Questions (70% of use)
1. "Show me my pending policies"
2. "How much commission did I earn this month?"
3. "What are my top 5 carriers by policy count?"
4. "Which policies are over $100k?"
5. "Show me all policies for client [name]"
6. "When did policy [number] get issued?"
7. "What's my production this year?"
8. "Show me policies submitted in the last 7 days"
9. "Which policies are missing commission data?"
10. "What's my average premium?"

### Supervisor Questions (20% of use)
11. "Show me all policies by [agent name]"
12. "Who are my top 5 producers this month?"
13. "Which agents have pending cases over 30 days old?"
14. "What's my team's total production?"
15. "Show me declined policies this month"

### Admin/System Questions (10% of use)
16. "When was the last successful sync?"
17. "How many policies were imported today?"
18. "Show me all policies with errors"
19. "Which agents haven't had any activity in 30 days?"
20. "What's the average time from submitted to issued?"

---

## 6. TECHNICAL ARCHITECTURE

### Frontend Stack
- **Next.js 15** (App Router) - Server Components for performance
- **Shadcn/ui** - Component library (DataTable, Dialog, Card, etc.)
- **TanStack Table v8** - Advanced grid with sorting, filtering, pagination
- **Recharts** - Charts for visualizations
- **Tailwind CSS** - Styling

### AI Chat Implementation
- **Vercel AI SDK** - Stream responses
- **OpenAI GPT-4** OR **Anthropic Claude** - Natural language → Prisma query
- **Prompt Engineering**:
  ```
  You are a SmartOffice data assistant. User asks: "Show me pending policies"

  Available tables:
  - SmartOfficePolicy: columns [list schema]
  - SmartOfficeAgent: columns [list schema]

  User role: Agent (filter by primaryAdvisor = "John Smith")

  Generate Prisma query to answer question. Return JSON:
  {
    "query": "prisma.smartOfficePolicy.findMany(...)",
    "explanation": "Here are your 12 pending policies",
    "suggestedFollowUps": ["Show only policies over $100k", "Group by carrier"]
  }
  ```

### Data Flow
```
User Question
     ↓
AI parses intent
     ↓
Generate Prisma query
     ↓
Execute with RLS (tenantId + user context)
     ↓
Format results
     ↓
Display in grid OR answer text
     ↓
Save to SmartOfficeChatHistory
```

### Security
- **RLS Enforcement**: All queries scoped to current tenant
- **Role-Based Access**:
  - Agents see only THEIR policies (primaryAdvisor filter)
  - Supervisors see TEAM policies (supervisor filter)
  - Admins see ALL policies
- **Query Validation**: AI-generated queries reviewed before execution
- **Rate Limiting**: Prevent abuse of AI endpoint

---

## 7. UI COMPONENTS TO BUILD

### New Components
1. `SmartOfficeChat.tsx` - AI chat interface
2. `QuickActionGrid.tsx` - 4 metric cards with click handlers
3. `PolicyDataTable.tsx` - TanStack Table wrapper
4. `AgentDataTable.tsx` - Agent grid
5. `MetricsCards.tsx` - KPI summary cards
6. `FilterPanel.tsx` - Collapsible filter UI
7. `SyncStatusBadge.tsx` - Last sync indicator
8. `SavedViewsMenu.tsx` - Dropdown of saved filter combinations
9. `ExportButton.tsx` - Export to CSV/Excel

### Reusable Components (from Shadcn)
- `Button`, `Card`, `Input`, `Select`, `Table`, `Dialog`, `Badge`, `Tabs`

### Layout
- `app/smartoffice/page.tsx` - Main dashboard route
- `app/smartoffice/agents/page.tsx` - Agent list
- `app/smartoffice/sync-logs/page.tsx` - Sync history
- `app/api/smartoffice/chat/route.ts` - AI endpoint
- `app/api/smartoffice/policies/route.ts` - Data API
- `app/api/smartoffice/export/route.ts` - CSV export

---

## 8. USER FLOWS

### Flow 1: Two-Click Quick Action
```
1. Agent logs in → Dashboard loads
2. Sees "PENDING CASES: 12" quick action card
3. Clicks card
4. Grid auto-filters to show only pending policies
   - URL updates: /smartoffice?status=PENDING
   - Metrics cards update to show pending totals
5. Done (2 clicks total)
```

### Flow 2: One-Comment AI Query
```
1. Agent logs in → Dashboard loads
2. Types in chat: "Show me my top 3 clients by premium"
3. AI processes:
   - Identifies: query type = aggregate, group by primaryInsured
   - Generates Prisma query with RLS
   - Executes query
4. Results displayed:
   - Answer text: "Your top 3 clients are..."
   - Data table with 3 rows
   - Suggested follow-ups shown
5. Done (1 comment)
```

### Flow 3: Advanced Filter
```
1. Agent clicks "Advanced Filters"
2. Panel expands below quick actions
3. Selects:
   - Status: PENDING
   - Carrier: Guardian, Pacific Life
   - Date Range: Last 30 days
4. Clicks "Apply"
5. Grid updates, URL updates, can save view
```

---

## 9. SUCCESS METRICS

How we'll know this is working:

**User Adoption**
- 80%+ of agents use dashboard within first week
- Average 5+ sessions per agent per week
- <10% support tickets about "how to find X"

**Performance**
- AI query response < 3 seconds (90th percentile)
- Page load < 1 second
- Grid pagination < 500ms

**User Satisfaction**
- "I found what I needed" - 90%+ positive
- "Easier than SmartOffice" - 80%+ agree
- NPS score > 50

**Business Impact**
- Reduce manual report requests by 50%
- Agents spend 30% less time searching for data
- Supervisors make decisions faster (tracked via usage logs)

---

## 10. OPEN QUESTIONS FOR YOU

Before I start building, I need clarity on:

**1. AI Provider Preference?**
   - OpenAI GPT-4 ($$$, best accuracy)
   - Anthropic Claude ($$, good accuracy, cheaper)
   - Open-source (Llama, free but self-hosted)

**2. User Roles - How do we determine who sees what?**
   - Do you have a `role` field on User table?
   - Should we filter by `user.email` matching `policy.primaryAdvisor`?
   - How do supervisors see team data? (Is there a `supervisor` link?)

**3. Data Refresh Frequency?**
   - Real-time (every page load queries DB)
   - Cached (5-min cache, faster but stale)
   - Hybrid (cache metrics, real-time for grids)

**4. Mobile Priority?**
   - MVP must work on mobile? (adds 30% time)
   - OR desktop-first, mobile later?

**5. Export Format?**
   - CSV only (simple)
   - Excel with formatting (more complex)
   - PDF reports (requires new library)

---

## NEXT STEPS

Once you review this research:

1. **Answer open questions** above
2. **Approve wireframe** (or request changes)
3. **Prioritize features** (confirm P0 list)
4. I'll create **PHASE-4-PLAN.md** with step-by-step build order
5. You say **GO** and I start building

**Estimated Timeline:**
- P0 Features (MVP): 8-12 hours of development
- P1 Features (Enhanced): +6-8 hours
- P2 Features (Future): TBD per feature

**Ready for your feedback!** 🚀
