---
phase: 15-order-lifecycle-improvements
plan: 02
type: execute
wave: 2
depends_on:
  - 15-PLAN-1
files_modified:
  - anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte
  - anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte
  - anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts
  - anotame-web/src/lib/components/orders/wizard/payment-step.svelte
  - anotame-web/src/lib/types/dtos.ts
  - anotame-web/src/lib/i18n/messages/es.json
  - anotame-web/src/lib/i18n/messages/en.json
autonomous: true
requirements:
  - ORDER-01

must_haves:
  truths:
    - "Edit page at /orders/[id]/edit loads with wizard pre-populated from the existing order"
    - "EMPLOYEE role: garment type, services, and customer fields are read-only display text, not form inputs"
    - "ADMIN role: all fields are editable including customer reassignment"
    - "DELIVERED or CANCELLED orders show a non-dismissable alert banner and the form is fully read-only"
    - "Edit button on order detail page is hidden for DELIVERED and CANCELLED orders"
    - "Successful save navigates to /dashboard/orders/[id] and shows toast.success"
    - "409 from backend shows toast.error and stays on edit page"
    - "Pickup code shown in dedicated card section on order detail page"
    - "Submitting edit form sends PUT /api/sales/orders/{id} not POST"
    - "After successful edit, activeDraft is cleared (not completeActiveDraft)"
  artifacts:
    - path: "anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte"
      provides: "Edit order page with pre-populated wizard, role-based field restrictions"
      contains: "isEditing"
    - path: "anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts"
      provides: "Wizard state extended with clearActiveDraft() method and isEditing support"
      contains: "clearActiveDraft"
    - path: "anotame-web/src/lib/components/orders/wizard/payment-step.svelte"
      provides: "Payment step branched to PUT vs POST based on isEditing flag"
      contains: "isEditing"
    - path: "anotame-web/src/lib/types/dtos.ts"
      provides: "OrderResponse type with pickupCode and deliveredAt fields"
      contains: "pickupCode"
  key_links:
    - from: "edit/+page.svelte"
      to: "OrderWizardState.activeDraft"
      via: "onMount sets activeDraft with isEditing: true"
      pattern: "isEditing.*true"
    - from: "payment-step.svelte"
      to: "PUT /api/sales/orders/{id}"
      via: "draft?.isEditing branch"
      pattern: "draft.*isEditing"
    - from: "order detail +page.svelte"
      to: "order.pickupCode"
      via: "conditional render for pickup code section"
      pattern: "pickupCode"
---

<objective>
Frontend edit order page: wizard pre-population, role-based field restrictions, status lock UI, pickup code display on order detail, and Paraglide i18n key registration.

Purpose: Implements ORDER-01 entirely on the frontend. The edit route already has an href link in the orders list — this plan creates the destination page. Backend from Plan 1 is required to be running.
Output: Functional /orders/[id]/edit page with role-aware wizard, read-only mode for locked statuses, pickup code on detail page.
</objective>

<execution_context>
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/ROADMAP.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/phases/15-order-lifecycle-improvements/15-CONTEXT.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/phases/15-order-lifecycle-improvements/15-RESEARCH.md
@/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/.planning/phases/15-order-lifecycle-improvements/15-UI-SPEC.md

<interfaces>
<!-- Key existing code the executor must read before modifying. Extracted from research findings. -->

From OrderWizardState.svelte.ts (existing interface and methods):
- `DraftOrder` interface has `isEditing?: boolean` field already
- `activeDraft` is a `$state` field
- `saveCurrentDraft()` already guards: `if (!this.activeDraft || this.activeDraft.isEditing) return;`
- `completeActiveDraft()` deletes from storage AND clears activeDraft — DO NOT call this in edit mode
- Must add: `clearActiveDraft()` method that only sets `this.activeDraft = null` without storage interaction

From payment-step.svelte (submit logic to branch):
- Currently submits to `POST ${API_SALES}/orders`
- Must branch: if `draft?.isEditing` is true, use `PUT ${API_SALES}/orders/${draft.id}`
- After successful PUT, call `orderWizardState.clearActiveDraft()` (NOT completeActiveDraft)
- Then navigate to `/dashboard/orders/${draft.id}`
- Show `toast.success(m.order_saved())`

From existing new order page (+page.svelte in /orders/new):
- Read this file to understand how the wizard steps are assembled
- The edit page follows the same structure but with pre-population

