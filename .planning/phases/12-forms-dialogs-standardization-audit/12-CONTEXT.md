# Phase 12: Forms & Dialogs Standardization Audit - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify and fix all forms and dialogs across `anotame-web` to follow consistent shadcn/ui + sveltekit-superforms patterns. This includes:
- The 4 dedicated CRUD dialog components (customer, garment, service, user)
- Non-dialog page forms (order wizard steps, pricelists detail/new) — these must comply with shadcn/ui + superforms patterns but are NOT converted to dialogs

New capabilities (delete confirmations, bulk operations, new form flows) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Form Component Depth
- **D-01:** All forms adopt `Form.Field` + `Form.Label` + `Form.FieldErrors` wrappers from the shadcn superforms kit (`$lib/components/ui/form`). No raw `Input` + manual `{#if $errors.x}` error blocks remain.
  - This applies to all 4 dialog components and all non-dialog page forms in scope
  - The form kit wrappers wire up aria-describedby automatically — reduces a11y work in Phase 13
  - The `$lib/components/ui/form/` directory is already present (populated during Phase 10 preset regeneration); these components are currently unused in practice

### Loading State
- **D-02:** Submit buttons show a spinner inside the button while `isSubmitting` is true. Button is disabled during submission. Existing `isSubmitting` state variable pattern (already in all 4 dialogs) is the right hook — just needs the spinner UI wired up.

### Toast Consistency
- **D-03:** Every dialog shows a success toast on successful create and edit. Use existing Spanish message patterns from dialogs that already have them (garment-dialog, service-dialog are the reference). No new message standardization — that belongs in the Paraglide i18n phase.
- **D-04:** Error toasts on API failure are already consistent across all dialogs — preserve this pattern.

### Scope: Dialog vs Page Forms
- **D-05:** Primary targets are the 4 CRUD dialog components:
  - `src/lib/components/customers/customer-dialog.svelte`
  - `src/lib/components/catalog/garment-dialog.svelte`
  - `src/lib/components/catalog/service-dialog.svelte`
  - `src/lib/components/users/user-dialog.svelte`
- **D-06:** Non-dialog page forms are also in scope for shadcn/ui + superforms compliance (not dialog conversion):
  - Order wizard steps (`src/lib/components/orders/wizard/` — customer-step, items-step, payment-step)
  - Pricelists detail/new pages (`src/routes/(app)/dashboard/catalog/pricelists/[id]/+page.svelte`, `pricelists/new/+page.svelte`)
  - Schedule page (`src/routes/(app)/dashboard/admin/schedule/+page.svelte`) — uses raw bind:value pattern, not superforms
  - Login and register pages (`src/routes/login/+page.svelte`, `src/routes/register/+page.svelte`)

### Claude's Discretion
- Exact spinner implementation (Lucide `Loader2` with `animate-spin` is the established pattern — use it)
- Whether to extract a shared `SubmitButton` component or inline the spinner per dialog
- Order of migrating dialogs vs page forms (dialogs first is logical given they're the primary target)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Dialog Components (primary targets)
- `anotame-web/src/lib/components/customers/customer-dialog.svelte` — superforms + Dialog, no success toast, no Form.* wrappers
- `anotame-web/src/lib/components/catalog/garment-dialog.svelte` — superforms + Dialog, has success toast, no Form.* wrappers
- `anotame-web/src/lib/components/catalog/service-dialog.svelte` — superforms + Dialog, has success toast, no Form.* wrappers
- `anotame-web/src/lib/components/users/user-dialog.svelte` — superforms + Dialog, check for toast and Form.* usage

### Form Kit (to be adopted)
- `anotame-web/src/lib/components/ui/form/` — shadcn superforms form kit: Form.Field, Form.Label, Form.FieldErrors, Form.Description, Form.FieldSet, Form.Button — currently unused in practice

### Non-Dialog Page Forms (secondary targets)
- `anotame-web/src/lib/components/orders/wizard/` — order wizard steps
- `anotame-web/src/routes/(app)/dashboard/catalog/pricelists/[id]/+page.svelte`
- `anotame-web/src/routes/(app)/dashboard/catalog/pricelists/new/+page.svelte`
- `anotame-web/src/routes/(app)/dashboard/admin/schedule/+page.svelte`
- `anotame-web/src/routes/login/+page.svelte`
- `anotame-web/src/routes/register/+page.svelte`

### Design System
- `anotame-web/src/routes/layout.css` — design tokens; semantic color vars (--destructive, --warning, --success) available for error/success states

### Prior Phase Context
- `.planning/phases/10-shadcn-preset-init-design-token-refresh/10-CONTEXT.md` — component regeneration decisions; Dialog, Input, Button, Form are the canonical components
- `.planning/phases/11-datatablewrapper-filter-consolidation/11-CONTEXT.md` — filter/table decisions (not directly relevant but confirms established patterns)

</canonical_refs>
