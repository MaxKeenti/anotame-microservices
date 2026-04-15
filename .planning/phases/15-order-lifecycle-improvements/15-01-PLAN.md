---
phase: 15-order-lifecycle-improvements
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - anotame-api/backend/sales-service/src/main/resources/db/migration/V3__order_lifecycle_improvements.sql
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderAuditLogEntity.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/repository/OrderAuditLogRepository.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderAuditLogRepositoryPort.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderAuditLogPersistenceAdapter.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/DeliverOrderRequest.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java
  - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java
autonomous: true
requirements:
  - ORDER-01
  - ORDER-02

must_haves:
  truths:
    - "PUT /orders/{id} returns 409 for DELIVERED or CANCELLED orders"
    - "PUT /orders/{id} with EMPLOYEE role ignores garment/service/customer fields"
    - "PATCH /orders/{id}/deliver validates pickup code with constant-time comparison and sets deliveredAt server-side"
    - "A 6-digit pickup code is generated at order creation and stored in tco_order.pickup_code"
    - "One order_audit_log row is written per changed field per save in updateOrder()"
    - "OrderResponse includes pickupCode and deliveredAt fields"
  artifacts:
    - path: "anotame-api/backend/sales-service/src/main/resources/db/migration/V3__order_lifecycle_improvements.sql"
      provides: "Flyway migration: pickup_code column + tco_order_audit_log table"
      contains: "pickup_code"
    - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderAuditLogEntity.java"
      provides: "JPA entity for audit log"
      exports: ["OrderAuditLogEntity"]
    - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java"
      provides: "Updated service with audit log, pickup code gen, deliverOrder(), status lock"
      contains: "deliverOrder"
    - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java"
      provides: "PATCH /{id}/deliver endpoint + updated PUT /{id} with role + status lock"
      contains: "deliverOrder"
  key_links:
    - from: "OrdersResource.deliverOrder()"
      to: "SalesService.deliverOrder()"
      via: "pickupCode parameter"
      pattern: "salesService.deliverOrder"
    - from: "SalesService.updateOrder()"
      to: "OrderAuditLogPersistenceAdapter"
      via: "auditLogRepositoryPort.save()"
      pattern: "auditLogRepositoryPort"
    - from: "SalesService.createOrder()"
      to: "OrderEntity.pickupCode"
      via: "ThreadLocalRandom code generation"
      pattern: "setPickupCode"
---

<objective>
Backend foundation for Phase 15: schema migration, pickup code generation and delivery validation, field-level audit log, role-restricted order editing with status lock, and the new PATCH /deliver endpoint.

Purpose: All frontend plans (Wave 2, Wave 3) depend on these backend changes being correct and deployed. The schema changes (pickup_code, tco_order_audit_log) and new service methods form the data contract the frontend consumes.
Output: Running sales-service with new DB schema, updated endpoints, and audit log infra.
</objective>

<execution_context>
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/ROADMAP.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/phases/15-order-lifecycle-improvements/15-CONTEXT.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/phases/15-order-lifecycle-improvements/15-RESEARCH.md

<interfaces>
<!-- Key existing code the executor must read before modifying. Extracted from codebase. -->

From OrderEntity.java (existing fields pattern):
```java
// Framework: Quarkus 3 / Panache / Jakarta JPA
@Entity
@Table(name = "tco_order")
@Getter @Setter   // Lombok — NOT @Data on @Entity classes
@SQLDelete(sql = "UPDATE tco_order SET is_deleted = true WHERE id_order = ?")
@SQLRestriction("is_deleted = false")
// Fields use @Column(name = "snake_case")
// Timestamps: @Column(name = "delivered_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
// Status stored as String — e.g. private String status;
```

From SalesService.java (existing method signatures to extend):
```java
// Current: updateOrder(UUID id, CreateOrderRequest request)
// New:     updateOrder(UUID id, CreateOrderRequest request, UUID userId, String role)
// Current: createOrder(CreateOrderRequest request, UUID userId)  -- add pickupCode generation here
```

From OrdersResource.java (existing endpoints):
```java
// PUT /{id}   -> updateOrder
// PATCH /{id}/status  -> updateOrderStatus
// New: PATCH /{id}/deliver -> deliverOrder
// JWT injection: @Inject JsonWebToken jwt;
// Extract userId: UUID.fromString((String) jwt.getClaim("user_id"))
// Extract role:   jwt.getGroups().stream().findFirst().orElse("EMPLOYEE")
```

From OrderResponse.java (fields to add):
```java
// Add: private String pickupCode;
// Add: private OffsetDateTime deliveredAt;
```

