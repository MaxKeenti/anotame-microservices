---
phase: 27-catalog-wizard-categorized-menu-modal
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - anotame-web/src/lib/stores/catalog-preferences.svelte.ts
  - anotame-web/src/routes/(app)/dashboard/settings/+page.svelte
autonomous: true
requirements:
  - CAT-WIZ-01  # catalogPreferences persisted store + Settings toggle card (ROADMAP success criterion #1)

must_haves:
  truths:
    - "A device-scoped persisted preference `catalogMode: 'wizard' | 'pro'` exists and survives page refresh. (Per-browser/device, matching `table-preferences` and `palette` stores — no user-id key prefix.)"
    - "Default is `'pro'` if any garment OR service exists in the catalog on first load; `'wizard'` only when both lists are empty. Default detection runs once and persists user's explicit choice afterwards."
    - "Settings page shows a new `Card.Root` titled 'Experiencia de Catálogo' with two large buttons (Asistente / Tablas Directas) following the same pattern as the Apariencia/Tabla cards."
    - "Clicking either button updates the store immediately; the active button is visually marked (variant='default') matching the theme card pattern."
  artifacts:
    - path: "anotame-web/src/lib/stores/catalog-preferences.svelte.ts"
      provides: "catalogPreferences singleton with .catalogMode getter, .setMode(), and async .initializeDefault() detector"
      contains: "PersistedState"
      min_lines: 25
    - path: "anotame-web/src/routes/(app)/dashboard/settings/+page.svelte"
      provides: "Experiencia de Catálogo card with two h-24 buttons"
      contains: "Experiencia de Catálogo"
  key_links:
    - from: "settings/+page.svelte"
      to: "catalog-preferences.svelte"
      via: "import { catalogPreferences } from '$lib/stores/catalog-preferences.svelte'"
      pattern: "catalogPreferences\\.(catalogMode|setMode)"
    - from: "catalog-preferences.svelte.ts"
      to: "runed PersistedState"
      via: "PersistedState<{catalogMode, initialized}>"
      pattern: "new PersistedState"
---

<objective>
Create the persisted `catalogPreferences` store and add the "Experiencia de Catálogo" toggle card to the Settings page.

Purpose: Provides the shared mode state that downstream plans (smart routing, menu filtering) read. Without this store no other plan can ship.
Output: One new store file and one modified Settings page; both compile and the toggle persists across refresh.
</objective>

<execution_context>
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/workflows/execute-plan.md
@/Users/moonstone/Source/Personal/anotame-microservices/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/27-catalog-wizard-categorized-menu-modal/27-CONTEXT.md
@AI_RULES.md

# Reference patterns to mirror
@anotame-web/src/lib/stores/palette.svelte.ts
@anotame-web/src/lib/stores/table-preferences.svelte.ts
@anotame-web/src/routes/(app)/dashboard/settings/+page.svelte

<interfaces>
<!-- Extracted from anotame-web/src/lib/stores/palette.svelte.ts -->
<!-- The PersistedState pattern: store at module scope, expose a singleton with getters/setters -->

```ts
// palette.svelte.ts (reference)
import { PersistedState } from 'runed';
import { authService } from '$lib/services/auth.svelte';

const _allPalettes = new PersistedState<Record<string, UserPalette>>('user_palettes', {});

export const paletteStore = {
  get current(): UserPalette { ... },
  set(updates: Partial<UserPalette>) { ... },
  reset() { ... },
};
```

<!-- Extracted from anotame-web/src/lib/services/api.svelte.ts (used for default detection) -->
```ts
// API_CATALOG is the catalog-service base URL
import { apiService, API_CATALOG } from '$lib/services/api.svelte';
// apiService.request<T>(url, init?): Promise<T>
```

