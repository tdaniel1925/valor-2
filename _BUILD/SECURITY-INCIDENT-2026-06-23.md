# Security Incident & Remediation Report — Public Data Exposure

**Date identified / remediated:** 2026-06-23
**Severity:** Critical (PII + financial data exposure, incl. plaintext SSNs)
**Status:** Remediated. One investigative item open (access-log review — dashboard-only).
**Prepared for:** SOC 2 / security owner review.

---

## 1. Summary

The Supabase project's PostgREST REST API exposed **every table in the `public`
schema** to the internet, gated only by the `anon` role. Because Row Level
Security (RLS) was disabled on these tables and the `anon` role held full table
grants, **anyone in possession of the public anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`,
which is shipped to every browser and trivially extractable from the site's
JavaScript) could read the data over the REST endpoint
`https://<project>.supabase.co/rest/v1/<table>`.

This was **read exposure** (write attempts by `anon` were rejected). It was
remediated the same day by revoking REST access and minimizing stored SSNs.

## 2. What was exposed (verified)

Confirmed readable via the anon key prior to remediation:

| Data | Records | Sensitivity |
|---|---|---|
| `smartoffice_agents` | 692 | **Plaintext SSNs** (full 9-digit), names, emails |
| `smartoffice_policies` | 4,638 | Insured names, carriers, premiums |
| `users` | 9 | App users, emails, tenant linkage |
| `commissions` | 165 | Financial / commission amounts |
| `oauth_tokens` | (rows varied) | **Plaintext `access_token` / `refresh_token`** |
| `ai_conversations` / `ai_messages` | — | AI chat content |
| All other `public` tables | — | Various |

Sample of exposed SSNs (now scrubbed): `Kellie Mai-Tran 345-68-7271`,
`Vindico Risk Services LLC 85-1275492` (EIN). ~684 agents held a full SSN.

## 3. Root cause

The application accesses all data through **Prisma**, connecting as the
dedicated role `valor_app_role` — which bypasses PostgREST entirely. The design
decision was "RLS off; enforce tenant scoping in the application layer." That is
safe **for the Prisma path**, but it overlooked that Supabase **also** exposes
the same tables over its public REST API. Prisma's app-layer scoping does nothing
to protect that second access path. With RLS off and default `anon` grants in
place, the REST API was wide open.

Contributing factor: every table is in the `public` schema (Supabase's default
exposed schema), and Supabase auto-grants `anon`/`authenticated` access to new
tables unless explicitly revoked.

## 4. Remediation performed (2026-06-23)

All verified post-change.

1. **REST access revoked** (`scripts/security-lockdown-rest.sql`, run in the
   Supabase SQL Editor as a privileged role):
   - `REVOKE ALL` on all `public` tables/sequences/functions from `anon` +
     `authenticated`.
   - `REVOKE USAGE ON SCHEMA public` from those roles (PostgREST can't resolve
     table names).
   - `ALTER DEFAULT PRIVILEGES FOR ROLE postgres` so **future** tables are not
     auto-granted to the REST roles (regression protection).
   - **Verification:** anon key now returns `permission denied` on all sampled
     tables (8/8); a full sweep of `information_schema.role_table_grants` shows
     **zero** tables granting anon/authenticated; the `anon=` ACL entry is gone.
     Prisma/app access unaffected (692 agents / 4,638 policies still reachable).
   - Note: `valor_app_role` (the app's role) could NOT perform the revoke —
     the grants were made by `postgres`, so a non-owner REVOKE silently no-ops.
     The fix required the privileged SQL Editor.

2. **SSN minimization** (`scripts/scrub-ssn-to-last4.mjs --apply`):
   - All stored full SSNs reduced to **last-4 only** (kept as a non-NPN fallback
     identifier — these agents have no NPN). Scrubbed both the `ssn` column AND
     a copy hidden in `rawData.Contact.TaxID`.
   - **Result: 0 full SSNs remain** across all 692 agents (verified).
   - The seed (`seed-valor-from-apex.js`) and import path
     (`lib/smartoffice/import-service.ts`) now persist **only last-4**, so future
     syncs cannot reintroduce full SSNs.

3. **Client-side data access removed:** the email-verification page previously
   read/updated `users` and `tenants` directly from the browser via the REST
   API. Moved to a server route (`app/api/auth/verify-email`, Prisma-backed) so
   the browser requires no REST table access. (Without this, the revoke would
   have broken email verification.)

Commits: `dfafa1b` (scrub + lockdown script + client fix). Lockdown SQL executed
in Supabase SQL Editor and verified.

## 5. Open / follow-up items

| # | Item | Owner | Why |
|---|---|---|---|
| 1 | **Pull Supabase API/edge logs** to determine if the anon REST endpoint was actually hit on the exposed tables before remediation. Dashboard → Logs → API/Edge → filter by `rest/v1`. | You (dashboard only) | Distinguishes "vulnerability fixed" from "data was accessed" — drives any breach-notification obligation (SOC 2, and GLBA given producer SSNs). Logs are NOT reachable from the DB or any app credential. |
| 2 | **`oauth_tokens` plaintext tokens** | Eng | REST access is now closed, but access/refresh tokens are stored in plaintext. Encrypt at rest or shorten lifetime. |
| 3 | **Decide RLS-vs-revoke as the documented control** | Eng + SOC 2 | The revoke + default-privileges approach is the chosen control. Document it as intentional; the linter warnings ("RLS disabled in public") will persist and should be annotated as accepted-with-compensating-control, NOT "fixed" by clicking Enable RLS (which would break the app). |
| 4 | ~~**Regression guard**~~ ✅ DONE | Eng | `scripts/security-check-rest-lockdown.mjs` (`npm run security:check`) asserts: no anon/authenticated table grants, no schema USAGE for REST roles, anon key blocked on sensitive tables, and no full SSNs stored. Exit 1 on any regression. Wire into CI and/or a scheduled run to alert if the control is ever reversed. |
| 5 | **Rotate the anon key?** | Eng | Optional. The anon key itself isn't a secret (it's public by design); rotating it does not change exposure. Not required, but note it in the assessment. |

## 6. SOC 2 control mapping (for the audit narrative)

- **CC6.1 (logical access / least privilege):** REST roles now hold zero data
  privileges; only the dedicated app role + backend roles can read. Default
  privileges locked against regression.
- **CC6.6 (boundary protection):** the internet-facing REST surface for `public`
  data is closed; the app reaches data only through the server (Prisma).
- **Data minimization (P / CC6.1):** full SSNs removed; only last-4 retained for
  a documented business purpose (agent identification absent NPN).
- **Incident response (CC7.x):** this document is the incident record; item #1
  is the access-determination step.
