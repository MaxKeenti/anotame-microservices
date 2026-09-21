<script lang="ts" generics="TData">
  import type { Snippet } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import {
    getColumnId,
    getColumnHeader,
    formatColumnValue,
    SELECT_CHECKBOX_CLASS,
    type CardGroup,
    type ResponsiveTableState,
  } from './responsive-table.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { ChevronDown, ChevronUp } from '@lucide/svelte';
  import StatePanel from './state-panel.svelte';
  import * as m from '$lib/paraglide/messages';

  /** Mobile card-list presentation for a table owned by ResponsiveDataView. */
  interface Props<TData> {
    /** Shared table machinery created by the owning ResponsiveDataView. */
    state: ResponsiveTableState<TData>;
    /** Caller-supplied columns, used for card grouping before the selection column is added. */
    columns: ColumnDef<TData>[];
    loading: boolean;
    emptyMessage: string;
    cellRenders?: Record<string, Snippet<[Row<TData>]>>;
    actionCell?: Snippet<[Row<TData>]>;
    bulkActions?: boolean;
    bulkMode?: boolean;
  }

  let {
    state,
    columns,
    loading,
    emptyMessage,
    cellRenders = {},
    actionCell,
    bulkActions = false,
    bulkMode = false,
  }: Props<TData> = $props();

  // Accordion open state per row id
  let openRows = new SvelteSet<string>();

  function toggleRow(rowId: string) {
    if (openRows.has(rowId)) {
      openRows.delete(rowId);
    } else {
      openRows.add(rowId);
    }
  }

  // Auto-fallback: if no column declares cardGroup meta, first 3 = header, rest = body.
  let hasAnyCardGroup = $derived(columns.some((c) => c.meta?.cardGroup != null));

  function getCardGroup(col: ColumnDef<TData>, index: number): CardGroup {
    const group = col.meta?.cardGroup;
    if (group) return group;
    if (!hasAnyCardGroup) {
      return index < 3 ? 'header' : 'body';
    }
    return 'body';
  }

  let headerColumns = $derived(columns.filter((c, i) => getCardGroup(c, i) === 'header'));
  let bodyColumns = $derived(columns.filter((c, i) => getCardGroup(c, i) === 'body'));
  // 'hidden' columns (typically 'actions') are rendered in the accordion via actionCell

</script>

{#if bulkActions && bulkMode && state.table.getRowModel().rows.length > 0}
  <div class="flex min-h-11 items-center gap-3 py-2 px-1">
    <Checkbox
      id="cgw-select-all"
      class={SELECT_CHECKBOX_CLASS}
      aria-label={m['common.selectAll']()}
      checked={state.table.getIsAllRowsSelected()}
      indeterminate={state.table.getIsSomeRowsSelected()}
      onCheckedChange={(v) => state.table.toggleAllRowsSelected(v === true)}
    />
    <label for="cgw-select-all" class="flex min-h-11 items-center text-sm font-medium cursor-pointer select-none touch-manipulation">{m['common.selectAll']()}</label>
  </div>
{/if}

{#if loading}
  <StatePanel message={m['common.loading']()} loading class="h-32 border-0" />
{:else if state.table.getRowModel().rows.length === 0}
  <StatePanel message={emptyMessage} class="h-32 border-0" />
{:else}
  <div class="grid grid-cols-1 gap-3">
    {#each state.table.getRowModel().rows as row (row.id)}
      {@const isOpen = openRows.has(row.id)}
      {@const hasAccordion = bodyColumns.length > 0 || actionCell != null}

      <Card.Root class="min-w-0 border border-border shadow-sm overflow-hidden">
        <Card.Header class="pb-2 px-4 pt-4">
          <div class="flex min-w-0 items-start gap-3">
            {#if bulkActions && bulkMode}
              <div class="flex h-11 w-11 -m-2.5 items-center justify-center shrink-0">
                <Checkbox
                  class={SELECT_CHECKBOX_CLASS}
                  aria-label={m['common.selectRow']()}
                  checked={row.getIsSelected()}
                  onCheckedChange={(v) => row.toggleSelected(v === true)}
                />
              </div>
            {/if}

            <div class="flex-1 min-w-0">
              {#each headerColumns as col, i (getColumnId(col))}
                {@const colId = getColumnId(col)}
                {@const value = cellRenders[colId] ? null : formatColumnValue(row, colId)}

                {#if i === 0}
                  <Card.Title class="text-base font-semibold leading-tight whitespace-normal break-words">
                    {#if cellRenders[colId]}
                      {@render cellRenders[colId](row)}
                    {:else}
                      {value}
                    {/if}
                  </Card.Title>
                {:else}
                  <Card.Description class="mt-1 text-sm text-muted-foreground whitespace-normal break-words">
                    {#if cellRenders[colId]}
                      {@render cellRenders[colId](row)}
                    {:else}
                      <span class="font-medium text-foreground/70">{getColumnHeader(col)}:</span>
                      {value}
                    {/if}
                  </Card.Description>
                {/if}
              {/each}
            </div>

            {#if hasAccordion}
              <Button
                variant="ghost"
                size="sm"
                class="h-11 w-11 p-0 shrink-0 touch-manipulation"
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

        {#if hasAccordion && isOpen}
          <Card.Content class="px-4 pb-4 pt-0 border-t border-border/60 mt-2">
            {#if bodyColumns.length > 0}
              <dl class="space-y-2 mt-3">
                {#each bodyColumns as col (getColumnId(col))}
                  {@const colId = getColumnId(col)}
                  <div class="flex min-w-0 items-start gap-2 text-sm">
                    <dt class="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 pt-0.5 min-w-24">
                      {getColumnHeader(col)}
                    </dt>
                    <dd class="min-w-0 flex-1 text-foreground break-words">
                      {#if cellRenders[colId]}
                        {@render cellRenders[colId](row)}
                      {:else}
                        {formatColumnValue(row, colId)}
                      {/if}
                    </dd>
                  </div>
                {/each}
              </dl>
            {/if}

            {#if actionCell}
              <div class="mt-4 min-w-0">
                {@render actionCell(row)}
              </div>
            {/if}
          </Card.Content>
        {/if}
      </Card.Root>
    {/each}
  </div>
{/if}
