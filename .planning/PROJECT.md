# Anotame

## What This Is

Anotame is the management SaaS platform for *El hilvan*, a garment care / clothing repair shop. It lets staff take orders, manage customers, track work through the shop, handle scheduling, and view operational KPIs. Built on 4 independent Quarkus microservices (identity, catalog, sales, operations) with a SvelteKit 5 frontend, serving one live business client. Designed to scale to multiple tenants.

## Core Value

A *El hilvan* staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.

## Current Milestone: v1.1 — Deployment Refactor

**Goal:** Restore production from v1.0 env var breakage, then replace the fragile GitHub Packages deployment with a clean, testable strategy chosen from research.

**Target features:**
- HOTFIX: Update Railway env vars for v1.0 compatibility (prod is currently down — 502 on login)
- Research: Evaluate Railway Dockerfile deploys, VPS Docker Compose, and monorepo pipeline — produce a decision record before committing to an approach
- Database: Migrate from custom PostGIS package to Railway's native PostgreSQL (PostGIS no longer needed by any service)
- Deployment: Implement chosen approach across all 4 backend services + SvelteKit frontend, eliminating GitHub Packages dependency

---

## Current State

**Version:** v1.0 — shipped 2026-04-03
**Codebase:** Monorepo — `anotame-api/backend/` (4 Quarkus 3.27.2 services) + `anotame-web/` (SvelteKit 5 + Svelte 5 Runes)
**Backend:** All services now production-hardened — no hardcoded credentials, JWT via env vars, all controllers auth-guarded, Flyway migrations, SmallRye Health endpoints live
**Frontend:** SvelteKit with `DataTableWrapper` (TanStack Table) and `sveltekit-superforms` standardized across all pages
**Deployment:** Railway (main branch auto-deploy); Docker Compose for local dev with service healthchecks
**Phase 08 Complete:** Production Bug Fixes — KPI dashboard API path corrected, DataTableWrapper pagination infinite loop fixed, FK constraint error handling with Spanish toasts added to orders and operations pages

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
- ✓ UI color standardization — per-user palette customization, CSS variable overrides — v1.0
- ✓ Security hardening — no hardcoded credentials, auth guards on all controllers, JWT key via env, cookie secure flag — v1.0
- ✓ Data integrity fixes — real branch resolution from JWT claims, DB-sequence ticket numbers, real createdBy UUID — v1.0
- ✓ Consistent exception handling — GlobalExceptionHandler + typed domain exceptions across all 4 services — v1.0
- ✓ Frontend pattern compliance — DataTableWrapper + sveltekit-superforms across all major pages — v1.0
- ✓ Database migration framework — Flyway across all 4 services, V1 baseline from live schema, per-service history tables — v1.0
- ✓ Operational reliability — SmallRye Health on all 4 services, Docker Compose healthchecks — v1.0
- ✓ Housekeeping — .env.example PUBLIC_* names, legacy artifacts deleted, x-user-name CORS header — v1.0

### Active

- [ ] Production hotfix — update Railway env vars to match v1.0 renames (SMALLRYE_JWT_SIGN_KEY, MP_JWT_VERIFY_PUBLICKEY, QUARKUS_DATASOURCE_*) — v1.1
- [ ] Deployment strategy decision — research Railway Dockerfile deploys vs VPS Docker Compose vs monorepo pipeline, produce ADR — v1.1
- [ ] Database migration — replace custom PostGIS GitHub Package with Railway native PostgreSQL (PostGIS not needed) — v1.1
- [ ] Deployment refactor — implement chosen strategy, eliminate GitHub Packages dependency across all 4 services + frontend — v1.1
- [ ] Font and color theming per business identity — each tenant can customize the app's look and feel (needs dedicated design phase)
- [ ] KPI intelligence improvements — smarter metrics and planning tools (budget tracking, order load prediction) (needs dedicated design phase)
- [ ] Automated test suite — @QuarkusTest for SalesService and AuthService; Vitest + @testing-library/svelte for frontend (deferred from v1.0)
- [ ] Server-side auth validation in SvelteKit hooks.server.ts before SSR render (deferred from v1.0)
- [ ] +error.svelte pages at (app) layout level with retry/graceful degradation (deferred from v1.0)

### Out of Scope

- Multi-tenancy at the DB level — currently sharing one PostgreSQL instance; true DB-per-tenant separation is a future architecture concern
- API gateway (Nginx/Traefik) — SvelteKit BFF proxy is acceptable for current scale; gateway is future work
- IBM requirements documentation best practices — identified as technical debt, not a current priority
- Inter-service event bus — catalog name denormalization in sales-service is an acceptable trade-off for now
- i18n / Paraglide rollout — all strings hardcoded Spanish; large effort deferred to dedicated phase

## Context

- **Live client**: One real business is using the platform. Schema changes must be additive or migration-safe. Railway deploys from main branch automatically — all changes must be validated before merging.
- **v1.0 shipped**: Full audit backlog cleared — security, data integrity, exception handling, frontend patterns, Flyway migrations, operational health all addressed.
- **Known deferred debt**:
  - `branch_id` fallback in `OrdersResource.java` (sales-service) — remove after all active sessions re-login post-v1.0
  - Staging Flyway validate isolation — re-run `flyway validate` against a true isolated staging container before first Railway deploy introducing a new migration beyond V2
  - Human verification items from Phases 4 and 5 still require Docker Compose runtime confirmation (invalid-credentials 401, duplicate-username 409, no SQL in prod logs, DataTableWrapper rendering, superforms behavior)

## Constraints

- **Deployment**: Railway deploy must remain functional throughout all changes — no config-breaking refactors without a tested migration path
- **Database**: One live client has production data — schema changes must be additive (add columns/tables) or use safe Flyway migrations; no destructive DDL
- **Tech stack**: Quarkus 3.27.2, Java 21, SvelteKit 5 — no major version bumps unless a specific milestone explicitly targets an upgrade
- **No new framework deps**: Avoid introducing new libraries unless a specific work item explicitly requires it

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Security before all other debt | Live client + committed private key risk — unacceptable exposure | ✓ Cleared — v1.0 |
| Testing deferred to Milestone 2 | Codebase needs structural fixes before tests are worth writing; tests on broken patterns create wrong anchors | — Deferred |
| Theming + KPI features planned as separate phases | Both need detailed design before execution — scope too fuzzy to build directly | — Active |
| Parent POM stays as pure aggregator | Spring Boot inheritance removed; each service manages its own Quarkus BOM | ✓ Done |
| Java 21 across all services | sales-service bumped from 17 → 21 to match others; Dockerfiles already used 21 | ✓ Done |
| JWT keys delivered via env vars | SMALLRYE_JWT_SIGN_KEY + MP_JWT_VERIFY_PUBLICKEY instead of .location file path — enables Railway builds without committed PEM files | ✓ Done — v1.0 |
| branch_id omitted from JWT when null | Downstream must handle absent claim with rollout fallback; remove fallback after re-login | — Pending cleanup |
| Single pg_dump shared across 4 Flyway V1 baselines | Simpler than per-service scoping; safe because baseline-version=1 means Flyway stamps V1 as already applied without executing it | ✓ Done — v1.0 |
| Per-service Flyway history tables | All 4 services share one PostgreSQL DB; unique table names prevent cross-service collision | ✓ Done — v1.0 |
| wget --spider for Docker healthchecks | curl absent from eclipse-temurin:21-jre-alpine; wget (busybox) is correct tool | ✓ Done — v1.0 |

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
*Last updated: 2026-04-03 — Phase 08 (Production Bug Fixes) complete — 3 bugs fixed, ready for Phase 09*
