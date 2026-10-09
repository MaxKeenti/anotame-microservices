<script lang="ts" module>
  import { OPEN_ORDER_STATUSES } from '$lib/utils/status-labels';

  export type OrderStatusFilterValue = 'open' | 'delivered' | 'cancelled';

  /** Backend statuses behind each choice. "Received" covers every open status. */
  export const ORDER_STATUS_FILTER_CODES: Record<OrderStatusFilterValue, string[]> = {
    open: OPEN_ORDER_STATUSES,
    delivered: ['DELIVERED'],
    cancelled: ['CANCELLED'],
  };
</script>

<script lang="ts">
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { cn } from '$lib/utils';
  import * as m from '$lib/paraglide/messages';

  /** Received / delivered / cancelled choice for the orders list on the simple workflow. */
  interface Props {
    value: OrderStatusFilterValue;
    /** Layout classes at the call site. */
    class?: string;
  }

  let { value = $bindable(), class: className }: Props = $props();
</script>

<ToggleGroup.Root
  type="single"
  variant="segmented"
  size="touch"
  spacing={2}
  aria-label={m['orders.statusFilter.label']()}
  {value}
  onValueChange={(v) => {
    // A single-choice group lets the user clear it; the list always shows one status.
    if (v) value = v as OrderStatusFilterValue;
  }}
  class={cn('w-full sm:w-fit', className)}
>
  <ToggleGroup.Item value="open" class="flex-1 px-3">{m['orders.statusFilter.open']()}</ToggleGroup.Item>
  <ToggleGroup.Item value="delivered" class="flex-1 px-3">{m['orders.statusFilter.delivered']()}</ToggleGroup.Item>
  <ToggleGroup.Item value="cancelled" class="flex-1 px-3">{m['orders.statusFilter.cancelled']()}</ToggleGroup.Item>
</ToggleGroup.Root>
