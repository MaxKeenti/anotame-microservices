# Phase 9: DataTableWrapper Pattern Completion — Research

## RESEARCH COMPLETE

**Researched:** 2026-04-03
**Phase:** 9 — DataTableWrapper Pattern Completion
**Goal:** All four remaining catalog and admin pages migrated to the DataTableWrapper pattern

---

## 1. Pattern Analysis: DataTableWrapper Component

**Location:** `src/lib/components/ui/DataTableWrapper.svelte`

The DataTableWrapper is a generic Svelte 5 component using `@tanstack/table-core` that provides:
- **Type-safe generics:** `<script lang="ts" generics="TData">`
- **Built-in features:** Sorting, global filtering, pagination, column pinning
- **Props interface:**
  - `columns: ColumnDef<TData>[]` — TanStack column definitions
  - `data: TData[]` — Array of row data
  - `pageSize?: number` — Default 20
  - `loading?: boolean` — Shows "Cargando..." placeholder
  - `emptyMessage?: string` — Default "No hay datos."
  - `filterPlaceholder?: string` — Default "Buscar..."
  - `actionCell?: Snippet<[Row<TData>]>` — Svelte 5 snippet for action column
- **Reactivity:** Uses `$state` for sorting, pagination, globalFilter; `$derived` for table instance recreation
- **Pagination reset:** `$effect` resets page to 0 on filter change (uses `untrack` to avoid infinite loops)
- **Action column pattern:** Detects `cell.column.id === 'actions'` and renders the `actionCell` snippet

### Key Integration Pattern (from reference pages)

```svelte
import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
import type { ColumnDef } from '@tanstack/table-core';

const columns: ColumnDef<any>[] = [
  { accessorKey: 'name', header: 'Nombre', enableSorting: true },
  { id: 'computed', accessorFn: (row) => ..., header: 'Label', enableSorting: true },
  { id: 'actions', header: 'Acciones', enableSorting: false },
];

<DataTableWrapper
  columns={columns}
  data={filteredData}
  loading={loading}
  emptyMessage="No se encontraron datos."
  filterPlaceholder="Buscar..."
>
  {#snippet actionCell(row)}
    <div class="flex justify-end gap-2">
      <Button variant="outline" size="sm" ... onclick={() => handleEdit(row.original)}>
        <Edit class="w-4 h-4 mr-2" /> Editar
      </Button>
      <Button variant="outline" size="sm" ... onclick={() => handleDelete(row.original)}>
        <Trash2 class="w-4 h-4 mr-2" /> Eliminar
      </Button>
    </div>
  {/snippet}
</DataTableWrapper>
```

---

## 2. Reference Implementations (Already Migrated)

### Orders Page (`src/routes/(app)/dashboard/orders/+page.svelte`)
- **Pattern:** Full DataTableWrapper with external filter panel (search, garment filter, date filter)
- **Column definitions:** Uses `accessorFn` for computed columns (customer name, garments summary, status translation, currency formatting)
- **Action column:** Edit + Details buttons with `row.original.id`
- **Dual view:** Active orders + Drafts tabs, each with its own columns and DataTableWrapper
- **Imports:** `DataTableWrapper`, `type { ColumnDef }` from `@tanstack/table-core`

### Customers Page (`src/routes/(app)/dashboard/customers/+page.svelte`)
- **Pattern:** DataTableWrapper with external search (form submit triggers API search)
- **Column definitions:** 4 columns (nombre via accessorFn, phoneNumber, email, actions)
- **Action column:** Edit + Delete buttons
- **Dialog pattern:** Single `editingCustomer` state, `CustomerDialog` component at page level

---

## 3. Target Pages Analysis

### 3.1 Garments Page (`src/routes/(app)/dashboard/catalog/garments/+page.svelte`)
**Current state:** Raw `Table.*` components, manual `{#if loading}` / `{#each}` loop
**Data shape:** `{ id, name, description }`
**Filters:** Simple `searchQuery` with `$derived` filter
**Actions:** Edit + Delete (admin-gated via `isAdmin`)
**Dialog:** `GarmentDialog` with `editingGarment` state
**Migration notes:**
- 2 data columns (name, description) + conditional actions column
- `searchQuery` filter can be replaced by DataTableWrapper's built-in global filter
- Admin-gating for actions column: use `isAdmin` conditional in column definition or in the snippet
- Simple migration — no external filter panel needed

### 3.2 Services Page (`src/routes/(app)/dashboard/catalog/services/+page.svelte`)
**Current state:** Raw `Table.*` components, manual loop
**Data shape:** `{ id, name, garmentTypeId, defaultDurationMin, basePrice }`
**Filters:** `searchQuery` + `garmentFilter` (AdaptiveSelect) with `$derived.by` filter
**Actions:** Edit + Delete (admin-gated)
**Dialog:** `ServiceDialog` with `editingService` state
**Helper:** `getGarmentName(garmentTypeId)` resolves garment lookup
**Migration notes:**
- 4 data columns (name, garment name via accessorFn, duration, price) + conditional actions
- Has external filter panel (search + garment dropdown) — must keep external filter panel and pass `filteredServices` to DataTableWrapper
- Price formatting: `$${service.basePrice.toFixed(2)}` — use `accessorFn` for display

