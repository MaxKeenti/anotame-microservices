# Roadmap: Anotame

## Milestones

- ✅ **v1.0 Code Quality & Security** — Phases 1–7 (shipped 2026-04-03) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Production Stability** — Phases 8–9 (shipped 2026-04-03) — [archive](.planning/milestones/v1.1-ROADMAP.md)
- 🚧 **v1.2 UI Standardization** — Phases 10–14 (in progress)
- 📋 **v1.3 Deployment Refactor** — Phases TBD (planned)

## Phases

<details>
<summary>✅ v1.0 Code Quality & Security (Phases 1–7) — SHIPPED 2026-04-03</summary>

- [x] Phase 1: Close UI Color Standardization (1/1 plans) — completed 2026-04-01
- [x] Phase 2: Security Foundations (4/4 plans) — completed 2026-04-01
- [x] Phase 3: Data Integrity Fixes (3/3 plans) — completed 2026-04-01
- [x] Phase 4: Exception Handling Standardization (3/3 plans) — completed 2026-04-02
- [x] Phase 5: Frontend Pattern Compliance (3/3 plans) — completed 2026-04-02
- [x] Phase 6: Database Migration Framework (4/4 plans) — completed 2026-04-02
- [x] Phase 7: Operational Reliability & Housekeeping (3/3 plans) — completed 2026-04-03

Full phase details: [.planning/milestones/v1.0-ROADMAP.md](.planning/milestones/v1.0-ROADMAP.md)

</details>
<details>
<summary>✅ v1.1 Production Stability (Phases 8–9) — SHIPPED 2026-04-03</summary>

- [x] Phase 8: Production Bug Fixes (2/2 plans) — completed 2026-04-03
- [x] Phase 9: DataTableWrapper Pattern Completion (2/2 plans) — completed 2026-04-03

Full phase details: [.planning/milestones/v1.1-ROADMAP.md](.planning/milestones/v1.1-ROADMAP.md)

</details>

### v1.2 UI Standardization (Phases 10–14)

- [x] Phase 10: shadcn Preset Init & Design Token Refresh (2/2 plans) — completed 2026-04-04
- [x] Phase 11: DataTableWrapper Filter Consolidation (1/1 plans) — completed 2026-04-04
- [x] Phase 12: Forms & Dialogs Standardization Audit (3/3 plans) — completed 2026-04-05
- [x] Phase 13: Color Audit & WCAG Compliance — completed 2026-04-05 — [Summary](.planning/phases/13-color-audit-wcag-compliance/13-SUMMARY.md)
- [x] Phase 14: Tenant Theming (3/3 waves) — completed 2026-04-06 — [Summary](.planning/phases/14-tenant-theming/14-SUMMARY.md)

## Milestone v1.3: Advanced Operations (Planned)

- [ ] Phase 15: Order Lifecycle Improvements (Edit Order, Bulk Actions)
- [ ] Phase 16: Multi-branch Dashboard Features
- [ ] Phase 17: External Print Server Integration

## Phase Details

### Phase 08: Production Bug Fixes
**Goal**: All three production bugs fixed — KPI dashboard loads, customers page renders, delete operations show meaningful errors.
**Status**: ✅ COMPLETED 2026-04-03
**Note**: "Edit Order" feature was identified as missing (blocked) in UAT and has been moved to Milestone v1.3 (Phase 15).

---

### Phase 12: Forms & Dialogs Standardization Audit
**Goal**: Verify and fix all forms and dialogs to follow consistent shadcn/ui + superforms patterns.
**Depends on**: Phase 10
**Requirements**: FORM-01, FORM-02
**Status**: ✅ COMPLETED 2026-04-05

**Success criteria:**
1. ✅ All create/edit dialogs use the shadcn Dialog component with consistent header, body, and footer layout
2. ✅ All form inputs use shadcn/ui Input, Select, and Checkbox components — no raw HTML inputs remain
3. ✅ All forms use sveltekit-superforms for validation and submission — no raw onsubmit handlers
4. ✅ Loading and error states are consistent across all dialogs (spinner on submit, toast on error)

**Summary**: [12-01-SUMMARY.md](.planning/phases/12-forms-dialogs-standardization-audit/12-01-SUMMARY.md), [12-02-SUMMARY.md](.planning/phases/12-forms-dialogs-standardization-audit/12-02-SUMMARY.md), [12-03-SUMMARY.md](.planning/phases/12-forms-dialogs-standardization-audit/12-03-SUMMARY.md)

---

### Phase 13: Color Audit & WCAG Compliance
**Goal**: Identify and fix all color drift and accessibility violations across both themes.
**Depends on**: Phase 10, Phase 12
**Requirements**: A11Y-01, A11Y-02

**Success criteria:**
1. Every text element meets WCAG AA contrast ratio (4.5:1 normal, 3:1 large) in both light and dark modes
2. No ad-hoc color values (raw hex/rgb/oklch) exist outside the design system CSS variables
3. All status badges, alerts, and semantic colors use the design token system (--warning, --success, --destructive, --info)
4. Browser accessibility audit (Lighthouse or axe) reports zero contrast violations

---

### Phase 14: Tenant Theming
**Goal**: Enable per-tenant visual customization via CSS variable overrides stored in operations-service.
**Depends on**: Phase 13
**Requirements**: THEME-01, THEME-02, THEME-03
**Plans**: 3 plans

**Success criteria:**
1. Tenant admin can set a primary brand color and font family in the establishment settings UI
2. The configured color and font are stored in operations-service (establishment settings) and retrieved on app load
3. CSS variables (--primary, --font-sans) are dynamically overridden at the :root level using the tenant's configuration
4. When no tenant customization exists, the default Anotame theme (from shadcn preset) applies without visual artifacts

Plans:
- [x] 14-01-PLAN.md — Backend: Database schema & Operations-service API
- [x] 14-02-PLAN.md — Frontend: Tenant theme store & CSS variable injection
- [x] 14-03-PLAN.md — Frontend: Admin UI with color picker & font dropdown


## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Close UI Color Standardization | v1.0 | 1/1 | Complete | 2026-04-01 |
| 2. Security Foundations | v1.0 | 4/4 | Complete | 2026-04-01 |
| 3. Data Integrity Fixes | v1.0 | 3/3 | Complete | 2026-04-01 |
| 4. Exception Handling Standardization | v1.0 | 3/3 | Complete | 2026-04-02 |
| 5. Frontend Pattern Compliance | v1.0 | 3/3 | Complete | 2026-04-02 |
| 6. Database Migration Framework | v1.0 | 4/4 | Complete | 2026-04-02 |
| 7. Operational Reliability & Housekeeping | v1.0 | 3/3 | Complete | 2026-04-03 |
| 8. Production Bug Fixes | v1.1 | 2/2 | Complete | 2026-04-03 |
| 9. DataTableWrapper Pattern Completion | v1.1 | 2/2 | Complete | 2026-04-03 |
| 10. shadcn Preset Init & Design Token Refresh | v1.2 | 2/2 | Complete    | 2026-04-04 |
| 11. DataTableWrapper Filter Consolidation | v1.2 | — | Complete    | 2026-04-04 |
| 12. Forms & Dialogs Standardization Audit | v1.2 | 0/3 | Pending | — |
| 13. Color Audit & WCAG Compliance | v1.2 | — | Complete    | 2026-04-05 |
| 14. Tenant Theming | v1.2 | 3/3 | Complete   | 2026-04-06 |
