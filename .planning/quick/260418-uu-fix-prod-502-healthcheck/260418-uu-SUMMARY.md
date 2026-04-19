---
phase: quick-260418-uu
plan: 01
subsystem: infra
tags: [railway, quarkus, healthcheck, liveness, readiness, bash]

requires: []
provides:
  - Railway healthcheck switched to /q/health/live on all 4 services (identity, catalog, sales, operations)
  - test_integration.sh checks liveness and readiness separately, exits 1 only on JVM failure
affects: [railway-deploy, operations, monitoring]

tech-stack:
  added: []
  patterns:
    - "Quarkus liveness (/q/health/live) for infrastructure healthchecks; readiness (/q/health/ready) for DB-connectivity diagnostic only"
    - "Dual probe pattern in integration scripts: liveness drives exit code, readiness is WARN-only"

key-files:
  created: []
  modified:
    - anotame-api/backend/identity-service/railway.toml
    - anotame-api/backend/catalog-service/railway.toml
    - anotame-api/backend/sales-service/railway.toml
    - anotame-api/backend/operations-service/railway.toml
    - test_integration.sh

key-decisions:
  - "Use /q/health/live (JVM-only, no DB probe) for Railway healthcheckPath to prevent false-positive service kills during DB blips"
  - "Readiness failures in test_integration.sh are WARN, not FAIL; only liveness failure increments FAIL_COUNT and triggers exit 1"

patterns-established:
  - "Railway healthcheckPath should always point to the liveness endpoint, not readiness"
  - "Integration scripts must distinguish JVM health from DB health in their output and exit codes"

requirements-completed: []

duration: 8min
completed: 2026-04-18
---

# Quick Task 260418-uu: Fix Prod 502 — Switch Railway Healthcheck to Liveness Endpoint

**Railway healthcheck switched from /q/health/ready (DB-dependent) to /q/health/live (JVM-only) across all 4 services, eliminating false-positive 502s during transient DB unavailability; test_integration.sh now probes liveness and readiness separately with distinct exit semantics.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-18
- **Completed:** 2026-04-18
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- All 4 railway.toml files now use `healthcheckPath = "/q/health/live"` — Railway will only mark a service down when the JVM crashes, not during DB blips
- test_integration.sh prints two result rows per service (LIVE + READY); readiness failures print as WARN and do not increment FAIL_COUNT
- Script exit code is now strictly tied to JVM liveness: `exit 1` only when a service's /q/health/live fails after all retries

## Task Commits

1. **Task 1: Switch healthcheckPath to /q/health/live in all 4 railway.toml files** — `f4a5407` (chore)
2. **Task 2: Update test_integration.sh to check liveness and readiness separately** — `bf71512` (feat)

## Files Created/Modified

- `anotame-api/backend/identity-service/railway.toml` — healthcheckPath changed to /q/health/live
- `anotame-api/backend/catalog-service/railway.toml` — healthcheckPath changed to /q/health/live
- `anotame-api/backend/sales-service/railway.toml` — healthcheckPath changed to /q/health/live
- `anotame-api/backend/operations-service/railway.toml` — healthcheckPath changed to /q/health/live
- `test_integration.sh` — replaced single HEALTH_PATH with LIVE_PATH + READY_PATH; added probe_url() helper; dual-check loop; two summary rows per service; WARN-level readiness; exit 1 on liveness only

## Decisions Made

- `/q/health/live` is the correct endpoint for Railway because it only checks JVM process health with no DB dependency — DB blips during cold starts or redeployments no longer trigger Railway's failure handler
- Readiness failures are surfaced as `WARN` in test output (with DB failure message) so operators can distinguish "JVM dead" from "DB connectivity issue" at a glance
- Exit semantics: `exit 1` reserved for liveness failures only, making the script safe for CI pipelines that monitor JVM health without penalizing intermittent DB connectivity

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Changes take effect on the next Railway deploy.

## Next Phase Readiness

- After the next Railway deploy, transient DB unavailability during cold starts will no longer cause 502s
- Operators can run `./test_integration.sh` to see liveness vs. readiness status per service independently

## Self-Check: PASSED

- `anotame-api/backend/identity-service/railway.toml` — contains `/q/health/live` ✓
- `anotame-api/backend/catalog-service/railway.toml` — contains `/q/health/live` ✓
- `anotame-api/backend/sales-service/railway.toml` — contains `/q/health/live` ✓
- `anotame-api/backend/operations-service/railway.toml` — contains `/q/health/live` ✓
- `test_integration.sh` — bash -n passes, LIVE_PATH + READY_PATH constants present ✓
- Commits f4a5407 and bf71512 exist on main ✓

---
*Phase: quick-260418-uu*
*Completed: 2026-04-18*
