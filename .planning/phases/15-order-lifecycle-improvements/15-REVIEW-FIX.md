---
phase: 15-order-lifecycle-improvements
fixed_at: 2026-04-08T00:00:00Z
review_path: .planning/phases/15-order-lifecycle-improvements/15-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 6
skipped: 1
status: partial
---

# Phase 15: Code Review Fix Report

**Fixed at:** 2026-04-08
**Source review:** .planning/phases/15-order-lifecycle-improvements/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (CR-01, CR-02, WR-01, WR-02, WR-03, WR-04, WR-05)
- Fixed: 6
- Skipped: 1

## Fixed Issues

### CR-02: Hardcoded `quantity: 1` in payment-step discards user-entered quantities

**Files modified:** `anotame-web/src/lib/components/orders/wizard/payment-step.svelte`
**Commit:** 7d0ec66
**Applied fix:** Changed `quantity: 1` to `quantity: item.quantity ?? 1` in the `orderItems` mapping inside `onUpdate`, so the user-entered quantity from the wizard draft is preserved when building the order payload for both new creation and edit submission.

---

### WR-01: `updateOrderStatus` accepts any arbitrary string status — no allowlist

**Files modified:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`
**Commit:** a23cf42
**Applied fix:** Added a `private static final Set<String> VALID_STATUSES` constant containing `RECEIVED`, `IN_PROGRESS`, `READY`, `DELIVERED`, `CANCELLED`. Added a null/allowlist guard at the top of `updateOrderStatus` that throws a `WebApplicationException` with HTTP 400 and a descriptive error message for any invalid status value. Also added `java.util.Set` to imports.

---

### WR-02: `deliverOrder` writes no audit log entry

**Files modified:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`
**Commit:** 4609d35
**Applied fix:** Captured `OffsetDateTime.now()` into a `deliveredAt` local variable and used it for both `order.setDeliveredAt(deliveredAt)` and the new `auditLogRepositoryPort.save(buildAuditEntry(...))` call after `orderRepository.save(order)`, recording the status transition from `READY` to `DELIVERED` with the acting user ID and timestamp.

---

### WR-03: `OrderAuditLogRepositoryPort` leaks a JPA entity into the application layer

**Files modified:**
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/AuditLogEntry.java` (new file)
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderAuditLogRepositoryPort.java`
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderAuditLogPersistenceAdapter.java`
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`

**Commit:** a2ab47f
**Applied fix:** Created a new `AuditLogEntry` Java record in the application port output package with fields matching the audit log (orderId, userId, fieldName, oldValue, newValue, changedAt). Updated `OrderAuditLogRepositoryPort` to accept `AuditLogEntry` instead of `OrderAuditLogEntity`. Updated `OrderAuditLogPersistenceAdapter` to map the record fields onto a new `OrderAuditLogEntity` before persisting. Updated `SalesService` to replace the `OrderAuditLogEntity` import with `AuditLogEntry`, and rewrote `buildAuditEntry` to return `new AuditLogEntry(...)` using the record constructor.

---

### WR-04: `OrderResponse` TypeScript type declares `balance` field that the backend never populates

**Files modified:** `anotame-web/src/lib/types/dtos.ts`
**Commit:** e0f8e7f
**Applied fix:** Removed the `balance: number` field from the `OrderResponse` interface. The balance is computed client-side inline wherever needed (e.g., `(order.totalAmount || 0) - (order.amountPaid || 0)`), so the phantom field was providing false type safety.

---

### WR-05: Edit page catch block displays "not found" for all error types

**Files modified:** `anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte`
**Commit:** 23845c8
**Applied fix:** Replaced the uniform `notFound = true` else-branch with differentiated error handling: HTTP 404 still sets `notFound = true`; HTTP 401 redirects to `/login`; all other errors (network failures, 5xx, etc.) show a `toast.error` with the error message and redirect to `/dashboard/orders`. Added `import { toast } from 'svelte-sonner'` which was not previously imported in this file.

---

## Skipped Issues

### CR-01: Unguarded JWT claim parsing in `updateOrder`/`deliverOrder` throws 500

**File:** `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java:84-95`
**Reason:** skipped: code context differs from review — fix already applied in current codebase. Both `updateOrder` (lines 84-95) and `deliverOrder` (lines 104-119) already contain the null/empty check on `userIdClaim` and the try/catch around `UUID.fromString`, matching the pattern used in `createOrder`. No change was needed.
**Original issue:** `UUID.fromString((String) jwt.getClaim("user_id"))` had no null-check or try/catch in `updateOrder` and `deliverOrder`, risking 500 on missing/malformed JWT claim.

---

_Fixed: 2026-04-08_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
