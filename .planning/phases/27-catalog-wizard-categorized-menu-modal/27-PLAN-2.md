---
phase: 27-catalog-wizard-categorized-menu-modal
plan: 2
type: execute
wave: 2
depends_on: [1]
files_modified:
  - anotame-web/src/lib/services/catalog/CatalogWizardState.svelte.ts
  - anotame-web/src/lib/components/catalog/wizard/garment-step.svelte
  - anotame-web/src/lib/components/catalog/wizard/service-step.svelte
  - anotame-web/src/lib/components/catalog/wizard/review-step.svelte
autonomous: true
requirements:
  - CAT-WIZ-02  # State + 3 step components mirror orders wizard architecture (ROADMAP success criterion #2 partial)
  - CAT-WIZ-03  # Create flow data assembly via existing endpoints (ROADMAP success criterion #3 partial)
  - CAT-WIZ-04  # Edit flow pre-populates and PUT/PATCHes (ROADMAP success criterion #4 partial)

must_haves:
  truths:
    - "A `CatalogWizardState` singleton exists with create + edit flows; `loadForEdit(serviceId)` populates all step state from existing service data."
    - "Step 1 mobile presentation uses AdaptiveSelect for garment selection (no native <select>), per AI_RULES §3 and CONTEXT.md locked decision. Card grid is the desktop presentation only."
    - "Step 1 in edit mode renders the previously-selected garment as a non-interactive context badge (mirroring Step 2's badge style) — no card grid, no 'Crear Nueva' toggle, no inline form. The garment cannot be reassigned via the wizard."
    - "Step 2 (service-step.svelte) is a SuperForms+Zod form with name, description, basePrice, defaultDurationMin. The selected garment appears as a context badge."
    - "Step 3 (review-step.svelte) shows a summary card and CTA labeled 'Crear Servicio' (create) or 'Guardar Cambios' (edit). Clicking the CTA calls `state.submit()` which POSTs (create) or PUT/PATCHes (edit) via `/catalog/garments` and `/catalog/services` and returns the created/updated service."
    - "`state.submit()` resolves with `{ ok: true, serviceId }` on success or `{ ok: false, error }` on failure; state is preserved in memory on failure for retry."
    - "Each step accepts `onNext` and `onBack` props matching the orders wizard contract."
  artifacts:
    - path: "anotame-web/src/lib/services/catalog/CatalogWizardState.svelte.ts"
      provides: "catalogWizardState singleton (class instance)"
      exports: ["catalogWizardState"]
      contains: "class CatalogWizardState"
      min_lines: 80
    - path: "anotame-web/src/lib/components/catalog/wizard/garment-step.svelte"
      provides: "Step 1 component"
      min_lines: 120
    - path: "anotame-web/src/lib/components/catalog/wizard/service-step.svelte"
      provides: "Step 2 component (SuperForms + Zod)"
      min_lines: 100
    - path: "anotame-web/src/lib/components/catalog/wizard/review-step.svelte"
      provides: "Step 3 review/submit component"
      min_lines: 70
  key_links:
    - from: "garment-step.svelte"
      to: "CatalogWizardState.svelte.ts"
      via: "import { catalogWizardState }; calls setGarment()"
      pattern: "catalogWizardState\\.setGarment"
    - from: "service-step.svelte"
      to: "CatalogWizardState.svelte.ts"
      via: "calls setService()"
      pattern: "catalogWizardState\\.setService"
    - from: "review-step.svelte"
      to: "CatalogWizardState.svelte.ts"
      via: "calls submit()"
      pattern: "catalogWizardState\\.submit"
    - from: "CatalogWizardState.submit"
      to: "/catalog/garments and /catalog/services"
      via: "apiService.request POST/PUT"
      pattern: "API_CATALOG.*catalog/(garments|services)"
---

<objective>
Build the wizard state machine and the three step components. No page route yet — that lives in PLAN-3. After this plan, the components compile and the state class exposes the contract that PLAN-3 will mount.

Purpose: Encapsulates all catalog-creation business logic in one testable state class and three pure-presentation step components.
Output: 4 new files; build green; state submit() function callable but not yet wired to a route.
</objective>

<execution_context>
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-CONTEXT.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-01-SUMMARY.md
@AI_RULES.md

# Reference patterns to mirror
@anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts
@anotame-web/src/lib/components/orders/wizard/customer-step.svelte
@anotame-web/src/lib/components/orders/wizard/items-step.svelte
@anotame-web/src/lib/components/orders/wizard/payment-step.svelte
@anotame-web/src/lib/components/catalog/garment-dialog.svelte
@anotame-web/src/lib/components/catalog/service-dialog.svelte