Flyway migration convention (from V2):
```sql
-- V3__order_lifecycle_improvements.sql
-- Use IF NOT EXISTS guards (V2 pattern)
-- Table prefix: tco_
-- Column names: snake_case
-- delivered_at already exists in init.sql schema — only add to Java entity, no SQL ALTER needed
-- pickup_code is new: ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(6)
```

Role codes (CRITICAL — from Finding 1 in RESEARCH.md):
- 'EMPLOYEE' = what CONTEXT.md calls 'OPERATOR'
- 'ADMIN' = ADMIN
- NEVER use 'OPERATOR' string in code
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Flyway migration V3 + OrderEntity + OrderResponse + audit log infra</name>
  <files>
    anotame-api/backend/sales-service/src/main/resources/db/migration/V3__order_lifecycle_improvements.sql,
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java,
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java,
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderAuditLogEntity.java,
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/repository/OrderAuditLogRepository.java,
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderAuditLogRepositoryPort.java,
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderAuditLogPersistenceAdapter.java,
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/DeliverOrderRequest.java
  </files>

  <read_first>
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V2__add_unit_price_to_order_item.sql (IF NOT EXISTS guard pattern)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java (existing fields, column annotations, Lombok pattern)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java (existing fields, add pickupCode + deliveredAt)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderItemEntity.java (reference for @Getter @Setter, @SQLDelete pattern)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/repository/ (existing Panache repo pattern)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/ (existing port interface pattern)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/ (existing adapter pattern)
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V1__baseline.sql (check tco_order columns to confirm delivered_at exists and pickup_code does not)
  </read_first>

  <action>
**V3__order_lifecycle_improvements.sql** — Create with the following exact SQL:
```sql
-- Add pickup_code to tco_order (new column — not in init.sql baseline)
ALTER TABLE tco_order
    ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(6);

-- delivered_at already declared in init.sql schema — no SQL ALTER needed here.
-- Only the Java entity field is missing and will be added below.

-- Field-level audit log table (append-only — no soft delete needed per D-07)
CREATE TABLE IF NOT EXISTS tco_order_audit_log (
    id_audit           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_order           UUID NOT NULL REFERENCES tco_order(id_order) ON DELETE CASCADE,
    user_id            UUID NOT NULL,
    field_name         VARCHAR(100) NOT NULL,
    old_value          TEXT,
    new_value          TEXT,
    changed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_order ON tco_order_audit_log(id_order);
```

**OrderEntity.java** — Add these two fields alongside existing fields (do NOT touch any existing field, annotation, or Lombok setup):
```java
@Column(name = "pickup_code", length = 6)
private String pickupCode;

@Column(name = "delivered_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
private OffsetDateTime deliveredAt;
```
Import `java.time.OffsetDateTime` if not already present.

**OrderResponse.java** — Add these two fields (keep all existing fields unchanged):
```java
private String pickupCode;
private OffsetDateTime deliveredAt;
```
These are mapped from `OrderEntity` in `SalesService.mapToResponse()` — that wiring happens in Task 2.

**OrderAuditLogEntity.java** — New file following exact project JPA entity conventions (Lombok @Getter @Setter, NOT @Data):
```java
package com.anotame.sales.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tco_order_audit_log")
@Getter
@Setter
public class OrderAuditLogEntity {

    @Id
    @GeneratedValue
    @Column(name = "id_audit", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "id_order", nullable = false)
    private UUID orderId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "changed_at", nullable = false, columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime changedAt;
}
```

**OrderAuditLogRepository.java** — New file following existing Panache repository pattern. Look at an existing repository in the same package to confirm the exact pattern (PanacheRepository or PanacheRepositoryBase). Create analogously:
```java
package com.anotame.sales.infrastructure.persistence.repository;

import com.anotame.sales.infrastructure.persistence.entity.OrderAuditLogEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.UUID;

@ApplicationScoped
public class OrderAuditLogRepository implements PanacheRepository<OrderAuditLogEntity> {
    public void save(OrderAuditLogEntity entry) {
        persist(entry);
    }
}
```

**OrderAuditLogRepositoryPort.java** — New port interface in `application/port/output/`:
```java
package com.anotame.sales.application.port.output;

import com.anotame.sales.infrastructure.persistence.entity.OrderAuditLogEntity;

public interface OrderAuditLogRepositoryPort {
    void save(OrderAuditLogEntity entry);
}
```

