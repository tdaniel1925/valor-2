# Valor — Page-by-Page Design Handoff

A complete inventory of the app for a full redesign. Hand each page (or each
section) to the design tool to mock up. Pages are grouped by user journey, not
by URL, so the redesign follows how people actually move through the product.

**App context for the designer:** Valor is a SaaS platform for insurance
agencies. The primary users are insurance **agents/advisors** (sell policies,
run quotes, manage their book), with **managers/admins** layered on top
(reporting, user management, content). It is data-dense (policies, premiums,
commissions, agent hierarchies) and currently uses a light, blue-accented theme
with a left sidebar + top bar. Multi-tenant (each agency is a tenant).

**Global shell (appears on every authenticated page — design once, reused everywhere):**
- **Left sidebar:** grouped nav (Business / Applications / Reports / AI Tools /
  Administration / Learning & Support), collapsible, dark-mode aware, org switcher.
- **Top bar:** organization selector, zoom control, "Quick Actions" button,
  notifications bell, user menu.
- **States to design for every page:** loading (skeletons), empty, error,
  unauthorized. Mobile-first; the sidebar becomes a drawer + bottom nav on mobile.

---

## 0. Pre-login / Auth (no sidebar — standalone layouts)

| Page | Route | Purpose |
|---|---|---|
| Login | `/login` | Email/password sign-in. Brand-forward. |
| Sign up | `/signup` | New user registration (name, email, password). |
| Tenant sign-up | `/signup/tenant` | New agency onboarding (agency name → subdomain). |
| Sign-up success | `/signup/success` | Confirmation + next steps. |
| Reset password | `/reset-password` | Request + set new password. |
| Verify email | `/onboarding/verify-email` | Post-signup email confirmation + redirect. |
| Onboarding success | `/onboarding/success` | Welcome / first-run. |
| No tenant / Tenant not found | `/no-tenant`, `/tenant-not-found` | Error states for bad subdomain. |
| Unauthorized | `/unauthorized` | 403 page. |

---

## 1. Home / Overview

| Page | Route | Purpose | Notes |
|---|---|---|---|
| **Dashboard** | `/dashboard` | Agent's home: MTD/QTD/YTD commission cards, production vs. goal, recent activity. | **Flagship page — design first.** Stat cards must fit large $ figures on one line. |
| **My Organization** | `/my-organization` | The agent's downline roster + book of business, scoped to them; totals (agents, policies, premiums); paginated 25/50/100. | Hierarchy/tree feel. |
| Profile | `/profile` | User's own profile + settings. |
| Goals | `/goals` | Personal production goals + tracking. |

---

## 2. Business — Cases & Policies (core daily workflow)

| Page | Route | Purpose | Notes |
|---|---|---|---|
| **Cases / Policies list** | `/cases` | The book of business: 5 stat cards (Total, Inforce, Pending, Annual Premium, Commissionable Premium) + searchable, filterable, paginated policy list. | **High-priority page.** Data-dense list — each row: policy #, insured, agent, product, carrier, premium, status badge. |
| **Case / Policy detail** | `/cases/[id]` | Single policy: full details, documents, notes, requirements, status timeline. | Tabbed or sectioned detail view. |
| Commissions | `/commissions` | Commission statements / payments list + totals. |

---

## 3. Quotes (sales tools — one design pattern, many products)

A "Quotes" hub plus product-specific quote builders. **These share a layout** —
design one quote-builder template + the hub, then the rest are variants.

| Page | Route | Purpose |
|---|---|---|
| Quotes hub | `/quotes` | List of saved quotes + "new quote" entry points. |
| Quote detail / edit | `/quotes/[id]`, `/quotes/[id]/edit` | View/edit a saved quote. |
| **Quote builder (template)** | `/quotes/income-focused/new` | Multi-step quote form. **This is the template** — the rest below are the same shell with different inputs. |
| Death Benefit Focused | `/quotes/death-benefit/new` | (variant) |
| Term Life | `/quotes/term-life/new` | (variant) |
| Annuity Quote | `/quotes/annuity-quote/new` | (variant) |
| Inforce Policy Review | `/quotes/inforce-review/new` | (variant) |
| Disability Insurance | `/quotes/disability/new` | (variant) |
| Long Term Care | `/quotes/long-term-care/new` | (variant) |
| Annuity illustration | `/quotes/annuity/[id]/illustration` | Generated illustration output. |

