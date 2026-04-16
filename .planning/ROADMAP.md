# Roadmap: Anotame

## Milestones

- ✅ **v1.0 Code Quality & Security** — Phases 1–7 (shipped 2026-04-03) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Production Stability** — Phases 8–9 (shipped 2026-04-03) — [archive](.planning/milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 UI Standardization** — Phases 10–14 (shipped 2026-04-06) — [archive](.planning/milestones/v1.2-ROADMAP.md)
- ✅ **v1.3 Advanced Operations** — Phases 15–17 (shipped 2026-04-14) — [archive](.planning/milestones/v1.3-ROADMAP.md)
- 🚧 **v1.4 Deployment Refactor** — Phases 18–21 (in progress)

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

### v1.4 Deployment Refactor

- [x] **Phase 18: DB Ownership + Fresh V1 Baselines** — Rewrite all 4 Flyway V1 SQL files as clean, self-contained baselines; fold incremental migrations in; drop cross-service FKs; remove baseline-on-migrate; consolidate dual status columns (completed 2026-04-16)
- [ ] **Phase 19: Application Configuration** — Externalize all datasource URLs, port wiring, and credentials to environment variables; establish %dev profile fallbacks
- [ ] **Phase 20: Dockerfile Fixes + Railway Deployment** — Fix all 4 Dockerfiles, provision per-service Railway PostgreSQL instances, wire env vars, delete legacy build pipeline
- [ ] **Phase 21: Local Dev Docker Compose** — Replace shared anotame-db with 4 independent PostgreSQL containers on distinct ports; align %dev profiles; eliminate init.sql

### Backlog: Print Server Integration
**Goal**: Enable staff to print both a customer ticket (comprobante) and an internal work order tag (hoja de trabajo) — from the order detail page and via bulk print from the orders list.
**Status**: Parked for v1.5+ — plans exist in `.planning/phases/backlog-print-server-integration/`

---

## Phase Details

### Phase 18: DB Ownership + Fresh V1 Baselines
**Goal**: Each of the 4 services owns a clean, self-contained Flyway V1 baseline — no cross-service foreign keys, no pg_dump artifacts, no accumulated incremental migration files, no shared-DB vestiges
**Depends on**: Nothing (first v1.4 phase)
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08
**Success Criteria** (what must be TRUE):
  1. Each service's `db/migration/` directory contains exactly one SQL file (V1__baseline.sql) that creates all tables for that service and no others
  2. Running `flyway migrate` against a fresh empty database for any service succeeds without errors — no "table already exists" or checksum failures
  3. `tco_order` has a single `status VARCHAR(50)` column; `current_status` is absent from both the SQL and the Java entity
  4. No service's `application.properties` contains `baseline-on-migrate` or a custom `flyway.table` override
**Plans**: TBD

### Phase 19: Application Configuration
**Goal**: All 4 services are fully configurable via environment variables for database connectivity and port binding — no hardcoded URLs, credentials, or port numbers remain in any `application.properties`
**Depends on**: Phase 18 (baselines must be stable before wiring up per-service datasource URLs)
**Requirements**: CFG-01, CFG-02, CFG-03
**Success Criteria** (what must be TRUE):
  1. Starting any service with `QUARKUS_DATASOURCE_JDBC_URL`, `QUARKUS_DATASOURCE_USERNAME`, and `QUARKUS_DATASOURCE_PASSWORD` env vars set connects to the target database without modifying any config file
  2. Starting any service without those env vars (local dev) falls back to its `%dev` profile pointing to `localhost:543{1-4}/{service}` — the app starts and passes health checks
  3. Each service's HTTP port resolves from Railway's injected `PORT` env var; if `PORT` is absent it falls back to the service-specific default (8081–8084)
**Plans**: 2 plans
Plans:
- [ ] 19-01-PLAN.md — Externalize identity-service and catalog-service datasource URL and HTTP port
- [ ] 19-02-PLAN.md — Externalize sales-service and operations-service datasource URL and HTTP port

### Phase 20: Dockerfile Fixes + Railway Deployment
**Goal**: All 4 services build and run successfully as Railway native Dockerfile deployments — each backed by its own Railway PostgreSQL instance, reachable via `/q/health/ready`, with the legacy GHCR build pipeline removed
**Depends on**: Phase 19 (env var wiring must be in place before Railway can inject datasource variables)
**Requirements**: DOCKER-01, DOCKER-02, DOCKER-03, DOCKER-04, DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05
**Success Criteria** (what must be TRUE):
  1. A Railway deploy of any service completes without OOM kill or Quarkus augmentation build failure
  2. Each deployed service's `/q/health/ready` endpoint returns HTTP 200 within 300 seconds of startup
  3. Each service connects to its own dedicated Railway PostgreSQL instance (`identity-db`, `catalog-db`, `sales-db`, `operations-db`) — no service shares a database
  4. `build_and_push.sh` and the `anotame-db/` shared container directory no longer exist in the repository
**Plans**: 3 plans
Plans:
- [ ] 20-01-PLAN.md — Fix all 4 Dockerfiles (go-offline, MAVEN_OPTS, ENTRYPOINT logging manager, path consistency)
- [ ] 20-02-PLAN.md — Create 4 railway.toml files; delete build_and_push.sh and anotame-db/
- [ ] 20-03-PLAN.md — Railway dashboard provisioning: 4 services, 4 PostgreSQL instances, env vars, deploys [MANUAL]

### Phase 21: Local Dev Docker Compose
**Goal**: A developer can run `docker compose up` from the repo root and have 4 independent PostgreSQL containers start, after which each Quarkus service connects to its own container and Flyway initializes the schema automatically — no manual SQL execution required
**Depends on**: Phase 19 (services must have %dev profiles pointing to the correct per-service ports)
**Requirements**: DEV-01, DEV-02, DEV-03
**Success Criteria** (what must be TRUE):
  1. `docker compose up` starts exactly 4 PostgreSQL containers on ports 5431–5434; no shared `anotame-db` container or `init.sql` volume mount exists
  2. Starting any service in dev mode against its dedicated container results in Flyway creating the schema on first boot — the developer does not run any SQL manually
  3. No two services point to the same local database in their `%dev` datasource configuration
**Plans**: 2 plans
Plans:
- [ ] 21-01-PLAN.md — Rewrite docker-compose.yml (4 DB containers, remove app/web containers, remove init.sql) and prune .env
- [ ] 21-02-PLAN.md — Rewrite README.md with accurate local dev bring-up instructions

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
| 19. Application Configuration | v1.4 | 0/2 | Planned | - |
| 20. Dockerfile Fixes + Railway Deployment | v1.4 | 0/3 | Planned | - |
| 21. Local Dev Docker Compose | v1.4 | 0/2 | Planned | - |
