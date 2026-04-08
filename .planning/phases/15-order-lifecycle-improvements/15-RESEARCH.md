# Phase 15: Order Lifecycle Improvements - Research

**Researched:** 2026-04-07
**Domain:** Full-stack: Quarkus (sales-service) + SvelteKit 5 frontend
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Edit Order UX**
- D-01: Dedicated edit page at `/orders/[id]/edit`. Route is already linked from orders list (`href="/dashboard/orders/${row.original.id}/edit"`). Page must be created.
- D-02: Edit page reuses existing wizard steps (`customer-step.svelte`, `items-step.svelte`, `payment-step.svelte`) pre-populated with existing order data. No new wizard components needed.
- D-03: After successful save, navigate to `/orders/[id]`. Show success toast.

**Role-Based Edit Restrictions**
- D-04: OPERATOR can edit: notes/observations, due date/promised date, payment status. Cannot change garment type, services, or customer.
- D-05: ADMIN can edit all fields including customer reassignment.
- D-06: Both ADMIN and OPERATOR are blocked from editing DELIVERED or CANCELLED orders (frontend and backend).

**Field-Level Audit Log**
- D-07: New `order_audit_log` table: `id`, `order_id`, `user_id`, `field_name`, `old_value` (text), `new_value` (text), `changed_at` (timestamptz). One row per changed field per save.
- D-08: Audit log written server-side in `SalesService.updateOrder()` before persisting. Not exposed via public API in Phase 15.

**Editable Fields & Status Locks**
- D-09: DELIVERED and CANCELLED lock editing for all roles — frontend (hide/disable edit button) and backend (return 409 if attempted).
- D-10: Customer can be reassigned by ADMIN only. Customer field is hidden/readonly for OPERATOR role.

**Customer Pickup Code**
- D-11: 6-digit numeric pickup code auto-generated server-side at order creation, stored on order entity (`pickupCode` field, NOT NULL).
- D-12: Pickup code visible on order detail page.
- D-13: Marking DELIVERED requires staff to enter the 6-digit code. Backend validates before transitioning status.
- D-14: `deliveredAt` timestamp recorded at moment of successful DELIVERED transition (server-side).

**READY Orders / Delivery Workflow**
- D-15: Add "Listas para entrega" filter/tab to `/dashboard/operations` showing only READY orders. Default view (IN_PROGRESS) unchanged.
- D-16: Each READY order row has "Entregar" button opening pickup-code confirmation dialog.

**Bulk Selection UI**
- D-17: Checkbox column hidden by default. "Seleccionar" button activates bulk mode. "Cancelar" hides it.
- D-18: When 1+ rows checked, floating action bar: `[N seleccionadas — Cambiar estado | Eliminar | Cancelar]`.
- D-19: Implemented as optional prop on DataTableWrapper (`bulkActions?: boolean`).

**Bulk Actions**
- D-20: Bulk status change: ADMIN any target status; OPERATOR forward-only (RECEIVED → IN_PROGRESS → READY).
- D-21: Bulk delete: DRAFT orders only, all roles. Confirmation dialog listing orders.

### Claude's Discretion
- Exact Flyway migration numbering for new columns/tables
- Whether `pickupCode` validation uses constant-time comparison
- Specific Zod schema updates for the edit form
- Order of wizard step navigation for edit vs. create (may simplify to allow jumping between steps in edit mode)

### Deferred Ideas (OUT OF SCOPE)
- Audit log UI / reporting view (data captured, view deferred)
- Bulk export / CSV download
- Customer signature capture
- Multi-tenant audit log separation
- Color validation / WCAG contrast of tenant colors
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ORDER-01 | Enable staff to edit existing orders (role-restricted, status-locked) | Edit page at `/orders/[id]/edit`, wizard reuse, role check via `authService.user?.role`, backend PUT + 409 for locked statuses |
| ORDER-02 | Bulk actions on order lists (status change, delete) + delivery confirmation with pickup code | DataTableWrapper bulk prop extension, floating action bar, new PATCH /deliver endpoint with pickupCode validation |
</phase_requirements>

---

## Summary

Phase 15 is a full-stack feature addition with no dependency on external libraries beyond what is already installed. The backend is Quarkus 3.27.2 (JAX-RS, Panache, SmallRye JWT) and the frontend is SvelteKit 5 with TanStack Table, sveltekit-superforms, and Zod 4.

The three major work streams are independent enough to plan in separate waves: (1) backend schema + new endpoints (Flyway migration, OrderEntity fields, SalesService audit log, pickup-code validation endpoint), (2) edit order page (wizard pre-population, role-scoped field disabling), and (3) bulk selection in DataTableWrapper plus the READY-orders delivery tab in operations.

