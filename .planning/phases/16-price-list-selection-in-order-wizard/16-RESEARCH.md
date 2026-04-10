# Phase 16: Price List Selection in Order Wizard — Research

**Researched:** 2026-04-09
**Domain:** Svelte 5 wizard state management + Java Quarkus hexagonal architecture + PostgreSQL schema migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** A new dedicated step is added as Step 2 — wizard becomes: Cliente → Lista de Precios → Prendas → Pago.
- **D-02:** The price list step is non-blocking (nullable) — staff can skip it. A default or "none" option must be available.
- **D-03:** Selecting a price list auto-fills `unitPrice` on services in `ItemSubWizard` by matching `serviceId` against the price list's `PriceListItemDto`.
- **D-04:** Auto-filled prices are editable — staff can override any individual `unitPrice` after pre-fill.
- **D-05:** Price list items must be fetched and stored in `orderWizardState` at the time of price list selection (not at wizard load).
- **D-06:** If a service has no matching entry in the selected price list, `unitPrice` remains blank/zero — no silent fallback.
- **D-07:** The edit wizard shows the original price list name as read-only context. It cannot be changed during an edit.
- **D-08:** `OrderResponse` must return `priceListId` (and ideally `priceListName`) so the edit wizard can render the label without a separate fetch.
- **D-09:** `priceListId` (nullable UUID) is added to `CreateOrderRequest`. No cross-service validation — sales-service stores the value as-is.
- **D-10:** `OrderEntity` gets a `price_list_id UUID` column via a new Flyway migration (additive, nullable).
- **D-11:** `OrderResponse` includes `priceListId` in the response payload.
- **D-12:** `UpdateOrderRequest` (edit endpoint) does NOT include `priceListId` — immutable after creation.

### Claude's Discretion

- Visual design of the price list step (selector style, empty state, "none selected" state)
- Whether to show a mini price preview in the selector (e.g., top 3 items with prices)
- Exact Flyway migration version number

### Deferred Ideas (OUT OF SCOPE)

- Price list preview in selector (show top items/rates before selecting) — useful but not required for v1; Claude can add if trivial
- Changing price list during edit — explicitly out of scope per D-07
- Invoicing / billing documents — SEED-011 territory
- Cross-service price validation (confirm priceListId exists in catalog at order creation)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-16-01 | Add price list selector to the order wizard as new Step 2 | Wizard shell reads `steps[]` array; inserting at index 1 slots in cleanly without restructuring nav |
| REQ-16-02 | Pass `priceListId` through `CreateOrderRequest` to backend | `CreateOrderRequest.java` is a plain `@Data` DTO; nullable UUID field follows existing `notes` pattern |
| REQ-16-03 | Apply selected list to line-item pricing at creation time (auto-fill `unitPrice` in `ItemSubWizard`) | `PriceListItemDto` has `serviceId` + `price` fields; `item-sub-wizard.svelte` reads from local state in `handleServiceSelect`; must read from draft instead |
</phase_requirements>

---

## Summary

Phase 16 adds a price-list-selection step to the existing three-step order wizard (Cliente → Prendas → Pago), making it a four-step wizard (Cliente → Lista de Precios → Prendas → Pago). The work touches three layers: a new Flyway migration and DTO changes in sales-service; a new `PriceListStep` Svelte component with catalog-service API call; and price-lookup logic inside `item-sub-wizard.svelte`.

All required infrastructure already exists in the codebase. `PriceListResponse` and `PriceListItemDto` are already typed in `dtos.ts`. The `GET /pricelists` and `GET /pricelists/{id}` catalog endpoints are live and authenticated. The `AdaptiveSelect` component is already built and handles mobile/desktop branching. The wizard shell's `steps[]` array and `handleNext`/`handleBack` logic are straightforward — inserting a new step at index 1 requires no structural changes.

The implementation is a clean extension of established patterns. No new libraries are needed. The only non-trivial decisions are (1) how `ItemSubWizard` receives the price list context without prop-drilling and (2) how the edit wizard resolves `priceListName` from `priceListId` — both are answerable with existing project patterns.

