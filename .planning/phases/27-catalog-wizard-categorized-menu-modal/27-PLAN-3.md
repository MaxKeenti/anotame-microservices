---
phase: 27-catalog-wizard-categorized-menu-modal
plan: 3
type: execute
wave: 3
depends_on: [2]
files_modified:
  - anotame-web/src/routes/(app)/dashboard/catalog/wizard/+page.svelte
autonomous: false  # has a checkpoint:human-verify task for mobile/375px verification
requirements:
  - CAT-WIZ-02  # Wizard route mirrors orders/new stepper (ROADMAP success criterion #2)
  - CAT-WIZ-03  # End-to-end create flow via existing endpoints (ROADMAP success criterion #3)
  - CAT-WIZ-04  # Edit flow via ?serviceId= (ROADMAP success criterion #4)
  - CAT-WIZ-07  # Admin-guarded + 375px touch-friendly (ROADMAP success criterion #7)

must_haves:
  truths:
    - "Navigating to `/dashboard/catalog/wizard` renders a 3-step flow using the same stepper header (step circles + mobile expand tray) and `onNext`/`onBack` interface as `orders/new/+page.svelte`."
    - "Navigating to `/dashboard/catalog/wizard?serviceId={id}` triggers `catalogWizardState.loadForEdit(id)` on mount; all three steps pre-populate from the existing service+garment."
    - "Page is guarded with `useAuthGuard(true, '/dashboard')` (admin-only) — same pattern as pricelists; rendering uses `guard.checking` / `guard.allowed`."
    - "On successful submit, a success toast appears and the user is redirected to `/dashboard/catalog/services`."
    - "On submit failure, error toast appears and the user remains on the review step with state intact for retry."
    - "Page renders correctly at 375px viewport: step circles fit in one row, mobile expand tray works, all touch targets are `h-12` with `touch-manipulation`."
  artifacts:
    - path: "anotame-web/src/routes/(app)/dashboard/catalog/wizard/+page.svelte"
      provides: "Wizard page route"
      contains: "useAuthGuard"
      min_lines: 90
  key_links:
    - from: "wizard/+page.svelte"
      to: "CatalogWizardState"
      via: "import catalogWizardState; reads currentStep, calls reset()/loadForEdit()"
      pattern: "catalogWizardState\\.(reset|loadForEdit|currentStep)"
    - from: "wizard/+page.svelte"
      to: "useAuthGuard"
      via: "guard for admin"
      pattern: "useAuthGuard\\(true"
    - from: "wizard/+page.svelte"
      to: "step components"
      via: "renders GarmentStep / ServiceStep / ReviewStep with onNext/onBack"
      pattern: "(GarmentStep|ServiceStep|ReviewStep)"
---

<objective>
Build the wizard page route that mounts the state, renders the stepper, and handles the create/edit URL contract.

Purpose: Glues PLAN-2's components into a usable route and establishes the URL contract (`?serviceId=`) that PLAN-4 will link to.
Output: One new page file; create + edit flows demonstrably work end-to-end via existing endpoints.
</objective>

<execution_context>
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-CONTEXT.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-02-SUMMARY.md
@AI_RULES.md

# Reference patterns to mirror — copy stepper structure verbatim, swap content
@anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte
@anotame-web/src/routes/(app)/dashboard/catalog/pricelists/+page.svelte

<interfaces>
<!-- useAuthGuard pattern (verbatim from pricelists/+page.svelte lines 77–79) -->
<!-- The real return contract is { checking: boolean, allowed: boolean } — there is NO `isReady`. -->
```ts
import { useAuthGuard } from '$lib/guards/index.svelte';
const guard = useAuthGuard(true, '/dashboard'); // first arg: requireAdmin

// Render contract (mirror pricelists/+page.svelte lines 77–79):
// {#if guard.checking}      → show loading
// {:else if guard.allowed}  → show authorized content
// (the guard internally redirects non-admins/unauthenticated users)
```