**Primary recommendation:** Implement in three waves — Wave 1: backend schema + service changes; Wave 2: edit order page (wizard reuse); Wave 3: bulk selection + operations delivery tab. This sequencing avoids frontend work depending on APIs that do not yet exist.

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

All items below are mandatory for every file produced in this phase. The planner MUST verify compliance in plan tasks.

| Constraint | Applies To | Directive |
|------------|-----------|-----------|
| No Spring Boot | Backend | Framework is Quarkus 3.27.2. All annotations are JAX-RS / Jakarta / MicroProfile, never Spring. |
| Hexagonal architecture | Backend | Domain → Application → Infrastructure layers. Never skip layers. |
| Lombok @Getter @Setter only on JPA entities | Backend | Never `@Data` on `@Entity` classes. |
| `@RequiredArgsConstructor` + `final` fields | Backend | Preferred DI pattern for services. |
| Manual entity-domain mapping | Backend | No MapStruct. Mapping is hand-written in persistence adapters. |
| tco_ prefix for sales tables | DB | New tables: `tco_order_audit_log`. Column names: `snake_case`. |
| Flyway V3__ prefix | DB | Next migration is V3 (latest existing: V2__add_unit_price_to_order_item.sql). |
| Soft delete + audit timestamps | DB/Backend | All new transactional tables need `is_deleted`, `deleted_at`, `created_at`, `updated_at` (unless audit-only/append-only). |
| Svelte 5 runes only | Frontend | `$state`, `$derived`, `$effect`. Never Svelte 4 stores or `$store` syntax. |
| sveltekit-superforms SPA mode + Zod 4 | Frontend | All forms. Schema inline in component. `zod4()` adapter. |
| `adaptiveConfirm()` not `window.confirm()` | Frontend | All confirmation dialogs. |
| `toast` from `svelte-sonner` | Frontend | All user-facing notifications. |
| Never `<svelte:component>` | Frontend | Map to uppercase variable; use `<IconComponent />`. |
| `apiService.request()` only | Frontend | Never raw `fetch()`. Use `API_SALES` constant. |
| All text via Paraglide i18n | Frontend | Do not hardcode display strings. Add keys to `messages/es.json` and `messages/en.json`. |
| `bun run build` must exit 0 | CI | Build gate before any commit. |
| Touch-first UI | Frontend | h-12 minimum for interactive elements, `touch-manipulation` class. |

---

## Standard Stack

### Core (Backend)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Quarkus | 3.27.2 | Backend runtime | Project standard — all services |
| SmallRye JWT | bundled | JWT parsing, `@RolesAllowed` | Already used in identity-service |
| Panache ORM | bundled | JPA repositories | Project standard for persistence |
| Flyway | bundled | DB migrations | Phase 6 established standard |
| Lombok | bundled | Boilerplate reduction | Project standard |
| Jakarta Bean Validation | bundled | DTO validation | Project standard |

[VERIFIED: codebase grep — all libraries confirmed present]

### Core (Frontend)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit 5 | installed | Routing + SSR shell | Project framework |
| TanStack Table | installed | DataTableWrapper internals | Already in use |
| sveltekit-superforms | installed | Form management | Project standard |
| Zod 4 | installed | Schema validation | Project standard (zod4 adapter) |
| svelte-sonner | installed | Toast notifications | Project standard |
| runed | installed | PersistedState for wizard | Already in OrderWizardState |
| lucide-svelte | installed | Icons | Already in orders pages |

