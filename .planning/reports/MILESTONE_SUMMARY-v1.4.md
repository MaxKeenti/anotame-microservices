# Milestone v1.4 — Deployment Refactor: Project Summary

**Generated:** 2026-04-19
**Purpose:** Team onboarding and project review
**Milestone:** v1.4 Deployment Refactor — Phases 18–21

---

## 1. Project Overview

**Anotame** is the management SaaS platform for *El hilvan*, a garment care / clothing repair shop. It lets staff take orders, manage customers, track work through the shop, handle scheduling, and view operational KPIs.

**Core value:** A staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.

**Stack:** 4 independent Quarkus 3.27.2 microservices (identity, catalog, sales, operations) + SvelteKit 5 frontend, deployed on Railway, one live business client.

**v1.4 milestone goal:** Migrate from a shared monolithic PostgreSQL instance to 4 isolated per-service databases, eliminate external build dependencies (GitHub Packages), and rebuild Railway deployment with per-service Dockerfiles. All 4 phases complete.

---

## 2. Architecture & Technical Decisions

### Database Architecture

- **Decision:** 4 separate Railway PostgreSQL instances (one per service), not 4 schemas inside one instance
  - **Why:** Credential blast-radius containment — a compromised service credential cannot reach other services' data; lateral movement prevention
  - **Phase:** Roadmap design / Phase 18

- **Decision:** Clean-slate DB cutover — no live data migration
  - **Why:** Single client, planned downtime acceptable; simplifies migration enormously vs. an online schema change
  - **Phase:** Roadmap design

- **Decision:** Cross-service foreign keys dropped from sales and operations schemas
  - **Why:** DB-per-service architecture makes cross-DB foreign keys impossible at the PostgreSQL level; referential integrity enforced at the application layer instead
  - **Phase:** 18

- **Decision:** Incremental migrations V2–V4 folded into sales V1, V2 folded into operations V1
  - **Why:** Fresh Railway instances have no migration history; folding to a single V1 avoids Flyway checksum issues on the new DBs
  - **Phase:** 18

- **Decision:** `baseline-on-migrate` and custom `flyway.table` overrides removed from all 4 services
  - **Why:** These were workarounds for a shared-DB setup; with isolated DBs each service owns its own `flyway_schema_history` table at the default name
  - **Phase:** 18

### Deployment

- **Decision:** Per-service Dockerfiles with `dependency:resolve dependency:resolve-plugins` replacing `go-offline`
  - **Why:** Railway build runners are resource-constrained; `go-offline` was triggering OOM kills during the Maven build stage; `dependency:resolve` resolves exactly what each module needs
  - **Phase:** 20

- **Decision:** MAVEN_OPTS `-Xmx512m` added to all 4 build stages
  - **Why:** Caps Maven's own JVM heap during Docker build — prevents Railway builder OOM before the app even compiles
  - **Phase:** 20

- **Decision:** Runtime ENTRYPOINT uses `-XX:MaxRAMPercentage=70.0` / `-XX:InitialRAMPercentage=50.0` / `-XX:MaxMetaspaceSize=192m` (container-aware)
  - **Why:** Hardcoded `-Xmx100m` caused Linux cgroup OOM-killer (SIGKILL) on catalog/sales/operations ~2min post-boot once Hibernate metamodel, Agroal pool, and Netty direct buffers all initialized. Identity survived (2 entities); catalog/sales/ops (4–6 entities each) did not. 70% of 500MB cgroup = ~350MB heap
  - **Phase:** 20 + post-v1.4 debug session

- **Decision:** Railway private network template variables for JDBC URLs (e.g., `jdbc:postgresql://${{catalog-db.PGHOST}}:${{catalog-db.PGPORT}}/${{catalog-db.PGDATABASE}}`)
  - **Why:** Avoids hardcoding Railway-assigned hostnames; template variables resolve at deploy time from the linked PostgreSQL service
  - **Phase:** 20

- **Decision:** Legacy GHCR pipeline (`build_and_push.sh` + `anotame-db/`) deleted, no deprecation README
  - **Why:** Railway native Dockerfile builds fully replace it; git history preserves the files if recovery is needed
  - **Phase:** 20

