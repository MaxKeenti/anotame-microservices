<script lang="ts">
  import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
  import { statusLabel } from '$lib/utils/status-labels';

  /** Workflow or payment status rendered as a toned, localized badge. */
  interface Props {
    /** Backend status code, such as `IN_PROGRESS` or `PAID`. */
    status: string;
    /** Layout classes at the call site. */
    class?: string;
  }

  let { status, class: className }: Props = $props();


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

  const label = $derived(statusLabel(status));
  const variant = $derived(STATUS_VARIANTS[status] ?? 'muted');
</script>

<Badge
  {variant}
  data-status={status}
  emphasis
  class={className}
>
  {label}
</Badge>
