commit: 105530d
---

# Summary: Quick Task 260403-qh0

## Objective
Resolve critical production issues affecting workload reporting, UI readability, and order detail completeness.

## Changes
- **Backend (sales-service)**:
    - Updated `OrderResponse` to include `totalDurationMin`.
    - Refactored `SalesService` to calculate and persist `totalDurationMin` during order creation and updates.
    - **Fix**: Corrected a compilation error in the `totalDurationMin` calculation by properly iterating through item services and multiplying by item quantity.
- **Frontend (anotame-web)**:
    - Fixed `payment-step.svelte` to include `durationMin` in the API payload, enabling accurate workload tracking.
    - Standardized "Notas" text color in `[id]/+page.svelte` using `text-warning-text` for dark/light mode contrast.
    - Added "Carga de Trabajo" summary row to the order detail view.

## Verification
- [x] Backend compilation successful (`mvn compile`).
- [x] Frontend build successful (`bun run build`).
- [x] Manual verification plan documented in Walkthrough.

## Files Modified
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java`
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java`
- `anotame-web/src/lib/components/orders/wizard/payment-step.svelte`
- `anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte`
