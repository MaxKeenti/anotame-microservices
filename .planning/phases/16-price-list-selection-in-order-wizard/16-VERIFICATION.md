---
phase: 16-price-list-selection-in-order-wizard
verified: 2026-04-13T00:00:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 16: Price List Selection in Order Wizard Verification Report

**Phase Goal:** Add a price list selector step to the order creation wizard so staff can lock in client-specific pricing at order creation time — the selected price list auto-fills service unit prices, prices are still editable, the list is stored on the order, and the edit wizard shows it as read-only.

**Verified:** 2026-04-13
**Status:** PASSED
**Re-verification:** No (initial verification)

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A price list selector step appears as Step 2 in the new order wizard | ✓ VERIFIED | `orders/new/+page.svelte` steps array has 4 entries; Step 2 renders `PriceListStep` with label "Lista de Precios". |
| 2 | The price list step is skippable — staff can proceed without selecting a list | ✓ VERIFIED | `PriceListStep` has a "Omitir paso" button; `orderWizardState` `priceListId` is nullable; no required validation on the step. |
| 3 | Selecting a price list auto-fills service unit prices in the Prendas step | ✓ VERIFIED | `item-sub-wizard.svelte` derives `priceListMap` from `activeDraft.priceList.items`; when a service is added, its `unitPrice` is pre-filled from the map. |
| 4 | Auto-filled prices are editable by staff | ✓ VERIFIED | `unitPrice` input in `ItemSubWizard` is a standard text field; pre-fill sets the initial value but does not lock it. |
| 5 | A service not in the selected price list leaves unit price blank | ✓ VERIFIED | `priceListMap.get(serviceId)` returns `undefined` when not present; no fallback to catalog `effectivePrice` is applied. |
| 6 | Price list id and name are saved on the order and returned in the response | ✓ VERIFIED | `payment-step.svelte` includes `priceListId`/`priceListName` in the `CreateOrderRequest` payload (fix `ea1c0a2`); V4 migration adds columns; `OrderResponse` returns both fields; order detail shows "Lista de Precios" row (fix `1f445af`). |
| 7 | The edit wizard shows the order's price list name as read-only | ✓ VERIFIED | `orders/[id]/edit/+page.svelte` reads `priceListName` from `OrderResponse` and displays it in a disabled, non-interactive badge alongside the step indicator. |
| 8 | The edit wizard does not allow changing the price list | ✓ VERIFIED | `UpdateOrderRequest` was not modified (per D-12); no price list controls are rendered in edit mode; the value is immutable after creation at both backend and frontend layers. |

**Score:** 8/8 truths verified

---

## Required Artifacts (Implementation)

| Artifact | Purpose | Status | Location |
|----------|---------|--------|----------|
| Flyway V4 migration | `price_list_id UUID` + `price_list_name VARCHAR(255)` columns on `tco_order` | ✓ VERIFIED | `sales-service/src/main/resources/db/migration/V4__add_price_list_to_order.sql` |
| CreateOrderRequest | Nullable `priceListId`/`priceListName` fields | ✓ VERIFIED | `sales-service/.../application/dto/CreateOrderRequest.java` |
| OrderResponse | `priceListId`/`priceListName` in response payload | ✓ VERIFIED | `sales-service/.../application/dto/OrderResponse.java` |
| Order domain model | `priceListId`/`priceListName` fields | ✓ VERIFIED | `sales-service/.../domain/model/Order.java` |
| OrderEntity | `@Column price_list_id` + `price_list_name` JPA fields | ✓ VERIFIED | `sales-service/.../infrastructure/persistence/entity/OrderEntity.java` |
| OrderPersistenceAdapter | Maps `priceListId`/`priceListName` on `save()` and `toDomain()` | ✓ VERIFIED | `sales-service/.../infrastructure/persistence/adapter/OrderPersistenceAdapter.java` |
| SalesService | Passes `priceListId`/`priceListName` through `createOrder()` and `mapToResponse()` | ✓ VERIFIED | `sales-service/.../application/service/SalesService.java` |
| PriceListStep component | Step 2 UI — fetches lists, shows selector, skippable | ✓ VERIFIED | `anotame-web/src/lib/components/orders/wizard/price-list-step.svelte` |
| OrderWizardState | `priceListId`, `priceListName`, `priceList` (items) fields on draft; selection methods | ✓ VERIFIED | `anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts` |
| item-sub-wizard auto-fill | `priceListMap` derived state; pre-fills `unitPrice` + shows price list prices on service cards | ✓ VERIFIED | `anotame-web/src/lib/components/orders/wizard/item-sub-wizard.svelte` |
| payment-step payload | Includes `priceListId`/`priceListName` in `CreateOrderRequest` when present | ✓ VERIFIED | `anotame-web/src/lib/components/orders/wizard/payment-step.svelte` |
| Edit wizard read-only display | Shows `priceListName` badge; no change controls | ✓ VERIFIED | `anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte` |
| Order detail price list row | Conditional "Lista de Precios" row in Detalles card | ✓ VERIFIED | `anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte` |

---

## UAT Results

Tested 2026-04-13. 8 tests, 8 passed. 3 issues found and fixed during session.

| Fix | Commit | Description |
|-----|--------|-------------|
| Service card prices misleading | `88c5e9d` | Service cards in ItemSubWizard showed catalog `effectivePrice` while inputs showed price list prices — confusing for staff. Added `priceListMap` derived state; cards now conditionally render price list price (with base price struck through) when a list is active. |
| Price list not saved on order | `ea1c0a2` | `payment-step.svelte` never included `priceListId`/`priceListName` in the POST payload. Added conditional payload fields for creation mode. |
| Price list name not displayed | `1f445af` | Order detail page had no display row for `priceListName`. Added conditional "Lista de Precios" row in the Detalles del Pedido card. |

---

## Anti-Patterns Scan

- `priceListId` immutability enforced server-side (`UpdateOrderRequest` not modified) — UI restriction alone is insufficient.
- `priceListName` denormalized on order at creation time — no runtime catalog fetch required for display; correct per D-08.
- `priceListMap` is a `$derived` `Map<string, number>` — O(1) service lookup; no linear scan per item addition.
- V4 migration uses `IF NOT EXISTS` guard and nullable columns — zero risk to existing rows; safe to replay.
- No validation annotation on `priceListId` in `CreateOrderRequest` — intentional per D-09; sales-service stores value as-is without cross-service validation.

---

## Summary

Phase 16 is fully implemented and verified. The order creation wizard now has a dedicated, skippable price list selection step as Step 2. The selected list auto-fills service unit prices in the Prendas step, prices remain staff-editable, and the price list id and name are stored on the order and surfaced in order detail and the read-only edit wizard.

**Phase Goal Achieved:** Yes.

---
_Verified: 2026-04-13_
_Verifier: UAT + Claude (gsd-verifier)_
