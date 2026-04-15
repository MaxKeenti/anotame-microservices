# Phase 16: Price List Selection in Order Wizard — Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a price list selector to the order creation wizard so staff can lock in client-specific pricing at the moment of taking the order. The selected price list auto-fills service unit prices as items are added — staff can still override individual prices. The price list is stored on the order for records and reference.

Catalog management (creating/editing price lists) and invoicing are separate concerns and out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Wizard placement
- **D-01:** A new dedicated step is added as Step 2 — wizard becomes: Cliente → Lista de Precios → Prendas → Pago.
- **D-02:** The price list step is non-blocking (nullable) — staff can skip it if no specific list applies. A default or "none" option must be available.

### Price application behavior
- **D-03:** Selecting a price list auto-fills `unitPrice` on services in `ItemSubWizard` by matching `serviceId` against the price list's items (`PriceListItemDto`).
- **D-04:** Auto-filled prices are editable — staff can override any individual `unitPrice` after pre-fill.
- **D-05:** Price list items must be fetched and stored in `orderWizardState` at the time of price list selection (not at wizard load), so `ItemSubWizard` can look them up without an extra API call.
- **D-06:** If a service has no matching entry in the selected price list, `unitPrice` remains blank/zero — no silent fallback to another list.

### Edit mode behavior
- **D-07:** The edit wizard (`/orders/[id]/edit`) shows the original price list name as read-only context. It cannot be changed during an edit. This prevents accidental repricing of items already agreed upon with the customer.
- **D-08:** `OrderResponse` must return `priceListId` (and ideally `priceListName` for display) so the edit wizard can render the label without a separate fetch.

### Backend
- **D-09:** `priceListId` (nullable UUID) is added to `CreateOrderRequest`. No cross-service validation — sales-service stores the value as-is.
- **D-10:** `OrderEntity` gets a `price_list_id UUID` column via a new Flyway migration (additive, nullable).
- **D-11:** `OrderResponse` includes `priceListId` in the response payload.
- **D-12:** `UpdateOrderRequest` (edit endpoint) does NOT include `priceListId` — the field is immutable after creation.

### Claude's Discretion
- Visual design of the price list step (selector style, empty state, "none selected" state)
- Whether to show a mini price preview in the selector (e.g., top 3 items with prices)
- Exact Flyway migration version number

</decisions>

<specifics>
## Specific Ideas

- The price list step should feel lightweight — it's a selector, not a form. A combobox or radio-style card list both work; Claude picks what fits the existing wizard aesthetic.
- Staff should be able to see at a glance which list is active while they're in the Prendas step (e.g., a small badge or label in the step header).

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing price list system (catalog-service)
- `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/controller/PriceListController.java` — `GET /pricelists` (list all) and `GET /pricelists/{id}`; no auth changes needed
- `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/dto/PriceListResponse.java` — Shape of the response including `items: PriceListItemDto[]`
- `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/dto/PriceListItemDto.java` — Has `serviceId`, `price`, `basePrice`; used for auto-fill matching

### Order creation (sales-service)
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/CreateOrderRequest.java` — Add `priceListId: UUID` (nullable, no validation annotation)
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java` — Add `price_list_id` column
- `.planning/codebase/CONVENTIONS.md` — Flyway migration conventions, Lombok patterns, layered architecture

### Frontend wizard
- `anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte` — Wizard shell; steps array drives rendering
- `anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts` — Draft state; `priceListId` and `priceListItems` fields need adding
- `anotame-web/src/lib/components/orders/wizard/items-step.svelte` — Hosts `ItemSubWizard`; passes price list context down
- `anotame-web/src/lib/types/dtos.ts` — `PriceListResponse` and `PriceListItemDto` types already present

### Edit wizard
- `anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte` — Show read-only price list name from `OrderResponse.priceListId`
- `.planning/phases/15-order-lifecycle-improvements/15-CONTEXT.md` — Edit wizard decisions from Phase 15; D-07 and D-08 extend this work

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PriceListResponse` / `PriceListItemDto` in `dtos.ts` — already typed; no new frontend types needed for the price list data itself
- `apiService` + `API_CATALOG` pattern from PaymentStep — same pattern for fetching price lists in the new step
- Existing Combobox / Select components from shadcn-svelte — reuse for the selector UI
- `orderWizardState.updateActiveDraft()` — extend draft shape to include `priceListId` and `priceListItems[]`

### Established Patterns
- **superforms + Zod:** All wizard steps with form inputs follow this pattern; the price list step may be selector-only (no superforms needed if no text inputs)
- **Draft pattern:** All wizard state flows through `orderWizardState`; price list selection must update the draft, not local component state
- **Step navigation:** `handleNext` / `handleBack` in the wizard shell — new step slots in without restructuring navigation logic
- **Nullable fields in CreateOrderRequest:** `notes` is already optional — `priceListId` follows the same nullable pattern

### Integration Points
- New `PriceListStep` component connects to: `orderWizardState` (read/write draft) + catalog-service API (fetch available lists)
- `ItemSubWizard` reads `orderWizardState.activeDraft.priceListItems` to pre-fill `unitPrice` when a service is selected
- `PaymentStep` already builds the final `CreateOrderRequest` payload — needs to include `priceListId` from draft
- Edit page reads `priceListId` from `OrderResponse` and resolves the name via `GET /pricelists/{id}` or inline from the response

</code_context>

<deferred>
## Deferred Ideas

- **Price list preview in selector** (show top items/rates before selecting) — useful but not required for v1; Claude can add if trivial
- **Changing price list during edit** — explicitly out of scope per D-07; deferred to a future phase if demand arises
- **Invoicing / billing documents** — SEED-011 territory; price list selection feeds into this but billing docs are a separate phase
- **Cross-service price validation** (confirm priceListId exists in catalog at order creation) — deferred per D-09; revisit if the API becomes public or price lists are frequently deleted

</deferred>

---

*Phase: 16-price-list-selection-in-order-wizard*
*Context gathered: 2026-04-09*
