# Phase 8: Production Bug Fixes - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three live production bugs: (1) KPI dashboard fails to load metrics due to a wrong API URL, (2) customers page crashes with an `effect_update_depth_exceeded` infinite reactive loop in the DataTableWrapper integration, (3) deleting an order or work order with associated data surfaces a raw error instead of a human-readable message. No new capabilities — all three bugs have well-defined acceptance criteria in REQUIREMENTS.md.

</domain>

<decisions>
## Implementation Decisions

### BUG-01: KPI Dashboard API path
- **D-01:** Change the API call in `anotame-web/src/routes/(app)/dashboard/admin/kpi/+page.svelte` from `/orders/metrics/dashboard` to `/orders/kpi/dashboard` to match the actual backend endpoint.
- **D-02:** No changes to error state or loading UI — the URL fix is sufficient. Leave existing try/catch and loading state as-is.

### BUG-02: Customers page reactive loop fix scope
- **D-03:** Diagnose the root cause in `DataTableWrapper.svelte` and `customers/+page.svelte`. Fix should be scoped to the customers page unless the root cause is in DataTableWrapper itself (in which case fix DataTableWrapper to avoid breaking all other consumers).
- **D-04:** The fix must eliminate the `effect_update_depth_exceeded` error without changing DataTableWrapper's public API (columns, data, loading, emptyMessage, filterPlaceholder, actionCell snippet).

### BUG-03: Delete error UX
- **D-05:** When a DELETE request returns a 409 (FK constraint), show a `toast.error()` with a specific human-readable reason explaining what is blocking the delete and what the user should do first.
  - Example for orders: `"No se puede eliminar: el pedido tiene órdenes de trabajo asociadas. Elimina las órdenes de trabajo primero."`
  - Example for work orders on the operations page: `"No se puede cancelar: la orden tiene registros de trabajo vinculados."`
- **D-06:** The operations page (`/dashboard/operations`) must have a cancel/delete button added for work orders (in addition to "Marcar como Listo"), with the same 409-aware error handling as the orders detail page.
- **D-07:** 409 detection: check HTTP status code 409 specifically, not just any error. Other errors (network, 500) should keep their existing generic messages.

### Claude's Discretion
- Exact wording of the Spanish error messages (within the tone already established in the app — e.g., "No se puede eliminar…")
- Whether to extract a shared `handle409Error` utility or keep inline — either is acceptable

</decisions>

<specifics>
## Specific Ideas

- The app already uses `toast.success` / `toast.error` via `svelte-sonner` consistently across all pages — BUG-03 error messages must use the same pattern.
- The operations page currently uses raw `<Table.*>` markup (not DataTableWrapper) — adding a cancel button there should follow that existing pattern, not introduce DataTableWrapper.
- For BUG-02, the `$derived` table recreation pattern in DataTableWrapper is a known Svelte 5 Runes footgun — the fix should be minimal and targeted, not a full rewrite of DataTableWrapper.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs or ADRs for this phase — requirements are fully captured in decisions above and REQUIREMENTS.md.

### Bug definitions
- `.planning/REQUIREMENTS.md` §Bug Fixes — BUG-01, BUG-02, BUG-03 acceptance criteria

### Files to read before touching
- `anotame-web/src/routes/(app)/dashboard/admin/kpi/+page.svelte` — BUG-01: contains the wrong API path on line 45
- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` — BUG-02: contains the `$derived` table and `$effect` pagination reset that may cause the loop
- `anotame-web/src/routes/(app)/dashboard/customers/+page.svelte` — BUG-02: the page with the reactive loop
- `anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte` — BUG-03: contains existing DELETE handler (line 76) with current error handling
- `anotame-web/src/routes/(app)/dashboard/operations/+page.svelte` — BUG-03: needs cancel button added with 409 handling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `toast` from `svelte-sonner`: already imported in orders/[id], customers, and operations pages — use for BUG-03 error messages
- `adaptiveConfirm`: already used on orders/[id] and customers pages for delete confirmation — use on operations page too
- `apiService.request`: handles API calls across all pages — DELETE method already used in orders/[id]:76

### Established Patterns
- Delete confirmation: always uses `adaptiveConfirm({ title, description })` before the actual DELETE request
- Error handling: `toast.error(message, { description: detail })` — title is short, description has details
- 409 detection: read the error object's status code (check how `apiService.request` surfaces HTTP status codes before writing the 409 check)

### Integration Points
- BUG-01: single-line URL change in kpi/+page.svelte
- BUG-02: DataTableWrapper.svelte → customers/+page.svelte relationship
- BUG-03: orders/[id]/+page.svelte `handleCancel()` + new cancel handler on operations/+page.svelte

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-production-bug-fixes*
*Context gathered: 2026-04-03*
