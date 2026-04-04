---
phase: 11-datatablewrapper-filter-consolidation
plan: 01
subsystem: Frontend UI Component
tags: [DataTableWrapper, filter-deduplication, conditional-rendering, design-tokens]
dependency_graph:
  requires: [10-01-shadcn-preset-init]
  provides: [TABLE-01, TABLE-02, TABLE-03]
  affects: [customers-page, orders-page, data-table-pages]
tech_stack:
  added: []
  patterns: [conditional-rendering, optional-props, design-token-styling]
key_files:
  created: []
  modified:
    - anotame-web/src/lib/components/ui/DataTableWrapper.svelte
    - anotame-web/src/routes/(app)/dashboard/customers/+page.svelte
    - anotame-web/src/routes/(app)/dashboard/orders/+page.svelte
decisions:
  - D-01: Added optional showFilter prop (default true) for backward compatibility
  - D-02: Applied conditional rendering via {#if showFilter} block
  - D-03: Always render divider using --border CSS token
  - D-04: Customers and Orders pages hide wrapper's filter
  - D-05: Other pages (Garments, Services, Price Lists, Users, Schedule) keep wrapper's filter
execution_metrics:
  start_time: "2026-04-04T06:49:27Z"
  end_time: "2026-04-04T06:53:42Z"
  duration: 4 minutes 15 seconds
  tasks_completed: 3/3
  files_modified: 3
  commits: 3
---

# Phase 11 Plan 01: DataTableWrapper Filter Consolidation Summary

**Configurable filter visibility for DataTableWrapper with visual divider — eliminate duplicate filter UIs on Customers and Orders pages**

## What Was Built

### Task 1: Add showFilter Prop and Divider to DataTableWrapper

Modified `anotame-web/src/lib/components/ui/DataTableWrapper.svelte`:
- Added `showFilter?: boolean` prop to Props type (line 26)
- Added `showFilter = true,` default in destructuring (line 38)
- Wrapped search input in `{#if showFilter}...{/if}` conditional block (line 111)
- Added horizontal divider `<div class="border-t border-border"></div>` after filter block (line 124)

The divider uses the `--border` design token from Phase 10's shadcn preset, ensuring consistent styling across light/dark modes.

**Why this design:**
- Default `showFilter = true` ensures backward compatibility — all 7 existing pages work without modification
- Conditional rendering hides only the input element, not the divider
- Divider always present to clarify filter/table boundary
- Uses existing design system tokens (no new CSS required)

### Task 2: Update Customers Page to Hide Wrapper's Filter

Modified `anotame-web/src/routes/(app)/dashboard/customers/+page.svelte`:
- Added `showFilter={false}` prop to DataTableWrapper component (line 108)
- Page's custom search form (lines 91-98) remains the only visible filter input
- handleSearch handler continues to call `fetchCustomers()` API with search query
- API-filtered data passed to wrapper
- Divider separates custom filter form from table

**Result:** Single search UI on Customers page — eliminates duplicate filter inputs.

### Task 3: Update Orders Page to Hide Wrapper's Filter

Modified `anotame-web/src/routes/(app)/dashboard/orders/+page.svelte`:
- Added `showFilter={false}` to Active Orders DataTableWrapper (line 184)
- Added `showFilter={false}` to Drafts DataTableWrapper (line 208)
- Page's custom multi-filter form (lines 144-174) remains the only visible filter UI
  - Search Input: Filters by ticket number or customer name
  - Garment Select: Filters by garment type
  - Date Picker: Filters by delivery date
- $derived.by() logic (lines 82-110) computes filteredOrders from three dimensions
- Pre-filtered data passed to wrapper
- Divider separates custom filter form from table

**Result:** Single comprehensive filter UI on Orders page — eliminates duplicate filter inputs.

## Verification Results

### Build Verification

```bash
cd anotame-web && bun run build
```

✓ **Build passed successfully**
- TypeScript: No errors
- All modules transformed: 4970 (SSR) + 7050 (client)
- Output: .svelte-kit/output/ created
- Circular dependencies: Pre-existing warnings from zod-v3-to-json-schema and @internationalized/date (not caused by changes)

### File Verification

✓ **DataTableWrapper.svelte contains:**
- Line 26: `showFilter?: boolean;` in Props type
- Line 38: `showFilter = true,` in destructuring
- Line 111: `{#if showFilter}` conditional block
- Line 124: `<div class="border-t border-border"></div>` divider element

✓ **Customers page contains:**
- Line 108: `showFilter={false}` prop on DataTableWrapper

✓ **Orders page contains:**
- Line 184: `showFilter={false}` on Active Orders DataTableWrapper
- Line 208: `showFilter={false}` on Drafts DataTableWrapper

### Backward Compatibility

✓ **Pages using wrapper's built-in filter remain unchanged:**
- Garments (`/dashboard/catalog/garments`) — renders wrapper's search
- Services (`/dashboard/catalog/services`) — renders wrapper's search
- Price Lists (`/dashboard/catalog/price-lists`) — renders wrapper's search
- Users (`/dashboard/users`) — renders wrapper's search
- Schedule (`/dashboard/schedule`) — renders wrapper's search

All 5 pages continue to use DataTableWrapper's client-side global filter without any modifications (backward compatible).

## Requirements Satisfied

### TABLE-01: No Duplicate Filters

✓ **Customers page:** Exactly ONE search input visible (custom form, wrapper's hidden)
✓ **Orders page:** Exactly ONE multi-filter UI visible (custom form with 3 inputs, wrapper's hidden)
✓ **All other pages:** Wrapper's built-in filter visible (unchanged)

### TABLE-02: DataTableWrapper Accepts Filter Configuration

✓ **showFilter prop:** Accepts boolean value (true = show, false = hide)
✓ **Defaults to true:** Backward compatible — existing pages work without modification
✓ **Optional:** Pages can omit prop entirely and get default behavior
✓ **Type-safe:** Proper TypeScript typing in Props interface

### TABLE-03: Visual Separation Between Filter and Table

✓ **Divider element:** `<div class="border-t border-border"></div>` always present
✓ **Design token:** Uses `--border` CSS variable from Phase 10 preset
✓ **Light mode:** oklch(0.922 0.005 34.3) — subtle light gray
✓ **Dark mode:** oklch(1 0 0 / 10%) — subtle dark overlay
✓ **Visibility:** Divider appears on all 7 data table pages

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functionality is complete and no placeholder patterns remain.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `showFilter` defaults to `true` | Backward compatibility — existing 5 pages unchanged | ✓ Implemented |
| Divider always present | Clarifies control hierarchy regardless of filter visibility | ✓ Implemented |
| Use `--border` token for divider | Consistent with Phase 10 design system | ✓ Implemented |
| Apply to Customers + Orders only | These pages have custom server-side search logic | ✓ Implemented |

## Next Phase

Phase 11-02 will continue with UI standardization audit, color compliance, and tenant theming implementation.

## Self-Check: PASSED

- ✓ DataTableWrapper.svelte contains all required changes
- ✓ Customers page contains showFilter={false} prop
- ✓ Orders page contains showFilter={false} props (both tables)
- ✓ Build passed with zero TypeScript errors
- ✓ All commits verified in git log
  - Commit 0512728: DataTableWrapper component changes
  - Commit 85752f0: Customers page changes
  - Commit 54add67: Orders page changes
- ✓ Backward compatibility maintained: no changes to Garments, Services, Price Lists, Users, Schedule pages
- ✓ Design tokens applied correctly (--border CSS variable)
- ✓ All 3 requirements (TABLE-01, TABLE-02, TABLE-03) satisfied