### Configuration

- **Decision:** Base `quarkus.datasource.jdbc.url=` line removed entirely (not overridden) from all `application.properties`
  - **Why:** Quarkus config source ordinal means a base value would shadow the env var; removing the base line forces a hard-fail on prod if `QUARKUS_DATASOURCE_JDBC_URL` is absent — visible failure beats silent misconfiguration
  - **Phase:** 19

- **Decision:** `%dev` profile fallbacks target per-service localhost ports (5431–5434)
  - **Why:** Each service gets its own PostgreSQL container in local dev; shared port 5432 would mean only one service can run at a time locally
  - **Phase:** 19 + 21

### Local Development

- **Decision:** `docker-compose.yml` rewritten to 4 independent PostgreSQL containers on ports 5431–5434; `init.sql` eliminated
  - **Why:** Flyway `migrate-at-start=true` in each service makes `init.sql` redundant; each service creates its own schema on first `quarkus:dev` start
  - **Phase:** 21

---

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 18 | DB Ownership + Fresh V1 Baselines | ✅ Complete (2026-04-16) | Rewrote all 4 Flyway V1 baselines as clean, isolated, cross-FK-free schemas — 32/32 truths verified |
| 19 | Application Configuration | ✅ Complete (2026-04-16) | Externalized all datasource URLs, ports, and credentials to env vars with `%dev` fallbacks — 9/11 verified (2 require live runtime test) |
| 20 | Dockerfile Fixes + Railway Deployment | ✅ Complete (2026-04-18) | Fixed all 4 Dockerfiles, provisioned 4 Railway PostgreSQL instances, wired env vars, deleted GHCR pipeline — 8/9 verified (1 needs Railway log confirm) |
| 21 | Local Dev Docker Compose | ✅ Complete (2026-04-18) | Replaced shared DB with 4 independent PostgreSQL containers; eliminated init.sql; updated README — 10/10 truths verified |

---

## 4. Requirements Coverage

| Requirement | Description | Status |
|-------------|-------------|--------|
| DB-01 | identity-service clean V1 baseline (cca_role, tca_user only) | ✅ Satisfied |
| DB-02 | catalog-service clean V1 baseline (4 catalog tables, intra-service FKs preserved) | ✅ Satisfied |
| DB-03 | sales-service clean V1 — V2–V4 folded, 3 cross-service FKs dropped, branch_name added | ✅ Satisfied |
| DB-04 | operations-service clean V1 — V2 folded, 2 cross-service FKs to identity dropped | ✅ Satisfied |
| DB-05 | tco_order dual status columns consolidated (status VARCHAR(50) kept, current_status removed) | ✅ Satisfied |
| DB-06 | All 4 services have baseline-on-migrate removed | ✅ Satisfied |
| DB-07 | All 4 services use default flyway_schema_history table name | ✅ Satisfied |
| DB-08 | Old V2–V4 migration files deleted from sales; V2 deleted from operations | ✅ Satisfied |
| CFG-01 | Each service reads DB URL from env var; `%dev` fallback to per-service localhost port | ✅ Satisfied (static verified; live runtime = human) |
| CFG-02 | Each service configures `quarkus.http.port=${PORT:808x}` | ✅ Satisfied |
| CFG-03 | Credentials injected via env vars; no plain-text values | ✅ Satisfied |
| DOCKER-01 | All 4 Dockerfiles replace go-offline with dependency:resolve | ✅ Satisfied |
| DOCKER-02 | All 4 Dockerfiles add MAVEN_OPTS=-Xmx512m to build stage | ✅ Satisfied |
| DOCKER-03 | All 4 Dockerfiles add logging manager flag to ENTRYPOINT | ✅ Satisfied |
| DOCKER-04 | Dockerfile ENTRYPOINT paths made consistent (relative quarkus-run.jar) | ✅ Satisfied |
| DEPLOY-01 | Each service has railway.toml with dockerfile builder, healthcheckPath, healthcheckTimeout=300 | ✅ Satisfied |
| DEPLOY-02 | Railway project has 4 dedicated PostgreSQL instances each linked to one app service | ✅ Satisfied (attested via 20-03-SUMMARY) |
| DEPLOY-03 | Each service has QUARKUS_DATASOURCE_JDBC_URL using private network template variables | ✅ Satisfied (attested via 20-03-SUMMARY) |
| DEPLOY-04 | build_and_push.sh deleted | ✅ Satisfied |
| DEPLOY-05 | anotame-db/ directory removed | ✅ Satisfied |
| DEV-01 | docker-compose.yml has 4 independent PostgreSQL containers on ports 5431–5434 | ✅ Satisfied |
| DEV-02 | Each service's %dev profile points to its own local container | ✅ Satisfied (static verified; live = human) |
| DEV-03 | Local dev bring-up documented; no manual SQL needed | ✅ Satisfied |

