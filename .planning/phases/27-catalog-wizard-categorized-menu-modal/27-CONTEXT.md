# Phase 27: Catalog Wizard + Categorized Menu Modal - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Source:** PRD Express Path (`.gsd/implementation_plan.md`)

<domain>
## Phase Boundary

Frontend-only refactor of the catalog management UX. Introduces:

1. A persisted user preference (`catalogMode: 'wizard' | 'pro'`) stored in LocalStorage
2. A 3-step guided wizard at `/dashboard/catalog/wizard` for creating AND editing Garment+Service combinations (mirrors the existing Order Wizard architecture)
3. Mode-aware routing on `garments/+page.svelte` and `services/+page.svelte` — buttons route to wizard in wizard mode, open existing dialogs in pro mode
4. Restructure of `menu-modal.svelte` from a flat 12-item icon grid into 4 categorized sections (Operaciones, Catálogo, Administración, Configuración)
5. A new "Experiencia de Catálogo" card in `settings/+page.svelte` for toggling between wizard and pro modes

**No backend changes.** All wizard operations call existing `/catalog/garments` and `/catalog/services` REST endpoints.

</domain>

<decisions>
## Implementation Decisions

### Mode Preference & Default
- Store: NEW `src/lib/stores/catalog-preferences.svelte.ts` using runed `PersistedState` (same pattern as `palette.svelte`, `table-preferences.svelte`)
- Field: `catalogMode: 'wizard' | 'pro'`
- **Default**: `'pro'` for users with existing catalog entries (any garment OR service present); `'wizard'` only for empty catalogs. Detect on first load; persist user's explicit choice afterward.
- Toggle UI: New `Card.Root` section in Settings titled "Experiencia de Catálogo" with two large buttons ("Asistente (Wizard)" / "Tablas Directas (Pro)"), same visual pattern as theme/table-rows cards.

### Wizard State Architecture
- File: NEW `src/lib/services/catalog/CatalogWizardState.svelte.ts`
- Pattern: Class-based singleton mirroring `OrderWizardState.svelte.ts`
- State fields:
  - `currentStep: number` (0–2)
  - `mode: 'create' | 'edit'`
  - `editingServiceId: string | null` (set in edit mode)
  - `garmentTypeId: string | null`
  - `garmentName: string`
  - `garmentDescription: string`
  - `serviceData: { name, description, basePrice, defaultDurationMin }`
  - `isCreatingNewGarment: boolean`
- Methods: `reset()`, `setGarment()`, `setService()`, `loadForEdit(serviceId)`, `getCurrentSummary()`, `submit()` (POST or PUT depending on mode)
- **No draft persistence** — catalog operations are short, single-session (unlike Order Wizard).

### Wizard Steps (3 separate files in `src/lib/components/catalog/wizard/`)
- **Step 1 — Garment Selection** (`garment-step.svelte`): Visual card grid of existing garments + "Crear Nueva" card that toggles inline name/description form. Uses `AdaptiveSelect` on mobile per AI_RULES §3 (no native `<select>`).
- **Step 2 — Service Details** (`service-step.svelte`): SuperForms + Zod form with fields name, description, basePrice, defaultDurationMin. Selected garment shown as context badge at top.
- **Step 3 — Review** (`review-step.svelte`): Summary card showing garment → service mapping with all fields. CTA labeled "Crear Servicio" (create mode) or "Guardar Cambios" (edit mode). Submits via state.submit().

### Wizard Page
- Route: NEW `src/routes/(app)/dashboard/catalog/wizard/+page.svelte`
- Reuses stepper header pattern from `orders/new/+page.svelte` (step circles + mobile expand tray)
- Reads `?serviceId={id}` query param to enter edit mode (call `state.loadForEdit(serviceId)`); absent → create mode
- Admin-only via `useAuthGuard` (same pattern as pricelists)
- On success: toast + redirect to services page
- On API failure mid-submission: surface error, retain wizard state in memory (no draft, but state survives until navigation)

### Edit Support (LOCKED — added per user)
- Wizard supports both **create** and **edit** for parity with pro mode
- Edit entry points: clicking a service row's edit action in wizard mode routes to `/dashboard/catalog/wizard?serviceId={id}`
- Edit pre-populates Step 1 (garment), Step 2 (service fields), Step 3 (review)
- Server uses existing PUT/PATCH endpoints — no new backend work

### Smart Routing (Mode-Aware)
- `garments/+page.svelte`: When `catalogMode === 'wizard'`, "Agregar Prenda" button routes to `/dashboard/catalog/wizard` instead of opening dialog. Edit row action routes to `wizard?serviceId={id}` when service is implied.
- `services/+page.svelte`: Same treatment — "Agregar Servicio" routes to wizard; edit row action routes to wizard with serviceId.
- Tables + filters remain visible in both modes (listing is always useful).
- **No inline mode banner** on the listing pages — the toggle lives in Settings only (avoids visual noise on every visit).

### Menu Restructure
- File: MODIFY `src/lib/config/menu.ts` — restructure flat array into `menuCategories: MenuCategory[]`
- 4 categories: Operaciones, Catálogo, Administración (admin-only), Configuración
- New flag: `wizardOnly: true` on items only visible in wizard mode (specifically "Asistente de Catálogo")
- Filtering logic lives in `menu-modal.svelte`, NOT in menu.ts (keep config pure data)
- File: MODIFY `src/lib/components/layout/menu-modal.svelte` — render category headers (uppercase muted label + icon), grouped item grid below, filter by admin role + `wizardOnly` flag against `catalogPreferences.catalogMode`. Preserve existing footer (user info + logout).

