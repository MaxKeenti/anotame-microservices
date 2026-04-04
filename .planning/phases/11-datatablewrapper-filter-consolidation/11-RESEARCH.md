# Phase 11: DataTableWrapper Filter Consolidation - Research

**Researched:** 2026-04-04
**Domain:** Frontend UI component configuration, conditional rendering patterns, design tokens
**Confidence:** HIGH

## Summary

DataTableWrapper is a wrapper around @tanstack/table-core used consistently across 7 management pages. Currently, it renders its built-in search filter unconditionally, causing duplicate filter UIs on pages with custom server-side search (Customers, Orders). This phase adds conditional filter visibility via a `showFilter` prop (default: true) and includes a visual divider between filter and table areas. The changes are backward compatible—existing pages keep the built-in filter unless they explicitly opt out. Implementation requires modifying one component file and updating two page files to hide the wrapper's filter and use their own.

**Primary recommendation:** Add `showFilter` prop to DataTableWrapper (default: true), wrap the filter input and divider in a conditional block, use `--border` CSS variable for the divider, and update only customers and orders pages to pass `showFilter={false}`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Filter Visibility Control**
- Add optional `showFilter` prop to DataTableWrapper (default: true)
  - `showFilter={true}` renders the built-in search input (existing behavior)
  - `showFilter={false}` hides the search input entirely
  - Backward compatible — existing pages keep built-in filter unless they explicitly opt out

**Pages Affected & Filter Strategy**
- Pages receiving custom filters: **Customers** and **Orders** only
  - Customers page keeps its existing `handleSearch()` form (no duplication)
  - Orders page likewise keeps any custom filter form it has
  - Both will pass `showFilter={false}` to DataTableWrapper
- All other pages (Garments, Services, Price Lists, Users, Schedule, etc.) use DataTableWrapper's built-in filter unchanged

**External Filtering Pattern**
- Pages manage filtering independently (externally from DataTableWrapper)
  - Pages that need custom filters implement their own filter logic and API calls
  - DataTableWrapper receives fully filtered data and applies no additional server-side filtering
  - DataTableWrapper's `globalFilter` state still applies client-side filtering if `showFilter={true}`
  - This keeps concerns separated: page handles API logic, DataTableWrapper handles UI/pagination/sorting

**Visual Separator**
- Add a horizontal divider inside DataTableWrapper between the filter area and table content
  - Implemented as a `<hr>` or `<div class="border-t">` element in the wrapper's JSX
  - Always present (regardless of whether filter is shown or hidden)
  - Clarifies the boundary between filter controls and table display
  - Uses the design system's border color (--border CSS variable from shadcn preset)

### Claude's Discretion

- Exact divider styling (thickness, color, spacing) — use design tokens from Phase 10 preset
- Whether to wrap the divider in a padding container for visual breathing room
- Order of elements when `showFilter={false}` (divider presence/placement)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TABLE-01 | User sees exactly one set of filters per data table page — no duplicate filter bars | Implementation pattern: Conditional `showFilter` prop prevents duplication on Customers and Orders pages while preserving default behavior on other 5 pages |
| TABLE-02 | User can pass page-specific filter configurations to DataTableWrapper via props | Implementation: `showFilter` prop added to DataTableWrapper type signature, enabling pages to control filter visibility |
| TABLE-03 | User sees visual separation (divider or spacing) between the filter area and the data table content | Implementation: Horizontal divider (`<hr>` or `border-t` div) added inside wrapper, using `--border` design token for consistent styling |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | 5.51.0 | Frontend framework with reactive statements | Reactive model ($state, $derived, $effect) enables conditional rendering and prop-driven behavior |
| @tanstack/table-core | 8.21.3 | Headless table logic | Manages sorting, pagination, globalFilter state — DataTableWrapper wraps this core |
| Tailwind CSS | 4.1.18 | Utility CSS framework | Design tokens and border styling via `@tailwindcss/vite` |
| shadcn-svelte | 1.2.7 | Component library | Input and Button components already used in DataTableWrapper |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bits-ui | 2.16.3 | Headless UI primitives | Underlying library for shadcn-svelte components |
| mode-watcher | 1.1.0 | Theme switching | Enables dark mode CSS variable overrides |

