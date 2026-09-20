# Responsive Data Grids

Data management pages render a single `ResponsiveDataView` from `$lib/components/common`. It owns the
breakpoint (`useIsMobile()`) and one TanStack table state, then delegates presentation to
`data-table-view.svelte` on desktop or `data-card-view.svelte` on mobile. Column `meta.cardGroup`
values decide whether fields appear in the mobile card header, body, or remain hidden.

This supersedes the earlier pair of sibling wrappers (`DataTableWrapper` / `CardGridWrapper`), which
required every page to write the same `{#if mobile.current}` branch and pass an identical prop list
twice. Because each wrapper built its own table state, crossing the breakpoint also discarded the
reader's search, sort, page, and selection; a single owned state fixes that.

**Consequences:** Pages define columns once, provide `cardGroup` metadata for mobile priority, and
pass `actionCell` / `cellRenders` snippets that both presentations render. Pages must not branch on
the viewport to choose a presentation — that decision lives in `ResponsiveDataView`. Page size is a
component concern (`pageSize` / `mobilePageSize`); pages only pass it explicitly when
`manualPagination` makes the server fetch depend on the same number. Do not force desktop TanStack
table markup to behave like mobile cards.
