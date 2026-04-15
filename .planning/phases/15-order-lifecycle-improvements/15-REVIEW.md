---
phase: 15-order-lifecycle-improvements
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - anotame-api/backend/sales-service/src/main/resources/db/migration/V3__order_lifecycle_improvements.sql
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderAuditLogEntity.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/repository/OrderAuditLogRepository.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderAuditLogRepositoryPort.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderAuditLogPersistenceAdapter.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/DeliverOrderRequest.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderPersistenceAdapter.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java
  - anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte
  - anotame-web/src/lib/types/dtos.ts
  - anotame-web/src/lib/components/orders/wizard/payment-step.svelte
  - anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte
  - anotame-web/src/routes/(app)/+layout.svelte
  - anotame-web/src/lib/components/ui/FloatingActionBar.svelte
  - anotame-web/src/lib/components/orders/pickup-code-dialog.svelte
  - anotame-web/src/lib/components/ui/DataTableWrapper.svelte
  - anotame-web/src/routes/(app)/dashboard/orders/+page.svelte
  - anotame-web/src/routes/(app)/dashboard/operations/+page.svelte
findings:
  critical: 2
  warning: 5
  info: 4
  total: 11
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-04-07
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

This phase implements order lifecycle improvements: a 6-digit pickup code for delivery confirmation, a `delivered_at` timestamp, per-field audit logging on order edits, a role-gated `updateOrder` endpoint, and a new Operations page with a pickup-code dialog for delivery flow.

The implementation is mostly solid. The core delivery flow, audit logging structure, and frontend components are well-constructed. However, there are two critical issues: unguarded JWT claim parsing in the controller that will throw a 500 on malformed tokens, and a hardcoded `quantity: 1` in the frontend payment step that silently drops user-entered quantities from submitted orders. There are also five warnings ranging from a missing audit entry on delivery to a frontend/backend DTO mismatch.

---

## Critical Issues

### CR-01: Unguarded JWT claim parsing in `updateOrder` and `deliverOrder` will throw 500

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java:84-95`

**Issue:** The `createOrder` endpoint (lines 31-59) validates the `user_id` JWT claim for null/empty before calling `UUID.fromString` and wraps the call in try/catch. The two new endpoints `updateOrder` (line 84) and `deliverOrder` (line 95) do neither. A missing or malformed `user_id` claim results in an unhandled `NullPointerException` or `IllegalArgumentException` that surfaces as a 500 instead of a 400/401.

**Fix:**
```java
// In updateOrder (line 84) and deliverOrder (line 95), replace the bare call with:
String userIdClaim = (String) jwt.getClaim("user_id");
if (userIdClaim == null || userIdClaim.isEmpty()) {
    throw new BadRequestException("Missing or invalid user_id claim in JWT token");
}
UUID userId;
try {
    userId = UUID.fromString(userIdClaim);
} catch (IllegalArgumentException e) {
    throw new BadRequestException("Invalid request format");
}
```

---

### CR-02: Hardcoded `quantity: 1` in payment-step discards user-entered quantities

**File:** `anotame-web/src/lib/components/orders/wizard/payment-step.svelte:65`

**Issue:** When building the order payload for both new order creation and edit submission, `quantity` is hardcoded to `1` instead of reading `item.quantity` from the draft. Any order with a quantity greater than 1 will be submitted with quantity 1, silently under-counting items. The backend's `totalAmount` calculation and `totalDurationMin` both depend on the submitted quantity, so the resulting order will have wrong totals.

**Fix:**
```typescript
const orderItems = (draft?.items || []).map((item: any) => ({
    garmentTypeId: item.garmentTypeId || item.garmentId || '',
    garmentName: item.garmentName || '',
    quantity: item.quantity ?? 1,   // <-- was hardcoded 1
    notes: item.notes || '',
    services: item.services?.map((s: any) => ({ ... })) || []
}));
```

---

## Warnings

### WR-01: `updateOrder` status validation is missing — any string can be written as order status

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java:337-343`

