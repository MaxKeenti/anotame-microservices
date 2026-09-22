<script lang="ts">
  import { Heading, Text } from '$lib/components/ui/typography';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { Progress } from '$lib/components/ui/progress';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { StatusBadge, InlineAlert, SimplePager, StatePanel } from '$lib/components/common';
  import * as Table from '$lib/components/ui/table';
  import * as Tabs from '$lib/components/ui/tabs';
  import { cn } from '$lib/utils';
  import * as m from '$lib/paraglide/messages';
  import { Banknote } from '@lucide/svelte';

  type AgingBucket = { bucket: '0_30' | '31_60' | '61_90' | '90_PLUS'; orderCount: number; balance: number };
  type StatusBreakdown = { status: string; orderCount: number; balance: number };

  interface ReceivablesResponse {
    openReceivable: number;
    deliveredUnpaid: number;
    openOrderCount: number;
    deliveredUnpaidOrderCount: number;
    aging: AgingBucket[];
    byStatus: StatusBreakdown[];
    byBranch: { branchId: string; orderCount: number; balance: number }[];
    ledgerReconciled: boolean;
    ledgerDifference: number;
  }

  interface ReceivableOrderItem {
    id: string;
    ticketNumber: string;
    customerName: string | null;
    createdAt: string;
    committedDeadline: string | null;
    totalAmount: number;
    amountPaid: number;
    balance: number;
    daysOutstanding: number;
    status: string;
  }

  interface ReceivableOrderPageResponse {
    items: ReceivableOrderItem[];
    page: number;
    size: number;
    total: number;
    totalPages: number;
    totalBalance: number;
  }

  type Props = {
    openReceivable: number;
    deliveredUnpaid: number;
  };

  let { openReceivable, deliveredUnpaid }: Props = $props();

  const PAGE_SIZE = 10;
  const BUCKET_LABELS: Record<AgingBucket['bucket'], () => string> = {
    '0_30': () => m['kpi.receivables.agingCurrent'](),
    '31_60': () => m['kpi.receivables.agingOneMonth'](),
    '61_90': () => m['kpi.receivables.agingTwoMonths'](),
    '90_PLUS': () => m['kpi.receivables.agingStale']()
  };

  let detailOpen = $state(false);
  // false = tickets still in the shop, true = garments already handed over.
  let showDelivered = $state(false);
  let page = $state(0);
  let breakdown = $state<ReceivablesResponse | null>(null);
  let orders = $state<ReceivableOrderPageResponse | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let agingMax = $derived(
    breakdown?.aging.reduce((max, bucket) => Math.max(max, bucket.balance), 0) || 0
  );

  // Reset to the first page whenever the tab flips, so page 3 of "open" never leaks into "delivered".
  function selectTab(delivered: boolean) {
    if (showDelivered === delivered) return;
    showDelivered = delivered;
    page = 0;
  }

  $effect(() => {
    if (!detailOpen) return;
    void showDelivered;
    void page;

    let cancelled = false;
    loading = true;
    error = null;

    Promise.all([
      apiService.request<ReceivablesResponse>(`${API_SALES}/orders/kpi/receivables`),
      apiService.request<ReceivableOrderPageResponse>(
        `${API_SALES}/orders/kpi/receivables/orders?page=${page}&size=${PAGE_SIZE}&delivered=${showDelivered}`
      )
    ])
      .then(([breakdownRes, ordersRes]) => {
        if (cancelled) return;
        breakdown = breakdownRes;
        orders = ordersRes;
        loading = false;
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error loading receivables:', err);
        error = m['kpi.receivables.error']();
        loading = false;
      });

    return () => {
      cancelled = true;
    };
  });
</script>

<Card.Root>
  <Card.Header class="pb-2">
    <Card.Title class="text-sm font-medium">{m['kpi.card.receivables']()}</Card.Title>
    <Card.Action><Banknote class="h-4 w-4 text-muted-foreground" /></Card.Action>
  </Card.Header>
  <Card.Content class="space-y-3">
    <div>
      <Text variant="metric" size="lg" as="div" class="text-warning-text">
        {formatCurrency(openReceivable)}
      </Text>
      <Text variant="small" class="mt-1">{m['kpi.receivables.openDesc']()}</Text>
    </div>

    <div class="border-t pt-3">
      <Text variant="metric" size="sm" as="div" class="text-destructive">
        {formatCurrency(deliveredUnpaid)}
      </Text>
      <Text variant="small" class="mt-1">{m['kpi.receivables.deliveredDesc']()}</Text>
    </div>

    <Button variant="outline" size="sm" class="w-full" onclick={() => (detailOpen = true)}>
      {m['kpi.receivables.viewDetail']()}
    </Button>
  </Card.Content>
</Card.Root>