### Out of Scope (Locked)
- Price list integration in wizard — pricelists remain a separate admin-only flow
- Wizard for non-admin users — wizard creation is admin-gated by nature (existing endpoints already require ADMIN)
- Onboarding flow / first-run tour
- Analytics/telemetry instrumentation
- i18n — keep Spanish strings hardcoded; integration with Phase 22/23 Paraglide work happens later

### Claude's Discretion
- Exact validation rules for inline garment creation (likely: name required, 2–60 chars; description optional)
- Stepper visual styling beyond reusing the order-wizard pattern
- Whether to show a "Create another?" prompt vs. plain redirect after successful create — recommend: simple redirect to services page with success toast (one job done, one CTA)
- Exact color/icon choices for category headers in menu modal (use existing icon imports — no new icon installs)
- Loading skeletons during garment list fetch in Step 1
- Whether to keep `menuItems` flat compat export from menu.ts — recommend: yes, until verified no consumers besides the modal

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PRD source
- `.gsd/implementation_plan.md` — Original PRD with full UX mockups (ASCII), file lists, and dependency graph

### Reference patterns to mirror (READ THESE — they define the architecture)
- `anotame-web/src/routes/(app)/dashboard/orders/new/+page.svelte` — Stepper page pattern (mobile expand tray, step circles, onNext/onBack)
- `anotame-web/src/lib/services/orders/OrderWizardState.svelte.ts` — Class-based singleton state pattern with runed
- `anotame-web/src/lib/components/orders/wizard/` — Per-step component conventions
- `anotame-web/src/lib/stores/palette.svelte.ts` — `PersistedState` store pattern (consult for catalog-preferences shape)
- `anotame-web/src/lib/stores/table-preferences.svelte.ts` — Same pattern, alternate reference
- `anotame-web/src/routes/(app)/dashboard/settings/+page.svelte` — Existing Settings card layout
- `anotame-web/src/lib/components/layout/menu-modal.svelte` — Current modal to restructure
- `anotame-web/src/lib/config/menu.ts` — Current flat menu config to restructure

### Existing catalog files (will be touched or referenced)
- `anotame-web/src/routes/(app)/dashboard/catalog/garments/+page.svelte` — Garments table; mode-aware routing target
- `anotame-web/src/routes/(app)/dashboard/catalog/services/+page.svelte` — Services table; mode-aware routing target
- `anotame-web/src/lib/components/catalog/garment-dialog.svelte` — Existing pro-mode dialog (UNCHANGED)
- `anotame-web/src/lib/components/catalog/service-dialog.svelte` — Existing pro-mode dialog (UNCHANGED)

### Project rules
- `AI_RULES.md` §3 UI/UX — wizards over long forms, touch-first (`h-12`, `touch-manipulation`), `AdaptiveSelect` on mobile, `$state`/`$derived` only (no stores), `PersistedState` from runed, `toast` from svelte-sonner, `useAuthGuard` for guarded routes, `{@const}` only inside `{#each}`/`{#if}`
- `AI_RULES.md` general — SuperForms + Zod for all form validation

</canonical_refs>

<specifics>
## Specific Ideas

### Phase boundaries (from PRD)
- **P1 — Preference store + Settings card** (independent, can ship alone)
- **P2 — Wizard state + 3 step components** (depends on P1)
- **P3 — Wizard page route** (depends on P2)
- **P4 — Smart routing on garments/services pages** (depends on P1 + P3)
- **P5 — Categorized menu** (depends on P1 only — independent of wizard work)

P1 and P5 can be parallelized; P2→P3→P4 are sequential.

### File summary (from PRD, with edit-support additions)
- 7 new files: `catalog-preferences.svelte.ts`, `CatalogWizardState.svelte.ts`, 3 step components, `wizard/+page.svelte`, no new menu file
- 5 modified files: `menu.ts`, `menu-modal.svelte`, `garments/+page.svelte`, `services/+page.svelte`, `settings/+page.svelte`

### LOC reality check
PRD estimates are light. Real budget likely:
- `garment-step.svelte` ~180–220 LOC (grid + create toggle + form + AdaptiveSelect + loading state + edit pre-population)
- `service-step.svelte` ~140 LOC (SuperForms binding + edit pre-population)
- `review-step.svelte` ~100 LOC (summary card + create/edit CTA branching)
- Other estimates roughly hold.

### Verification per phase (from PRD)
- P1: Settings shows new card; toggle persists across refresh
- P2: State transitions work (create + edit paths); reset() clears state
- P3: Navigate to wizard, complete create flow → service appears in table; navigate with `?serviceId={id}` → fields pre-populated, save → updates persisted
- P4: Toggle mode in Settings → "create" button behavior changes on garments/services pages WITHOUT reload
- P5: Menu modal shows 4 categorized sections; admin items hidden for non-admin; wizard item shown/hidden per mode
- Mobile: 375px viewport — touch targets, step expand/collapse, agenda fallback

</specifics>

<deferred>
## Deferred Ideas

- **Price list integration in wizard** — separate admin flow as today (PRD Q2)
- **Onboarding tour / first-run experience** — out of scope
- **Bulk service creation** — wizard is one-at-a-time
- **Analytics on wizard completion rate vs. dialog completion rate** — deferred to a later instrumentation phase
- **i18n / Paraglide migration of new strings** — Phase 22/23 will sweep these later; for now keep Spanish hardcoded
- **Wizard for non-admin users** — gated by existing endpoint authorization
- **Inline mode-active banner on listing pages** — explicitly rejected (visual noise)

</deferred>

---

*Phase: 27-catalog-wizard-categorized-menu-modal*
*Context gathered: 2026-04-30 via PRD Express Path*
