<script lang="ts">
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';
  import { Banknote, Loader2, AlertTriangle } from '@lucide/svelte';

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
  <Card.Header class="flex flex-row items-center justify-between pb-2">
    <Card.Title class="text-sm font-medium">{m['kpi.card.receivables']()}</Card.Title>
    <Banknote class="h-4 w-4 text-muted-foreground" />
  </Card.Header>
  <Card.Content class="space-y-3">
    <div>
      <div class="text-3xl font-bold font-mono text-amber-500">
        {formatCurrency(openReceivable)}
      </div>
      <p class="mt-1 text-xs text-muted-foreground">{m['kpi.receivables.openDesc']()}</p>
    </div>

    <div class="border-t pt-3">
      <div class="text-xl font-bold font-mono text-destructive">
        {formatCurrency(deliveredUnpaid)}
      </div>
      <p class="mt-1 text-xs text-muted-foreground">{m['kpi.receivables.deliveredDesc']()}</p>
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
      <div class="flex justify-center py-10">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    {:else if breakdown}
      {#if !breakdown.ledgerReconciled}
        <div
          class="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs"
        >
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>
            {m['kpi.receivables.driftWarning']({
              amount: formatCurrency(breakdown.ledgerDifference)
            })}
          </span>
        </div>
      {/if}

      <div class="space-y-2">
        <h3 class="text-sm font-medium">{m['kpi.receivables.agingTitle']()}</h3>
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
            <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div class="h-full rounded-full bg-amber-500" style="width: {widthPct}%"></div>
            </div>
          </div>
        {/each}
      </div>

      {#if breakdown.byStatus.length > 0}
        <div class="space-y-2">
          <h3 class="text-sm font-medium">{m['kpi.receivables.byStatusTitle']()}</h3>
          <div class="flex flex-wrap gap-2">
            {#each breakdown.byStatus as entry (entry.status)}
              <span class="rounded-md border px-2 py-1 text-xs">
                {entry.status}
                <span class="ml-1 font-mono">{formatCurrency(entry.balance)}</span>
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <div class="flex gap-2 border-b pt-2">
        <Button
          variant={showDelivered ? 'ghost' : 'default'}
          size="sm"
          onclick={() => selectTab(false)}
        >
          {m['kpi.receivables.tabOpen']()} ({breakdown.openOrderCount})
        </Button>
        <Button
          variant={showDelivered ? 'default' : 'ghost'}
          size="sm"
          onclick={() => selectTab(true)}
        >
          {m['kpi.receivables.tabDelivered']()} ({breakdown.deliveredUnpaidOrderCount})
        </Button>
      </div>

      {#if loading}
        <div class="flex justify-center py-8">
          <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      {:else if orders && orders.items.length > 0}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-xs text-muted-foreground">
              <tr class="border-b">
                <th class="p-2 text-left whitespace-nowrap">{m['kpi.receivables.colTicket']()}</th>
                <th class="p-2 text-left">{m['kpi.receivables.colCustomer']()}</th>
                <th class="p-2 text-right">{m['kpi.receivables.colTotal']()}</th>
                <th class="p-2 text-right">{m['kpi.receivables.colPaid']()}</th>
                <th class="p-2 text-right">{m['kpi.receivables.colBalance']()}</th>
                <th class="p-2 text-right">{m['kpi.receivables.colDays']()}</th>
              </tr>
            </thead>
            <tbody>
              {#each orders.items as order (order.id)}
                <tr class="border-b last:border-0">
                  <td class="p-2 font-mono text-xs whitespace-nowrap">{order.ticketNumber}</td>
                  <td class="p-2">{order.customerName ?? '—'}</td>
                  <td class="p-2 text-right font-mono">{formatCurrency(order.totalAmount)}</td>
                  <td class="p-2 text-right font-mono">{formatCurrency(order.amountPaid)}</td>
                  <td class="p-2 text-right font-mono font-medium text-amber-600">
                    {formatCurrency(order.balance)}
                  </td>
                  <td
                    class="p-2 text-right font-mono {order.daysOutstanding > 90
                      ? 'text-destructive'
                      : ''}"
                  >
                    {order.daysOutstanding}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {m['kpi.receivables.totalBalance']({
              amount: formatCurrency(orders.totalBalance)
            })}
          </span>
          {#if orders.totalPages > 1}
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onclick={() => (page = page - 1)}
              >
                {m['kpi.receivables.prev']()}
              </Button>
              <span>{page + 1} / {orders.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= orders.totalPages - 1}
                onclick={() => (page = page + 1)}
              >
                {m['kpi.receivables.next']()}
              </Button>
            </div>
          {/if}
        </div>
      {:else}
        <p class="py-8 text-center text-sm text-muted-foreground">
          {m['kpi.receivables.empty']()}
        </p>
      {/if}
    {/if}
  </Dialog.Content>
</Dialog.Root>
