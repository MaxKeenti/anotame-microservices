---
phase: 20-dockerfile-fixes-railway-deployment
plan: "02"
subsystem: infra
tags: [railway, docker, dockerfile, toml, deployment, postgresql]

# Dependency graph
requires:
  - phase: 20-01
    provides: Fixed Dockerfiles for all 4 Quarkus services (MAVEN_OPTS, dependency:resolve, ENTRYPOINT logging flag)
provides:
  - railway.toml for identity-service with dockerfile builder and healthcheck config
  - railway.toml for catalog-service with dockerfile builder and healthcheck config
  - railway.toml for sales-service with dockerfile builder and healthcheck config
  - railway.toml for operations-service with dockerfile builder and healthcheck config
  - Removal of build_and_push.sh (GHCR pipeline replaced by Railway native builds)
  - Removal of anotame-db/ directory (shared DB container replaced by per-service Railway PostgreSQL)
affects: [20-03, railway-deployment, local-dev]

# Tech tracking
tech-stack:
  added: [railway.toml config-as-code]
  patterns: [per-service railway.toml in service subdirectory; dockerfilePath relative to anotame-api/backend Root Directory]

key-files:
  created:
    - anotame-api/backend/identity-service/railway.toml
    - anotame-api/backend/catalog-service/railway.toml
    - anotame-api/backend/sales-service/railway.toml
    - anotame-api/backend/operations-service/railway.toml
  modified: []

key-decisions:
  - "D-05: railway.toml lives in each service subdirectory (anotame-api/backend/{service}/railway.toml); registered in Railway dashboard as absolute repo path"
  - "D-06: Minimal railway.toml — builder=dockerfile, dockerfilePath (relative to anotame-api/backend Root Directory), healthcheckPath=/q/health/ready, healthcheckTimeout=300 — no restartPolicy or startCommand overrides"
  - "D-01/D-02: Legacy files deleted via git rm with no archive; git history preserves content for recovery"
  - "Combined commit: Task 1 (railway.toml creation) and Task 2 (legacy file deletion) staged together into single commit as specified by plan"

patterns-established:
  - "railway.toml per-service pattern: each Quarkus service has its own railway.toml in its service directory; Config File Path in Railway dashboard must be set explicitly as absolute path"
  - "dockerfilePath relative to Railway Root Directory (anotame-api/backend), not relative to the railway.toml file location"

requirements-completed: [DEPLOY-01, DEPLOY-04, DEPLOY-05]

# Metrics
duration: 8min
completed: 2026-04-17
---

# Phase 20 Plan 02: Railway Config Files + Legacy Cleanup Summary

**4 railway.toml files committed (dockerfile builder, 300s healthcheck) and legacy GHCR pipeline files (build_and_push.sh, anotame-db/) removed via git rm in a single atomic commit**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-17T17:48:00Z
- **Completed:** 2026-04-17T17:56:43Z
- **Tasks:** 2
- **Files modified:** 8 (4 created, 4 deleted)

## Accomplishments
- Created railway.toml for all 4 Quarkus services (identity, catalog, sales, operations) with minimal D-06 config: builder=dockerfile, per-service dockerfilePath relative to anotame-api/backend, healthcheckPath=/q/health/ready, healthcheckTimeout=300
- Deleted build_and_push.sh (GHCR push pipeline) via git rm — Railway native Dockerfile builds replace it
- Deleted anotame-db/ directory (3 files: Dockerfile, init.sql, docs/anotame-db.md) via git rm -r — per-service Railway PostgreSQL instances replace shared DB container

## Task Commits

Both tasks were staged and committed together as a single atomic commit per plan instructions:

1. **Task 1: Create railway.toml for all 4 services** — staged, not independently committed
2. **Task 2: Delete legacy files + combined commit** — `73b57c9` (feat)

**Combined commit:** `73b57c9` — feat(deploy): add railway.toml for all 4 services; remove legacy build pipeline

## Files Created/Modified

### Created
- `anotame-api/backend/identity-service/railway.toml` — Railway build (dockerfile, identity-service/Dockerfile) + deploy (healthcheck /q/health/ready, 300s timeout)
- `anotame-api/backend/catalog-service/railway.toml` — Railway build (dockerfile, catalog-service/Dockerfile) + deploy config
- `anotame-api/backend/sales-service/railway.toml` — Railway build (dockerfile, sales-service/Dockerfile) + deploy config
- `anotame-api/backend/operations-service/railway.toml` — Railway build (dockerfile, operations-service/Dockerfile) + deploy config

### Deleted (via git rm)
- `build_and_push.sh` — GHCR multi-service build and push pipeline (82 lines); replaced by Railway native builds
- `anotame-db/Dockerfile` — Shared PostgreSQL container build file
- `anotame-db/init.sql` — Shared DB initialization SQL (490 lines); replaced by per-service Flyway V1 baselines from Phase 18
- `anotame-db/docs/anotame-db.md` — Shared DB documentation

## railway.toml Contents (exact)

### identity-service
```toml
[build]
builder = "dockerfile"
dockerfilePath = "identity-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

### catalog-service
```toml
[build]
builder = "dockerfile"
dockerfilePath = "catalog-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

### sales-service
```toml
[build]
builder = "dockerfile"
dockerfilePath = "sales-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

### operations-service
```toml
[build]
builder = "dockerfile"
dockerfilePath = "operations-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

## Decisions Made

- Followed D-05/D-06 exactly — minimal railway.toml content, per-service subdirectory placement
- Combined Task 1 (file creation) and Task 2 (git rm + commit) into single commit as the plan specified
- No restartPolicy or startCommand added — Railway platform defaults are acceptable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — railway.toml files contain complete configuration. No placeholder values.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. T-20-05 (tampering via railway.toml builder field change) is mitigated by version control visibility. T-20-06 (anotame-db/init.sql deletion from working tree) is accepted; DDL-only file with no credentials, git history preserved.

## User Setup Required

**Wave 3 (plan 20-03) requires manual Railway dashboard steps before these files take effect:**
- For each of the 4 services: set Config File Path in Railway dashboard to the absolute path (e.g., `/anotame-api/backend/identity-service/railway.toml`)
- This is because Railway's Config File Path does NOT automatically follow the Root Directory setting (Pitfall 2 from RESEARCH.md)
- Without this registration, Railway ignores the railway.toml and may fall back to Nixpacks/Railpack auto-detection

## Next Phase Readiness

- Wave 2 complete: 4 railway.toml files committed at correct paths with correct content
- Wave 3 (plan 20-03) can proceed: Railway dashboard provisioning steps (manual) — create Railway project, add 4 app services, add 4 PostgreSQL instances, set Root Directory, register Config File Path, wire datasource env vars
- No blockers for Wave 3

## Self-Check

- `anotame-api/backend/identity-service/railway.toml` EXISTS: confirmed (git show HEAD)
- `anotame-api/backend/catalog-service/railway.toml` EXISTS: confirmed
- `anotame-api/backend/sales-service/railway.toml` EXISTS: confirmed
- `anotame-api/backend/operations-service/railway.toml` EXISTS: confirmed
- `build_and_push.sh` not tracked: `git ls-files build_and_push.sh | wc -l` = 0 confirmed
- `anotame-db/` not tracked: `git ls-files anotame-db/ | wc -l` = 0 confirmed
- Commit `73b57c9` exists: confirmed

## Self-Check: PASSED

---
*Phase: 20-dockerfile-fixes-railway-deployment*
*Completed: 2026-04-17*
