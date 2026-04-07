# Quick Task 260405-uke: Fix Svelte 5 effect_update_depth_exceeded error - Plan

The goal is to fix the infinite loop in `+layout.svelte` by unifying DOM manipulations and guarding hydration-time store updates.

## User Decisions (LOCKED)
- Merge the two CSS variable injection `$effect` blocks into one.
- Tenant theme takes priority over user palette for shared variables like `--primary`.
- Wrap the store initialization in `untrack()` or use a guard to prevent hydration loops.

## Proposed Tasks

### Task 1: Refactor `+layout.svelte` effects
- Merge the User palette injection effect and the Tenant theme injection effect into a single `$effect`.
- Ensure Tenant theme variables (like `primaryColor`) override User palette variables (like `palette.primary`) for the `--primary` property.
- Implement a deep equality check or use `untrack()` in the `$effect.pre` block to ensure `tenantThemeStore.set()` is only called when the data actually changes or to prevent it from being a dependency.

### Task 2: Validation
- Verify that the `effect_update_depth_exceeded` error is gone in the browser console.
- Confirm that CSS variables are correctly applied (Tenant theme taking priority).
- Ensure hydration works correctly without triggering infinite loops.

## Technical Details
- In the merged effect, we will first gather all values and then apply them to `document.documentElement` in a single loop or block.
- For the hydration loop, we will compare `JSON.stringify(data.establishmentTheme)` with `JSON.stringify(tenantThemeStore.current)` or simply use `untrack(() => tenantThemeStore.set(data.establishmentTheme))` if applicable.
