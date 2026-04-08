---
phase: 15-order-lifecycle-improvements
plan: 01
subsystem: api
tags: [quarkus, java, flyway, postgres, jpa, jwt, sales-service, order-lifecycle, audit-log]

# Dependency graph
requires: []
provides:
  - "Flyway V3 migration: pickup_code column on tco_order + tco_order_audit_log table"
  - "OrderEntity with pickupCode and deliveredAt JPA fields"
  - "OrderResponse DTO with pickupCode and deliveredAt"
  - "Order domain model with pickupCode and deliveredAt"
  - "OrderAuditLogEntity, OrderAuditLogRepository, OrderAuditLogRepositoryPort, OrderAuditLogPersistenceAdapter"
  - "DeliverOrderRequest DTO with 6-digit code validation"
  - "SalesService.createOrder() with ThreadLocalRandom 6-digit pickup code generation"
  - "SalesService.updateOrder(id, request, userId, role) with status lock + role-restricted fields + field audit log"
  - "SalesService.deliverOrder() with MessageDigest.isEqual constant-time pickup code verification and server-side deliveredAt"
  - "PATCH /orders/{id}/deliver endpoint in OrdersResource"
affects:
  - 15-02-frontend-order-edit
  - 15-03-frontend-deliver

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Field-level audit log: one OrderAuditLogEntity row per changed field per updateOrder() call"
    - "Role-restricted service method: (userId, role) passed from controller JWT extraction to service"
    - "Constant-time secret comparison: MessageDigest.isEqual() for pickup code validation"
    - "Hexagonal port/adapter for audit log: OrderAuditLogRepositoryPort -> OrderAuditLogPersistenceAdapter -> OrderAuditLogRepository"

key-files:
  created:
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V3__order_lifecycle_improvements.sql
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderAuditLogEntity.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/repository/OrderAuditLogRepository.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderAuditLogRepositoryPort.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderAuditLogPersistenceAdapter.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/DeliverOrderRequest.java
  modified:
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderPersistenceAdapter.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java

key-decisions:
  - "Domain model (Order.java) extended with pickupCode and deliveredAt — SalesService works with domain objects, not entities directly, so the fields must live on the domain model and be mapped through OrderPersistenceAdapter"
  - "Role check uses EMPLOYEE (not OPERATOR) string literal, per research finding that JWT groups claim uses EMPLOYEE for operator-level users"
  - "EMPLOYEE role silently ignores garment/service item changes in updateOrder() — no error thrown, only notes/deadline/payment are applied"
  - "Audit log written for notes, committedDeadline, amountPaid, and paymentMethod fields (fields accessible to both ADMIN and EMPLOYEE)"

patterns-established:
  - "Audit log pattern: compare old vs new with Objects.equals() before writing to avoid spurious entries"
  - "JWT role extraction: jwt.getGroups().stream().findFirst().orElse(EMPLOYEE) in controller, passed to service"
  - "Constant-time comparison: MessageDigest.isEqual() for any secret/code validation to prevent timing attacks"

requirements-completed:
  - ORDER-01
  - ORDER-02

# Metrics
duration: 35min
completed: 2026-04-07
---

# Phase 15 Plan 01: Order Lifecycle Improvements — Backend Foundation Summary

**Flyway V3 schema migration with pickup_code column and audit log table, plus SalesService delivering role-restricted editing with field audit trail, 6-digit pickup code generation, and constant-time PATCH /deliver endpoint**

## Performance

- **Duration:** 35 min
- **Started:** 2026-04-07T00:00:00Z
- **Completed:** 2026-04-07T00:35:00Z
- **Tasks:** 2
- **Files modified:** 10 (6 created, 4 modified + 2 already in Task 1 scope)

## Accomplishments

- Flyway V3 migration adds `pickup_code VARCHAR(6)` column to `tco_order` and creates `tco_order_audit_log` append-only table with cascade delete and index
- SalesService generates a random 6-digit pickup code at order creation, enforces status lock (409) on DELIVERED/CANCELLED orders during edit, applies role-restricted field writes (ADMIN vs EMPLOYEE), and writes per-field audit log entries
- New `deliverOrder()` method with `MessageDigest.isEqual()` constant-time pickup code validation and server-side `deliveredAt` assignment; exposed via `PATCH /orders/{id}/deliver`

