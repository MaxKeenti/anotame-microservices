# Phase 11: DataTableWrapper Filter Consolidation - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate duplicate filter UIs across data table pages by making DataTableWrapper's built-in search filter conditionally visible. Pages with custom search logic (customers, orders) will hide the built-in filter and manage their own. Pages using only client-side filtering will keep DataTableWrapper's search. Add visual separation between filter and table areas to clarify control hierarchy.

</domain>

<decisions>
## Implementation Decisions

### Filter Visibility Control
- **D-01:** Add optional `showFilter` prop to DataTableWrapper (default: true)
  - `showFilter={true}` renders the built-in search input (existing behavior)
  - `showFilter={false}` hides the search input entirely
  - Backward compatible — existing pages keep built-in filter unless they explicitly opt out

### Pages Affected & Filter Strategy
- **D-02:** Pages receiving custom filters: **Customers** and **Orders** only
  - These pages have server-side API search (e.g., `/api/customers/search?query=`)
  - They will pass `showFilter={false}` to DataTableWrapper
  - Customers page keeps its existing `handleSearch()` form (no duplication)
  - Orders page likewise keeps any custom filter form it has

- **D-03:** All other pages (Garments, Services, Price Lists, Users, Schedule, etc.) use DataTableWrapper's built-in filter unchanged
  - These pages do not require custom server-side search
  - They benefit from DataTableWrapper's client-side global filter for local filtering

### External Filtering Pattern
- **D-04:** Pages manage filtering independently (externally from DataTableWrapper)
  - Pages that need custom filters (customers, orders) implement their own filter logic and API calls
  - DataTableWrapper receives fully filtered data and applies no additional server-side filtering
  - DataTableWrapper's `globalFilter` state still applies client-side filtering if `showFilter={true}`
  - This keeps concerns separated: page handles API logic, DataTableWrapper handles UI/pagination/sorting

### Visual Separator
- **D-05:** Add a horizontal divider inside DataTableWrapper between the filter area and table content
  - Implemented as a `<hr>` or `<div class="border-t">` element in the wrapper's JSX
  - Always present (regardless of whether filter is shown or hidden)
  - Clarifies the boundary between filter controls and table display
  - Uses the design system's border color (--border CSS variable from shadcn preset)

### Claude's Discretion
- Exact divider styling (thickness, color, spacing) — use design tokens from Phase 10 preset
- Whether to wrap the divider in a padding container for visual breathing room
- Order of elements when `showFilter={false}` (divider presence/placement)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### DataTableWrapper & Filtering
- `anotame-web/src/lib/components/ui/DataTableWrapper.svelte` — Current implementation; needs `showFilter` prop addition and divider insertion
- `anotame-web/src/routes/(app)/dashboard/customers/+page.svelte` — Example page with custom server-side search; will pass `showFilter={false}`

### Design System & Styling
- `anotame-web/src/routes/layout.css` — CSS variables (--border, --muted, etc.) for divider styling; preset tokens from Phase 10
- `.planning/phases/10-shadcn-preset-init-design-token-refresh/10-CONTEXT.md` — Phase 10 decisions on design token preservation and component regeneration

### Related Requirements
- `.planning/REQUIREMENTS.md` — TABLE-01 (no duplicate filters), TABLE-02 (DataTableWrapper accepts filter config), TABLE-03 (visual separation between filter and table)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTableWrapper.svelte` — Existing wrapper around @tanstack/table-core; all 6 management pages use it
- `customers/+page.svelte` — Template for pages with custom filters (has `handleSearch()` form); can serve as reference
- `garments/+page.svelte` — Template for pages using built-in filter only (no custom form)

### Established Patterns
- **Custom Filter Pattern (customers):** Page state (`let searchQuery`), `handleSearch()` event handler, separate `<form>` with API call to `apiService.request()`, data binding to DataTableWrapper
- **Built-in Filter Pattern (garments):** DataTableWrapper receives full data load, `globalFilter` prop drives client-side filtering
- **DataTableWrapper Integration:** All pages wrap data in `<DataTableWrapper {columns} data={data} />` with optional `actionCell` snippet
- **Design System:** Tailwind v4 via `@tailwindcss/vite`, CSS variables in layout.css, oklch color space

### Integration Points
- DataTableWrapper is imported in 6+ management page files
- All pages pass `data`, `columns`, optional slots, and layout props
- No pages currently pass a filter-related prop (this is new)

</code_context>

<specifics>
## Specific Ideas

- The customers page search form (lines 90-99) is a good reference for what "custom filter" looks like — submit handler + API call + data refresh
- Divider should be subtle but visible — use --border token with appropriate contrast per Phase 10 preset decisions
- The user expects fast, smooth search UX on pages with custom filters (orders, customers) and simple client-side filtering on catalog/admin pages

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-datatablewrapper-filter-consolidation*
*Context gathered: 2026-04-04*
