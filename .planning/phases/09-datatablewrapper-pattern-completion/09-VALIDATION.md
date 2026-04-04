---
phase: 9
slug: datatablewrapper-pattern-completion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vite + SvelteKit build (no unit test framework yet — TEST-03 deferred) |
| **Config file** | `anotame-web/vite.config.ts` |
| **Quick run command** | `cd anotame-web && bun run build` |
| **Full suite command** | `cd anotame-web && bun run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd anotame-web && bun run build`
- **After every plan wave:** Run `cd anotame-web && bun run build`
- **Before `/gsd-verify-work`:** Build must exit 0
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | FE-01 | build + grep | `grep -c "DataTableWrapper" garments/+page.svelte` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | FE-04 | build + grep | `grep -c "DataTableWrapper" users/+page.svelte` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 2 | FE-02 | build + grep | `grep -c "DataTableWrapper" services/+page.svelte` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 2 | FE-03 | build + grep | `grep -c "DataTableWrapper" pricelists/+page.svelte` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No additional test framework setup needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sorting works on all sortable columns | FE-01 to FE-04 | No E2E test framework | Click column headers, verify arrow indicators change and data reorders |
| Pagination controls appear for >20 rows | FE-01 to FE-04 | Requires live data | Create >20 entries, verify pagination buttons appear |
| Action buttons trigger correct dialogs | FE-01 to FE-04 | No E2E test framework | Click Edit → verify dialog opens with correct data; Click Delete → verify confirm dialog |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
