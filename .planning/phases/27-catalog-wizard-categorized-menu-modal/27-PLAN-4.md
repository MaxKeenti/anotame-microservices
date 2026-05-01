---
phase: 27-catalog-wizard-categorized-menu-modal
plan: 4
type: execute
wave: 4
depends_on: [1, 3]
files_modified:
  - anotame-web/src/routes/(app)/dashboard/catalog/garments/+page.svelte
  - anotame-web/src/routes/(app)/dashboard/catalog/services/+page.svelte
autonomous: true
requirements:
  - CAT-WIZ-05  # Mode-aware routing on listing pages flips without reload (ROADMAP success criterion #5)

must_haves:
  truths:
    - "On `garments/+page.svelte`, when `catalogPreferences.catalogMode === 'wizard'`, clicking 'Agregar Prenda' navigates to `/dashboard/catalog/wizard` (no dialog opens). When mode is 'pro', the existing dialog opens unchanged."
    - "On `services/+page.svelte`, when mode is 'wizard', 'Agregar Servicio' routes to `/dashboard/catalog/wizard`; the row 'Editar' action routes to `/dashboard/catalog/wizard?serviceId={row.id}`. When mode is 'pro', existing dialog behavior is preserved unchanged."
    - "Switching mode in Settings flips the button behavior on both listing pages WITHOUT a full page reload (the listing page reads `catalogPreferences.catalogMode` reactively)."
    - "Tables, filters, delete actions, and listing rendering remain functional in both modes."
    - "No inline mode banner is added to either listing page (per locked decision)."
  artifacts:
    - path: "anotame-web/src/routes/(app)/dashboard/catalog/garments/+page.svelte"
      provides: "Mode-aware Agregar Prenda routing"
    - path: "anotame-web/src/routes/(app)/dashboard/catalog/services/+page.svelte"
      provides: "Mode-aware Agregar/Editar routing"
  key_links:
    - from: "garments/+page.svelte"
      to: "catalog-preferences"
      via: "import catalogPreferences; reads catalogMode in handleCreateClick"
      pattern: "catalogPreferences\\.catalogMode"
    - from: "services/+page.svelte"
      to: "catalog-preferences + wizard route"
      via: "goto('/dashboard/catalog/wizard?serviceId=' + id)"
      pattern: "/dashboard/catalog/wizard"
---

<objective>
Make the existing garments and services listing pages mode-aware. In wizard mode, "Agregar/Editar" actions route to the wizard; in pro mode, the existing dialogs continue to open unchanged.

Purpose: Connects the preference store (PLAN-1) and the wizard route (PLAN-3) into the user-facing entry points. After this plan, toggling the mode in Settings has visible effects on the listing pages.
Output: Two modified files; both flows usable; no other behavior altered.
</objective>

<execution_context>
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-CONTEXT.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-01-SUMMARY.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-03-SUMMARY.md
@AI_RULES.md

@anotame-web/src/routes/(app)/dashboard/catalog/garments/+page.svelte
@anotame-web/src/routes/(app)/dashboard/catalog/services/+page.svelte

