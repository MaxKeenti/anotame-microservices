---
phase: 20-dockerfile-fixes-railway-deployment
verified: 2026-04-17T00:00:00Z
status: human_needed
score: 8/9
overrides_applied: 0
human_verification:
  - test: "Confirm Railway deploy succeeded without OOM kill or augmentation build failure"
    expected: "Railway build logs show 'BUILD SUCCESS' from Maven with no 'Killed' signal and no 'Could not resolve ...quarkus-...-deployment' error"
    why_human: "docker build --no-cache was skipped (Docker daemon not running in agent environment per 20-01-SUMMARY). Railway deploy success is attested in 20-03-SUMMARY but build log content cannot be verified programmatically from this repo."
  - test: "Confirm each deployed service's /q/health/ready returns HTTP 200"
    expected: "curl -f https://anotame-{service}-production.up.railway.app/q/health/ready returns HTTP 200 with JSON body containing status=UP"
    why_human: "20-03-SUMMARY reports Railway-reported health check success at deploy time but notes that subsequent local curl checks returned 502 (Railway Hobby tier service sleep). The health endpoint state cannot be verified from the repository."
---

# Phase 20: Dockerfile Fixes + Railway Deployment — Verification Report

**Phase Goal:** All 4 services build and run successfully as Railway native Dockerfile deployments — each backed by its own Railway PostgreSQL instance, reachable via `/q/health/ready`, with the legacy GHCR build pipeline removed
**Verified:** 2026-04-17
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 4 Dockerfiles use `dependency:resolve dependency:resolve-plugins` instead of `go-offline` | VERIFIED | `grep -rn "go-offline" anotame-api/backend/*/Dockerfile` exits 1 (no matches). All 4 files contain `RUN mvn -B dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent` |
| 2 | All 4 Dockerfiles have MAVEN_OPTS with -Xmx512m | VERIFIED | identity/catalog: `ENV MAVEN_OPTS="-Xmx512m"` (standalone, line 4). sales/operations: 9 `--add-opens` flags + `-Xmx512m` appended as last token. All confirmed at line 4 of each file. |
| 3 | All 4 Dockerfiles have ENTRYPOINT with `-Djava.util.logging.manager=org.jboss.logmanager.LogManager` before `-jar` | VERIFIED | All 4 ENTRYPOINT lines: `["java", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]` |
| 4 | All 4 Dockerfiles use relative path `quarkus-run.jar` in ENTRYPOINT (not /app/quarkus-run.jar) | VERIFIED | `grep "/app/quarkus-run.jar" catalog-service/Dockerfile operations-service/Dockerfile` exits 1. All 4 use `quarkus-run.jar` (relative). |
| 5 | identity-service and catalog-service each have a standalone `ENV MAVEN_OPTS="-Xmx512m"` line | VERIFIED | identity-service/Dockerfile line 4: `ENV MAVEN_OPTS="-Xmx512m"`. catalog-service/Dockerfile line 4: `ENV MAVEN_OPTS="-Xmx512m"`. |
| 6 | sales-service and operations-service each preserve all 9 --add-opens flags and append -Xmx512m | VERIFIED | `grep -o "add-opens" sales-service/Dockerfile \| wc -l` = 9. Same for operations-service = 9. `-Xmx512m` is the final token inside the quoted MAVEN_OPTS value in both files. |
| 7 | Each of the 4 service directories contains a railway.toml with builder=dockerfile, correct dockerfilePath, healthcheckPath=/q/health/ready, healthcheckTimeout=300 | VERIFIED | All 4 railway.toml files exist and contain exact expected content. dockerfilePath values are per-service relative paths. healthcheckTimeout is integer 300 (not string). |
| 8 | `build_and_push.sh` and `anotame-db/` no longer exist in the repository | VERIFIED | `git ls-files build_and_push.sh \| wc -l` = 0. `git ls-files anotame-db/ \| wc -l` = 0. Neither path exists on disk. Removed via commit 73b57c9. |
| 9 | Each service's /q/health/ready returns HTTP 200 within 300s of Railway deploy; Railway deploy completes without OOM kill or augmentation failure | ? UNCERTAIN | 20-03-SUMMARY attests Railway-reported "Healthcheck succeeded!" for all 4 services. Local curl post-deploy returned 502 (Hobby tier sleep). Build logs not inspectable from repo. Requires human confirmation. |

