# Project Research Summary — v1.5 Bilingual Launch + KPI Intelligence

**Project:** Anotame Microservices
**Domain:** Garment-repair / alteration shop SaaS (one live tenant: El hilvan)
**Researched:** 2026-04-19
**Confidence:** HIGH overall

## Executive Summary

Anotame v1.5 adds three major capability dimensions to an already-functional order management platform: **bilingual UX** (Paraglide i18n across SvelteKit + Quarkus error codes), a **partial-payment ledger** (append-only `tco_order_payment` enabling accurate financial KPIs), and **operational intelligence** (revenue trends, service profitability, customer retention, workload calendar).

The research strongly favors a **single-catalog i18n architecture**: Paraglide compiles all user-facing strings in the frontend; backend services return machine-readable error codes that the frontend resolves to localized text. This eliminates dual-catalog drift and decouples backend deploys from translation updates. For charting, native Chart.js with Svelte 5's `$effect` lifecycle is the cleanest integration — no framework-specific wrapper needed. The workload calendar should be a custom Svelte grid (~200 lines) reusing existing shadcn Popover, since FullCalendar is 90KB+ of complexity we won't use.

The critical sequencing constraint is that the **i18n naming convention (SEED-002) must land before any string extraction begins** — otherwise hundreds of keys get named ad-hoc and then renamed, doubling the work. The **payment ledger must land before financial KPIs**, since revenue-by-date is only accurate when anchored to payment timestamps, not order creation dates.

## Key Findings

### Recommended Stack

_Full details: [STACK.md](./STACK.md)_

**Stack additions for v1.5 (everything else stays unchanged):**
- `@inlang/paraglide-js` v2+: compile-time i18n with tree-shaking and type-safe keys; replaces any need for i18next or runtime loaders
- `chart.js` v4.4+: canvas-based charts for revenue trend and service profitability widgets; native Svelte 5 integration via `$effect` + `bind:this`
- Custom Svelte calendar grid: ~200 lines of Svelte using existing shadcn Popover + Tailwind grid; FullCalendar rejected as overkill

**What NOT to add:**
- No `@inlang/paraglide-sveltekit` (deprecated)
- No FullCalendar (overkill for color-coded cells + popovers)
- No Quarkus `@MessageBundle` (error codes approach keeps translation catalog in one place)
- No WebSocket for dashboard (reload-on-visit is sufficient for shop use case)

### Expected Features

_Full details: [FEATURES.md](./FEATURES.md)_

**Must have (table stakes — missing = broken feel):**
- Per-user locale setting with native-label switcher on profile page (not header nav)
- Soft locale swap (no reload, no lost form state)
- Add Payment modal on order detail with append-only ledger
- Payment history panel (reverse-chronological) with computed balance
- Revenue trend chart (day/week/month toggle, 12 buckets, delta vs. previous period)
- Month-view workload calendar with color-coded capacity (<50% green, 50-85% amber, >85% red)
- Mobile agenda fallback for calendar on <640px screens