From order detail +page.svelte (/orders/[id]/+page.svelte):
- Read to understand current layout and where to add pickup code section
- Edit button: hide (not just disable) when order.status === 'DELIVERED' || order.status === 'CANCELLED'

Constraint (from Finding 7 in RESEARCH.md):
- Existing order pages do NOT use Paraglide — they hardcode Spanish strings
- Follow the existing codebase pattern: hardcode Spanish strings directly
- This is a known deviation from AI_RULES.md mandate — document it but follow existing pattern for consistency

Role codes (CRITICAL — from Finding 1 in RESEARCH.md):
- 'EMPLOYEE' in code = what CONTEXT.md calls 'OPERATOR'
- Use `authService.user?.role === 'ADMIN'` for admin check
- Import: `import { authService } from '$lib/services/auth.svelte'`

TypeScript OrderResponse (from dtos.ts — add fields):
```typescript
// Add to OrderResponse interface:
pickupCode?: string;
deliveredAt?: string;  // ISO string
```

Svelte 5 rules:
- Use `$state`, `$derived`, `$effect` — never Svelte 4 stores
- Never `<svelte:component>` — map icons to uppercase variable
- Never `window.confirm()` — use `adaptiveConfirm()`
- h-12 minimum on all interactive elements + `touch-manipulation`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Edit order page + wizard pre-population + OrderWizardState.clearActiveDraft()</name>
  <files>
    anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte,
    anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts,
    anotame-web/src/lib/types/dtos.ts
  </files>

  <read_first>
    - anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts (full file — DraftOrder interface, existing methods, activeDraft state, saveCurrentDraft guard)
    - anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte (full file — wizard step assembly pattern, imports, layout structure to replicate)
    - anotame-web/src/lib/components/orders/wizard/customer-step.svelte (props expected — to understand pre-population)
    - anotame-web/src/lib/components/orders/wizard/items-step.svelte (props expected)
    - anotame-web/src/lib/components/orders/wizard/payment-step.svelte (props expected)
    - anotame-web/src/lib/types/dtos.ts (OrderResponse interface — fields available to map to DraftOrder)
    - anotame-web/src/lib/services/api.svelte.ts (apiService.request pattern, API_SALES constant location)
  </read_first>

  <action>
**dtos.ts** — Add `pickupCode` and `deliveredAt` to `OrderResponse` interface:
```typescript
// Inside existing OrderResponse interface, add:
pickupCode?: string;
deliveredAt?: string;  // ISO string (OffsetDateTime serialized)
```

**OrderWizardState.svelte.ts** — Add `clearActiveDraft()` method. This method ONLY clears the in-memory reference, does not touch localStorage/PersistedState. Add it alongside `completeActiveDraft()`:
```typescript
clearActiveDraft(): void {
    this.activeDraft = null;
}
```

**edit/+page.svelte** — Create this file at `anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte`. Read the `/orders/new/+page.svelte` file first to understand the full wizard assembly pattern, then create the edit page following the same structure with these differences:

1. **Route parameter:** Extract `id` from `$page.params.id` (SvelteKit page params).

2. **onMount / $effect — pre-populate wizard:** On mount, call `apiService.request<OrderResponse>(GET \`${API_SALES}/orders/${id}\`)` to load the existing order. Map the response to a `DraftOrder` shape and assign to `orderWizardState.activeDraft`:
```typescript
orderWizardState.activeDraft = {
    id: existing.id,          // real order UUID
    isEditing: true,           // CRITICAL — prevents draft persistence + triggers PUT on submit
    currentStep: 0,
    lastModified: Date.now(),
    customer: existing.customer,  // map customer object — check DraftOrder.customer type shape
    items: existing.items.map((item) => ({
        // map to DraftOrderItem shape — read DraftOrder interface for exact field names
    })),
    amountPaid: existing.amountPaid,
    paymentMethod: existing.paymentMethod,
    committedDeadline: existing.committedDeadline,
    notes: existing.notes ?? ''
};
```
Check the `DraftOrder` and `DraftOrderItem` interfaces carefully before mapping — use the exact field names from those interfaces.

3. **Role-based field restrictions:** Read `authService.user?.role` reactively:
```typescript
const isAdmin = $derived(authService.user?.role === 'ADMIN');
```
Pass `isAdmin` to wizard steps as a prop. In the edit page:
- `customer-step.svelte` receives a `readonly` or `disabled` prop when `!isAdmin` to hide/disable customer field
- `items-step.svelte` receives `readonly` when `!isAdmin` to disable garment/service changes
- `payment-step.svelte` remains editable for all roles (payment status, due date, notes are always editable)