**Score:** 8/9 truths verified (1 requires human confirmation)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `anotame-api/backend/identity-service/Dockerfile` | Fixed build stage (dependency:resolve, MAVEN_OPTS, ENTRYPOINT logging manager, relative path) | VERIFIED | All 4 required changes confirmed. Committed in 4f935f2. |
| `anotame-api/backend/catalog-service/Dockerfile` | Same as identity + ENTRYPOINT path from absolute to relative | VERIFIED | All 4 changes confirmed including removal of /app/ prefix. Committed in 4f935f2. |
| `anotame-api/backend/sales-service/Dockerfile` | dependency:resolve, -Xmx512m appended to 9-flag MAVEN_OPTS, ENTRYPOINT logging manager | VERIFIED | All changes confirmed. 9 --add-opens flags preserved. Committed in 7377382. |
| `anotame-api/backend/operations-service/Dockerfile` | Same as sales + ENTRYPOINT path from absolute to relative | VERIFIED | All changes confirmed. No /app/ prefix. Committed in 7377382. |
| `anotame-api/backend/identity-service/railway.toml` | builder=dockerfile, dockerfilePath=identity-service/Dockerfile, healthcheckPath, healthcheckTimeout | VERIFIED | File exists with exact expected content. Committed in 73b57c9. |
| `anotame-api/backend/catalog-service/railway.toml` | Same with dockerfilePath=catalog-service/Dockerfile | VERIFIED | File exists with exact expected content. Committed in 73b57c9. |
| `anotame-api/backend/sales-service/railway.toml` | Same with dockerfilePath=sales-service/Dockerfile | VERIFIED | File exists with exact expected content. Committed in 73b57c9. |
| `anotame-api/backend/operations-service/railway.toml` | Same with dockerfilePath=operations-service/Dockerfile | VERIFIED | File exists with exact expected content. Committed in 73b57c9. |
| `build_and_push.sh` | DELETED from git | VERIFIED | git ls-files returns 0. Not present on disk. |
| `anotame-db/` | DELETED from git | VERIFIED | git ls-files returns 0. Not present on disk. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| identity-service/Dockerfile | Railway build runner | `dependency:resolve dependency:resolve-plugins` (no go-offline) | VERIFIED | Pattern found at line 17 of identity-service/Dockerfile |
| sales-service/Dockerfile | Railway build runner | MAVEN_OPTS with -Xmx512m | VERIFIED | Pattern found at line 4 of sales-service/Dockerfile, within 9-flag MAVEN_OPTS string |
| identity-service/railway.toml | Railway dashboard service | `builder = "dockerfile"` | VERIFIED | Found at line 2 of identity-service/railway.toml |
| railway.toml dockerfilePath | identity-service/Dockerfile | `dockerfilePath = "identity-service/Dockerfile"` relative to anotame-api/backend | VERIFIED | Confirmed in all 4 railway.toml files with correct per-service paths |

---

## Data-Flow Trace (Level 4)

