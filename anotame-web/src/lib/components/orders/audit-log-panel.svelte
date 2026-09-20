<script lang="ts" module>
  /** One recorded change to an order. */
  export type AuditLogEntry = {
    changedAt: string;
    fieldName: string;
    oldValue?: string | null;
    newValue?: string | null;
  };
</script>

<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import PanelHeading from './panel-heading.svelte';
  import { formatDateTime } from '$lib/utils/formatUtils';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    entries: AuditLogEntry[];
  }

  let { entries }: Props = $props();
</script>

<Card.Root class="gap-0 p-0">
  <PanelHeading title={m['orders.detail.auditLog']()} />
  <div class="divide-y divide-border">
    {#each entries as entry}
      <div class="flex flex-col gap-1 px-6 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
        <span class="font-mono text-xs whitespace-nowrap text-muted-foreground">
          {formatDateTime(entry.changedAt)}
        </span>
        <span class="font-semibold capitalize">{entry.fieldName}</span>
        <span class="flex-1 text-muted-foreground">
          <span class="line-through opacity-60">{entry.oldValue ?? '—'}</span>
          <span class="mx-2">→</span>
          <span class="font-medium text-foreground">{entry.newValue ?? '—'}</span>
        </span>
      </div>
    {/each}
  </div>
</Card.Root>
