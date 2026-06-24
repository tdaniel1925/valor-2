# Data-Source Consistency Audit — wire all pages to SmartOffice (single source of truth)

**Source of truth:** `SmartOfficePolicy` / `SmartOfficeAgent` via
`lib/smartoffice/data-service.ts` (getPolicies/getPolicyStats/getAgents) and
`lib/downline/service.ts` (getOrgForEmail). Premium = `commAnnualizedPrem`
(commissionable) / `targetAmount` (annual). Date = `statusDate`.

**WRONG sources (internal/legacy, mostly empty):** `case`, `commission`,
`quote`, `contract`. Any book metric from these is inconsistent.

## Status by page/route

| Page | API | Reads | Verdict |
|---|---|---|---|
| Dashboard — book cards | /api/dashboard | getOrgForEmail | ✅ fixed (92d410b) |
| Dashboard — MTD/QTD/YTD + progress meter | /api/dashboard | now: book production by statusDate | ✅ fixed |
| My Organization | /api/downline | getOrgForEmail | ✅ |
| Cases | /api/cases/policies | getPolicies/getPolicyStats | ✅ |
| Commissions | /api/smartoffice/agent-commissions | smartOfficeCommission | ✅ (book-adjacent) |
| Contracts | /api/smartoffice/agent-contracts | (smartoffice) | ✅ |
| Reports: goal-tracking | /api/reports/goal-tracking | smartOfficePolicy | ✅ |
| Reports: production | /api/reports/production | `case` | ✅ fixed (SmartOffice) |
| Reports: commissions | /api/reports/commissions | `commission` | ✅ fixed (SmartOffice) |
| Reports: executive | /api/reports/executive | `case`, `user` | ✅ fixed (SmartOffice) |
| Reports: agents | /api/reports/agents | `case`,`commission`,`quote`,`user` | ✅ fixed (SmartOffice) |
| Reports: carriers | /api/reports/carriers | `commission`,`quote` | ✅ fixed (SmartOffice) |
| Reports: forecast | /api/reports/forecast | `commission`,`quote`,`user` | ✅ fixed (SmartOffice) |

## Fix order (impact)
1. Dashboard progress meter + period summaries → YTD book production (statusDate this year).
2. Reports: production, carriers, executive (most-viewed book reports).
3. Reports: agents, commissions, forecast.

## Layout fixes (done this session)
- Shell `h-screen overflow-hidden` so sidebar stays put; main scrolls internally.
- AI chat fills viewport (`h-full`), input sticky.
