---
phase: 15-order-lifecycle-improvements
plan: 03
subsystem: frontend
tags: [svelte5, sveltekit, order-lifecycle, bulk-actions, tanstack-table, pickup-code, operations, paraglide]

# Dependency graph
requires:
  - "15-01: Backend — PATCH /orders/{id}/deliver, PATCH /orders/{id}/status, DELETE /orders/{id}"
  - "15-02: Frontend — orders list page with DataTableWrapper, operations page structure"
provides:
  - "DataTableWrapper with optional bulkActions prop, bindable bulkMode, checkbox column, onSelectionChange callback"
  - "FloatingActionBar component: role-aware status selector (ADMIN=5 / EMPLOYEE=3), delete guard, cancel X"
  - "orders/+page.svelte bulk mode: Seleccionar pedidos toggle, FloatingActionBar, handleBulkStatusChange, handleBulkDelete"
  - "pickup-code-dialog.svelte: 6-digit code entry, PATCH /deliver, inline 400 error, onDelivered callback"
  - "operations/+page.svelte: Listas para entrega tab with READY orders table and Entregar pedido per row"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TanStack row selection: enableRowSelection + onRowSelectionChange in createTable() options; rowSelection state in $state"
    - "Bindable bulk mode: bulkMode = $bindable(false) in DataTableWrapper — parent binds with bind:bulkMode"
    - "Checkbox column: selectionColumn with id '__select__' prepended to effectiveColumns when bulkActions && bulkMode"
    - "Sequential bulk API calls: for-loop with try/catch per order, per-order toast on error, summary toast on success"
    - "Template helper functions for typed map/filter expressions to avoid implicit any in strict tsconfig"

key-files:
  created:
    - anotame-web/src/lib/components/ui/FloatingActionBar.svelte
    - anotame-web/src/lib/components/orders/pickup-code-dialog.svelte
  modified:
    - anotame-web/src/lib/components/ui/DataTableWrapper.svelte
    - anotame-web/src/routes/(app)/dashboard/orders/+page.svelte
    - anotame-web/src/routes/(app)/dashboard/operations/+page.svelte

key-decisions:
  - "getRowSelectionRowModel does not exist as a named export in @tanstack/table-core — TanStack row selection is handled natively by getCoreRowModel() when enableRowSelection: true is set; no extra row model function needed"
  - "TypeScript arrow functions with type annotations (i: any) => ... trigger Svelte compiler 'Unexpected token' in template expressions — extracted to named helper functions in script block (getServicesSummary, getGarmentsSummary)"
  - "IDE diagnostics from worktree path are false positives — worktree has no node_modules; actual type verification runs from main repo anotame-web with bun run check (0 errors)"
  - "FloatingActionBar uses direct <X /> Lucide import (not {@const} pattern) since X is a named uppercase import, not a variable mapping per AI_RULES.md"

# Metrics
duration: 30min
completed: 2026-04-07
---

# Phase 15 Plan 03: Bulk Operations & Deliver Order Flow Summary

**DataTableWrapper bulk mode with FloatingActionBar for multi-order status/delete actions, plus pickup-code-dialog and READY orders tab on the operations page completing the deliver flow**

## Performance

- **Duration:** 30 min
- **Started:** 2026-04-07T01:00:00Z
- **Completed:** 2026-04-07T01:30:00Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- Extended `DataTableWrapper` with optional bulk mode: `bulkActions` prop enables TanStack row selection, `bulkMode = $bindable(false)` lets the parent control the toggle, `onSelectionChange` fires with selected row data on each change, `__select__` checkbox column prepended when active
- Created `FloatingActionBar`: fixed bottom-center toolbar showing selected count, role-aware status selector (ADMIN sees all 5 statuses; EMPLOYEE sees 3), delete button disabled unless all selected are DRAFT, cancel X
- Orders page wired for bulk: "Seleccionar pedidos" / "Cancelar selección" toggle, `handleBulkStatusChange` (sequential PATCH /status), `handleBulkDelete` (guard + adaptiveConfirm + sequential DELETE), FloatingActionBar rendered outside table container
- Created `pickup-code-dialog`: 6-digit numeric input (font-mono, h-14, tracking-widest), PATCH /orders/{id}/deliver on submit, inline "Código incorrecto" error on 400, fires `onDelivered()` on success
- Operations page refactored with Tabs: existing IN_PROGRESS table preserved unchanged under "En progreso" tab; new "Listas para entrega" tab shows READY orders with "Entregar pedido" button per row opening pickup-code-dialog

## Task Commits

Each task was committed atomically:

