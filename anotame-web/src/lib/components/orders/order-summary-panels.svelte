<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { DetailRow } from '$lib/components/common';
  import { Separator } from '$lib/components/ui/separator';
  import { formatCurrency, formatDateTime } from '$lib/utils/formatUtils';
  import type { OrderResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  /** Customer and order/payment summary shown side by side on the order detail page. */
  interface Props {
    order: OrderResponse;
  }

  let { order }: Props = $props();
</script>

<div class="grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Customer Info -->
  <Card.Root class="p-4 sm:p-6">
    <Card.Title class="mb-4 text-lg font-bold">{m["orders.detail.customer"]()}</Card.Title>
    <div class="space-y-4 text-sm">
      <DetailRow label={m["orders.detail.name"]()}>
        <span class="min-w-0 wrap-break-word font-semibold">{order.customer.firstName} {order.customer.lastName}</span>
      </DetailRow>
      <DetailRow label={m["orders.detail.email"]()}>
        <span class="min-w-0 wrap-break-word">{order.customer.email || '-'}</span>
      </DetailRow>
      <DetailRow label={m["orders.detail.phone"]()}>
        <span class="min-w-0 wrap-break-word">{order.customer.phoneNumber || "-"}</span>
      </DetailRow>
    </div>
  </Card.Root>

  <!-- Order Info & Payment -->
  <Card.Root class="p-4 sm:p-6">
    <Card.Title class="mb-4 text-lg font-bold">{m["orders.detail.orderDetails"]()}</Card.Title>
    <div class="space-y-3 text-sm">
      <DetailRow label={m["orders.detail.created"]()} layout="spread">
        <span class="max-w-full wrap-break-word whitespace-normal font-mono bg-secondary/30 px-2 py-1 rounded sm:text-right">{formatDateTime(order.createdAt)}</span>
      </DetailRow>
      <DetailRow label={m["orders.detail.estimatedDelivery"]()} layout="spread">
        <span class="max-w-full wrap-break-word whitespace-normal font-medium bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 sm:text-right">{formatDateTime(order.committedDeadline)}</span>
      </DetailRow>
      <DetailRow label={m["orders.detail.workload"]()} layout="spread">
        <span class="font-bold text-foreground">{order.totalDurationMin || 0} min</span>
      </DetailRow>

      {#if order.priceListName}
        <DetailRow label={m["orders.detail.priceList"]()} layout="spread">
          <span class="min-w-0 wrap-break-word font-medium sm:text-right">{order.priceListName}</span>
        </DetailRow>
      {/if}

      <Separator class="my-4" />

      <DetailRow label={m["orders.detail.paymentMethod"]()} layout="spread">
        <span class="font-bold text-foreground">
          {order.paymentMethod === 'CASH' ? m["orders.detail.paymentCash"]() : order.paymentMethod === 'CARD' ? m["orders.detail.paymentCard"]() : order.paymentMethod === 'TRANSFER' ? m["orders.detail.paymentTransfer"]() : order.paymentMethod || '-'}
        </span>
      </DetailRow>
      <DetailRow label={m["orders.detail.total"]()} layout="spread">
        <span class="font-medium text-lg">{formatCurrency(order.totalAmount)}</span>
      </DetailRow>
      <DetailRow label={m["orders.detail.amountPaid"]()} layout="spread">
        <span class="font-bold text-success-text text-lg">-{formatCurrency(order.amountPaid)}</span>
      </DetailRow>
      <DetailRow label={m["orders.detail.balance"]()} layout="spread" emphasis class="border-t border-border pt-3 mt-1">
        <span class={`text-2xl font-black ${((order.totalAmount || 0) - (order.amountPaid || 0)) > 0.01 ? 'text-destructive' : 'text-primary'}`}>
          {formatCurrency(Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0)))}
        </span>
      </DetailRow>
    </div>
  </Card.Root>
</div>