<!-- CatalogWizardState contract (from PLAN-2) -->
```ts
import { catalogWizardState } from '$lib/services/catalog/CatalogWizardState.svelte';
catalogWizardState.currentStep    // 0..2 (reactive)
catalogWizardState.mode           // 'create' | 'edit'
catalogWizardState.reset()
await catalogWizardState.loadForEdit(serviceId)
```

<!-- Stepper layout — copy verbatim from orders/new/+page.svelte lines 70..144 -->
<!-- Replace the steps array with: -->
```ts
const steps = [
  { title: 'Prenda',   component: GarmentStep },
  { title: 'Servicio', component: ServiceStep },
  { title: 'Revisar',  component: ReviewStep },
];
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create the wizard page route with stepper, guard, and URL parsing</name>
  <files>anotame-web/src/routes/(app)/dashboard/catalog/wizard/+page.svelte</files>
  <behavior>
    - On mount: parse `?serviceId={id}` from `window.location.search`. If present and non-empty, call `await catalogWizardState.loadForEdit(serviceId)` (and toast.error on failure, then redirect to /dashboard/catalog/services). Otherwise call `catalogWizardState.reset()` for a fresh create flow.
    - Renders the 3 step components conditionally based on `catalogWizardState.currentStep`. Each receives `onNext` and `onBack`.
    - `onNext` from step 0 → currentStep=1; from step 1 → currentStep=2; from step 2 (called by review-step on submit success) → toast.success(mode === 'edit' ? 'Servicio actualizado' : 'Servicio creado') then `goto('/dashboard/catalog/services')`.
    - `onBack` from step 0 → goto('/dashboard/catalog/services'); from step 1 → currentStep=0; from step 2 → currentStep=1.
    - Title shows "Editar Servicio" in edit mode, "Nuevo Servicio" in create mode.
    - "Salir/Cancelar" exit button in header navigates to `/dashboard/catalog/services` (calls reset() first).
    - Admin-guarded: while `guard.checking`, show a loading state. When `guard.allowed && !isLoading`, render the stepper. The guard itself redirects non-admins/unauthenticated users — no extra branch needed.
    - Mobile expand tray: copy verbatim from orders/new (the `stepsExpanded` toggle and the `<ChevronDown>` button).
  </behavior>
  <action>
    Create `anotame-web/src/routes/(app)/dashboard/catalog/wizard/+page.svelte` by copying the structural skeleton of `orders/new/+page.svelte` and adapting:

    1. Imports:
       - `import { onMount } from 'svelte'`
       - `import { goto } from '$app/navigation'`
       - `import { catalogWizardState } from '$lib/services/catalog/CatalogWizardState.svelte'`
       - `import GarmentStep from '$lib/components/catalog/wizard/garment-step.svelte'`
       - `import ServiceStep from '$lib/components/catalog/wizard/service-step.svelte'`
       - `import ReviewStep from '$lib/components/catalog/wizard/review-step.svelte'`
       - `import { useAuthGuard } from '$lib/guards/index.svelte'`
       - `import { Button } from '$lib/components/ui/button'`
       - `import { ChevronDown } from 'lucide-svelte'`
       - `import { toast } from 'svelte-sonner'`

    2. `const guard = useAuthGuard(true, '/dashboard');`

    3. `let isLoading = $state(true); let stepsExpanded = $state(false);`

    4. `const steps = [{ title: 'Prenda', component: GarmentStep }, { title: 'Servicio', component: ServiceStep }, { title: 'Revisar', component: ReviewStep }];`

    5. onMount: parse URL for `serviceId`. If present: `await catalogWizardState.loadForEdit(id)` inside a try/catch — on catch toast.error and goto services. If absent: `catalogWizardState.reset()`. Always set `isLoading=false` in finally.

    6. handleNext / handleBack functions per behavior spec. handleNext at step 2 should call goto + toast as described. (The review step itself calls submit() and only invokes onNext on success — the page does not re-call submit.)

    7. JSX: copy the stepper layout from orders/new/+page.svelte verbatim, change title to `{catalogWizardState.mode === 'edit' ? 'Editar Servicio' : 'Nuevo Servicio'}`, swap `draft?.currentStep` for `catalogWizardState.currentStep`, render `<ActiveComponent onNext={handleNext} onBack={handleBack} />`. Wrap the rendered branch in the pricelists pattern (verbatim shape from pricelists/+page.svelte lines 77–79):
       ```svelte
       {#if guard.checking}
         <div class="p-8 text-center text-muted-foreground animate-pulse">Verificando accesos...</div>
       {:else if guard.allowed && !isLoading}
         <!-- stepper + ActiveComponent here -->
       {:else}
         <!-- isLoading fallback (e.g. skeleton) while loadForEdit is in flight -->
       {/if}
       ```

    Do NOT add any draft-persistence UI (no "Draft: xxx" badge); this wizard has no drafts per locked decision.
    Do NOT reference `guard.isReady` — that property does not exist on the useAuthGuard return value.
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual create flow:
      1. Login as ADMIN, visit /dashboard/catalog/wizard
      2. Step 1: select an existing garment → Siguiente
      3. Step 2: fill name=Test, basePrice=10, duration=15 → Siguiente
      4. Step 3: click "Crear Servicio" → toast success → redirected to services page → new row visible
    Manual edit flow:
      1. Visit /dashboard/catalog/wizard?serviceId={existing-uuid}
      2. All 3 steps pre-populated; change name → Step 3 says "Guardar Cambios" → click → PUT issued, redirect, services row updated
    Manual non-admin: login as EMPLOYEE → /dashboard/catalog/wizard → redirected to /dashboard.
  </verify>
  <done>Create + edit + non-admin redirect all work. Build green. No console errors during navigation. Source file contains `guard.checking` and `guard.allowed` (no `guard.isReady`).</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Mobile 375px verification checkpoint</name>
  <what-built>The wizard page route at /dashboard/catalog/wizard with full create + edit + admin-guard flows, mirroring the orders/new stepper.</what-built>
  <how-to-verify>
    1. In Chrome DevTools, toggle device toolbar and set viewport to 375 x 812 (iPhone SE).
    2. Visit /dashboard/catalog/wizard.
    3. Confirm: step circles fit on one row in the header without overflow.
    4. Tap the chevron-down button next to the circles — the mobile step tray expands and shows step names.
    5. Confirm Step 1: garment cards render in a 2-column grid; tapping selects; "Crear Nueva" reveals the inline form below.
    6. Confirm Step 2: form inputs are at least 48px tall (h-12); the garment context badge is visible.
    7. Confirm Step 3: summary card readable; both "Atrás" and "Crear Servicio" buttons are full-width or laid out without horizontal scroll.
    8. Complete a full create flow on the 375px viewport and confirm redirect + toast.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any layout breakages you observed.</resume-signal>
</task>

</tasks>

<verification>
- `bun --cwd anotame-web run build` exits 0
- Manual: create flow ends with a new service row in /dashboard/catalog/services
- Manual: edit flow with `?serviceId=` produces an updated row
- Manual at 375px: no horizontal scroll, step circles + expand tray work
- `grep -n "useAuthGuard(true" anotame-web/src/routes/\\(app\\)/dashboard/catalog/wizard/+page.svelte` returns 1 match
- `grep -c "guard.isReady" anotame-web/src/routes/\\(app\\)/dashboard/catalog/wizard/+page.svelte` returns 0 (the property does not exist)
</verification>

<success_criteria>
1. Wizard page exists, admin-guarded, and end-to-end create flow ships a service via existing endpoints.
2. Edit flow pre-populates from `?serviceId=` and PUT-updates.
3. Mobile 375px viewport renders cleanly (human-verified).
4. Build is green.
</success_criteria>

<output>
After completion, create `.planning/phases/27-catalog-wizard-categorized-menu-modal/27-03-SUMMARY.md`. Note the exact URL patterns PLAN-4 should link to: create=`/dashboard/catalog/wizard`, edit=`/dashboard/catalog/wizard?serviceId={id}`.
</output>