<Dialog.Root bind:open={detailOpen}>
  <Dialog.Content class="max-h-[85vh] overflow-y-auto sm:max-w-3xl lg:max-w-5xl">
    <Dialog.Header>
      <Dialog.Title>{m['kpi.receivables.detailTitle']()}</Dialog.Title>
      <Dialog.Description>{m['kpi.receivables.detailDesc']()}</Dialog.Description>
    </Dialog.Header>

    {#if error}
      <p class="py-6 text-center text-sm text-destructive">{error}</p>
    {:else if loading && !breakdown}
      <StatePanel message={m['common.loading']()} spinner size="inline" />
    {:else if breakdown}
      {#if !breakdown.ledgerReconciled}
        <InlineAlert
          text={m['kpi.receivables.driftWarning']({ amount: formatCurrency(breakdown.ledgerDifference) })}
        />
      {/if}

      <div class="space-y-2">
        <Heading level={4} as="h3">{m['kpi.receivables.agingTitle']()}</Heading>
        {#each breakdown.aging as bucket (bucket.bucket)}
          {@const widthPct = agingMax > 0 ? (bucket.balance / agingMax) * 100 : 0}
          <div class="space-y-1">
            <div class="flex items-baseline justify-between text-xs">
              <span class="text-muted-foreground">{BUCKET_LABELS[bucket.bucket]()}</span>
              <span class="font-mono">
                {formatCurrency(bucket.balance)}
                <span class="ml-1 text-muted-foreground">({bucket.orderCount})</span>
              </span>
            </div>
            <Progress
              value={widthPct}
              class="h-2"
              indicatorClass="bg-warning"
              aria-label={BUCKET_LABELS[bucket.bucket]()}
            />
          </div>
        {/each}
      </div>

      {#if breakdown.byStatus.length > 0}
        <div class="space-y-2">
          <Heading level={4} as="h3">{m['kpi.receivables.byStatusTitle']()}</Heading>
          <div class="flex flex-wrap gap-2">
            {#each breakdown.byStatus as entry (entry.status)}
              <span class="flex items-center gap-2 rounded-md border px-2 py-1">
                <StatusBadge status={entry.status} />
                <span class="font-mono text-xs">{formatCurrency(entry.balance)}</span>
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <Tabs.Root
        value={showDelivered ? 'delivered' : 'open'}

        onValueChange={(v) => selectTab(v === 'delivered')}

        class="gap-4 pt-2"

      >

        <Tabs.List>

          <Tabs.Trigger value="open">

            {m['kpi.receivables.tabOpen']()} ({breakdown.openOrderCount})

          </Tabs.Trigger>

          <Tabs.Trigger value="delivered">

            {m['kpi.receivables.tabDelivered']()} ({breakdown.deliveredUnpaidOrderCount})

          </Tabs.Trigger>

        </Tabs.List>

        <!-- Both tabs show the same order table; the selected tab only changes its filter. -->

        <Tabs.Content value="open" class="space-y-4">{@render ordersTable()}</Tabs.Content>

        <Tabs.Content value="delivered" class="space-y-4">{@render ordersTable()}</Tabs.Content>

      </Tabs.Root>
    {/if}
  </Dialog.Content>
</Dialog.Root>

{#snippet ordersTable()}

  {#if loading}
    <StatePanel message={m['common.loading']()} spinner size="inline" />
  {:else if orders && orders.items.length > 0}
    <Table.Root>
      <Table.Header>
        <Table.Row class="hover:bg-transparent">
          <Table.Head class="whitespace-nowrap">{m['kpi.receivables.colTicket']()}</Table.Head>
          <Table.Head>{m['kpi.receivables.colCustomer']()}</Table.Head>
          <Table.Head class="text-right">{m['kpi.receivables.colTotal']()}</Table.Head>
          <Table.Head class="text-right">{m['kpi.receivables.colPaid']()}</Table.Head>
          <Table.Head class="text-right">{m['kpi.receivables.colBalance']()}</Table.Head>
          <Table.Head class="text-right">{m['kpi.receivables.colDays']()}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each orders.items as order (order.id)}
          <Table.Row>
            <Table.Cell class="font-mono text-xs whitespace-nowrap">{order.ticketNumber}</Table.Cell>
            <Table.Cell>{order.customerName ?? '—'}</Table.Cell>
            <Table.Cell class="text-right font-mono">{formatCurrency(order.totalAmount)}</Table.Cell>
            <Table.Cell class="text-right font-mono">{formatCurrency(order.amountPaid)}</Table.Cell>
            <Table.Cell class="text-right font-mono font-medium text-warning-text">
              {formatCurrency(order.balance)}
            </Table.Cell>
            <Table.Cell class={cn('text-right font-mono', order.daysOutstanding > 90 && 'text-destructive')}>
              {order.daysOutstanding}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
      </Table.Root>

    <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>
        {m['kpi.receivables.totalBalance']({
          amount: formatCurrency(orders.totalBalance)
        })}
      </span>
      {#if orders.totalPages > 1}
        <SimplePager
          class="px-0"
          pageIndex={page}
          pageCount={orders.totalPages}
          onPrevious={() => (page = page - 1)}
          onNext={() => (page = page + 1)}
        />
      {/if}
    </div>
  {:else}
    <StatePanel message={m['kpi.receivables.empty']()} size="inline" />
  {/if}
{/snippet}
