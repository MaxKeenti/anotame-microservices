---
id: SEED-001
status: dormant
planted: 2026-04-03
planted_during: v1.1
trigger_when: once v1.2 is complete
scope: medium
---

# SEED-001: Ability to edit existing orders (partial payments, mark as paid, record when/who edited)

## Why This Matters

Currently, orders are created and their payment status is captured at creation. However, in a real-world scenario like "El Hilvan", customers often pay a deposit and then the remaining balance later. 

We need to:
- Allow updating the `amountPaid` and `status` of an existing order.
- Record **who** made the edit (user ID) and **when** (timestamp) for auditability.
- Maintain data integrity between the total order amount and increments in the payment.

## When to Surface

**Trigger:** once v1.2 is complete

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions:
- Implementing financial reporting or advanced accounting features.
- Adding full CRUD (Update) capabilities to the order management flow.
- Introducing audit logs or edit history for core entities.

## Scope Estimate

**Medium** — Requires:
- A new API endpoint (`PATCH /orders/{id}/payments` or similar).
- Database changes to `OrderEntity` (or a new `OrderEditHistory` table).
- Frontend UI to trigger the edit (e.g., a "Add Payment" button in order details).

## Breadcrumbs

Related code and decisions found in the current codebase:

- [OrderEntity.java](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java) - Current mapping of `amountPaid` and `totalAmount`.
- [SalesService.java](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java) - Business logic for order creation and existing (but incomplete) updates.
- [OrdersResource.java](file:///Users/maximilianogonzalezcalzada/Library/Mobile%20Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/controller/OrdersResource.java) - Existing REST endpoints for orders.

## Notes

- Consider if we should just update the `OrderEntity` or create a separate `PaymentTransaction` table to track history of multiple payments.
- Audit logging (who/when) is a key requirement from the user.
