---
phase: 19
slug: application-configuration
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-15
audited: 2026-04-17
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (no Quarkus unit tests exist in this project) |
| **Config file** | none |
| **Quick run command** | `grep -rn "anotame-db" anotame-api/backend/*/src/main/resources/application.properties` (should return 0 matches) |
| **Full suite command** | `grep -rn "quarkus.http.port=[0-9]" anotame-api/backend/*/src/main/resources/application.properties` (should return 0 matches) |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick grep audit for that service's application.properties
- **After every plan wave:** Run full grep audit across all 4 services
- **Before `/gsd-verify-work`:** All 4 application.properties must pass both grep checks
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | CFG-01 | — | No hardcoded DB URL in identity-service | static | `grep "anotame-db" anotame-api/backend/identity-service/src/main/resources/application.properties` (0 matches) | ✅ | ✅ green |
| 19-01-02 | 01 | 1 | CFG-02 | — | PORT env var respected in identity-service | static | `grep "quarkus.http.port=\${PORT" anotame-api/backend/identity-service/src/main/resources/application.properties` (1 match) | ✅ | ✅ green |
| 19-01-03 | 01 | 1 | CFG-01 | — | %dev fallback present for identity-service | static | `grep "%dev.quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5431/identity" anotame-api/backend/identity-service/src/main/resources/application.properties` (1 match) | ✅ | ✅ green |
| 19-01-04 | 01 | 1 | CFG-01 | — | No hardcoded DB URL in catalog-service | static | `grep "anotame-db" anotame-api/backend/catalog-service/src/main/resources/application.properties` (0 matches) | ✅ | ✅ green |
| 19-01-05 | 01 | 1 | CFG-02 | — | PORT env var respected in catalog-service | static | `grep "quarkus.http.port=\${PORT" anotame-api/backend/catalog-service/src/main/resources/application.properties` (1 match) | ✅ | ✅ green |
| 19-01-06 | 01 | 1 | CFG-01 | — | No hardcoded DB URL in sales-service | static | `grep "anotame-db" anotame-api/backend/sales-service/src/main/resources/application.properties` (0 matches) | ✅ | ✅ green |
| 19-01-07 | 01 | 1 | CFG-02 | — | PORT env var respected in sales-service | static | `grep "quarkus.http.port=\${PORT" anotame-api/backend/sales-service/src/main/resources/application.properties` (1 match) | ✅ | ✅ green |
| 19-01-08 | 01 | 1 | CFG-01 | — | No hardcoded DB URL in operations-service | static | `grep "anotame-db" anotame-api/backend/operations-service/src/main/resources/application.properties` (0 matches) | ✅ | ✅ green |
| 19-01-09 | 01 | 1 | CFG-02 | — | PORT env var respected in operations-service | static | `grep "quarkus.http.port=\${PORT" anotame-api/backend/operations-service/src/main/resources/application.properties` (1 match) | ✅ | ✅ green |
| 19-01-10 | 01 | 1 | CFG-03 | — | No hardcoded plain-text credentials in any service | static | `grep -rn "^quarkus.datasource.password=[^$]" anotame-api/backend/*/src/main/resources/application.properties` (0 matches) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase requires no new test files — all verification is static grep audits of application.properties files.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Service connects to DB via QUARKUS_DATASOURCE_JDBC_URL env var | CFG-01 | No automated tests exist; requires a running DB instance | Start service with `QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://localhost:5431/identity QUARKUS_DATASOURCE_USERNAME=admin QUARKUS_DATASOURCE_PASSWORD=password mvn quarkus:dev`; confirm `/q/health/ready` returns HTTP 200 |
| Service binds to PORT env var | CFG-02 | Requires a running service process | Start service with `PORT=9999`; confirm `curl localhost:9999/q/health` responds |
| %dev profile fallback works without env var | CFG-01 | Requires Phase 21 DB containers to be running | After Phase 21: start service without QUARKUS_DATASOURCE_JDBC_URL; confirm Flyway migration runs and `/q/health/ready` responds |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-04-17 — all 10 static checks pass

---

## Validation Audit 2026-04-17

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 10 |
| Escalated | 0 |
