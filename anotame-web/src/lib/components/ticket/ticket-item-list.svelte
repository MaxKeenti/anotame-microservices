<script lang="ts">
  import type { TicketItem } from './types';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import { cn } from '$lib/utils';
  import * as m from '$lib/paraglide/messages';

  /** Garments and their services, optionally priced. */
  interface Props {
    items: TicketItem[];
    /**
     * Shows each service's charge. Handling tickets travel with the garments and
     * deliberately carry no prices, so they leave this off.
     */
    showPrices?: boolean;
    /** Layout classes for the section, such as which edges carry the dashed rule. */
    class?: string;
  }

  let { items, showPrices = false, class: className }: Props = $props();
</script>

<section class={cn('space-y-4 border-dashed border-border', className)}>
  {#each items as item}
    <div>
      <p class="font-semibold">{item.quantity > 1 ? `${item.quantity} × ` : ''}{item.garmentName}</p>
      <div class="mt-2 space-y-2 text-sm">
        {#each item.services as service}
          {#if showPrices}
            <div class="flex justify-between gap-3 pl-3">
              <span>+ {service.serviceName}</span>
              <span class="shrink-0">
                {formatCurrency((service.unitPrice ?? 0) + (service.adjustmentAmount ?? 0))}
              </span>
            </div>
          {:else}
            <p class="pl-3">+ {service.serviceName}</p>
          {/if}
          {#if service.instructions}
            <p class="pl-6 text-muted-foreground">{service.instructions}</p>
          {/if}
        {/each}
        {#if item.notes}
          <p class="pl-3 italic text-muted-foreground">{m['receipt.note']()}: {item.notes}</p>
        {/if}
      </div>
    </div>
  {/each}
</section>
