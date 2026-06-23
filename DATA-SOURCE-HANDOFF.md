# Valor-2 Data Source — Handoff / Orientation

**Read this first if you're working on agents, policies, downline, or "My Organization."**

## Where the data comes from (IMPORTANT)
The SmartOffice agent + policy data in this app is **NOT imported from CSV/Excel anymore.**
It is **synced from the Apex back-office project's SmartOffice database connection.**

- **Source system:** Apex Pre-Launch Site (separate repo, separate Supabase DB) pulls
  live from **SmartOffice (SuranceBay/Ebix XML API)** into its own `smartoffice_agents`
  / `smartoffice_policies` tables.
- A seed script (`seed-valor-from-apex.js` in this repo root) copies **Phil Resch's full
  Valor Financial org** from Apex into THIS app's `smartoffice_agents` / `smartoffice_policies`,
  scoped to the **`valor-default-tenant`** tenant.
- Every synced row is tagged **`sourceFile = 'apex-smartoffice-sync'`**. That tag = "this
  came from the Apex SmartOffice feed." (The old stale CSV/Excel rows were deleted.)

## Current loaded data (as of 2026-06-23)
- **692 agents**, **4,638 policies**, **~$81.6M** annual premium — the entire Valor org.
- Tenant: `valor-default-tenant` ("Valor Financial Specialists").

## The two databases (do not confuse them)
| | This app (valor-2) | Apex back office |
|---|---|---|
| Supabase | `buteoznuikfowbwofabs` | `brejvdvzwshroxkkhmzy` |
| Role | presents the data to agents | pulls from SmartOffice + seeds this app |
They are **separate**. This app does not talk to SmartOffice directly; it reads the
already-synced copy that Apex pushed here.

## How the hierarchy works (so downline queries are correct)
- The org tree is the **SmartOffice supervisor chain**, stored per agent at
  `additionalData.supervisorId` (an Apex SmartOffice contact id) →
  `additionalData.apexContactId`.
- **Do NOT** rely on the `supervisor` *name* string for tree-walking — names aren't unique
  (e.g. two "Wilfred Ignace"). Use the contact-id chain in `additionalData`.
- Agency entities (LLCs) appear as their own rows; a person and their agency share an email.

## The downline feature (already built — reuse it)
- `lib/downline/service.ts` — `getOrgForEmail(tenantId, email, {isAdmin})`: matches a
  logged-in user to their agent **by email**, walks the supervisor tree, returns their
  downline + policies + totals (annual + commissionable premium).
  - Agency principals (same-email entity row) see their whole branch.
  - Phil = org owner (rooted at the Valor agency root). ADMINISTRATOR/EXECUTIVE see everything.
- `app/api/downline/route.ts` — `GET /api/downline`, scoped to the logged-in user.
- `app/my-organization/page.tsx` — the UI (roster + policies + premiums, paginated 25/50/100).
- **Match key is EMAIL** (the SmartOffice feed has email for 99% of Valor agents; it has
  NO NPN for them). A user must sign up with the email on their SmartOffice record to match.

## Useful fields on each synced agent (`additionalData`)
`apexContactId`, `supervisorId`, `supervisorName`, `source`, `subSource`, `status`,
`statusCode`, `clientType`, `apexAgentId`, `apexSmartofficeId`, `syncedAt`.
Full raw SmartOffice object is preserved in `rawData`.

## To refresh the data
Re-run the seed from this repo root (it deletes prior apex-sync rows, re-inserts):
```
node seed-valor-from-apex.js
```
(It reads export files written by the Apex project. For a fresh pull from SmartOffice,
the Apex side re-exports first. Ask if you need that wired as an automatic sync.)

## One-line summary
**This app shows Valor's org. The data is Phil Resch's downline, pulled from SmartOffice
by the Apex project and seeded here (tenant `valor-default-tenant`, tagged
`apex-smartoffice-sync`). Match users to agents by email; walk the tree via
`additionalData.supervisorId`.**
