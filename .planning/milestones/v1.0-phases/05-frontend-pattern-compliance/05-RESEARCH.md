# Phase 05: Frontend Pattern Compliance - Research

**Researched:** 2026-04-01
**Domain:** Svelte 5 / SvelteKit frontend — TanStack Table wrapper component and sveltekit-superforms migration
**Confidence:** HIGH

---

## Summary

Phase 5 introduces two standardization patterns mandated by `AI_RULES.md`: a `DataTableWrapper` component wrapping `@tanstack/table-core` and migrating all form/dialog components to `sveltekit-superforms`. Both packages are already installed and in active use on the project — no new dependencies are needed.

The orders page and customers page currently use the shadcn-svelte `* as Table` primitive components directly (raw HTML table scaffolding, no TanStack logic). No `DataTableWrapper` component exists anywhere in the codebase. The orders page has client-side filtering via `$derived.by()` but no sorting or pagination wiring. The customers page performs server-side search only.

`sveltekit-superforms` is already implemented in four dialog components (`customer-dialog.svelte`, `service-dialog.svelte`, `garment-dialog.svelte`, `user-dialog.svelte`) using the SPA mode + `zod4` adapter pattern. The three targets that still need migration are: (a) wizard steps (customer, items/sub-wizard, payment), (b) the admin schedule page, and (c) the admin settings page. Notably the user-facing `settings` page (`/dashboard/settings`) contains only theme-toggle buttons and color pickers — no forms — and must not be touched.

**Primary recommendation:** Use `@tanstack/table-core` `createTable` directly (no `@tanstack/svelte-table` wrapper exists in node_modules), drive reactivity with Svelte 5 `$state`/`$derived`, and build `DataTableWrapper` as a Svelte 5 generic component placed at `src/lib/components/ui/DataTableWrapper.svelte`. For superforms, copy the established SPA+zod4 pattern from `customer-dialog.svelte` exactly — it is the canonical reference for this project.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-04 | Frontend `DataTableWrapper` component exists wrapping TanStack Table — used by at least orders and customers pages | `@tanstack/table-core` 8.21.3 installed; `createTable`, `getCoreRowModel`, sorting/filtering/pagination row models available; no wrapper component exists yet |
| QUAL-05 | All form/dialog components use `sveltekit-superforms` — order wizard steps, schedule page, and settings page migrated | `sveltekit-superforms` 2.30.0 + `zod` 4.3.6 + `formsnap` 2.0.1 installed; canonical SPA+zod4 pattern already working in 4 dialog components |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md / AI_RULES.md)

The project's `CLAUDE.md` defers to `AI_RULES.md`. All of the following are **mandatory** and override default behaviour.

### Mandated Patterns (relevant to Phase 5)
- **Tables:** Use `DataTableWrapper` with TanStack table — not raw `<Table.Root>` — for data listing pages.
- **Forms/Dialogs:** Use `sveltekit-superforms` single-dialog pattern — not bare `<form onsubmit>` with `$state`.
- **UI components:** Rely exclusively on Tailwind CSS v4 and shadcn-svelte components in `src/lib/components/ui/`. No external UI libraries.
- **Svelte 5 runes only:** `$state`, `$derived`, `$effect` — no legacy stores.
- **No `<svelte:component>`:** Map component to uppercase variable `{@const Comp = ...}` and render `<Comp />`.
- **No `$state` in `<script module>`:** Extract to `.svelte.ts` file if needed.
- **Adaptive UI:** Never use `confirm()`, `alert()`, or native `<select>`. Use adaptive wrappers from `$lib/components/ui/responsive`.
- **Toast for feedback:** Always use `toast` from `svelte-sonner`.
- **Self-closing HTML:** Use `<div></div>` not `<div />`.
- **`{@const}` placement:** Must be direct child of `{#each}` or `{#if}`, never inside raw HTML blocks.
- **A11y:** All `<label>` elements must use `for=` + `id=` pairing.
- **Build check:** `bun run build` must exit 0 before committing.
- **Touch-first:** h-12 minimum touch targets, `touch-manipulation` class on interactive elements.
- **Settings page (`/dashboard/settings`):** Has color palette section added in Phase 1 — do NOT modify this page.

