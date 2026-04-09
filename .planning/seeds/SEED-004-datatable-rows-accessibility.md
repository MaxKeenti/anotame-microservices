---
id: SEED-004
status: promoted
promoted_to: Phase 17 (v1.3)
planted: 2026-04-04
planted_during: v1.2 / Phase 11
trigger_when: v1.3 UX Refinements
scope: Medium
---

# SEED-004: Add configurable row count to DataTableWrapper for small displays

## Why This Matters

The system is used on browsers with relatively small displays (1024 x 768px). Currently, `DataTableWrapper` has a hardcoded or prop-passed static `pageSize`. Users on small screens may find the default row count too high, requiring excessive vertical scrolling or breaking the layout flow. Providing a setting to adjust this row count improves accessibility and usability on constrained displays.

## When to Surface

**Trigger:** v1.3 UX Refinements

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions:
- We are focusing on UX/UI refinements for production environments.
- We are addressing accessibility issues for specific hardware/display constraints.
- We are looking to generalize `DataTableWrapper` settings.

## Scope Estimate

**Medium** — This requires:
1. Creating a global or per-session settings mechanism (likely a store or context).
2. Updating `DataTableWrapper` to read from this setting.
3. Implementing `localStorage` persistence so the preference survives reloads.
4. Adding a UI element (e.g., in a settings page or a dropdown on the table itself) to let users change the value.

## Breadcrumbs

Related code and decisions found in the current codebase:

- [DataTableWrapper.svelte](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/lib/components/ui/DataTableWrapper.svelte): The core component where `pageSize` is managed in the `pagination` state (Line 46).
- [standardization_plan.md](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/docs/standardization_plan.md): Mentions table standardization which is the current focus of v1.2.

## Notes

- The user specifically requested `localStorage` persistence.
- The target display size is 1024 x 768px.
- Consider if this should be a global setting or if users should be able to override it per table.
