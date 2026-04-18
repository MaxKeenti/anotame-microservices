# Anotame

## What This Is

Anotame is the management SaaS platform for *El hilvan*, a garment care / clothing repair shop. It lets staff take orders, manage customers, track work through the shop, handle scheduling, and view operational KPIs. Built on 4 independent Quarkus microservices (identity, catalog, sales, operations) with a SvelteKit 5 frontend, serving one live business client. Designed to scale to multiple tenants.

## Core Value

A *El hilvan* staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.

## Current Milestone: v1.4 — Deployment Refactor

**Goal:** Move from a shared monolithic PostgreSQL instance to 4 isolated per-service PostgreSQL databases, eliminate external build dependencies, and rebuild Railway deployment with per-service Dockerfiles.

**Target features:**
- DB-per-service architecture (SEED-009) — 4 independent Railway PostgreSQL instances; separate credentials per service; fresh Flyway baselines per service
- init.sql refresh — Flyway migrations become single source of truth; local Docker Compose updated to 4 PostgreSQL containers
- PostGIS removal — drop PostGIS dependency from catalog-service POM (no geometry columns in use)
- Eliminate GitHub Packages dependency — all Quarkus BOMs/artifacts move to Maven Central only; no PAT token at build time
- Per-service Railway Dockerfile deploys — individual Dockerfiles per service replacing docker-compose deploy approach

**Key decisions:**
- Clean-slate deployment — planned downtime for cutover is acceptable
- 4 separate Railway PostgreSQL instances chosen over 4 schemas for credential blast-radius containment and lateral-movement prevention

---

## Current State

**Version:** v1.4-in-progress — Deployment Refactor milestone active
**Codebase:** Monorepo — `anotame-api/backend/` (4 Quarkus 3.27.2 services) + `anotame-web/` (SvelteKit 5 + Svelte 5 Runes)
**Backend:** Full order lifecycle: edit with role restrictions, field-level audit log, pickup code deliver flow, price list stored on order. Phase 18 complete — all 4 services now own clean, self-contained Flyway V1 baselines; cross-service FKs dropped, incremental migrations folded in, shared-DB vestiges removed.
**Frontend:** Order edit wizard, bulk actions with FloatingActionBar, PriceListStep in order wizard with auto-fill pricing, per-device configurable DataTable row count (5/10/20/50)
**Deployment:** Railway (main branch auto-deploy); v1.3 shipped Advanced Operations. v1.4 Deployment Refactor in progress — Phase 20 (Dockerfile Fixes + Railway Deploy) complete. All 4 Quarkus services live on Railway with dedicated PostgreSQL instances. Dockerfiles use dependency:resolve (no go-offline), -Xmx512m heap ceiling, and Quarkus logging manager ENTRYPOINT. Legacy GHCR pipeline (build_and_push.sh, anotame-db/) removed.

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
- ✓ Security hardening — v1.0
- ✓ Data integrity fixes — v1.0
- ✓ Consistent exception handling — v1.0
- ✓ Frontend pattern compliance — v1.0
- ✓ Database migration framework — v1.0
- ✓ Operational reliability — v1.0
- ✓ Housekeeping — v1.0
- ✓ KPI dashboard fix — v1.1
- ✓ DataTableWrapper stability — v1.1
- ✓ Spanish error toasts — v1.1
- ✓ Catalog migration — v1.1
- ✓ shadcn preset init — v1.2
- ✓ DataTableWrapper filter dedup — v1.2
- ✓ UI standardization audit — v1.2
- ✓ Color audit & WCAG compliance — v1.2
- ✓ Tenant theming — v1.2
- ✓ Order lifecycle improvements (edit, bulk actions, audit log, pickup code deliver flow) — v1.3
- ✓ Price list selection in order wizard with auto-fill pricing — v1.3
- ✓ DataTable row count configurability (per-device localStorage preference) — v1.3