Read each wizard step's existing props before deciding how to pass readonly state. If the steps do not already have a `readonly` prop, you may need to add it in Task 2 (or add it here if simpler). The key behavior: for EMPLOYEE role, customer and garment/service fields appear as read-only text (not interactive form inputs).

4. **Status lock:** Before rendering the wizard, check if `existing.status === 'DELIVERED' || existing.status === 'CANCELLED'`. If true:
- Display a non-dismissable Alert banner at the top of the page with `role="alert"`:
  - Text: "Este pedido no puede modificarse. Los pedidos entregados o cancelados son de solo lectura."
  - Use `$lib/components/ui/card` or a styled div — whichever the project uses for alert banners (check existing usage in codebase)
- Render the wizard steps in a fully read-only/display mode (pass `readonly={true}` to all steps)
- Do NOT show a save button when the order is locked

5. **Page title:** Display "Editar pedido #[ticketNumber]" using the existing order's ticket number (check `OrderResponse` for the field name — likely `ticketNumber` or `ticket`).

6. **Error state — order not found:** If the API call returns 404 or throws, display: heading "Pedido no encontrado", body "Este pedido no existe o no tienes acceso para editarlo." (match empty state styling used on other pages).

7. **Loading state:** Show a loading skeleton or spinner while the API call is in flight — follow whatever pattern the orders detail page uses.

8. **No draft saving:** The edit page MUST NOT call `orderWizardState.saveCurrentDraft()` anywhere. The `isEditing: true` flag guards against accidental persistence, but the edit page should also never trigger save explicitly.
  </action>

  <verify>
    <automated>cd "/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web" && bun run check 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte exists
    - edit/+page.svelte contains `isEditing: true`
    - edit/+page.svelte contains `orderWizardState.activeDraft =`
    - edit/+page.svelte contains `authService.user?.role`
    - edit/+page.svelte contains `DELIVERED` and `CANCELLED` (status lock check)
    - edit/+page.svelte contains `role="alert"` (status lock banner)
    - edit/+page.svelte contains `Este pedido no puede modificarse`
    - OrderWizardState.svelte.ts contains `clearActiveDraft()`
    - dtos.ts contains `pickupCode?: string`
    - dtos.ts contains `deliveredAt?: string`
    - `bun run check` exits 0 (no TypeScript errors)
  </acceptance_criteria>

  <done>Edit page route exists and pre-populates wizard from existing order. Status lock banner shows for DELIVERED/CANCELLED. Role-based field restrictions applied. clearActiveDraft() method added to wizard state. TypeScript check passes.</done>
</task>

<task type="auto">
  <name>Task 2: payment-step submit branching + order detail pickup code display + edit button lock</name>
  <files>
    anotame-web/src/lib/components/orders/wizard/payment-step.svelte,
    anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte,
    anotame-web/src/lib/i18n/messages/es.json,
    anotame-web/src/lib/i18n/messages/en.json
  </files>

  <read_first>
    - anotame-web/src/lib/components/orders/wizard/payment-step.svelte (full file — current submit logic, form submission pattern, apiService.request call, navigation, toast calls)
    - anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte (full file — current layout, where edit button is rendered, order data structure in template)
    - anotame-web/src/lib/i18n/messages/es.json (current keys — to append new keys, not overwrite)
    - anotame-web/src/lib/i18n/messages/en.json (current keys — to append new keys)
    - anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts (clearActiveDraft signature just added in Task 1)
  </read_first>

  <action>
**payment-step.svelte — branch submit to PUT vs POST:**

Read the existing submit handler thoroughly. Find where `apiService.request('POST', ...)` is called. Add branching based on `draft?.isEditing`:

```typescript
// In the submit handler, replace the hardcoded POST with:
const method = draft?.isEditing ? 'PUT' : 'POST';
const url = draft?.isEditing
    ? `${API_SALES}/orders/${draft.id}`
    : `${API_SALES}/orders`;

try {
    await apiService.request(method, url, payload); // adjust to match existing apiService.request signature
    if (draft?.isEditing) {
        orderWizardState.clearActiveDraft(); // NOT completeActiveDraft()
        toast.success('Pedido guardado correctamente.');
        goto(`/dashboard/orders/${draft.id}`);
    } else {
        orderWizardState.completeActiveDraft(); // existing create flow
        toast.success('Pedido creado correctamente.'); // existing message
        goto('/dashboard/orders');
    }
} catch (e) {
    if (e instanceof ApiError && e.status === 409) {
        toast.error('No es posible editar este pedido.');
    } else {
        toast.error('Ocurrió un error. Por favor, intente nuevamente.');
    }
}
```
Check the existing error handling pattern in payment-step.svelte — use the same error class/import that already exists (e.g., `ApiError` from apiService or a similar pattern). Do NOT change the existing create-order success flow (only add the edit branch alongside it).

