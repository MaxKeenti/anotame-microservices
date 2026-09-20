<script lang="ts">
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { ResponsiveDataView } from '$lib/components/common';
  import PanelHeading from './panel-heading.svelte';
  import type { OrderItemResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  /** Garments on an order with the services applied to each. */
  interface Props {
    items: OrderItemResponse[];
  }

  let { items }: Props = $props();

  // Declaration order drives the desktop column order; `cardGroup` drives the mobile card.
  let itemColumns = $derived<ColumnDef<OrderItemResponse>[]>([
    { accessorKey: 'garmentName', header: m['orders.detail.description'](), enableSorting: false, meta: { cardGroup: 'header' } },
    { id: 'services', accessorFn: (item) => item.services.map((service) => service.serviceName).join(', '), header: m['orders.detail.service'](), enableSorting: false, meta: { cardGroup: 'body' } },
    { accessorKey: 'quantity', header: m['orders.detail.qty'](), enableSorting: false, meta: { cardGroup: 'header' } },
    { id: 'subtotal', accessorFn: (item) => `$${item.subtotal}`, header: m['orders.detail.subtotal'](), enableSorting: false, meta: { cardGroup: 'header' } },
    { accessorKey: 'notes', header: m['orders.detail.note'](), enableSorting: false, meta: { cardGroup: 'body' } },
  ]);
</script>

<Card.Root class="gap-0 p-0">
  <PanelHeading title={m['orders.detail.garmentsAndServices']()} />

  <div class="p-4">
    <ResponsiveDataView
      columns={itemColumns}
      data={items}
      showFilter={false}
      showPagination={false}
      cellRenders={{ garmentName: garmentCell, services: servicesCell, notes: notesCell }}
    />
  </div>
</Card.Root>

{#snippet garmentCell(row: Row<OrderItemResponse>)}
  <div class="flex flex-wrap items-center gap-2">
    <span>{row.original.garmentName}</span>
    {#if row.original.source === 'CUSTOM'}
      <Badge class="bg-primary/10 uppercase tracking-wide text-primary">{m['orders.custom.badge']()}</Badge>
    {/if}
  </div>
{/snippet}

{#snippet servicesCell(row: Row<OrderItemResponse>)}
  <div class="space-y-2">
    {#each row.original.services as service}
      <div class="min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span class="font-medium text-foreground">{service.serviceName}</span>
          <span class="font-mono text-foreground">${service.unitPrice}</span>
        </div>
        {#if service.instructions}
          <p class="mt-1 text-sm text-muted-foreground">{service.instructions}</p>
        {/if}
        {#if service.adjustmentAmount && service.adjustmentAmount !== 0}
          <span
            class={`mt-1 inline-block rounded-md px-2 py-0.5 font-mono text-xs font-bold ${service.adjustmentAmount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success-text'}`}
          >
            {service.adjustmentAmount > 0 ? '+' : ''}{service.adjustmentAmount}
            {service.adjustmentReason && ` (${service.adjustmentReason})`}
          </span>
        {/if}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet notesCell(row: Row<OrderItemResponse>)}
  {#if row.original.notes}
    <Badge variant="warning" class="h-auto whitespace-normal rounded-lg p-2 text-left">{row.original.notes}</Badge>
  {:else}
    <span class="text-muted-foreground">—</span>
  {/if}
{/snippet}
