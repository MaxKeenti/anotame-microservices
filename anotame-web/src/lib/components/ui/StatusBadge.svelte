<script lang="ts">
  import { cn } from "$lib/utils";
  import * as m from '$lib/paraglide/messages';

  let { status, class: className } = $props<{
    status: string;
    class?: string;
  }>();

  const STATUS_TRANSLATIONS: Record<string, () => string> = {
    'RECEIVED': () => m['order.status.received'](),
    'IN_PROGRESS': () => m['order.status.inProgress'](),
    'READY': () => m['order.status.ready'](),
    'DELIVERED': () => m['order.status.delivered'](),
    'CANCELLED': () => m['order.status.cancelled'](),
    'PENDING': () => 'PENDIENTE',
    'PAID': () => 'PAGADO',
    'UNPAID': () => 'NO PAGADO'
  };

  const label = $derived(STATUS_TRANSLATIONS[status]?.() || status);
</script>

<span 
  class={cn("status-badge", className)} 
  data-status={status}
>
  {label}
</span>
