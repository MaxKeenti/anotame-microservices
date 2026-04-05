<script lang="ts">
  import { cn } from "$lib/utils";

  let { status, class: className } = $props<{
    status: string;
    class?: string;
  }>();

  const STATUS_TRANSLATIONS: Record<string, string> = {
    'PENDING': 'PENDIENTE',
    'RECEIVED': 'RECIBIDO',
    'IN_PROGRESS': 'EN PROGRESO',
    'READY': 'LISTO',
    'DELIVERED': 'ENTREGADO',
    'CANCELLED': 'CANCELADO',
    'PAID': 'PAGADO',
    'UNPAID': 'NO PAGADO'
  };

  const label = $derived(STATUS_TRANSLATIONS[status] || status);
</script>

<span 
  class={cn("status-badge", className)} 
  data-status={status}
>
  {label}
</span>
