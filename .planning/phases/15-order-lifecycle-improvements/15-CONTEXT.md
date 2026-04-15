# Phase 15: Order Lifecycle Improvements - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable staff to edit existing orders (role-restricted), perform bulk actions on order lists, and confirm customer pickup with a code-based delivery flow. Includes a field-level audit log for order edits.

In scope:
- Edit order page at `/orders/[id]/edit` (wizard reuse, pre-populated)
- Role-based edit restrictions (OPERATOR: notes/due date/payment; ADMIN: all fields + customer reassignment)
- Field-level audit log table (`order_audit_log`) in sales-service
- Status-based edit lock (DELIVERED and CANCELLED orders are read-only)
- Bulk selection mode (toggle via button) with floating action bar
- Bulk status change (ADMIN: any status; OPERATOR: valid transitions only)
- Bulk delete for DRAFT orders only
- Customer pickup code (6-digit, auto-generated at order creation)
- READY orders filter in `/dashboard/operations` for delivery confirmation
- DELIVERED status timestamp captured at moment of delivery confirmation (staff enters customer's pickup code)

Out of scope:
- Customer signature capture (deferred)
- Bulk export / CSV download (deferred)
- Audit log UI / reporting view (data captured, view deferred)
- Multi-tenant audit log separation (deferred)

</domain>

<decisions>
## Implementation Decisions

### Edit Order UX
- **D-01:** Dedicated edit page at `/orders/[id]/edit`. This route is already linked from the orders list table (`href="/dashboard/orders/${row.original.id}/edit"`). Page must be created.
- **D-02:** Edit page reuses the existing wizard steps (`customer-step.svelte`, `items-step.svelte`, `payment-step.svelte`) pre-populated with existing order data. No new wizard components needed.
- **D-03:** After successful save, navigate to the order detail page `/orders/[id]`. Show a success toast confirming save.

### Role-Based Edit Restrictions
- **D-04:** OPERATOR can edit: notes/observations, due date/promised date, payment status. Cannot change garment type, services, or customer.
- **D-05:** ADMIN can edit all fields including customer reassignment.
- **D-06:** Both ADMIN and OPERATOR are blocked from editing DELIVERED or CANCELLED orders (status lock enforced on both frontend and backend).

### Field-Level Audit Log
- **D-07:** New `order_audit_log` table in sales-service DB: `id`, `order_id`, `user_id`, `field_name`, `old_value` (text), `new_value` (text), `changed_at` (timestamptz). One row per changed field per save.
- **D-08:** Audit log is written server-side in `SalesService.updateOrder()` before persisting the order change. Not exposed via public API in Phase 15 — data capture only.

### Editable Fields & Status Locks
- **D-09:** DELIVERED and CANCELLED statuses lock editing for all roles — both frontend (hide/disable edit button) and backend (return 409 if attempted).
- **D-10:** Customer can be reassigned by ADMIN only (not OPERATOR). Customer field is hidden/readonly in the edit wizard for OPERATOR role.

### Customer Pickup Code (Delivery Confirmation)
- **D-11:** A 6-digit numeric pickup code is auto-generated server-side when an order is created and stored on the order entity (`pickupCode` field, NOT NULL).
- **D-12:** The pickup code is visible on the order detail page and (eventually) printed on the order ticket.
- **D-13:** Marking an order as DELIVERED requires staff to enter the customer's 6-digit pickup code in a confirmation dialog. Backend validates the code before transitioning status to DELIVERED.
- **D-14:** The `deliveredAt` timestamp is recorded at the moment of successful DELIVERED transition (server-side, not client).

### READY Orders / Delivery Workflow
- **D-15:** Add a "Listas para entrega" filter/tab to the existing `/dashboard/operations` page showing only READY orders. The default view (all active orders) remains unchanged.
- **D-16:** Each READY order row in the operations page has a "Entregar" action button that opens the pickup-code confirmation dialog.

### Bulk Selection UI
- **D-17:** Checkbox column in DataTableWrapper is hidden by default. A "Seleccionar" button activates bulk mode, revealing the checkbox column. "Cancelar" hides it again.
- **D-18:** When 1+ rows are checked, a floating action bar appears above the table: `[N seleccionadas — Cambiar estado | Eliminar | Cancelar]`.
- **D-19:** Bulk mode and checkbox pattern should be implemented as an optional prop on DataTableWrapper (`bulkActions?: boolean`) to avoid affecting other pages using the wrapper.

### Bulk Actions
- **D-20:** Bulk status change: ADMIN can set any target status. OPERATOR can only apply valid status transitions (forward-only: RECEIVED → IN_PROGRESS → READY).
- **D-21:** Bulk delete: DRAFT orders only, for all roles. Requires confirmation dialog listing the orders to be deleted.

### Claude's Discretion
- Exact Flyway migration numbering for new columns/tables
- Whether `pickupCode` validation on the backend uses a constant-time comparison
- Specific Zod schema updates for the edit form
- Order of wizard step navigation for edit vs. create (may simplify to allow jumping between steps in edit mode)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Code — Backend
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java` — Existing PUT /{id} and PATCH /{id}/status endpoints; add pickup code validation endpoint
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java` — updateOrder() and updateOrderStatus(); add audit log writing and pickupCode generation
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java` — Add pickupCode, deliveredAt fields
- `anotame-api/backend/sales-service/src/main/resources/db/migration/` — New Flyway migration for pickupCode, deliveredAt, order_audit_log table

### Existing Code — Frontend
- `anotame-web/src/routes/(app)/dashboard/orders/+page.svelte` — Orders list with DataTableWrapper + Tabs; add bulk selection
- `anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte` — Order detail; show pickupCode, disable edit for locked statuses
- `anotame-web/src/lib/components/orders/wizard/` — customer-step, items-step, payment-step; reuse for edit page
- `anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts` — Wizard state; extend for edit mode (pre-populate)
- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` — Extend with optional bulkActions prop + checkbox column

### Related Phases
- `.planning/phases/14-tenant-theming/14-CONTEXT.md` — Prior phase decisions; no direct dependency
- `.planning/codebase/CONVENTIONS.md` — Java layered architecture, Lombok patterns, Flyway conventions
- `.planning/codebase/STRUCTURE.md` — Route/component organization

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Wizard steps** (`customer-step.svelte`, `items-step.svelte`, `payment-step.svelte`): Reuse for edit page with pre-population. Modify `OrderWizardState.svelte.ts` to accept initial state.
- **DataTableWrapper**: Add optional `bulkActions` prop; when true, renders checkbox column (hidden until "Seleccionar" is pressed) and exposes selection state via callback/event.
- **StatusBadge**: Already exists; used in orders list for status display.
- **superforms + Zod**: All forms must follow this pattern — edit wizard steps are no exception.

### Established Patterns
- **Backend:** PUT /orders/{id} already accepts `CreateOrderRequest` — the full order payload. Edit page submits the same shape.
- **Status flow:** `PATCH /orders/{id}/status` with `{ status: "..." }` payload already in use on detail page (RECEIVED → IN_PROGRESS transition exists).
- **Role check:** JWT claims carry role; backend services check role in request context. Frontend reads role from session to conditionally render fields.
- **Flyway migrations:** All migrations live under `src/main/resources/db/migration/`. Use next sequential version number.

### Integration Points
- Edit page (`/orders/[id]/edit`) → `PUT /orders/{id}` backend endpoint
- Delivery confirmation → new `PATCH /orders/{id}/deliver` endpoint (or extend existing status endpoint with pickupCode validation)
- Bulk status change → call `PATCH /orders/{id}/status` per order (or add bulk endpoint)
- Bulk delete → call `DELETE /orders/{id}` per order (or add bulk endpoint)
- Audit log → written by `SalesService`, not a separate service call

</code_context>

<specifics>
## Specific Ideas

- "Flags of who CRUD what" — The field-level audit log (order_audit_log) captures this. The user wants accountability, not just a last-modified timestamp.
- Delivery confirmation must timestamp the moment of delivery — `deliveredAt` is server-side, not passed from the client.
- The delivery workflow lives in `/dashboard/operations` (not orders) with a READY filter — the operations page is the handoff point from workshop to front desk.
- Pickup code is shown to the customer at order creation (on the receipt/ticket when Phase 17 print integration is done).

</specifics>

<deferred>
## Deferred Ideas

- **Audit log UI:** The audit data will be captured in Phase 15 but no viewing interface (e.g., "edit history" panel on order detail) is in scope. That's a future phase.
- **Bulk export / CSV:** Mentioned during discussion — out of scope for Phase 15.
- **Customer signature capture:** User considered it, chose code-based pickup instead. Deferred.
- **Color validation / WCAG contrast of tenant colors:** Carried over from Phase 14 deferred list.

</deferred>

---

*Phase: 15-order-lifecycle-improvements*
*Context gathered: 2026-04-07*
