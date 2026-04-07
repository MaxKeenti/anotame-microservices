---
id: SEED-008
status: dormant
planted: 2026-04-05
planted_during: v1.2 / Phase 12
trigger_when: "When we start the 'Operations Efficiency' milestone (expected v1.5 or v1.6) or add 'bulk actions' support."
scope: Medium
---

# SEED-008: Bulk-send orders to operations with day filtering

## Why This Matters

At the start of each work day, staff need to quickly identify all orders scheduled for that day (or pending from previous days) and move them into the "In Operations" status. Currently, this likely requires individual actions.

A dedicated bulk-send experience (e.g., a dialog or specialized sub-page) would allow:
- **Date Filtering:** Automatically filter for today's orders.
- **Multi-Select:** Checkboxes to select all or some orders.
- **Persistence:** Selecting items should not reset the date filter, allowing for layered filtering (e.g. by date, then by garment type).
- **One-Click Execution:** Sending all selected orders to operations in a single batch.

## When to Surface

**Trigger:** When we start the "Operations Efficiency" milestone (v1.6+) or when the user mentions that "sending orders manually is too slow."

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches:
- `operations`
- `bulk-actions`
- `inventory`
- `workflow`

## Scope Estimate

**Medium** — Requires:
- **Frontend:** A new `BulkSendDialog.svelte` component with a data table that supports multi-select (TanStack Table's `rowSelection`).
- **Backend (Sales):** A new bulk-update endpoint (e.g., `POST /orders/bulk-status`) to handle a list of UUIDs.
- **Backend (Operations):** Ensuring work orders are created for all passed IDs without conflict.

## Breadcrumbs

Related code and decisions found in the current codebase:

- [operations/dashboard](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/routes/(app)/dashboard/operations/)
- [SalesService.java](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java) (specifically the logic that moves an order to `IN_OPERATIONS`)
- [DataTableWrapper.svelte](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web/src/lib/components/ui/data-table/DataTableWrapper.svelte) (can be extended or reused for the selection table)

## Notes

- The UI should clearly show the "count" of selected items.
- It might be useful to show "Total Workload" of the selected items before sending (reuse SEED-007 concept).
- The "day filter" should be prominent (e.g., a date picker that defaults to Today).
