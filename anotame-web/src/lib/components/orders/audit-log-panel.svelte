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
  import * as Item from '$lib/components/ui/item';
  import PanelHeading from './panel-heading.svelte';
  import { formatDateTime } from '$lib/utils/formatUtils';
  import { statusLabel } from '$lib/utils/status-labels';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    entries: AuditLogEntry[];
  }

  let { entries }: Props = $props();

  const FIELD_LABELS: Record<string, () => string> = {
    notes: () => m['orders.auditField.notes'](),
    committedDeadline: () => m['orders.auditField.committedDeadline'](),
    status: () => m['orders.auditField.status'](),
  };

  function formatValue(field: string, value?: string | null): string {
    if (value == null || value === '') return '—';
    if (field === 'committedDeadline') return formatDateTime(value);
    if (field === 'status') return statusLabel(value);
    return value;
  }
</script>

<Card.Root class="gap-0 p-0">
  <PanelHeading title={m['orders.detail.auditLog']()} />
  <Item.Group class="gap-0 divide-y divide-border">
    {#each entries as entry}
      <Item.Root size="sm" class="rounded-none px-4 sm:px-6">
        <Item.Content class="min-w-0 gap-1 sm:flex-row sm:items-center sm:gap-4">
          <span class="font-mono text-xs whitespace-nowrap text-muted-foreground">
            {formatDateTime(entry.changedAt)}
          </span>
          <Item.Title>{FIELD_LABELS[entry.fieldName]?.() ?? entry.fieldName}</Item.Title>
          <Item.Description class="line-clamp-none flex-1">
            <span class="line-through opacity-60">{formatValue(entry.fieldName, entry.oldValue)}</span>
            <span class="mx-2" aria-hidden="true">→</span>
            <span class="font-medium text-foreground">{formatValue(entry.fieldName, entry.newValue)}</span>
          </Item.Description>
        </Item.Content>
      </Item.Root>
    {/each}
  </Item.Group>
</Card.Root>
