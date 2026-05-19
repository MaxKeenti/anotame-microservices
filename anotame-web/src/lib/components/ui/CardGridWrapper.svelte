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
    type RowSelectionState,
    type Row,
  } from '@tanstack/table-core';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { ChevronDown, Filter, Search } from 'lucide-svelte';
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
    cardTemplate?: import('svelte').Snippet<[Row<TData>, boolean]>;
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
    cardTemplate,
    bulkActions = false,
    bulkMode = $bindable(false),
    onSelectionChange,
  }: Props = $props();

  let resolvedEmptyMessage = $derived(emptyMessage ?? m["common.noData"]());
  let resolvedFilterPlaceholder = $derived(filterPlaceholder ?? m["common.searchEllipsis"]());

  let initialPageSize = untrack(() => tablePreferences.pageSize);

  let sorting = $state<SortingState>(
    (() => {
      const sortableCols = columns.filter(c => c.enableSorting !== false && c.id !== '__select__');
      const nameCol = sortableCols.find(c => {
        const id = c.id as string | undefined;
        const accessor = (c as any).accessorKey as string | undefined;
        return ['name', 'title', 'customer', 'ticketNumber'].includes(id || accessor || '');
      });
      const targetCol = nameCol || sortableCols[0];
      if (targetCol) {
        return [{ id: targetCol.id as string || (targetCol as any).accessorKey as string, desc: false }];
      }
      return [];
    })()
  );
  let globalFilter = $state('');
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: initialPageSize });
  let rowSelection = $state<RowSelectionState>({});
  let expandedRowId = $state<string | null>(null);
  let filterVisible = $state(false);

  $effect(() => {
    void globalFilter;
    untrack(() => {
      pagination = { pageIndex: 0, pageSize: pagination.pageSize };
    });
  });

  $effect(() => {
    if (!bulkMode) {
      rowSelection = {};
    }
  });

  // Classify columns by cardGroup metadata
  let headerColumns = $derived(
    columns.filter(c => {
      const group = (c.meta as any)?.cardGroup;
      if (group) return group === 'header';
      return c.id !== 'actions' && c.id !== '__select__';
    }).slice(0, columns.filter(c => {
      const group = (c.meta as any)?.cardGroup;
      return group === 'header';
    }).length || 3)
  );

  let bodyColumns = $derived(
    columns.filter(c => {
      const group = (c.meta as any)?.cardGroup;
      if (group) return group === 'body';
      if (c.id === 'actions' || c.id === '__select__') return false;
      return !headerColumns.includes(c);
    })
  );

  // Sortable columns for dropdown
  let sortableColumns = $derived(
    columns
      .filter(c => c.enableSorting !== false && c.id !== '__select__' && c.id !== 'actions')
      .map(c => ({
        value: c.id as string || (c as any).accessorKey as string,
        label: c.header as string,
      }))
  );

  let currentSortId = $derived(sorting[0]?.id ?? '');
  let currentSortDesc = $derived(sorting[0]?.desc ?? false);

  function handleSortChange(colId: string) {
    if (!colId) {
      sorting = [];
      return;
    }
    if (currentSortId === colId) {
      sorting = [{ id: colId, desc: !currentSortDesc }];
    } else {
      sorting = [{ id: colId, desc: false }];
    }
  }

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
        pagination,
        ...(bulkActions ? { rowSelection } : {}),
      },
      onStateChange: () => {},
      onSortingChange: (updater) => {
        sorting = typeof updater === 'function' ? updater(sorting) : updater;
      },
      onGlobalFilterChange: (updater) => {
        globalFilter = typeof updater === 'function' ? updater(globalFilter) : updater;
      },
      onPaginationChange: (updater) => {
        pagination = typeof updater === 'function' ? updater(pagination) : updater;
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

  $effect(() => {
    if (!bulkActions || !onSelectionChange) return;
    const selected = table.getSelectedRowModel().rows.map((r: any) => r.original as TData);
    untrack(() => onSelectionChange(selected));
  });

  function toggleExpand(rowId: string) {
    if (bulkMode) return;
    expandedRowId = expandedRowId === rowId ? null : rowId;
  }

  function getCellValue(row: Row<TData>, col: ColumnDef<TData>): string {
    const id = col.id ?? (col as any).accessorKey;
    const cell = row.getAllCells().find(c => c.column.id === id);
    return cell ? (cell.getValue() as string ?? '') : '';
  }

  function hasCustomRender(col: ColumnDef<TData>): boolean {
    const id = col.id ?? (col as any).accessorKey;
    return !!(cellRenders && cellRenders[id]);
  }

  function getColumnId(col: ColumnDef<TData>): string {
    return col.id ?? (col as any).accessorKey ?? '';
  }
</script>

<div class="space-y-4">
  <!-- Filter bar -->
  {#if showFilter}
    <div class="flex items-center gap-2">
      <button
        class="flex items-center justify-center h-12 w-12 rounded-lg border border-border bg-background touch-manipulation shrink-0"
        aria-label={m["common.search"]()}
        aria-expanded={filterVisible}
        onclick={() => filterVisible = !filterVisible}
      >
        {#if filterVisible}
          <Search class="w-5 h-5 text-primary" />
        {:else}
          <Filter class="w-5 h-5 text-muted-foreground" />
        {/if}
      </button>

      {#if sortableColumns.length > 0}
        <div class="flex-1 min-w-0">
          <AdaptiveSelect
            value={currentSortId}
            onValueChange={handleSortChange}
            placeholder={m["cardGrid.sortBy"]()}
            items={sortableColumns}
            class="h-12"
          />
        </div>
      {/if}
    </div>

    {#if filterVisible}
      <div class="animate-in slide-in-from-top-2 duration-200">
        <Input
          placeholder={resolvedFilterPlaceholder}
          bind:value={globalFilter}
          class="h-12 touch-manipulation"
        />
      </div>
    {/if}
  {/if}

  <!-- Card grid -->
  {#if loading}
    <div class="grid gap-3">
      {#each Array(3) as _, i (i)}
        <Card.Root size="sm">
          <Card.Header>
            <div class="h-5 w-2/3 bg-muted animate-pulse rounded"></div>
          </Card.Header>
          <Card.Content>
            <div class="space-y-2">
              <div class="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
              <div class="h-4 w-1/3 bg-muted animate-pulse rounded"></div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else if table.getRowModel().rows.length === 0}
    <div class="flex items-center justify-center py-16 text-muted-foreground font-medium text-base">
      {resolvedEmptyMessage}
    </div>
  {:else}
    <div class="grid gap-3">
      {#each table.getRowModel().rows as row (row.id)}
        {@const isExpanded = expandedRowId === row.id}
        <Card.Root
          size="sm"
          class="transition-shadow duration-200 touch-manipulation {isExpanded ? 'ring-2 ring-primary/20 shadow-md' : 'active:shadow-md'} {bulkMode && row.getIsSelected() ? 'ring-2 ring-primary bg-primary/5' : ''}"
        >
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="cursor-pointer"
            onclick={() => {
              if (bulkMode) {
                row.toggleSelected();
              } else {
                toggleExpand(row.id);
              }
            }}
          >
            {#if cardTemplate}
              {@render cardTemplate(row, isExpanded)}
            {:else}
              <Card.Header>
                <div class="flex items-center justify-between w-full gap-2">
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    {#if bulkMode}
                      <input
                        type="checkbox"
                        class="h-6 w-6 cursor-pointer shrink-0"
                        aria-label={m["common.selectRow"]()}
                        checked={row.getIsSelected()}
                        onclick={(e) => e.stopPropagation()}
                        onchange={() => row.toggleSelected()}
                      />
                    {/if}
                    <div class="min-w-0">
                      {#each headerColumns as col, i (getColumnId(col))}
                        {#if hasCustomRender(col)}
                          <div class={i === 0 ? 'font-semibold text-foreground truncate' : 'text-sm text-muted-foreground truncate'}>
                            {@render cellRenders[getColumnId(col)](row)}
                          </div>
                        {:else}
                          <div class={i === 0 ? 'font-semibold text-foreground truncate' : 'text-sm text-muted-foreground truncate'}>
                            {getCellValue(row, col)}
                          </div>
                        {/if}
                      {/each}
                    </div>
                  </div>
                  <ChevronDown class="w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}" />
                </div>
              </Card.Header>
            {/if}
          </div>

          <!-- Expanded content (accordion) -->
          {#if isExpanded && !cardTemplate}
            <div class="animate-in slide-in-from-top-1 fade-in duration-200">
              {#if bodyColumns.length > 0}
                <Card.Content>
                  <div class="space-y-2 text-sm">
                    {#each bodyColumns as col (getColumnId(col))}
                      <div class="flex justify-between gap-4">
                        <span class="text-muted-foreground shrink-0">{col.header as string}</span>
                        {#if hasCustomRender(col)}
                          <span class="text-right">
                            {@render cellRenders[getColumnId(col)](row)}
                          </span>
                        {:else}
                          <span class="text-foreground text-right truncate">{getCellValue(row, col)}</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </Card.Content>
              {/if}

              {#if actionCell}
                <Card.Footer class="border-t border-border pt-3 mt-2">
                  {@render actionCell(row)}
                </Card.Footer>
              {/if}
            </div>
          {/if}
        </Card.Root>
      {/each}
    </div>
  {/if}

  <!-- Pagination -->
  <div class="flex items-center justify-between px-1 py-1">
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!table.getCanPreviousPage()}
      onclick={() => table.previousPage()}
    >
      {m["common.previous"]()}
    </Button>
    <span class="text-sm text-muted-foreground">
      {m["common.pagination"]({ current: String(table.getState().pagination.pageIndex + 1), total: String(table.getPageCount() || 1) })}
    </span>
    <Button
      variant="outline"
      class="h-10 touch-manipulation"
      disabled={!table.getCanNextPage()}
      onclick={() => table.nextPage()}
    >
      {m["common.next"]()}
    </Button>
  </div>
</div>