> ⚠️ **Cleanup note:** there are orphan duplicate quote routes NOT in the nav
> (`/quotes/term/new`, `/quotes/life/new`, `/quotes/annuity/new`). Only the
> nav-linked ones above are live — **don't mock up the duplicates.**

---

## 4. Illustrations

| Page | Route | Purpose |
|---|---|---|
| Compare | `/illustrations/compare` | Side-by-side product illustration comparison. |
| Term / Universal / Whole Life | `/illustrations/term-life`, `/universal-life`, `/whole-life` | Per-product illustration builders (same template as Compare). |

---

## 5. Applications

| Page | Route | Purpose |
|---|---|---|
| New Life Application | `/applications/life/new` | Full life-insurance application form (multi-section, includes sensitive PII fields). |

---

## 6. Contracts & Underwriting

| Page | Route | Purpose |
|---|---|---|
| Contracts | `/contracts` | Agent's carrier contracts/appointments list. |
| Contract detail | `/contracts/[id]` | Single contract. |
| Underwriting Guidelines | `/underwriting-guidelines` | Reference content. |
| Impairment Questionnaires (Catalog) | `/catalog` | Searchable catalog of UW questionnaires. |
| IntelliSheets | `/intellisheets` | UW reference tool. |

---

## 7. Reports (manager/admin analytics)

A reports hub + many report views. **Shared template** — a report header +
filters + chart/table body.

| Page | Route | Purpose |
|---|---|---|
| **Reports Hub** | `/reports` | Landing grid of all reports. |
| Production | `/reports/production` | Production analytics. |
| Agents | `/reports/agents` | Per-agent performance. |
| Carriers | `/reports/carriers` | Per-carrier breakdown. |
| Commissions | `/reports/commissions` | Commission analytics. |
| Executive | `/reports/executive` | High-level exec summary. |
| Forecast | `/reports/forecast` | Forward-looking projections. |
| Goal Tracking | `/reports/goal-tracking` | Goals vs. actuals. |
| Report Builder | `/reports/builder` | Custom report builder. |

---

## 8. AI Tools (new — distinct visual identity, violet accent)

The conversational + insight suite. **Two design patterns:** (a) the chat
interface, (b) the "insight tool" template (input → run → rendered result).

| Page | Route | Pattern | Purpose |
|---|---|---|---|
| **AI Assistant** | `/ai/chat` | **Chat** | ChatGPT-style: conversation rail (pinned + recent, new chat, rename/pin/delete) + chat pane with formatted responses + sticky input. **Design this fully.** |
| Smart Search | `/ai/search` | Insight | NL → filtered policy results. |
| Revenue Intelligence | `/ai/revenue-intelligence` | Insight (findings list) | Severity-ranked findings cards. |
| Cross-Sell | `/ai/cross-sell` | Insight (findings list) | Opportunity cards. |
| Anomalies | `/ai/anomalies` | Insight (findings list) | Anomaly cards. |
| Agent Coach | `/ai/agent-coach` | Insight (advisor input → plan) | Coaching plan layout. |
| Carrier Intelligence | `/ai/carrier-intelligence` | Insight (summary + table) | Analysis + carrier table. |
| Benchmarking | `/ai/benchmarking` | Insight (summary) | Advisor-vs-peer comparison. |
| Meeting Prep | `/ai/meeting-prep` | Insight (prep sheet) | Key numbers / talking points / questions. |
| Report Builder (AI) | `/ai/report-builder` | Insight (markdown report) | Generated written report. |
| Smart Emails | `/ai/smart-emails` | Insight (subject+body) | Email draft output. |

> **Insight-tool template:** all 10 non-chat tools share one shell (title +
> description, optional text input, "Run" button, result area). Design the
> template + the 3 distinct result shapes: **findings-cards**, **summary+table**,
> **prep-sheet/plan**.

---

## 9. Learning Center (LMS)

