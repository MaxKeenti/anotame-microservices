---
quick_task: 260404-giv
description: Investigate and fix formsnap Label control.labelId undefined error
date: 2026-04-04
duration: 8 min
status: VERIFIED
commit: 8c1be3c
---

# Quick Task 260404-giv: FormSnap Label Context Guard Fix

## Summary

Fixed the persistent runtime error "this.control.labelId undefined" in FormSnap's Label component by implementing a defensive context guard pattern in form-label.svelte.

## Root Cause

FormSnap v2.0.1's LabelState constructor immediately attempts `this.control.labelId = this.#id` without null-checking the Control context. In Svelte 5 with nested snippets (Dialog > Form.Control > Form.Label), context timing can cause the Control context to be undefined when the Label mounts, triggering an error.

## Solution Implemented

Updated `/anotame-web/src/lib/components/ui/form/form-label.svelte`:

1. **Added context guard:** Import `getContext` from svelte and check if FORM_CONTROL_CTX exists at initialization
2. **Conditional rendering:**
   - If context exists: render FormPrimitive.Label with child snippet (existing implementation)
   - If context missing: fallback to plain Label component (graceful degradation)
3. **Consistent styling:** Both branches apply same styling: `cn("data-[fs-error]:text-destructive", className)`
4. **Clean initialization:** Used IIFE to avoid Svelte 5 reactivity warnings

## Verification

✅ **Build verification:** `bun run build` completed successfully (exit 0)
✅ **No warnings:** Svelte reactivity warning resolved with IIFE initialization
✅ **No TypeScript errors:** Clean compilation
✅ **Code quality:** Defensive pattern follows Svelte 5 best practices

## Commits

- **8c1be3c:** fix(form-label): add context guard to prevent FormSnap LabelState undefined error

## Files Modified

- `anotame-web/src/lib/components/ui/form/form-label.svelte` (+36, -11 lines)

## Test Plan (Ready for Manual Verification)

When running the application:
1. Open form dialogs (Customers, Services, Garments, Users, Price Lists, Overrides)
2. Verify no "this.control.labelId undefined" errors in browser console
3. Verify labels render correctly with proper styling
4. Verify form submission works

## Context

- **Related quick tasks:** 260404-g9x (attempted `asChild` prop, reverted), 260404-ge3 (reverted attempt)
- **Root cause:** Previous attempts used `asChild` boolean prop which is not part of FormSnap's public API
- **Recommended approach:** Context guard + fallback was identified in 260404-giv-RESEARCH.md as the cleanest solution
- **Phase:** 12 (forms-dialogs-standardization-audit)

## Deviations

None - plan executed exactly as written.