## Architecture Patterns

### Recommended Project Structure

DataTableWrapper is a single-file component at:
```
anotame-web/
└── src/lib/components/ui/
    └── DataTableWrapper.svelte  # ← Primary change point
```

Pages that use it are scattered across dashboard routes but follow the same pattern.

### Pattern 1: Conditional Prop-Based Rendering

**What:** Components accept a boolean prop to control visibility of internal UI sections.

**When to use:** When a parent component provides its own version of a feature that a child component also provides, and you need backward compatibility without breaking existing consumers.

**Example:**
```svelte
<script lang="ts" generics="TData">
  type Props = {
    showFilter?: boolean;  // NEW: Add this prop
    // ... existing props
  };

  let {
    showFilter = true,  // NEW: Default to true for backward compatibility
    // ... existing destructuring
  }: Props = $props();
</script>

<!-- NEW: Wrap filter input in conditional -->
{#if showFilter}
  <div>
    <label for="dt-filter" class="sr-only text-sm font-medium">Buscar</label>
    <Input
      id="dt-filter"
      placeholder={filterPlaceholder}
      bind:value={globalFilter}
      class="h-12 touch-manipulation"
    />
  </div>
{/if}

<!-- NEW: Add divider (always present, regardless of filter visibility) -->
<div class="border-t border-border my-3"></div>

<!-- Existing table code -->
```

**Why this pattern:** Svelte 5's `{#if}` blocks are performant for conditional rendering. The prop default value ensures existing code (7 pages) works unchanged.

### Pattern 2: Design Token Integration for Dividers

**What:** Use CSS custom properties (--border, --muted) from layout.css to style visual separators.

**When to use:** When dividers need to respect theme switching (light/dark mode) and maintain consistency with the design system.

**Example:**
```svelte
<!-- Light divider using border token -->
<div class="border-t border-border my-3"></div>

<!-- Alternative: Using CSS variables directly if more control needed -->
<div class="h-px bg-[var(--border)] my-3"></div>

<!-- With muted styling for subtle look -->
<div class="border-t border-border/50 my-3"></div>
```

**Why this pattern:**
- `--border` token adapts to light/dark mode automatically (light: oklch(0.922 0.005 34.3), dark: oklch(1 0 0 / 10%))
- Tailwind's `border-border` class applies the token reliably
- Consistent with existing border styling in the app (all elements use `@apply border-border`)

### Pattern 3: Page-Level Filter Management

**What:** Pages with custom filters implement their own search/filter forms completely separate from DataTableWrapper, passing already-filtered data to the wrapper.

**When to use:** When a page has API-driven search, multiple filter dimensions, or needs real-time server queries.

**Example (Customers page):**
```svelte
<!-- Page's own search form (lines 90-99 of customers/+page.svelte) -->
<form onsubmit={handleSearch} class="flex-1 flex gap-2">
  <Input placeholder="Buscar clientes..." bind:value={searchQuery} />
  <Button type="submit" variant="secondary">Buscar</Button>
</form>

<!-- DataTableWrapper receives pre-filtered data, filter hidden -->
<DataTableWrapper
  columns={columns}
  data={customers}  <!-- Already filtered by handleSearch() -->
  showFilter={false}  <!-- NEW: Hide wrapper's filter -->
  loading={loading}
/>
```

**Why this pattern:**
- Separation of concerns: page handles API logic, wrapper handles UI
- No double-filtering: customers data is filtered at API level, not client-side
- Orders page follows same pattern with multiple filter dimensions (search + garment + date)

### Anti-Patterns to Avoid

