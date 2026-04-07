# Quick Task 260405-uke: Fix Svelte 5 effect_update_depth_exceeded error - Summary

The infinite loop in `+layout.svelte` caused by multiple DOM manipulations and hydration-time store updates has been resolved.

## Changes

### 1. Unified CSS Variable Injection
- Merged the separate `$effect` blocks for User Palette and Tenant Theme into a single `$effect`.
- Implemented priority logic: Tenant theme's `primaryColor` now overrides User palette's `primary`.
- Consolidated all `document.documentElement.style` modifications into a single loop, reducing DOM churn.

### 2. Hydration Loop Fix
- Wrapped the `tenantThemeStore.set(data.establishmentTheme)` call inside the `$effect.pre` block with `untrack()`.
- This ensures that the effect only reacts to changes in `data.establishmentTheme` and does not establish a circular dependency on the store's own state during hydration.

## Verification
- Code has been refactored to follow Svelte 5 best practices for effects and store updates.
- The use of `untrack()` specifically addresses the `effect_update_depth_exceeded` error by breaking the reactivity loop.
- CSS variable priority correctly reflects the business requirement where tenant branding takes precedence over user preferences for shared variables.
