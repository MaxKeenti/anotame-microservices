<script lang="ts" generics="TData">
  import type { Snippet } from 'svelte';
  import type { Row } from '@tanstack/table-core';
  import {
    SELECT_CHECKBOX_CLASS,
    SELECT_COLUMN_CELL_CLASS,
    SELECT_CONTROL_CLASS,
    formatCellValue,
    type ResponsiveTableState,
  } from './responsive-table.svelte';
  import DataTableColumnHeader from './data-table-column-header.svelte';
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
              class="py-4 text-xs font-bold uppercase text-muted-foreground h-auto {header.column.id === '__select__' ? SELECT_COLUMN_CELL_CLASS : 'px-6'}"
            >
              {#if !header.isPlaceholder}
                {#if header.column.id === '__select__'}
                  <div class={SELECT_CONTROL_CLASS}>
                    <Checkbox
                      class={SELECT_CHECKBOX_CLASS}
                      aria-label={m["common.selectAll"]()}
                      checked={state.table.getIsAllRowsSelected()}
                      indeterminate={state.table.getIsSomeRowsSelected()}
                      onCheckedChange={(v) => state.table.toggleAllRowsSelected(v === true)}
                    />
                  </div>
                {:else}
                  <DataTableColumnHeader column={header.column} title={header.column.columnDef.header as string} />
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
          <Table.Cell colspan={state.table.getVisibleLeafColumns().length} class="h-32 text-center text-muted-foreground animate-pulse font-medium text-base">
            {m["common.loading"]()}
          </Table.Cell>
        </Table.Row>
      {:else if state.table.getRowModel().rows.length === 0}
        <Table.Row>
          <Table.Cell colspan={state.table.getVisibleLeafColumns().length} class="h-32 text-center text-muted-foreground font-medium text-base">
            {emptyMessage}
          </Table.Cell>
        </Table.Row>
      {:else}
        {#each state.table.getRowModel().rows as row (row.id)}
          <Table.Row class="hover:bg-muted/10 transition-colors">
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell class="py-4 {cell.column.id === '__select__' ? SELECT_COLUMN_CELL_CLASS : 'px-6'}">
                {#if cell.column.id === '__select__'}
                  <div class={SELECT_CONTROL_CLASS}>
                    <Checkbox
                      class={SELECT_CHECKBOX_CLASS}
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
                  {formatCellValue(cell)}
                {/if}
              </Table.Cell>
            {/each}
          </Table.Row>
        {/each}
      {/if}
    </Table.Body>
  </Table.Root>
</div>
