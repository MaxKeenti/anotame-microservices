<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency, formatDateTime } from '$lib/utils/formatUtils';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Item from '$lib/components/ui/item';
  import StatePanel from '$lib/components/common/state-panel.svelte';
  import PanelHeading from './panel-heading.svelte';
  import { DollarSign } from '@lucide/svelte';
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
    onRecordPayment?: () => void;
  };

  let { orderId, refreshKey = 0, onRecordPayment }: Props = $props();

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

<Card.Root class="min-w-0 gap-0 p-0">
  <PanelHeading title={m['orders.payment.historyTitle']()}>
    {#snippet action()}
      {#if onRecordPayment}
        <Button onclick={onRecordPayment} size="touch">
          <DollarSign data-icon="inline-start" />
          {m['orders.payment.recordPayment']()}
        </Button>
      {/if}
    {/snippet}
  </PanelHeading>

  {#if loading}
    <StatePanel message={m['orders.detail.loading']()} loading class="h-auto border-0 py-8" />
  {:else if payments.length === 0}
    <StatePanel message={m['orders.payment.emptyHistory']()} class="h-auto border-0 py-8" />
  {:else}
    <Item.Group class="gap-0 divide-y divide-border">
      {#each payments as payment}
        <Item.Root class="rounded-none px-4 sm:px-6">
          <Item.Media>
            <span class={`w-24 font-mono text-base font-bold ${payment.amount < 0 ? 'text-destructive' : 'text-success-text'}`}>
              {payment.amount < 0 ? '' : '+'}{formatCurrency(payment.amount)}
            </span>
          </Item.Media>
          <Item.Content class="min-w-0">
            <Item.Title>
              <Badge variant="secondary">{methodLabel(getPaymentMethod(payment))}</Badge>
            </Item.Title>
            {#if noteLabel(payment)}
              <Item.Description class="italic">{noteLabel(payment)}</Item.Description>
            {/if}
          </Item.Content>
          <Item.Actions>
            <span class="font-mono text-xs text-muted-foreground">{formatDateTime(payment.recordedAt)}</span>
          </Item.Actions>
        </Item.Root>
      {/each}
    </Item.Group>
  {/if}
</Card.Root>