<!-- Settings card pattern (theme/table-rows) — mirror exactly -->
```svelte
<Card.Root>
  <Card.Header>
    <Card.Title>Experiencia de Catálogo</Card.Title>
    <Card.Description>...</Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        variant={catalogPreferences.catalogMode === 'wizard' ? 'default' : 'outline'}
        class="h-24 flex flex-col gap-2 touch-manipulation"
        onclick={() => catalogPreferences.setMode('wizard')}>
        <WandIcon class="w-6 h-6" />
        Asistente (Wizard)
      </Button>
      <Button .../>
    </div>
  </Card.Content>
</Card.Root>
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create the catalogPreferences persisted store</name>
  <files>anotame-web/src/lib/stores/catalog-preferences.svelte.ts</files>
  <behavior>
    - Reading `catalogPreferences.catalogMode` returns 'wizard' or 'pro'.
    - Calling `catalogPreferences.setMode('pro')` updates the store and persists to LocalStorage under key 'catalog_preferences'.
    - `initializeDefault()` is idempotent: it sets the mode based on catalog content ONLY if the store has not been explicitly initialized. After it runs once `initialized` is true and subsequent calls are no-ops.
    - Default rule (per D-CONTEXT 'Default'): if `GET /catalog/garments` returns >=1 entry OR `GET /catalog/services` returns >=1 entry → 'pro'; else → 'wizard'.
    - Network failure during default detection leaves the persisted default untouched (the initial value `{ catalogMode: 'wizard', initialized: false }` remains so a later mount retries detection). The catch block ONLY logs `console.warn` — it does not call `setMode`, does not flip `initialized`, and does not overwrite any existing user choice.
  </behavior>
  <action>
    Create `anotame-web/src/lib/stores/catalog-preferences.svelte.ts` mirroring the structure of `palette.svelte.ts`. Use a single `PersistedState<{ catalogMode: 'wizard' | 'pro'; initialized: boolean }>` keyed `'catalog_preferences'` with default `{ catalogMode: 'wizard', initialized: false }`.

    Export a singleton `catalogPreferences` with:
    - `get catalogMode(): 'wizard' | 'pro'`
    - `setMode(mode: 'wizard' | 'pro'): void` — sets `catalogMode` and `initialized: true`
    - `async initializeDefault(): Promise<void>` — when `initialized` is false, fetch `${API_CATALOG}/catalog/garments` and `${API_CATALOG}/catalog/services` in parallel via `apiService.request`. If either array length > 0 → `setMode('pro')`. Else → `setMode('wizard')`. On exception: `console.warn` and leave state untouched (do NOT call `setMode`, do NOT flip `initialized`) — the persisted default of `{ catalogMode: 'wizard', initialized: false }` remains so a later mount retries detection.

    Import imports: `import { PersistedState } from 'runed'` and `import { apiService, API_CATALOG } from '$lib/services/api.svelte'`.

    Do NOT scope by user id — this is a per-device preference (matches `table-preferences.svelte.ts` not `palette.svelte.ts` for scoping, but mirror palette for the export-shape pattern).
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual: `bun --cwd anotame-web run check` reports 0 errors for the new file.
  </verify>
  <done>File exists, exports `catalogPreferences` singleton with `catalogMode` getter, `setMode`, and `initializeDefault`. `bun run build` exits 0.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Add 'Experiencia de Catálogo' card to Settings + invoke initializeDefault on mount</name>
  <files>anotame-web/src/routes/(app)/dashboard/settings/+page.svelte</files>
  <action>
    Modify `anotame-web/src/routes/(app)/dashboard/settings/+page.svelte`:

    1. Add imports at top of `<script>`:
       - `import { catalogPreferences } from '$lib/stores/catalog-preferences.svelte'`
       - `import WandIcon from 'lucide-svelte/icons/wand-2'`
       - `import TableIcon from 'lucide-svelte/icons/table-2'`
       - `import { onMount } from 'svelte'`

    2. Add `onMount(() => { catalogPreferences.initializeDefault(); })` to trigger one-shot default detection.

    3. Insert a new `Card.Root` BEFORE the existing "Tabla" card with title "Experiencia de Catálogo" and description "Elige cómo prefieres crear y editar tu catálogo de prendas y servicios.". Inside `Card.Content` use `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">` with two buttons of class `h-24 flex flex-col gap-2 touch-manipulation`. Each button uses `variant={catalogPreferences.catalogMode === '<mode>' ? 'default' : 'outline'}` and `onclick={() => catalogPreferences.setMode('<mode>')}`. Wizard button shows `<WandIcon class="w-6 h-6" />` then text "Asistente (Wizard)" with subtext `<span class="text-xs font-normal">Guiado paso a paso</span>`. Pro button shows `<TableIcon class="w-6 h-6" />` then "Tablas Directas (Pro)" with subtext "Acceso directo a tablas".

    Keep all existing cards untouched. Do NOT add a switch/toggle component — buttons only, per locked decision.
  </action>
  <verify>
    <automated>cd anotame-web &amp;&amp; bun run build</automated>
    Manual at /dashboard/settings: new card renders between "Paleta de colores" and "Tabla". Clicking each button highlights it (variant default). Refresh the page — selection persists. `localStorage.getItem('catalog_preferences')` shows the chosen mode.
  </verify>
  <done>Settings page shows the new card with both buttons functional and persistent. `bun run build` exits 0. No console errors.</done>
</task>

</tasks>

<verification>
- `bun --cwd anotame-web run build` exits 0
- LocalStorage key `catalog_preferences` is created on first interaction
- Toggling mode in Settings updates localStorage and survives full page reload
- `catalogPreferences.catalogMode` is reactive when read inside `$derived`/`$effect` (verify by adding a temporary `console.log` in another file or trust the runed contract)
</verification>

<success_criteria>
1. `anotame-web/src/lib/stores/catalog-preferences.svelte.ts` exists and exports `catalogPreferences` singleton.
2. Settings page renders the new card and toggling persists.
3. Default detection runs once on Settings mount and never overrides an explicit user choice.
4. Build is green.
</success_criteria>

<output>
After completion, create `.planning/phases/27-catalog-wizard-categorized-menu-modal/27-01-SUMMARY.md` summarizing files touched, decisions taken, and next-plan handoff notes (especially: the exact import path other plans should use to read the mode).
</output>