Check the exact `apiService.request()` signature from the service file — it may be `apiService.request<T>(method, path, body)` or a different shape.

**order detail +page.svelte — two changes:**

1. **Hide edit button for locked statuses** — Find the existing edit button/link (it navigates to `/orders/[id]/edit`). Change it from always rendering to conditional:
```svelte
{#if order.status !== 'DELIVERED' && order.status !== 'CANCELLED'}
    <!-- existing edit button/link -->
{/if}
```
Do not disable it — hide it entirely (as per D-09: "hide/disable edit button" — UI-SPEC says "hidden" for locked statuses).

2. **Show pickup code section** — Add a dedicated card section labeled "Código de retiro" below the order header or alongside the order details. Only render this section if `order.pickupCode` exists:
```svelte
{#if order.pickupCode}
<div class="...card/section styling...">
    <p class="text-sm text-muted-foreground">Código de retiro</p>
    <p class="text-2xl font-semibold tracking-widest font-mono">{order.pickupCode}</p>
</div>
{/if}
```
Use the existing card/section styling patterns on this page. Apply `font-mono text-2xl font-semibold tracking-widest` exactly as specified in UI-SPEC.

**i18n keys — es.json and en.json:**
The existing pages do NOT use Paraglide (hardcode Spanish per Finding 7 in RESEARCH.md). However, add the following keys to both files for future use and to satisfy the AI_RULES.md requirement at the file level. Append these keys to the existing JSON objects (do not overwrite existing keys):

es.json additions:
```json
"order_save_changes": "Guardar cambios",
"order_edit_title": "Editar pedido",
"order_locked_banner": "Este pedido no puede modificarse. Los pedidos entregados o cancelados son de solo lectura.",
"order_locked": "No es posible editar este pedido.",
"order_saved": "Pedido guardado correctamente.",
"delivery_confirm_title": "Confirmar entrega",
"delivery_confirm_body": "Ingrese el código de retiro del cliente para confirmar la entrega.",
"delivery_confirm_action": "Confirmar entrega",
"delivery_code_error": "Código incorrecto. Verifique con el cliente.",
"order_delivered": "Pedido entregado correctamente.",
"pickup_code_label": "Código de retiro",
"bulk_select_activate": "Seleccionar pedidos",
"bulk_select_cancel": "Cancelar selección",
"bulk_count": "{N} seleccionadas",
"bulk_change_status": "Cambiar estado",
"bulk_delete": "Eliminar pedidos",
"bulk_delete_disabled": "Solo se pueden eliminar pedidos en borrador",
"bulk_delete_confirm_title": "Eliminar pedidos",
"bulk_delete_confirm_body": "Se eliminarán {N} pedidos en borrador. Esta acción no se puede deshacer.",
"bulk_updated": "Se actualizaron {N} pedidos.",
"operations_ready_tab": "Listas para entrega",
"ready_empty_heading": "Sin pedidos listos",
"ready_empty_body": "No hay pedidos marcados como LISTO en este momento.",
"order_deliver_action": "Entregar pedido",
"generic_error": "Ocurrió un error. Por favor, intente nuevamente."
```

