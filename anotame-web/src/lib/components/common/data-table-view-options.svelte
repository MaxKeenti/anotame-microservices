<script lang="ts" generics="TData">
  import type { Table } from '@tanstack/table-core';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { buttonVariants } from '$lib/components/ui/button';
  import { Settings2 } from '@lucide/svelte';
  import { isDataColumn } from './responsive-table.svelte';
  import * as m from '$lib/paraglide/messages';

  /** Toolbar menu for choosing which data columns the desktop table shows. */
  interface Props<TData> {
    table: Table<TData>;
  }

  let { table }: Props<TData> = $props();

  let hideableColumns = $derived(
    table.getAllLeafColumns().filter((c) => c.getCanHide() && isDataColumn(c.id))
  );
</script>

{#if hideableColumns.length > 1}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class={buttonVariants({ variant: 'outline' }) + ' h-12 shrink-0 touch-manipulation'}
    >
      <Settings2 class="size-4" aria-hidden="true" />
      {m['common.columns']()}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-48">
      <DropdownMenu.Label>{m['common.toggleColumns']()}</DropdownMenu.Label>
      <DropdownMenu.Separator />
      {#each hideableColumns as column (column.id)}
        <DropdownMenu.CheckboxItem
          checked={column.getIsVisible()}
          onCheckedChange={(v) => column.toggleVisibility(v)}
          closeOnSelect={false}
        >
          {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
        </DropdownMenu.CheckboxItem>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
