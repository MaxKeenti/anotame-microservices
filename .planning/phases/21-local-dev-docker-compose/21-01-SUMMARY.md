---
phase: 21-local-dev-docker-compose
plan: "01"
subsystem: infrastructure/local-dev
tags: [docker-compose, postgresql, local-dev, databases]
requirements: [DEV-01, DEV-02]

dependency_graph:
  requires:
    - Phase 19 (application configuration — %dev datasource URLs) — for DEV-02 full satisfaction
  provides:
    - identity-db on localhost:5431/identity
    - catalog-db on localhost:5432/catalog
    - sales-db on localhost:5433/sales
    - operations-db on localhost:5434/operations
  affects:
    - Local developer workflow (docker compose up starts DBs; quarkus:dev on host connects)
    - Phase 21 Plan 02 (README documentation of bring-up workflow)

tech_stack:
  added: []
  patterns:
    - postgres:16-alpine named containers with pg_isready healthchecks
    - Named Docker volumes per service for isolated data persistence
    - DB-only compose file pattern (no app containers)

key_files:
  created: []
  modified:
    - docker-compose.yml
    - .env (gitignored — modified on disk only, not committed)

decisions:
  - .env is gitignored and contains PEM keys — Task 2 changes are on disk but not tracked in git; this is correct security posture
  - pgadmin depends_on identity-db (convention: first service in file) rather than removing depends_on
  - catalog-db intentionally uses host port 5432 (PostgreSQL default) to match Phase 19 %dev URL localhost:5432/catalog; documented with warning comment

metrics:
  duration: ~8 min
  completed_date: "2026-04-18"
  tasks_completed: 2
  files_modified: 2
---

# Phase 21 Plan 01: Local Dev Docker Compose Summary

**One-liner:** Rewrote docker-compose.yml to 4 isolated PostgreSQL containers (5431–5434) removing all app/web containers, init.sql mount, and shared anotame-db; pruned .env of obsolete docker-only vars.

## What Was Built

docker-compose.yml is now a clean "databases only" file with 4 independent PostgreSQL containers, each with its own named volume and pg_isready healthcheck. Developers run `docker compose up -d` to start all 4 DBs, then use `./mvnw quarkus:dev` on the host for each service. Flyway (already configured with `migrate-at-start=true`) creates each service's schema automatically on first startup.

.env was pruned to remove 8 vars that were only consumed by the now-removed Docker app containers. JWT PEM keys, pgadmin password, cookie config, CORS origins, and quarkus datasource credentials are retained.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite docker-compose.yml — 4 independent DB containers | bd52987 | docker-compose.yml |
| 2 | Prune .env — remove vars for removed app containers | (disk only — .env gitignored) | .env |

## Verification Results

All plan verification checks passed:

- `grep "anotame-db" docker-compose.yml` → 0 matches
- `grep "init.sql" docker-compose.yml` → 0 matches
- `grep "anotame-network" docker-compose.yml` → 0 matches
- `grep "postgres_data" docker-compose.yml` → 0 matches
- 4 DB service blocks present (identity-db, catalog-db, sales-db, operations-db)
- 4 port bindings present (5431:5432, 5432:5432, 5433:5432, 5434:5432)
- 8 named volume references (4 service + 4 top-level declarations)
- 4 pg_isready healthchecks with correct -U and -d values
- `docker compose config --quiet` exits 0 (valid YAML)
- .env: 0 matches for POSTGRES_USER/PASSWORD/DB, QUARKUS_DATASOURCE_JDBC_URL, PUBLIC_*_URL
- .env: JWT keys (SMALLRYE_JWT_SIGN_KEY, MP_JWT_VERIFY_PUBLICKEY) preserved

## Deviations from Plan

### Auto-fixed Issues

None.

### Observations

**Task 2 (.env) not committed — .env is gitignored:** The `.env` file is in `.gitignore` (correct — it contains RSA private keys). The plan's Task 2 changes were written to disk successfully and all acceptance criteria pass. The file is not tracked in git, which is the correct security posture. No deviation from plan intent — the plan itself notes `.env` is a local dev configuration file.

**DEV-02 dependency note:** DEV-02 (each service's %dev datasource profile points to its own container) is jointly satisfied by this plan (containers on correct ports) and Phase 19 (which writes the %dev datasource URLs into each application.properties). Phase 19 has not yet run. Developers starting quarkus:dev before Phase 19 executes will see connection errors to `anotame-db:5432` (old hardcoded URL in application.properties). Run Phase 19 to complete DEV-02.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundary changes introduced beyond the planned STRIDE register entries T-21-01 through T-21-05 (all accepted or mitigated per plan).

Port 5432 (catalog-db) conflict risk documented with warning comment in docker-compose.yml as planned.

## Self-Check

### Files

- [x] docker-compose.yml — FOUND, 4 DB containers + pgadmin, valid YAML
- [x] .env — FOUND on disk with correct content (not tracked in git)
- [x] .planning/phases/21-local-dev-docker-compose/21-01-SUMMARY.md — this file

### Commits

- [x] bd52987 — feat(21-01): rewrite docker-compose.yml to 4 independent DB containers

## Self-Check: PASSED