- **Don't:** Implement both page filter AND wrapper filter simultaneously — this creates duplicate UX and confuses users about which filter is active
- **Don't:** Pass `showFilter={false}` to pages that don't have custom filters — they already work well with the built-in client-side filter
- **Don't:** Add server-side filtering logic inside DataTableWrapper — keep the wrapper purely UI/pagination/sorting focused; let pages handle business logic

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Should I make the divider a custom component?" | Custom `<Divider />` component | Plain `<div class="border-t border-border">` or `<hr>` | Dividers are trivial styling; components add unnecessary indirection and cognitive load |
| "Should I create a custom hook for filter visibility state?" | Custom `useFilterVisibility()` hook | Prop passed from parent page | Svelte doesn't use hooks; component props are the idiomatic way to pass behavior config |
| "Should pages store filter state in a global store?" | Global filter state store | Local page state (`let searchQuery`) + DataTableWrapper's internal `globalFilter` | Global state introduces coupling; page-level state is simple and sufficient |

**Key insight:** Conditional rendering and prop defaults are simpler and more maintainable than custom components or state management for this use case.

## Common Pitfalls

### Pitfall 1: Forgetting Backward Compatibility

**What goes wrong:** Adding a `showFilter` prop without a default value means all 7 existing pages must pass it explicitly, breaking compilation.

**Why it happens:** Developer forgets that props without defaults are required in Svelte.

**How to avoid:** Always provide a default value matching current behavior (`showFilter = true`). Test by building the project without modifying any pages—it should pass.

**Warning signs:** TypeScript errors on pages using DataTableWrapper without the new prop; or runtime "undefined prop" errors.

### Pitfall 2: Filter Hidden But Divider Still Visible (Awkward UX)

**What goes wrong:** When `showFilter={false}`, the divider appears at the top of the wrapper with nothing above it, looking disconnected and confusing.

**Why it happens:** Divider is unconditionally rendered outside the `{#if showFilter}` block.

**How to avoid:** Test all 7 pages in both light and dark modes. On Customers and Orders (with `showFilter={false}`), verify the divider placement makes sense—either:
  - Move the divider inside the `{#if showFilter}` block (divider only appears with filter), OR
  - Keep divider outside but position it below the table instead of above, OR
  - Conditionally render divider: `{#if showFilter}` (matches locked decision D-05 which says "always present" but needs clarification)

**Warning signs:** Visual inspection of Customers/Orders pages showing divider with nothing above it.

### Pitfall 3: Pages Passing Both Custom Filter AND `showFilter={true}`

**What goes wrong:** A page implements its own filter form and mistakenly leaves `showFilter={true}`, resulting in duplicate search inputs (the very thing this phase fixes).

**Why it happens:** Developer assumes the default is fine or forgets to opt out when adding page-level filters.

**How to avoid:** Code review requirement: whenever a page adds a custom search form, it MUST pass `showFilter={false}`. Document this in a comment in the wrapper or in the page templates.

**Warning signs:** Visual inspection: two search bars on the same page; user confusion about which filter is active.

### Pitfall 4: Assuming `globalFilter` Works On Custom-Filtered Data

**What goes wrong:** Customers page passes `showFilter={false}` and implements API-based search, but someone later adds client-side text search to the results via the wrapper's `globalFilter` state, causing confusion.

**Why it happens:** Developer doesn't realize that when `showFilter={false}`, the wrapper's filter input is hidden but `globalFilter` state still exists and still filters the data.

**How to avoid:** When `showFilter={false}`, the component is essentially read-only regarding filtering—all filtering happens at the page level before data reaches the wrapper. Document this intent clearly.

**Warning signs:** Unexpected second layer of filtering appearing on results; confusing UX where some results are hidden for reasons not visible in the UI.

## Code Examples

Verified patterns from official sources and codebase:

### Adding the showFilter Prop to DataTableWrapper

