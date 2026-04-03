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
    actionCell?: import('svelte').Snippet<[Row<TData>]>;
  };

  let {
    columns,
    data,
    pageSize: pageSizeProp = 20,
    loading = false,
    emptyMessage = 'No hay datos.',
    filterPlaceholder = 'Buscar...',
    actionCell,
  }: Props = $props();

  // Intercept pattern — avoid hydration warning from $props directly into $state
  let initialPageSize = untrack(() => pageSizeProp);

  let sorting = $state<SortingState>([]);
  let globalFilter = $state('');
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: initialPageSize });
  // Initialize columnPinning to prevent undefined state errors
  let columnPinning = $state<ColumnPinningState>({ left: [], right: [] });

  // Reset pagination on filter change
  $effect(() => {
    void globalFilter;
    untrack(() => {
      pagination = { pageIndex: 0, pageSize: pagination.pageSize };
    });
  });

  // Recreate full table on every state change via $derived
  let table = $derived(
    createTable<TData>({
      data,
      columns,
      state: {
        sorting,
        globalFilter,
        pagination,
        columnPinning,
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
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      renderFallbackValue: null,
    })
  );
</script>

<div class="space-y-3">
  <!-- Search input -->
  <div>
    <label for="dt-filter" class="sr-only text-sm font-medium">Buscar</label>
    <Input
      id="dt-filter"
      placeholder={filterPlaceholder}
      bind:value={globalFilter}
      class="h-12 touch-manipulation"
    />
  </div>

  <!-- Table -->
  <div class="overflow-x-auto">
    <Table.Root class="w-full text-sm text-left align-middle">
      <Table.Header class="bg-muted/30">
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row class="hover:bg-transparent">
            {#each headerGroup.headers as header (header.id)}
              <Table.Head
                class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto {header.column.getCanSort() ? 'cursor-pointer select-none' : ''}"
                onclick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
              >
                {#if !header.isPlaceholder}
                  {header.column.columnDef.header as string}{header.column.getCanSort()
                    ? header.column.getIsSorted() === 'asc'
                      ? ' ↑'
                      : header.column.getIsSorted() === 'desc'
                        ? ' ↓'
                        : ' ↕'
                    : ''}
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body class="divide-y divide-border">
        {#if loading}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-32 text-center text-muted-foreground animate-pulse font-medium text-base">
              Cargando...
            </Table.Cell>
          </Table.Row>
        {:else if table.getRowModel().rows.length === 0}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-32 text-center text-muted-foreground font-medium text-base">
              {emptyMessage}
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each table.getRowModel().rows as row (row.id)}
            <Table.Row class="hover:bg-muted/10 transition-colors">
              {#each row.getVisibleCells() as cell (cell.id)}
                <Table.Cell class="px-6 py-4">
                  {#if cell.column.id === 'actions' && actionCell}
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
      Anterior
    </Button>
    <span class="text-sm text-muted-foreground">
      Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
    </span>
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!table.getCanNextPage()}
      onclick={() => table.nextPage()}
    >
      Siguiente
    </Button>
  </div>
</div>
