# Phase 13: Color Audit & WCAG Compliance - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Identify and fix all color drift and accessibility (ARIA/Keyboard) violations across the `anotame-web` application, targeting WCAG 2.1 Level AA compliance.

In scope:
- Color contrast audit for light and dark themes (OKLCH tokens).
- Keyboard navigation (Tab index, Focus visibility) across all 20+ views.
- Consistency of ARIA labels and roles (Screen reader checks).
- Consolidation of status colors into CSS variables.

Out of scope:
- Layout changes or major UI redesigns.
- Level AAA compliance.

</domain>

<decisions>
## Implementation Decisions

### Compliance Target
- **D-01:** Target **WCAG 2.1 Level AA** for all UI elements. This requires a 4.5:1 contrast ratio for normal text and 3:1 for large text/icons.

### Audit Methodology
- **D-02:** Use a hybrid approach: **Automated tools** (Lighthouse / axe-core) for quick color/markup violations, followed by **Manual "Tab" navigation** for complex flows (Order Wizard, Tables, Pricelists).

### Color Consolidation
- **D-03:** Move all hardcoded status colors (e.g., from `statusUtils.ts`) to **CSS variables** in `layout.css` using the project's OKLCH theme (e.g., `--color-status-success`, `--color-status-warning`).
- **D-04:** **Delete `statusUtils.ts`** and related hardcoded color logic once CSS variables are implemented.

### Keyboard & Focus
- **D-05:** Standardize all interactive element focus states to use the global **shadcn `--ring` token**. Ensure focus rings are visible and meet the 3:1 contrast requirement against backgrounds.
- **D-06:** Audit custom interactive elements (like pircelist checkboxes) to ensure they receive focus and react to Space/Enter keys.

### the agent's Discretion
- Choice of specific OKLCH values for `--color-status-*` variables (as long as they pass AA contrast).
- Exact order of page audits (recommending starting with high-traffic pages like Dashboard and Orders).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Assets to Modify
- `anotame-web/src/routes/layout.css` — Central location for CSS variable overrides and OKLCH tokens.
- `anotame-web/src/lib/utils/statusUtils.ts` — CURRENT DEBT: contains hardcoded color classes to be removed.
- `anotame-web/src/lib/components/ui/` — Common components (Button, Input, etc.) to check for ARIA/focus consistency.

### Requirements & Prior Context
- `.planning/REQUIREMENTS.md` — REQ-08 (Accessibility and Contrast standards).
- `.planning/phases/10-shadcn-preset-init-design-token-refresh/10-CONTEXT.md` — Phase 10 OKLCH established tokens.
- `.planning/phases/12-forms-dialogs-standardization-audit/12-CONTEXT.md` — Phase 12 ARIA wiring via superforms.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `STATUS_COLORS` in `statusUtils.ts` — Reference for existing status logic.
- `--ring` CSS variable in `layout.css` — Global focus style to be applied to all interactive elements.

### Established Patterns
- **OKLCH Colors:** All brand and UI colors use the `oklch()` format, ensuring perceptually uniform brightness and easier contrast management.
- **shadcn Focus:** Most components already follow the `focus-visible:ring-2 focus-visible:ring-ring` pattern.

</code_context>

<deferred>
## Deferred Ideas

- **Level AAA Compliance:** Not required for this milestone.
- **Screen Reader Voice Audit:** Limited to ARIA label verification for now; full voiceover testing deferred.

</deferred>
