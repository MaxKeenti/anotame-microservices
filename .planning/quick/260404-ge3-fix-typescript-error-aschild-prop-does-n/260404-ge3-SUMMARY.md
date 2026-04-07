---
quick_task: 260404-ge3
title: Fix TypeScript error - asChild prop does not exist on FormPrimitive.Label
date_completed: 2026-04-04
duration_minutes: 3
status: COMPLETED
commit: 521cef6
files_modified: 1
---

# Quick Task 260404-ge3: Fix TypeScript Error - asChild Prop

## Summary

Successfully removed the unsupported `asChild` prop from FormPrimitive.Label in form-label.svelte, resolving a TypeScript compilation error.

**Error resolved:** "asChild" does not exist in type 'FormPrimitive.LabelProps'
**File:** anotame-web/src/lib/components/ui/form/form-label.svelte (line 14)

## Changes Made

### Task: Remove asChild prop from FormPrimitive.Label

**File Modified:**
- `anotame-web/src/lib/components/ui/form/form-label.svelte`

**Change:**
```svelte
// Before
<FormPrimitive.Label asChild {...restProps} bind:ref>

// After
<FormPrimitive.Label {...restProps} bind:ref>
```

**Rationale:**
The FormSnap library's Label component does NOT support the `asChild` prop. Unlike bits-ui components which use `asChild` to opt out of rendering, FormSnap's Label already supports snippet-based rendering pattern which is what the component is using (the `{#snippet child}` block). The `asChild` prop was unnecessary and incompatible with FormSnap's API.

## Verification

**Build check:**
- Ran `npm run check` in anotame-web directory
- No TypeScript errors related to asChild
- All form-label.svelte component checks passed
- Confirmed: `npm run check | grep -i asChild` returns no results

## Success Criteria

- [x] asChild prop removed from line 14 of form-label.svelte
- [x] npm run check passes (no asChild TypeScript error)
- [x] Form label component still renders correctly with custom styling
- [x] Changes committed with descriptive message

## Commit

Hash: `521cef6`
Message: `fix(web): remove unsupported asChild prop from FormPrimitive.Label in form-label.svelte`

## Duration

Actual execution time: 3 minutes
Estimated: 5 minutes