**All 23 requirements satisfied.** Human runtime verification pending for 4 items (live DB connectivity, Railway build log confirmation) — all are structural checks, not suspected failures.

---

## 5. Key Decisions Log

| ID | Decision | Phase | Rationale |
|----|----------|-------|-----------|
| D-DB-1 | 4 separate PostgreSQL instances over 4 schemas | Roadmap | Credential blast-radius containment |
| D-DB-2 | Clean-slate cutover, no live migration | Roadmap | Single client, planned downtime acceptable |
| D-DB-3 | Cross-service FKs dropped at the DB layer | 18 | Impossible to enforce across isolated DB instances |
| D-DB-4 | V2–V4 folded into single V1 per service | 18 | Fresh instances have no checksum history |
| D-DB-5 | Remove baseline-on-migrate entirely | 18 | Workaround no longer needed with isolated DBs |
| D-CFG-1 | Remove base datasource.jdbc.url line (not override) | 19 | Forces visible prod failure if env var missing |
| D-CFG-2 | Per-service localhost ports 5431–5434 in %dev | 19+21 | Enables all 4 services to run simultaneously in local dev |
| D-DOCKER-1 | dependency:resolve over go-offline | 20 | go-offline OOM-kills Railway build runners |
| D-DOCKER-2 | MaxRAMPercentage=70.0 over hardcoded -Xmx | 20+post | Container-aware; 70% of 500MB = ~350MB; hardcoded 100MB caused SIGKILL |
| D-DOCKER-3 | Railway private network template variables | 20 | Avoids hardcoding Railway-assigned hostnames |
| D-DOCKER-4 | Delete GHCR pipeline, no deprecation stub | 20 | Railway native builds fully replace it; git history sufficient |
| D-DEV-1 | Eliminate init.sql; rely on Flyway | 21 | migrate-at-start=true makes init.sql redundant |

---

## 6. Tech Debt & Deferred Items

### Known Deferred from v1.4

| Item | Notes |
|------|-------|
| `branch_id` fallback in `OrdersResource.java` | Safe to remove after all active sessions re-login post-v1.0. Intentionally deferred. |
| `flyway validate` against true staging isolation | Re-run before first Railway deploy introducing a new migration beyond V1. |
| `statusUtils.ts` cleanup | Fully migrate all references to CSS-based status badges (frontend tech debt). |
| EMPLOYEE per-step readonly props in order wizard | Defense-in-depth deferred from Phase 15; backend enforces role restrictions. |
| operations-service missing `quarkus-smallrye-jwt` | Fixed post-milestone in debug session: `quarkus-smallrye-jwt` added to `operations-service/pom.xml`. Operations was returning 401 on all `@Authenticated` endpoints. |

### Active Requirements (not in v1.4 scope)

- KPI intelligence improvements (budget tracking, order load prediction)
- Automated test suite — @QuarkusTest for SalesService/AuthService; Vitest for frontend
- Server-side auth validation in SvelteKit `hooks.server.ts`
- `+error.svelte` pages at layout level
- Partial payment ledger tracking
- Multi-branch Dashboard Features
- Print server integration (backlog — customer ticket + internal work order tag)

### Phase Verification Gaps Remaining

