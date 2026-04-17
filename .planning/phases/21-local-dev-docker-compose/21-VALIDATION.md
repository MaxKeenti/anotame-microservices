---
phase: 21
slug: local-dev-docker-compose
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell / docker CLI verification commands |
| **Config file** | none |
| **Quick run command** | `docker compose config --quiet` |
| **Full suite command** | `docker compose up --no-start && docker compose ps` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `docker compose config --quiet`
- **After every plan wave:** Run `docker compose config && docker ps -a`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | DEV-01 | — | N/A | config check | `docker compose config \| grep -E 'identity-db\|catalog-db\|sales-db\|operations-db'` | ✅ | ⬜ pending |
| 21-01-02 | 01 | 1 | DEV-01 | — | N/A | config check | `docker compose config \| grep -E '5431\|5432\|5433\|5434'` | ✅ | ⬜ pending |
| 21-01-03 | 01 | 1 | DEV-01 | — | N/A | config check | `docker compose config \| grep -v 'anotame-db'` | ✅ | ⬜ pending |
| 21-01-04 | 01 | 1 | DEV-03 | — | N/A | file check | `test ! -f docker-compose.yml || grep -v 'init.sql' docker-compose.yml` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing docker CLI infrastructure covers all phase requirements.

*No new test infrastructure required — verification is via docker compose config validation and file inspection.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Flyway creates schema on first boot | DEV-02 | Requires running `quarkus:dev` against a live container | Start container: `docker compose up identity-db -d`; run `./mvnw quarkus:dev` in identity-service; check logs for "Flyway migration successful" |
| No two services share the same DB | DEV-02/03 | Verified by reading application.properties | Confirm each service `%dev.quarkus.datasource.jdbc.url` has unique port + DB name |
| `docker compose up` starts all 4 DBs cleanly | DEV-01 | Requires actual Docker runtime | Run `docker compose up`; verify 4 containers running on ports 5431–5434 via `docker ps` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
