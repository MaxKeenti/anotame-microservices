# Phase 21: Local Dev Docker Compose - Research

**Researched:** 2026-04-15
**Domain:** Docker Compose, PostgreSQL container provisioning, Quarkus Flyway local dev workflow
**Confidence:** HIGH

## Summary

Phase 21 replaces the existing single shared `anotame-db` PostgreSQL container with 4 independent containers, each owned by one service. The current `docker-compose.yml` also contains all 4 Quarkus backend services and the frontend. For local development purposes, the app containers are not useful — developers run `quarkus:dev` on the host directly, so the plan must decide what scope the new compose file covers.

The technical work is straightforward: 4 named PostgreSQL service blocks, 4 named volumes, 4 healthchecks, correct port mappings (5431–5434). Flyway's `migrate-at-start=true` is already present in all 4 `application.properties` files and will create schemas automatically on first `quarkus:dev` startup — no manual SQL required. The `anotame-db/` directory (containing `init.sql`) and the shared `postgres_data` volume must be removed from the compose file as well.

The key architectural decision for the planner is: keep the application containers in `docker-compose.yml` or remove them? The research below gives a clear recommendation based on the local dev use case.

**Primary recommendation:** Rewrite `docker-compose.yml` to contain ONLY the 4 PostgreSQL containers and `anotame-pgadmin` (optional). Remove all application containers (identity-service, catalog-service, sales-service, operations-service, anotame-web). This produces a clean "databases only" compose file that a developer can always leave running while they start individual services via `quarkus:dev` on the host.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEV-01 | `docker-compose.yml` updated to provision 4 independent PostgreSQL containers (`identity-db`, `catalog-db`, `sales-db`, `operations-db`) each on distinct ports (5431–5434) | Docker Compose named services + port mapping patterns documented below |
| DEV-02 | Each service's `%dev` datasource profile points to its own local container — no service shares a database in local dev | Phase 19 plans establish the %dev URLs; this phase provisions matching containers. No application.properties changes needed in Phase 21 if Phase 19 has run. If Phase 19 has NOT run yet, this phase must note the dependency. |
| DEV-03 | Local dev bring-up documented: `docker compose up` starts all 4 DBs; Flyway creates schema on first app startup; no manual `init.sql` execution needed | `quarkus.flyway.migrate-at-start=true` is already set in all 4 services; no additional config needed |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

- All services containerized via Docker using `docker-compose.yml` [VERIFIED: AI_RULES.md §1]
- Verify end-to-end via `docker compose up --build` before committing [VERIFIED: AI_RULES.md §4]
- The `anotame-db/` directory is part of the monorepo structure as listed in AI_RULES.md §1 — Phase 20 (DEPLOY-05) is responsible for removing it from the repository. Phase 21 only needs to remove the mount reference from `docker-compose.yml`.

---

## Current State Audit

### Current docker-compose.yml (exact state, verified by reading the file)

The file contains:
1. `anotame-db` — single PostgreSQL container on `5433:5432`, with `./anotame-db/init.sql` volume mount, `postgres_data` named volume [VERIFIED: docker-compose.yml]
2. `anotame-pgadmin` — PgAdmin on `5050:80`, depends on `anotame-db` healthcheck [VERIFIED: docker-compose.yml]
3. `identity-service` — Quarkus app container, port `8081:8081` [VERIFIED: docker-compose.yml]
4. `catalog-service` — Quarkus app container, port `8082:8082` [VERIFIED: docker-compose.yml]
5. `sales-service` — Quarkus app container, port `8083:8083` [VERIFIED: docker-compose.yml]
6. `operations-service` — Quarkus app container, port `8084:8084` [VERIFIED: docker-compose.yml]
7. `anotame-web` — SvelteKit frontend container, port `3000:3000` [VERIFIED: docker-compose.yml]

