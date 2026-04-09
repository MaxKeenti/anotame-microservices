---
status: testing
phase: 15-order-lifecycle-improvements
source: 15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md
started: 2026-04-08T00:00:00Z
updated: 2026-04-08T12:29:00Z
---

## Current Test

number: 4
name: ADMIN Can Edit Active Order
expected: |
  As ADMIN, navigate to an active order (RECEIVED, IN_PROGRESS, or READY). Click Edit. The wizard loads with pre-populated values. Submit changes and confirm order updates without 409 error.
awaiting: user response (after fix)

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state. Start the application from scratch. Server boots without errors, Flyway V3 migration applies cleanly, and a basic health check or list orders API call returns live data.
result: issue
reported: "Backend compilation failure — FIXED"
severity: blocker

### 2. Pickup Code Generated on Order Creation
expected: Create a new order via the API. The response includes a 6-digit pickup code (numeric only). The code is stored in the database.
result: pass

### 3. Edit Locked Order Shows Banner
expected: Navigate to order detail for a DELIVERED or CANCELLED order. A dismissal-proof alert banner appears stating the order cannot be edited. The Edit button is hidden or disabled.
result: pass

### 4. ADMIN Can Edit Active Order
expected: As ADMIN, navigate to an active order (RECEIVED, IN_PROGRESS, or READY). Click Edit. The wizard loads with pre-populated values. Submit changes and confirm order updates without 409 error.
result: issue
reported: "PATCH /orders/{id}/deliver responded with 500 — missing null-check for pickup code"
severity: blocker
fixed_by: "commit 95f6053 — added null-check for order.getPickupCode() in deliverOrder"

### 5. EMPLOYEE Cannot Edit Garment/Service Items
expected: As EMPLOYEE, navigate to an active order and click Edit. Attempt to change garment or service item. Submit the form. The order updates only notes/deadline/payment fields; garment/service changes are silently ignored. Check audit log confirms only allowed fields were logged.
result: [pending]

### 6. Pickup Code Displays on Order Detail
expected: Navigate to an order with a pickup_code. The order detail page shows the pickup code in a monospace font with wide letter spacing (tracking-widest).
result: [pending]

### 7. Deliver Order with Valid Pickup Code
expected: On the Operations page Listas para entrega tab, select a READY order. Click 'Entregar pedido'. A dialog opens prompting for a 6-digit code. Enter the correct code. Submit. Toast shows success, dialog closes, order status changes to DELIVERED.
result: [pending]

### 8. Deliver Order with Invalid Pickup Code
expected: On the Operations page, enter an incorrect 6-digit code in the pickup-code dialog. Submit. An inline error message appears ('Código incorrecto'). The dialog remains open.
result: [pending]

### 9. Bulk Status Change (ADMIN)
expected: On the Orders page, toggle 'Seleccionar pedidos'. Select 3+ active orders. The FloatingActionBar appears with a status dropdown (showing all 5 statuses). Select a new status. Confirm. All selected orders update to the new status without page reload.
result: [pending]

### 10. Bulk Status Change (EMPLOYEE)
expected: As EMPLOYEE, toggle bulk mode on Orders page. Select 3+ active orders. The FloatingActionBar appears with a status dropdown showing only 3 statuses (RECEIVED, IN_PROGRESS, READY). Attempt to change status. Verify selection is limited to available roles.
result: [pending]

### 11. Bulk Delete Guard
expected: On the Orders page bulk mode, select mixed orders (some DRAFT, some RECEIVED). The FloatingActionBar's Delete button is disabled (grayed out). Select only DRAFT orders. Delete becomes enabled. Click Delete. Confirm dialog. DRAFT orders are deleted.
result: [pending]

### 12. Audit Log Records Field Changes
expected: Edit an active order: update notes, deadline, and payment fields. Save. Query the audit log table (tco_order_audit_log). Verify one row per changed field, with old_value and new_value captured for each.
result: [pending]

## Summary

total: 12
passed: 2
issues: 2
pending: 8
skipped: 0
blocked: 0

## Gaps

- truth: "Deliver endpoint handles requests gracefully with proper error handling"
  status: fixed
  reason: "NullPointerException when order has no pickup code (500 error)"
  severity: blocker
  test: 4
  root_cause: "Missing null-check on order.getPickupCode() before calling getBytes()"
  artifacts:
    - path: "anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java"
      issue: "deliverOrder() method called getBytes() on potentially null pickupCode"
  missing:
    - "Guard clause: if (order.getPickupCode() == null || order.getPickupCode().isEmpty())"
  debug_session: "inline"
  fixed_by: "commit 95f6053"