**Issue:** `updateOrderStatus` accepts any arbitrary string for `status` with no allowlist validation. A caller who holds a valid JWT can PATCH `/{id}/status` with `{"status": "FREEFORM_VALUE"}` and it will be persisted. The `deliverOrder` flow correctly enforces `READY` precondition, but `updateOrderStatus` has no guard at all.

**Fix:**
```java
private static final Set<String> VALID_STATUSES = Set.of(
    "RECEIVED", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"
);

public void updateOrderStatus(UUID id, String status) {
    if (!VALID_STATUSES.contains(status)) {
        throw new WebApplicationException(
            Response.status(400).entity(Map.of("error", "Estado inválido: " + status)).build()
        );
    }
    // ... existing logic
}
```

---

### WR-02: `deliverOrder` does not write an audit log entry

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java:346-376`

**Issue:** `updateOrder` meticulously records per-field audit entries for every changed field. `deliverOrder` transitions the order to `DELIVERED` and sets `deliveredAt` but does not write any audit log entry. The delivery event — who delivered it, and when — is therefore not captured in `tco_order_audit_log`, breaking the completeness of the audit trail.

**Fix:** Add an audit entry at the end of `deliverOrder` before saving:
```java
auditLogRepositoryPort.save(buildAuditEntry(
    orderId, userId, "status",
    "READY", "DELIVERED",
    OffsetDateTime.now()
));
```

---

### WR-03: `OrderAuditLogRepositoryPort` leaks infrastructure entity into application port (hexagonal architecture violation)

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderAuditLogRepositoryPort.java:5`

**Issue:** The port interface in the application layer accepts `OrderAuditLogEntity`, which is a JPA infrastructure entity. Per the project's hexagonal architecture rules (AI_RULES.md §2), domain and application layers must not depend on infrastructure types. This creates a tight coupling between the application service and the JPA persistence model.

**Fix:** Define a plain domain record or a dedicated DTO (e.g., `AuditLogEntry`) in the application layer, and have the persistence adapter map it to `OrderAuditLogEntity` internally:
```java
// application/port/output/OrderAuditLogRepositoryPort.java
public interface OrderAuditLogRepositoryPort {
    void save(AuditLogEntry entry); // AuditLogEntry is a plain domain record
}

// infrastructure/persistence/adapter/OrderAuditLogPersistenceAdapter.java
public void save(AuditLogEntry entry) {
    OrderAuditLogEntity entity = new OrderAuditLogEntity();
    entity.setOrderId(entry.orderId());
    // ... map fields
    auditLogRepository.save(entity);
}
```

---

### WR-04: `OrderResponse` TypeScript type declares a `balance` field that the Java backend never populates

**File:** `anotame-web/src/lib/types/dtos.ts:70`

**Issue:** The frontend `OrderResponse` interface declares `balance: number`, but the Java `OrderResponse.java` DTO (line 12-27) has no `balance` field and never serializes one. Any code reading `order.balance` will receive `undefined` at runtime despite the TypeScript type claiming a `number`. The order detail page already compensates by computing the balance inline (`(order.totalAmount || 0) - (order.amountPaid || 0)`), confirming this field is never populated from the API.

**Fix:** Either remove `balance` from the TypeScript interface (preferred — it is computed client-side wherever needed), or add `balance` to the Java DTO with server-side computation:
```typescript
// Option A — remove the phantom field from dtos.ts
export interface OrderResponse {
  // ... remove: balance: number;
}
```

---

### WR-05: Edit page catch block treats all errors as "not found"

**File:** `anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte:56-64`

**Issue:** The `onMount` catch block sets `notFound = true` for both `ApiError` with status 404 and all other errors (the `else` branch is also `notFound = true`). A network failure, 500 server error, or auth error will display "Pedido no encontrado" and the "Volver a la lista" button, which is misleading to the user.