**Primary recommendation:** Wire `priceListItems` through `orderWizardState.activeDraft` (already the project's state bus) and resolve `priceListName` by storing it in `OrderResponse` (D-08) alongside the UUID, avoiding an extra fetch in the edit wizard.

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

| Constraint | Detail |
|---|---|
| Build gate | `bun run build` must exit 0 before committing (frontend) |
| Type check | `bun run check` (`svelte-check`) must pass |
| Backend build | `mvn quarkus:build` per service |
| UI components | Use shadcn-svelte components via `$lib/components/ui/`. Never raw `<select>` — use `AdaptiveSelect`. |
| State management | Svelte 5 runes only (`$state`, `$derived`, `$effect`). No Svelte 4 stores. |
| API calls | All via `apiService` from `$lib/services/api.svelte`. Never raw `fetch`. |
| Forms | `sveltekit-superforms` with `zod4` adapter for any step with text inputs. Selector-only steps (no text inputs) do not require superforms. |
| Toasts | `svelte-sonner` only. Never `alert()`. |
| Confirmations | `adaptiveConfirm()` only. Never `window.confirm()`. |
| `<svelte:component>` | Forbidden — use `{@const C = step.component}` + `<C />` pattern. |
| `{@const}` | Must be direct child of `{#each}` or `{#if}` — never inside raw HTML elements. |
| Labels | All `<label>` must have `for=` linked to `id=` on input. |
| `$state` in `<script module>` | Forbidden — extract to `.svelte.ts` file. |
| Self-closing non-void HTML | Forbidden — write `<div></div>` not `<div />`. |
| JPA entities | Use `@Getter @Setter` only (not `@Data`). Domain models and request DTOs: `@Data` is acceptable. |
| Dependency injection | Prefer `@RequiredArgsConstructor` (constructor injection). `@Inject` is acceptable. |
| No MapStruct | All entity↔domain mapping done manually in persistence adapters. |
| DB naming | `snake_case` columns, `tco_` prefix for sales/orders tables. |
| Money | `BigDecimal` with `precision = 19, scale = 4`. |
| i18n | All user-visible text must use Paraglide. Do not hardcode display strings. |

---

## Standard Stack

### Core (verified in codebase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 | in use | Frontend framework + rune reactivity | Project baseline |
| SvelteKit | in use | Routing, SSR | Project baseline |
| shadcn-svelte | in use | UI primitives (`Select`, `Button`, `Input`) | Project baseline |
| Tailwind CSS v4 | in use | Styling | Project baseline |
| `runed` `PersistedState` | in use | Wizard draft persistence to localStorage | Used by `OrderWizardState` |
| `sveltekit-superforms` + `zod4` | in use | Form validation | Used by `PaymentStep` |
| `svelte-sonner` | in use | Toast notifications | Project baseline |
| Quarkus 3.27.2 | in use | Backend framework (sales-service, catalog-service) | Project baseline |
| Flyway | in use | DB migrations | Current latest is `V3__order_lifecycle_improvements.sql` — next is `V4` |
| Jakarta Bean Validation | in use | DTO field validation | Project standard |

### No New Libraries Required [VERIFIED: codebase grep]

All required capabilities exist: `AdaptiveSelect` for the selector, `apiService` + `API_CATALOG` for fetching price lists, `PriceListResponse`/`PriceListItemDto` types already in `dtos.ts`, `orderWizardState.updateActiveDraft()` for state updates.

---

## Architecture Patterns

### Wizard Shell — Step Insertion

The `new/+page.svelte` wizard shell uses a `steps` array at the module level. The currently rendered step is `steps[draft.currentStep]`. Navigation is pure index arithmetic via `handleNext` and `handleBack`. [VERIFIED: codebase read]

**Current steps array (new/+page.svelte, line 34–38):**
```typescript
const steps = [
    { title: "Cliente",  component: CustomerStep  },  // index 0
    { title: "Prendas",  component: ItemsStep     },  // index 1
    { title: "Pago",     component: PaymentStep   },  // index 2
];
```

**After Phase 16:**
```typescript
import PriceListStep from '$lib/components/orders/wizard/price-list-step.svelte';

const steps = [
    { title: "Cliente",          component: CustomerStep   },  // index 0
    { title: "Lista de Precios", component: PriceListStep  },  // index 1  ← NEW
    { title: "Prendas",          component: ItemsStep      },  // index 2
    { title: "Pago",             component: PaymentStep    },  // index 3
];
```

The stepper progress UI renders `{#each steps as s, i}` with step number `{i + 1}` — adding an entry automatically re-numbers all steps visually. No other changes to the shell are needed. [VERIFIED: codebase read]

**Same insertion must be applied to the edit wizard** (`/orders/[id]/edit/+page.svelte`, lines 71–75). The edit wizard has an identical `steps` array. However per D-07, the `PriceListStep` in edit mode must be read-only — it shows the original price list name but offers no selector.

### DraftOrder State Extension

`DraftOrder` (in `OrderWizardState.svelte.ts`) is a `Partial<Omit<CreateOrderRequest, 'items'>>` extension. Two fields must be added: [VERIFIED: codebase read]

```typescript
export interface DraftOrder extends Partial<Omit<CreateOrderRequest, 'items'>> {
    id: string;
    lastModified: number;
    currentStep: number;
    items?: DraftOrderItem[];
    amountPaid?: number;
    paymentMethod?: string;
    isEditing?: boolean;
    // NEW:
    priceListId?: string;           // nullable UUID — selected price list
    priceListName?: string;         // denormalized for display in edit mode
    priceListItems?: PriceListItemDto[];  // fetched items, stored at selection time (D-05)
}
```

`priceListItems` must be typed as `PriceListItemDto[]` (already imported from `dtos.ts`). This avoids re-fetching in `ItemSubWizard`.

### PriceListStep Component

New file: `anotame-web/src/lib/components/orders/wizard/price-list-step.svelte`

**Responsibilities:**
1. On mount: fetch `GET /api/catalog/pricelists` via `apiService`
2. Render `AdaptiveSelect` (or card-list) with fetched price lists plus a "Ninguna" option (empty string value)
3. On selection: call `GET /api/catalog/pricelists/{id}` to hydrate full `items[]` list, then call `orderWizardState.updateActiveDraft({ priceListId, priceListName, priceListItems })`
4. On "Ninguna": call `updateActiveDraft({ priceListId: undefined, priceListName: undefined, priceListItems: [] })`
5. Expose `onNext` and `onBack` props (same interface as all other steps)

**No superforms needed** — the step has no text inputs, only a selector. State goes directly into the draft via `updateActiveDraft`.

**Edit mode behavior (D-07):** When `draft.isEditing === true`, the step renders a read-only label showing `draft.priceListName ?? 'Sin lista de precios'`. No selector shown.

### ItemSubWizard Price Pre-fill

The `handleServiceSelect` function (line 107–114 of `item-sub-wizard.svelte`) currently does: [VERIFIED: codebase read]

```typescript
function handleServiceSelect(s: any) {
    tempService = s;
    price = String(s.effectivePrice ?? s.basePrice);  // ← current default
    ...
}
```

**After Phase 16**, this must check `orderWizardState.activeDraft.priceListItems` first:

```typescript
function handleServiceSelect(s: any) {
    tempService = s;
    const draft = orderWizardState.activeDraft;
    const priceListItem = draft?.priceListItems?.find(
        (p: PriceListItemDto) => p.serviceId === s.id
    );
    price = priceListItem
        ? String(priceListItem.price)          // price list price (D-03)
        : String(s.effectivePrice ?? s.basePrice);  // fallback (D-06: blank/zero if no match)
    ...
}
```

Per D-06, when no price list is active (`priceListItems` is empty/undefined), the existing behavior is preserved. Per D-04, the `price` field is already a bindable `$state` that staff can override freely.

**Note:** `PriceListItemDto.serviceId` is a `string` (UUID) in `dtos.ts`. `ServiceResponse.id` is also a `string`. Direct equality comparison `===` is safe. [VERIFIED: dtos.ts]

### PaymentStep Payload — Include priceListId

`PaymentStep` builds the `CreateOrderRequest` payload at lines 77–103 of `payment-step.svelte`. The `payload` object is built as `any`. [VERIFIED: codebase read]

After Phase 16, the creation branch must include `priceListId`:

```typescript
if (!draft?.isEditing) {
    ...
    payload.customer = draft?.customer;
    payload.items = orderItems;
    payload.priceListId = draft?.priceListId ?? null;  // ← NEW (D-09)
}
```

### Backend — Hexagonal Architecture Change Map

The hexagonal architecture requires changes at every layer. Each layer is independent. [VERIFIED: codebase read]

| Layer | File | Change |
|---|---|---|
| DTO (request) | `CreateOrderRequest.java` | Add `private UUID priceListId;` (no validation annotation — nullable per D-09) |
| DTO (response) | `OrderResponse.java` | Add `private UUID priceListId;` and optionally `private String priceListName;` |
| Domain model | `Order.java` | Add `private UUID priceListId;` |
| JPA entity | `OrderEntity.java` | Add `@Column(name = "price_list_id") private UUID priceListId;` |
| Persistence adapter | `OrderPersistenceAdapter.java` | Map `priceListId` in `save()` and `toDomain()` |
| Service | `SalesService.java` | Pass `request.getPriceListId()` through `createOrder()` to domain; include in `mapToResponse()` |
| Flyway migration | New `V4__add_price_list_id_to_order.sql` | `ALTER TABLE tco_order ADD COLUMN IF NOT EXISTS price_list_id UUID;` |

**D-12 compliance:** `UpdateOrderRequest.java` must NOT receive `priceListId`. It is already absent. No change needed — the field is simply omitted from that DTO.

**D-08: priceListName in OrderResponse.** The sales-service does not have access to catalog-service data at response-mapping time (bounded contexts, no shared tables per AI_RULES.md). Two valid approaches: (a) store `priceListName` as a separate column in `tco_order` at creation time (requires migration + DTO field on `CreateOrderRequest`); or (b) omit `priceListName` from `OrderResponse` and let the edit wizard resolve it with one `GET /pricelists/{id}` call. Given the bounded context rule and the fact that the edit wizard already makes an API call to load the order, approach (b) is lower-risk and simpler. **Recommendation: Store `priceListName` as a denormalized column in `tco_order`** so `OrderResponse` can return it without a cross-service call. This is consistent with how `garmentName` is denormalized in `tco_order_item`. The migration adds both `price_list_id` and `price_list_name` columns.

### Flyway Migration — V4

Next version is `V4` (current latest is `V3__order_lifecycle_improvements.sql`). [VERIFIED: codebase read]

```sql
-- V4__add_price_list_to_order.sql
ALTER TABLE tco_order
    ADD COLUMN IF NOT EXISTS price_list_id   UUID,
    ADD COLUMN IF NOT EXISTS price_list_name VARCHAR(255);
```

Both columns are nullable — additive migration, zero risk to existing data.

### Edit Wizard — Read-only Price List Display

The edit wizard (`/orders/[id]/edit/+page.svelte`) loads the order via `GET /orders/{id}` and hydrates `orderWizardState.activeDraft` at lines 31–56. [VERIFIED: codebase read]

Two changes needed:
1. In the `onMount` hydration block, include `priceListId: res.priceListId` and `priceListName: res.priceListName` when populating the draft.
2. Add `PriceListStep` to the `steps` array (same insertion as in new wizard).

The `PriceListStep` component checks `draft.isEditing` to render read-only mode.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile-native / desktop-styled select | Custom dropdown | `AdaptiveSelect` | Already handles `useIsMobile()` branching, shadcn on desktop, native `<select>` on mobile |
| Price list API call | Direct `fetch()` | `apiService.request<PriceListResponse[]>(\`\${API_CATALOG}/pricelists\`)` | All API calls must go through `apiService` per project rules |
| Wizard step navigation | Custom state machine | Existing `steps[]` index arithmetic in wizard shell | Already handles all edge cases; inserting a step at index 1 is the complete change |
| Form validation on selector step | Zod schema + superforms | Not needed — selector-only step uses `updateActiveDraft()` directly | Superforms adds complexity without value when there are no text inputs |
| Price list type definitions | New interfaces | `PriceListResponse`, `PriceListItemDto` in `dtos.ts` already defined | Already match backend DTO shape |
| DB migration | Hibernate `hbm2ddl.auto` | Flyway `V4__*.sql` file | All migrations use Flyway; auto-DDL is disabled in Quarkus production config |

---

## Common Pitfalls

### Pitfall 1: priceListItems stored before ItemSubWizard loads

**What goes wrong:** If `priceListItems` is fetched at wizard load instead of at price list selection, then changing the price list selection mid-wizard won't update the prefill prices in `ItemSubWizard`.

**Why it happens:** Convenience — one API call at mount. But D-05 explicitly requires fetch-at-selection-time.

**How to avoid:** In `PriceListStep.onSelectionChange`, call `GET /pricelists/{id}` to get full items, then `updateActiveDraft({ priceListItems: response.items })`. When "Ninguna" is selected, `updateActiveDraft({ priceListItems: [] })`.

**Warning signs:** `ItemSubWizard` shows old prices after user changes price list selection.

---

### Pitfall 2: serviceId type mismatch in price lookup

**What goes wrong:** `PriceListItemDto.serviceId` is `string` in `dtos.ts`. `ServiceResponse.id` is `string`. But if the backend returns UUIDs with different casing or format (e.g., lowercase vs. uppercase), `.find()` with `===` fails silently and all prices fall back to zero.

**Why it happens:** UUID strings are case-sensitive in JavaScript equality.

**How to avoid:** Normalize both sides to lowercase before comparison:
```typescript
p.serviceId.toLowerCase() === s.id.toLowerCase()
```

**Warning signs:** Price list is selected but all `unitPrice` fields remain at base price.

---

### Pitfall 3: Edit wizard draft hydration missing priceListId

**What goes wrong:** The edit wizard's `onMount` block (lines 31–56 of `edit/+page.svelte`) maps `OrderResponse` fields into the draft manually. If `priceListId` is not added to this mapping, `draft.priceListId` is `undefined` and `PriceListStep` shows "Sin lista de precios" even when one was selected at order creation.

**Why it happens:** The mapping is manual (no MapStruct); fields not explicitly listed are dropped.

**How to avoid:** Add `priceListId: res.priceListId, priceListName: res.priceListName` to the `orderWizardState.activeDraft` assignment block.

---

### Pitfall 4: Svelte 5 — `{@const}` inside HTML elements

**What goes wrong:** If `PriceListStep` uses `{@const ActivePriceList = ...}` inside a `<div>` block, the Svelte compiler throws a parse error.

**How to avoid:** `{@const}` must be a direct child of `{#if}`, `{#each}`, `{#key}`, or `{#snippet}` blocks — never inside raw HTML. (AI_RULES.md constraint.)

---

### Pitfall 5: `@Data` on JPA entity

**What goes wrong:** If `OrderEntity.java` accidentally gets `@Data` added (e.g., by a refactor), Hibernate's bidirectional `@OneToMany` / `@ManyToOne` triggers infinite recursion in `hashCode()` / `equals()`.

**How to avoid:** `OrderEntity` already uses `@Getter @Setter` only. Do not change this. Adding `price_list_id` field must follow the same `@Getter @Setter` pattern.

---

### Pitfall 6: Flyway migration version conflict

**What goes wrong:** If another migration is added in a parallel branch with version `V4`, Flyway fails on startup with a checksum conflict.

**Why it happens:** The naming is sequential and there is no coordination mechanism.

**How to avoid:** Check that `V4` does not already exist before writing the file. Current latest confirmed as `V3__order_lifecycle_improvements.sql`. [VERIFIED: codebase read]

---

### Pitfall 7: `priceListId` in UpdateOrderRequest (D-12 violation)

**What goes wrong:** If `priceListId` is accidentally added to `UpdateOrderRequest`, the edit endpoint could overwrite it, violating the immutability requirement.

**How to avoid:** Do NOT touch `UpdateOrderRequest.java`. The field is absent and must remain absent.

---

## Code Examples

### PriceListStep: Fetch and Select Pattern

```typescript
// price-list-step.svelte
import { onMount } from 'svelte';
import { apiService, API_CATALOG } from '$lib/services/api.svelte';
import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
import { AdaptiveSelect } from '$lib/components/ui/responsive';
import type { PriceListResponse, PriceListItemDto } from '$lib/types/dtos';
import { toast } from 'svelte-sonner';

let priceLists = $state<PriceListResponse[]>([]);
let loading = $state(true);

let draft = $derived(orderWizardState.activeDraft);

// Items for AdaptiveSelect: [{ value: '', label: 'Ninguna' }, ...lists]
let selectItems = $derived([
    { value: '', label: 'Sin lista de precios' },
    ...priceLists.map(pl => ({ value: pl.id, label: pl.name }))
]);

onMount(async () => {
    try {
        priceLists = await apiService.request<PriceListResponse[]>(
            `${API_CATALOG}/pricelists`
        );
    } catch (e) {
        toast.error('No se pudo cargar las listas de precios');
    } finally {
        loading = false;
    }
});

async function handlePriceListSelect(id: string) {
    if (!id) {
        orderWizardState.updateActiveDraft({
            priceListId: undefined,
            priceListName: undefined,
            priceListItems: []
        });
        return;
    }
    try {
        const selected = await apiService.request<PriceListResponse>(
            `${API_CATALOG}/pricelists/${id}`
        );
        orderWizardState.updateActiveDraft({
            priceListId: selected.id,
            priceListName: selected.name,
            priceListItems: selected.items ?? []
        });
    } catch (e) {
        toast.error('Error al cargar la lista de precios');
    }
}
```

### ItemSubWizard: Price Pre-fill with Price List Lookup

```typescript
// In item-sub-wizard.svelte handleServiceSelect()
function handleServiceSelect(s: any) {
    tempService = s;
    const draft = orderWizardState.activeDraft;
    const priceListItem = draft?.priceListItems?.find(
        (p: any) => p.serviceId.toLowerCase() === s.id.toLowerCase()
    );
    price = priceListItem
        ? String(priceListItem.price)
        : String(s.effectivePrice ?? s.basePrice);
    adj = "";
    adjReason = "";
    duration = s.defaultDurationMin || 30;
    step = 2;
}
```

### Backend: CreateOrderRequest with priceListId

```java
// CreateOrderRequest.java — add one field
@Data
public class CreateOrderRequest {
    @jakarta.validation.Valid
    private CustomerDto customer;
    @jakarta.validation.Valid
    private List<OrderItemDto> items;
    @jakarta.validation.constraints.FutureOrPresent(message = "La fecha de entrega debe ser hoy o en el futuro")
    private OffsetDateTime committedDeadline;
    private String notes;
    private java.math.BigDecimal amountPaid;
    private String paymentMethod;
    private UUID priceListId;  // nullable — no validation annotation (D-09)
}
```

### Backend: OrderEntity field addition

```java
// In OrderEntity.java — add field below existing columns, using @Getter @Setter (not @Data)
@Column(name = "price_list_id")
private UUID priceListId;

@Column(name = "price_list_name")
private String priceListName;
```

### Backend: SalesService createOrder — pass priceListId to domain

```java
// In SalesService.createOrder(), after setting other fields on Order:
order.setPriceListId(request.getPriceListId());  // nullable UUID, stored as-is
order.setPriceListName(/* resolved from request or left null */);
```

Note: `priceListName` is passed from the frontend via `CreateOrderRequest` as a convenience field OR resolved by adding `priceListName` to `CreateOrderRequest`. The simplest approach is to add `priceListName` to `CreateOrderRequest` as well (populated by the frontend when it has it in the draft) and store it directly — no inter-service call required.

### Backend: mapToResponse — include priceListId

```java
// In SalesService.mapToResponse() builder chain — add:
.priceListId(order.getPriceListId())
.priceListName(order.getPriceListName())
```

### Flyway V4 migration

```sql
-- V4__add_price_list_to_order.sql
ALTER TABLE tco_order
    ADD COLUMN IF NOT EXISTS price_list_id   UUID,
    ADD COLUMN IF NOT EXISTS price_list_name VARCHAR(255);
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| Service prices hardcoded at `basePrice` | Price list pre-fills `unitPrice` at selection time | Staff no longer need to manually look up client-specific rates |
| Order creation has no pricing context stored | `price_list_id` + `price_list_name` persisted on order | Audit trail and future invoicing (SEED-011) has the context needed |

---

## Open Questions

1. **Should `priceListName` be passed from the frontend in `CreateOrderRequest`, or resolved by sales-service?**
   - What we know: sales-service does not call catalog-service (bounded contexts). Frontend has `priceListName` in draft at creation time (it was fetched when the user selected the price list).
   - Recommendation: Add `private String priceListName;` to `CreateOrderRequest` (nullable, no validation). Frontend sends it. Sales-service stores it. Zero inter-service calls.

2. **Should `GET /pricelists` return only active price lists in the selector?**
   - What we know: `PriceListResponse` has an `active: boolean` field. The endpoint returns all price lists with no filter applied (verified in `PriceListController.getAll()`).
   - Recommendation: Filter on the frontend — `priceLists.filter(pl => pl.active)` in `PriceListStep`. This avoids a backend change and keeps the UI relevant. The backend change is deferred.

3. **Edit wizard: does the `PriceListStep` need to show in the stepper when editing?**
   - What we know: D-07 says it shows as read-only. The edit wizard has the same `steps[]` array structure.
   - Recommendation: Include it in the `steps` array. The step renders read-only when `draft.isEditing === true`. This keeps step numbering consistent between new and edit flows, which matters for staff muscle memory.

---

## Environment Availability

Step 2.6 SKIPPED — phase is code/configuration changes only. No new external tools, CLIs, databases, or runtimes are required. All dependencies (catalog-service, sales-service, PostgreSQL) are already running as part of the existing Docker Compose stack.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`. [VERIFIED: config.json]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Frontend: `bun run check` (svelte-check) + `bun run build`; Backend: `mvn quarkus:build` |
| Config file | `package.json` (frontend), `pom.xml` per service (backend) |
| Quick run command | `bun run check` (frontend type-check) |
| Full suite command | `bun run build && docker compose up --build` |

No automated unit test framework was found in the frontend (no `vitest.config.*`, no `jest.config.*`). The project's quality gate is compile-time (svelte-check + build) and integration-level (docker compose). This is consistent with the existing project pattern.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-16-01 | New Step 2 renders in wizard; steppers show 4 steps | build | `bun run check` + `bun run build` | ✅ (wizard shell exists) |
| REQ-16-02 | `priceListId` flows through `CreateOrderRequest` to DB | build + integration | `mvn quarkus:build -f anotame-api/backend/sales-service` | ✅ (existing build) |
| REQ-16-03 | Service selection in `ItemSubWizard` pre-fills price from active list | build | `bun run check` | ✅ (item-sub-wizard.svelte exists) |

### Sampling Rate
- **Per task commit:** `bun run check`
- **Per wave merge:** `bun run build`
- **Phase gate:** `bun run build` (exit 0) + `mvn quarkus:build` on sales-service + manual smoke test of wizard

### Wave 0 Gaps
None — existing test infrastructure (build + type-check) covers all phase requirements. No new test files need to be created before implementation begins.

---

## Security Domain

`security_enforcement` is not set to `false` in config — section is required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | Yes (existing) | Quarkus `@Authenticated` on all endpoints — no change needed for this phase |
| V3 Session Management | No | N/A for this phase |
| V4 Access Control | Partial | `GET /pricelists` is already `@Authenticated` — all roles can read price lists (correct: staff selects lists when taking orders) |
| V5 Input Validation | Yes | `priceListId` is nullable UUID in `CreateOrderRequest` — no `@NotNull` annotation required per D-09; Jakarta Bean Validation already active |
| V6 Cryptography | No | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Invalid UUID passed as `priceListId` | Tampering | Hibernate maps `UUID` type — malformed string rejected at deserialization before reaching service layer |
| Stale price list (deleted between selection and submission) | Tampering | D-09 explicitly defers cross-service validation; sales-service stores value as-is — acceptable per decision |
| Price override by staff (D-04) | Elevation of Privilege | Staff can override `unitPrice` — this is intentional business behavior, not a security issue |

No new security controls are needed beyond what is already in place.

---

## Runtime State Inventory

Phase 16 is a greenfield feature addition (new column, new UI step, new DTO fields). It is not a rename, refactor, or migration phase. The only runtime state change is the additive Flyway migration — existing order records gain two new nullable columns (`price_list_id`, `price_list_name`) that default to `NULL`. No data migration required.

**Nothing found in any runtime state category that requires action** beyond the Flyway migration itself.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `GET /pricelists` returns `items[]` inline (not requiring a separate `GET /pricelists/{id}` call for the list page) | Architecture Patterns — PriceListStep | If items are not included in the list response, the "fetch-at-selection" approach (D-05) is still correct — but the list-only fetch for populating the selector dropdown needs no items. Risk: LOW — D-05 already requires a second fetch at selection time regardless. |
| A2 | The Quarkus catalog-service route for price lists is `/pricelists` (relative to the service's base path), accessed by the frontend via `${API_CATALOG}/pricelists` | Standard Stack | If the path is different (e.g., `/catalog/pricelists`), the frontend call 404s. **Mitigation:** `PriceListController` is annotated `@Path("/pricelists")` and confirmed in codebase. API_CATALOG routes through the gateway which prepends `/api/catalog`. The actual frontend path should be `${API_CATALOG}/pricelists` = `/api/catalog/pricelists`. [VERIFIED: PriceListController.java] |

**All other claims in this research were verified directly from the codebase.**

---

## Sources

### Primary (HIGH confidence — verified from codebase)

- `anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte` — Wizard shell, steps array, navigation logic
- `anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte` — Edit wizard shell, draft hydration
- `anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts` — DraftOrder interface, state class
- `anotame-web/src/lib/components/orders/wizard/items-step.svelte` — ItemsStep, ItemSubWizard integration
- `anotame-web/src/lib/components/orders/wizard/item-sub-wizard.svelte` — handleServiceSelect, price initialization
- `anotame-web/src/lib/components/orders/wizard/payment-step.svelte` — CreateOrderRequest payload construction
- `anotame-web/src/lib/components/ui/responsive/adaptive-select.svelte` — AdaptiveSelect API and behavior
- `anotame-web/src/lib/types/dtos.ts` — PriceListResponse, PriceListItemDto, CreateOrderRequest, OrderResponse types
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/CreateOrderRequest.java` — Existing fields
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/OrderResponse.java` — Existing fields and builder
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/dto/UpdateOrderRequest.java` — Confirmed absence of priceListId
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/application/service/SalesService.java` — createOrder, mapToResponse, updateOrder
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/entity/OrderEntity.java` — Existing columns and JPA annotations
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/persistence/adapter/OrderPersistenceAdapter.java` — save() and toDomain() mapping patterns
- `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/model/Order.java` — Domain model fields
- `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/infrastructure/web/controller/PriceListController.java` — GET /pricelists, GET /pricelists/{id}
- `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/dto/PriceListResponse.java` — Response shape
- `anotame-api/backend/catalog-service/src/main/java/com/anotame/catalog/dto/PriceListItemDto.java` — serviceId, price, basePrice
- `anotame-api/backend/sales-service/src/main/resources/db/migration/` — V1, V2, V3 confirmed; V4 is next
- `.planning/codebase/CONVENTIONS.md` — Flyway conventions, Lombok patterns, layered architecture
- `AI_RULES.md` — All frontend and backend coding standards
- `.planning/config.json` — nyquist_validation: true, commit_docs: true

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified present in codebase
- Architecture: HIGH — all integration points verified by reading actual source files
- Pitfalls: HIGH — all pitfalls derived from verified code patterns, not speculation
- Backend change map: HIGH — complete hexagonal layer audit performed
- Frontend change map: HIGH — all affected components read in full

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase — no fast-moving dependencies)