---

## Standard Stack

### Core (already installed — no additions needed)

| Library | Installed Version | Purpose | Why Standard |
|---------|------------------|---------|--------------|
| `@tanstack/table-core` | 8.21.3 | Headless table logic (sorting, filtering, pagination, column defs) | Mandated by AI_RULES.md; framework-agnostic core |
| `sveltekit-superforms` | 2.30.0 | SPA-mode form validation + state management | Mandated by AI_RULES.md; already in 4 dialogs |
| `zod` | 4.3.6 | Schema validation for superforms | Already used; zod4 adapter matches installed zod v4.x |
| `formsnap` | 2.0.1 | Accessible form field primitives for superforms | Already in `src/lib/components/ui/form/` |
| shadcn-svelte `* as Table` | (existing) | HTML table primitives (`Table.Root`, `Table.Header`, etc.) | Used internally by DataTableWrapper |

### Critical Package Note: No `@tanstack/svelte-table`

Only `@tanstack/table-core` is installed. `@tanstack/svelte-table` (which provides a Svelte-specific `createSvelteTable` helper) is **not installed**. The planner must use `createTable` from `@tanstack/table-core` directly and manage reactivity manually via Svelte 5 `$state`/`$derived`. This is the standard approach for framework-agnostic TanStack v8.

**No installation commands needed** — all required packages are present.

---

## Architecture Patterns

### Recommended Component Location

```
src/lib/components/ui/
└── DataTableWrapper.svelte    # NEW — canonical table wrapper
src/lib/components/
├── orders/
│   └── wizard/
│       ├── customer-step.svelte    # MIGRATE to superforms
│       ├── items-step.svelte       # items list — no form inputs to migrate
│       ├── item-sub-wizard.svelte  # inline price/adj inputs — assess for superforms
│       └── payment-step.svelte     # MIGRATE to superforms
└── customers/
    └── customer-dialog.svelte      # ALREADY done — reference model
src/routes/(app)/dashboard/
├── orders/+page.svelte             # MIGRATE to DataTableWrapper
├── customers/+page.svelte          # MIGRATE to DataTableWrapper
└── admin/
    ├── settings/+page.svelte       # MIGRATE to superforms
    └── schedule/+page.svelte       # MIGRATE to superforms (holiday add form only)
```

### Pattern 1: DataTableWrapper — TanStack table-core in Svelte 5

**What:** Generic Svelte 5 component that accepts `columns` (TanStack `ColumnDef[]`) and `data` (typed array), wires up `createTable` with sorting/pagination/global-filter state, and renders via the shadcn `Table.*` primitives. Exposes slots/snippets for the filter toolbar and action cells.

**When to use:** Any page that lists data in a table (orders, customers, and any future data pages).

**TanStack table-core API (verified from installed `8.21.3` types):**

```typescript
// Source: @tanstack/table-core/build/lib/core/table.d.ts
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/table-core';
```

**Svelte 5 reactivity bridge pattern** (no `@tanstack/svelte-table` available):

```typescript
// DataTableWrapper.svelte  <script lang="ts" generics="TData">
let { columns, data, pageSize = 20 } = $props<{
  columns: ColumnDef<TData>[];
  data: TData[];
  pageSize?: number;
}>();

let sorting = $state<SortingState>([]);
let globalFilter = $state('');
let pagination = $state<PaginationState>({ pageIndex: 0, pageSize });

// Recreate table when inputs change — $derived ensures reactivity
let table = $derived(
  createTable<TData>({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater;
    },
    onGlobalFilterChange: (updater) => {
      globalFilter = typeof updater === 'function' ? updater(globalFilter) : updater;
    },
    onPaginationChange: (updater) => {
      pagination = typeof updater === 'function' ? updater(pagination) : updater;
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
);
```

