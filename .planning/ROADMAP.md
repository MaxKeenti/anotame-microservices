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

- [x] Phase 10: shadcn Preset Init & Design Token Refresh (2/2 plans) — completed 2026-04-05
- [ ] Phase 11: DataTableWrapper Filter Consolidation
- [ ] Phase 12: Forms & Dialogs Standardization Audit
- [ ] Phase 13: Color Audit & WCAG Compliance
- [ ] Phase 14: Tenant Theming

## Phase Details

### Phase 10: shadcn Preset Init & Design Token Refresh
**Goal**: Apply the shadcn-svelte preset to establish the design foundation for all subsequent UI work.
**Depends on**: None (foundation phase)
**Requirements**: DESIGN-01, DESIGN-02

**Success criteria:**
1. `bun x shadcn-svelte init --preset b4akO6QUQs` runs without errors and updates design tokens
2. All existing pages render correctly with the new tokens — no visual regressions in navigation, tables, forms, or dialogs
3. Light and dark mode switching works correctly after preset application
4. `bun run build` passes with zero errors

---

### Phase 11: DataTableWrapper Filter Consolidation
**Goal**: Eliminate duplicate filter UIs across data table pages by making DataTableWrapper's filter configurable.
**Depends on**: Phase 10
**Requirements**: TABLE-01, TABLE-02, TABLE-03

**Success criteria:**
1. DataTableWrapper accepts an optional `showFilter` prop (default: true) to hide its built-in search bar when the page provides its own
2. Pages with custom filters (orders, customers) pass `showFilter={false}` and use their own filter UI above the wrapper
3. A visible divider or spacing separates the filter area from the table content on all 6 data table pages
4. No page shows duplicate search/filter inputs

---

### Phase 12: Forms & Dialogs Standardization Audit
**Goal**: Verify and fix all forms and dialogs to follow consistent shadcn/ui + superforms patterns.
**Depends on**: Phase 10
**Requirements**: FORM-01, FORM-02

**Success criteria:**
1. All create/edit dialogs use the shadcn Dialog component with consistent header, body, and footer layout
2. All form inputs use shadcn/ui Input, Select, and Checkbox components — no raw HTML inputs remain
3. All forms use sveltekit-superforms for validation and submission — no raw onsubmit handlers
4. Loading and error states are consistent across all dialogs (spinner on submit, toast on error)

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

**Success criteria:**
1. Tenant admin can set a primary brand color and font family in the establishment settings UI
2. The configured color and font are stored in operations-service (establishment settings) and retrieved on app load
3. CSS variables (--primary, --font-sans) are dynamically overridden at the :root level using the tenant's configuration
4. When no tenant customization exists, the default Anotame theme (from shadcn preset) applies without visual artifacts

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
| 10. shadcn Preset Init & Design Token Refresh | v1.2 | 2/2 | Complete   | 2026-04-04 |
| 11. DataTableWrapper Filter Consolidation | v1.2 | — | Pending | — |
| 12. Forms & Dialogs Standardization Audit | v1.2 | — | Pending | — |
| 13. Color Audit & WCAG Compliance | v1.2 | — | Pending | — |
| 14. Tenant Theming | v1.2 | — | Pending | — |
