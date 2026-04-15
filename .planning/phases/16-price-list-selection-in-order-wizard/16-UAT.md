---
status: testing
phase: 16-price-list-selection-in-order-wizard
source: 16-01-SUMMARY.md, 16-CONTEXT.md, 16-UI-SPEC.md
started: 2026-04-13T00:00:00Z
updated: 2026-04-13T00:00:00Z
---

## Current Test

number: 1
name: Price List Step Appears in New Order Wizard
expected: |
  Open the new order wizard (/dashboard/orders/new). The step indicator shows 4 steps.
  Step 2 is "Lista de Precios" (or similar label). Completing Step 1 (Cliente) advances to
  the price list selector step before Prendas.
awaiting: user response

## Tests

### 1. Price List Step Appears in New Order Wizard
result: pass

### 2. Price List Step is Skippable
result: pass

### 3. Price List Auto-fills Service Prices
result: pass
notes: "UX fix applied mid-test: service cards now show price list prices instead of catalog effectivePrice when a price list is active (88c5e9d)."

### 4. Auto-filled Prices Are Editable
result: pass

### 5. Service Not in List Stays Blank
result: pass

### 6. Price List Saved on Order
result: pass
notes: "Bug fixed mid-test: priceListId/priceListName were never included in the CreateOrderRequest payload (ea1c0a2). Also added Lista de Precios row to order detail page (1f445af)."

### 7. Edit Wizard Shows Price List as Read-Only
result: pass

### 8. Edit Wizard Does Not Allow Changing Price List
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[No outstanding issues]