### Active
- [ ] Deployment refactor — research Railway Dockerfile deploys, migrate from PostGIS to native PostgreSQL — v1.4
- [ ] Deployment implementation — eliminate GitHub Packages dependency across all services — v1.4
- [ ] KPI intelligence improvements — smarter metrics and planning tools (budget tracking, order load prediction) (needs dedicated design phase)
- [ ] Automated test suite — @QuarkusTest for SalesService and AuthService; Vitest + @testing-library/svelte for frontend (deferred from v1.0)
- [ ] Server-side auth validation in SvelteKit hooks.server.ts before SSR render (deferred from v1.0)
- [ ] +error.svelte pages at (app) layout level with retry/graceful degradation (deferred from v1.0)
- [ ] Partial payment ledger tracking (multiple incremental payments per order) — SEED-001 remainder
- [ ] Multi-branch Dashboard Features — enhanced visibility across locations

### Out of Scope

- Multi-tenancy at the DB level — currently sharing one PostgreSQL instance; true DB-per-tenant separation is a future architecture concern
- API gateway (Nginx/Traefik) — SvelteKit BFF proxy is acceptable for current scale; gateway is future work
- IBM requirements documentation best practices — identified as technical debt, not a current priority
- Inter-service event bus — catalog name denormalization in sales-service is an acceptable trade-off for now
- i18n / Paraglide rollout — all strings hardcoded Spanish; large effort deferred to dedicated phase

## Context

- **Live client**: One real business is using the platform. Schema changes must be additive or migration-safe. Railway deploys from main branch automatically.
- **v1.3 shipped**: Order lifecycle is now complete. Staff can edit orders, deliver with pickup codes, perform bulk operations, select price lists at creation, and control DataTable row density on constrained displays.
- **Known deferred debt**:
  - `branch_id` fallback in `OrdersResource.java` (sales-service) — remove after all active sessions re-login post-v1.0
  - Staging Flyway validate isolation — re-run `flyway validate` against a true isolated staging container before first Railway deploy introducing a new migration beyond V2
  - `statusUtils.ts` cleanup — fully migrate all references to CSS-based status badges
  - EMPLOYEE per-step readonly props in wizard (CustomerStep, ItemsStep) — defense-in-depth deferred from Phase 15; backend enforces role restrictions

## Constraints

- **Deployment**: Railway deploy must remain functional throughout all changes — no config-breaking refactors without a tested migration path
- **Database**: One live client has production data — schema changes must be additive (add columns/tables) or use safe Flyway migrations; no destructive DDL
- **Tech stack**: Quarkus 3.27.2, Java 21, SvelteKit 5 — no major version bumps unless a specific milestone explicitly targets an upgrade
- **No new framework deps**: Avoid introducing new libraries unless a specific work item explicitly requires it

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Security before all other debt | Live client + committed private key risk — unacceptable exposure | ✓ Cleared — v1.0 |
| Testing deferred to Milestone 2 | Codebase needs structural fixes before tests are worth writing | — Deferred |
| Theming + KPI features planned as separate phases | Both need detailed design before execution | — Active |
| Parent POM stays as pure aggregator | Spring Boot inheritance removed; each service manages its own Quarkus BOM | ✓ Done |
| Java 21 across all services | sales-service bumped from 17 → 21 to match others | ✓ Done |
| JWT keys delivered via env vars | Enables Railway builds without committed PEM files | ✓ Done — v1.0 |
| Per-service Flyway history tables | Prevents cross-service collision in shared DB | ✓ Done — v1.0 |
| wget --spider for Docker healthchecks | Correct tool for eclipse-temurin:21-jre-alpine | ✓ Done — v1.0 |
| CSS Variable Injection for Theming | Avoids DOM manipulation libraries; works with Tailwind 4 | ✓ Done — v1.2 |
| Server-side Hydration for Theme | Prevents FOUC; loads theme before page renders | ✓ Done — v1.2 |
| Native HTML5 Color Picker | Native browser support; accessible; fallback to hex text | ✓ Done — v1.2 |
| OKLCH for Color System | Precise control over lightness and chroma; better contrast management | ✓ Done — v1.2 |
| CSS pointer-events-none for locked wizard | Avoid per-step readonly props; backend enforces restrictions | ✓ Done — v1.3 |
| priceListName denormalized on order | No runtime catalog fetch needed for display | ✓ Done — v1.3 |
| PersistedState without userId scoping | Per-device preference for kiosk-style workstations at El Hilvan | ✓ Done — v1.3 |
| DataTableWrapper init-time only row count | No live $effect sync; table picks preference on mount; avoids re-render churn | ✓ Done — v1.3 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-04-18 — Phase 20 complete (Dockerfile Fixes + Railway Deployment)*