```svelte
<!-- Source: anotame-web/src/lib/components/ui/DataTableWrapper.svelte -->
<script lang="ts" generics="TData">
  import { untrack } from 'svelte';
  import {
    createTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    type ColumnDef,
    type SortingState,
    type PaginationState,
    type ColumnPinningState,
    type Row,
  } from '@tanstack/table-core';
  import * as Table from '$lib/components/ui/table';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';

  type Props = {
    columns: ColumnDef<TData>[];
    data: TData[];
    pageSize?: number;
    loading?: boolean;
    emptyMessage?: string;
    filterPlaceholder?: string;
    showFilter?: boolean;  // NEW: Add this prop
    actionCell?: import('svelte').Snippet<[Row<TData>]>;
    cellRenders?: Record<string, import('svelte').Snippet<[Row<TData>]>>;
  };

  let {
    columns,
    data,
    pageSize: pageSizeProp = 20,
    loading = false,
    emptyMessage = 'No hay datos.',
    filterPlaceholder = 'Buscar...',
    showFilter = true,  // NEW: Default to true for backward compatibility
    actionCell,
    cellRenders = {},
  }: Props = $props();

  // ... rest of script unchanged
</script>

<div class="space-y-3">
  <!-- Search input — conditional on showFilter prop -->
  {#if showFilter}
    <div>
      <label for="dt-filter" class="sr-only text-sm font-medium">Buscar</label>
      <Input
        id="dt-filter"
        placeholder={filterPlaceholder}
        bind:value={globalFilter}
        class="h-12 touch-manipulation"
      />
    </div>
  {/if}

  <!-- Visual divider between filter and table -->
  <div class="border-t border-border"></div>

  <!-- Table code unchanged -->
  <div class="overflow-x-auto">
    <!-- ... existing table structure ... -->
  </div>

  <!-- Pagination unchanged -->
</div>
```

**Why this works:**
- `showFilter = true` default ensures all 7 existing pages work unchanged
- `{#if showFilter}` blocks the entire filter input section when false
- Divider uses `--border` token for theme consistency
- Rest of wrapper logic (sorting, pagination, globalFilter state) untouched

### Customers Page: Using showFilter={false}

```svelte
<!-- Source: anotame-web/src/routes/(app)/dashboard/customers/+page.svelte (existing code) -->
<script lang="ts">
  // Lines 29-49: fetchCustomers() makes API call with query parameter
  // Lines 90-99: Custom search form with handleSearch() handler

  async function fetchCustomers(query: string = '') {
    loading = true;
    try {
      const q = query ? `?query=${query}` : '';
      const response = await apiService.request<any[]>(`${API_SALES}/api/customers/search${q}`);
      customers = response || [];
    } catch {
      customers = [];
    } finally {
      loading = false;
    }
  }

  function handleSearch(e: Event) {
    e.preventDefault();
    fetchCustomers(searchQuery);  // Page controls filtering via API
  }
</script>

<!-- Keep existing custom search form -->
<div class="flex gap-2">
  <form onsubmit={handleSearch} class="flex-1 flex gap-2">
    <Input
      placeholder="Buscar clientes..."
      bind:value={searchQuery}
      class="max-w-md h-12"
    />
    <Button type="submit" variant="secondary" class="h-12 px-6">Buscar</Button>
  </form>
</div>

<!-- Update DataTableWrapper: add showFilter={false} -->
<DataTableWrapper
  columns={columns}
  data={customers}
  loading={loading}
  emptyMessage="No se encontraron clientes."
  filterPlaceholder="Filtrar clientes..."
  showFilter={false}  <!-- NEW: Hide wrapper's built-in filter -->
>
  {#snippet actionCell(row)}
    <!-- Actions unchanged -->
  {/snippet}
</DataTableWrapper>
```