**Critical observation:** The current shared `anotame-db` is mapped to host port `5433`, not `5432`. This is important — the new `catalog-db` will also be on `5432` inside its container but mapped to `5432` on the host (matching Phase 19's `%dev` URL `localhost:5432/catalog`). There is no port conflict because the old container goes away entirely.

### Current application.properties state (verified by reading each file)

Phase 19 has NOT been executed yet. All 4 services still have:
- `quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame` (hardcoded, shared DB host)
- No `%dev.quarkus.datasource.jdbc.url` lines present
- `quarkus.flyway.migrate-at-start=true` — present in all 4 [VERIFIED: all 4 application.properties]
- `quarkus.flyway.baseline-on-migrate=true` — present (Phase 18 will remove this)
- `quarkus.flyway.table=flyway_schema_history_{service}` — custom table names (Phase 18 will remove these)

**Implication for Phase 21:** The `%dev` datasource URLs that Phase 21's containers must match are defined in Phase 19 plans, not yet in the code. Phase 21 must document this dependency clearly but the container port assignments are fixed regardless.

### .env file current state

The `.env` file contains `QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://anotame-db:5432/anotame` which is consumed by the Docker Compose app containers. After Phase 21, app containers are removed from compose, so this env var in `.env` becomes unused for local dev (developer sets it per-service or relies on `%dev` profile). The `.env` file will need minor updates. [VERIFIED: .env file]

### anotame-db/ directory

Contains `init.sql` (the shared monolithic SQL schema) and a `Dockerfile` and `docs/`. Phase 20 (DEPLOY-05) is responsible for deleting this directory from the repository. Phase 21 only removes the volume mount reference from `docker-compose.yml`. [VERIFIED: directory listing]

---

## Standard Stack

### Core

| Library/Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| postgres | 16-alpine | PostgreSQL for each service DB | Already used in current compose; alpine minimizes image size |
| Docker Compose | v2 (v5.1.1 installed) | Orchestrate local dev containers | Already the project standard [VERIFIED: docker --version] |

### Supporting

| Tool | Purpose | Notes |
|------|---------|-------|
| dpage/pgadmin4:8 | Database GUI for inspection | Already in compose, optional dev tool |
| `pg_isready` | Healthcheck command inside postgres:16-alpine container | Ships with postgres image, no extra install needed |

---

## Architecture Patterns

### Recommended New docker-compose.yml Structure

The new file should contain ONLY database containers (and optionally pgadmin). Remove all application containers. Rationale:

1. **Local dev workflow is `quarkus:dev` on host** — developers do not run Quarkus services via Docker compose locally; they use `./mvnw quarkus:dev` which connects to the DB at `localhost:543{1-4}`.
2. **Application containers build the JAR** — they run in production mode, not dev mode. They cannot pick up live code changes. Including them in a "local dev" compose file creates confusion.
3. **Simpler, more maintainable** — a 4-service DB-only compose file is self-contained and never goes stale from code changes.

```yaml
# docker-compose.yml — local dev databases only
services:
  identity-db:
    image: postgres:16-alpine
    container_name: identity-db
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: identity
    ports:
      - "5431:5432"
    volumes:
      - identity_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d identity"]
      interval: 10s
      timeout: 5s
      retries: 5

  catalog-db:
    image: postgres:16-alpine
    container_name: catalog-db
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: catalog
    ports:
      - "5432:5432"
    volumes:
      - catalog_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d catalog"]
      interval: 10s
      timeout: 5s
      retries: 5

  sales-db:
    image: postgres:16-alpine
    container_name: sales-db
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sales
    ports:
      - "5433:5432"
    volumes:
      - sales_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d sales"]
      interval: 10s
      timeout: 5s
      retries: 5

  operations-db:
    image: postgres:16-alpine
    container_name: operations-db
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: operations
    ports:
      - "5434:5432"
    volumes:
      - operations_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d operations"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: PgAdmin GUI for database inspection
  anotame-pgadmin:
    image: dpage/pgadmin4:8
    container_name: anotame-pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@anotame.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      identity-db:
        condition: service_healthy

volumes:
  identity_db_data:
  catalog_db_data:
  sales_db_data:
  operations_db_data:
```

### Port Mapping Table (locked by Phase 19 decisions)

| Service | Container Name | Host Port | Container Port | DB Name | %dev URL (Phase 19) |
|---------|---------------|-----------|----------------|---------|---------------------|
| identity-service | identity-db | 5431 | 5432 | identity | `jdbc:postgresql://localhost:5431/identity` |
| catalog-service | catalog-db | 5432 | 5432 | catalog | `jdbc:postgresql://localhost:5432/catalog` |
| sales-service | sales-db | 5433 | 5432 | sales | `jdbc:postgresql://localhost:5433/sales` |
| operations-service | operations-db | 5434 | 5432 | operations | `jdbc:postgresql://localhost:5434/operations` |

**Note:** Port 5432 (catalog-db) is the PostgreSQL default. This is intentional — catalog is second in the service lineup and a clean assignment. Developers should ensure no local PostgreSQL server is running on the host on 5432.

### Flyway Auto-Schema Pattern

All 4 services already have `quarkus.flyway.migrate-at-start=true` in `application.properties`. When a developer starts a service with `quarkus:dev` after `docker compose up` brings up the DB:

1. Quarkus connects to `localhost:543{1-4}/{service}` (via `%dev` profile, post Phase 19)
2. Flyway detects no `flyway_schema_history` table (empty fresh DB)
3. Flyway applies `V1__baseline.sql` automatically
4. Schema is ready; service starts

No `init.sql`, no manual `psql` commands, no DDL step. The developer workflow is exactly:
```bash
docker compose up -d          # start all 4 DBs
cd anotame-api/backend/identity-service
./mvnw quarkus:dev            # Flyway creates schema on first boot
```
[VERIFIED: `quarkus.flyway.migrate-at-start=true` present in all 4 application.properties]

### Anti-Patterns to Avoid

- **Do NOT include Quarkus app containers in the new compose file.** They build a production JAR, not a dev mode service. Including them creates a false impression that `docker compose up` is the complete local dev workflow.
- **Do NOT mount `init.sql` into any container.** Flyway handles schema creation. Mounting init.sql alongside Flyway would double-create tables and cause errors.
- **Do NOT use a single shared PostgreSQL container with multiple databases.** This re-creates the old problem with different names.
- **Do NOT use the old shared `postgres_data` volume.** Each service needs its own named volume to prevent data co-mingling and allow independent `docker volume rm` per service.
- **Do NOT keep the `anotame-network` bridge network** if app containers are removed. When only DB containers are in the compose, they don't need to communicate with each other, so a custom network is unnecessary overhead. The default Compose network suffices. (If pgadmin is kept, it should also work on the default network.)
- **Do NOT keep `env_file: .env`** for the DB containers. The `.env` currently contains `QUARKUS_DATASOURCE_JDBC_URL` and other app-level vars that are not needed by PostgreSQL containers. Hardcode simple `POSTGRES_USER/PASSWORD/DB` directly in the environment block (dev values only — credentials are dev-only and not sensitive).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema initialization | Manual `psql` or `init.sql` mount | Quarkus Flyway `migrate-at-start=true` | Already wired; adding init.sql creates double-create table errors |
| DB healthcheck | Custom script | `pg_isready` built into postgres:16-alpine image | Ships with the image, standard pattern |
| Per-service database isolation | Separate schemas in one DB | Separate containers with separate named volumes | Matches Railway production topology; allows independent `docker volume rm` |

---

## Common Pitfalls

### Pitfall 1: catalog-db on port 5432 conflicts with host PostgreSQL

**What goes wrong:** If the developer has a local PostgreSQL server running on the host (macOS/Linux), it already listens on port 5432. Docker will fail to bind `catalog-db` to `5432:5432` with "address already in use."
**Why it happens:** Port 5432 is the PostgreSQL default and is often occupied.
**How to avoid:** The plan must include a note in the README/docs section that developers should stop their local PostgreSQL server before running `docker compose up`, or preferably not install PostgreSQL locally at all since containers replace it.
**Warning signs:** `docker compose up` exits with error `bind: address already in use` on port 5432.

### Pitfall 2: Old `postgres_data` volume holds stale data

**What goes wrong:** If the developer previously ran `docker compose up` with the old single `anotame-db` container, the `postgres_data` volume still exists. After switching to the new compose file, the old volume is unused but still present. Running `docker volume rm postgres_data` manually is needed for cleanup.
**Why it happens:** Docker does not automatically remove named volumes on compose file changes.
**How to avoid:** Document the one-time migration step: `docker volume rm anotame-microservices_postgres_data`. This is a one-time teardown step.
**Warning signs:** The old `postgres_data` volume appears in `docker volume ls`.

### Pitfall 3: Phase 19 not yet executed — services still connect to `anotame-db`

**What goes wrong:** If Phase 19 has not run, the `%dev` profile fallback URLs are not in `application.properties`. Running `quarkus:dev` with the new containers will fail because the service still has `quarkus.datasource.jdbc.url=jdbc:postgresql://anotame-db:5432/anotame` — a hostname that no longer resolves when app containers are gone from compose.
**Why it happens:** Phase 21 creates the DB containers Phase 19 expects but Phase 19 has not written the `%dev` URLs yet.
**How to avoid:** Phase 21's plan must note that DEV-02 (each service's `%dev` profile points to its own container) is only satisfied after Phase 19 runs. The Phase 21 plan may optionally check for `%dev` URLs and note the dependency, but it does NOT modify application.properties (that is Phase 19's scope).
**Warning signs:** `quarkus:dev` fails with connection refused to `anotame-db:5432` after running `docker compose up`.

### Pitfall 4: pgadmin `depends_on` references a service that no longer exists

**What goes wrong:** The current `anotame-pgadmin` has `depends_on: anotame-db`. After replacing `anotame-db` with 4 separate services, this reference breaks compose startup.
**Why it happens:** The `depends_on` key uses the old service name.
**How to avoid:** Update `anotame-pgadmin` to `depends_on: identity-db` (or any one of the 4 — pgadmin just needs at least one DB ready before starting). Or simply remove `depends_on` from pgadmin entirely since it can retry connections.

### Pitfall 5: `anotame-network` references in leftover services

**What goes wrong:** If any fragment of the old service definitions is left in the compose file referencing `anotame-network`, compose will fail because the network is defined but the services that need it are gone.
**How to avoid:** If removing all app containers, also remove the `networks:` top-level block and any `networks:` entries from remaining services.

---

## Code Examples

### Postgres healthcheck pattern (postgres:16-alpine)
```yaml
# Source: Docker Hub postgres image documentation — pg_isready ships with all postgres images
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U admin -d identity"]
  interval: 10s
  timeout: 5s
  retries: 5
```
Note: `-U` must match `POSTGRES_USER`, `-d` must match `POSTGRES_DB`. [ASSUMED — standard pattern, consistent with existing compose healthcheck in project]

### Named volume declaration pattern
```yaml
volumes:
  identity_db_data:
  catalog_db_data:
  sales_db_data:
  operations_db_data:
```
Docker Compose creates these on first `docker compose up`. They persist across `docker compose down` (requires `docker compose down -v` to destroy). [ASSUMED — standard Docker Compose behavior]

### .env file updates needed

The current `.env` contains `QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://anotame-db:5432/anotame` and `POSTGRES_DB=anotame`. After Phase 21:
- `POSTGRES_DB=anotame` is no longer used (each DB container uses its own hardcoded env var in compose)
- `QUARKUS_DATASOURCE_JDBC_URL=...` is no longer needed for local dev (services use `%dev` profile after Phase 19)
- `PUBLIC_*_URL` vars are no longer needed (app containers removed from compose)

The `.env` file should be pruned to keep only: `PGADMIN_DEFAULT_PASSWORD` (if pgadmin is kept), JWT keys (still needed when running `quarkus:dev`), and any dev-level overrides a developer may want.

**However:** Modifying `.env` is optional for DEV-01/02/03. The `.env` cleanup is cosmetic — the new compose file does not `env_file: .env`, so unused vars in `.env` cause no errors. The plan can include `.env` cleanup as a task or defer it.

---

## Scope Decision: Application Containers

**Verdict: Remove all application containers from `docker-compose.yml`.**

Evidence supporting removal:
1. The local dev workflow is `quarkus:dev` on host, not containerized Quarkus. Running Quarkus in a Docker container locally is a full production build (no live reload, no dev mode, no dev services).
2. DEPLOY-05 (Phase 20) already establishes Railway as the deployment target — Docker is not the production mechanism.
3. Phase 21's success criteria makes no mention of Quarkus containers: "docker compose up starts exactly 4 PostgreSQL containers on ports 5431–5434; no shared anotame-db container or init.sql volume mount exists" — the criteria is about DBs only.
4. Keeping app containers would require maintaining correct Dockerfile paths, build args, and env var injection — maintenance burden with no local dev benefit.

**Verdict on pgadmin: Keep it (optional).**

PgAdmin is a genuine dev productivity tool. It allows developers to inspect the per-service databases without CLI commands. Cost: one extra container. Benefit: significantly easier debugging during development. Keeping it with a warning comment ("optional, comment out if unused") is the right balance.

---

## DEV-02 Dependency Clarification

DEV-02 requires each service's `%dev` profile to point to its own container. Phase 21 provisions the containers that match Phase 19's `%dev` URLs. The relationship is:

- Phase 19 writes: `%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5431/identity` (in application.properties)
- Phase 21 provisions: `identity-db` container mapped to `localhost:5431`

If phases execute in order (19 before 21), DEV-02 is satisfied at the point Phase 21 completes. If Phase 21 runs first, the containers exist but DEV-02 is not fully satisfied until Phase 19 runs. The plan should note this dependency but not block execution — the docker-compose.yml change is independent of application.properties changes.

---

## Files to Modify

| File | Change | Notes |
|------|--------|-------|
| `docker-compose.yml` | Complete rewrite | Replace with 4 DB containers + optional pgadmin; remove app containers, old volumes, anotame-network |
| `.env` | Optional cleanup | Remove obsolete `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `QUARKUS_DATASOURCE_JDBC_URL`, `PUBLIC_*_URL` vars. JWT keys stay. |

## Files to NOT Modify (Phase Boundaries)

| File | Owner Phase | Reason |
|------|-------------|--------|
| Any `application.properties` | Phase 19 | `%dev` URL lines are Phase 19's responsibility |
| `anotame-db/` directory | Phase 20 (DEPLOY-05) | Directory deletion is DEPLOY-05's scope |
| Any Dockerfile | Phase 20 | Not in scope for Phase 21 |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual / shell verification |
| Config file | none |
| Quick run command | `docker compose up -d && docker compose ps` |
| Full suite command | See verification block below |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEV-01 | 4 containers start on ports 5431–5434, no `anotame-db` | smoke | `docker compose up -d && docker compose ps` | N/A — shell check |
| DEV-01 | No `init.sql` volume mount in compose | static | `grep "init.sql" docker-compose.yml` | docker-compose.yml |
| DEV-02 | Each service `%dev` URL unique, no shared DB | static (post Phase 19) | `grep "%dev.quarkus.datasource" */backend/*/src/main/resources/application.properties` | application.properties |
| DEV-03 | Flyway auto-creates schema, no manual SQL | smoke (manual) | Start any service with `quarkus:dev`, check startup logs for "Flyway Community Edition" | manual only |

### Verification Commands for Phase Gate

```bash
# DEV-01: Verify exactly 4 DB containers are running
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# DEV-01: Verify old anotame-db is gone from compose file
grep "anotame-db" docker-compose.yml

# DEV-01: Verify init.sql mount is gone
grep "init.sql" docker-compose.yml

# DEV-01: Verify correct port bindings in compose file
grep -E "5431|5432|5433|5434" docker-compose.yml

# DEV-01: Verify 4 named volumes declared
grep -E "identity_db_data|catalog_db_data|sales_db_data|operations_db_data" docker-compose.yml

# Connectivity check (after docker compose up -d)
docker exec identity-db pg_isready -U admin -d identity
docker exec catalog-db pg_isready -U admin -d catalog
docker exec sales-db pg_isready -U admin -d sales
docker exec operations-db pg_isready -U admin -d operations
```

### Wave 0 Gaps

None — no test framework installation required. Verification is via docker CLI commands and file grep checks that can run immediately.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Container runtime | Yes | 29.4.0 | — |
| Docker Compose | Orchestration | Yes | v5.1.1 | — |
| postgres:16-alpine | DB image | Yes (pull on first run) | 16-alpine | — |

[VERIFIED: `docker --version` and `docker compose version` on target machine]

No missing dependencies.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pg_isready -U admin -d {dbname}` is the correct healthcheck syntax for postgres:16-alpine | Code Examples | Healthcheck fails if user/db name syntax differs; would need `-U postgres` or other user |
| A2 | Named volumes persist across `docker compose down` and require `-v` flag to delete | Code Examples | No functional risk — this is standard Docker behavior documented widely |
| A3 | Removing `anotame-network` custom bridge network causes no issues when only DB containers remain | Scope Decision | No risk — containers without explicit networks get the default Compose network |

---

## Open Questions (RESOLVED)

1. **Should `.env` be cleaned up in this phase or left for a separate housekeeping task?**
   - What we know: `.env` has vars that are only relevant to the old app containers in compose (POSTGRES_DB, PUBLIC_*_URL, QUARKUS_DATASOURCE_JDBC_URL at compose level)
   - What's unclear: Whether any other tooling (scripts, CI, documentation) references these `.env` vars
   - Recommendation: Include `.env` cleanup as an optional task in the plan. Mark it "good housekeeping" rather than required for DEV-01/02/03 compliance.
   - **RESOLVED:** `.env` cleanup included as Plan 01 Task 2 — remove 8 obsolete vars, retain JWT keys, pgadmin password, cookie config, CORS origins.

2. **Should pgadmin depend on one specific DB container or have no `depends_on`?**
   - What we know: PgAdmin can retry connections to databases; it does not need a DB to start
   - Recommendation: Keep `depends_on: identity-db: condition: service_healthy` as a convention (identity-db is the first service, first in the file) but note it is arbitrary — any of the 4 containers would work.
   - **RESOLVED:** Plan 01 Task 1 sets `anotame-pgadmin depends_on: identity-db: condition: service_healthy` as the chosen convention.

---

## Sources

### Primary (HIGH confidence)
- VERIFIED: `/Users/moonstone/Source/Personal/anotame-microservices/docker-compose.yml` — current container topology
- VERIFIED: All 4 `application.properties` files — Flyway `migrate-at-start=true` confirmed present
- VERIFIED: Phase 19 PLAN-01 and PLAN-02 — %dev URL assignments (5431–5434, per-service DB names)
- VERIFIED: `docker --version` (29.4.0) and `docker compose version` (v5.1.1) — environment available
- VERIFIED: `.env` file contents — old env vars present, JWT keys present

### Secondary (MEDIUM confidence)
- Phase 20 ROADMAP entry — DEPLOY-05 assigns `anotame-db/` directory removal to Phase 20, not Phase 21

### Tertiary (LOW confidence / ASSUMED)
- A1: `pg_isready` healthcheck syntax — standard postgres image pattern, not verified against Docker Hub docs in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Docker Compose + postgres:16-alpine already in use; no new tech introduced
- Architecture (remove app containers): HIGH — supported by success criteria text and local dev workflow analysis
- Port assignments: HIGH — locked by Phase 19 plans
- Flyway auto-schema: HIGH — verified `migrate-at-start=true` in all 4 properties files
- Pitfalls: HIGH — derived from reading actual current state of compose file and .env

**Research date:** 2026-04-15
**Valid until:** 2026-06-01 (stable tech — Docker Compose patterns do not change rapidly)
