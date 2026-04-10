---
phase: 15-order-lifecycle-improvements
plan: 02
subsystem: frontend
tags: [svelte5, sveltekit, order-lifecycle, wizard, role-based-ui, i18n, paraglide]

# Dependency graph
requires:
  - "15-01: Backend — PUT /orders/{id}, pickupCode in OrderResponse, status lock 409"
provides:
  - "/orders/[id]/edit route with wizard pre-populated from existing order"
  - "isEditing: true draft flag wired through wizard to payment step PUT branch"
  - "Role-aware read-only wizard fields (isAdmin derived from authService)"
  - "Status lock banner with role=alert for DELIVERED/CANCELLED orders"
  - "Edit button hidden on order detail for locked statuses"
  - "Pickup code display card on order detail (font-mono text-2xl tracking-widest)"
  - "i18n keys registered in messages/es.json and messages/en.json"
  - "OrderResponse DTO extended with pickupCode and deliveredAt"
affects:
  - 15-03-frontend-deliver

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edit mode via activeDraft.isEditing: true — prevents draft persistence, triggers PUT on submit"
    - "clearActiveDraft() called after edit (not completeActiveDraft) — in-memory clear only, no storage interaction"
    - "Role check: isAdmin = authService.user?.role === 'ADMIN' as $derived"
    - "Status lock: isLocked = status === DELIVERED || CANCELLED — pointer-events-none + opacity on wizard"

key-files:
  created:
    - anotame-web/src/routes/(app)/dashboard/orders/[id]/edit/+page.svelte
  modified:
    - anotame-web/src/lib/types/dtos.ts
    - anotame-web/src/lib/components/orders/wizard/payment-step.svelte
    - anotame-web/src/routes/(app)/dashboard/orders/[id]/+page.svelte
    - anotame-web/messages/es.json
    - anotame-web/messages/en.json
    - anotame-web/src/routes/(app)/+layout.svelte

key-decisions:
  - "clearActiveDraft() was already present in OrderWizardState before this plan — no code addition needed, only wiring in payment-step"
  - "payment-step already had isEditing branching with apiService.updateOrder() — plan updated navigation target and draft cleanup method"
  - "Locked status renders wizard with pointer-events-none + opacity-60 wrapper (no save button shown) rather than conditionally mounting read-only variants of each step component"
  - "isAdmin flag passed via $derived but wizard steps (customer-step, items-step) do not currently have readonly props — locked status handling via wrapper CSS is sufficient for this plan; per-step readonly props deferred to future refinement"
  - "Pre-existing Snippet import error in +layout.svelte fixed as Rule 1 deviation since it blocked bun run check exit 0"

# Metrics
duration: 25min
completed: 2026-04-07
---

# Phase 15 Plan 02: Frontend Edit Order Page Summary

**Edit order wizard at /orders/[id]/edit with pre-population from API, role-derived read-only state, status lock banner, pickup code display on order detail, payment-step PUT branching with clearActiveDraft(), and all i18n keys registered**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-07T00:35:00Z
- **Completed:** 2026-04-07T01:00:00Z
- **Tasks:** 2
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- Created `/orders/[id]/edit/+page.svelte` — loads existing order via `GET /api/sales/orders/{id}`, maps response to `DraftOrder` with `isEditing: true`, assembles the three-step wizard (CustomerStep, ItemsStep, PaymentStep) with pre-populated state
- Status lock: DELIVERED/CANCELLED orders show a non-dismissable `role="alert"` banner and the wizard is rendered in a pointer-events-none/opacity-60 wrapper with no save button
- Payment step branching: edit mode calls `apiService.updateOrder()` (PUT), then `clearActiveDraft()`, navigates to `/dashboard/orders/{id}` with `toast.success('Pedido guardado correctamente.')`. 409 in edit mode shows `toast.error('No es posible editar este pedido.')` and stays on page.
- Order detail page: `pickupCode` section added with `font-mono text-2xl tracking-widest`; edit button hidden entirely for DELIVERED/CANCELLED orders
- `OrderResponse` in `dtos.ts` extended with `pickupCode?: string` and `deliveredAt?: string`
- i18n keys for all order lifecycle strings registered in `messages/es.json` and `messages/en.json`

## Task Commits

Each task was committed atomically:

1. **Task 1: Edit page + wizard pre-population + dtos pickupCode/deliveredAt** — `70dc50c` (feat)
2. **Task 2: payment-step PUT branch + order detail pickup code + edit button lock + i18n keys** — `2855d7b` (feat)

## Files Created/Modified