**Why this works:**
- Page API call already filters results → no need for wrapper's client-side filter
- `showFilter={false}` hides the wrapper's search input entirely
- User sees only one search bar (the page's custom one) — requirement TABLE-01 satisfied
- Divider still appears, separating filter from table — requirement TABLE-03 satisfied

### Orders Page: Multiple Custom Filters

```svelte
<!-- Source: anotame-web/src/routes/(app)/dashboard/orders/+page.svelte (existing code) -->
<!-- Lines 81-110: Custom filter logic via $derived.by() -->

let filteredOrders = $derived.by(() => {
  return orders.filter(order => {
    // Search by ticket number or customer name
    const query = searchQuery.toLowerCase();
    const matchesSearch = /* ... */;
    if (!matchesSearch) return false;

    // Filter by garment
    if (garmentFilter) { /* ... */ }

    // Filter by delivery date
    if (dateFilter) { /* ... */ }

    return true;
  });
});
</script>

<!-- Keep existing custom filters above table -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-card border border-border rounded-xl shadow-sm">
  <div class="col-span-1 md:col-span-2">
    <label for="search-orders">Buscar</label>
    <Input
      id="search-orders"
      placeholder="Ticket, Nombre del Cliente..."
      bind:value={searchQuery}
    />
  </div>
  <div>
    <label for="filter-garment">Filtrar por Prenda</label>
    <AdaptiveSelect
      id="filter-garment"
      bind:value={garmentFilter}
      items={garments.map(g => ({ value: g.id, label: g.name }))}
      allowClear={true}
    />
  </div>
  <div>
    <label for="filter-date">Fecha de Entrega</label>
    <AdaptiveDatePicker
      id="filter-date"
      bind:value={dateFilter}
    />
  </div>
</div>

<!-- Update DataTableWrapper: pass pre-filtered data and hide wrapper's filter -->
<DataTableWrapper
  columns={activeColumns}
  data={filteredOrders}  <!-- Already filtered by $derived logic -->
  loading={loading}
  emptyMessage="No se encontraron pedidos."
  filterPlaceholder="Buscar pedidos..."
  showFilter={false}  <!-- NEW: Hide wrapper's built-in filter -->
>
  {#snippet actionCell(row)}
    <!-- Actions unchanged -->
  {/snippet}
</DataTableWrapper>
```

**Why this works:**
- Orders page uses three separate filters (search, garment, date) via $derived
- Filtered data passed to wrapper — wrapper applies no additional filtering
- `showFilter={false}` prevents wrapper's search from interfering
- Result: Single filter UI with all three dimensions, no duplication

### Garments Page: Using Default showFilter={true}

```svelte
<!-- Source: anotame-web/src/routes/(app)/dashboard/catalog/garments/+page.svelte -->
<!-- No custom filters — relies entirely on wrapper's client-side filter -->

<DataTableWrapper
  {columns}
  data={garments}
  {loading}
  emptyMessage="No se encontraron prendas."
  filterPlaceholder="Buscar prendas..."
  <!-- showFilter prop NOT specified — defaults to true -->
>
  {#snippet actionCell(row)}
    <!-- Actions unchanged -->
  {/snippet}
</DataTableWrapper>
```

**Why this works:**
- Garments page has no custom search logic
- Wrapper's default `showFilter={true}` renders the built-in search
- User can type to search garments by name client-side
- Simple, backward compatible, no changes needed to page

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Every page implements its own table component | Centralized DataTableWrapper with configurable behavior | Phase 9 (DataTableWrapper Pattern Completion) | Consistency across UI, easier maintenance |
| Duplicate filter UIs on API-driven pages | Conditional `showFilter` prop hides built-in filter when page provides custom filters | This phase (11) | Eliminates confusion, cleaner UX |
| Filter styling scattered across pages | Divider uses `--border` design token from Phase 10 preset | This phase (11) | Consistency with design system, theme-aware |

**Deprecated/outdated:**
- None — this phase doesn't deprecate anything, just adds opt-out functionality

## State of Testing Infrastructure

No existing test framework is installed or configured in the project. The frontend `package.json` has no vitest, jest, or testing library dependencies.

**Wave 0 gaps:**
- Test framework (vitest or jest) not installed — would need `npm install` or setup during Wave 0 if testing is required
- No test files exist for DataTableWrapper or page components
- No existing test configuration files (vitest.config.ts, jest.config.js)

**This phase's testing scope:**
- Phase requirements are primarily visual/behavior: filter visibility, divider presence, no duplication
- Testing could be manual visual verification across all 7 pages in light/dark modes
- Automated testing would require component test setup (beyond scope of this phase)

## Environment Availability

**Step 2.6: SKIPPED** — This phase requires no external dependencies beyond the existing development environment (Svelte compiler, Tailwind, TypeScript). All changes are to JavaScript/Svelte code and CSS class names already available in the design system. No new tools, CLIs, databases, or services are needed.

## Open Questions

1. **Divider Placement When `showFilter={false}`**
   - LOCKED DECISION D-05 says divider is "always present" but context also says it's between filter and table
   - Interpretation A: Divider always renders, even when filter hidden (divider appears at top with nothing above)
   - Interpretation B: Divider renders only when filter is shown (divider only appears on non-custom-filter pages)
   - Recommendation: Use Interpretation A per locked decision D-05 — divider always renders, clarifies table boundary even without visible filter. If awkward, can adjust after visual review.

2. **Divider Spacing and Styling Details**
   - Claude's Discretion allows flexibility on padding/margins
   - Recommendation: Use `my-3` (matches existing `space-y-3` in wrapper) for consistent spacing; test in both themes to ensure sufficient visual separation

3. **Touch Target Size for Filter Input When Shown**
   - Existing DataTableWrapper filter already uses `h-12 touch-manipulation` — this is maintained
   - No change needed; confirms accessibility consideration is already in place

## Validation Architecture

| Property | Value |
|----------|-------|
| Framework | None currently installed — manual visual verification required |
| Config file | None — no test framework configured |
| Quick run command | Manual: Navigate to each of 7 data table pages in dev environment, inspect for duplicate filters, divider visibility |
| Full suite command | Manual: 7 pages × 2 themes (light/dark) = 14 visual checks; build verification (`bun run build` must pass) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification Method | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TABLE-01 | No duplicate filter bars on any page | Manual visual | Navigate all 7 pages, verify only one filter input per page | N/A (visual) |
| TABLE-02 | DataTableWrapper accepts `showFilter` prop | Build test | Run `bun run build` — must compile without errors on all pages | N/A (build-time) |
| TABLE-03 | Divider visible between filter and table | Manual visual | On all 7 pages, verify divider is present and styled with `--border` token | N/A (visual) |

### Wave 0 Gaps

- [ ] No automated test framework — if required, Wave 0 must install vitest or jest
- [ ] No component tests for DataTableWrapper or pages — if testing is required, test files must be created
- [ ] Build verification: `bun run build` must pass zero errors (this will catch TypeScript errors in all pages due to new prop)

*(If no testing required beyond build verification: "Wave 0 focus is implementation + visual verification across all 7 pages in light/dark modes. Build must pass without errors.")*

## Sources

### Primary (HIGH confidence)
- **DataTableWrapper source code** — Direct inspection of current implementation at `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` (lines 1-201)
- **Svelte 5 language features** — Component props, reactive statements ($state, $derived, {#if} blocks) are core language features documented in official Svelte 5 docs
- **Phase 10 CONTEXT.md** — Design token decisions confirmed as locked (--border token available and in use)
- **Customers/Orders/Garments page source code** — Direct inspection confirming filter patterns and current usage of DataTableWrapper

### Secondary (MEDIUM confidence)
- **@tanstack/table-core v8.21.3 API** — Version verified in package.json; globalFilter state is documented in official @tanstack/table docs
- **Tailwind CSS v4.1.18 border utilities** — `border-t`, `border-border` classes verified in official Tailwind and shadcn-svelte docs
- **Design token system** — layout.css verified to contain --border token with oklch values for light and dark modes

### Tertiary (information-only)
- **Common pitfalls** — Derived from pattern analysis of the codebase and typical SPA filter UX issues; not from external sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All library versions and APIs verified against source code and installed packages
- Architecture: HIGH — Current implementation inspected directly; locked decisions from CONTEXT.md provide clear direction
- Pitfalls: MEDIUM-HIGH — Pattern analysis from codebase + common UX mistakes; not from external sources but grounded in the specific code reviewed
- Divider styling: MEDIUM — Design tokens confirmed in layout.css, but exact spacing/padding is Claude's Discretion; can be refined after visual review

**Research date:** 2026-04-04
**Valid until:** 30 days (component config and design tokens are stable; Svelte and Tailwind are mature libraries)

---

*Phase: 11-datatablewrapper-filter-consolidation*
*Research completed: 2026-04-04*
*Ready for planning.*
