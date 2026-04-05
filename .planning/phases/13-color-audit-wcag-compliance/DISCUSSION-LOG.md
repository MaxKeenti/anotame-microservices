# Phase 13 Discussion Log: Color Audit & WCAG Compliance

**Date:** 2026-04-05
**User:** Maximilian

## Discussion Summary

### 1. Compliance Level
- **Question:** Should we target WCAG 2.1 Level AA (standard) or Level AAA (high contrast)?
- **Selection:** **Level AA**. Standard 4.5:1 ratio for text to ensure a balance between accessibility and modern UI aesthetics.

### 2. Audit Methodology
- **Question:** Automated tools only or also manual keyboard navigation?
- **Selection:** **Automated + Manual "Tab"-navigation audit**. Automated (Lighthouse) for rapid color/markup checks; manual for critical flows like the Order Wizard and Pricelist overrides.

### 3. Status Color Consolidation
- **Question:** Keep hardcoded `STATUS_COLORS` in utility or move to CSS variables?
- **Selection:** **Move to CSS variables and delete `statusUtils.ts` and related hardcoded utility**. Centralize tokens in `layout.css` to respect the OKLCH theme.

### 4. Interactive Component Focus
- **Question:** Use global `--ring` token for all interactive focus states?
- **Selection:** **Yes, use recommendation**. Standardize focus indicators across all custom components to improve keyboard visibility.

## User Contributions
User also implemented `Tabs.Root` in `schedule/+page.svelte` during the session, which aligns with the goal of using accessible shadcn patterns.