en.json additions (English equivalents):
```json
"order_save_changes": "Save changes",
"order_edit_title": "Edit order",
"order_locked_banner": "This order cannot be modified. Delivered or cancelled orders are read-only.",
"order_locked": "This order cannot be edited.",
"order_saved": "Order saved successfully.",
"delivery_confirm_title": "Confirm delivery",
"delivery_confirm_body": "Enter the customer's pickup code to confirm delivery.",
"delivery_confirm_action": "Confirm delivery",
"delivery_code_error": "Incorrect code. Please verify with the customer.",
"order_delivered": "Order delivered successfully.",
"pickup_code_label": "Pickup code",
"bulk_select_activate": "Select orders",
"bulk_select_cancel": "Cancel selection",
"bulk_count": "{N} selected",
"bulk_change_status": "Change status",
"bulk_delete": "Delete orders",
"bulk_delete_disabled": "Only draft orders can be deleted",
"bulk_delete_confirm_title": "Delete orders",
"bulk_delete_confirm_body": "This will delete {N} draft orders. This action cannot be undone.",
"bulk_updated": "Updated {N} orders.",
"operations_ready_tab": "Ready for pickup",
"ready_empty_heading": "No orders ready",
"ready_empty_body": "There are no orders marked as READY right now.",
"order_deliver_action": "Deliver order",
"generic_error": "An error occurred. Please try again."
```
  </action>

  <verify>
    <automated>cd "/Users/maximilianogonzalezcalzada/Library/Mobile Documents/com~apple~CloudDocs/source/personal/anotame-microservices/anotame-web" && bun run build 2>&1 | tail -20</automated>
  </verify>

  <acceptance_criteria>
    - payment-step.svelte contains `draft?.isEditing`
    - payment-step.svelte contains `orderWizardState.clearActiveDraft()`
    - payment-step.svelte contains the string `PUT` (HTTP method branch)
    - order detail +page.svelte contains `order.status !== 'DELIVERED' && order.status !== 'CANCELLED'` (or equivalent guard on edit link)
    - order detail +page.svelte contains `pickupCode`
    - order detail +page.svelte contains `tracking-widest` and `font-mono` (pickup code display styling)
    - messages/es.json contains `"order_saved"` key
    - messages/es.json contains `"order_locked_banner"` key
    - messages/en.json contains `"order_saved"` key
    - `bun run build` exits 0
  </acceptance_criteria>

  <done>payment-step correctly branches to PUT for edit mode, calls clearActiveDraft(), navigates to detail page with success toast. Order detail page hides edit button for DELIVERED/CANCELLED and shows pickup code section. All i18n keys registered. Build passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| edit page → PUT /orders/{id} | Wizard form data sent to backend; role restriction enforced server-side (primary) and frontend (secondary) |
| client role check (frontend) | Role read from `authService.user?.role` — derived from authenticated session, not user input |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-15-07 | Elevation of Privilege | edit page role-based field hiding | accept | Frontend restriction is defense-in-depth only; backend enforces role in SalesService (Plan 1, T-15-01). Frontend hides fields for UX, backend is authoritative |
| T-15-08 | Tampering | activeDraft.isEditing bypass via localStorage manipulation | accept | `isEditing: true` suppresses `saveCurrentDraft()`; even if bypassed, the backend status lock (Plan 1) prevents writes to DELIVERED/CANCELLED orders. Low risk. |
| T-15-09 | Information Disclosure | pickup code visible on order detail page | accept | Staff-only authenticated route; pickup code is meant to be read by staff and given to the customer verbally. Acceptable disclosure in context. |
| T-15-10 | Spoofing | edit form submitting to wrong order ID | mitigate | `draft.id` is set from the API response on mount (not from URL param alone); backend validates order ownership. Route param tampering would hit a different order's PUT endpoint which requires valid JWT. |
</threat_model>

<verification>
After both tasks complete:
1. Run `bun run build && bun run check` in anotame-web — must exit 0
2. Navigate to `/dashboard/orders/[id]/edit` for an existing RECEIVED order — wizard must load pre-populated
3. As EMPLOYEE: verify customer and garment/service fields are read-only; due date, notes, payment are editable
4. As ADMIN: verify all fields are editable
5. Navigate to a DELIVERED order detail page — edit button must be absent; pick up "Código de retiro" section is visible
6. Open edit page for a DELIVERED order — status lock banner must appear with `role="alert"`
7. Save a valid edit — must navigate to /dashboard/orders/[id] with success toast
</verification>

<success_criteria>
- /orders/[id]/edit route exists and pre-populates wizard from API response
- EMPLOYEE role: customer + garment/service fields read-only; notes/date/payment editable
- Status lock: DELIVERED/CANCELLED order shows alert banner, edit button hidden on detail page
- Submit sends PUT not POST, calls clearActiveDraft() on success
- 409 response shows toast.error and stays on edit page
- Pickup code displayed in order detail with font-mono text-2xl tracking-widest
- All Paraglide i18n keys registered in es.json and en.json
- Build: bun run build exits 0
</success_criteria>

<output>
After completion, create `.planning/phases/15-order-lifecycle-improvements/15-02-SUMMARY.md`
</output>