**Critical compiler constraint:** `$state` cannot be used in a `<script module>` block (AI_RULES.md). All reactive table state must live in the instance `<script>` block.

**Columns defined at call site (orders example):**

```typescript
// In orders/+page.svelte
import type { ColumnDef } from '@tanstack/table-core';

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'ticketNumber',
    header: 'Ticket',
  },
  {
    id: 'customer',
    accessorFn: (row) => `${row.customer?.firstName} ${row.customer?.lastName}`,
    header: 'Cliente',
  },
  // ... status, deadline, total
  {
    id: 'actions',
    header: 'Acciones',
    enableSorting: false,
    // rendered via {#snippet cell()} in DataTableWrapper
  }
];
```

### Pattern 2: sveltekit-superforms SPA Mode

**What:** Client-only form validation using `superForm(defaults(zod4(schema)), { SPA: true, validators: zod4(schema), onUpdate })`. No SvelteKit server actions required.

**Canonical reference:** `src/lib/components/customers/customer-dialog.svelte` and `src/lib/components/catalog/service-dialog.svelte` — both are complete, working implementations of the exact pattern to replicate.

**Import pattern (verified from installed packages):**

```typescript
import { superForm, defaults, setError } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
// Note: adapter is named 'zod4' (not 'zod') because zod v4 is installed
import { z } from 'zod';
```

**Standard schema + form setup:**

```typescript
const mySchema = z.object({
  fieldA: z.string().min(1, 'Required'),
  fieldB: z.number().min(0),
  // ...
});

const { form, enhance, errors, reset } = superForm(defaults(zod4(mySchema)), {
  SPA: true,
  validators: zod4(mySchema),
  async onUpdate({ form }) {
    if (!form.valid) return;
    isSubmitting = true;
    try {
      await apiService.request(/* ... */);
      toast.success('...');
      onClose();
      onSuccess?.();
    } catch (e: any) {
      if (e instanceof ApiValidationError) {
        for (const [field, message] of Object.entries(e.validationErrors)) {
          setError(form, field as keyof typeof form.data, message);
        }
        toast.error('...');
      } else {
        toast.error(e.message || '...');
      }
    } finally {
      isSubmitting = false;
    }
  }
});

// Sync incoming props into form on open
$effect(() => {
  if (item) {
    $form = { /* map item fields */ };
  } else {
    reset();
  }
});
```

**Template pattern:**

```svelte
<form method="POST" use:enhance class="space-y-4">
  <div class="space-y-2">
    <label for="field-a" class="text-sm font-medium">Label</label>
    <Input id="field-a" name="fieldA" bind:value={$form.fieldA} class="h-12" />
    {#if $errors.fieldA}
      <span class="text-xs text-destructive">{$errors.fieldA}</span>
    {/if}
  </div>
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Guardando...' : 'Guardar'}
  </Button>
</form>
```

### Anti-Patterns to Avoid

- **Raw `<form onsubmit={handler}>`**: Replaced by `use:enhance`. This applies to `admin/settings/+page.svelte` and the schedule holiday form.
- **`$state` for form field values**: Replaced by `$form.fieldName` from superforms. Existing `settings` and `schedule` pages use raw `$state` for all fields — these must be replaced.
- **Inline `$state` arrays for table data** with manual `{#each rows as row}`: Replaced by `DataTableWrapper` with TanStack. The current orders and customers pages do this.
- **`@tanstack/svelte-table` import**: This package is not installed. Do not reference it.
- **`getSortingRowsFn` / deprecated v7 API**: v8 uses `getSortedRowModel()`, `getCoreRowModel()`, etc. as factory functions, not column-level sort helpers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column sorting state management | Custom sort toggle logic + `$state` arrays | `getSortedRowModel()` + TanStack `SortingState` | Handles multi-column sort, cycle (asc/desc/none), stable row identity |
| Client-side pagination | Manual `slice(page * size, ...)` | `getPaginationRowModel()` + TanStack `PaginationState` | Correct row count, page count, edge cases |
| Global filter across columns | Custom `filter()` chaining | `getFilteredRowModel()` + `globalFilter` state | Handles column-level accessor functions uniformly |
| Form validation error mapping | Custom error state + manual field highlighting | `setError(form, field, msg)` from superforms | Type-safe, integrates with formsnap `FieldErrors` |
| Form reset on dialog close | Setting each field to '' | `reset()` from superforms | Resets to schema defaults atomically |

