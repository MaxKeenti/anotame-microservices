---
status: testing
phase: 15-order-lifecycle-improvements
source: 15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md
started: 2026-04-08T00:00:00Z
updated: 2026-04-08T12:45:00Z
---

## Current Test

number: 7
name: Deliver Order with Valid Pickup Code
expected: |
  On the Operations page Listas para entrega tab, select a READY order. Click 'Entregar pedido'. A dialog opens prompting for a 6-digit code. Enter the correct code. Submit. Toast shows success, dialog closes, order status changes to DELIVERED.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
result: issue
reported: "Backend compilation failure — FIXED"

### 2. Pickup Code Generated on Order Creation
result: pass

### 3. Edit Locked Order Shows Banner
result: pass

### 4. ADMIN Can Edit Active Order
result: pass

### 5. EMPLOYEE Cannot Edit Garment/Service Items
result: pass

### 6. Pickup Code Displays on Order Detail
result: pass
reported: "Fixed - Added to receipt template, styling verified"
severity: none
notes: "Pickup code now displays with monospace styling (text-2xl, font-semibold, tracking-widest, font-mono) on order detail page and appears on printed receipt with proper formatting."

### 7. Deliver Order with Valid Pickup Code
result: pass

### 8. Deliver Order with Invalid Pickup Code
result: pass

### 9. Bulk Status Change (ADMIN)
result: pass

### 10. Bulk Status Change (EMPLOYEE)
result: pass

### 11. Bulk Delete Guard
result: issue
severity: medium
reported: "Bulk delete button is permanently disabled — DRAFT status does not exist in backend"
notes: |
  VALID_STATUSES in SalesService.java is: RECEIVED, IN_PROGRESS, READY, DELIVERED, CANCELLED.
  DRAFT is absent from the backend enum. Orders are created with RECEIVED status.
  FloatingActionBar guard checks allSelectedAreDraft (status === 'DRAFT') which can never be true.
  Fix: change guard to status === 'RECEIVED' (earliest deletable state) and update FloatingActionBar
  adminStatuses/employeeStatuses to include 'RECEIVED' as the deletable threshold — or introduce
  a real DRAFT backend status.

### 12. Audit Log Records Field Changes
result: issue
severity: medium
reported: "Audit log data is written to DB but is unreadable — no GET endpoint and no frontend UI"
notes: |
  SalesService.updateOrder() writes to tco_order_audit_log for changes to notes, committedDeadline,
  amountPaid, and paymentMethod. The DB table exists (Flyway V3). However:
  - No GET /orders/{id}/audit endpoint exists in OrdersResource.java
  - No frontend audit log view exists on the order detail page
  Audit data accumulates invisibly in the DB with no way to surface it. Fix requires adding the
  GET endpoint in the backend and an audit log section on the order detail page.

## Summary

total: 12
passed: 9
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- **Test 11 — Bulk Delete Guard**: `DRAFT` status does not exist in backend. `allSelectedAreDraft` is always false. Bulk delete is permanently disabled. Fix: change guard to `status === 'RECEIVED'` and update FloatingActionBar status lists accordingly.
- **Test 12 — Audit Log**: Backend writes audit entries to DB but no GET endpoint exists and no frontend UI displays them. Fix requires `GET /orders/{id}/audit` endpoint + order detail audit section.