<interfaces>
<!-- Existing endpoints (no backend changes) -->
```ts
// Garment Type
type GarmentType = { id: string; name: string; description: string | null; active: boolean };
// GET    ${API_CATALOG}/catalog/garments  -> GarmentType[]
// POST   ${API_CATALOG}/catalog/garments  body: { name, description? }
// PUT    ${API_CATALOG}/catalog/garments/{id}  body: { name, description? }

// Service
type Service = {
  id: string; name: string; description: string | null;
  defaultDurationMin: number; basePrice: number;
  active: boolean; garmentTypeId: string;
};
// GET    ${API_CATALOG}/catalog/services            -> Service[]
// GET    ${API_CATALOG}/catalog/services/{id}       -> Service
// POST   ${API_CATALOG}/catalog/services            body: { name, description, basePrice, defaultDurationMin, garmentTypeId }
// PUT    ${API_CATALOG}/catalog/services/{id}       body: same as POST
```

<!-- Reuse the EXISTING dialogs' Zod schemas as a guide if they exist; otherwise define inline.
     Verify by grepping garment-dialog.svelte and service-dialog.svelte before writing schemas. -->

<!-- Step component contract (matches orders wizard) -->
```ts
type StepProps = { onNext: () => void; onBack: () => void };
```

<!-- Class outline executor MUST implement -->
```ts
class CatalogWizardState {
  currentStep = $state<number>(0);                     // 0..2
  mode = $state<'create' | 'edit'>('create');
  editingServiceId = $state<string | null>(null);

  // Step 1
  garmentTypeId = $state<string | null>(null);
  garmentName = $state<string>('');
  garmentDescription = $state<string>('');
  isCreatingNewGarment = $state<boolean>(false);

  // Step 2
  serviceData = $state<{ name: string; description: string; basePrice: number; defaultDurationMin: number }>({
    name: '', description: '', basePrice: 0, defaultDurationMin: 30,
  });

  reset(): void;                                       // back to defaults, mode='create'
  setGarment(payload: { existingId: string | null; isNew: boolean; name: string; description: string }): void;
  setService(payload: { name: string; description: string; basePrice: number; defaultDurationMin: number }): void;
  async loadForEdit(serviceId: string): Promise<void>; // GET service, then GET garments, populate all fields, set mode='edit'
  getCurrentSummary(): { garmentLabel: string; service: {...} };
  async submit(): Promise<{ ok: true; serviceId: string } | { ok: false; error: string }>;
}
export const catalogWizardState = new CatalogWizardState();
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create CatalogWizardState singleton with create + edit + submit</name>
  <files>anotame-web/src/lib/services/catalog/CatalogWizardState.svelte.ts</files>
  <behavior>
    - `reset()` returns all fields to initial defaults and sets mode='create', editingServiceId=null.
    - `setGarment({ existingId, isNew, name, description })`:
        - If `isNew=true`: garmentTypeId=null, isCreatingNewGarment=true, garmentName=name, garmentDescription=description.
        - Else: garmentTypeId=existingId, isCreatingNewGarment=false, garmentName='', garmentDescription=''.
    - `setService(...)` shallow-merges into `serviceData`.
    - `loadForEdit(serviceId)`:
        - GET `${API_CATALOG}/catalog/services/${serviceId}` → populate serviceData fields and garmentTypeId from `service.garmentTypeId`.
        - mode='edit', editingServiceId=serviceId, isCreatingNewGarment=false, currentStep=0.
    - `submit()` (mode='create'):
        - If isCreatingNewGarment: POST garment first, capture id, then POST service with that garmentTypeId.
        - Else: POST service directly using current garmentTypeId.
    - `submit()` (mode='edit'):
        - PUT `/catalog/services/{editingServiceId}` with full body (name, description, basePrice, defaultDurationMin, garmentTypeId).
        - Edit mode renders Step 1 as a read-only badge — garment cannot be reassigned via the wizard. Users who need to move a service to a different garment must delete and recreate. The PUT body therefore reuses the `garmentTypeId` loaded by `loadForEdit` unchanged.
    - `submit()` returns `{ ok: false, error: <message> }` on any thrown error and leaves state intact.
  </behavior>
  <action>
    Create `anotame-web/src/lib/services/catalog/CatalogWizardState.svelte.ts` mirroring the class+singleton pattern from `OrderWizardState.svelte.ts` but WITHOUT PersistedState (no draft persistence, per locked decision).

    Implement the class exactly as outlined in `<interfaces>` above. Use Svelte 5 `$state(...)` for every reactive field (NOT plain class fields). Imports:
    - `import { apiService, API_CATALOG } from '$lib/services/api.svelte'`

    Export singleton: `export const catalogWizardState = new CatalogWizardState();`

    Important: This is a `.svelte.ts` file so runes ARE allowed. Do NOT put runes in `<script module>` (rule from AI_RULES.md §3).
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual smoke: in any temporary `+page.svelte` or via Svelte devtools, call `catalogWizardState.reset()` then read `catalogWizardState.currentStep` → expect 0.
  </verify>
  <done>File compiles; class exposes all methods and state fields per interface; build green.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Create garment-step.svelte (Step 1 — select existing or create new; read-only in edit mode)</name>
  <files>anotame-web/src/lib/components/catalog/wizard/garment-step.svelte</files>
  <behavior>
    - **Edit mode (`catalogWizardState.mode === 'edit'`)**: render Step 1 as a read-only context badge mirroring Step 2's badge style — shows the pre-loaded garment name + description, no card grid, no "Crear Nueva" toggle, no inline form, no mutation. Footer shows only "Siguiente" + "Atrás" (no validation gating because nothing is editable). The garment cannot be reassigned via the wizard.
    - **Create mode (`catalogWizardState.mode === 'create'`)**:
        - On mount, fetch `${API_CATALOG}/catalog/garments`.
        - **Desktop (≥ sm breakpoint)**: render a responsive grid of selectable cards (one per garment) plus a final "+ Crear Nueva" card.
        - **Mobile (< sm breakpoint)**: render an `AdaptiveSelect` of garments plus a separate "+ Crear Nueva" toggle button (per AI_RULES §3 — no native `<select>`; CONTEXT.md locks AdaptiveSelect on mobile).
        - Selecting an existing garment (card click on desktop, AdaptiveSelect change on mobile) calls `catalogWizardState.setGarment({ existingId: g.id, isNew: false, name: '', description: '' })` and visually highlights the selection.
        - Clicking "Crear Nueva" toggles `isCreatingNewGarment=true` and reveals an inline form (Input for name 2-60 chars required, Input for description optional ≤200 chars). Typing updates state via setGarment with isNew=true.
        - "Siguiente" button is disabled unless either an existing garment is selected OR a valid new-garment name (≥2 chars) is entered.
    - "Atrás" calls `onBack()` in both modes.
    - Loading state shows skeleton placeholders while fetching.
  </behavior>
  <action>
    Create `anotame-web/src/lib/components/catalog/wizard/garment-step.svelte`. Props: `let { onNext, onBack } = $props<{ onNext: () => void; onBack: () => void }>();`.

    Top-level branch on `catalogWizardState.mode`:

    **Edit-mode branch** (render only the badge):
    - Heading "Paso 1: Prenda" (`text-xl font-bold`).
    - Subtext: "La prenda no se puede reasignar al editar un servicio. Para moverlo a otra prenda, elimina y vuelve a crear el servicio." (muted, small).
    - Read-only badge: a `Card.Root` (or styled `<div class="rounded-lg border bg-muted/30 p-4 flex items-center gap-3">`) showing `<ShirtIcon />` + the loaded garment name + (optional) description. Source the label from `catalogWizardState.getCurrentSummary().garmentLabel`. No interactive controls.
    - Footer: "Atrás" (variant outline) + "Siguiente" (variant default, always enabled in edit mode).

    **Create-mode branch**:
    - Heading "Paso 1: Selecciona o crea una prenda" (`text-xl font-bold`).
    - Desktop card grid (visible at ≥ sm via `class="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"`): each card is a `<button>` with class `h-32 p-4 rounded-xl border-2 transition-all touch-manipulation flex flex-col items-center justify-center gap-2` and active state `border-primary bg-primary/5` when `catalogWizardState.garmentTypeId === g.id`. Last cell: "+ Crear Nueva" card.
    - Mobile AdaptiveSelect (visible at < sm via `class="block sm:hidden space-y-3"`): import the project's `AdaptiveSelect` component (verify exact import path by grepping the codebase for `AdaptiveSelect`); pass `options = garments.map(g => ({ value: g.id, label: g.name }))`, `value={catalogWizardState.garmentTypeId}`, `onChange={(id) => catalogWizardState.setGarment({ existingId: id, isNew: false, name: '', description: '' })}`. Below the AdaptiveSelect, render a full-width outline `Button` "+ Crear Nueva" that toggles `isCreatingNewGarment`.
    - When `isCreatingNewGarment`, show below the desktop grid / mobile selector an inline form panel with two `Input` fields bound to local `$state` values (name, description), `oninput` invoking `catalogWizardState.setGarment({ existingId: null, isNew: true, name, description })`.
    - Footer: flex row with "Atrás" (variant outline) and "Siguiente" (variant default). "Siguiente" disabled per behavior rule. Use class `h-12 touch-manipulation` on both.

    Use existing imports: `apiService, API_CATALOG`, `Button`, `Input`, `toast` from svelte-sonner. Use Lucide icons (Shirt, Plus). Do NOT use `confirm()` or native `<select>` (AI_RULES §3).

    Do NOT modify `garment-dialog.svelte` — it stays unchanged.
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual create mode: temporarily mount in a sandbox route — desktop shows card grid, mobile (< 640px) shows AdaptiveSelect; selection writes to state; clicking "Crear Nueva" toggles inline form; Next button enable/disable behavior matches rule.
    Manual edit mode: call `catalogWizardState.loadForEdit('<existing-uuid>')` then mount — Step 1 shows the read-only badge with the loaded garment name; no card grid or AdaptiveSelect is rendered; Next is always enabled.
  </verify>
  <done>Component renders both create and edit branches per spec; mobile uses AdaptiveSelect; edit mode is read-only; Next gating works in create mode. Build green.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Create service-step.svelte and review-step.svelte (Steps 2 + 3)</name>
  <files>anotame-web/src/lib/components/catalog/wizard/service-step.svelte, anotame-web/src/lib/components/catalog/wizard/review-step.svelte</files>
  <behavior>
    Service step:
    - SuperForms + Zod schema: name (string, 2-100), description (string, optional, ≤500), basePrice (number, ≥0), defaultDurationMin (integer, ≥1, ≤480).
    - Top context badge showing the selected garment label (from `getCurrentSummary().garmentLabel`).
    - On mount in edit mode (or when state already has serviceData), the form pre-populates from `catalogWizardState.serviceData`.
    - "Siguiente" submits the form locally — on valid: call `catalogWizardState.setService({...})` then `onNext()`.
    - "Atrás" calls `onBack()`.

    Review step:
    - Reads `catalogWizardState.getCurrentSummary()` and shows a summary card listing: Prenda, Servicio, Precio (formatted as $X.XX MXN), Duración, Descripción.
    - CTA button label: `mode === 'edit' ? 'Guardar Cambios' : 'Crear Servicio'`.
    - On click: disables button, calls `await catalogWizardState.submit()`. On `{ ok: true }`: toast.success and call `onNext()` (the wizard page will handle redirect). On `{ ok: false, error }`: toast.error(error) and re-enable button (state survives in memory for retry).
    - "Atrás" calls `onBack()`.
  </behavior>
  <action>
    Create both files in `anotame-web/src/lib/components/catalog/wizard/`.

    For `service-step.svelte`: Use `sveltekit-superforms` + `zod` (verify exact superForms wiring by reading `service-dialog.svelte` which already does this for the same fields — mirror its schema/validators). Props `{ onNext, onBack }`. Use `Input` for text/number fields. Buttons `h-12 touch-manipulation`.

    For `review-step.svelte`: Pure presentation. Props `{ onNext, onBack }`. Use `Card.Root` with a definition list (label/value rows). Reactive: `let summary = $derived(catalogWizardState.getCurrentSummary())`. Local submitting flag: `let submitting = $state(false)`. Imports: `toast` from svelte-sonner.

    Do NOT touch `service-dialog.svelte` — it stays unchanged per locked decision.
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual: in a sandbox route, transition through all three steps in create mode — service POST issued, redirect handled by caller. Then test edit by calling `catalogWizardState.loadForEdit('<existing-uuid>')` and traversing — fields pre-populate, submit issues PUT.
  </verify>
  <done>Both files compile, review submit calls state.submit(), and form validation is Zod-backed. Build green.</done>
</task>

</tasks>

<verification>
- `bun --cwd anotame-web run build` exits 0
- `grep -n "class CatalogWizardState" anotame-web/src/lib/services/catalog/CatalogWizardState.svelte.ts` returns 1 match
- `grep -rn "catalogWizardState\\.\\(setGarment\\|setService\\|submit\\|loadForEdit\\)" anotame-web/src/lib/components/catalog/wizard/` returns at least 4 matches across the three step files
- `grep -n "AdaptiveSelect" anotame-web/src/lib/components/catalog/wizard/garment-step.svelte` returns ≥1 match (mobile branch present)
</verification>

<success_criteria>
1. State class exposes the full contract from `<interfaces>`.
2. Three step components implement the behavior specs and accept `{ onNext, onBack }`.
3. Step 1 mobile uses AdaptiveSelect; Step 1 edit mode is read-only badge.
4. No backend changes; existing dialogs untouched.
5. Build is green.
</success_criteria>

<output>
After completion, create `.planning/phases/27-catalog-wizard-categorized-menu-modal/27-02-SUMMARY.md`. Critically: document the EXACT method signatures of `catalogWizardState` so PLAN-3 can wire the page without re-reading the implementation.
</output>
