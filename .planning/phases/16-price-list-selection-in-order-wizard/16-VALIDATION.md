---
phase: 16
slug: price-list-selection-in-order-wizard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend) / Maven Surefire (backend) |
| **Config file** | `anotame-web/vite.config.ts` / `anotame-api/backend/sales-service/pom.xml` |
| **Quick run command** | `cd anotame-web && npm run test:run` |
| **Full suite command** | `cd anotame-web && npm run test:run && cd ../anotame-api/backend/sales-service && ./mvnw test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd anotame-web && npm run test:run`
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | REQ-backend | — | priceListId nullable, stored as-is | unit | `cd anotame-api/backend/sales-service && ./mvnw test` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | REQ-backend | — | Flyway migration additive/nullable | integration | `cd anotame-api/backend/sales-service && ./mvnw test` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 2 | REQ-frontend | — | Price list state in wizard draft | unit | `cd anotame-web && npm run test:run` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 2 | REQ-frontend | — | Auto-fill unitPrice from priceListItems | unit | `cd anotame-web && npm run test:run` | ❌ W0 | ⬜ pending |
| 16-02-03 | 02 | 3 | REQ-frontend | — | Edit wizard shows read-only price list | e2e | Manual | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `anotame-api/backend/sales-service/src/test/java/com/anotame/sales/application/service/SalesServiceTest.java` — stubs for priceListId persistence
- [ ] `anotame-web/src/lib/services/orders/__tests__/OrderWizardState.test.ts` — stubs for price list selection state
- [ ] `anotame-web/src/lib/components/orders/wizard/__tests__/PriceListStep.test.ts` — stubs for PriceListStep component

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Edit wizard shows read-only price list name | D-07, D-08 | Requires live order with priceListId + catalog-service running | Create order with price list; open edit; verify list name displayed as read-only |
| Auto-fill appears when adding items after selecting price list | D-03 | Multi-step wizard flow requires browser interaction | Select price list; add item; verify unitPrice pre-filled from list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
