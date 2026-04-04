# Requirements: Milestone v1.2 — UI Standardization

## Design Foundation (DESIGN)

- [ ] **DESIGN-01**: User sees a consistent design language across all pages after applying the shadcn preset (`b4akO6QUQs`)
- [ ] **DESIGN-02**: User sees updated color tokens, border radii, and spacing from the preset applied globally without breaking existing components

## Data Table UX (TABLE)

- [ ] **TABLE-01**: User sees exactly one set of filters per data table page — no duplicate filter bars
- [ ] **TABLE-02**: User can pass page-specific filter configurations to DataTableWrapper via props
- [ ] **TABLE-03**: User sees visual separation (divider or spacing) between the filter area and the data table content

## Forms & Dialogs (FORM)

- [ ] **FORM-01**: User interacts with forms that use shadcn/ui form components consistently (inputs, selects, checkboxes)
- [ ] **FORM-02**: User interacts with dialogs that follow the shadcn/ui dialog pattern consistently (all CRUD dialogs)

## Accessibility & Color (A11Y)

- [ ] **A11Y-01**: User can read all text at WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) in both light and dark modes
- [ ] **A11Y-02**: User sees a unified color palette with no ad-hoc color values drifting from the design system tokens

## Tenant Theming (THEME)

- [ ] **THEME-01**: Tenant administrator can configure a primary brand color and font family for their organization
- [ ] **THEME-02**: User sees the tenant's configured brand color and font applied across the app via CSS variable overrides
- [ ] **THEME-03**: User sees the default Anotame theme when no tenant-specific customization is set

---

## Future Requirements

- Deployment refactor — Railway Dockerfile deploys (v1.3)
- Deployment implementation — eliminate GitHub Packages dependency (v1.3)
- Automated test suite — @QuarkusTest + Vitest (deferred from v1.0)
- Server-side auth validation in hooks.server.ts (deferred from v1.0)
- +error.svelte pages with retry/graceful degradation (deferred from v1.0)
- KPI intelligence improvements (needs dedicated design phase)

## Out of Scope

- Full component library rebuild — standardizing existing components, not rewriting from scratch
- Multi-tenancy at the DB level — theming is CSS-only via operations-service settings, no schema changes
- i18n / Paraglide rollout — all strings remain hardcoded Spanish

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| DESIGN-01 | — | — | Pending |
| DESIGN-02 | — | — | Pending |
| TABLE-01 | — | — | Pending |
| TABLE-02 | — | — | Pending |
| TABLE-03 | — | — | Pending |
| FORM-01 | — | — | Pending |
| FORM-02 | — | — | Pending |
| A11Y-01 | — | — | Pending |
| A11Y-02 | — | — | Pending |
| THEME-01 | — | — | Pending |
| THEME-02 | — | — | Pending |
| THEME-03 | — | — | Pending |