**Should have (differentiators — Anotame's edge):**
- Backend error messages resolved in user's locale (error codes pattern)
- Past vs. future visual distinction on calendar (saturated vs. desaturated)
- Single-popover calendar day view (earnings + workload + order list together)
- 7-day dashboard strip widget
- Service-type profitability by revenue-per-minute (sharper than gross sales)
- Top customers + at-risk customers (60+ day idle) + repeat rate KPI

**Defer (v1.6+):**
- Configurable calendar thresholds per establishment
- Configurable payment method list (beyond hardcoded Efectivo/Tarjeta/Transferencia)
- Customer credit / over-payment handling
- Budget/revenue target goal-setting KPIs

### Architecture Approach

_Full details: [ARCHITECTURE.md](./ARCHITECTURE.md)_

v1.5 extends the existing architecture without changing its fundamentals. The key architectural decisions are:

1. **Error codes, not localized backend strings** — backend returns `ERR.ORDER.LOCKED`; frontend resolves via Paraglide
2. **Append-only payment ledger** — `tco_order_payment` is immutable; `amountPaid` on order is recomputed on write within a single transaction
3. **Frontend-joined calendar data** — SvelteKit `+page.server.ts` calls sales-service (revenue/workload) and operations-service (capacity) in parallel, merges responses
4. **Soft locale swap** — `setLocale()` + `invalidateAll()`, no full page reload

**Major new components:**
1. Paraglide message catalog (SvelteKit) — single source of truth for all user-facing text
2. `tco_order_payment` table (sales-db) — append-only ledger with `recorded_at` timestamps
3. KPI aggregation endpoints (sales-service) — revenue trend, profitability, retention
4. Capacity aggregation endpoint (operations-service) — daily capacity from schedule
5. Calendar/KPI/Payment UI components (SvelteKit) — Chart.js widgets, custom calendar grid, payment modal

### Critical Pitfalls

_Full details: [PITFALLS.md](./PITFALLS.md)_

1. **Naming convention before extraction** — if i18n keys are extracted with ad-hoc names, all 500+ keys need renaming later. Convention (SEED-002) must be the FIRST v1.5 deliverable.
2. **Payment ledger transaction boundary** — INSERT payment and UPDATE amountPaid MUST be in a single `@Transactional` method, or a crash between them creates phantom revenue.
3. **Revenue date dimension** — KPI revenue queries MUST use `tco_order_payment.recorded_at`, NOT `tco_order.created_at`; otherwise split-payment orders distort monthly reports.
4. **amountPaid wizard backdoor** — the existing order edit wizard has a direct `amountPaid` field; this must be REMOVED when the ledger ships, or operators can bypass the audit trail.
5. **Calendar division by zero** — holidays/weekends have 0 capacity; render as "closed" (gray), not "overloaded" (red).

## Implications for Roadmap

Based on research, suggested phase structure (continuing from Phase 21):

### Phase 22: i18n Naming Convention + Infrastructure
**Rationale:** Must land first — convention-before-extraction is the single most important sequencing constraint (Pitfall #1)
**Delivers:** SEED-002 naming convention document, lint rule, Paraglide project init, Vite plugin config, `user.locale` column in identity-db
**Addresses:** SEED-002, per-user locale infrastructure
**Avoids:** Pitfall #1 (naming convention after extraction), Pitfall #7 (SSR locale flash)

### Phase 23: Paraglide String Extraction + EN Translation
**Rationale:** Long pole of v1.5 (~1000 strings); depends on naming convention from Phase 22
**Delivers:** All hardcoded ES strings extracted to Paraglide messages; AI-generated EN translations; error code resolution wired
**Addresses:** Full bilingual UX, backend error localization
**Avoids:** Pitfall #2 (common key reuse)

### Phase 24: Partial Payment Ledger
**Rationale:** Must land before KPIs (revenue accuracy depends on payment timestamps); independent of i18n work
**Delivers:** `tco_order_payment` table, AddPaymentModal, PaymentHistory panel, balance computation, amountPaid removal from edit wizard
**Addresses:** SEED-001 remainder, accurate financial foundation
**Avoids:** Pitfall #3 (transaction boundary), Pitfall #4 (over-payment), Pitfall #8 (wizard backdoor)

### Phase 25: Financial KPIs
**Rationale:** Depends on payment ledger (Phase 24) for date-accurate revenue
**Delivers:** Revenue trend chart, service profitability table, top customers, at-risk customers, repeat rate
**Addresses:** Financial intelligence for shop owner
**Avoids:** Pitfall #5 (wrong date dimension)
**Uses:** Chart.js native integration

### Phase 26: Workload Calendar + Dashboard Widget
**Rationale:** Independent of KPIs but depends on existing schedule module; can run in parallel with Phase 25 if needed
**Delivers:** Full month calendar page with color-coded cells, daily popover, 7-day dashboard strip, mobile agenda fallback
**Addresses:** SEED-007
**Avoids:** Pitfall #6 (calendar capacity=0)
**Uses:** Custom Svelte calendar grid, shadcn Popover

### Phase Ordering Rationale

```
Phase 22 (naming + infrastructure) ──must precede─→ Phase 23 (extraction)
Phase 24 (payment ledger) ──must precede─→ Phase 25 (KPIs)

Phase 22/23 (i18n track) ─── independent of ─── Phase 24/25 (financial track)
Phase 26 (calendar) ─── independent of ─── Phase 23 (extraction)
Phase 26 (calendar) ─── independent of ─── Phase 25 (KPIs)
```

Two parallel tracks are possible:
- **Track A:** 22 → 23 (i18n foundation → extraction)
- **Track B:** 24 → 25 (payment ledger → KPIs)
- **Phase 26** can run after either track completes

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 23:** Paraglide SvelteKit `hooks.server.ts` integration — verify exact lifecycle hook ordering for locale setting before SSR `load()`
- **Phase 26:** Calendar aggregation endpoint — clarify whether workload numerator should be based on promised-pickup-date or order status transition timestamps

Phases with standard patterns (skip research-phase):
- **Phase 22:** i18n naming convention + Flyway migration for user.locale — well-documented, straightforward
- **Phase 24:** Append-only ledger + CRUD endpoint — textbook accounting pattern, no research needed
- **Phase 25:** Chart.js integration + SQL aggregation queries — standard OLAP-style queries

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries are current, versions verified; Paraglide is the project's stated i18n choice |
| Features | HIGH on bilingual/payments; MEDIUM on KPI specifics | Competitor analysis for bilingual + payments is strong; KPI metric definitions are clear; calendar threshold percentages are our best estimate |
| Architecture | HIGH | Error-codes pattern and append-only ledger are well-established; frontend-joined calendar is a pragmatic choice for 4-service architecture |
| Pitfalls | HIGH | All 8 pitfalls are specific to this project's situation (adding features to a live system); prevention strategies map directly to phases |

**Overall confidence:** HIGH

### Gaps to Address

- **Calendar capacity source exact query:** which schedule tables/columns to use for per-day capacity — verify during Phase 26 planning by inspecting operations-service schema
- **Paraglide SSR hook exact API:** the `setLocale()` before `load()` pattern needs verification against latest Paraglide docs at Phase 22 planning time
- **EN translation quality bar:** "AI-generated, unreviewed" is the decision, but the pipeline tool (which AI? what prompt?) is unspecified — decide during Phase 23 planning
- **Payment method enum values:** hardcoded for v1.5, but exact values (CASH, CARD, TRANSFER?) need confirmation with shop owner — decide during Phase 24 planning

## Sources

### Primary (HIGH confidence)
- [Paraglide JS — inlang docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) — setup, tree-shaking, message keys
- [Locize — i18n key naming guide](https://www.locize.com/blog/guide-to-i18n-key-naming/) — naming patterns, no-reuse rule
- [Chart.js v4 — official docs](https://www.chartjs.org/docs/latest/) — Svelte integration, tree-shaking
- [RepairDesk / Geelus / Orderry](https://www.repairdesk.co/) — tailor shop payment UX patterns

### Secondary (MEDIUM confidence)
- [Smashing Magazine — language selector UX](https://www.smashingmagazine.com/2022/05/designing-better-language-selector/) — profile vs. header switcher
- [Scopestack — service industry KPIs](https://scopestack.io/blog/professional-services-kpis-to-measure-profitability) — revenue-per-minute, retention metrics
- [FullCalendar docs](https://fullcalendar.io/docs/) — evaluated and rejected for v1.5

### Tertiary (LOW confidence)
- Calendar capacity threshold percentages (50/85%) — derived from multiple vendor patterns; no single standard exists; verify with shop owner post-launch

---
*Research completed: 2026-04-19*
*Ready for requirements: yes*
