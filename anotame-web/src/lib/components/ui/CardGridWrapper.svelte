<script lang="ts" generics="TData">
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import {
    createResponsiveTable,
    getColumnId,
    getColumnHeader,
    type CardGroup,
    type ResponsiveTableProps,
  } from './responsive-table.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { ChevronDown, ChevronUp } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages';

  let {
    columns,
    data,
    pageSize: pageSizeProp = 12,
    loading = false,
    emptyMessage,
    filterPlaceholder,
    showFilter = true,
    actionCell,
    cellRenders = {},
    bulkActions = false,
    bulkMode = $bindable(false),
    onSelectionChange,
    manualPagination = false,
    pageIndex = 0,
    pageCount,
    onPageChange,
  }: ResponsiveTableProps<TData> = $props();

  let resolvedEmptyMessage = $derived(emptyMessage ?? m['common.noData']());
  let resolvedFilterPlaceholder = $derived(filterPlaceholder ?? m['common.searchEllipsis']());

  const state = createResponsiveTable<TData>({
    columns: () => columns,
    data: () => data,
    pageSize: () => pageSizeProp,
    initialPageSize: untrack(() => pageSizeProp),
    bulkActions: () => bulkActions,
    bulkMode: () => bulkMode,
    manualPagination: () => manualPagination,
    pageIndex: () => pageIndex,
    pageCount: () => pageCount,
    onPageChange: () => onPageChange,
    onSelectionChange: () => onSelectionChange,
  });

  // Accordion open state per row id
  let openRows = new SvelteSet<string>();

  function toggleRow(rowId: string) {
    if (openRows.has(rowId)) {
      openRows.delete(rowId);
    } else {
      openRows.add(rowId);
    }
  }

  // Determine cardGroup assignment for each column
  // Auto-fallback: if no column has cardGroup meta, first 3 = header, rest = body
  let hasAnyCardGroup = $derived(
    columns.some((c) => c.meta?.cardGroup != null)
  );

  function getCardGroup(col: ColumnDef<TData>, index: number): CardGroup {
    const group = col.meta?.cardGroup;
    if (group) return group;
    if (!hasAnyCardGroup) {
      return index < 3 ? 'header' : 'body';
    }
    return 'body';
  }

  let headerColumns = $derived(
    columns.filter((c, i) => getCardGroup(c, i) === 'header')
  );
  let bodyColumns = $derived(
    columns.filter((c, i) => getCardGroup(c, i) === 'body')
  );
  // 'hidden' columns (typically 'actions') are rendered in accordion via actionCell

  // Sortable columns for the sort select
  let sortableColumns = $derived(
    columns.filter(
      (c) =>
        c.enableSorting !== false && getColumnId(c) !== '__select__' && getColumnId(c) !== 'actions'
    )
  );

  let currentSortId = $derived(state.sorting[0]?.id ?? '');
  let currentSortDesc = $derived(state.sorting[0]?.desc ?? false);
  let sortItems = $derived(
    sortableColumns.map((col) => ({
      value: getColumnId(col),
      label: getColumnHeader(col),
    }))
  );

  function getCellFromRow(row: Row<TData>, colId: string): string {
    const cell = row.getAllCells().find((c) => c.column.id === colId);
    if (!cell) return '';
    return (cell.getValue() as string) ?? '';
  }
</script>

