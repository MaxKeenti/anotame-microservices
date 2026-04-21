<script lang="ts" generics="TData">
  import { untrack } from 'svelte';
  import { tablePreferences } from '$lib/stores/table-preferences.svelte';
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
    type RowSelectionState,
    type Row,
  } from '@tanstack/table-core';
  import * as Table from '$lib/components/ui/table';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
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
  };

  let {
    columns,
    data,
    pageSize: pageSizeProp = 20,
    loading = false,
    emptyMessage,
    filterPlaceholder,
    showFilter = true,
    actionCell,
    cellRenders = {},
    bulkActions = false,
    bulkMode = $bindable(false),
    onSelectionChange,
  }: Props = $props();

  let resolvedEmptyMessage = $derived(emptyMessage ?? m.common_noData());
  let resolvedFilterPlaceholder = $derived(filterPlaceholder ?? m.common_searchEllipsis());

  // Intercept pattern — avoid hydration warning from $props directly into $state
  let initialPageSize = untrack(() => tablePreferences.pageSize);

  let sorting = $state<SortingState>([]);
  let globalFilter = $state('');
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: initialPageSize });
  // Initialize columnPinning to prevent undefined state errors
  let columnPinning = $state<ColumnPinningState>({ left: [], right: [] });
  let rowSelection = $state<RowSelectionState>({});

  // Reset pagination on filter change
  $effect(() => {
    void globalFilter;
    untrack(() => {
      pagination = { pageIndex: 0, pageSize: pagination.pageSize };
    });
  });

  // Reset rowSelection when bulkMode is toggled off
  $effect(() => {
    if (!bulkMode) {
      rowSelection = {};
    }
  });

  // Selection column definition — only used when bulkActions && bulkMode
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

  // Recreate full table on every state change via $derived
  let table = $derived(
    createTable<TData>({
      data,
      columns: effectiveColumns,
      state: {
        sorting,
        globalFilter,
        pagination,
        columnPinning,
        ...(bulkActions ? { rowSelection } : {}),
      },
      onStateChange: () => {},
      onSortingChange: (updater) => {
        if (typeof updater === 'function') {
          sorting = updater(sorting);
        } else {
          sorting = updater;
        }
      },
      onGlobalFilterChange: (updater) => {
        if (typeof updater === 'function') {
          globalFilter = updater(globalFilter);
        } else {
          globalFilter = updater;
        }
      },
      onPaginationChange: (updater) => {
        if (typeof updater === 'function') {
          pagination = updater(pagination);
        } else {
          pagination = updater;
        }
      },
      onColumnPinningChange: (updater) => {
        if (typeof updater === 'function') {
          columnPinning = updater(columnPinning);
        } else {
          columnPinning = updater;
        }
      },
      ...(bulkActions ? {
        enableRowSelection: true,
        onRowSelectionChange: (updater: any) => {
          rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
        },
      } : {}),
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
    const selected = table.getSelectedRowModel().rows.map((r: any) => r.original as TData);
    untrack(() => onSelectionChange(selected));
  });
</script>

<div class="space-y-6">
  <!-- Search input -->
  {#if showFilter}
    <div>
      <label for="dt-filter" class="sr-only text-sm font-medium">{m.common_search()}</label>
      <Input
        id="dt-filter"
        placeholder={resolvedFilterPlaceholder}
        bind:value={globalFilter}
        class="h-12 touch-manipulation"
      />
    </div>
  {/if}

  <!-- Divider -->
  <div class="border-t border-border"></div>

  <!-- Table -->
  <div class="overflow-x-auto">
    <Table.Root class="w-full text-sm text-left align-middle">
      <Table.Header class="bg-muted/30">
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row class="hover:bg-transparent">
            {#each headerGroup.headers as header (header.id)}
              <Table.Head
                class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto {header.column.id === '__select__' ? 'w-16' : ''} {header.column.getCanSort() ? 'cursor-pointer select-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2' : ''}"
              >
                {#if !header.isPlaceholder}
                  {#if header.column.id === '__select__'}
                    <div class="flex items-center justify-center h-12 w-12 -ml-3">
                      <input
                        type="checkbox"
                        class="h-8 w-8 cursor-pointer"
                        aria-label={m.common_selectAll()}
                        checked={table.getIsAllRowsSelected()}
                        onchange={table.getToggleAllRowsSelectedHandler()}
                      />
                    </div>
                  {:else if header.column.getCanSort()}
                    <button
                      class="flex items-center gap-1 hover:text-foreground transition-colors focus:outline-none"
                      onclick={header.column.getToggleSortingHandler()}
                      aria-label={m.common_sortBy({ column: header.column.columnDef.header as string })}
                    >
                      {header.column.columnDef.header as string}
                      {#if header.column.getIsSorted() === 'asc'}
                        <span aria-hidden="true">↑</span>
                      {:else if header.column.getIsSorted() === 'desc'}
                        <span aria-hidden="true">↓</span>
                      {:else}
                        <span aria-hidden="true" class="opacity-20 flex flex-col -space-y-1.5 text-[8px] leading-none">
                          <span>▲</span>
                          <span>▼</span>
                        </span>
                      {/if}
                    </button>
                  {:else}
                    {header.column.columnDef.header as string}
                  {/if}
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body class="divide-y divide-border">
        {#if loading}
          <Table.Row>
            <Table.Cell colspan={effectiveColumns.length} class="h-32 text-center text-muted-foreground animate-pulse font-medium text-base">
              {m.common_loading()}
            </Table.Cell>
          </Table.Row>
        {:else if table.getRowModel().rows.length === 0}
          <Table.Row>
            <Table.Cell colspan={effectiveColumns.length} class="h-32 text-center text-muted-foreground font-medium text-base">
              {resolvedEmptyMessage}
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each table.getRowModel().rows as row (row.id)}
            <Table.Row class="hover:bg-muted/10 transition-colors">
              {#each row.getVisibleCells() as cell (cell.id)}
                <Table.Cell class="px-6 py-4 {cell.column.id === '__select__' ? 'px-0' : ''}">
                  {#if cell.column.id === '__select__'}
                    <div class="flex items-center justify-center h-12 w-12 -ml-3">
                      <input
                        type="checkbox"
                        class="h-8 w-8 cursor-pointer"
                        aria-label={m.common_selectRow()}
                        checked={cell.row.getIsSelected()}
                        onchange={cell.row.getToggleSelectedHandler()}
                      />
                    </div>
                  {:else if cellRenders && cellRenders[cell.column.id]}
                    {@render cellRenders[cell.column.id](row)}
                  {:else if cell.column.id === 'actions' && actionCell}
                    {@render actionCell(row)}
                  {:else}
                    {cell.getValue() as string ?? ''}
                  {/if}
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </div>

  <!-- Pagination controls -->
  <div class="flex items-center justify-between px-2 py-1">
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!table.getCanPreviousPage()}
      onclick={() => table.previousPage()}
    >
      {m.common_previous()}
    </Button>
    <span class="text-sm text-muted-foreground">
      {m.common_pagination({ current: String(table.getState().pagination.pageIndex + 1), total: String(table.getPageCount() || 1) })}
    </span>
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!table.getCanNextPage()}
      onclick={() => table.nextPage()}
    >
      {m.common_next()}
    </Button>
  </div>
</div>