**OrderAuditLogPersistenceAdapter.java** — New adapter wiring the port to the repo. Follow the same pattern as existing adapters in `infrastructure/persistence/adapter/`. Inject `OrderAuditLogRepository` and delegate `save()`:
```java
package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.OrderAuditLogRepositoryPort;
import com.anotame.sales.infrastructure.persistence.entity.OrderAuditLogEntity;
import com.anotame.sales.infrastructure.persistence.repository.OrderAuditLogRepository;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;

@ApplicationScoped
@RequiredArgsConstructor
public class OrderAuditLogPersistenceAdapter implements OrderAuditLogRepositoryPort {

    private final OrderAuditLogRepository auditLogRepository;

    @Override
    public void save(OrderAuditLogEntity entry) {
        auditLogRepository.save(entry);
    }
}
```

**DeliverOrderRequest.java** — New DTO in `application/dto/`:
```java
package com.anotame.sales.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class DeliverOrderRequest {

    @NotBlank
    @Size(min = 6, max = 6)
    @Pattern(regexp = "[0-9]{6}")
    private String pickupCode;

    public String getPickupCode() { return pickupCode; }
    public void setPickupCode(String pickupCode) { this.pickupCode = pickupCode; }
}
```
  </action>

  <verify>
    <automated>mvn quarkus:build -f "anotame-api/backend/sales-service/pom.xml" -q 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - V3__order_lifecycle_improvements.sql contains `ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(6)`
    - V3__order_lifecycle_improvements.sql contains `CREATE TABLE IF NOT EXISTS tco_order_audit_log`
    - V3__order_lifecycle_improvements.sql contains `REFERENCES tco_order(id_order) ON DELETE CASCADE`
    - V3__order_lifecycle_improvements.sql contains `CREATE INDEX IF NOT EXISTS idx_audit_order`
    - OrderEntity.java contains `private String pickupCode`
    - OrderEntity.java contains `private OffsetDateTime deliveredAt`
    - OrderResponse.java contains `private String pickupCode`
    - OrderResponse.java contains `private OffsetDateTime deliveredAt`
    - OrderAuditLogEntity.java exists with `@Table(name = "tco_order_audit_log")`
    - OrderAuditLogEntity.java contains `@Getter` and `@Setter` (NOT @Data)
    - OrderAuditLogRepository.java exists and implements `PanacheRepository`
    - OrderAuditLogRepositoryPort.java exists in `application/port/output/`
    - OrderAuditLogPersistenceAdapter.java exists and implements `OrderAuditLogRepositoryPort`
    - DeliverOrderRequest.java exists in `application/dto/` with `getPickupCode()`
    - `mvn quarkus:build` exits 0
  </acceptance_criteria>

  <done>All schema and infra classes compile. Migration file is valid SQL. OrderEntity has pickupCode and deliveredAt fields. Audit log port/adapter/repo chain exists. DeliverOrderRequest DTO exists.</done>
</task>

<task type="auto">
  <name>Task 2: SalesService + OrdersResource — audit log, pickup code, status lock, deliver endpoint</name>
  <files>
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java,
    anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java
  </files>

  <read_first>
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java (full file — current method signatures for createOrder, updateOrder, updateOrderStatus, mapToResponse)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java (full file — existing endpoints, JWT injection pattern, @RolesAllowed usage)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/DeliverOrderRequest.java (just created in Task 1 — verify the class exists)
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/port/output/OrderAuditLogRepositoryPort.java (just created in Task 1)
  </read_first>

  <action>
**SalesService.java changes:**

1. **Inject `OrderAuditLogRepositoryPort`** — Add as a constructor-injected `final` field (per @RequiredArgsConstructor pattern). Import the interface.

2. **`createOrder()` — generate pickup code** — After creating the `OrderEntity` and before persisting, add:
```java
int code = ThreadLocalRandom.current().nextInt(100_000, 1_000_000);
orderEntity.setPickupCode(String.format("%06d", code));
```
Import `java.util.concurrent.ThreadLocalRandom`.

3. **`updateOrder()` — change signature** — Change from:
```java
public OrderResponse updateOrder(UUID id, CreateOrderRequest request)
```
to:
```java
public OrderResponse updateOrder(UUID id, CreateOrderRequest request, UUID userId, String role)
```

4. **`updateOrder()` — status lock** — At the START of the method body, before any other logic, load the existing order entity and check:
```java
OrderEntity existing = orderRepository.findById(id)
    .orElseThrow(() -> new jakarta.ws.rs.WebApplicationException(
        jakarta.ws.rs.Response.status(404).entity(Map.of("error", "Pedido no encontrado")).build()
    ));

if ("DELIVERED".equals(existing.getStatus()) || "CANCELLED".equals(existing.getStatus())) {
    throw new jakarta.ws.rs.WebApplicationException(
        jakarta.ws.rs.Response.status(409)
            .entity(Map.of("error", "No se puede editar un pedido entregado o cancelado"))
            .build()
    );
}
```

