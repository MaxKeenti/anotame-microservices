# Requirements: Anotame v1.4

**Defined:** 2026-04-15
**Milestone:** v1.4 — Deployment Refactor
**Core Value:** A El hilvan staff member can take a complete order — from walk-in to ticket — without confusion, on any device, in under two minutes.

---

## v1.4 Requirements

### Database Schema (DB)

- [ ] **DB-01**: identity-service has a clean V1 Flyway baseline containing only `cca_role` and `tca_user` tables (no cross-service tables, no pg_dump artifacts, no OWNER clauses)
- [ ] **DB-02**: catalog-service has a clean V1 Flyway baseline containing only its 4 catalog tables (`cci_garment_type`, `cci_service`, `tcc_price_list`, `tcc_price_list_item`) with all intra-service FKs preserved
- [ ] **DB-03**: sales-service has a clean V1 Flyway baseline folding in V2–V4 changes, dropping 3 cross-service FKs (`id_garment_type→catalog`, `id_service→catalog`, `id_branch→operations`), and adding `branch_name VARCHAR(150)` snapshot column to `tco_order`
- [ ] **DB-04**: operations-service has a clean V1 Flyway baseline folding in V2 changes and dropping 2 cross-service FKs (`top_shift.id_user→identity`, `tce_employee_assignment.id_user→identity`)
- [ ] **DB-05**: `tco_order` dual status columns consolidated — `status` column kept as `VARCHAR(50)`, `current_status` removed (Java entity updated to match)
- [ ] **DB-06**: All 4 services have `baseline-on-migrate` removed from `application.properties`
- [ ] **DB-07**: All 4 services use the Flyway default history table name `flyway_schema_history` (custom per-service table names removed)
- [ ] **DB-08**: Old V2–V4 migration files deleted from sales-service and V2 deleted from operations-service (consolidated into fresh V1)

### Application Configuration (CFG)

- [ ] **CFG-01**: Each service reads its database URL from an environment variable (`QUARKUS_DATASOURCE_JDBC_URL`) composed from Railway PGHOST/PGPORT/PGDATABASE parts, with a `%dev` profile fallback to `localhost:543{1-4}/{service}`
- [ ] **CFG-02**: Each service configures `quarkus.http.port=${PORT:808x}` so Railway's injected `PORT` env var is respected (prevents health check routing failures)
- [ ] **CFG-03**: Each service's `application.properties` has datasource credentials injected via `QUARKUS_DATASOURCE_USERNAME` and `QUARKUS_DATASOURCE_PASSWORD` env vars (no hardcoded credentials)

### Dockerfile Fixes (DOCKER)

- [ ] **DOCKER-01**: All 4 Dockerfiles replace `maven-dependency-plugin:go-offline` with `dependency:resolve` + `dependency:resolve-plugins` (fixes Quarkus augmentation build failure)
- [ ] **DOCKER-02**: All 4 Dockerfiles add `MAVEN_OPTS=-Xmx512m` to the build stage (prevents OOM kills on Railway build runners)
- [ ] **DOCKER-03**: All 4 Dockerfiles add `-Djava.util.logging.manager=org.jboss.logmanager.LogManager` to the runtime `ENTRYPOINT` (prevents duplicate/garbled startup logs)
- [ ] **DOCKER-04**: catalog-service Dockerfile `ENTRYPOINT` path made consistent with other 3 services

### Railway Deployment (DEPLOY)

- [ ] **DEPLOY-01**: Each service has a `railway.toml` checked into its directory specifying root directory (`anotame-api/backend`), Dockerfile path, health check path (`/q/health/ready`), and health check timeout (300s)
- [ ] **DEPLOY-02**: Railway project has 4 PostgreSQL service instances (`identity-db`, `catalog-db`, `sales-db`, `operations-db`) each linked to their corresponding app service
- [ ] **DEPLOY-03**: Each Railway app service has `QUARKUS_DATASOURCE_JDBC_URL` composed from Railway private network variables (`${{service-db.PGHOST}}` etc.) — not from `DATABASE_PRIVATE_URL`
- [ ] **DEPLOY-04**: `build_and_push.sh` deleted — GHCR image push pipeline replaced by Railway native Dockerfile builds
- [ ] **DEPLOY-05**: `anotame-db/` directory and shared `init.sql` removed or archived — per-service databases make the shared DB container obsolete

### Local Development (DEV)

- [ ] **DEV-01**: `docker-compose.yml` updated to provision 4 independent PostgreSQL containers (`identity-db`, `catalog-db`, `sales-db`, `operations-db`) each on distinct ports (5431–5434)
- [ ] **DEV-02**: Each service's `%dev` datasource profile points to its own local container — no service shares a database in local dev
- [ ] **DEV-03**: Local dev bring-up documented: `docker compose up` starts all 4 DBs; Flyway creates schema on first app startup; no manual `init.sql` execution needed

---

## Deferred / Out of Scope

| Item | Reason |
|------|--------|
| PostGIS removal | Already a dead reference — no POM dependency, no geometry columns, using `postgres:16-alpine` already. No-op. |
| GitHub Packages Maven dependencies | No `<repositories>` blocks or GitHub Packages Maven artifacts exist in any POM. Already Maven Central only. No-op. |
| Cross-service HTTP REST clients | `sales-service` already stores denormalized snapshots at write time. No cross-service reads needed for existing features. Defer to dedicated phase if needed. |
| Server-side Flyway baseline validation against staging | Pre-existing deferred debt — still deferred. No staging container available. |
| `branch_id` fallback removal in OrdersResource.java | Pre-existing deferred debt — still deferred. |
| Native Quarkus compilation for Railway | Build time too long for Railway runners. JVM mode only. |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 18 | Pending |
| DB-02 | Phase 18 | Pending |
| DB-03 | Phase 18 | Pending |
| DB-04 | Phase 18 | Pending |
| DB-05 | Phase 18 | Pending |
| DB-06 | Phase 18 | Pending |
| DB-07 | Phase 18 | Pending |
| DB-08 | Phase 18 | Pending |
| CFG-01 | Phase 19 | Pending |
| CFG-02 | Phase 19 | Pending |
| CFG-03 | Phase 19 | Pending |
| DOCKER-01 | Phase 20 | Pending |
| DOCKER-02 | Phase 20 | Pending |
| DOCKER-03 | Phase 20 | Pending |
| DOCKER-04 | Phase 20 | Pending |
| DEPLOY-01 | Phase 20 | Pending |
| DEPLOY-02 | Phase 20 | Pending |
| DEPLOY-03 | Phase 20 | Pending |
| DEPLOY-04 | Phase 20 | Pending |
| DEPLOY-05 | Phase 20 | Pending |
| DEV-01 | Phase 21 | Pending |
| DEV-02 | Phase 21 | Pending |
| DEV-03 | Phase 21 | Pending |
