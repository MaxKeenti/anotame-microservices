---
phase: 17-datatable-row-count-configurability
seed: SEED-004
status: ready-to-plan
---

# Phase 17: DataTable Row Count Configurability — Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a global, per-device "rows per page" preference that lets staff adjust how many rows `DataTableWrapper` shows on every table in the app. The preference is stored in `localStorage` and persists across page reloads. Staff set it on the existing `/dashboard/settings` (Preferencias) page, which already has theme and palette sections — this adds a "Tabla" section to the same page.

No backend changes. No server-side persistence. No per-table overrides (global only, for simplicity).

## What already exists
- `/dashboard/settings/+page.svelte` — the Preferencias page with theme buttons and color palette inputs; uses `Card.Root/Header/Content` layout
- `anotame-web/src/lib/stores/palette.svelte.ts` — `PersistedState`-backed store with `.current` accessor and mutation methods; **this is the exact pattern to replicate**
- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` — uses `pageSizeProp` (default 20) to initialize `pagination.pageSize` via the intercept pattern (`untrack(() => pageSizeProp)`)
- `runed` is already a dependency — `PersistedState` is available

## What Phase 17 adds
1. **`table-preferences.svelte.ts`** store — `PersistedState<number>('table_page_size', 20)` with validated accessor (falls back to 20 if stored value isn't a valid option)
2. **DataTableWrapper update** — reads initial `pageSize` from the store instead of `pageSizeProp`
3. **Settings page addition** — a new "Tabla" `Card` section with 4 size buttons (5 / 10 / 20 / 50), styled identically to the theme buttons (h-24, flex-col, gap-2, touch-manipulation); active selection highlighted with `variant="default"`, others `variant="outline"`

</domain>

<decisions>
## Implementation Decisions

### Store
- **D-01:** New file `anotame-web/src/lib/stores/table-preferences.svelte.ts`. Follows the exact structure of `palette.svelte.ts`: one `PersistedState` object, one exported `tablePreferences` singleton object with `get pageSize()`, `setPageSize(n)`, and `PAGE_SIZE_OPTIONS` constant.
- **D-02:** `localStorage` key: `'table_page_size'`. Default value: `20` (matches the current DataTableWrapper default).
- **D-03:** Valid options: `[5, 10, 20, 50]`. Accessor validates the stored value and falls back to `20` if it's not in the array (guards against stale/corrupt localStorage).
- **D-04:** Per-device, not per-user — no userId scoping (unlike `palette.svelte.ts` which scopes by userId). Any staff member using this browser gets the same setting.

### DataTableWrapper
- **D-05:** Replace `let initialPageSize = untrack(() => pageSizeProp)` with `let initialPageSize = untrack(() => tablePreferences.pageSize)`. The `pageSizeProp` prop remains in the `Props` type for backward compatibility but is no longer used to set the initial pagination size.
- **D-06:** The `pagination` `$state` is still initialized once at mount via `untrack`. It does NOT reactively track the store — if staff changes the preference in settings, currently open tables update on next page load (acceptable behavior; no live sync needed).
- **D-07:** Import: `import { tablePreferences } from '$lib/stores/table-preferences.svelte'` at the top of the `<script>`.

### Settings Page
- **D-08:** A new `Card.Root` block is inserted AFTER the existing "Paleta de colores" card and BEFORE the "Idioma (Próximamente)" card.
- **D-09:** Card title: "Tabla". Card description: "Ajusta cuántas filas se muestran por página en todas las tablas."
- **D-10:** UI: 4 buttons in a `grid grid-cols-4 gap-3` layout, each showing only the number (e.g., "5", "10", "20", "50"). Same class as theme buttons (`h-24 flex flex-col gap-2 touch-manipulation`) but no icon — just the number in large text.
- **D-11:** Active size button uses `variant="default"`, inactive uses `variant="outline"`. Comparison: `tablePreferences.pageSize === option`.
- **D-12:** `onclick={() => tablePreferences.setPageSize(option)}` directly on each button — no intermediate state needed.
- **D-13:** Import `tablePreferences` and `PAGE_SIZE_OPTIONS` from the store in the settings page `<script>`.

### Claude's Discretion
- Exact label below each number button (e.g., "filas" subtitle under the number, or just the number alone)
- Whether to add a brief explanatory note below the buttons (e.g., "Los cambios aplican al siguiente clic en una tabla.")

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pattern to replicate — PersistedState store
- `anotame-web/src/lib/stores/palette.svelte.ts` — Full file; replicate the PersistedState pattern exactly (import, wrapping object, `.current` accessor, mutation method)

### Component to update
- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` — Full file; change is at line 51 (`let initialPageSize = untrack(() => pageSizeProp)`) — replace `pageSizeProp` with `tablePreferences.pageSize`

### Page to update
- `anotame-web/src/routes/(app)/dashboard/settings/+page.svelte` — Full file; insert new Card block after "Paleta de colores" Card (ends around line 118), before "Idioma (Próximamente)" Card

### Conventions
- `.planning/codebase/CONVENTIONS.md` — PersistedState usage, Svelte 5 runes, store patterns
- `AI_RULES.md` — touch-first (h-24 buttons), no arbitrary Tailwind values, no `confirm()`/`alert()`

</canonical_refs>

<code_context>
## Existing Code Insights

### PersistedState pattern (from palette.svelte.ts)
```typescript
import { PersistedState } from 'runed';
const _foo = new PersistedState<T>('storage_key', defaultValue);
export const fooStore = {
  get current(): T { return _foo.current; },
  set(value: T) { _foo.current = value; },
};
```

### DataTableWrapper intercept pattern (line 51)
```typescript
// Current
let initialPageSize = untrack(() => pageSizeProp);
// After Phase 17
let initialPageSize = untrack(() => tablePreferences.pageSize);
```

### Settings page Card layout (from existing theme card, lines 40–73)
```svelte
<Card.Root>
  <Card.Header>
    <Card.Title>Apariencia</Card.Title>
    <Card.Description>...</Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Button variant={active ? 'default' : 'outline'} class="h-24 flex flex-col gap-2 touch-manipulation" onclick={...}>
        <Icon class="w-6 h-6" />
        Label
      </Button>
      ...
    </div>
  </Card.Content>
</Card.Root>
```

### Key pattern note
The "Paleta de colores" card ends at line ~118 and the "Idioma" card starts at ~120. The new "Tabla" card inserts between them. No icon needed for the number buttons (icon slot is optional in Button).

</code_context>

<specifics>
## Specific Ideas

- The 4 size buttons could show the number large (font-bold text-2xl) with a small "filas" label below in text-sm — mimics the icon+label layout of the theme buttons without needing an icon
- A short note below the buttons ("Los cambios aplican al recargar la tabla") sets correct expectations without being alarming
- The active button should make the current selection immediately obvious — `variant="default"` is sufficient; no additional ring/outline needed

</specifics>

<deferred>
## Deferred Ideas

- **Per-table row counts** — each table remembers its own size; deferred (global is sufficient for now per D-04)
- **Live sync** — tables updating immediately when preference changes without a page reload; deferred (next page load is fine)
- **Per-user server-side preference** — follows the user across devices; deferred (localStorage is sufficient at El Hilvan's single-location scale)
- **More granular options** (e.g., 100+) — deferred; 50 covers all realistic use cases for the current data volumes

</deferred>

---

*Phase: 17-datatable-row-count-configurability*
*Context gathered: 2026-04-13*
