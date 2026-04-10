---
phase: 15
slug: order-lifecycle-improvements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — no Jest, Vitest, or pytest config found |
| **Config file** | none — build gate only |
| **Quick run command** | `bun run build && bun run check` (frontend); `mvn quarkus:build -pl sales-service` (backend) |
| **Full suite command** | `bun run build && bun run check` + `mvn quarkus:build -f anotame-api/backend/sales-service/pom.xml` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run build && bun run check` (frontend tasks) or `mvn quarkus:build -pl sales-service` (backend tasks)
- **After every plan wave:** Run full build: both frontend and backend
- **Before `/gsd-verify-work`:** Both build commands green + manual walkthrough of ORDER-01 and ORDER-02
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | ORDER-01 | — / — | N/A | build | `mvn quarkus:build -f anotame-api/backend/sales-service/pom.xml` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | ORDER-01 | T-15-01 | `@RolesAllowed("ADMIN")` on admin-only endpoints | build | `mvn quarkus:build -f anotame-api/backend/sales-service/pom.xml` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | ORDER-01 | T-15-02 | Status lock returns 409 for DELIVERED/CANCELLED | manual | — | N/A | ⬜ pending |
| 15-01-04 | 01 | 1 | ORDER-02 | T-15-03 | `MessageDigest.isEqual()` for constant-time pickup code comparison | build | `mvn quarkus:build -f anotame-api/backend/sales-service/pom.xml` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 2 | ORDER-01 | — / — | N/A | build | `bun run build && bun run check` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 2 | ORDER-01 | T-15-01 | EMPLOYEE role cannot access admin-only fields | manual | — | N/A | ⬜ pending |
| 15-03-01 | 03 | 3 | ORDER-02 | — / — | N/A | build | `bun run build && bun run check` | ❌ W0 | ⬜ pending |
| 15-03-02 | 03 | 3 | ORDER-02 | — / — | N/A | manual | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test infrastructure to create. Project has no automated test suite — build gates serve as the validation layer.

*Existing build infrastructure covers all phase requirements that can be automated.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Edit order page renders with wizard pre-populated | ORDER-01 | No frontend test infra | Navigate to `/orders/[id]/edit`, verify all wizard fields populated with existing order data |
| EMPLOYEE role cannot change garment/customer fields | ORDER-01 | No RBAC test infra | Log in as EMPLOYEE, open edit page, verify customer field hidden/readonly |
| Status lock: DELIVERED/CANCELLED shows read-only | ORDER-01 | No e2e infra | Open DELIVERED order, verify edit button hidden; try PUT via API, verify 409 |
| Pickup code: 6-digit code generated at order creation | ORDER-02 | No test infra | Create new order, verify `pickup_code` field present on response and order detail page |
| Delivery confirmation: wrong code rejected | ORDER-02 | No test infra | In operations page, attempt delivery with wrong code, verify rejection |
| Bulk selection mode renders checkbox column | ORDER-02 | No e2e infra | Click "Seleccionar" button, verify checkbox column appears; check row, verify floating action bar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
