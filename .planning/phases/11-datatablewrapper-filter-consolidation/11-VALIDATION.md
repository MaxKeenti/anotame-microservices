---
phase: 11
slug: datatablewrapper-filter-consolidation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual visual verification + build verification |
| **Config file** | None — no test framework configured |
| **Quick run command** | `bun run build` |
| **Full suite command** | `bun run build` + manual visual verification across 7 pages in light/dark modes |
| **Estimated runtime** | ~30 seconds (build) + visual inspection |

---

## Sampling Rate

- **After every task commit:** Run `bun run build` (catches TypeScript errors immediately)
- **After wave 1 (DataTableWrapper changes):** Full suite — `bun run build` + visual review of divider placement
- **After wave 2 (page updates):** Full suite — `bun run build` + visual review of all 7 pages for duplicate filters
- **Before `/gsd:verify-work`:** Build must pass with zero errors; all 7 pages visually verified in light and dark modes
- **Max feedback latency:** Build: ~20s; Visual: manual

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Manual Verification | Status |
|---------|------|------|-------------|-----------|-------------------|----------------------|--------|
| 11-01-01 | 01 | 1 | TABLE-02, TABLE-03 | build | `bun run build` | Divider visible on all 7 pages (light/dark) | ⬜ pending |
| 11-01-02 | 01 | 2 | TABLE-01, TABLE-02 | build + visual | `bun run build` | Customers page: single filter input visible, no duplication | ⬜ pending |
| 11-01-03 | 01 | 2 | TABLE-01, TABLE-02 | build + visual | `bun run build` | Orders page: single filter input visible, no duplication | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — Existing TypeScript/build setup is sufficient. No new test framework installation needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Divider renders between filter and table | TABLE-03 | Component rendering is visual; automated tests would require vitest setup (out of scope) | On each of 7 pages (Customers, Orders, Garments, Services, Price Lists, Users, Schedule), verify a subtle horizontal line appears above the table when filter is visible |
| No duplicate filter inputs | TABLE-01 | Visual inspection most reliable; requires navigating UI | Each page should show exactly one search/filter input. On Customers and Orders, verify the wrapper's input is hidden and the page's custom form is the only visible filter |
| Divider styling uses design token | TABLE-03 | Visual + CSS inspection | Inspect divider element in DevTools; verify `border-t border-border` classes are applied; divider color should match the design system border token (verify appears correct in both light and dark modes) |

---

## Validation Sign-Off

- [ ] All 3 tasks have `<automated>` verify (build command)
- [ ] Manual verifications documented for visual components
- [ ] Build passes `bun run build` zero errors after task 1
- [ ] All 7 pages manually verified (light mode) for duplicate filters and divider placement
- [ ] All 7 pages manually verified (dark mode) for duplicate filters and divider placement
- [ ] No watch-mode flags used
- [ ] Feedback latency: build ~20s, visual ~10min for full sweep
- [ ] `nyquist_compliant: true` set after all checks pass

**Approval:** pending

---

*Phase: 11-datatablewrapper-filter-consolidation*
*Validation strategy finalized: 2026-04-04*
