# Quick Task 260405-uke: Fix Svelte 5 effect_update_depth_exceeded error in frontend - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Task Boundary

The user is experiencing a Svelte 5 "effect_update_depth_exceeded" error in the browser console. This error is typically caused by an infinite loop in an `$effect` or `$derived` block where a state update triggers another effect that updates the same state.

Based on the recent changes to `+layout.svelte`, there are multiple `$effect` blocks performing DOM manipulations (setting CSS variables on `document.documentElement`) and one `$effect.pre` initializing a store from server data during hydration.

</domain>

<decisions>
## Implementation Decisions

### Unified Style Injection
- We will merge the palette injection and tenant theme injection into a single `$effect` block.
- This will ensure that `document.documentElement.style.setProperty` calls are coordinated and don't compete or re-trigger each other in an infinite loop.
- **Priority:** Tenant theme (establishment) will take precedence over user palette if both are set for the same variable (e.g., `--primary`).

### Hydration Loop Prevention
- We will use `untrack()` for the `tenantThemeStore.set()` call inside `$effect.pre` or make it conditional on the value actually being different to break the cycle where a store update re-triggers the effect that set it.

### Claude's Discretion
- Claude will decide the optimal way to structure the unified effect and the hydration check to be both performant and correct.

</decisions>

<specifics>
## Specific Ideas

- Move both `paletteStore.current` and `tenantThemeStore.current` into one `$effect`.
- Check if `data.establishmentTheme` is actually different from `tenantThemeStore.current` before calling `set()`.

</specifics>

<canonical_refs>
## Canonical References

- [Svelte 5 Effects Documentation](https://svelte.dev/docs/svelte/effects)
- [Svelte Error: effect_update_depth_exceeded](https://svelte.dev/e/effect_update_depth_exceeded)

</canonical_refs>
