---
phase: 20
slug: dockerfile-fixes-railway-deployment
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-15
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell scripts + docker build + curl (no unit test framework — infrastructure phase) |
| **Config file** | none — validation is via CLI commands |
| **Quick run command** | `docker build --no-cache -f {service}/Dockerfile . 2>&1 | tail -20` |
| **Full suite command** | `bash .planning/phases/20-dockerfile-fixes-railway-deployment/verify-all.sh` |
| **Estimated runtime** | ~5–15 minutes per service docker build (varies by cache) |

---

## Sampling Rate

- **After every Dockerfile task commit:** Run `docker build --no-cache` for the affected service
- **After every plan wave:** Run full suite (all 4 services build + railway.toml lint)
- **Before `/gsd-verify-work`:** All Railway deploys must return HTTP 200 on `/q/health/ready`
- **Max feedback latency:** 900 seconds (Railway deploy timeout)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | DOCKER-01 | — | N/A | build | `docker build --no-cache -f identity-service/Dockerfile . \| grep -v "ERROR"` | ✅ | ⬜ pending |
| 20-01-02 | 01 | 1 | DOCKER-01 | — | N/A | build | `docker build --no-cache -f catalog-service/Dockerfile . \| grep -v "ERROR"` | ✅ | ⬜ pending |
| 20-01-03 | 01 | 1 | DOCKER-01 | — | N/A | build | `docker build --no-cache -f sales-service/Dockerfile . \| grep -v "ERROR"` | ✅ | ⬜ pending |
| 20-01-04 | 01 | 1 | DOCKER-01 | — | N/A | build | `docker build --no-cache -f operations-service/Dockerfile . \| grep -v "ERROR"` | ✅ | ⬜ pending |
| 20-01-05 | 01 | 1 | DOCKER-02 | — | N/A | grep | `grep -n "MAVEN_OPTS" identity-service/Dockerfile catalog-service/Dockerfile` | ✅ | ⬜ pending |
| 20-01-06 | 01 | 1 | DOCKER-02 | — | N/A | grep | `grep -n "MAVEN_OPTS" sales-service/Dockerfile operations-service/Dockerfile \| grep "Xmx512m"` | ✅ | ⬜ pending |
| 20-01-07 | 01 | 1 | DOCKER-03 | — | N/A | grep | `grep -n "ENTRYPOINT" catalog-service/Dockerfile operations-service/Dockerfile \| grep -v "/app/quarkus-run.jar"` | ✅ | ⬜ pending |
| 20-02-01 | 02 | 2 | DEPLOY-01 | — | N/A | file | `ls anotame-api/backend/{identity,catalog,sales,operations}-service/railway.toml` | ❌ W0 | ⬜ pending |
| 20-02-02 | 02 | 2 | DEPLOY-01 | — | N/A | grep | `grep -n "healthcheckPath" */railway.toml \| grep "/q/health/ready"` | ❌ W0 | ⬜ pending |
| 20-02-03 | 02 | 2 | DEPLOY-04 | — | N/A | git | `git ls-files build_and_push.sh \| wc -l` (expect 0) | ✅ | ⬜ pending |
| 20-02-04 | 02 | 2 | DEPLOY-05 | — | N/A | git | `git ls-files anotame-db/ \| wc -l` (expect 0) | ✅ | ⬜ pending |
| 20-03-01 | 03 | 3 | DEPLOY-02 | — | N/A | manual | Railway dashboard: 4 services created, 4 PostgreSQL instances attached | N/A | ⬜ pending |
| 20-03-02 | 03 | 3 | DEPLOY-03 | — | N/A | manual | `curl -f https://{service}.up.railway.app/q/health/ready` returns HTTP 200 | N/A | ⬜ pending |
| 20-03-03 | 03 | 3 | DEPLOY-03 | — | N/A | manual | Railway logs show Flyway/Hibernate startup without datasource errors | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `railway.toml` files for all 4 services — created during Wave 2

*Existing infrastructure (Dockerfiles) covers Wave 1 requirements. Wave 3 is manual-only (Railway dashboard).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Railway project creation + 4 services provisioned | DEPLOY-02 | Railway dashboard has no CLI create-project in free tier | Log in to railway.app, create project, add 4 services |
| PostgreSQL plugin attached to each service | DEPLOY-02/03 | Railway PostgreSQL provisioning is dashboard-only | Add PostgreSQL plugin for each service in Railway dashboard |
| QUARKUS_DATASOURCE env vars set via template vars | DEPLOY-03 | Template variable wiring is Railway dashboard UI | Set QUARKUS_DATASOURCE_JDBC_URL = jdbc:postgresql://${{service-db.PGHOST}}:${{service-db.PGPORT}}/${{service-db.PGDATABASE}} |
| Deploy completes without OOM kill | DEPLOY-02 | Requires actual Railway deploy run | Trigger deploy, check Railway build logs for OOM/augmentation failure |
| /q/health/ready returns HTTP 200 | DEPLOY-03 | Requires live Railway service URL | curl -f https://{service}.up.railway.app/q/health/ready |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (Wave 1/2 tasks: automated docker build + grep; Wave 3: manual-only flagged)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (all Wave 1 + Wave 2 tasks have automated verify)
- [x] Wave 0 covers all MISSING references (no MISSING file references — all files exist)
- [x] No watch-mode flags
- [x] Feedback latency < 900s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-15
