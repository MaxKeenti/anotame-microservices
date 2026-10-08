<script lang="ts">
  import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
  import { statusLabel, workflowStatus } from '$lib/utils/status-labels';
  import { workflowStore, type WorkflowMode } from '$lib/stores/workflow.svelte';

  /** Workflow or payment status rendered as a toned, localized badge. */
  interface Props {
    /** Backend status code, such as `IN_PROGRESS` or `PAID`. */
    status: string;
    /** Workflow to label the status for; pages outside the app shell pass the establishment's. */
    workflowMode?: WorkflowMode | null;
    /** Layout classes at the call site. */
    class?: string;
  }

  let { status, workflowMode, class: className }: Props = $props();


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

  const shown = $derived(workflowStatus(status, (workflowMode ?? workflowStore.mode) === 'SIMPLE'));
  const label = $derived(statusLabel(shown));
  const variant = $derived(STATUS_VARIANTS[shown] ?? 'muted');
</script>

<Badge
  {variant}
  data-status={status}
  emphasis
  class={className}
>
  {label}
</Badge>
