<script lang="ts" generics="TData">
  import type { Column } from '@tanstack/table-core';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from '@lucide/svelte';
  import { isDataColumn } from './responsive-table.svelte';
  import * as m from '$lib/paraglide/messages';

  /** Column header for DataTableView: plain text, or a sort/hide menu when the column allows it. */
  interface Props<TData> {
    column: Column<TData, unknown>;
    title: string;
  }

  let { column, title }: Props<TData> = $props();

  let sorted = $derived(column.getIsSorted());
  let canHide = $derived(column.getCanHide() && isDataColumn(column.id));
</script>

{#if column.getCanSort() || canHide}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="flex items-center gap-1 -mx-2 px-2 min-h-11 rounded-md uppercase hover:text-foreground transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:text-foreground"
      aria-label={m['common.sortBy']({ column: title })}
    >
      {title}
      {#if sorted === 'asc'}
        <ArrowUp class="size-3.5" aria-hidden="true" />
      {:else if sorted === 'desc'}
        <ArrowDown class="size-3.5" aria-hidden="true" />
      {:else if column.getCanSort()}
        <ChevronsUpDown class="size-3.5 opacity-50" aria-hidden="true" />
      {/if}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="start" class="w-44">
      {#if column.getCanSort()}
        <DropdownMenu.Item onclick={() => column.toggleSorting(false)}>
          <ArrowUp class="text-muted-foreground" />
          {m['cardGrid.sortAscending']()}
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => column.toggleSorting(true)}>
          <ArrowDown class="text-muted-foreground" />
          {m['cardGrid.sortDescending']()}
        </DropdownMenu.Item>
      {/if}
      {#if column.getCanSort() && canHide}
        <DropdownMenu.Separator />
      {/if}
      {#if canHide}
        <DropdownMenu.Item onclick={() => column.toggleVisibility(false)}>
          <EyeOff class="text-muted-foreground" />
          {m['common.hideColumn']()}
        </DropdownMenu.Item>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{:else}
  {title}
{/if}