| Page | Route | Purpose |
|---|---|---|
| Learning Center (catalog) | `/learning` | Course catalog; locked courses greyed with unlock message; progress bars. |
| Course (lesson list) | `/learning/[courseId]` | Sequential lessons, lock states. |
| Lesson player | `/learning/[courseId]/[lessonId]` | No-skip video player + Mark Done + next-lesson nav. |
| Video Library | `/video-library` | Standalone video grid. |
| Video detail | `/video-library/[id]` | Single video player. |

---

## 10. Resources & Support

| Page | Route | Purpose |
|---|---|---|
| Resources | `/resources` | Document/resource library. |
| Community | `/community` | Community/forum. |
| Knowledge Base | `/knowledge-base` | Articles. |
| Help Center | `/help` | Support hub. |
| Help: Quick Start | `/help/quick-start` | Onboarding guide. |
| Help: Articles / Category / Article | `/help/articles/[slug]`, `/help/category/[categoryId]` | Help content. |
| Help: Videos | `/help/videos` | Help video index. |
| Help: Contact | `/help/contact` | Contact/support form. |

---

## 11. Integrations (launch tiles + a few embedded pages)

Most integrations are **launch links** (open external tools via SSO), not full
pages — design these as **tiles/cards** on an integrations landing area:
WinFlex, iGo, FormsPipe, FireLight, SureLC, XRAE.

Embedded integration pages that DO need a layout:

| Page | Route |
|---|---|
| iPipeline hub + sub-tools | `/integrations/ipipeline`, `/lifepipe`, `/igo`, `/formspipe`, `/productinfo` |
| WinFlex | `/integrations/winflex` |
| XRAE | `/integrations/xrae` |

---

## 12. Administration (admin/manager only)

| Page | Route | Purpose |
|---|---|---|
| Users | `/admin/users` | User management table (invite, roles, status). |
| Organizations | `/admin/organizations` | Tenant/org list. |
| Organization detail / settings | `/admin/organizations/[id]`, `/[id]/settings` | Single org admin. |
| Roles & Permissions | `/admin/roles` | RBAC management. |
| Contracts Admin | `/admin/contracts` | Agency-wide contracts. |
| Integrations (admin) | `/admin/integrations` | Integration config. |
| Audit Logs | `/admin/audit-logs` | Security/audit trail table. |
| **Course Builder** | `/admin/learning`, `/admin/learning/[courseId]` | LMS authoring: courses, lessons, grants. |
| Training Reports | `/admin/learning/reports` | LMS completion dashboard + CSV. |
| SmartOffice Upload | `/admin/smartoffice-upload` | Data import UI. |
| Video Library Admin | `/admin/video-library` | Video management. |
| Billing | `/settings/billing` | Subscription/billing. |

---

## ⚠️ Retire / do NOT design (legacy or superseded)

These exist in code but are **dead or replaced** — exclude from the redesign:

- `/training`, `/training/courses`, `/training/my-learning` — **superseded by
  `/learning`** (Learning Center). No longer in nav.
- `/smartoffice`, `/smartoffice/dashboard`, `/smartoffice/agents`,
  `/smartoffice/policies`, `/smartoffice/import` — the older SmartOffice UI;
  **`/cases` + `/my-organization` are the live replacements.** Confirm before
  cutting (some admin import flows may still reference `/admin/smartoffice-upload`).
- Orphan quote routes: `/quotes/term/new`, `/quotes/life/new`,
  `/quotes/annuity/new` (duplicates of the nav-linked ones).

---

## Suggested design order (by impact)

1. **Global shell** (sidebar + top bar + states) — everything inherits it.
2. **Dashboard** — the daily landing page.
3. **Cases list + Case detail** — core workflow, most-used.
4. **AI Assistant (chat)** + the **insight-tool template** — newest, distinct identity.
5. **Quote builder template** + **Quotes hub**.
6. **Reports template** + **Reports Hub**.
7. **My Organization**.
8. **Auth pages** (login/signup) — brand-forward first impression.
9. Everything else as variants of the templates above.

**Template-reuse summary** (mock the template once, not every page):
quote builders (8 → 1 template), illustration builders (4 → 1), report views
(8 → 1 + hub), AI insight tools (10 → 1 template + 3 result shapes), help/content
pages (1 article template). That collapses ~110 routes into roughly **20-25
unique screens** to actually design.
