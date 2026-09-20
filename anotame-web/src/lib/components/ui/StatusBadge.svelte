<script lang="ts">
  import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
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

  const STATUS_VARIANTS: Record<string, BadgeVariant> = {
    'PENDING': 'warning',
    'RECEIVED': 'info',
    'IN_PROGRESS': 'info',
    'READY': 'success',
    'PAID': 'success',
    'DELIVERED': 'muted',
    'CANCELLED': 'danger',
    'UNPAID': 'danger'
  };

  const label = $derived(STATUS_TRANSLATIONS[status]?.() || status);
  const variant = $derived(STATUS_VARIANTS[status] ?? 'muted');
</script>

<Badge
  {variant}
  data-status={status}
  class={cn("rounded-full font-bold uppercase tracking-wide shadow-sm", className)}
>
  {label}
</Badge>
