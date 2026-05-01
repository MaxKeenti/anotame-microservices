# Roadmap: Anotame

## Milestones

- ✅ **v1.0 Code Quality & Security** — Phases 1–7 (shipped 2026-04-03) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Production Stability** — Phases 8–9 (shipped 2026-04-03) — [archive](.planning/milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 UI Standardization** — Phases 10–14 (shipped 2026-04-06) — [archive](.planning/milestones/v1.2-ROADMAP.md)
- ✅ **v1.3 Advanced Operations** — Phases 15–17 (shipped 2026-04-14) — [archive](.planning/milestones/v1.3-ROADMAP.md)
- ✅ **v1.4 Deployment Refactor** — Phases 18–21 (shipped 2026-04-19) — [archive](.planning/milestones/v1.4-ROADMAP.md)
- 🔵 **v1.5 Bilingual Launch + KPI Intelligence** — Phases 22–26

## Phases

<details>
<summary>✅ v1.0 Code Quality & Security (Phases 1–7) — SHIPPED 2026-04-03</summary>

- [x] Phase 1: Close UI Color Standardization (1/1 plans) — completed 2026-04-01
- [x] Phase 2: Security Foundations (4/4 plans) — completed 2026-04-01
- [x] Phase 3: Data Integrity Fixes (3/3 plans) — completed 2026-04-01
- [x] Phase 4: Exception Handling Standardization (3/3 plans) — completed 2026-04-02
- [x] Phase 5: Frontend Pattern Compliance (3/3 plans) — completed 2026-04-02
- [x] Phase 6: Database Migration Framework (4/4 plans) — completed 2026-04-02
- [x] Phase 7: Operational Reliability & Housekeeping (3/3 plans) — completed 2026-04-03

Full phase details: [.planning/milestones/v1.0-ROADMAP.md](.planning/milestones/v1.0-ROADMAP.md)

</details>
<details>
<summary>✅ v1.1 Production Stability (Phases 8–9) — SHIPPED 2026-04-03</summary>

- [x] Phase 8: Production Bug Fixes (2/2 plans) — completed 2026-04-03
- [x] Phase 9: DataTableWrapper Pattern Completion (2/2 plans) — completed 2026-04-03

Full phase details: [.planning/milestones/v1.1-ROADMAP.md](.planning/milestones/v1.1-ROADMAP.md)

</details>
<details>
<summary>✅ v1.2 UI Standardization (Phases 10–14) — SHIPPED 2026-04-06</summary>

- [x] Phase 10: shadcn Preset Init & Design Token Refresh (2/2 plans) — completed 2026-04-04
- [x] Phase 11: DataTableWrapper Filter Consolidation (1/1 plans) — completed 2026-04-04
- [x] Phase 12: Forms & Dialogs Standardization Audit (3/3 plans) — completed 2026-04-05
- [x] Phase 13: Color Audit & WCAG Compliance (1/1 plans) — completed 2026-04-05
- [x] Phase 14: Tenant Theming (3/3 waves) — completed 2026-04-06

Full phase details: [.planning/milestones/v1.2-ROADMAP.md](.planning/milestones/v1.2-ROADMAP.md)

</details>

<details>
<summary>✅ v1.3 Advanced Operations (Phases 15–17) — SHIPPED 2026-04-14</summary>

- [x] Phase 15: Order Lifecycle Improvements (Edit Order, Bulk Actions) (completed 2026-04-08)
- [x] Phase 16: Price List Selection in Order Wizard (completed 2026-04-09)
- [x] Phase 17: DataTable Row Count Configurability (from SEED-004) — completed 2026-04-14

Full phase details: [.planning/milestones/v1.3-ROADMAP.md](.planning/milestones/v1.3-ROADMAP.md)

</details>

<details>
<summary>✅ v1.4 Deployment Refactor (Phases 18–21) — SHIPPED 2026-04-19</summary>

- [x] Phase 18: DB Ownership + Fresh V1 Baselines (3/3 plans) — completed 2026-04-16
- [x] Phase 19: Application Configuration (2/2 plans) — completed 2026-04-16
- [x] Phase 20: Dockerfile Fixes + Railway Deployment (3/3 plans) — completed 2026-04-18
- [x] Phase 21: Local Dev Docker Compose (2/2 plans) — completed 2026-04-18

Full phase details: [.planning/milestones/v1.4-ROADMAP.md](.planning/milestones/v1.4-ROADMAP.md)

</details>

### v1.5 Bilingual Launch + KPI Intelligence (Phases 22–26)

- [ ] Phase 22: i18n Naming Convention + Locale Infrastructure (I18N-01, I18N-06, I18N-07)
- [ ] Phase 23: Paraglide String Extraction + EN Translation (I18N-02, I18N-03, I18N-04, I18N-05)
- [ ] Phase 24: Partial Payment Ledger (PAY-01 – PAY-07)
- [ ] Phase 25: Financial KPIs (KPI-01 – KPI-06)
- [ ] Phase 26: Workload Calendar + Dashboard Widget (CAL-01 – CAL-06)
- [ ] Phase 27: Catalog Wizard + Categorized Menu Modal

### Backlog: Print Server Integration
**Goal**: Enable staff to print both a customer ticket (comprobante) and an internal work order tag (hoja de trabajo) — from the order detail page and via bulk print from the orders list.
**Status**: Parked for v1.6+ — plans exist in `.planning/phases/backlog-print-server-integration/`

---

## Phase Details

### Phase 22: i18n Naming Convention + Locale Infrastructure
**Goal**: Establish the i18n key naming convention (SEED-002), initialize Paraglide project, add `user.locale` column to identity-service, wire SSR locale resolution in `hooks.server.ts`, and add the locale switcher to the profile page — so that the infrastructure is ready for Phase 23 extraction
**Depends on**: Nothing (first v1.5 phase)
**Requirements**: I18N-01, I18N-06, I18N-07
**Success Criteria** (what must be TRUE):
  1. A naming convention document exists and a lint regex (`/^[a-z][a-zA-Z]*(\.[a-z][a-zA-Z]*){1,2}$/`) validates all message keys — no keys with >3 segments or non-camelCase
  2. Paraglide is initialized (`project.inlang/`, `paraglideVitePlugin` in `vite.config.ts`, `src/lib/paraglide/` generated) and the SvelteKit dev server starts without errors
  3. `tca_user` table has a `locale VARCHAR(10) DEFAULT 'es-MX' NOT NULL` column (Flyway V2 migration in identity-service)
  4. Profile page shows a locale `<select>` with "Español (México)" and "English" in native labels; changing it persists to the user's profile
  5. `hooks.server.ts` reads the user's saved locale from session and sets Paraglide locale before `load()` runs — SSR output matches the user's preference; anonymous users fall back to `es-MX`
**Plans**: TBD

### Phase 23: Paraglide String Extraction + EN Translation
**Goal**: Extract every hardcoded Spanish string in the SvelteKit frontend into Paraglide message files following the naming convention, generate AI-translated EN translations, wire backend error codes to frontend Paraglide resolution, and enable soft locale swap — so that the app is fully bilingual ES/EN end-to-end
**Depends on**: Phase 22 (naming convention and Paraglide infrastructure must be in place before extraction begins)
**Requirements**: I18N-02, I18N-03, I18N-04, I18N-05
**Success Criteria** (what must be TRUE):
  1. Zero hardcoded Spanish strings remain in `anotame-web/src/` — all user-facing text uses `m.domain.component.purpose()` Paraglide calls
  2. An `en.json` message file exists with AI-generated English translations for every key in `es-MX.json`
  3. Switching locale to English in the profile shows the entire UI in English — no mixed-language text visible
  4. Backend error responses (400, 404, 409, 500) return a JSON `{ "error": "ERR.CODE" }` field; frontend error handling resolves codes to localized toast messages via Paraglide
  5. Locale change on the profile page takes effect immediately via `setLocale()` + `invalidateAll()` — no full page reload, no lost form state
**Plans**: TBD

### Phase 24: Partial Payment Ledger
**Goal**: Implement an append-only payment ledger (`tco_order_payment`) in sales-service with a modal "Agregar pago" on order detail, reverse-chronological payment history, computed balance, over-payment validation, negative refund entries, and removal of `amountPaid` from the order edit wizard — so that every payment is auditable and financial KPIs can use payment dates
**Depends on**: Nothing (independent of i18n track — can run in parallel with Phase 22/23)
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07
**Success Criteria** (what must be TRUE):
  1. `tco_order_payment` table exists (Flyway V2 migration in sales-service) with columns: `id`, `order_id`, `amount`, `method`, `note`, `recorded_at`, `recorded_by_user_id`
  2. POST `/orders/{id}/payments` creates an immutable ledger entry and recomputes `tco_order.amount_paid` from `SUM(tco_order_payment.amount)` in a single transaction
  3. Order detail page shows a "Agregar pago" button → modal (amount + method + note); payment history panel displays entries reverse-chronologically
  4. Order detail prominently displays computed balance (totalAmount − amountPaid) — updated immediately after payment submission
  5. Server rejects payments where `amount + currentPaid > totalAmount` with error code `ERR.PAYMENT.EXCEEDS_BALANCE`
  6. Negative payment entries (refunds) require a note; validation ensures negative entries don't exceed total positive entries
  7. The order edit wizard no longer has an editable `amountPaid` field — payment changes happen exclusively through the payment modal
**Plans**: TBD

### Phase 25: Financial KPIs
**Goal**: Add 5 KPI widgets to the admin dashboard — revenue trend (line chart, day/week/month), service profitability (table with revenue-per-minute), top 5 customers, at-risk customers (60+ day idle), and repeat rate — all anchored to payment dates and restricted to ADMIN role
**Depends on**: Phase 24 (payment ledger must exist for date-accurate revenue computation)
**Requirements**: KPI-01, KPI-02, KPI-03, KPI-04, KPI-05, KPI-06
**Success Criteria** (what must be TRUE):
  1. Revenue trend widget shows a line chart with toggleable day/week/month granularity, 12 buckets, using `tco_order_payment.recorded_at` as the time dimension (NOT `tco_order.created_at`)
  2. Each KPI widget shows a delta badge comparing current period vs. previous period (▲ 12% / ▼ 3%)
  3. Service profitability table displays: service name, order count, gross revenue (MXN), total duration minutes, revenue-per-minute — sortable, with 30/90-day period toggle
  4. "Top 5 Customers" widget shows customer name, order count, and lifetime revenue (YTD)
  5. "At-Risk Customers" widget lists customers with no order in 60+ days, ordered by lifetime revenue descending (top 10)
  6. Repeat rate shows a single percentage metric: customers with 2+ orders in the last 90 days / total customers in window
  7. All KPI endpoints require ADMIN role — EMPLOYEE users do not see KPI widgets
**Plans**: TBD

### Phase 26: Workload Calendar + Dashboard Widget
**Goal**: Build a full month-view calendar page with color-coded capacity cells, daily popover (earnings + workload + orders), 7-day dashboard strip widget, mobile agenda fallback, and past-vs-future visual distinction — so that the owner can see workload and revenue at a glance (SEED-007)
**Depends on**: Nothing strictly (capacity data comes from existing schedule module; revenue data improves with Phase 24 ledger but works without it)
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06
**Success Criteria** (what must be TRUE):
  1. `/dashboard/calendar` page renders a month grid with color-coded day cells: <50% capacity green, 50-85% amber, >85% red
  2. Clicking a day opens a shadcn Popover showing: date + holiday indicator, capacity bar (`X min / Y min (Z%)`), revenue (MXN), and order list (customer — garment count — status)
  3. Past days render with desaturated styling (actual data); future days render with saturated styling (forecast data); current day is visually distinct
  4. Main dashboard page includes a compact 7-day horizontal strip widget (today + next 6 days) using the same color logic; clicking a day navigates to the calendar page
  5. On screens narrower than 640px, the month grid is replaced with an agenda/list view showing daily summaries
  6. Days with no schedule entry (holidays, weekends, unconfigured days) display as "closed" (gray/hatched) — not red or green; no division-by-zero in capacity percentage

### Phase 27: Catalog Wizard + Categorized Menu Modal
**Goal**: Introduce a guided 3-step wizard for creating Garment+Service catalog entries (with a persisted user preference to opt into "pro" table mode), support editing existing services through the wizard for UX consistency, and restructure the menu modal from a flat 12-item grid into 4 categorized sections — so non-technical users have a guided creation/editing path while power users keep direct table access
**Depends on**: Nothing (frontend-only, independent of v1.5 phases 22–26)
**Requirements**: TBD (no existing REQ ids — derived from `.gsd/implementation_plan.md` PRD)
**Locked Decisions**:
  - Default `catalogMode` is `'pro'` for users with existing catalog entries; `'wizard'` only for empty catalogs
  - Wizard supports BOTH create and edit (pre-populated steps) for parity with pro mode
  - Price lists remain out of scope — separate admin-only flow as today
**Success Criteria** (what must be TRUE):
  1. `catalogPreferences` persisted store exists (LocalStorage via runed `PersistedState`); Settings page exposes wizard/pro toggle following the same card pattern as theme/table-rows
  2. `/dashboard/catalog/wizard` route renders a 3-step flow (Garment → Service → Review) using the same stepper pattern, mobile expand tray, and `onNext`/`onBack` interface as `orders/new/+page.svelte`
  3. Wizard create flow completes end-to-end: creates new garment (or selects existing) and creates a service against it via the existing `/catalog/garments` and `/catalog/services` REST endpoints — no backend changes
  4. Wizard edit flow: navigating to `/dashboard/catalog/wizard?serviceId={id}` pre-populates all 3 steps with the existing garment + service data; submitting issues PUT/PATCH against the existing endpoints
  5. In wizard mode, "Agregar"/"Editar" actions on garments and services pages route to the wizard; in pro mode they open the existing dialogs — switching modes in Settings flips both pages without reload
  6. Menu modal renders 4 categorized sections (Operaciones, Catálogo, Administración, Configuración) with section headers; admin-only categories/items hidden for non-admins; `wizardOnly` items (Asistente de Catálogo) hidden in pro mode; existing footer (user info + logout) preserved
  7. Wizard page is admin-guarded via `useAuthGuard` and renders correctly at 375px width (touch targets `h-12`, `touch-manipulation`)
**Plans**: 5 plans
- [ ] 27-PLAN-1.md — catalogPreferences store + Settings 'Experiencia de Catálogo' toggle card
- [ ] 27-PLAN-2.md — CatalogWizardState singleton + 3 step components (garment/service/review)
- [ ] 27-PLAN-3.md — /dashboard/catalog/wizard page route with stepper + admin guard + ?serviceId edit URL
- [ ] 27-PLAN-4.md — Mode-aware routing on garments/services pages (Agregar/Editar → wizard in wizard mode)
- [ ] 27-PLAN-5.md — Categorized menu modal (4 sections) + menu.ts restructure with wizardOnly + adminOnly filters

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Close UI Color Standardization | v1.0 | 1/1 | Complete | 2026-04-01 |
| 2. Security Foundations | v1.0 | 4/4 | Complete | 2026-04-01 |
| 3. Data Integrity Fixes | v1.0 | 3/3 | Complete | 2026-04-01 |
| 4. Exception Handling Standardization | v1.0 | 3/3 | Complete | 2026-04-02 |
| 5. Frontend Pattern Compliance | v1.0 | 3/3 | Complete | 2026-04-02 |
| 6. Database Migration Framework | v1.0 | 4/4 | Complete | 2026-04-02 |
| 7. Operational Reliability & Housekeeping | v1.0 | 3/3 | Complete | 2026-04-03 |
| 8. Production Bug Fixes | v1.1 | 2/2 | Complete | 2026-04-03 |
| 9. DataTableWrapper Pattern Completion | v1.1 | 2/2 | Complete | 2026-04-03 |
| 10. shadcn Preset Init & Design Token Refresh | v1.2 | 2/2 | Complete    | 2026-04-04 |
| 11. DataTableWrapper Filter Consolidation | v1.2 | 1/1 | Complete    | 2026-04-04 |
| 12. Forms & Dialogs Standardization Audit | v1.2 | 3/3 | Complete    | 2026-04-05 |
| 13. Color Audit & WCAG Compliance | v1.2 | 1/1 | Complete    | 2026-04-05 |
| 14. Tenant Theming | v1.2 | 3/3 | Complete   | 2026-04-06 |
| 15. Order Lifecycle Improvements | v1.3 | 3/3 | Complete   | 2026-04-08 |
| 16. Price List Selection in Order Wizard | v1.3 | 1/1 | Complete | 2026-04-09 |
| 17. DataTable Row Count Configurability | v1.3 | 1/1 | Complete | 2026-04-14 |
| 18. DB Ownership + Fresh V1 Baselines | v1.4 | 3/3 | Complete    | 2026-04-16 |
| 19. Application Configuration | v1.4 | 2/2 | Complete   | 2026-04-16 |
| 20. Dockerfile Fixes + Railway Deployment | v1.4 | 3/3 | Complete    | 2026-04-18 |
| 21. Local Dev Docker Compose | v1.4 | 2/2 | Complete    | 2026-04-18 |
| 22. i18n Naming Convention + Locale Infrastructure | v1.5 | 0/? | Pending | — |
| 23. Paraglide String Extraction + EN Translation | v1.5 | 0/? | Pending | — |
| 24. Partial Payment Ledger | v1.5 | 0/? | Pending | — |
| 25. Financial KPIs | v1.5 | 0/? | Pending | — |
| 26. Workload Calendar + Dashboard Widget | v1.5 | 0/? | Pending | — |
| 27. Catalog Wizard + Categorized Menu Modal | v1.5 | 0/5 | Pending | — |