5. **`updateOrder()` — role restriction** — When role is "EMPLOYEE" (not "ADMIN"), skip applying garment/service/customer fields from the request. Apply ONLY: notes/observations, committedDeadline (due date), and paymentStatus. The specific fields to skip depend on what `CreateOrderRequest` contains — read the DTO to confirm field names, then conditionally apply them:
```java
if ("ADMIN".equals(role)) {
    // apply ALL fields from request including customer, garment, services
    existing.setCustomerId(request.getCustomerId()); // adjust field names per actual DTO
    // ... all other fields
} else {
    // EMPLOYEE (OPERATOR): only notes, committedDeadline, paymentStatus
    existing.setNotes(request.getNotes());
    existing.setCommittedDeadline(request.getCommittedDeadline());
    existing.setPaymentStatus(request.getPaymentStatus());
}
```
Read `CreateOrderRequest.java` to get exact field names before implementing.

6. **`updateOrder()` — audit log** — After loading the existing order, before applying updates, compare old vs new values and write one audit log entry per changed field. Auditable fields: `notes`, `committedDeadline`, `paymentStatus`, and (for ADMIN only) `customerId`, `status`. Pattern:
```java
OffsetDateTime now = OffsetDateTime.now();
// For each auditable field where !Objects.equals(existing.getXxx(), request.getXxx()):
OrderAuditLogEntity entry = new OrderAuditLogEntity();
entry.setOrderId(id);
entry.setUserId(userId);
entry.setFieldName("notes"); // use the actual field name string
entry.setOldValue(existing.getNotes() != null ? existing.getNotes() : null);
entry.setNewValue(request.getNotes() != null ? request.getNotes() : null);
entry.setChangedAt(now);
auditLogRepositoryPort.save(entry);
```
Repeat the block for each auditable field. Use `Objects.equals()` to compare before writing to avoid spurious entries.

7. **`mapToResponse()` — add pickupCode and deliveredAt** — Add mapping for the two new fields:
```java
response.setPickupCode(entity.getPickupCode());
response.setDeliveredAt(entity.getDeliveredAt());
```

8. **New `deliverOrder()` method** — Add to `SalesService`:
```java
public void deliverOrder(UUID orderId, String pickupCode, UUID userId) {
    OrderEntity order = orderRepository.findById(orderId)
        .orElseThrow(() -> new jakarta.ws.rs.WebApplicationException(
            jakarta.ws.rs.Response.status(404).entity(Map.of("error", "Pedido no encontrado")).build()
        ));

    if (!"READY".equals(order.getStatus())) {
        throw new jakarta.ws.rs.WebApplicationException(
            jakarta.ws.rs.Response.status(409)
                .entity(Map.of("error", "Solo se pueden entregar pedidos en estado LISTO"))
                .build()
        );
    }

    boolean valid = MessageDigest.isEqual(
        order.getPickupCode().getBytes(java.nio.charset.StandardCharsets.UTF_8),
        pickupCode.getBytes(java.nio.charset.StandardCharsets.UTF_8)
    );
    if (!valid) {
        throw new jakarta.ws.rs.WebApplicationException(
            jakarta.ws.rs.Response.status(400)
                .entity(Map.of("error", "Código de recogida incorrecto"))
                .build()
        );
    }

    order.setStatus("DELIVERED");
    order.setDeliveredAt(OffsetDateTime.now());
    // No explicit persist() needed if order is already managed by Panache/JPA session
}
```
Import `java.security.MessageDigest`, `java.nio.charset.StandardCharsets`.

**OrdersResource.java changes:**

1. **Update `updateOrder()` endpoint** — Change the method to extract `userId` and `role` from JWT, and pass to service:
```java
@PUT
@Path("/{id}")
public OrderResponse updateOrder(@PathParam("id") UUID id,
                                  @jakarta.validation.Valid CreateOrderRequest request) {
    UUID userId = UUID.fromString((String) jwt.getClaim("user_id"));
    String role = jwt.getGroups().stream().findFirst().orElse("EMPLOYEE");
    return salesService.updateOrder(id, request, userId, role);
}
```

