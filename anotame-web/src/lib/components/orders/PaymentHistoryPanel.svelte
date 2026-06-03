<script lang="ts">
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency, formatDateTime } from '$lib/utils/formatUtils';
  import * as m from '$lib/paraglide/messages';

  type Payment = {
    id: string;
    amount: number;
    paymentMethod?: string | null;
    notes?: string | null;
    method?: string | null;
    note?: string | null;
    recordedAt: string;
  };

  type Props = {
    orderId: string;
    refreshKey?: number;
  };

  let { orderId, refreshKey = 0 }: Props = $props();

  let payments = $state<Payment[]>([]);
  let loading = $state(true);

  function methodLabel(method: string | null | undefined): string {
    if (method === 'CASH') return m['orders.detail.paymentCash']();
    if (method === 'CARD') return m['orders.detail.paymentCard']();
    if (method === 'TRANSFER') return m['orders.detail.paymentTransfer']();
    return method || '-';
  }

  function getPaymentMethod(payment: Payment): string | null | undefined {
    return payment.paymentMethod ?? payment.method;
  }

  function noteLabel(payment: Payment): string | null {
    const note = payment.notes ?? payment.note ?? null;
    if (note === 'DELIVERY_SETTLEMENT') {
      return m['orders.payment.deliverySettlementNote']();
    }

    return note;
  }

  $effect(() => {
    // refreshKey is tracked so parent can trigger a reload by incrementing it
    void refreshKey;
    if (!orderId) return;

    let cancelled = false;
    loading = true;

    apiService.request<Payment[]>(`${API_SALES}/orders/${orderId}/payments`)
      .then(res => { if (!cancelled) { payments = res ?? []; loading = false; } })
      .catch(() => { if (!cancelled) loading = false; });

    return () => { cancelled = true; };
  });
</script>

<div class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
  <div class="px-6 py-4 border-b border-border font-bold text-lg bg-secondary/20">
    {m['orders.payment.historyTitle']()}
  </div>

  {#if loading}
    <div class="px-6 py-8 text-center text-muted-foreground text-sm animate-pulse">
      {m['orders.detail.loading']()}
    </div>
  {:else if payments.length === 0}
    <div class="px-6 py-8 text-center text-muted-foreground text-sm">
      {m['orders.payment.emptyHistory']()}
    </div>
  {:else}
    <div class="divide-y divide-border">
      {#each payments as payment}
        <div class="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
          <!-- Amount -->
          <span class={`font-bold text-base font-mono w-24 shrink-0 ${payment.amount < 0 ? 'text-destructive' : 'text-success'}`}>
            {payment.amount < 0 ? '' : '+'}{formatCurrency(payment.amount)}
          </span>

          <!-- Method badge -->
          <span class="bg-secondary/50 text-secondary-foreground text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
            {methodLabel(getPaymentMethod(payment))}
          </span>

          <!-- Note -->
          {#if noteLabel(payment)}
            <span class="text-muted-foreground italic flex-1 truncate">{noteLabel(payment)}</span>
          {:else}
            <span class="flex-1"></span>
          {/if}

          <!-- Date -->
          <span class="text-muted-foreground font-mono text-xs whitespace-nowrap shrink-0">
            {formatDateTime(payment.recordedAt)}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>
