# Phase 20: Dockerfile Fixes + Railway Deployment - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all 4 Quarkus service Dockerfiles to build reliably on Railway's resource-constrained build runners, create per-service `railway.toml` configuration files, provision a fresh Railway project with 4 PostgreSQL instances, wire datasource env vars using Railway private network template variables, and delete the legacy GHCR build pipeline (`build_and_push.sh` + `anotame-db/`).

This phase does NOT cover local dev Docker Compose (Phase 21) or application-level env var wiring in `application.properties` (Phase 19).

</domain>

<decisions>
## Implementation Decisions

### anotame-db/ and build_and_push.sh Disposal (DEPLOY-04, DEPLOY-05)

- **D-01:** Delete `anotame-db/` directory entirely via `git rm -r` — no deprecation README, no archive. Git history preserves it if recovery is ever needed.
- **D-02:** Delete `build_and_push.sh` from repo root via `git rm` — Railway native Dockerfile builds fully replace the GHCR push pipeline.

### MAVEN_OPTS Strategy (DOCKER-02)

- **D-03:** For `identity-service` and `catalog-service` (no existing `MAVEN_OPTS`): add a new `ENV MAVEN_OPTS="-Xmx512m"` line to the build stage only. Do NOT add `--add-opens` compiler flags — they are not needed for these services.
- **D-04:** For `sales-service` and `operations-service` (existing `MAVEN_OPTS` with 9 `--add-opens` compiler unlock flags): append `-Xmx512m` to the existing value. Preserve all `--add-opens` flags. Result: `ENV MAVEN_OPTS="--add-opens=... -Xmx512m"`.

### railway.toml File Location and Structure (DEPLOY-01)

- **D-05:** Each service gets its own `railway.toml` in its service subdirectory: `anotame-api/backend/{service}/railway.toml`. Railway root directory for each service is `anotame-api/backend`.
- **D-06:** `railway.toml` content is **minimal**: `[build]` section (Dockerfile path) + `[deploy]` section (healthcheckPath = `/q/health/ready`, healthcheckTimeout = 300). No restart policy override, no start command override — Railway defaults handle the rest.

### Railway Project and Manual Provisioning (DEPLOY-02, DEPLOY-03)

- **D-07:** Fresh Railway project — starting from scratch. Plans must cover full setup: project creation, adding 4 app services, adding 4 PostgreSQL plugin instances, linking variables.
- **D-08:** All Railway dashboard steps that cannot be automated go inline in plan tasks as `[MANUAL]` tasks with `autonomous: false`. Executor flags these for human action before continuing.
- **D-09:** `QUARKUS_DATASOURCE_JDBC_URL` is composed using Railway private network template variables — NOT `DATABASE_PRIVATE_URL`. Pattern per service:
  - identity: `jdbc:postgresql://${{identity-db.PGHOST}}:${{identity-db.PGPORT}}/${{identity-db.PGDATABASE}}`
  - catalog: `jdbc:postgresql://${{catalog-db.PGHOST}}:${{catalog-db.PGPORT}}/${{catalog-db.PGDATABASE}}`
  - sales: `jdbc:postgresql://${{sales-db.PGHOST}}:${{sales-db.PGPORT}}/${{sales-db.PGDATABASE}}`
  - operations: `jdbc:postgresql://${{operations-db.PGHOST}}:${{operations-db.PGPORT}}/${{operations-db.PGDATABASE}}`

### Claude's Discretion

- Dockerfile layer ordering and caching strategy beyond what DOCKER-01–04 specify
- Exact `railway.toml` TOML syntax and key names (planner should verify against Railway docs)
- Order of plan waves (Dockerfile fixes vs. railway.toml creation vs. file deletion)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Dockerfile Fixes (DOCKER-01–04) — exact fixes required per Dockerfile
- `.planning/REQUIREMENTS.md` §Railway Deployment (DEPLOY-01–05) — exact Railway provisioning and wiring requirements

### Source Dockerfiles (read current state before modifying)
- `anotame-api/backend/identity-service/Dockerfile` — no MAVEN_OPTS, uses relative ENTRYPOINT path
- `anotame-api/backend/catalog-service/Dockerfile` — no MAVEN_OPTS, uses absolute ENTRYPOINT path `/app/quarkus-run.jar` (DOCKER-04 target)
- `anotame-api/backend/sales-service/Dockerfile` — has MAVEN_OPTS with --add-opens flags, relative ENTRYPOINT
- `anotame-api/backend/operations-service/Dockerfile` — has MAVEN_OPTS with --add-opens flags, absolute ENTRYPOINT `/app/quarkus-run.jar`

### Files to Delete
- `build_and_push.sh` — repo root, GHCR push pipeline (DEPLOY-04)
- `anotame-db/` — shared DB container directory with Dockerfile + init.sql (DEPLOY-05)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No reusable assets — this phase creates new files (railway.toml ×4) and modifies existing (Dockerfiles ×4) and deletes legacy files

### Established Patterns
- All 4 Dockerfiles follow same structure: multi-stage build (maven:3.9.6-eclipse-temurin-21-alpine → eclipse-temurin:21-jre-alpine), copy all POMs then service src, build with -pl flag, copy quarkus-app/ to /app/
- WORKDIR is `/app` in run stage — relative ENTRYPOINT path (`quarkus-run.jar`) works correctly; absolute path (`/app/quarkus-run.jar`) also works but is inconsistent with `identity-service` and `sales-service`
- `wget --spider` is the health check pattern already established (PROJECT.md Key Decisions) — but Railway health check is configured in railway.toml, not Dockerfile

### Integration Points
- Railway reads `railway.toml` from the service root directory configured per-service in Railway dashboard
- Phase 19 wires `application.properties` for env var fallbacks — Phase 20's Railway env vars MUST match the names Phase 19 expects (`QUARKUS_DATASOURCE_JDBC_URL`, `QUARKUS_DATASOURCE_USERNAME`, `QUARKUS_DATASOURCE_PASSWORD`, `PORT`)

</code_context>

<specifics>
## Specific Ideas

- Railway PostgreSQL instance names: `identity-db`, `catalog-db`, `sales-db`, `operations-db` (from REQUIREMENTS.md DEPLOY-02/03)
- Quarkus health endpoint: `/q/health/ready` (Railway healthcheckPath)
- Health check timeout: 300 seconds (Quarkus augmentation build is slow on first start)
- Build context for all 4 services is `anotame-api/backend/` (parent directory, required to copy the parent POM and all module POMs)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-dockerfile-fixes-railway-deployment*
*Context gathered: 2026-04-15*