**Key insight:** Both TanStack table-core and sveltekit-superforms solve problems with significant edge-case surface area. TanStack's row models handle sorting stability and filter composition; superforms handles validation timing, error serialization, and constraint propagation. Custom solutions will reproduce the same bugs these libraries already fixed.

---

## Detailed Current State Audit

### Orders Page (`/dashboard/orders/+page.svelte`)

- **Table implementation:** Raw `* as Table` shadcn primitives inside `{#if loading} / {:else} / {#each filteredOrders}` — NO TanStack table logic.
- **Filtering:** Client-side via `$derived.by()` over `searchQuery`, `garmentFilter`, `dateFilter` — must be migrated to TanStack `getFilteredRowModel` or kept as pre-filter data input to DataTableWrapper.
- **Pagination:** None — all orders rendered at once.
- **Columns:** Ticket, Cliente, Prendas (resumen), Estado, Entrega, Total, Acciones (Edit + Detalles buttons).
- **Status badges:** Uses `translateStatus()` + `getStatusColor()` from `$lib/utils/statusUtils` — must be preserved in cell renderers.
- **Tabs:** Has an Active/Drafts tab toggle (`view = $state<'active' | 'drafts'>`) — the drafts tab also uses raw table. Both tables should use DataTableWrapper.
- **Drafts columns:** ID, Cliente, Prendas, Última Modificación, Acciones (Edit Borrador + Eliminar).

### Customers Page (`/dashboard/customers/+page.svelte`)

- **Table implementation:** Raw `* as Table` shadcn primitives in `{#each customers}`.
- **Filtering:** Server-side search only (calls API on submit) — no client-side filter state.
- **Columns:** Nombre, Teléfono, Correo, Acciones (Editar + Eliminar).
- **Dialog:** `CustomerDialog` is already fully on superforms — no changes needed to the dialog itself.
- **Create/Edit:** Single `editingCustomer = $state<any | null>(null)` drives the dialog open/close — this pattern stays.

### Order Wizard (3 steps + sub-wizard)

- **Step 1 — `customer-step.svelte`:** No form inputs to validate; it's a search-and-select UI. No superforms needed here. The "form" concept doesn't apply — this step updates `orderWizardState` directly. **Skip superforms migration for this step.**
- **Step 2 — `items-step.svelte`:** A list manager with add/edit/delete/duplicate. No form fields directly. Delegates to `ItemSubWizard`. **Skip superforms migration for the list wrapper.**
- **Sub-wizard — `item-sub-wizard.svelte`:** Has 4 steps including `price` (number input), `adj` (adjustment number), `adjReason` (string), `duration` (range slider), and `notes` (textarea). Currently uses raw `$state` variables. This is the one "wizard form" that needs superforms — specifically Step 2 (service config: price/adj/adjReason) and Step 3 (notes textarea). **Assessment: migrate Step 2's price/adj/adjReason/duration into a superform schema; Step 0 and Step 1 are selection UIs, not forms.**
- **Step 3 — `payment-step.svelte`:** Has `paymentMethod` (button group), `amountPaid` (number input), `committedDeadline` (AdaptiveDateTimePicker), `notes` (Input). All currently update `orderWizardState` directly via handlers. Because this step writes to a shared wizard state (not a self-contained submit action), the superforms migration must wrap the fields while still calling `orderWizardState.updateActiveDraft()` — use `onUpdate` for the final submit, `$effect` for draft sync.

### Schedule Page (`/dashboard/admin/schedule/+page.svelte`)