<div class="space-y-4">
  <!-- Filter + Sort row -->
  <div class="flex flex-col sm:flex-row gap-3">
    {#if showFilter}
      <div class="flex-1">
        <label for="cgw-filter" class="sr-only">{m['common.search']()}</label>
        <Input
          id="cgw-filter"
          placeholder={resolvedFilterPlaceholder}
          bind:value={state.globalFilter}
          class="h-12 touch-manipulation"
        />
      </div>
    {/if}

    {#if sortableColumns.length > 0}
      <div class="flex items-center gap-2 shrink-0">
        <AdaptiveSelect
          value={currentSortId}
          onValueChange={(id) => {
            if (!id) {
              state.sorting = [];
            } else {
              state.sorting = [{ id, desc: currentSortDesc }];
            }
          }}
          placeholder={m['cardGrid.sortBy']()}
          ariaLabel={m['cardGrid.sortByLabel']()}
          items={sortItems}
          class="min-w-40 text-sm"
        />
        {#if currentSortId}
          <Button
            variant="outline"
            size="sm"
            class="h-12 w-12 p-0 touch-manipulation"
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

  <!-- Divider -->

  {#if bulkActions && bulkMode && data.length > 0}
    <div class="flex items-center gap-3 py-2 px-1">
      <input
        type="checkbox"
        id="cgw-select-all"
        class="h-5 w-5 cursor-pointer rounded"
        aria-label={m['common.selectAll']()}
        checked={state.table.getIsAllRowsSelected()}
        onchange={state.table.getToggleAllRowsSelectedHandler()}
      />
      <label for="cgw-select-all" class="text-sm font-medium cursor-pointer select-none">{m['common.selectAll']()}</label>
    </div>
  {/if}

  <div class="border-t border-border"></div>

  <!-- Card Grid -->
  {#if loading}
    <div class="h-32 flex items-center justify-center text-muted-foreground animate-pulse font-medium text-base">
      {m['common.loading']()}
    </div>
  {:else if state.table.getRowModel().rows.length === 0}
    <div class="h-32 flex items-center justify-center text-muted-foreground font-medium text-base">
      {resolvedEmptyMessage}
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-3">
      {#each state.table.getRowModel().rows as row (row.id)}
        {@const isOpen = openRows.has(row.id)}
        {@const hasAccordion =
          bodyColumns.length > 0 ||
          (actionCell != null)}

        <Card.Root class="border border-border shadow-sm overflow-hidden">
          <Card.Header class="pb-2 px-4 pt-4">
            <div class="flex items-start gap-3">
              <!-- Bulk selection checkbox -->
              {#if bulkActions && bulkMode}
                <div class="flex items-center justify-center mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    class="h-5 w-5 cursor-pointer rounded"
                    aria-label={m['common.selectRow']()}
                    checked={row.getIsSelected()}
                    onchange={row.getToggleSelectedHandler()}
                  />
                </div>
              {/if}

              <!-- Header fields -->
              <div class="flex-1 min-w-0">
                {#each headerColumns as col, i (getColumnId(col))}
                  {@const colId = getColumnId(col)}
                  {@const value = cellRenders && cellRenders[colId]
                    ? null
                    : getCellFromRow(row, colId)}

                  {#if i === 0}
                    <!-- Primary title -->
                    <Card.Title class="text-base font-semibold leading-tight truncate">
                      {#if cellRenders && cellRenders[colId]}
                        {@render cellRenders[colId](row)}
                      {:else}
                        {value}
                      {/if}
                    </Card.Title>
                  {:else}
                    <!-- Secondary header fields as description/chip -->
                    <Card.Description class="mt-1 text-sm text-muted-foreground truncate">
                      {#if cellRenders && cellRenders[colId]}
                        {@render cellRenders[colId](row)}
                      {:else}
                        <span class="font-medium text-foreground/70">{getColumnHeader(col)}:</span>
                        {value}
                      {/if}
                    </Card.Description>
                  {/if}
                {/each}
              </div>

              <!-- Accordion toggle -->
              {#if hasAccordion}
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0 shrink-0 touch-manipulation"
                  aria-label={isOpen ? m['cardGrid.collapseDetails']() : m['cardGrid.expandDetails']()}
                  onclick={() => toggleRow(row.id)}
                >
                  {#if isOpen}
                    <ChevronUp class="w-4 h-4" />
                  {:else}
                    <ChevronDown class="w-4 h-4" />
                  {/if}
                </Button>
              {/if}
            </div>
          </Card.Header>

          <!-- Accordion body -->
          {#if hasAccordion && isOpen}
            <Card.Content class="px-4 pb-4 pt-0 border-t border-border/60 mt-2">
              <!-- Body column values -->
              {#if bodyColumns.length > 0}
                <dl class="space-y-2 mt-3">
                  {#each bodyColumns as col (getColumnId(col))}
                    {@const colId = getColumnId(col)}
                    <div class="flex items-start gap-2 text-sm">
                      <dt class="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 pt-0.5 min-w-[6rem]">
                        {getColumnHeader(col)}
                      </dt>
                      <dd class="text-foreground">
                        {#if cellRenders && cellRenders[colId]}
                          {@render cellRenders[colId](row)}
                        {:else}
                          {getCellFromRow(row, colId)}
                        {/if}
                      </dd>
                    </div>
                  {/each}
                </dl>
              {/if}

              <!-- Action cell -->
              {#if actionCell}
                <div class="mt-4">
                  {@render actionCell(row)}
                </div>
              {/if}
            </Card.Content>
          {/if}
        </Card.Root>
      {/each}
    </div>
  {/if}

  <!-- Pagination -->
  <div class="flex items-center justify-between px-2 py-1">
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!state.table.getCanPreviousPage()}
      onclick={() => state.table.previousPage()}
    >
      {m['common.previous']()}
    </Button>
    <span class="text-sm text-muted-foreground">
      {m['common.pagination']({
        current: String(state.table.getState().pagination.pageIndex + 1),
        total: String(state.table.getPageCount() || 1),
      })}
    </span>
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!state.table.getCanNextPage()}
      onclick={() => state.table.nextPage()}
    >
      {m['common.next']()}
    </Button>
  </div>
</div>
