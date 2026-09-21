<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { X } from '@lucide/svelte';
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
    RECEIVED: m["order.status.received"],
    IN_PROGRESS: m["order.status.inProgress"],
    READY: m["order.status.ready"],
    DELIVERED: m["order.status.delivered"],
    CANCELLED: m["order.status.cancelled"],
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
<!--
  Position-agnostic: the parent (the bottom dock slot in the (app) layout)
  handles placement. Styled to match the dock pill so the swap feels native.
-->
<div
  role="toolbar"
  aria-label={m["order.bulk.title"]()}
  class="pointer-events-auto flex items-center gap-3 bg-background/85 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl px-4 py-2 max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar"
>
  <span class="text-sm font-semibold text-foreground whitespace-nowrap">{m["common.selected"]({ count: String(count) })}</span>

  <div class="flex items-center gap-2">
    <AdaptiveSelect
      bind:value={selectedStatus}
      placeholder={m["order.bulk.changeStatus"]()}
      items={statusItems}
      class="h-11 min-w-40 text-sm"
    />
    <Button
      variant="default"
      size="touch"
      class="whitespace-nowrap"
      disabled={!selectedStatus}
      onclick={handleChangeStatus}
    >
      {m["common.apply"]()}
    </Button>
  </div>

  {#snippet deleteButton()}
    <Button
      variant="destructive"
      size="touch"
      class="whitespace-nowrap"
      disabled={!allDraft}
      onclick={onDelete}
    >
      {m["order.bulk.deleteOrders"]()}
    </Button>
  {/snippet}

  {#if allDraft}
    {@render deleteButton()}
  {:else}
    <!--
      The button is disabled, so it swallows pointer events: the tooltip
      trigger has to live on a wrapper that can still receive them.
    -->
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger tabindex={0} class="shrink-0 cursor-not-allowed">
          {@render deleteButton()}
        </Tooltip.Trigger>
        <Tooltip.Content side="top">
          {m["order.bulk.deleteTooltip"]()}
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {/if}

  <Button
    variant="ghost"
    size="icon-touch"
    class="shrink-0"
    aria-label={m["order.bulk.cancelSelection"]()}
    onclick={onCancel}
  >
    <X class="w-4 h-4" />
  </Button>
</div>
{/if}
