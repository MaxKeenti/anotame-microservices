# Anotame

## What This Is

Anotame is a clothing/laundry business management SaaS — a multi-service platform that lets garment care businesses take orders, manage customers, track work through the shop, handle scheduling, and view operational KPIs. Built on 4 independent Quarkus microservices with a SvelteKit 5 frontend, serving one live business client and designed to scale to multiple tenants.

## Core Value

A laundry business staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.

## Requirements

### Validated

- ✓ JWT authentication with HttpOnly cookie (no token in localStorage) — existing
- ✓ Role-based access control (ADMIN / OPERATOR roles) — existing
- ✓ Customer management (create, search, resolve inline during order) — existing
- ✓ Order creation via multi-step wizard (garment → service → pricing → confirm) — existing
- ✓ Catalog management (garment types, services, price lists with overrides) — existing
- ✓ Dashboard metrics (active orders, revenue summaries, weekly workload) — existing
- ✓ Establishment and branch management — existing
- ✓ Schedule management (work days, shifts, holidays) — existing
- ✓ Touch-first responsive UI with adaptive components (desktop shadcn / mobile native) — existing
- ✓ Containerized deployment via Docker Compose, targeting Railway — existing

### Active

- [ ] UI color standardization — close open `feat--ui-color-standardization` branch
- [ ] Security hardening — no hardcoded credentials, auth guards on all controllers, JWT key via env, cookie secure flag
- [ ] Data integrity fixes — real branch resolution from JWT claims, DB-sequence ticket numbers, real createdBy UUID
- [ ] Consistent exception handling — GlobalExceptionHandler + typed domain exceptions across all 4 services
- [ ] Operational reliability — health checks on all backend services in docker-compose, gated SQL logging
- [ ] Housekeeping — .env.example cleanup (remove NEXT_PUBLIC_*), anotame-web-legacy artifacts removed
- [ ] Font and color theming per business identity — each tenant can customize the app's look and feel (needs dedicated planning phase)
- [ ] KPI intelligence improvements — smarter metrics and planning tools to help businesses track budgets, predict order load, and act on data (needs dedicated planning phase)

### Out of Scope

- Automated test suite — deferred to a future milestone (testing baseline not the priority for Milestone 1)
- Multi-tenancy at the DB level — currently sharing one PostgreSQL instance; true DB-per-tenant separation is a future architecture concern
- API gateway (Nginx/Traefik) — SvelteKit BFF proxy is acceptable for current scale; gateway is future work
- IBM requirements documentation best practices — identified as technical debt, not a Milestone 1 priority
- Inter-service event bus — catalog name denormalization in sales-service is an acceptable trade-off for now

## Context

- **Codebase**: Monorepo with `anotame-api/backend/` (4 Quarkus 3.27.2 services) and `anotame-web/` (SvelteKit 5 + Svelte 5 Runes). All services are fully standalone — the parent `pom.xml` is an aggregator only (Spring Boot parent reference was removed in cleanup).
- **Live client**: One real business is using the platform. Schema changes must be additive or migration-safe. Railway deploy must stay functional at all times.
- **Audit**: Full codebase audit completed 2026-03-31. Findings live in `.planning/codebase/CONCERNS.md` and `docs/standardization_plan.md`. 22 items identified; security items are the highest priority.
- **Current WIP**: `feat--ui-color-standardization` branch is almost complete — must be closed before starting security work.
- **Known critical debt**:
  - 4 services have hardcoded DB credentials in `application.properties`
  - `OperationsController`, `ScheduleController`, `UserController` have no `@Authenticated` guard
  - `privateKey.pem` may be committed to repo — needs immediate verification
  - `SalesService` uses a hardcoded branch UUID and collision-prone ticket numbers
  - `GlobalExceptionHandler` exists only in sales-service; others return raw 500s

## Constraints

- **Deployment**: Railway deploy must remain functional throughout all changes — no config-breaking refactors without a tested migration path
- **Database**: One live client has production data — schema changes must be additive (add columns/tables) or use safe migrations; no destructive DDL
- **Tech stack**: Quarkus 3.27.2, Java 21, SvelteKit 5 — no major version bumps in Milestone 1
- **No new framework deps**: Avoid introducing new libraries unless a specific work item explicitly requires it (e.g., Flyway for migrations)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Security before all other debt | Live client + committed private key risk — unacceptable exposure | — Pending |
| Testing deferred to Milestone 2 | Codebase needs structural fixes before tests are worth writing; tests on broken patterns create wrong anchors | — Pending |
| Theming + KPI features planned as separate phases | Both need detailed design before execution — scope too fuzzy to build directly | — Pending |
| Parent POM stays as pure aggregator | Spring Boot inheritance removed; each service manages its own Quarkus BOM | ✓ Done |
| Java 21 across all services | sales-service bumped from 17 → 21 to match others; Dockerfiles already used 21 | ✓ Done |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 after initialization*
