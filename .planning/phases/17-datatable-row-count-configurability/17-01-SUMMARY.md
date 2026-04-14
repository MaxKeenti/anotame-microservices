---
phase: 17-datatable-row-count-configurability
plan: 01
subsystem: ui
tags: [svelte5, runed, PersistedState, localStorage, DataTableWrapper, settings]

requires: []
provides:
  - Per-device localStorage-backed table row count preference (key: table_page_size, default: 20)
  - DataTableWrapper initialises pagination page size from tablePreferences store
  - Settings page "Tabla" card with 4 size buttons (5, 10, 20, 50)
affects:
  - Any plan touching DataTableWrapper or the settings page

tech-stack:
  added: []
  patterns:
    - PersistedState singleton without userId scoping (per-device shared preference)
    - Store validation whitelist pattern (PAGE_SIZE_OPTIONS guard in getter)

key-files:
  created:
    - anotame-web/src/lib/stores/table-preferences.svelte.ts
  modified:
    - anotame-web/src/lib/components/ui/DataTableWrapper.svelte
    - anotame-web/src/routes/(app)/dashboard/settings/+page.svelte

key-decisions:
  - "D-01/D-02: PersistedState key is 'table_page_size', default is 20 — no userId scoping (per-device)"
  - "D-03: PAGE_SIZE_OPTIONS whitelist [5,10,20,50] used in both getter (validation/fallback) and setPageSize (guard)"
  - "D-04: No authService dependency — any staff member on the device shares the same row count setting"
  - "D-05: pageSize?: number prop kept in DataTableWrapper Props for backward compat; pageSizeProp remains in scope but is not used for pagination init"
  - "D-06: Init-time only — no reactive $effect tracking the store; table picks up preference on mount, not on live store change"
  - "D-09/D-10: Tabla card uses grid-cols-4 with h-24 buttons showing text-2xl number + text-sm 'filas' label"
  - "D-11/D-12/D-13: variant='default' highlights active size; onclick calls setPageSize; {#each PAGE_SIZE_OPTIONS} iterates the const tuple"

patterns-established:
  - "Per-device PersistedState store: import PersistedState, no userId, export singleton with getter+setter"

requirements-completed:
  - SEED-004

duration: 12min
completed: 2026-04-13
---

# Phase 17 Plan 01: DataTable Row Count Configurability Summary

**Per-device localStorage preference for DataTableWrapper page size via PersistedState store, with a settings UI card offering 5/10/20/50 row options**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-13T09:12:00Z
- **Completed:** 2026-04-13T09:24:00Z
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 updated)

## Accomplishments
- Created `table-preferences.svelte.ts` with a `PersistedState`-backed singleton, validated getter, and guarded setter
- Updated `DataTableWrapper.svelte` to source its initial page size from `tablePreferences.pageSize` instead of the `pageSizeProp` prop
- Added a "Tabla" Card to the Preferencias settings page with four size-selection buttons, active state highlighting, and a note about reload behaviour

## Task Commits

All three tasks were committed atomically in a single commit:

1. **Task 1: Create table-preferences.svelte.ts store** - `ac84b57` (feat)
2. **Task 2: Update DataTableWrapper.svelte to read from store** - `ac84b57` (feat)
3. **Task 3: Add "Tabla" Card to settings page** - `ac84b57` (feat)

## Files Created/Modified
- `anotame-web/src/lib/stores/table-preferences.svelte.ts` - New PersistedState store: exports `PAGE_SIZE_OPTIONS` const tuple and `tablePreferences` singleton with validated `pageSize` getter and `setPageSize` method
- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` - Added import for `tablePreferences`; line 51 changed from `untrack(() => pageSizeProp)` to `untrack(() => tablePreferences.pageSize)`; `pageSize?: number` prop preserved for backward compat
- `anotame-web/src/routes/(app)/dashboard/settings/+page.svelte` - Added import for `tablePreferences` and `PAGE_SIZE_OPTIONS`; inserted "Tabla" Card.Root block between "Paleta de colores" and "Idioma (Próximamente)" cards

## Decisions Made
- No per-user scoping: all staff sharing a device share the same row count preference (D-04). This simplifies the store and matches the use case (dedicated kiosk-style workstations at El Hilvan).
- Init-time only: `DataTableWrapper` reads the preference once at mount via `untrack`. No live sync between settings and already-mounted tables (D-06). The settings card documents this expectation ("Los cambios aplican al recargar la tabla").
- `pageSizeProp` kept in scope but bypassed: the prop is preserved in `Props` type for backward compat with existing call sites that pass `pageSize`. The IDE emits a "declared but never read" hint (severity: Hint, not Error) — `bun run check` exits 0 so no suppression comment was needed (per plan instruction).
- Threat T-17-01 mitigated: `pageSize` getter validates stored value against `PAGE_SIZE_OPTIONS` and falls back to `20` for corrupt/stale localStorage entries.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. `bun run check` exited 0 (1 pre-existing warning in `user-dialog.svelte`, unrelated). `bun run build` completed with `✔ done` (pre-existing third-party circular dependency warnings in `@internationalized/date` node_modules, unrelated).

## User Setup Required

None — no external service configuration required.

## Deferred / Out of Scope (confirmed)
- Per-table overrides (each DataTableWrapper having its own size independent of global preference)
- Live sync (already-mounted tables reacting to preference changes without reload)
- Server-side persistence (preference synced across devices via user account)

## Next Phase Readiness
- `tablePreferences` store is available for any future plan that needs to read or extend the preference (e.g., per-table overrides could read the global as a default)
- Settings page Card ordering: Apariencia → Paleta de colores → Tabla → Idioma (Próximamente)

---
*Phase: 17-datatable-row-count-configurability*
*Completed: 2026-04-13*
