---
phase: 7
slug: operational-reliability-housekeeping
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (automated test suite deferred — TEST-01..04 are future requirements) |
| **Config file** | none |
| **Quick run command** | `grep -c "NEXT_PUBLIC_" .env.example` (HOUSE-01); `grep "x-user-name" anotame-api/backend/sales-service/src/main/resources/application.properties` (HOUSE-03) |
| **Full suite command** | `docker compose up --build -d && sleep 45 && docker ps --format '{{.Names}} {{.Status}}'` |
| **Estimated runtime** | ~60 seconds (docker build + startup) |

---

## Sampling Rate

- **After every task commit:** Run file-content check (grep/ls) for that task's output
- **After every plan wave:** Run docker compose smoke check for health endpoints
- **Before `/gsd:verify-work`:** All 4 services show `healthy` in `docker ps`; file assertions pass
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | OPS-02 | file check | `grep "quarkus-smallrye-health" anotame-api/backend/identity-service/pom.xml` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | OPS-02 | file check | `grep "quarkus-smallrye-health" anotame-api/backend/catalog-service/pom.xml` | ✅ | ⬜ pending |
| 07-01-03 | 01 | 1 | OPS-02 | file check | `grep "quarkus-smallrye-health" anotame-api/backend/sales-service/pom.xml` | ✅ | ⬜ pending |
| 07-01-04 | 01 | 1 | OPS-02 | file check | `grep "quarkus-smallrye-health" anotame-api/backend/operations-service/pom.xml` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 2 | OPS-01 | file check | `grep -c "q/health/ready" docker-compose.yml` should return ≥4 | ✅ | ⬜ pending |
| 07-02-02 | 02 | 2 | OPS-01 | smoke | `docker compose up --build -d && sleep 45 && docker ps --format '{{.Names}} {{.Status}}' \| grep healthy` | N/A | ⬜ pending |
| 07-03-01 | 03 | 3 | HOUSE-01 | file check | `grep -c "NEXT_PUBLIC_" .env.example` should return 0 | ✅ | ⬜ pending |
| 07-03-02 | 03 | 3 | HOUSE-02 | file check | `ls anotame-web-legacy/node_modules 2>&1 \| grep "No such file"` | N/A | ⬜ pending |
| 07-03-03 | 03 | 3 | HOUSE-03 | file check | `grep "x-user-name" anotame-api/backend/sales-service/src/main/resources/application.properties` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test files need creation. Validation is via runtime smoke checks and file-content assertions. Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/q/health/ready` returns HTTP 200 on all 4 services | OPS-02 | Requires running Docker Compose stack with DB | `docker compose up --build -d && sleep 45 && curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/q/health/ready` (repeat for 8082, 8083, 8084) |
| `docker ps` shows all 4 backend containers as `(healthy)` | OPS-01 | Requires running Docker Compose stack | `docker ps --format '{{.Names}} {{.Status}}'` — look for `(healthy)` on all 4 backend containers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