### 3.3 Price Lists Page (`src/routes/(app)/dashboard/catalog/pricelists/+page.svelte`)
**Current state:** Raw `Table.*` inside a `Card.Root`, manual loop
**Data shape:** `{ id, name, priority, validFrom, validTo, active }`
**Filters:** None (no search or filter)
**Actions:** Clone + View + Delete
**Guard:** Uses `useAuthGuard(true, '/dashboard')` — admin only
**Special:** `Card.Root` wrapper with header/description; active/inactive status badges
**Migration notes:**
- 5 data columns (name, priority, validFrom, validTo, status badge) + actions
- Date formatting: `new Date(list.validFrom).toLocaleDateString('es-ES')`
- Status badge: conditional span with success/muted colors
- For badge and date formatting: use `accessorFn` for text value, but badge rendering needs careful handling — DataTableWrapper renders `cell.getValue() as string`, so badges won't render as HTML
- **KEY INSIGHT:** The current DataTableWrapper only renders `cell.getValue() as string ?? ''` — it does NOT support custom cell renderers for non-action columns. Status badges and formatted dates would lose their styling.
- **SOLUTION OPTIONS:**
  1. Extend DataTableWrapper to support per-column snippets (significant change, out of scope)
  2. Use `accessorFn` to return plain text values (badges become text like "Activa"/"Inactiva")
  3. Accept plain text — the DataTableWrapper provides sorting/filtering/pagination which is the main value
- **RECOMMENDED:** Option 2 — use plain text values via `accessorFn`. The visual loss of status badges is minimal and can be addressed in a future enhancement phase.

### 3.4 Admin Users Page (`src/routes/(app)/dashboard/admin/users/+page.svelte`)
**Current state:** Raw `Table.*` components, manual loop
**Data shape:** `{ id, firstName, lastName, username, email, role }`
**Filters:** None
**Actions:** Edit + Delete
**Dialog:** `UserDialog` with `editingUser` state
**Helper:** `getRoleBadge(role)` returns CSS class strings for role badges
**Migration notes:**
- 4 data columns (full name via accessorFn, username, email, role) + actions
- Role badges: same issue as pricelists — rendered via `<span>` with conditional CSS classes
- **SAME SOLUTION:** Use `accessorFn` returning plain text for role (e.g., "ADMIN"), accept temporary loss of badge styling

---

## 4. Migration Strategy

### Consistent Pattern Per Page

1. **Import** `DataTableWrapper` and `type { ColumnDef }` from `@tanstack/table-core`
2. **Define** `columns: ColumnDef<any>[]` array with `accessorKey`, `accessorFn`, `enableSorting`
3. **Replace** raw `Table.*` markup with `<DataTableWrapper>` component
4. **Move** action buttons into `{#snippet actionCell(row)}` block
5. **Remove** manual `{#if loading}` / `{#each}` loop — DataTableWrapper handles this
6. **Keep** external filter panels (if they exist) and pass `filteredData` to DataTableWrapper
7. **Remove** unused `* as Table` import
8. **Keep** dialog components unchanged at page level

### Wave Strategy

- **Wave 1 (Simple pages — no external filters):** Garments + Users — straightforward swap
- **Wave 2 (Complex pages — external filters or special layout):** Services + Price Lists

---

## 5. Known Gotchas

1. **Svelte 5 `untrack()` in DataTableWrapper:** The pagination effect uses `untrack()` to avoid infinite reactive loops. This was fixed in Phase 8 (BUG-02 for customers page). No changes needed to DataTableWrapper itself.
2. **`isAdmin` conditional columns:** The current pages conditionally render the Actions column header and cells. With DataTableWrapper, the actions column is always defined but the snippet content can be conditionally rendered (or the column can be included/excluded from the array based on `isAdmin`).
3. **DataTableWrapper's built-in filter vs external filters:** Pages with external filter panels (Services) should pass pre-filtered data to DataTableWrapper and can optionally hide the built-in search input. However, DataTableWrapper always renders the search input — this is fine since it adds an additional in-table filter on top of the external filters.
4. **Price Lists Card wrapper:** The pricelists page currently wraps the table in `Card.Root`. After migration, the Card wrapper should still be used around the DataTableWrapper for visual consistency.
5. **Guard pattern:** The pricelists page uses `useAuthGuard`. This is a page-level concern and doesn't interact with DataTableWrapper — keep as-is.

---

## Validation Architecture

### Per-Page Verification

For each migrated page, verify:
1. `grep -c "DataTableWrapper" {page_file}` returns ≥ 1
2. `grep -c "Table.Root" {page_file}` returns 0 (no raw table markup)
3. Column count matches original (visual check)
4. Sorting is enabled on appropriate columns
5. Action buttons function correctly (Edit triggers dialog, Delete triggers confirm)
6. Loading state shows "Cargando..."
7. Empty state shows appropriate message
8. Pagination controls appear when data exceeds page size

### Build Verification
```bash
cd anotame-web && bun run build
```
Exit code must be 0.