<interfaces>
```ts
import { catalogPreferences } from '$lib/stores/catalog-preferences.svelte';
catalogPreferences.catalogMode  // 'wizard' | 'pro'  (reactive — re-reads automatically inside Svelte components)

import { goto } from '$app/navigation';
goto('/dashboard/catalog/wizard');
goto(`/dashboard/catalog/wizard?serviceId=${id}`);
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Mode-aware routing on garments/+page.svelte</name>
  <files>anotame-web/src/routes/(app)/dashboard/catalog/garments/+page.svelte</files>
  <behavior>
    - In wizard mode, `handleCreateClick` calls `goto('/dashboard/catalog/wizard')` instead of opening the dialog.
    - In pro mode, `handleCreateClick` opens the existing GarmentDialog (unchanged behavior).
    - Edit and delete row actions remain unchanged in BOTH modes (a garment-only edit through the wizard isn't supported per scope — services are the wizard's primary edit target). Document this with an inline code comment.
    - All other behavior (table, columns, fetch, delete) untouched.
  </behavior>
  <action>
    Modify `anotame-web/src/routes/(app)/dashboard/catalog/garments/+page.svelte`:

    1. Add to imports:
       - `import { goto } from '$app/navigation';`
       - `import { catalogPreferences } from '$lib/stores/catalog-preferences.svelte';`

    2. Replace `handleCreateClick` body with:
       ```ts
       function handleCreateClick() {
         if (catalogPreferences.catalogMode === 'wizard') {
           goto('/dashboard/catalog/wizard');
           return;
         }
         editingGarment = { id: null, name: '', description: '' };
       }
       ```

    3. Add a one-line comment above `handleEditClick` explaining edit is dialog-only by design (wizard edit operates on services, not standalone garments).

    Do NOT add any inline banner, pill, or mode indicator on the page (locked decision: toggle lives in Settings only).
    Do NOT modify the GarmentDialog import or component.
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual:
      1. Set mode='pro' in Settings → /dashboard/catalog/garments → click "Agregar Prenda" → dialog opens.
      2. Set mode='wizard' in Settings (no reload) → click "Agregar Prenda" on the same tab/page → navigates to /dashboard/catalog/wizard.
  </verify>
  <done>Both modes work as specified, dialog behavior preserved in pro mode, no inline banner. Build green.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Mode-aware routing on services/+page.svelte (create + edit)</name>
  <files>anotame-web/src/routes/(app)/dashboard/catalog/services/+page.svelte</files>
  <behavior>
    - In wizard mode: `handleCreateClick` → `goto('/dashboard/catalog/wizard')`. Row "Editar" action → `goto('/dashboard/catalog/wizard?serviceId=' + service.id)`.
    - In pro mode: existing dialog behavior preserved for both create and edit.
    - Delete action unchanged in both modes (uses the dialog's confirm flow).
    - Tables, filters, columns untouched.
  </behavior>
  <action>
    Modify `anotame-web/src/routes/(app)/dashboard/catalog/services/+page.svelte`:

    1. Add to imports:
       - `import { goto } from '$app/navigation';`
       - `import { catalogPreferences } from '$lib/stores/catalog-preferences.svelte';`

    2. Replace `handleCreateClick`:
       ```ts
       function handleCreateClick() {
         if (catalogPreferences.catalogMode === 'wizard') {
           goto('/dashboard/catalog/wizard');
           return;
         }
         editingService = { id: null, name: '', description: '', basePrice: 0, defaultDurationMin: 30, garmentTypeId: '' };
       }
       ```

    3. Replace `handleEditClick`:
       ```ts
       function handleEditClick(service: any) {
         if (catalogPreferences.catalogMode === 'wizard') {
           goto(`/dashboard/catalog/wizard?serviceId=${service.id}`);
           return;
         }
         editingService = service;
       }
       ```

    Do NOT add any inline banner. Do NOT touch ServiceDialog import or component. Do NOT change filters, columns, or fetchData.
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual:
      1. mode='pro' → click "Agregar Servicio" → dialog opens; click row "Editar" → dialog opens with service pre-filled.
      2. Switch mode in Settings → return to /dashboard/catalog/services (no reload) → click "Agregar Servicio" → wizard route; click row "Editar" → wizard route with `?serviceId=`.
      3. Complete a wizard edit flow → row in services table reflects updated values.
  </verify>
  <done>Create + edit work in both modes; reactive mode flip works without reload; build green.</done>
</task>

</tasks>

<verification>
- `bun --cwd anotame-web run build` exits 0
- `grep -n "catalogPreferences.catalogMode === 'wizard'" anotame-web/src/routes/\\(app\\)/dashboard/catalog/garments/+page.svelte` returns ≥1 match
- `grep -n "catalogPreferences.catalogMode === 'wizard'" anotame-web/src/routes/\\(app\\)/dashboard/catalog/services/+page.svelte` returns ≥2 matches (create + edit)
- Manual: switch mode in Settings tab → other open tab on /dashboard/catalog/services updates behavior on next click without reload (PersistedState propagates via storage events / runed reactivity)
</verification>

<success_criteria>
1. Both listing pages route to the wizard in wizard mode and open dialogs in pro mode.
2. Mode flip in Settings affects subsequent clicks WITHOUT a page reload.
3. No inline banners. Dialog components untouched.
4. Build is green.
</success_criteria>

<output>
After completion, create `.planning/phases/27-catalog-wizard-categorized-menu-modal/27-04-SUMMARY.md`.
</output>