1. **Task 1: DataTableWrapper bulk mode + FloatingActionBar** — `1440afe` (feat)
2. **Task 2: orders bulk wiring + pickup-code-dialog + operations READY tab** — `e36b14c` (feat)

## Files Created/Modified

- `DataTableWrapper.svelte` — Added bulkActions/bulkMode/$bindable/onSelectionChange props, enableRowSelection, __select__ checkbox column with select-all header, row checkboxes in cells, effectiveColumns derived
- `FloatingActionBar.svelte` — New component: role-aware status picker + Aplicar, disabled delete guard, cancel X, fixed bottom-center positioning
- `orders/+page.svelte` — Bulk state, derived isAdmin/allSelectedAreDraft, handleBulkStatusChange/handleBulkDelete/handleBulkCancel, toggle button, DataTableWrapper wired, FloatingActionBar rendered
- `pickup-code-dialog.svelte` — New component: 6-digit code input, PATCH /deliver, 400 inline error, success callback
- `operations/+page.svelte` — Tabs wrapper added, existing IN_PROGRESS table moved to tab, new READY tab, readyOrders state, openDeliverDialog/handleDelivered, PickupCodeDialog wired

## Decisions Made

- `getRowSelectionRowModel` is not a named export from `@tanstack/table-core`. TanStack Table's core row model handles row selection natively when `enableRowSelection: true` is provided — no separate row model function is needed. Removed the import.
- TypeScript type annotations inside Svelte template expressions (`(i: any) => ...`) cause a compiler "Unexpected token" error. Extracted to named helper functions (`getServicesSummary`, `getGarmentsSummary`) in the script block to satisfy strict tsconfig.
- IDE diagnostics from the worktree path (`.claude/worktrees/agent-a4565211/`) are false positives because the worktree has no `node_modules`. All verification ran from the main repo `anotame-web/` directory with `bun run check` and `bun run build`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] getRowSelectionRowModel does not exist in @tanstack/table-core**
- **Found during:** Task 1 implementation
- **Issue:** Plan's interface block referenced `getRowSelectionRowModel` from `@tanstack/table-core`, but the library does not export this function. The runtime confirmed only `RowSelection` (namespace object) exists, not a standalone `getRowSelectionRowModel` function.
- **Fix:** Removed the non-existent import and the corresponding `getRowSelectionRowModel: getRowSelectionRowModel()` line from `createTable()`. Row selection works via `enableRowSelection: true` + `onRowSelectionChange` alone.
- **Files modified:** `DataTableWrapper.svelte`
- **Committed in:** `1440afe`

**2. [Rule 1 - Bug] TypeScript type annotations in Svelte template expressions**
- **Found during:** Task 2 verification (`bun run check` exit 0 requirement)
- **Issue:** `(i: any) =>` and `(s: any) =>` inside `{#each}` table cell expressions caused Svelte compiler "Unexpected token" errors. Svelte template expressions do not accept TypeScript type syntax.
- **Fix:** Extracted two helper functions — `getServicesSummary(items: any[])` and `getGarmentsSummary(items: any[])` — to the script block, replacing inline map/filter expressions.
- **Files modified:** `operations/+page.svelte`
- **Committed in:** `e36b14c`

---

**Total deviations:** 2 auto-fixed (Rule 1 — bugs in plan-prescribed code)

## Known Stubs

None — all data flows from live API responses. Bulk actions call real API endpoints. Pickup code dialog calls `PATCH /orders/{id}/deliver` with real backend validation.

## Threat Flags

No new threat surface beyond what was analyzed in the plan's `<threat_model>`. All mitigations applied:

| Flag | File | Description |
|------|------|-------------|
| T-15-11 mitigated | FloatingActionBar.svelte | `isAdmin` prop controls `availableStatuses`; EMPLOYEE sees only RECEIVED/IN_PROGRESS/READY |
| T-15-12 mitigated | orders/+page.svelte | `allSelectedAreDraft` derived check disables delete button; 409 handled per-order |
| T-15-15 mitigated | orders/+page.svelte | `selectedOrders` populated from `filteredOrders` fetched with staff JWT; backend enforces branch |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `DataTableWrapper.svelte` exists | FOUND |
| `FloatingActionBar.svelte` exists | FOUND |
| `pickup-code-dialog.svelte` exists | FOUND |
| `orders/+page.svelte` modified | FOUND |
| `operations/+page.svelte` modified | FOUND |
| commit `1440afe` (Task 1) | FOUND |
| commit `e36b14c` (Task 2) | FOUND |
| `bun run build` exit 0 | PASSED |
| `bun run check` exit 0 | PASSED (0 errors, 0 warnings) |

*Phase: 15-order-lifecycle-improvements*
*Completed: 2026-04-07*
