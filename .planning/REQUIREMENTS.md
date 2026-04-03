# Requirements: Anotame — Milestone 1.1 (Production Stability)

**Defined:** 2026-04-03
**Core Value:** A El hilvan staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.

---

## Milestone 1.1 Requirements

### Bug Fixes

- [x] **BUG-01**: KPI dashboard loads data — fix frontend API call path from `/orders/metrics/dashboard` to `/orders/kpi/dashboard` so the dashboard metrics endpoint is reached correctly
- [x] **BUG-02**: Customers page renders without crashing — fix `effect_update_depth_exceeded` infinite reactive loop in the DataTableWrapper integration on the customers page
- [x] **BUG-03**: Deleting an order or work order with associated data shows a user-friendly error — both Orders and Operations pages catch the 409 FK constraint error and display a meaningful message instead of a raw error

### Frontend Pattern Completion

- [ ] **FE-01**: Catalog garments page uses `DataTableWrapper` — migrated from raw table markup to the standardized TanStack Table wrapper
- [ ] **FE-02**: Catalog services page uses `DataTableWrapper`
- [ ] **FE-03**: Catalog price lists page uses `DataTableWrapper`
- [ ] **FE-04**: Admin users page uses `DataTableWrapper`

---

## Future Milestone Requirements (Deferred)

### Deployment Refactor (v1.2)

- **DEPLOY-01**: Deployment strategy decision — research Railway Dockerfile deploys vs VPS Docker Compose vs monorepo pipeline; produce ADR before implementation
- **DEPLOY-02**: Migrate from custom PostGIS GitHub Package to Railway native PostgreSQL (PostGIS not needed)
- **DEPLOY-03**: Implement chosen deployment strategy across all 4 services and frontend; eliminate GitHub Packages dependency
- **DEPLOY-04**: Staging environment with true isolation for Flyway validate before production deploys

### Architecture (deferred)

- **ARCH-01**: Server-side auth validation in SvelteKit `hooks.server.ts` before SSR render
- **ARCH-02**: `+error.svelte` pages at `(app)` layout level with retry/graceful degradation

### Testing Baseline (deferred)

- **TEST-01**: `@QuarkusTest` coverage for `SalesService` — order creation and dashboard metrics
- **TEST-02**: `@QuarkusTest` coverage for `AuthService` — login, register, invalid credentials
- **TEST-03**: Vitest + `@testing-library/svelte` setup for frontend
- **TEST-04**: Frontend test coverage for auth guard, API service, and order wizard steps

---

## Out of Scope (Milestone 1.1)

| Feature | Reason |
|---------|--------|
| Deployment refactor | Deferred to v1.2 — app stability first |
| Automated test suite | Deferred — structural fixes take priority |
| Multi-tenancy at DB level | Future architecture concern |
| API gateway (Nginx/Traefik) | Future scale concern |
| Font and color theming per tenant | Needs dedicated design phase |
| KPI intelligence improvements | Needs dedicated design phase |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 8 | Complete |
| BUG-02 | Phase 8 | Complete |
| BUG-03 | Phase 8 | Complete |
| FE-01 | Phase 9 | Pending |
| FE-02 | Phase 9 | Pending |
| FE-03 | Phase 9 | Pending |
| FE-04 | Phase 9 | Pending |

**Coverage:**
- Milestone 1.1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 — traceability confirmed after roadmap creation*
