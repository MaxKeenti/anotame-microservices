<script lang="ts" generics="TData">
  import { untrack } from 'svelte';
  import { tablePreferences } from '$lib/stores/table-preferences.svelte';
  import { createResponsiveTable, type ResponsiveTableProps } from './responsive-table.svelte';
  import * as Table from '$lib/components/ui/table';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';

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
    manualPagination = false,
    pageIndex = 0,
    pageCount,
    onPageChange,
  }: ResponsiveTableProps<TData> = $props();

  let resolvedEmptyMessage = $derived(emptyMessage ?? m["common.noData"]());
  let resolvedFilterPlaceholder = $derived(filterPlaceholder ?? m["common.searchEllipsis"]());

  const state = createResponsiveTable<TData>({
    columns: () => columns,
    data: () => data,
    pageSize: () => pageSizeProp,
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
</script>

<div class="space-y-6">
  <!-- Search input -->
  {#if showFilter}
    <div>
      <label for="dt-filter" class="sr-only text-sm font-medium">{m["common.search"]()}</label>
      <Input
        id="dt-filter"
        placeholder={resolvedFilterPlaceholder}
        bind:value={state.globalFilter}
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
        {#each state.table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row class="hover:bg-transparent">
            {#each headerGroup.headers as header (header.id)}
              <Table.Head
                class="py-4 text-xs font-bold uppercase text-muted-foreground h-auto {header.column.id === '__select__' ? 'px-0 w-16' : 'px-6'} {header.column.getCanSort() ? 'cursor-pointer select-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2' : ''}"
              >
                {#if !header.isPlaceholder}
                  {#if header.column.id === '__select__'}
                    <div class="flex items-center justify-center h-12 w-12 -ml-3">
                      <input
                        type="checkbox"
                        class="h-8 w-8 cursor-pointer"
                        aria-label={m["common.selectAll"]()}
                        checked={state.table.getIsAllRowsSelected()}
                        onchange={state.table.getToggleAllRowsSelectedHandler()}
                      />
                    </div>
                  {:else if header.column.getCanSort()}
                    <button
                      class="flex items-center gap-1 hover:text-foreground transition-colors focus:outline-none"
                      onclick={header.column.getToggleSortingHandler()}
                      aria-label={m["common.sortBy"]({ column: header.column.columnDef.header as string })}
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
            <Table.Cell colspan={state.effectiveColumns.length} class="h-32 text-center text-muted-foreground animate-pulse font-medium text-base">
              {m["common.loading"]()}
            </Table.Cell>
          </Table.Row>
        {:else if state.table.getRowModel().rows.length === 0}
          <Table.Row>
            <Table.Cell colspan={state.effectiveColumns.length} class="h-32 text-center text-muted-foreground font-medium text-base">
              {resolvedEmptyMessage}
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each state.table.getRowModel().rows as row (row.id)}
            <Table.Row class="hover:bg-muted/10 transition-colors">
              {#each row.getVisibleCells() as cell (cell.id)}
                <Table.Cell class="py-4 {cell.column.id === '__select__' ? 'px-0' : 'px-6'}">
                  {#if cell.column.id === '__select__'}
                    <div class="flex items-center justify-center h-12 w-12 -ml-3">
                      <input
                        type="checkbox"
                        class="h-8 w-8 cursor-pointer"
                        aria-label={m["common.selectRow"]()}
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
      disabled={!state.table.getCanPreviousPage()}
      onclick={() => state.table.previousPage()}
    >
      {m["common.previous"]()}
    </Button>
    <span class="text-sm text-muted-foreground">
      {m["common.pagination"]({ current: String(state.table.getState().pagination.pageIndex + 1), total: String(state.table.getPageCount() || 1) })}
    </span>
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!state.table.getCanNextPage()}
      onclick={() => state.table.nextPage()}
    >
      {m["common.next"]()}
    </Button>
  </div>
</div>