Not applicable. This phase produces only Dockerfile and TOML configuration files — no dynamic data rendering components. Step 7b (behavioral spot-checks) substitutes.

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| No go-offline in any Dockerfile | `grep -rn "go-offline" anotame-api/backend/*/Dockerfile` | No output, exit 1 | PASS |
| All 4 Dockerfiles have Xmx512m | `grep -l "Xmx512m" anotame-api/backend/*/Dockerfile` | All 4 files listed | PASS |
| All 4 Dockerfiles have logging.manager | `grep -n "ENTRYPOINT" anotame-api/backend/*/Dockerfile` | All 4 have `-Djava.util.logging.manager=org.jboss.logmanager.LogManager` | PASS |
| No absolute /app/quarkus-run.jar path | `grep "/app/quarkus-run.jar" catalog-service/Dockerfile operations-service/Dockerfile` | No output, exit 1 | PASS |
| 9 --add-opens flags preserved in sales/operations | `grep -o "add-opens" sales-service/Dockerfile \| wc -l` | 9 | PASS |
| 9 --add-opens flags preserved in operations | `grep -o "add-opens" operations-service/Dockerfile \| wc -l` | 9 | PASS |
| All 4 railway.toml files exist | File reads succeed | All 4 files present with correct content | PASS |
| legacy files deleted from git | `git ls-files build_and_push.sh \| wc -l` and `git ls-files anotame-db/ \| wc -l` | Both 0 | PASS |
| Docker build succeeds for all 4 services | `docker build --no-cache -f {service}/Dockerfile .` from `anotame-api/backend/` | SKIPPED — Docker daemon not running in agent environment (noted in 20-01-SUMMARY) | SKIP |
| /q/health/ready returns HTTP 200 for all 4 deployed services | `curl -f https://anotame-{service}-service-production.up.railway.app/q/health/ready` | SKIPPED — Railway Hobby tier sleep causes 502 post-deploy; Railway dashboard health check is authoritative | SKIP |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| DOCKER-01 | 20-01-PLAN | All 4 Dockerfiles replace go-offline with dependency:resolve + dependency:resolve-plugins | SATISFIED | Verified directly in all 4 Dockerfiles. No go-offline anywhere. |
| DOCKER-02 | 20-01-PLAN | All 4 Dockerfiles add MAVEN_OPTS=-Xmx512m to build stage | SATISFIED | identity/catalog: standalone ENV. sales/operations: appended to existing 9-flag MAVEN_OPTS. |
| DOCKER-03 | 20-01-PLAN | All 4 Dockerfiles add -Djava.util.logging.manager=org.jboss.logmanager.LogManager to ENTRYPOINT | SATISFIED | All 4 ENTRYPOINT lines verified in codebase. |
| DOCKER-04 | 20-01-PLAN | catalog-service Dockerfile ENTRYPOINT path made consistent (relative quarkus-run.jar) | SATISFIED | /app/quarkus-run.jar absent from both catalog-service and operations-service Dockerfiles. |
| DEPLOY-01 | 20-02-PLAN | Each service has a railway.toml with dockerfile builder, dockerfilePath, healthcheckPath, healthcheckTimeout=300 | SATISFIED | All 4 railway.toml files verified. Note: REQUIREMENTS.md wording mentions "root directory" but this is a Railway dashboard setting, not a railway.toml field. The file-based portion is fully satisfied; dashboard Root Directory setting is covered by DEPLOY-02/03 human checkpoint. |
| DEPLOY-02 | 20-03-PLAN | Railway project has 4 dedicated PostgreSQL instances each linked to one app service | SATISFIED (attestation) | 20-03-SUMMARY documents identity-db, catalog-db, sales-db, operations-db created and linked. External infrastructure, not verifiable from repo. |
| DEPLOY-03 | 20-03-PLAN | Each service has QUARKUS_DATASOURCE_JDBC_URL using ${{service-db.PGHOST}} template variables | SATISFIED (attestation) | 20-03-SUMMARY documents each service's JDBC URL pattern using private network template variables. No hardcoded credentials. External infrastructure. |
| DEPLOY-04 | 20-02-PLAN | build_and_push.sh deleted | SATISFIED | git ls-files = 0. Not present on disk. Removed in commit 73b57c9. |
| DEPLOY-05 | 20-02-PLAN | anotame-db/ directory removed | SATISFIED | git ls-files = 0. Not present on disk. Removed in commit 73b57c9. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No anti-patterns detected | — | All Dockerfiles are production configuration files with no placeholder values, no TODO comments, no hardcoded credentials, no stub returns. |

---

## Human Verification Required

### 1. Railway Build Logs — No OOM Kill, No Augmentation Failure

**Test:** Log into railway.app, navigate to the `anotame` project, and open the deployment logs for each of the 4 services (identity, catalog, sales, operations). Review the build phase logs.

**Expected:** Maven build logs show "BUILD SUCCESS" with no "Killed" signal and no "Could not resolve ...quarkus-...-deployment" error. The `dependency:resolve dependency:resolve-plugins` step should complete without error.

**Why human:** Docker build was not executed locally (Docker daemon unavailable in agent environment per 20-01-SUMMARY.md). Railway build logs are in the Railway dashboard and cannot be fetched programmatically from this repository. The static Dockerfile checks confirm the correct patterns are present, but build execution can only be confirmed from Railway logs.

### 2. Health Endpoint Liveness — /q/health/ready Returns HTTP 200

**Test:** Wake each service (Railway Hobby tier sleeps idle services) then run:

```bash
curl -f https://anotame-identity-service-production.up.railway.app/q/health/ready
curl -f https://anotame-catalog-service-production.up.railway.app/q/health/ready
curl -f https://anotame-sales-service-production.up.railway.app/q/health/ready
curl -f https://anotame-operations-service-production.up.railway.app/q/health/ready
```

**Expected:** Each returns HTTP 200 with JSON body `{"status":"UP",...}`.

**Why human:** 20-03-SUMMARY reports Railway's deploy-time health check passed for all 4 services (Railway only marks a deploy "Success" after the health check passes). However, subsequent curl checks returned 502 due to Railway Hobby tier sleep. The authoritative health check already passed at deploy time — this test confirms services can be woken and are still healthy.

---

## Gaps Summary

No gaps blocking goal achievement were identified for the repository-verifiable portions of this phase. All 9 Dockerfile changes and all 4 railway.toml files are correct and committed. Legacy files are cleanly removed.

The 2 human verification items confirm Railway-side execution (build logs, live health checks). Per the 20-03-SUMMARY, Railway's own health check mechanism confirmed all 4 services healthy at deploy time. The human items are a belt-and-suspenders confirmation, not indicators of a suspected failure.

---

_Verified: 2026-04-17T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
