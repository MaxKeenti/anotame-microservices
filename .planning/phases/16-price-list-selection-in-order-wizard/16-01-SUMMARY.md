---
phase: 16-price-list-selection-in-order-wizard
plan: "01"
subsystem: sales-service (backend)
tags: [backend, jpa, flyway, dto, domain-model]
dependency_graph:
  requires: []
  provides: [priceListId-persisted-on-order, priceListName-in-order-response]
  affects: [sales-service]
tech_stack:
  added: []
  patterns: [hexagonal-architecture, flyway-additive-migration, lombok-data-builder]
key_files:
  created:
    - anotame-api/backend/sales-service/src/main/resources/db/migration/V4__add_price_list_to_order.sql
  modified:
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/CreateOrderRequest.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderPersistenceAdapter.java
    - anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java
decisions:
  - "priceListId is nullable UUID with no validation annotation — stores value as-is per D-09"
  - "priceListName is denormalized string for display without extra catalog fetch per D-08"
  - "OrderEntity stays @Getter @Setter only — no @Data to avoid Hibernate hashCode/equals recursion"
  - "UpdateOrderRequest is not modified — priceListId is immutable after creation per D-12"
metrics:
  duration: "~15 min"
  completed: "2026-04-10T00:55:02Z"
  tasks_completed: 2
  files_modified: 6
  files_created: 1
---

# Phase 16 Plan 01: Backend priceListId Stack Summary

**One-liner:** Nullable `priceListId` UUID and `priceListName` string wired through the entire sales-service backend stack — Flyway migration, DTO, domain model, JPA entity, persistence adapter, and service layer — so orders can store and return the price list selected at creation time.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Flyway migration V4 + backend DTO, domain, entity fields | f859d95 | V4__add_price_list_to_order.sql, CreateOrderRequest.java, OrderResponse.java, Order.java, OrderEntity.java |
| 2 | Persistence adapter mapping + service layer pass-through | 3d6a041 | OrderPersistenceAdapter.java, SalesService.java |

## What Was Built

Added `priceListId` (nullable UUID) and `priceListName` (nullable String) to the complete backend data flow for order creation and retrieval:

1. **Flyway V4 migration** — `ALTER TABLE tco_order ADD COLUMN IF NOT EXISTS price_list_id UUID, ADD COLUMN IF NOT EXISTS price_list_name VARCHAR(255)`. Both nullable; `IF NOT EXISTS` guards against replay. Zero risk to existing rows.

2. **CreateOrderRequest** — two nullable fields added after `paymentMethod` with no validation annotation. `@Data` Lombok generates getters/setters automatically.

3. **OrderResponse** — `priceListId` UUID and `priceListName` String added to the `@Data @Builder` DTO. The builder picks them up automatically.

4. **Order domain model** — `priceListId` UUID and `priceListName` String added. `@Data` Lombok generates getters/setters.

5. **OrderEntity** — `@Column(name = "price_list_id")` and `@Column(name = "price_list_name", length = 255)` fields added. Entity retains `@Getter @Setter` only — no `@Data` added (protects Hibernate from hashCode/equals recursion on bidirectional relationships).

6. **OrderPersistenceAdapter** — `save()` copies `priceListId/priceListName` from domain Order to entity; `toDomain()` copies back from entity to domain Order.

7. **SalesService** — `createOrder()` sets `priceListId/priceListName` from request; `mapToResponse()` builder includes both fields. `updateOrder()` is NOT modified — immutability of priceListId after creation is preserved.

## Data Flow

```
POST /orders (CreateOrderRequest.priceListId)
  -> SalesService.createOrder() sets order.priceListId
  -> OrderPersistenceAdapter.save() sets entity.priceListId
  -> tco_order.price_list_id (DB column via V4 migration)
  -> OrderPersistenceAdapter.toDomain() sets o.priceListId
  -> SalesService.mapToResponse() .priceListId(order.getPriceListId())
  -> GET /orders/{id} (OrderResponse.priceListId)
```

## Deviations from Plan

None — plan executed exactly as written. The worktree was based on an older commit (pre-Phase 15) which means the worktree files lacked `pickupCode`, `deliveredAt`, `UpdateOrderRequest`, and audit log infrastructure. All plan modifications were applied to the worktree's file versions correctly — the plan's scope (priceListId additions only) was unaffected by the older base.

## Known Stubs

None. Fields are fully wired from HTTP request through to database and back to HTTP response. No hardcoded values, no placeholder data.

## Threat Flags

None. The additions match the plan's threat model exactly:
- T-16-01-01 (Tampering/CreateOrderRequest): accepted, no validation — per D-09
- T-16-01-02 (Info Disclosure/OrderResponse): accepted — not PII
- T-16-01-03 (EoP/UpdateOrderRequest): mitigated — `updateOrder()` not modified
- T-16-01-04 (Tampering/Flyway): accepted — IF NOT EXISTS guard, additive only

## Self-Check: PASSED

All 7 files exist in worktree. Both commits (f859d95, 3d6a041) verified in git log.