- **Weekly schedule section:** Checkbox + time inputs per day bound directly to `$state workDays[]`. The "save" is a button calling `saveWeeklySchedule()` with `PUT`. This section is a complex list-of-objects editor — superforms is applicable but requires an array schema (`z.array(z.object(...))`).
- **Holiday form section:** Simple 2-field form: `newHolidayDate` (AdaptiveDatePicker) and `newHolidayDesc` (Input), submitted via `<form onsubmit={handleAddHoliday}>`. **This is the clear superforms migration target** — simple schema, distinct submit action.
- **Holiday list section:** Raw `Table.*` primitives displaying list. Does not need DataTableWrapper (no sorting/filtering needed per spec).

### Admin Settings Page (`/dashboard/admin/settings/+page.svelte`)

- **Fields:** `settings.name` (string, required), `settings.ownerName` (string), `settings.dailyCapacityMinutes` (number), `taxData.rfc` (string), `taxData.regime` (string), `taxData.address` (string), `taxData.contactPhone` (string).
- **Current state:** All fields bound to raw `$state` objects. Form uses `<form onsubmit={handleSave}>` with manual API call.
- **Schema design note:** The `taxData` object is JSON-encoded into `settings.taxInfo` on save. The superforms schema should flatten these into a single schema: `name`, `ownerName`, `dailyCapacityMinutes`, `rfc`, `regime`, `address`, `contactPhone`. The save handler serializes `taxInfo` from the flat data.
- **Load pattern:** Current `onMount` loads data and writes to `settings` + `taxData`. With superforms, `$effect` + `reset({ data: loadedData })` replaces this.

### User-Facing Settings Page (`/dashboard/settings/+page.svelte`)

- **Content:** Theme toggle buttons (light/dark/system via `mode-watcher`) and color palette hex inputs (via `paletteStore`).
- **No forms:** No `<form>` elements, no submit actions. Entirely button/input event driven.
- **Action:** Do NOT touch this page. Phase 1 color palette section is complete and must not be disrupted.

---

## Common Pitfalls

### Pitfall 1: TanStack table state won't update reactively
**What goes wrong:** `createTable` is called once; mutations to `sorting` or `data` don't re-render the table.
**Why it happens:** `@tanstack/table-core` is not natively reactive — it does not know about Svelte's reactivity system.
**How to avoid:** Wrap `createTable(...)` in `$derived(...)` so the entire table instance is recreated whenever any of its inputs (data, sorting, filter, pagination) change. This is the standard pattern when using `table-core` without a framework adapter.
**Warning signs:** Clicking column headers does nothing; new data doesn't appear after fetch.

### Pitfall 2: `zod4` adapter vs `zod` adapter
**What goes wrong:** Importing `zod` (v3 adapter) from `sveltekit-superforms/adapters` when zod v4 is installed.
**Why it happens:** Zod v4 changed its internal API. The v3 adapter breaks with zod 4.x.
**How to avoid:** Always use `import { zod4 } from 'sveltekit-superforms/adapters'` — exactly as in `customer-dialog.svelte`. The installed `zod` package is v4.3.6; `zod4` adapter is the correct match.
**Warning signs:** Schema validation errors at runtime, TypeScript type errors in `$form`.

### Pitfall 3: `$state` prop hydration warning in DataTableWrapper
**What goes wrong:** Compiler warning "did you mean to reference it inside a derived?" when destructuring `$props()` into `$state()`.
**Why it happens:** AI_RULES.md §3 explicitly documents this — destructuring `$props()` directly into `$state()` triggers a Svelte 5 hydration warning.
**How to avoid:** Use the intercept pattern: `let rawData = props.data; let data = $state(rawData)` — or avoid `$state` for prop-derived values entirely and use `$derived` from props.
**Warning signs:** Build warnings from `svelte-check`; props not updating when parent changes.

