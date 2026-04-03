---
phase: 5
slug: frontend-pattern-compliance
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed — no vitest or jest in anotame-web (deferred to TEST-03/TEST-04 per REQUIREMENTS.md) |
| **Config file** | none |
| **Quick run command** | `bun run build --cwd anotame-web` (TypeScript + Svelte compiler check) |
| **Full suite command** | `bun run build --cwd anotame-web` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** `cd anotame-web && bun run build`
- **After every plan wave:** Full build must exit 0
- **Before `/gsd:verify-work`:** Full build must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 05-01 | 1 | QUAL-04 | build | `cd anotame-web && bun run build` | ❌ (new file) | ⬜ pending |
| 5-01-02 | 05-01 | 1 | QUAL-04 | build | `cd anotame-web && bun run build` | ✅ (existing file) | ⬜ pending |
| 5-01-03 | 05-01 | 1 | QUAL-04 | build | `cd anotame-web && bun run build` | ✅ (existing file) | ⬜ pending |
| 5-02-01 | 05-02 | 1 | QUAL-05 | build | `cd anotame-web && bun run build` | ✅ (existing file) | ⬜ pending |
| 5-03-01 | 05-03 | 1 | QUAL-05 | build | `cd anotame-web && bun run build` | ✅ (existing file) | ⬜ pending |
| 5-03-02 | 05-03 | 1 | QUAL-05 | build | `cd anotame-web && bun run build` | ✅ (existing file) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No Wave 0 test infrastructure additions required. No unit test framework installation in scope — automated component testing is deferred to TEST-03/TEST-04 per REQUIREMENTS.md.

The `bun run build` command provides compile-time feedback via the Svelte + TypeScript compiler: missing imports, type errors, A11y violations (strict mode), and reactive pattern errors all surface as build failures.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DataTableWrapper renders rows from real API data on orders page | QUAL-04 | Requires running dev server + backend | `bun run dev`, navigate to /dashboard/orders, confirm table renders orders with sort arrows on column headers |
| DataTableWrapper renders rows on customers page | QUAL-04 | Requires running dev server + backend | Navigate to /dashboard/customers, confirm table renders, click column header to sort |
| Payment step form fields persist draft state after superforms migration | QUAL-05 | Requires wizard walkthrough | Start new order, fill payment step, navigate away and back — draft values must be restored |
| Admin settings form submits correctly after superforms migration | QUAL-05 | Requires running backend | Navigate to /admin/settings, update a field, submit — API call must succeed |
| Schedule holiday form adds holiday after superforms migration | QUAL-05 | Requires running backend | Navigate to /admin/schedule, add a holiday — it must appear in the list |
| User-facing /dashboard/settings page (theme/palette) untouched | Phase 1 regression | Check for accidental modification | Navigate to /dashboard/settings — color palette customization must still work exactly as before Phase 5 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` build verify
- [x] Sampling continuity: every task has `bun run build` as verify step
- [x] Wave 0 covers all MISSING references (no new test infrastructure required)
- [x] No watch-mode flags
- [x] Feedback latency < 15s for build checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-01