## Task Commits

Each task was committed atomically:

1. **Task 1: Flyway migration V3 + OrderEntity + OrderResponse + audit log infra** - `8d159e4` (feat)
2. **Task 2: SalesService + OrdersResource — audit log, pickup code, status lock, deliver endpoint** - `56bf15d` (feat)

## Files Created/Modified

- `V3__order_lifecycle_improvements.sql` - Adds pickup_code column, creates tco_order_audit_log table + index
- `OrderAuditLogEntity.java` - JPA entity for field-level audit log (@Getter @Setter, no @Data per convention)
- `OrderAuditLogRepository.java` - PanacheRepository with save() method
- `OrderAuditLogRepositoryPort.java` - Port interface in application/port/output/
- `OrderAuditLogPersistenceAdapter.java` - Adapter wiring port to repository (@RequiredArgsConstructor)
- `DeliverOrderRequest.java` - DTO with @NotBlank @Size(6,6) @Pattern([0-9]{6}) validation
- `OrderEntity.java` - Added pickupCode and deliveredAt JPA fields
- `OrderResponse.java` - Added pickupCode and deliveredAt fields to response DTO
- `Order.java` (domain model) - Added pickupCode and deliveredAt fields
- `OrderPersistenceAdapter.java` - Maps pickupCode and deliveredAt in both save() and toDomain()
- `SalesService.java` - Complete rewrite with all new features
- `OrdersResource.java` - Updated updateOrder() to pass userId+role, added PATCH /{id}/deliver endpoint

## Decisions Made

- Extended the domain `Order` model with `pickupCode` and `deliveredAt` fields rather than bypassing the hexagonal boundary to work directly with `OrderEntity`. This maintains architectural consistency — `SalesService` exclusively uses domain objects via `OrderRepositoryPort`.
- Role string uses `"EMPLOYEE"` (not `"OPERATOR"`) per the research finding that JWT `groups` claim contains `EMPLOYEE` for operator-level users.
- EMPLOYEE role silently ignores garment/service item changes — no error is thrown, only allowed fields (notes, deadline, payment) are applied. This matches the UX design where the edit form will hide those fields for EMPLOYEE users.
- Audit log captures notes, committedDeadline, amountPaid, and paymentMethod — fields writable by both ADMIN and EMPLOYEE. ADMIN-only field changes (garment/service changes) are implicitly audited via item replacement but not per-field logged in this phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Extended Order domain model with pickupCode and deliveredAt**
- **Found during:** Task 1 (planning the implementation approach)
- **Issue:** Plan specified adding fields to `OrderEntity` and using `orderRepository.findById()` in `SalesService.deliverOrder()`, but `SalesService` exclusively works with domain `Order` objects via `OrderRepositoryPort`. Without `pickupCode` on the domain model, the service would have no access to the pickup code for comparison.
- **Fix:** Added `pickupCode` and `deliveredAt` to `Order.java` domain model; updated `OrderPersistenceAdapter.save()` to map new fields entity→domain, and `toDomain()` to map domain→entity.
- **Files modified:** `Order.java`, `OrderPersistenceAdapter.java`
- **Verification:** Build passes; `deliverOrder()` correctly accesses `order.getPickupCode()` via domain model
- **Committed in:** `8d159e4` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical functionality for hexagonal boundary correctness)
**Impact on plan:** Required for architectural correctness. No scope creep — the extra domain model fields are the minimum needed to make the plan's intended implementation work within the existing hexagonal architecture.

## Issues Encountered

None — build passed cleanly on both Task 1 and Task 2.

## User Setup Required

None — no external service configuration required. The Flyway V3 migration will apply automatically on next service startup.

## Next Phase Readiness

- Backend foundation complete: schema, pickup code generation, status lock, role-restricted editing, audit log, and deliver endpoint are all live
- Wave 2 frontend plans can now integrate against the updated API contract: `pickupCode` in `OrderResponse`, `PUT /orders/{id}` with role enforcement, `PATCH /orders/{id}/deliver`
- Verification steps (steps 2-6 in the plan's `<verification>` section) require a running Docker environment with Flyway migration applied

---
*Phase: 15-order-lifecycle-improvements*
*Completed: 2026-04-07*