### Pitfall 4: `{@const}` outside of block context
**What goes wrong:** Compiler error when placing `{@const}` inside a `<div>` or other HTML element.
**Why it happens:** AI_RULES.md §3 — `{@const}` must be a direct child of `{#each}` or `{#if}`.
**How to avoid:** In DataTableWrapper, when rendering action cells that need a component variable, wrap in `{#each ... as row}` and place `{@const ActionCell = ...}` directly inside that each block.

### Pitfall 5: Wizard steps — superforms `onUpdate` fires on every `$form` assignment
**What goes wrong:** The `$effect` that syncs wizard state into `$form` triggers `onUpdate` unexpectedly.
**Why it happens:** Setting `$form = { ... }` programmatically can trigger the `onUpdate` callback depending on `superForm` config.
**How to avoid:** Use `reset({ data: ... })` (from superforms) instead of direct `$form = ...` assignment when loading initial values. Direct `$form = ...` is appropriate only for reactive sync in dialogs, not initial load.

### Pitfall 6: Pagination state reset on data change
**What goes wrong:** After a filter changes, the user stays on page 5 and sees an empty table.
**Why it happens:** `pagination.pageIndex` is not reset when `globalFilter` changes.
**How to avoid:** Add a `$effect(() => { pagination = { ...pagination, pageIndex: 0 }; })` that watches `globalFilter`.

---

## Code Examples

### DataTableWrapper — complete minimal skeleton

```typescript
// Source: @tanstack/table-core 8.21.3 API + AI_RULES.md Svelte 5 constraints
// src/lib/components/ui/DataTableWrapper.svelte
<script lang="ts" generics="TData">
  import {
    createTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    type ColumnDef,
    type SortingState,
    type PaginationState,
  } from '@tanstack/table-core';
  import * as Table from '$lib/components/ui/table';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { ArrowUpDown } from 'lucide-svelte';

  let {
    columns,
    data,
    pageSize = 20,
    loading = false,
    emptyMessage = 'No hay datos.',
    filterPlaceholder = 'Buscar...',
  } = $props<{
    columns: ColumnDef<TData>[];
    data: TData[];
    pageSize?: number;
    loading?: boolean;
    emptyMessage?: string;
    filterPlaceholder?: string;
  }>();

  let sorting = $state<SortingState>([]);
  let globalFilter = $state('');
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize });

  // Reset to page 0 when filter changes
  $effect(() => {
    if (globalFilter) {
      pagination = { ...pagination, pageIndex: 0 };
    }
  });

  let table = $derived(
    createTable<TData>({
      data,
      columns,
      state: { sorting, globalFilter, pagination },
      onSortingChange: (u) => { sorting = typeof u === 'function' ? u(sorting) : u; },
      onGlobalFilterChange: (u) => { globalFilter = typeof u === 'function' ? u(globalFilter) : u; },
      onPaginationChange: (u) => { pagination = typeof u === 'function' ? u(pagination) : u; },
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    })
  );
</script>
```

### Superforms — settings page schema (flattened)

```typescript
// src/routes/(app)/dashboard/admin/settings/+page.svelte
import { superForm, defaults } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const settingsSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  ownerName: z.string().optional().or(z.literal('')),
  dailyCapacityMinutes: z.number().min(1),
  rfc: z.string().optional().or(z.literal('')),
  regime: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
});

const { form, enhance, errors, reset } = superForm(defaults(zod4(settingsSchema)), {
  SPA: true,
  validators: zod4(settingsSchema),
  async onUpdate({ form }) {
    if (!form.valid) return;
    isSaving = true;
    try {
      const payload = {
        name: form.data.name,
        ownerName: form.data.ownerName || '',
        dailyCapacityMinutes: form.data.dailyCapacityMinutes,
        taxInfo: JSON.stringify({
          rfc: form.data.rfc,
          regime: form.data.regime,
          address: form.data.address,
          contactPhone: form.data.contactPhone,
        }),
      };
      await apiService.request(`${API_OPERATIONS}/establishment`, { method: 'PUT', body: JSON.stringify(payload) });
      toast.success('Configuración guardada exitosamente');
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar la configuración');
    } finally {
      isSaving = false;
    }
  }
});

// Load initial data — use reset() to populate form from API response
onMount(async () => {
  try {
    const data = await apiService.request<any>(`${API_OPERATIONS}/establishment`);
    if (data) {
      let taxData: any = {};
      try { taxData = data.taxInfo ? JSON.parse(data.taxInfo) : {}; } catch {}
      reset({ data: {
        name: data.name || '',
        ownerName: data.ownerName || '',
        dailyCapacityMinutes: data.dailyCapacityMinutes ?? 480,
        rfc: taxData.rfc || '',
        regime: taxData.regime || '',
        address: taxData.address || '',
        contactPhone: taxData.contactPhone || '',
      }});
    }
  } catch (e: any) {
    toast.error(e.message || 'Error al cargar la configuración');
  } finally {
    isLoading = false;
  }
});
```

