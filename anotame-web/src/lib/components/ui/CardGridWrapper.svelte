<script lang="ts" generics="TData">
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import {
    createTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    type ColumnDef,
    type SortingState,
    type PaginationState,
    type RowSelectionState,
    type Row,
  } from '@tanstack/table-core';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { ChevronDown, ChevronUp } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages';

  type Props = {
    columns: ColumnDef<TData>[];
    data: TData[];
    pageSize?: number;
    loading?: boolean;
    emptyMessage?: string;
    filterPlaceholder?: string;
    showFilter?: boolean;
    actionCell?: import('svelte').Snippet<[Row<TData>]>;
    cellRenders?: Record<string, import('svelte').Snippet<[Row<TData>]>>;
    bulkActions?: boolean;
    bulkMode?: boolean;
    onSelectionChange?: (selectedRows: TData[]) => void;
    manualPagination?: boolean;
    pageIndex?: number;
    pageCount?: number;
    onPageChange?: (pageIndex: number) => void;
  };

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
  }: Props = $props();

  let resolvedEmptyMessage = $derived(emptyMessage ?? m['common.noData']());
  let resolvedFilterPlaceholder = $derived(filterPlaceholder ?? m['common.searchEllipsis']());

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
    columns.some((c) => (c as any).meta?.cardGroup != null)
  );

  function getCardGroup(col: ColumnDef<TData>, index: number): 'header' | 'body' | 'hidden' {
    const group = (col as any).meta?.cardGroup;
    if (group) return group as 'header' | 'body' | 'hidden';
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

  // Table state
  let sorting = $state<SortingState>(
    (() => {
      const sortableCols = columns.filter(
        (c) => c.enableSorting !== false && (c as any).id !== '__select__'
      );
      const nameCol = sortableCols.find((c) => {
        const id = (c as any).id as string | undefined;
        const accessor = (c as any).accessorKey as string | undefined;
        return ['name', 'title', 'customer', 'ticketNumber', 'nombre'].includes(
          id || accessor || ''
        );
      });
      const targetCol = nameCol || sortableCols[0];
      if (targetCol) {
        return [
          {
            id: (targetCol as any).id ?? (targetCol as any).accessorKey,
            desc: false,
          },
        ];
      }
      return [];
    })()
  );

  let globalFilter = $state('');
  let initialPageSize = untrack(() => pageSizeProp);
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: initialPageSize });
  let effectivePagination = $derived(
    manualPagination
      ? { pageIndex, pageSize: pageSizeProp }
      : pagination
  );
  let rowSelection = $state<RowSelectionState>({});

  // Reset pagination on filter change
  $effect(() => {
    void globalFilter;
    untrack(() => {
      if (manualPagination) {
        onPageChange?.(0);
      } else {
        pagination = { pageIndex: 0, pageSize: pagination.pageSize };
      }
    });
  });

  // Reset rowSelection when bulkMode is toggled off
  $effect(() => {
    if (!bulkMode) {
      rowSelection = {};
    }
  });

  $effect(() => {
    void data;
    if (bulkActions) {
      untrack(() => {
        rowSelection = {};
      });
    }
  });

  // Selection column — only used when bulkActions && bulkMode
  const selectionColumn: ColumnDef<TData> = {
    id: '__select__',
    size: 48,
    enableSorting: false,
    header: '__select__' as any,
    cell: '__select__' as any,
  };

  let effectiveColumns = $derived(
    bulkActions && bulkMode
      ? [selectionColumn as ColumnDef<TData>, ...columns]
      : columns
  );

  let table = $derived(
    createTable<TData>({
      data,
      columns: effectiveColumns,
      state: {
        sorting,
        globalFilter,
        pagination: effectivePagination,
        ...(bulkActions ? { rowSelection } : {}),
      },
      manualPagination,
      pageCount: manualPagination ? pageCount : undefined,
      onStateChange: () => {},
      onSortingChange: (updater) => {
        sorting = typeof updater === 'function' ? updater(sorting) : updater;
      },
      onGlobalFilterChange: (updater) => {
        globalFilter =
          typeof updater === 'function' ? updater(globalFilter) : updater;
      },
      onPaginationChange: (updater) => {
        const nextPagination =
          typeof updater === 'function' ? updater(effectivePagination) : updater;
        if (manualPagination) {
          onPageChange?.(nextPagination.pageIndex);
        } else {
          pagination = nextPagination;
        }
      },
      ...(bulkActions
        ? {
            enableRowSelection: true,
            onRowSelectionChange: (updater: any) => {
              rowSelection =
                typeof updater === 'function' ? updater(rowSelection) : updater;
            },
          }
        : {}),
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      renderFallbackValue: null,
    })
  );

  // Fire onSelectionChange when rowSelection changes
  $effect(() => {
    if (!bulkActions || !onSelectionChange) return;
    const selected = table
      .getSelectedRowModel()
      .rows.map((r: any) => r.original as TData);
    untrack(() => onSelectionChange(selected));
  });

  // Sortable columns for the sort select
  let sortableColumns = $derived(
    columns.filter(
      (c) =>
        c.enableSorting !== false && (c as any).id !== '__select__' && (c as any).id !== 'actions'
    )
  );

  let currentSortId = $derived(sorting[0]?.id ?? '');
  let currentSortDesc = $derived(sorting[0]?.desc ?? false);

  function setCellValue(row: Row<TData>, col: ColumnDef<TData>): string {
    const colDef = col as any;
    if (colDef.accessorFn) {
      return colDef.accessorFn(row.original, row.index) ?? '';
    }
    if (colDef.accessorKey) {
      return (row.original as any)[colDef.accessorKey] ?? '';
    }
    return '';
  }

  function getColumnId(col: ColumnDef<TData>): string {
    return (col as any).id ?? (col as any).accessorKey ?? '';
  }

  function getColumnHeader(col: ColumnDef<TData>): string {
    return (col.header as string) ?? '';
  }

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
          bind:value={globalFilter}
          class="h-12 touch-manipulation"
        />
      </div>
    {/if}

    {#if sortableColumns.length > 0}
      <div class="flex items-center gap-2 shrink-0">
        <select
          class="h-12 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
          aria-label="Sort by"
          value={currentSortId}
          onchange={(e) => {
            const id = (e.target as HTMLSelectElement).value;
            if (!id) {
              sorting = [];
            } else {
              sorting = [{ id, desc: currentSortDesc }];
            }
          }}
        >
          <option value="">{m['cardGrid.sortBy']()}</option>
          {#each sortableColumns as col (getColumnId(col))}
            <option value={getColumnId(col)}>{getColumnHeader(col)}</option>
          {/each}
        </select>
        {#if currentSortId}
          <Button
            variant="outline"
            size="sm"
            class="h-12 w-12 p-0 touch-manipulation"
            aria-label={currentSortDesc ? m['cardGrid.sortAscending']() : m['cardGrid.sortDescending']()}
            onclick={() => {
              if (sorting[0]) {
                sorting = [{ id: sorting[0].id, desc: !sorting[0].desc }];
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
        checked={table.getIsAllRowsSelected()}
        onchange={table.getToggleAllRowsSelectedHandler()}
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
  {:else if table.getRowModel().rows.length === 0}
    <div class="h-32 flex items-center justify-center text-muted-foreground font-medium text-base">
      {resolvedEmptyMessage}
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-3">
      {#each table.getRowModel().rows as row (row.id)}
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
      disabled={!table.getCanPreviousPage()}
      onclick={() => table.previousPage()}
    >
      {m['common.previous']()}
    </Button>
    <span class="text-sm text-muted-foreground">
      {m['common.pagination']({
        current: String(table.getState().pagination.pageIndex + 1),
        total: String(table.getPageCount() || 1),
      })}
    </span>
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!table.getCanNextPage()}
      onclick={() => table.nextPage()}
    >
      {m['common.next']()}
    </Button>
  </div>
</div>