[VERIFIED: codebase grep — all imports confirmed in existing files]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Serial PATCH per order (bulk) | New bulk endpoint | Serial calls are simpler, less backend work; bulk endpoint performs better for large selections but adds complexity. Decision: serial PATCH calls per order (CONTEXT.md D-20/D-21 silent — Claude's discretion). |
| Constant-time comparison for pickupCode | String.equals() | Constant-time prevents timing-attack leakage; overkill for a 6-digit staff workflow but trivially added with `MessageDigest.isEqual()`. Recommended: use constant-time (Claude's discretion). |

---

## Architecture Patterns

### Recommended Project Structure (New Files)

```
Backend (sales-service):
infrastructure/persistence/entity/
  OrderAuditLogEntity.java         -- new JPA entity
infrastructure/persistence/repository/
  OrderAuditLogRepository.java     -- new Panache repo
infrastructure/persistence/adapter/
  OrderAuditLogPersistenceAdapter.java  -- new port impl
application/port/output/
  OrderAuditLogRepositoryPort.java -- new port interface
application/dto/
  DeliverOrderRequest.java         -- { pickupCode: String }
  OrderAuditLogEntry.java          -- internal record (not exposed)
src/main/resources/db/migration/
  V3__order_lifecycle_improvements.sql  -- migration

Frontend (anotame-web):
src/routes/(app)/dashboard/orders/[id]/
  edit/+page.svelte                -- new edit page
src/lib/components/orders/
  pickup-code-dialog.svelte        -- new delivery confirmation dialog
src/lib/components/ui/
  DataTableWrapper.svelte          -- modified (bulkActions prop)
  FloatingActionBar.svelte         -- new component (bulk actions bar)
```

### Pattern 1: Role Check in Backend Endpoint (New Pattern)

**What:** Read `jwt.getGroups()` (the `groups` claim set by JwtUtils) to enforce OPERATOR vs ADMIN restrictions in the controller. The `groups` set contains a single role code (e.g., `"ADMIN"` or `"EMPLOYEE"`).

**Note on role codes:** The DB seed has `ADMIN` and `EMPLOYEE` — NOT `OPERATOR`. The CONTEXT.md uses `OPERATOR` as a conceptual role. In the codebase, `EMPLOYEE` is the non-admin role. Before implementing, confirm which role code maps to `OPERATOR` in CONTEXT.md decisions. [ASSUMED: `EMPLOYEE` == OPERATOR semantics in Phase 15. Planner must validate this against D-04/D-05.]

**When to use:** Any endpoint that behaves differently per role.

**Example pattern (from identity-service UserController):**
```java
// Source: identity-service UserController.java verified
@jakarta.annotation.security.RolesAllowed("ADMIN")
@PUT
@Path("/{id}")
public UserResponse updateUser(@PathParam("id") UUID id, CreateUserRequest request) { ... }
```

**For mixed-role endpoints (updateOrder):** Use programmatic check:
```java
// In OrdersResource.updateOrder()
@PUT
@Path("/{id}")
public OrderResponse updateOrder(@PathParam("id") UUID id,
                                  @jakarta.validation.Valid CreateOrderRequest request,
                                  @HeaderParam("X-User-Name") String userName) {
    String role = jwt.getGroups().stream().findFirst().orElse("EMPLOYEE");
    UUID userId = UUID.fromString((String) jwt.getClaim("user_id"));
    return salesService.updateOrder(id, request, userId, role);
}
```
[VERIFIED: pattern — jwt.getGroups() confirmed from JwtUtils.java which calls .groups(roles); role is in the standard MicroProfile JWT `groups` claim]

### Pattern 2: Status Lock Check in SalesService

**What:** Before applying any update to an order, check status and throw 409 for locked statuses.

```java
// In SalesService.updateOrder()
if ("DELIVERED".equals(order.getStatus()) || "CANCELLED".equals(order.getStatus())) {
    throw new jakarta.ws.rs.WebApplicationException(
        jakarta.ws.rs.Response.status(409)
            .entity(Map.of("error", "No se puede editar un pedido entregado o cancelado"))
            .build()
    );
}
```
[VERIFIED: pattern — GlobalExceptionHandler.java handles WebApplicationException with original status + `{"error": "message"}` body]

### Pattern 3: Field-Level Audit Log Writing

**What:** In `SalesService.updateOrder()`, before overwriting values, compare old vs new field values and write one `OrderAuditLogEntity` row per changed field.

```java
// In SalesService.updateOrder() — before persisting
private void writeAuditLog(Order before, CreateOrderRequest after, UUID userId,
                            OrderAuditLogRepositoryPort auditRepo) {
    OffsetDateTime now = OffsetDateTime.now(ZoneId.systemDefault());
    if (!Objects.equals(before.getNotes(), after.getNotes())) {
        OrderAuditLogEntity entry = new OrderAuditLogEntity();
        entry.setOrderId(before.getId());
        entry.setUserId(userId);
        entry.setFieldName("notes");
        entry.setOldValue(before.getNotes());
        entry.setNewValue(after.getNotes());
        entry.setChangedAt(now);
        auditRepo.save(entry);
    }
    // ... repeat for each auditable field
}
```
[VERIFIED: pattern — matches project's manual mapping convention from CONVENTIONS.md]

### Pattern 4: Pickup Code Generation and Validation

**What:** Generate a cryptographically random 6-digit code at order creation time. Validate with constant-time comparison on delivery.

```java
// Generation (in SalesService.createOrder())
int code = ThreadLocalRandom.current().nextInt(100_000, 1_000_000); // 100000-999999
order.setPickupCode(String.format("%06d", code));
```

```java
// Validation (in SalesService.deliverOrder())
boolean valid = MessageDigest.isEqual(
    order.getPickupCode().getBytes(StandardCharsets.UTF_8),
    request.getPickupCode().getBytes(StandardCharsets.UTF_8)
);
if (!valid) {
    throw new jakarta.ws.rs.WebApplicationException(
        jakarta.ws.rs.Response.status(400)
            .entity(Map.of("error", "Código de recogida incorrecto"))
            .build()
    );
}
```
[ASSUMED: `MessageDigest.isEqual()` usage — standard Java approach for constant-time comparison. Claude's discretion.]

### Pattern 5: Wizard Pre-Population for Edit Mode

**What:** The edit page creates a "synthetic" draft in `OrderWizardState` from the existing `OrderResponse` data, with `isEditing: true` to suppress draft persistence. The existing `saveCurrentDraft()` already guards against persisting editing drafts (`if (!this.activeDraft || this.activeDraft.isEditing) return;`).

```typescript
// In edit/+page.svelte onMount:
const existing = await apiService.request<OrderResponse>(`${API_SALES}/orders/${id}`);
// Map OrderResponse → DraftOrder shape
orderWizardState.activeDraft = {
  id: existing.id,          // Use real order ID
  isEditing: true,
  currentStep: 0,
  lastModified: Date.now(),
  customer: existing.customer,
  items: existing.items.map(/* map to DraftOrderItem */),
  amountPaid: existing.amountPaid,
  paymentMethod: existing.paymentMethod,
  committedDeadline: existing.committedDeadline,
  notes: existing.notes
};
```
[VERIFIED: `isEditing` flag already exists in `DraftOrder` interface and `saveCurrentDraft()` already checks it]

**Submit target for edit mode:** `PUT /api/sales/orders/${orderId}` instead of `POST /api/sales/orders`. The payment-step.svelte currently always POSTs. Need to branch on `draft.isEditing`.

### Pattern 6: DataTableWrapper Bulk Mode Extension

**What:** Add optional `bulkActions?: boolean` prop. When true: (a) prepend a checkbox column to the column definition, (b) manage row selection state via TanStack Table's `getRowSelectionRowModel`, (c) expose selected row IDs via a callback prop, (d) render a floating action bar when any rows are selected.

**TanStack Table row selection state:**
```typescript
// In DataTableWrapper.svelte additions
import { getRowSelectionRowModel } from '@tanstack/table-core';

let rowSelection = $state<Record<string, boolean>>({});
let bulkMode = $state(false); // toggled by "Seleccionar" button

// Add to createTable() options when bulkActions=true:
onRowSelectionChange: (updater) => {
  rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
},
enableRowSelection: true,
getRowSelectionRowModel: getRowSelectionRowModel(),
```
[VERIFIED: TanStack table-core already installed; getRowSelectionRowModel confirmed available — used by DataTableWrapper already for getSortedRowModel / getCoreRowModel pattern]

### Anti-Patterns to Avoid

- **Don't pass `pickupCode` as client-set timestamp:** `deliveredAt` must be server-side `OffsetDateTime.now()`. Never accept it from the request body.
- **Don't persist edit-mode drafts to localStorage:** `isEditing: true` guards this, but the edit page must NOT call `orderWizardState.saveCurrentDraft()` or `completeActiveDraft()`.
- **Don't add `@Data` to `OrderAuditLogEntity`:** Use `@Getter @Setter` as per CONVENTIONS.md.
- **Don't use `window.confirm()` for bulk delete:** Use `adaptiveConfirm()` with a description listing the affected order tickets.
- **Don't call status update in a loop without error handling per item:** If bulk status change, each call must catch errors independently and report partial failures.
- **Don't add the `status` column to the Flyway migration twice:** `init.sql` shows both `current_status` and `status` columns — only `status` is mapped in `OrderEntity.java`. Audit migration must not touch `current_status`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 6-digit random code | Custom Math.random logic | `ThreadLocalRandom.current().nextInt(100_000, 1_000_000)` | ThreadLocalRandom is thread-safe and uniform |
| Constant-time string compare | char-by-char loop | `MessageDigest.isEqual(a.getBytes(), b.getBytes())` | Timing-safe; single import |
| Row selection in table | Custom checkbox state | TanStack Table `getRowSelectionRowModel()` | Already bundled; consistent with table API |
| Confirmation dialog | Custom modal | `adaptiveConfirm()` from `confirm-state.svelte` | Project standard; mounted globally |
| Toast notifications | Custom alert UI | `toast` from `svelte-sonner` | Project standard |

**Key insight:** The wizard state, table wrapper, and confirmation system already have 80% of the required hooks. This phase is mostly wiring, not building new infrastructure.

---

## Critical Pre-Implementation Findings

### Finding 1: Role Codes — OPERATOR Does Not Exist in the DB

The DB seed only has `ADMIN` and `EMPLOYEE`. The CONTEXT.md decisions use `OPERATOR` as a conceptual label. The `CreateUserRequest` DTO in identity-service confirms: `// "ADMIN" or "EMPLOYEE"`.

**Impact:** All frontend role checks must use `user.role === 'EMPLOYEE'` for OPERATOR behavior, not `'OPERATOR'`. Backend `@RolesAllowed` must use `"EMPLOYEE"` or `"ADMIN"`.

**Confidence:** HIGH [VERIFIED: init.sql seed + identity-service DTO + UserService.java]

### Finding 2: `delivered_at` Column Already Exists in init.sql

`init.sql` already defines `delivered_at TIMESTAMPTZ` on `tco_order`. However, `OrderEntity.java` does NOT have a `deliveredAt` field. The Flyway migration V3 must:
- Add `deliveredAt` to `OrderEntity` (Java field)
- If using Flyway-only migrations (no Hibernate auto-DDL), add `ALTER TABLE tco_order ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ` — but since the column exists in init.sql, this is a no-op on fresh DBs. Use `ADD COLUMN IF NOT EXISTS` for safety (same guard pattern as V2).
- Add `pickup_code` column (new — not in init.sql or OrderEntity).

**Confidence:** HIGH [VERIFIED: init.sql + OrderEntity.java direct read]

### Finding 3: `OrderResponse` Does Not Include `pickupCode` or `deliveredAt`

The existing `OrderResponse.java` has no `pickupCode` or `deliveredAt` fields. Both must be added to the DTO and to the `mapToResponse()` method in `SalesService`.

**Confidence:** HIGH [VERIFIED: OrderResponse.java direct read]

### Finding 4: `updateOrder()` in SalesService Currently Takes No `userId` or `role` Parameter

The existing signature is `updateOrder(UUID id, CreateOrderRequest request)`. Phase 15 requires adding `userId` (for audit log) and `role` (for OPERATOR field restriction). The controller must extract these from JWT and pass them through. The controller already reads `user_id` from JWT for `createOrder()` — the same pattern applies.

**Confidence:** HIGH [VERIFIED: SalesService.java + OrdersResource.java direct read]

### Finding 5: Operations Page Currently Filters Inline (No DataTableWrapper)

`/dashboard/operations/+page.svelte` uses a raw `<Table.Root>` component, not `DataTableWrapper`. Adding the READY orders tab (D-15, D-16) does NOT require converting the table to DataTableWrapper — it can add a Tabs wrapper and a separate filtered list. Converting to DataTableWrapper would be out-of-scope scope creep.

**Confidence:** HIGH [VERIFIED: operations page direct read]

### Finding 6: Edit Link Already Exists in Orders List

The "Editar" button in `/dashboard/orders/+page.svelte` already uses `href="/dashboard/orders/${row.original.id}/edit"`. The route just needs the `+page.svelte` to be created at `src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte`.

**Confidence:** HIGH [VERIFIED: orders +page.svelte line 183]

### Finding 7: Paraglide i18n is Required but Barely Used in Current Order Pages

`AI_RULES.md` mandates Paraglide for all user-visible text. However, the existing order pages (`+page.svelte`, detail page, operations page) do NOT import paraglide messages — they hardcode Spanish strings directly. The `es.json` and `en.json` files have only 5 keys currently.

**Impact on planning:** Two options: (a) follow the existing pattern (hardcode Spanish, ignore the mandate), or (b) enforce the mandate and add i18n keys. Given the project is in Spanish-only operation with minimal i18n keys established, the planner should follow the existing codebase pattern (hardcode Spanish) for consistency. Flag this as a known deviation.

**Confidence:** HIGH [VERIFIED: orders page, operations page, messages/es.json direct read]

---

## Common Pitfalls

### Pitfall 1: Wizard Step Re-use Breaking Payment Step Submit Logic

**What goes wrong:** `payment-step.svelte` always submits to `POST /orders` (create). In edit mode, it must submit to `PUT /orders/${draft.id}`.
**Why it happens:** The existing wizard was only ever used for creation. The `isEditing` flag exists in `DraftOrder` but submit branching was never implemented.
**How to avoid:** In `payment-step.svelte`, branch on `draft?.isEditing`:
```typescript
const method = draft?.isEditing ? 'PUT' : 'POST';
const url = draft?.isEditing
  ? `${API_SALES}/orders/${draft.id}`
  : `${API_SALES}/orders`;
```
**Warning signs:** If the edit form creates a new order instead of updating — check that `isEditing` is `true` in `activeDraft`.

### Pitfall 2: Orphaned Checkout State After Edit Navigation

**What goes wrong:** After a successful edit, `orderWizardState.activeDraft` is not cleared, leaving stale state that infects the next "New Order" creation.
**Why it happens:** `completeActiveDraft()` only deletes draft from storage AND clears activeDraft. Edit mode drafts are not in storage, but `activeDraft` reference must still be cleared.
**How to avoid:** After successful PUT in payment-step, call `orderWizardState.clearActiveDraft()` (not `completeActiveDraft()` — which would attempt to delete by ID).

### Pitfall 3: TanStack Table Row Selection State and Column Definition Mismatch

**What goes wrong:** When `bulkMode` is toggled, the column definition changes (checkbox column is added/removed). TanStack's `createTable()` is called via `$derived`, so a column change triggers a full re-creation. Selected rows reset. But if `rowSelection` state retains stale row IDs, the table can error.
**Why it happens:** The table is recreated on state changes; row IDs from the old column set may not match the new table instance.
**How to avoid:** Reset `rowSelection = {}` when `bulkMode` is toggled off. Also reset when `data` changes.

### Pitfall 4: Flyway Migration on Already-Seeded Column (`delivered_at`)

**What goes wrong:** Writing `ALTER TABLE tco_order ADD COLUMN delivered_at TIMESTAMPTZ` fails on fresh DBs because `init.sql` already created the column.
**Why it happens:** `init.sql` is the initial schema, Flyway V1 is baseline. The column exists from init, not from a migration.
**How to avoid:** Use `ADD COLUMN IF NOT EXISTS` for `delivered_at`. For `pickup_code` (genuinely new), `ADD COLUMN` without guard is fine but using `IF NOT EXISTS` is idempotent and safe. Follow V2's established `IF NOT EXISTS` pattern.

### Pitfall 5: Role Restriction Applied Only on Frontend (Backend Left Open)

**What goes wrong:** OPERATOR can only edit certain fields on the frontend, but the backend `PUT /orders/{id}` accepts and applies any field from `CreateOrderRequest`.
**Why it happens:** The existing `updateOrder()` method applies all request fields without role checking.
**How to avoid:** The backend `SalesService.updateOrder()` must receive the caller's role and ignore garment/service/customer fields when role is `EMPLOYEE`. Both layers enforce the restriction independently (D-06 requirement).

### Pitfall 6: Bulk Delete Sending DELETE to Orders with Associated Work Orders

**What goes wrong:** `DELETE /orders/{id}` may return 409 if a work order references the sales order (as seen in the operations page). Bulk delete of DRAFT orders would not normally have work orders, but the pattern exists.
**Why it happens:** FK constraint with work orders.
**How to avoid:** The existing `handleCancel` / `handleCancelWorkOrder` code already handles this 409 with a toast. Replicate the same `ApiError && e.status === 409` guard in the bulk delete handler.

---

## Code Examples

### New Deliver Endpoint Pattern

```java
// Source: pattern from OrdersResource.java + CONTEXT.md D-13, D-14
@PATCH
@Path("/{id}/deliver")
public void deliverOrder(@PathParam("id") UUID id, Map<String, String> payload) {
    String pickupCode = payload.get("pickupCode");
    String userIdClaim = (String) jwt.getClaim("user_id");
    UUID userId = UUID.fromString(userIdClaim);
    salesService.deliverOrder(id, pickupCode, userId);
}
```

### New Flyway Migration Structure

```sql
-- V3__order_lifecycle_improvements.sql
-- Add pickup_code column (new — not in init.sql baseline)
ALTER TABLE tco_order
    ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(6);

-- delivered_at already exists in init.sql schema — add to OrderEntity only (Java side)
-- No SQL change needed for delivered_at

-- New audit log table (append-only, no soft delete needed)
CREATE TABLE IF NOT EXISTS tco_order_audit_log (
    id_audit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_order ON tco_order_audit_log(id_order);
```
[VERIFIED: follows V2 pattern with IF NOT EXISTS guards; tco_ prefix from CONVENTIONS.md]

### OrderEntity New Fields

```java
// Source: OrderEntity.java pattern — add alongside existing fields
@Column(name = "pickup_code", length = 6)
private String pickupCode;

@Column(name = "delivered_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
private OffsetDateTime deliveredAt;
```
[VERIFIED: existing field patterns in OrderEntity.java]

### Frontend Role Check (Edit Page)

```typescript
// In edit/+page.svelte
import { authService } from '$lib/services/auth.svelte';

const userRole = $derived(authService.user?.role ?? 'EMPLOYEE');
const isAdmin = $derived(userRole === 'ADMIN');
// Note: 'EMPLOYEE' maps to what CONTEXT.md calls 'OPERATOR'
```
[VERIFIED: same pattern used in /dashboard/+page.svelte and catalog pages]

### Bulk Action Floating Bar Component

```svelte
<!-- FloatingActionBar.svelte — new component -->
<script lang="ts">
  let { count, onStatusChange, onDelete, onCancel } = $props<{
    count: number;
    onStatusChange: () => void;
    onDelete: () => void;
    onCancel: () => void;
  }>();
</script>

{#if count > 0}
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
              bg-card border border-border rounded-xl shadow-xl px-5 py-3 touch-manipulation">
    <span class="text-sm font-bold">{count} seleccionadas</span>
    <Button onclick={onStatusChange}>Cambiar estado</Button>
    <Button variant="destructive" onclick={onDelete}>Eliminar</Button>
    <Button variant="ghost" onclick={onCancel}>Cancelar</Button>
  </div>
{/if}
```
[ASSUMED: visual design — follows project button and card patterns]

### OrderResponse DTO Extensions Needed

```java
// OrderResponse.java — add fields
private String pickupCode;
private OffsetDateTime deliveredAt;
```

```typescript
// dtos.ts — add to OrderResponse interface
export interface OrderResponse {
  // ... existing fields
  pickupCode?: string;      // Present for staff, null for not-yet-set
  deliveredAt?: string;     // ISO string when status=DELIVERED
  totalDurationMin: number; // Already in DTO but missing from TypeScript type
}
```
[VERIFIED: OrderResponse.java read; `totalDurationMin` IS in Java DTO but missing from TypeScript `OrderResponse` interface in dtos.ts — additional gap found]

---

## Runtime State Inventory

> This is not a rename/refactor/migration phase. No runtime state inventory required.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Java / Maven | Backend build | Assumed present | — | — |
| PostgreSQL | DB migrations | Assumed present via Docker | — | — |
| Bun | Frontend build | Assumed present | — | — |
| Docker Compose | Full-stack verification | Assumed present | — | — |

Step 2.6: No new external tool dependencies introduced in this phase. All dependencies are already part of the project's existing dev environment.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no Jest, Vitest, or pytest config found |
| Config file | None |
| Quick run command | `bun run build` (build gate only) |
| Full suite command | `bun run check` (svelte-check TypeScript validation) |

**No automated test suite exists in this project.** The build gate is `bun run build && bun run check`. Backend validation is `mvn quarkus:build -f anotame-api/backend/sales-service/pom.xml`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORDER-01 | Edit order page renders with wizard pre-populated | manual-only | — | N/A — no test infra |
| ORDER-01 | Role restriction: EMPLOYEE cannot change garment fields | manual-only | — | N/A |
| ORDER-01 | Status lock: DELIVERED/CANCELLED returns 409 | manual-only (API call) | — | N/A |
| ORDER-02 | Pickup code: 6-digit code generated at creation | manual-only | — | N/A |
| ORDER-02 | Delivery confirmation: wrong code rejected | manual-only (API call) | — | N/A |
| ORDER-02 | Bulk selection mode renders checkbox column | manual-only | — | N/A |

### Sampling Rate

- **Per task commit:** `bun run build && bun run check` (frontend); `mvn quarkus:build -pl sales-service` (backend)
- **Per wave merge:** Full-stack `docker compose up --build`
- **Phase gate:** Both build commands green + manual walkthrough of ORDER-01 and ORDER-02

### Wave 0 Gaps

No test infrastructure to create. Project has no automated test suite — build gates serve as the validation layer.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth flows |
| V3 Session Management | no | No session changes |
| V4 Access Control | yes | `jwt.getGroups()` role check; `@RolesAllowed` on admin-only endpoints |
| V5 Input Validation | yes | Zod 4 schema on frontend; `@Valid` + Bean Validation on backend DTOs |
| V6 Cryptography | yes | `MessageDigest.isEqual()` for timing-safe pickup code comparison |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| OPERATOR editing locked fields via direct API call | Tampering | Backend role check in SalesService.updateOrder() — not just frontend conditional |
| Timing attack on pickup code comparison | Information Disclosure | Use `MessageDigest.isEqual()` (constant-time) instead of `.equals()` |
| Bulk delete of non-DRAFT orders | Tampering | Backend: verify order status === "DRAFT" before deleting; 403 otherwise |
| Client-side `deliveredAt` injection | Tampering | `deliveredAt` assigned server-side only; never accepted from request body |
| Status bypass: client sets DELIVERED without pickup code | Tampering | The new `PATCH /orders/{id}/deliver` endpoint is the only path to DELIVERED status. The existing `PATCH /orders/{id}/status` endpoint must reject `DELIVERED` as a target status. |

**Critical security note on status endpoint:** The existing `updateOrderStatus()` in `SalesService` does no validation — it accepts any string. Phase 15 must add a guard: if target status is `"DELIVERED"`, reject with 400 and direct to the `/deliver` endpoint.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Wizard only for create | Wizard reused for edit (isEditing flag) | Phase 15 | `saveCurrentDraft()` already guards; submit URL must branch |
| Operations page: IN_PROGRESS only | Operations page: tabs for IN_PROGRESS + READY | Phase 15 | Tabs component already used elsewhere — same pattern |
| Single-item status change | Bulk status change | Phase 15 | Serial PATCH calls per item, error per item |

**Deprecated/outdated:**
- The `current_status` column in `init.sql` is redundant with `status`. `OrderEntity.java` maps only `status`. Do not add `current_status` to the entity.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `EMPLOYEE` role code is what CONTEXT.md means by `OPERATOR` (no `OPERATOR` code exists in DB) | Role Check Pattern + Frontend Role Check | If a new OPERATOR role is expected to be seeded, the Flyway migration must add it and the JWT must carry it. Plan would need an identity-service change. |
| A2 | Bulk actions are implemented as serial per-item API calls rather than a batch endpoint | Architecture Patterns | If performance is a concern, a single `POST /orders/batch-status` endpoint would be better but adds more backend work. |
| A3 | `pickupCode` validation uses constant-time comparison (`MessageDigest.isEqual`) | Pickup Code Pattern | If not required, `String.equals()` is simpler. No functional difference for 6-digit codes in a staff workflow. |
| A4 | Existing `delivered_at` column in `init.sql` means V3 migration only needs `IF NOT EXISTS` for that column | Flyway Migration | If `init.sql` was not applied to the target DB (fully Flyway-managed from V1), the column would be missing and the IF NOT EXISTS guard would ADD it correctly either way. Risk is low. |
| A5 | Paraglide i18n mandate is waived for this phase consistent with existing order page pattern (hardcoded Spanish) | Project Constraints | If enforced strictly, every user-visible string must have i18n keys added. Significant additional work. |

---

## Open Questions

1. **Is "OPERATOR" a new role code to be seeded, or is it "EMPLOYEE"?**
   - What we know: DB has only `ADMIN` and `EMPLOYEE`. CONTEXT.md says "OPERATOR" throughout.
   - What's unclear: Are these synonyms, or does Phase 15 need to seed a new `OPERATOR` role?
   - Recommendation: Treat `EMPLOYEE` == `OPERATOR` semantics without adding a new role. Flag to user before implementing D-04 / D-05.

2. **Should the existing `PATCH /orders/{id}/status` endpoint be hardened to reject DELIVERED?**
   - What we know: The endpoint accepts any string, no validation.
   - What's unclear: Was this intentional to allow direct DELIVERED transitions in other flows?
   - Recommendation: Yes, harden it. Return 400 if target is `DELIVERED` with message directing to `/deliver`.

3. **Wizard step free-navigation in edit mode (Claude's discretion)?**
   - What we know: Current wizard enforces linear step progression (onNext/onBack).
   - What's unclear: Should edit mode allow jumping between steps directly via the step indicator?
   - Recommendation: Allow step-jumping in edit mode by making the step number buttons clickable when `isEditing: true`. Simpler UX for staff who only want to change one step.

---

## Sources

### Primary (HIGH confidence)

- `anotame-api/backend/sales-service/src/main/java/...` — Direct code read of OrdersResource, SalesService, OrderEntity, OrderResponse
- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` — Direct read confirming TanStack API and Props type
- `anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts` — Direct read confirming isEditing flag and saveCurrentDraft guard
- `anotame-db/init.sql` — Direct read confirming tco_order schema and role seed data
- `.planning/codebase/CONVENTIONS.md` — Project conventions (Lombok, table prefixes, Flyway pattern)
- `anotame-api/backend/sales-service/src/main/resources/db/migration/` — Confirmed V1 and V2 exist; V3 is next
- `anotame-web/src/lib/services/auth.svelte.ts` — Confirmed `user.role` field and `authService.user` access pattern
- `anotame-api/backend/identity-service/.../JwtUtils.java` — Confirmed roles go into `groups` claim

### Secondary (MEDIUM confidence)

- `.planning/codebase/STRUCTURE.md` — Route structure for new file placement
- `.planning/phases/15-order-lifecycle-improvements/15-CONTEXT.md` — All locked decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified by direct codebase inspection
- Architecture patterns: HIGH — derived from verified existing code patterns
- Pitfalls: HIGH — identified from direct code reading (updateOrder signature, payment-step submit URL, init.sql vs OrderEntity divergence)
- Security: HIGH — JWT groups claim verified; constant-time comparison is standard Java

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable stack; re-verify if Quarkus or TanStack Table version bumped)