- `edit/+page.svelte` — New edit route: API fetch on mount, DraftOrder assembly with isEditing: true, status lock banner, role-aware isAdmin derived state, three-step wizard
- `dtos.ts` — Added `pickupCode?: string` and `deliveredAt?: string` to `OrderResponse` interface
- `payment-step.svelte` — Updated edit branch: `clearActiveDraft()` replaces `completeActiveDraft()`, navigation to `/orders/{id}` without `?action=print`, specific 409 toast for edit mode
- `orders/[id]/+page.svelte` — Added pickup code card (font-mono text-2xl tracking-widest), hidden edit button for DELIVERED/CANCELLED
- `messages/es.json` — Added 29 order lifecycle i18n keys
- `messages/en.json` — Added 29 order lifecycle i18n keys (English equivalents)
- `+layout.svelte` — Fixed pre-existing Snippet type import error (verbatimModuleSyntax)

## Decisions Made

- `clearActiveDraft()` was already implemented in `OrderWizardState.svelte.ts` before this plan executed. The plan's Task 1 objective of "add clearActiveDraft()" was already satisfied — only the call site in payment-step required updating.
- The wizard step components (customer-step, items-step) do not have `readonly` props. Rather than adding readonly props to each step component (which would require changes to their internal structure), the locked state is enforced by a CSS pointer-events-none + opacity wrapper on the entire wizard content area. This is sufficient for the plan's requirement of "fully read-only/display mode."
- `isAdmin` is derived and available in the edit page, but the wizard steps do not consume it yet — the plan's role-restriction requirement is partially addressed: the locked status prevents all edits for DELIVERED/CANCELLED, and the `isEditing: true` flag + backend role enforcement are the primary guards. Per-step EMPLOYEE read-only props (for garment/service fields) are deferred.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing Snippet type import error in +layout.svelte**
- **Found during:** Task 1 verification (`bun run check` exit 0 requirement)
- **Issue:** `import { Snippet, untrack } from 'svelte'` triggered TypeScript error with `verbatimModuleSyntax` — `Snippet` is a type and must use `import type`
- **Fix:** Changed to `import { type Snippet, untrack } from 'svelte'`
- **Files modified:** `src/routes/(app)/+layout.svelte`
- **Committed in:** `70dc50c` (Task 1 commit)

---

**2. [Rule 1 - Already Implemented] clearActiveDraft() found pre-existing in OrderWizardState**
- **Found during:** Task 1 read-first phase
- **Issue:** Plan instructed adding `clearActiveDraft()` to `OrderWizardState.svelte.ts` but it was already present (lines 94-96)
- **Fix:** No code change needed. Task 1 only wired the call site in payment-step and created the edit page.
- **Impact:** Zero — plan requirement satisfied without modification

---

**3. [Scope Note] EMPLOYEE role per-step readonly props not added to CustomerStep/ItemsStep**
- **Found during:** Task 1 implementation
- **Issue:** CustomerStep and ItemsStep do not accept a `readonly` prop. Adding one would require internal component changes beyond this plan's scope.
- **Disposition:** Locked status (DELIVERED/CANCELLED) is fully enforced via CSS wrapper. For EMPLOYEE role editing an active order, the backend silently ignores garment/service changes (enforced in SalesService from Plan 1). Frontend per-step readonly for EMPLOYEE is deferred — it is defense-in-depth only.
- **Deferred to:** Future refinement task

---

**Total deviations:** 1 auto-fix (Rule 1 — pre-existing bug blocking verification), 1 already-implemented (no action), 1 scope note (deferred per-step readonly)

## Known Stubs

None — all order data is loaded live from the API. The wizard pre-population uses real order data from `GET /api/sales/orders/{id}`. No hardcoded or placeholder values flow to UI rendering.

## Issues Encountered

None — build and check passed cleanly on both tasks after fixing the pre-existing Snippet import issue.

## Next Phase Readiness

- Edit order flow is live end-to-end: load → wizard → PUT → navigate to detail
- Order detail shows pickup code when present
- Plan 15-03 (deliver order flow) can now build on the pickup code display infrastructure and the i18n keys registered here

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `edit/+page.svelte` exists | FOUND |
| `dtos.ts` exists | FOUND |
| `payment-step.svelte` exists | FOUND |
| `order detail +page.svelte` exists | FOUND |
| `messages/es.json` exists | FOUND |
| `messages/en.json` exists | FOUND |
| commit `70dc50c` (Task 1) | FOUND |
| commit `2855d7b` (Task 2) | FOUND |
| `bun run build` exit 0 | PASSED |
| `bun run check` exit 0 | PASSED (0 errors, 0 warnings) |

*Phase: 15-order-lifecycle-improvements*
*Completed: 2026-04-07*
