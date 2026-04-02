---
phase: 4
slug: exception-handling-standardization
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — no `quarkus-junit5` or `rest-assured` in any service pom.xml (deferred to TEST-02 per REQUIREMENTS.md) |
| **Config file** | none |
| **Quick run command** | `mvn compile -pl anotame-api/backend/identity-service -q` |
| **Full suite command** | `mvn compile -pl anotame-api/backend --also-make -q && bun run build --cwd anotame-web` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mvn compile -pl anotame-api/backend/{service} -q`
- **After every plan wave:** Run full suite command above
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 04-01 | 1 | QUAL-01 | compile | `mvn compile -pl anotame-api/backend/identity-service -q` | ❌ (new files) | ⬜ pending |
| 4-01-02 | 04-01 | 1 | QUAL-01 | compile | `mvn compile -pl anotame-api/backend/identity-service -q` | ❌ (new file) | ⬜ pending |
| 4-01-03 | 04-01 | 1 | QUAL-01 | compile | `mvn compile -pl anotame-api/backend --also-make -q` | ❌ (new files) | ⬜ pending |
| 4-01-04 | 04-01 | 1 | QUAL-01 | compile | `mvn compile -pl anotame-api/backend/sales-service -q` | ✅ (existing file) | ⬜ pending |
| 4-01-05 | 04-01 | 1 | QUAL-01 | compile + build | `bun run build --cwd anotame-web` | ✅ (existing file) | ⬜ pending |
| 4-02-01 | 04-02 | 2 | QUAL-02 | compile | `mvn compile -pl anotame-api/backend/identity-service -q` | ❌ (new files) | ⬜ pending |
| 4-02-02 | 04-02 | 2 | QUAL-02 | compile | `mvn compile -pl anotame-api/backend/identity-service -q` | ✅ (existing file) | ⬜ pending |
| 4-02-03 | 04-02 | 2 | QUAL-02 | compile | `mvn compile -pl anotame-api/backend/identity-service -q` | ✅ (existing file) | ⬜ pending |
| 4-03-01 | 04-03 | 1 | QUAL-03 | config | manual — `docker compose up identity-service` then check logs | ✅ (existing file) | ⬜ pending |
| 4-03-02 | 04-03 | 1 | QUAL-03 | config | manual | ✅ (existing file) | ⬜ pending |
| 4-03-03 | 04-03 | 1 | QUAL-03 | config | manual | ✅ (existing file) | ⬜ pending |
| 4-03-04 | 04-03 | 1 | QUAL-03 | config | manual | ✅ (existing file) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No Wave 0 test infrastructure additions required. No `quarkus-junit5` or `rest-assured` dependency installations in scope — automated integration tests are deferred to TEST-02 per REQUIREMENTS.md.

The compile commands above provide fast feedback that Java changes are syntactically and type-correctly valid. End-to-end behavior is verified via manual smoke tests (see Manual-Only Verifications below).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login with wrong password returns HTTP 401 with `{ "message": "...", "details": [] }` | QUAL-01, QUAL-02 | No integration test framework installed | `curl -X POST http://localhost:8083/auth/login -H 'Content-Type: application/json' -d '{"username":"x","password":"wrong"}' -v` — expect 401, body contains `message` key |
| Duplicate username registration returns HTTP 409 | QUAL-01, QUAL-02 | No integration test framework installed | `curl -X POST http://localhost:8083/auth/register -H 'Content-Type: application/json' -d '{"username":"existing","password":"pass"}' -v` — expect 409, body contains `message` key |
| SQL queries absent in production-mode logs | QUAL-03 | Config-only change, no testable endpoint | `docker compose up` with `QUARKUS_PROFILE=prod` (or default prod profile) — `docker logs <container>` must not contain `Hibernate: select` lines |
| SQL queries appear in dev-mode logs | QUAL-03 | Confirms `%dev.` prefix works | `./mvnw quarkus:dev` in any service — logs should contain `Hibernate: select` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` compile verify or manual smoke test instructions
- [x] Sampling continuity: every task has a compile or manual verify step
- [x] Wave 0 covers all MISSING references (no new test infrastructure required)
- [x] No watch-mode flags
- [x] Feedback latency < 30s for compile checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-01
