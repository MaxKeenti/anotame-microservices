<script lang="ts" generics="TData">
  import { untrack } from 'svelte';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import { tablePreferences } from '$lib/stores/table-preferences.svelte';
  import {
    createResponsiveTable,
    getColumnId,
    getColumnHeader,
    type ResponsiveTableProps,
  } from './responsive-table.svelte';
  import DataTableView from './data-table-view.svelte';
  import DataCardView from './data-card-view.svelte';
  import DataTableViewOptions from './data-table-view-options.svelte';
  import SimplePager from './simple-pager.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { ChevronDown, ChevronUp } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages';

  /**
   * A single dataset rendered as a desktop table or a mobile card list.
   *
   * Sorting, filtering, pagination and selection live here rather than in either
   * presentation, so crossing the breakpoint keeps the reader's place instead of
   * resetting it, and callers pass their props exactly once.
   */
  type Props<TData> = ResponsiveTableProps<TData> & {
    /** Rows per page while the card presentation is active. */
    mobilePageSize?: number;
  };

  let {
    columns,
    data,
    pageSize: pageSizeProp = 20,
    mobilePageSize = 12,
    loading = false,
    emptyMessage,
    filterPlaceholder,
    showFilter = true,
    showPagination = true,
    showColumnToggle = true,
    actionCell,
    cellRenders = {},
    bulkActions = false,
    bulkMode = $bindable(false),
    onSelectionChange,
    manualPagination = false,
    pageIndex = 0,
    pageCount,
    onPageChange,
  }: Props<TData> = $props();

  const mobile = useIsMobile();

  let resolvedEmptyMessage = $derived(emptyMessage ?? m['common.noData']());
  let resolvedFilterPlaceholder = $derived(filterPlaceholder ?? m['common.searchEllipsis']());
  let effectivePageSize = $derived(mobile.current ? mobilePageSize : pageSizeProp);

  const state = createResponsiveTable<TData>({
    columns: () => columns,
    data: () => data,
    pageSize: () => effectivePageSize,
    // Intercept pattern — avoid hydration warning from $props directly into $state
    initialPageSize: untrack(() => tablePreferences.pageSize),
    bulkActions: () => bulkActions,
    bulkMode: () => bulkMode,
    manualPagination: () => manualPagination,
    pageIndex: () => pageIndex,
    pageCount: () => pageCount,
    enableColumnPinning: true,
    onPageChange: () => onPageChange,
    onSelectionChange: () => onSelectionChange,
  });

  /** Clear the row selection from the outside, e.g. a "clear selection" button. */
  export function clearSelection() {
    state.clearSelection();
  }

  // The card presentation has no column headers to click, so it needs an explicit
  // sort control. The desktop table sorts through its headers instead.
  let sortableColumns = $derived(
    columns.filter(
      (c) =>
        c.enableSorting !== false && getColumnId(c) !== '__select__' && getColumnId(c) !== 'actions'
    )
  );
  let currentSortId = $derived(state.sorting[0]?.id ?? '');
  let currentSortDesc = $derived(state.sorting[0]?.desc ?? false);
  // Columns that declare `meta.filterOptions` get a select in the toolbar.
  let filterableColumns = $derived(columns.filter((c) => c.meta?.filterOptions?.length));

  let sortItems = $derived(
    sortableColumns.map((col) => ({ value: getColumnId(col), label: getColumnHeader(col) }))
  );
</script>

<div class="space-y-4">
  <!-- Toolbar -->
  {#if showFilter || filterableColumns.length > 0 || (mobile.current ? sortableColumns.length > 0 : showColumnToggle)}
    <div class="flex flex-col sm:flex-row gap-3">
      {#if showFilter}
        <div class="flex-1">
          <label for="rdv-filter" class="sr-only">{m['common.search']()}</label>
          <Input
            id="rdv-filter"
            placeholder={resolvedFilterPlaceholder}
            bind:value={state.globalFilter}
            class="h-12 touch-manipulation"
          />
        </div>
      {/if}

      {#each filterableColumns as col (getColumnId(col))}
        {@const colId = getColumnId(col)}
        <div class="shrink-0">
          <AdaptiveSelect
            value={state.getColumnFilter(colId)}
            onValueChange={(v) => state.setColumnFilter(colId, v)}
            placeholder={getColumnHeader(col)}
            ariaLabel={getColumnHeader(col)}
            items={col.meta?.filterOptions ?? []}
            allowClear
            clearText={m['common.allOption']()}
            class="min-w-40 h-12 text-sm"
          />
        </div>
      {/each}

      {#if !mobile.current && showColumnToggle}
        <DataTableViewOptions table={state.table} />
      {/if}

      {#if mobile.current && sortableColumns.length > 0}
        <div class="flex items-center gap-2 shrink-0">
          <AdaptiveSelect
            value={currentSortId}
            onValueChange={(id) => {
              state.sorting = id ? [{ id, desc: currentSortDesc }] : [];
            }}
            placeholder={m['cardGrid.sortBy']()}
            ariaLabel={m['cardGrid.sortByLabel']()}
            items={sortItems}
            class="min-w-40 text-sm"
          />
          {#if currentSortId}
            <Button
              variant="outline"
              size="touch-lg"
              class="w-12 p-0"
              aria-label={currentSortDesc ? m['cardGrid.sortAscending']() : m['cardGrid.sortDescending']()}
              onclick={() => {
                if (state.sorting[0]) {
                  state.sorting = [{ id: state.sorting[0].id, desc: !state.sorting[0].desc }];
                }
              }}
            >
              {#if currentSortDesc}
                <ChevronDown class="w-4 h-4" />
              {:else}
                <ChevronUp class="w-4 h-4" />
              {/if}
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <div class="border-t border-border"></div>

  <!-- Presentation -->
  {#if mobile.current}
    <DataCardView
      {state}
      {columns}
      {loading}
      {cellRenders}
      {actionCell}
      {bulkActions}
      {bulkMode}
      emptyMessage={resolvedEmptyMessage}
    />
  {:else}
    <DataTableView
      {state}
      {loading}
      {cellRenders}
      {actionCell}
      emptyMessage={resolvedEmptyMessage}
    />
  {/if}

  <!-- Pagination -->
  {#if showPagination}
    <SimplePager
      pageIndex={state.table.getState().pagination.pageIndex}
      pageCount={state.table.getPageCount()}
      onPrevious={() => state.table.previousPage()}
      onNext={() => state.table.nextPage()}
    />
  {/if}
</div>