### Superforms — schedule holiday form schema

```typescript
const holidaySchema = z.object({
  date: z.string().min(1, 'Selecciona una fecha'),
  description: z.string().min(1, 'La descripción es obligatoria'),
});

const { form: holidayForm, enhance: holidayEnhance, errors: holidayErrors, reset: resetHoliday }
  = superForm(defaults(zod4(holidaySchema)), {
    SPA: true,
    validators: zod4(holidaySchema),
    async onUpdate({ form }) {
      if (!form.valid) return;
      try {
        await apiService.request(`${API_OPERATIONS}/schedule/holidays`, {
          method: 'POST',
          body: JSON.stringify({ date: form.data.date, description: form.data.description }),
        });
        toast.success('Excepción agregada');
        resetHoliday();
        loadData();
      } catch (err: any) {
        toast.error(err.message || 'Error al agregar excepción');
      }
    }
  });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@tanstack/svelte-table` Svelte adapter | `@tanstack/table-core` with Svelte 5 `$derived` wrapper | TanStack v8 + Svelte 5 era | No framework-specific package; `createTable` wrapped in `$derived` |
| `zod` adapter (v3) | `zod4` adapter | Zod v4 release | Must import `zod4` from adapters, not `zod` |
| `superValidate(schema)` server-side | `superForm(defaults(adapter(schema)), { SPA: true })` client-only | Superforms v2 | No `+page.server.ts` needed for SPA forms |
| `writable()`/`readable()` stores | Svelte 5 `$state`, `$derived`, `$effect` | Svelte 5 | No legacy store reactivity; runes only |

**Deprecated/outdated:**
- `<svelte:component this={...}>`: AI_RULES.md explicitly forbids this. Use `{@const Comp = ...}` + `<Comp />`.
- Direct `writable()` stores for UI state: All pages in scope already use Svelte 5 runes.

---

## Open Questions

1. **Weekly schedule — superforms or leave as-is?**
   - What we know: `workDays` is an `any[]` array bound to multiple checkbox+time inputs per item. It is updated incrementally (one day at a time) and saved in bulk via a single PUT. Superforms supports array schemas.
   - What's unclear: QUAL-05 says "schedule page migrated" — it may mean the holiday *add* form specifically or the entire page including the weekly grid.
   - Recommendation: Migrate the holiday add form to superforms (clearly a form with submit). Treat the weekly schedule checkboxes as interactive configuration controls (not a traditional "form"), and leave them as bound `$state` — document this interpretation. The schedule page will then have superforms for its discrete form action and rune state for its configuration grid.

2. **DataTableWrapper — action cell snippet API**
   - What we know: Orders and customers pages have complex action cells (buttons with href, confirm dialogs). TanStack `ColumnDef` `cell` property accepts a renderer.
   - What's unclear: Best Svelte 5 snippet pattern for passing per-row action buttons into DataTableWrapper without losing type safety.
   - Recommendation: Accept a `{#snippet actionCell(row)}` prop on DataTableWrapper for the actions column. This is the Svelte 5 idiomatic approach for slot-like composition.

