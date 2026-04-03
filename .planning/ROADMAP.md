# Roadmap: Anotame

## Milestones

- ✅ **v1.0 Code Quality & Security** — Phases 1–7 (shipped 2026-04-03) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Production Stability** — Phases 8–9 (in progress)
- 📋 **v1.2 Deployment Refactor** — Phases TBD (planned)

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

### 🚧 v1.1 Production Stability (In Progress)

**Milestone Goal:** Fix the three known production regressions and complete the DataTableWrapper migration across all remaining catalog and admin pages so the app is fully stable and pattern-consistent for the live client.

- [ ] **Phase 8: Production Bug Fixes** - Fix KPI dashboard API path, customers page reactive loop, and FK constraint error messaging
- [ ] **Phase 9: DataTableWrapper Pattern Completion** - Migrate garments, services, price lists, and admin users pages to the standardized TanStack Table wrapper

## Phase Details

### Phase 8: Production Bug Fixes
**Goal**: All three production bugs fixed — KPI dashboard loads, customers page renders, delete operations show meaningful errors
**Depends on**: Phase 7 (v1.0 complete)
**Requirements**: BUG-01, BUG-02, BUG-03
**Success Criteria** (what must be TRUE):
  1. The KPI dashboard page loads and displays metrics data without a network error
  2. The customers page renders its data table without crashing or triggering an infinite reactive loop
  3. Attempting to delete an order or work order that has associated data displays a user-friendly message instead of a raw error
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — Fix KPI dashboard API path (BUG-01) and DataTableWrapper reactive loop (BUG-02)
- [ ] 08-02-PLAN.md — Add 409-aware FK constraint error messaging for orders and operations pages (BUG-03)

**UI hint**: yes

### Phase 9: DataTableWrapper Pattern Completion
**Goal**: All four remaining catalog and admin pages migrated to the DataTableWrapper pattern
**Depends on**: Phase 8
**Requirements**: FE-01, FE-02, FE-03, FE-04
**Success Criteria** (what must be TRUE):
  1. The catalog garments page renders using DataTableWrapper with sorting, filtering, and column controls consistent with other catalog pages
  2. The catalog services page renders using DataTableWrapper
  3. The catalog price lists page renders using DataTableWrapper
  4. The admin users page renders using DataTableWrapper
  5. All four pages pass the same visual and interaction baseline as the already-migrated pages (orders, operations, customers)
**Plans**: TBD
**UI hint**: yes

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
| 8. Production Bug Fixes | v1.1 | 1/2 | In Progress|  |
| 9. DataTableWrapper Pattern Completion | v1.1 | 0/? | Not started | - |
