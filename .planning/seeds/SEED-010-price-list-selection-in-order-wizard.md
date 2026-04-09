---
id: SEED-010
status: promoted
promoted_to: Phase 16 (v1.3)
planted: 2026-04-09
planted_during: v1.3 Phase 15 (Order Lifecycle Improvements)
trigger_when: When order creation is refactored
scope: Small
---

# SEED-010: Price List Selection in Order Creation Wizard

## Why This Matters

Different clients have different pricing structures. El hilvan charges different rates to:
- Regular repeat customers (standard rates)
- New or one-time clients (premium rates)
- Bulk/corporate orders (volume discounts)

Currently, all orders use a default or establishment-wide price list. This forces post-order price adjustments or manual client-specific billing, creating:
- Billing delays (adjustments applied after fulfillment)
- Dispute risk (customer may not understand charges)
- Operational friction (staff must remember to apply special rates)

**Solution:** Allow users to select a price list at the moment of order creation, locking in the correct pricing upfront. This:
- Streamlines checkout (1-click price selection vs. manual adjustments later)
- Increases clarity (customer sees exact pricing before delivery)
- Reduces billing disputes (pricing is set at order time, not modified later)

## When to Surface

**Trigger:** When order creation is refactored

This seed should be presented during `/gsd-new-milestone` when:
- Order creation wizard is being redesigned or refactored
- A phase focuses on "order entry improvements" or "checkout flow"
- Pricing/invoicing features are being enhanced

## Scope Estimate

**Small** — 2-6 hours

- Add a price list selector dropdown to the order creation form (reuse existing DataTable or Combobox)
- Link to the established price list system (`anotame-web/src/routes/(app)/dashboard/catalog/pricelists/*`)
- Update CreateOrderRequest DTO to include optional `priceListId`
- Backend: Store selected price list ID with order, use for line item pricing
- Testing: Verify selected price list applies to items

## Breadcrumbs

**Order Creation:**
- `anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte` — Current order wizard form

**Price List System:**
- `anotame-web/src/routes/(app)/dashboard/catalog/pricelists/+page.svelte` — Price list management
- `anotame-web/src/routes/(app)/dashboard/catalog/pricelists/[id]/+page.svelte` — Individual price list view
- Backend: Sales Service `PriceListResource.java` (manages price lists)

**Related Decisions:**
- Order creation is part of Phase 15 (Order Lifecycle Improvements)
- Price lists are already a mature system with full CRUD support
- System stores `priceListId` in orders via `OrderJpa.priceListId` (verify in schema)

## Notes

This is a client-facing feature that improves the order-taking experience. Pair with invoicing enhancements (SEED-011, if created) to ensure price list selection also flows into billing documents.

Consider showing a price list preview (3-5 top items and rates) in the selector dropdown to help users pick the right list quickly.
