# Roadmap: Anotame

## Milestones

- ✅ **v1.0 Code Quality & Security** — Phases 1–7 (shipped 2026-04-03) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Production Stability** — Phases 8–9 (shipped 2026-04-03) — [archive](.planning/milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 UI Standardization** — Phases 10–14 (shipped 2026-04-06) — [archive](.planning/milestones/v1.2-ROADMAP.md)
- 🚧 **v1.3 Advanced Operations** — Phases 15–17 (in progress)
- 📋 **v1.4 Deployment Refactor** — Phases TBD (planned)

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

### v1.3 Advanced Operations (Phases 15–17)

- [x] Phase 15: Order Lifecycle Improvements (Edit Order, Bulk Actions) (completed 2026-04-08)
- [x] Phase 16: Price List Selection in Order Wizard (completed 2026-04-09)
- [x] Phase 17: DataTable Row Count Configurability (from SEED-004) — completed 2026-04-14

## Phase Details

### Phase 15: Order Lifecycle Improvements
**Goal**: Enable staff to edit existing orders and perform bulk actions on order lists.
**Depends on**: Phase 14
**Requirements**: ORDER-01, ORDER-02

### Phase 16: Price List Selection in Order Wizard
**Goal**: Allow staff to select a price list at order creation time so client-specific pricing is locked in upfront, eliminating post-order adjustments and billing disputes.
**Depends on**: Phase 15
**Seed**: SEED-010
**Requirements**: Add price list selector to the order wizard; pass `priceListId` through `CreateOrderRequest`; apply selected list to line-item pricing at creation time.

### Phase 17: DataTable Row Count Configurability
**Goal**: Add configurable per-session row count to DataTableWrapper with localStorage persistence, addressing the 1024×768px display constraint at El Hilvan.
**Source**: SEED-004
**Scope**: Frontend only — no backend changes
**Plans:** 1 plan

Plans:
- [x] 17-01-PLAN.md — Row count store + DataTableWrapper intercept + Settings UI card

### Backlog: Print Server Integration
**Goal**: Enable staff to print both a customer ticket (comprobante) and an internal work order tag (hoja de trabajo) — from the order detail page and via bulk print from the orders list.
**Status**: Parked for v1.5+ — plans exist in `.planning/phases/backlog-print-server-integration/`

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
