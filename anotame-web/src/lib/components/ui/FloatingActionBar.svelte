<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { X } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages';

  type Props = {
    count: number;
    isAdmin: boolean;
    allDraft: boolean;
    onChangeStatus: (status: string) => Promise<void>;
    onDelete: () => Promise<void>;
    onCancel: () => void;
  };

  let { count, isAdmin, allDraft, onChangeStatus, onDelete, onCancel }: Props = $props();

  const statusLabelMap: Record<string, () => string> = {
    RECEIVED: m.order_status_received,
    IN_PROGRESS: m.order_status_inProgress,
    READY: m.order_status_ready,
    DELIVERED: m.order_status_delivered,
    CANCELLED: m.order_status_cancelled,
  };

  const adminStatuses = ['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'];
  const employeeStatuses = ['RECEIVED', 'IN_PROGRESS', 'READY'];

  let availableStatuses = $derived(isAdmin ? adminStatuses : employeeStatuses);

  let statusItems = $derived(availableStatuses.map(s => ({ value: s, label: statusLabelMap[s]() })));

  let selectedStatus = $state('');

  async function handleChangeStatus() {
    if (!selectedStatus) return;
    await onChangeStatus(selectedStatus);
    selectedStatus = '';
  }
</script>

{#if count > 0}
<div
  role="toolbar"
  aria-label={m.order_bulk_title()}
  class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border rounded-xl shadow-lg px-4 py-2"
>
  <span class="text-sm font-semibold text-foreground whitespace-nowrap">{m.common_selected({ count: String(count) })}</span>

  <div class="flex items-center gap-2">
    <AdaptiveSelect
      bind:value={selectedStatus}
      placeholder={m.order_bulk_changeStatus()}
      items={statusItems}
      class="h-9 min-w-[160px] text-sm"
    />
    <Button
      variant="default"
      size="sm"
      class="h-9 touch-manipulation"
      disabled={!selectedStatus}
      onclick={handleChangeStatus}
    >
      {m.common_apply()}
    </Button>
  </div>

  <Button
    variant="destructive"
    size="sm"
    class="h-9 touch-manipulation"
    disabled={!allDraft}
    title={!allDraft ? m.order_bulk_deleteTooltip() : undefined}
    onclick={onDelete}
  >
    {m.order_bulk_deleteOrders()}
  </Button>

  <Button
    variant="ghost"
    size="icon"
    class="h-9 w-9 touch-manipulation"
    aria-label={m.order_bulk_cancelSelection()}
    onclick={onCancel}
  >
    <X class="w-4 h-4" />
  </Button>
</div>
{/if}
