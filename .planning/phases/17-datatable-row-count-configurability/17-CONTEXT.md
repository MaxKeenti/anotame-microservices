---
phase: 17-datatable-row-count-configurability
seed: SEED-004
status: ready-to-plan
---

# Phase 17: DataTable Row Count Configurability

**Source:** SEED-004
**Promoted:** 2026-04-13
**Status:** Context stub — run `/gsd:plan-phase 17` to gather full context and create plans

## Goal

Add configurable per-session row count to `DataTableWrapper` so staff can adjust how many rows are shown per page. The preference is persisted in `localStorage` so it survives page reloads. Directly addresses the 1024×768px display constraint at El Hilvan.

## Seed Summary

Currently `DataTableWrapper` uses a fixed or prop-set `pageSize`. Users on small screens (1024×768) must scroll excessively. A row-count setting — selectable in the table UI and persisted locally — improves usability without requiring backend changes.

## Scope (from SEED-004)

- `DataTableWrapper.svelte` — read row count from a settings store, fall back to current default
- A `tablePreferences` store (or `PersistedState` from `runed`) backed by `localStorage`
- UI element to change row count (e.g., a "Rows per page" select in the table footer or filter bar)
- Persist choice per-session across reloads

**Scope estimate:** Small — frontend only, no backend changes

## Key References

- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` — `pagination` state at line 46
- `.planning/codebase/CONVENTIONS.md` — Svelte 5 runes, `PersistedState` from `runed`
- `AI_RULES.md` — touch-first, adaptive components

## Deferred from this phase

- Server-side pagination (current pagination is client-side)
- Per-table settings (global setting first, per-table override is future work)