| Phase | Gap | Resolution |
|-------|-----|-----------|
| 19 | Live env var injection test (prod + dev) | Confirmed working in production via v1.4 deploy; Phase 21 containers satisfy %dev path |
| 20 | Railway build log confirmation | Railway marks deploy "Success" only after health check passes — attested in 20-03-SUMMARY |
| 21 | `docker compose up` + `quarkus:dev` Flyway live test | Human can verify with local Docker + Maven |

### Post-v1.4 Incident

The deployment hit Linux cgroup OOM-kills after launch: hardcoded `-Xmx100m` was too small for catalog/sales/operations services' Hibernate metamodel + Agroal pool + Netty buffers. Resolved via debug session — switched to `-XX:MaxRAMPercentage=70.0` / `-XX:MaxMetaspaceSize=192m` / `-XX:+ExitOnOutOfMemoryError`. No further OOM events expected.

---

## 7. Getting Started

### Running Locally

**Prerequisites:** Docker Desktop, Java 21, Maven

```bash
# 1. Start all 4 PostgreSQL containers
docker compose up -d

# 2. Start each Quarkus service (separate terminals)
cd anotame-api/backend/identity-service   && ./mvnw quarkus:dev
cd anotame-api/backend/catalog-service    && ./mvnw quarkus:dev
cd anotame-api/backend/sales-service      && ./mvnw quarkus:dev
cd anotame-api/backend/operations-service && ./mvnw quarkus:dev

# 3. Start the SvelteKit frontend
cd anotame-web && npm install && npm run dev
```

Flyway creates each service's schema automatically on first start — no manual SQL needed.

**Port map:**

| Service | HTTP Port | DB Port |
|---------|-----------|---------|
| identity-service | 8081 | 5431 |
| catalog-service | 8082 | 5432 |
| sales-service | 8083 | 5433 |
| operations-service | 8084 | 5434 |
| SvelteKit frontend | 5173 | — |

> ⚠️ If you have a local PostgreSQL running on 5432, stop it first to avoid port conflict with catalog-db.

### Key Directories

```
anotame-api/backend/
  identity-service/    — JWT auth, user/role management
  catalog-service/     — garment types, services, price lists
  sales-service/       — orders, customers, audit log
  operations-service/  — establishment, branches, scheduling, work orders
anotame-web/
  src/routes/(app)/    — authenticated app pages
  src/lib/components/  — shared UI components
  src/lib/api/         — typed API clients per service
```

### Smoke-test Production

```bash
./test_integration.sh   # curl-based health + basic API checks for all 4 services
```

Or manually:
```bash
curl https://anotame-identity-service-production.up.railway.app/q/health/live
curl https://anotame-catalog-service-production.up.railway.app/q/health/live
curl https://anotame-sales-service-production.up.railway.app/q/health/live
curl https://anotame-operations-service-production.up.railway.app/q/health/live
```

### Where to Look First

- **Order flow:** `sales-service/src/main/java/com/anotame/sales/` — `OrdersResource.java` (REST), `SalesService.java` (domain), `OrderEntity.java` (JPA)
- **Auth/JWT:** `identity-service/src/main/java/com/anotame/identity/` — JWT is issued as an HttpOnly cookie
- **Frontend entry:** `anotame-web/src/routes/(app)/` — protected app routes
- **DB schemas:** `anotame-api/backend/*/src/main/resources/db/migration/V1__baseline.sql` — one per service

---

## Stats

- **Timeline:** 2026-04-15 → 2026-04-19 (5 days)
- **Phases:** 4 / 4 complete
- **Commits (v1.4 scope, source files):** ~66
- **Source files changed:** 26 (+528 / -3,441) — deletions dominated by removal of GHCR pipeline artifacts and folded SQL migrations
- **Contributors:** Max Gonzalez
- **Requirements met:** 23 / 23
- **Verification scores:** Phase 18: 32/32 ✅ | Phase 19: 9/11 (2 runtime) | Phase 20: 8/9 (1 runtime) | Phase 21: 10/10 ✅

---

*Next milestone: v1.5 — planning pending*
*Summary generated: 2026-04-19*
