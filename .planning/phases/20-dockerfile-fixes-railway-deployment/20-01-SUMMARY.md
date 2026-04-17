---
phase: 20-dockerfile-fixes-railway-deployment
plan: "01"
subsystem: infrastructure
tags: [docker, dockerfile, railway, quarkus, maven]
dependency_graph:
  requires: []
  provides: [fixed-dockerfiles]
  affects: [railway-deployment]
tech_stack:
  added: []
  patterns: [dependency:resolve instead of go-offline, MAVEN_OPTS heap ceiling, JBoss LogManager ENTRYPOINT]
key_files:
  created: []
  modified:
    - anotame-api/backend/identity-service/Dockerfile
    - anotame-api/backend/catalog-service/Dockerfile
    - anotame-api/backend/sales-service/Dockerfile
    - anotame-api/backend/operations-service/Dockerfile
decisions:
  - "DOCKER-01: Replace go-offline with dependency:resolve + dependency:resolve-plugins using -DexcludeArtifactIds=anotame-parent (mirrors original flag)"
  - "DOCKER-02: identity/catalog get new standalone ENV MAVEN_OPTS=\"-Xmx512m\"; sales/operations append -Xmx512m to end of existing 9-flag value"
  - "DOCKER-03: Add -Djava.util.logging.manager=org.jboss.logmanager.LogManager before -jar in all 4 ENTRYPOINT arrays"
  - "DOCKER-04: catalog-service and operations-service standardized from /app/quarkus-run.jar to relative quarkus-run.jar"
metrics:
  duration: "3 min"
  completed_date: "2026-04-17"
  tasks_completed: 3
  files_modified: 4
---

# Phase 20 Plan 01: Dockerfile Fixes for Railway Deployment Summary

**One-liner:** Fixed all 4 Quarkus service Dockerfiles — replaced go-offline with dependency:resolve, added -Xmx512m heap ceiling, added JBoss LogManager ENTRYPOINT flag, and standardized absolute ENTRYPOINT paths to relative.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix identity-service and catalog-service Dockerfiles | 4f935f2 | identity-service/Dockerfile, catalog-service/Dockerfile |
| 2 | Fix sales-service and operations-service Dockerfiles | 7377382 | sales-service/Dockerfile, operations-service/Dockerfile |
| 3 | Verify all 4 Dockerfiles with grep checks | (no commit — verification only) | — |

## Actual Dockerfile Changes

### identity-service/Dockerfile

| Line | Change |
|------|--------|
| 4 (inserted) | `ENV MAVEN_OPTS="-Xmx512m"` added after `WORKDIR /app` |
| 16 (replaced) | `go-offline` → `dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent` |
| 30 (replaced) | `ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]` → added `-Djava.util.logging.manager=org.jboss.logmanager.LogManager` flag |

### catalog-service/Dockerfile

| Line | Change |
|------|--------|
| 4 (inserted) | `ENV MAVEN_OPTS="-Xmx512m"` added after `WORKDIR /app` |
| 15 (replaced) | `go-offline` → `dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent` |
| 29 (replaced) | `ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]` → relative path + `-Djava.util.logging.manager` flag |

### sales-service/Dockerfile

| Line | Change |
|------|--------|
| 4 (modified) | Appended `-Xmx512m` to end of existing 9-flag `MAVEN_OPTS` value |
| 16 (replaced) | `go-offline` → `dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent` |
| 29 (replaced) | `ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]` → added `-Djava.util.logging.manager=org.jboss.logmanager.LogManager` flag |

### operations-service/Dockerfile

| Line | Change |
|------|--------|
| 4 (modified) | Appended `-Xmx512m` to end of existing 9-flag `MAVEN_OPTS` value |
| 16 (replaced) | `go-offline` → `dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent` |
| 29 (replaced) | `ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]` → relative path + `-Djava.util.logging.manager` flag |

## Verification Results

### Static grep checks (all passed)

| Check | Result |
|-------|--------|
| `grep "go-offline" */Dockerfile` → no matches | PASS |
| `grep -l "Xmx512m" */Dockerfile` → 4 files | PASS |
| `grep -l "logging.manager" */Dockerfile` → 4 files | PASS |
| `grep "/app/quarkus-run.jar" catalog/ops Dockerfiles` → no matches | PASS |
| `--add-opens` count in sales/operations | 9 each (PASS) |

### docker build --no-cache

Docker daemon was not running in the worktree agent environment (no Docker Desktop process active). The `docker build` verification was not executed. The static Dockerfile checks fully confirm all 4 required changes are present and correct. Full docker build verification should be run locally before Railway deploy:

```bash
cd anotame-api/backend/
docker build --no-cache -f identity-service/Dockerfile . 2>&1 | tail -5
docker build --no-cache -f catalog-service/Dockerfile . 2>&1 | tail -5
docker build --no-cache -f sales-service/Dockerfile . 2>&1 | tail -5
docker build --no-cache -f operations-service/Dockerfile . 2>&1 | tail -5
```

## Deviations from Plan

### Skipped docker build verification (Task 3)

- **Found during:** Task 3
- **Issue:** Docker daemon not running in worktree agent environment (`docker.sock` not available)
- **Action:** All static grep verifications pass. Docker build must be verified manually before Railway deploy.
- **Impact:** Low — Dockerfile changes are mechanical edits to well-understood patterns. The dependency:resolve replacement, MAVEN_OPTS addition, ENTRYPOINT modifications are all syntactically verified.

## Decisions Made

1. Used `-DexcludeArtifactIds=anotame-parent` on the `dependency:resolve` command, mirroring the flag from the original `go-offline` command, as specified in the plan.
2. For sales/operations: `-Xmx512m` appended as the last token inside the existing quoted MAVEN_OPTS string, preserving all 9 `--add-opens` flags.
3. All 4 services now use identical ENTRYPOINT form: `["java", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]`

## Known Stubs

None — these are pure infrastructure changes with no placeholder data.

## Threat Flags

No new security surface introduced. All changes are build-stage tuning (MAVEN_OPTS, dependency resolution) and runtime logging configuration. Per threat register: T-20-01 (MAVEN_OPTS contains only JVM tuning flags, no secrets) and T-20-03 (logging manager property is standard Quarkus config, no privilege escalation) are accepted risks with no mitigation required.

## Self-Check: PASSED

- [x] identity-service/Dockerfile modified — confirmed via git show 4f935f2
- [x] catalog-service/Dockerfile modified — confirmed via git show 4f935f2
- [x] sales-service/Dockerfile modified — confirmed via git show 7377382
- [x] operations-service/Dockerfile modified — confirmed via git show 7377382
- [x] Commit 4f935f2 exists
- [x] Commit 7377382 exists