2. **Add new `deliverOrder()` endpoint**:
```java
@PATCH
@Path("/{id}/deliver")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public jakarta.ws.rs.core.Response deliverOrder(@PathParam("id") UUID id,
                                                  @jakarta.validation.Valid DeliverOrderRequest body) {
    UUID userId = UUID.fromString((String) jwt.getClaim("user_id"));
    salesService.deliverOrder(id, body.getPickupCode(), userId);
    return jakarta.ws.rs.core.Response.ok().build();
}
```
Add import for `DeliverOrderRequest`.
  </action>

  <verify>
    <automated>mvn quarkus:build -f "anotame-api/backend/sales-service/pom.xml" -q 2>&1 | tail -5</automated>
  </verify>

  <acceptance_criteria>
    - SalesService.java contains `updateOrder(UUID id, CreateOrderRequest request, UUID userId, String role)`
    - SalesService.java contains `deliverOrder(UUID orderId, String pickupCode, UUID userId)`
    - SalesService.java contains `MessageDigest.isEqual`
    - SalesService.java contains `ThreadLocalRandom.current().nextInt(100_000, 1_000_000)`
    - SalesService.java contains `"DELIVERED".equals` and `"CANCELLED".equals` (status lock check)
    - SalesService.java contains `auditLogRepositoryPort.save(`
    - SalesService.java contains `response.setPickupCode(`
    - SalesService.java contains `order.setDeliveredAt(OffsetDateTime.now())`
    - OrdersResource.java contains `PATCH` and `deliver` (the deliver endpoint)
    - OrdersResource.java updateOrder method passes role to salesService
    - `mvn quarkus:build` exits 0
  </acceptance_criteria>

  <done>SalesService has: status lock (409), role-restricted field application, field-level audit log, pickup code generation at creation, deliverOrder() with constant-time comparison and server-side deliveredAt. OrdersResource exposes PATCH /{id}/deliver endpoint. Build passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → PUT /orders/{id} | Untrusted request body; role claim from JWT |
| client → PATCH /orders/{id}/deliver | Pickup code from request body; must not trust client-provided timestamp |
| JWT → role extraction | `groups` claim controls field-level write permission |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-15-01 | Elevation of Privilege | PUT /orders/{id} — field-level role restriction | mitigate | SalesService.updateOrder() checks role="ADMIN" before applying customer/garment/service fields; EMPLOYEE role silently ignores those fields (ASVS L1: access control per resource action) |
| T-15-02 | Tampering | PUT /orders/{id} — editing DELIVERED/CANCELLED orders | mitigate | Status lock check in SalesService returns 409 before any field is written; enforced on both backend (primary) and frontend (UI hide) |
| T-15-03 | Tampering | PATCH /orders/{id}/deliver — pickup code timing attack | mitigate | `MessageDigest.isEqual()` constant-time comparison prevents timing-based code enumeration |
| T-15-04 | Tampering | PATCH /orders/{id}/deliver — client-supplied deliveredAt | mitigate | `deliveredAt` is set server-side via `OffsetDateTime.now()` in SalesService; never accepted from request body |
| T-15-05 | Information Disclosure | audit log entries contain old/new field values | accept | Audit log table is not exposed via public API in Phase 15; only internal DB access; low risk given staff-only system |
| T-15-06 | Spoofing | userId in audit log fabricated by bypassing JWT | mitigate | `userId` extracted from `jwt.getClaim("user_id")` in controller, not from request body; JWT signed by identity-service |
</threat_model>

<verification>
After both tasks complete:
1. Run `mvn quarkus:build -f anotame-api/backend/sales-service/pom.xml` — must exit 0
2. Start services: `docker compose up --build sales-service` — check Flyway migration V3 applies without error in logs
3. Create a test order via API — confirm response includes `pickupCode` (6 digits) field
4. Attempt PUT on a DELIVERED order — confirm 409 response with `{"error": "No se puede editar un pedido entregado o cancelado"}`
5. PATCH /deliver with wrong code — confirm 400 with `{"error": "Código de recogida incorrecto"}`
6. PATCH /deliver with correct code — confirm 200, order status DELIVERED, deliveredAt set
</verification>

<success_criteria>
- Flyway V3 migration applies cleanly (pickup_code column + tco_order_audit_log table created)
- OrderEntity has pickupCode and deliveredAt Java fields mapped correctly
- OrderResponse returns pickupCode and deliveredAt
- PUT /orders/{id} enforces status lock (409) and role-based field restrictions
- PATCH /orders/{id}/deliver validates pickup code with constant-time compare, sets deliveredAt server-side
- Audit log entries written per changed field in updateOrder()
- Build: `mvn quarkus:build` exits 0
</success_criteria>

<output>
After completion, create `.planning/phases/15-order-lifecycle-improvements/15-01-SUMMARY.md`
</output>