**Fix:**
```typescript
} catch (e) {
    if (e instanceof ApiError && e.status === 404) {
        notFound = true;
    } else {
        // surface a generic error state instead
        toast.error('Error al cargar el pedido', { description: (e as any)?.message });
        goto('/dashboard/orders');
    }
}
```

---

## Info

### IN-01: `OrderEntity` does not use `@CreationTimestamp` / `@UpdateTimestamp` — diverges from project standard

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java:65-72`

**Issue:** AI_RULES.md §2 states "Every transactional table must include `created_at` (`@CreationTimestamp`) and `updated_at` (`@UpdateTimestamp`)". `OrderEntity` declares `created_at` and `updated_at` columns but sets them manually in `SalesService` via `OffsetDateTime.now(ZoneId.systemDefault())`. If `save()` is called without having set these fields (e.g., in a future code path), they will be null. `@CreationTimestamp` / `@UpdateTimestamp` provide a safer, automated guarantee.

**Fix:**
```java
@CreationTimestamp
@Column(name = "created_at", updatable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
private OffsetDateTime createdAt;

@UpdateTimestamp
@Column(name = "updated_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
private OffsetDateTime updatedAt;
```

Remove the manual `order.setCreatedAt(...)` and `order.setUpdatedAt(...)` calls from `SalesService`.

---

### IN-02: `OrderAuditLogEntity` sets `changedAt` manually instead of using `@CreationTimestamp`

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderAuditLogEntity.java:35`

**Issue:** `changedAt` is a creation-time field (the log is append-only) but is set by the service via `buildAuditEntry`. Using `@CreationTimestamp` is more idiomatic and consistent with project standards. If `changedAt` is accidentally not set before `persist`, the column's `NOT NULL DEFAULT NOW()` constraint will save it at the DB level, but Hibernate will have a null in memory until refresh.

**Fix:**
```java
@CreationTimestamp
@Column(name = "changed_at", nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE", updatable = false)
private OffsetDateTime changedAt;
```
Remove the `changedAt` parameter from `buildAuditEntry` in `SalesService`.

---

### IN-03: `ZoneId.systemDefault()` makes timestamp behavior JVM-dependent

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java:66-67, 213, 318, 341, 373-374`

**Issue:** All `OffsetDateTime.now(ZoneId.systemDefault())` calls produce timestamps whose offset depends on the JVM's default timezone. In a Docker container this is typically UTC, but it is not enforced. `deliverOrder` at line 373 already uses the parameterless `OffsetDateTime.now()` (which is system-default). This is inconsistent and fragile. Storing timestamps as UTC is safer and explicit.

**Fix:** Use `ZoneOffset.UTC` consistently:
```java
OffsetDateTime.now(ZoneOffset.UTC)
```

---

### IN-04: `updateOrder` ADMIN branch does not recalculate `totalDurationMin` (items without services)

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java:294-299`

**Issue:** The recalculation of `totalDurationMin` in the ADMIN branch (lines 294-299) filters items by `!item.isDeleted()`. `OrderItem` (domain model) has no `deleted` field, so `item.isDeleted()` will always be `false` (default boolean). The filter has no practical effect, but the call will still compile since Lombok generates a `isDeleted()` getter for the `deleted` field. This is dead code that creates confusion about whether soft-deleted items are expected on domain model objects. The `createOrder` path (lines 76-120) does not have this filter. These paths should be consistent.

**Fix:** Remove the `.filter(item -> !item.isDeleted())` from the recalculation since domain `OrderItem` objects are freshly constructed from the request and are never soft-deleted:
```java
int totalDuration = order.getItems().stream()
    .mapToInt(item -> item.getServices().stream()
        .mapToInt(s -> s.getDurationMin() != null ? s.getDurationMin() : 0)
        .sum() * (item.getQuantity() != null ? item.getQuantity() : 1))
    .sum();
```

---

_Reviewed: 2026-04-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
