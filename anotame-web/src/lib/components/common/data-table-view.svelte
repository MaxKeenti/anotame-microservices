<script lang="ts" generics="TData">
  import type { Snippet } from 'svelte';
  import type { Row } from '@tanstack/table-core';
  import type { ResponsiveTableState } from './responsive-table.svelte';
  import * as Table from '$lib/components/ui/table';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as m from '$lib/paraglide/messages';

  /** Desktop table presentation for a table owned by ResponsiveDataView. */
  interface Props<TData> {
    /** Shared table machinery created by the owning ResponsiveDataView. */
    state: ResponsiveTableState<TData>;
    loading: boolean;
    emptyMessage: string;
    cellRenders?: Record<string, Snippet<[Row<TData>]>>;
    actionCell?: Snippet<[Row<TData>]>;
  }

  let { state, loading, emptyMessage, cellRenders = {}, actionCell }: Props<TData> = $props();
</script>

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
                    <Checkbox
                      class="size-5"
                      aria-label={m["common.selectAll"]()}
                      checked={state.table.getIsAllRowsSelected()}
                      indeterminate={state.table.getIsSomeRowsSelected()}
                      onCheckedChange={(v) => state.table.toggleAllRowsSelected(v === true)}
                    />
                  </div>
                {:else if header.column.getCanSort()}
                  <button
                    class="flex items-center gap-1 hover:text-foreground transition-colors rounded-md -mx-2 px-2 min-h-11 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onclick={header.column.getToggleSortingHandler()}
                    aria-label={m["common.sortBy"]({ column: header.column.columnDef.header as string })}
                  >
                    {header.column.columnDef.header as string}
                    {#if header.column.getIsSorted() === 'asc'}
                      <span aria-hidden="true">↑</span>
                    {:else if header.column.getIsSorted() === 'desc'}
                      <span aria-hidden="true">↓</span>
                    {:else}
                      <span aria-hidden="true" class="opacity-40 flex flex-col -space-y-1 text-[10px] leading-none">
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
            {emptyMessage}
          </Table.Cell>
        </Table.Row>
      {:else}
        {#each state.table.getRowModel().rows as row (row.id)}
          <Table.Row class="hover:bg-muted/10 transition-colors">
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell class="py-4 {cell.column.id === '__select__' ? 'px-0' : 'px-6'}">
                {#if cell.column.id === '__select__'}
                  <div class="flex items-center justify-center h-12 w-12 -ml-3">
                    <Checkbox
                      class="size-5"
                      aria-label={m["common.selectRow"]()}
                      checked={cell.row.getIsSelected()}
                      onCheckedChange={(v) => cell.row.toggleSelected(v === true)}
                    />
                  </div>
                {:else if cellRenders[cell.column.id]}
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
