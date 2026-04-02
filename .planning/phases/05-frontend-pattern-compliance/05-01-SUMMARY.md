---
phase: 05-frontend-pattern-compliance
plan: 01
subsystem: ui
tags: [svelte5, tanstack-table, datatables, shadcn, typescript]

# Dependency graph
requires:
  - phase: 04-exception-handling-standardization
    provides: Stable backend API responses consumed by orders and customers pages
provides:
  - Generic DataTableWrapper component wrapping @tanstack/table-core with sorting, filtering, pagination
  - Orders page using DataTableWrapper for both active orders and drafts tables
  - Customers page using DataTableWrapper for customer list table
affects: [06-database-migrations, any future listing pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - DataTableWrapper pattern: all data listing pages use DataTableWrapper with TanStack Table, not raw shadcn Table primitives
    - actionCell snippet: action columns passed as {#snippet actionCell(row)} to DataTableWrapper
    - createTable in $derived(): only way to get reactivity without @tanstack/svelte-table

key-files:
  created:
    - anotame-web/src/lib/components/ui/DataTableWrapper.svelte
  modified:
    - anotame-web/src/routes/(app)/dashboard/orders/+page.svelte
    - anotame-web/src/routes/(app)/dashboard/customers/+page.svelte

key-decisions:
  - "Wrap createTable() in $derived() so table instance is fully recreated on state change — only reactive pattern available without @tanstack/svelte-table"
  - "Use {#snippet actionCell(row)} pattern to pass action cells into DataTableWrapper — keeps page-level logic in pages, not the generic component"
  - "Column formatters (translateStatus, formatDate, formatCurrency) applied inside accessorFn — simpler than per-cell renderers and avoids JSX-in-column-def anti-pattern"
  - "Removed unused getStatusColor import from orders page (Rule 1 auto-fix)"

patterns-established:
  - "DataTableWrapper usage: import component, define static ColumnDef<any>[] const, pass data + columns props, use actionCell snippet for row actions"
  - "pageIndex reset via $effect watching globalFilter — prevents empty-page bug on filter change"
  - "intercepting $props into local let before $state — avoids Svelte 5 hydration warning"

requirements-completed: [QUAL-04]

# Metrics
duration: 3min 15s
completed: 2026-04-02
---

# Phase 05 Plan 01: DataTableWrapper Migration Summary

**Generic DataTableWrapper component wrapping @tanstack/table-core with sorting/filter/pagination, migrating orders and customers pages from raw Table.Root to the new wrapper**

## Performance

- **Duration:** 3 min 15s
- **Started:** 2026-04-02T05:43:51Z
- **Completed:** 2026-04-02T05:47:06Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 rewritten)

## Accomplishments

- Created `DataTableWrapper.svelte` — typed generic Svelte 5 component using `createTable` from `@tanstack/table-core` inside `$derived()`, with sort/filter/pagination state via `$state` runes
- Migrated orders page — replaced both `Table.Root` blocks (active orders and drafts) with `DataTableWrapper`; column definitions defined as static `ColumnDef<any>[]` constants; action cells via `{#snippet actionCell(row)}`
- Migrated customers page — replaced single `Table.Root` block with `DataTableWrapper`; all non-table logic (server-side search form, CustomerDialog) unchanged
- All three builds pass exit 0 with no TypeScript errors; no raw `Table.Root` or `Table.` namespace references remain in migrated pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DataTableWrapper.svelte component** - `fc8094e` (feat)
2. **Task 2: Migrate orders page to DataTableWrapper** - `4d35ffb` (feat)
3. **Task 3: Migrate customers page to DataTableWrapper** - `826f5d7` (feat)

**Plan metadata:** _(pending — see final commit)_

## Files Created/Modified

- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` - Generic TanStack table wrapper; accepts columns, data, pageSize, loading, emptyMessage, filterPlaceholder, and actionCell snippet
- `anotame-web/src/routes/(app)/dashboard/orders/+page.svelte` - Orders page using DataTableWrapper for both active orders and drafts tables; static column defs with accessor functions for formatted values
- `anotame-web/src/routes/(app)/dashboard/customers/+page.svelte` - Customers page using DataTableWrapper; static column defs; server-side search and CustomerDialog unchanged

## Decisions Made

- Wrapped `createTable()` in `$derived()` — this is the only way to get full reactivity without `@tanstack/svelte-table` (which is not installed). The table instance is recreated on every state change.
- Used `{#snippet actionCell(row)}` pattern to pass action cells — keeps page-level handlers (handleDeleteDraft, handleEditClick, etc.) in the pages, not inside the generic component.
- Applied `translateStatus`, `formatDate`, `formatCurrency` inside `accessorFn` on the column def — simplest approach for string formatting without needing per-cell component renderers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused getStatusColor import from orders page**
- **Found during:** Task 2 (Migrate orders page)
- **Issue:** `getStatusColor` was imported but no longer used after migration — status badge HTML moved to string-only approach via `translateStatus` in accessorFn; IDE reported TS6133 warning
- **Fix:** Removed `getStatusColor` from the `statusUtils` import line
- **Files modified:** anotame-web/src/routes/(app)/dashboard/orders/+page.svelte
- **Verification:** Build exits 0; no TS warnings for unused import
- **Committed in:** `4d35ffb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 unused import cleanup)
**Impact on plan:** Minor cleanup only. No scope creep.

## Issues Encountered

None — plan executed cleanly. The `Edit` icon deprecation hint from lucide-svelte is pre-existing in both pages and not a build error.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- QUAL-04 requirement satisfied: all data listing pages now use DataTableWrapper with TanStack Table
- DataTableWrapper pattern is established and ready for use by any future listing pages
- No blockers for Phase 06 (database migrations)

---
*Phase: 05-frontend-pattern-compliance*
*Completed: 2026-04-02*

## Self-Check: PASSED

- FOUND: anotame-web/src/lib/components/ui/DataTableWrapper.svelte
- FOUND: .planning/phases/05-frontend-pattern-compliance/05-01-SUMMARY.md
- FOUND commit fc8094e: feat(05-01): create DataTableWrapper.svelte generic TanStack table component
- FOUND commit 4d35ffb: feat(05-01): migrate orders page to DataTableWrapper
- FOUND commit 826f5d7: feat(05-01): migrate customers page to DataTableWrapper