3. **Order sub-wizard (item-sub-wizard.svelte) — full migration scope**
   - What we know: Steps 0 and 1 are selection UIs (button grids). Step 2 has price/adj/duration numeric inputs. Step 3 has a notes textarea. The data is not "submitted" — it calls `props.onSave(item)` which updates wizard state.
   - What's unclear: Whether a non-submit "confirm" action qualifies as needing superforms validation. QUAL-05 says "order wizard steps."
   - Recommendation: Apply superforms to Steps 2+3 of the sub-wizard to validate that `price` is a valid non-negative number and `duration` is within range, using `onUpdate` to call `handleAddService()`. This satisfies the spirit of QUAL-05 (form inputs should have schema validation) without over-engineering the selection screens.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/component changes within the existing `anotame-web` SvelteKit app. All tools (Bun, Node, Vite, `bun run build`) are already verified by earlier phases.

---

## Validation Architecture

`nyquist_validation` is enabled (`true` in config.json). However, the REQUIREMENTS.md explicitly defers frontend testing to future milestones:

> TEST-03: Vitest + @testing-library/svelte setup for frontend (deferred)
> TEST-04: Frontend test coverage for auth guard, API service, and order wizard steps (deferred)

No test framework (Vitest, Jest) exists in `anotame-web` — there is no `vitest.config.*`, no `test/` directory, and no test scripts in `package.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — deferred to TEST-03/TEST-04 |
| Config file | None |
| Quick run command | `bun run check` (TypeScript + Svelte compiler check) |
| Full suite command | `bun run build` (full Vite build — exit 0 = no compilation errors) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QUAL-04 | `DataTableWrapper.svelte` exists and is imported by orders + customers pages | smoke (build) | `bun run build` | ❌ Wave 0 (file doesn't exist yet) |
| QUAL-04 | Table renders rows, sort toggles work | manual (visual) | n/a — no testing framework | n/a |
| QUAL-05 | All specified forms use `use:enhance` from superforms | smoke (build) | `bun run check && bun run build` | n/a |
| QUAL-05 | Form validation errors appear on bad input | manual (visual) | n/a — no testing framework | n/a |

### Sampling Rate
- **Per task commit:** `bun run check` (Svelte compiler + TypeScript)
- **Per wave merge:** `bun run build` (full Vite production build — exit 0 required per AI_RULES.md)
- **Phase gate:** `bun run build` exits 0 before `/gsd:verify-work`

### Wave 0 Gaps
- No test framework to install — testing is explicitly deferred per REQUIREMENTS.md (TEST-03/04).
- The build verification (`bun run build`) is the enforced quality gate per AI_RULES.md.

---

## Sources

### Primary (HIGH confidence)
- `anotame-web/package.json` — installed versions of all packages confirmed directly
- `node_modules/@tanstack/table-core/build/lib/core/table.d.ts` — `createTable` signature verified
- `node_modules/@tanstack/table-core/build/lib/index.d.ts` — all exported row model factories verified
- `node_modules/sveltekit-superforms/dist/adapters/zod4.d.ts` — `zod4` + `zodClient` adapter API verified
- `AI_RULES.md` — all mandatory frontend patterns read directly from project file
- All 6 `src/routes/(app)/dashboard/` pages read directly — current implementation state documented with certainty
- All 4 wizard step components read directly
- `customer-dialog.svelte`, `service-dialog.svelte` — canonical superforms reference patterns read directly

### Secondary (MEDIUM confidence)
- TanStack Table v8 documentation pattern: `createTable` + `$derived` for framework-agnostic reactivity — consistent with installed API surface

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from `node_modules`, versions exact
- Architecture: HIGH — all current page implementations read directly; patterns verified from working `customer-dialog.svelte`
- Pitfalls: HIGH — derived from AI_RULES.md directives (compiler rules), direct code inspection, and known TanStack reactivity model
- Open questions: MEDIUM — interpretation of QUAL-05 scope for sub-wizard and schedule weekly section

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable packages; Svelte 5 + TanStack v8 not in rapid churn)
