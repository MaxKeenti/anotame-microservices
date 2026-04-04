---
phase: 08
plan: 01
subsystem: anotame-web (frontend)
tags: [bug-fix, production, kpi-dashboard, data-table]
dependencies:
  requires: []
  provides:
    - working KPI dashboard at /dashboard/admin/kpi
    - stable customers table without infinite loop
  affects:
    - KPI dashboard metrics rendering
    - Customers page table functionality
    - DataTableWrapper component (foundation)
tech_stack:
  patterns:
    - Svelte 5 $state and $derived
    - Svelte 5 $effect with untrack
    - TanStack Table Core
    - Promise.all async pattern
  libs:
    - svelte 5.x
    - @tanstack/table-core
    - lucide-svelte
duration_minutes: 12
completed_date: "2026-04-03"
requirements_completed:
  - BUG-01
  - BUG-02
---

# Phase 08 Plan 01: Production Bug Fixes Summary

## One-Liner
Fixed KPI dashboard API path and eliminated pagination infinite loop in DataTableWrapper using Svelte untrack.

## Objective
Restore two broken production pages: (1) KPI dashboard was calling wrong API path causing 404s, (2) customers page crashed due to infinite reactive loop in DataTableWrapper's pagination reset effect.

## What Was Built

### Task 1: Fix KPI Dashboard API Path (BUG-01)
**File:** `anotame-web/src/routes/(app)/dashboard/admin/kpi/+page.svelte`

- Changed line 45 from `${API_SALES}/orders/metrics/dashboard` to `${API_SALES}/orders/kpi/dashboard`
- The dashboard now calls the correct backend API endpoint
- All other code remains unchanged (try/catch, loading state, second API call)

**Verification:**
```bash
grep "orders/kpi/dashboard" anotame-web/src/routes/\(app\)/dashboard/admin/kpi/+page.svelte
# Returns: 45:  apiService.request<DashboardMetrics>(`${API_SALES}/orders/kpi/dashboard`),

grep "orders/metrics/dashboard" anotame-web/src/routes/\(app\)/dashboard/admin/kpi/+page.svelte
# Returns: (no match - old path removed)
```

### Task 2: Fix DataTableWrapper Pagination Infinite Loop (BUG-02)
**File:** `anotame-web/src/lib/components/ui/DataTableWrapper.svelte`

- Added `import { untrack } from 'svelte';` at line 2
- Wrapped pagination state reset in `untrack(() => {...})` (lines 50-52)

**Before:**
```svelte
$effect(() => {
  void globalFilter;
  pagination = { pageIndex: 0, pageSize: pagination.pageSize };
});
```

**After:**
```svelte
$effect(() => {
  void globalFilter;
  untrack(() => {
    pagination = { pageIndex: 0, pageSize: pagination.pageSize };
  });
});
```

The `untrack` wrapper prevents the reactive dependency cycle that was triggering `effect_update_depth_exceeded` errors.

**Verification:**
```bash
grep -n "untrack" anotame-web/src/lib/components/ui/DataTableWrapper.svelte
# Returns:
# 2:  import { untrack } from 'svelte';
# 50:    untrack(() => {
```

## Acceptance Criteria Met

- ✓ `grep "orders/kpi/dashboard" anotame-web/src/routes/(app)/dashboard/admin/kpi/+page.svelte` exits 0
- ✓ `grep "orders/metrics/dashboard" anotame-web/src/routes/(app)/dashboard/admin/kpi/+page.svelte` exits non-zero
- ✓ `grep "untrack" anotame-web/src/lib/components/ui/DataTableWrapper.svelte` returns both import and usage
- ✓ `bun run build` in anotame-web/ exits 0 (verified)

## Changes Summary

| File | Type | Change | Lines |
|------|------|--------|-------|
| kpi/+page.svelte | fix | API path: metrics → kpi | 45 |
| DataTableWrapper.svelte | fix | Add untrack import and wrapper | 2, 50-52 |

## Commits

| Hash | Message |
|------|---------|
| e496a22 | fix(08-01): correct KPI dashboard API path from orders/metrics to orders/kpi |
| 0ac8831 | fix(08-01): prevent DataTableWrapper pagination reactive loop with untrack |

## Deviations from Plan

None - plan executed exactly as written. Both bug fixes applied with minimal, surgical changes. No additional issues discovered during implementation.

## Testing Notes

**Build Status:** Passed
- `bun run build` completed successfully
- No TypeScript errors
- No Svelte compiler warnings related to the changes
- Circular dependencies from node_modules (typebox, zod-v3-to-json-schema) are pre-existing and not affected by these changes

**Manual Testing Recommended (by user in browser):**
1. Navigate to `/dashboard/admin/kpi` and verify metrics cards populate (check DevTools Network tab for successful `orders/kpi/dashboard` request, no 404)
2. Navigate to `/dashboard/customers` and verify table renders without `effect_update_depth_exceeded` error in console
3. Type in the customers filter input and verify pagination resets to page 1 without crashing

## Key Files

**Created:** None
**Modified:**
- `/anotame-web/src/routes/(app)/dashboard/admin/kpi/+page.svelte` (1 line)
- `/anotame-web/src/lib/components/ui/DataTableWrapper.svelte` (4 lines added)

## Decisions Made

- Used `untrack()` from Svelte 5 (correct API for breaking reactive dependencies in effects)
- Did not refactor surrounding code or optimize components beyond the minimal required fix
- Did not add defensive null checks or extra error handling (task scope was surgical fixes only)

## Known Stubs

None. Both pages now have complete data flows:
- KPI dashboard receives metrics from the corrected API endpoint
- Customers table pagination resets correctly without infinite loops
