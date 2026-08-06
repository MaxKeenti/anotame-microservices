<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { apiService, API_SALES, API_OPERATIONS } from "$lib/services/api.svelte";
  import type { OrderResponse, OrderItemResponse, Establishment } from "$lib/types/dtos";
  import { generateReceiptHtml } from "$lib/utils/receipt-generator";
  import StatusBadge from "$lib/components/ui/StatusBadge.svelte";
  import { formatCurrency, formatDateTime } from "$lib/utils/formatUtils";
  import { Button } from "$lib/components/ui/button";
  import AddPaymentModal from "$lib/components/orders/AddPaymentModal.svelte";
  import PaymentHistoryPanel from "$lib/components/orders/PaymentHistoryPanel.svelte";
  import ShareTicketDialog from "$lib/components/orders/ShareTicketDialog.svelte";
  import CardGridWrapper from '$lib/components/ui/CardGridWrapper.svelte';
  import { useIsMobile } from '$lib/hooks/use-mobile.svelte';
  import * as Table from "$lib/components/ui/table";
  import type { ColumnDef, Row } from '@tanstack/table-core';
  import { toast } from "svelte-sonner";
  import { adaptiveConfirm } from "$lib/components/ui/responsive/confirm-state.svelte";
  import { Pencil, Printer, Send, Share2, XCircle } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages';

  let id = $derived($page.params.id);
  let action = $derived($page.url.searchParams.get("action"));

  let order = $state<OrderResponse | null>(null);
  let loading = $state(true);
  let establishment = $state<Establishment | null>(null);
  let auditLog = $state<any[]>([]);
  let showPaymentModal = $state(false);
  let paymentRefreshKey = $state(0);
  let showShareTicketDialog = $state(false);
  const mobile = useIsMobile();

  let itemColumns = $derived<ColumnDef<OrderItemResponse>[]>([
    { accessorKey: 'garmentName', header: m['orders.detail.description'](), enableSorting: false, meta: { cardGroup: 'header' } },
    { accessorKey: 'quantity', header: m['orders.detail.qty'](), enableSorting: false, meta: { cardGroup: 'header' } },
    { id: 'subtotal', accessorFn: (item) => `$${item.subtotal}`, header: m['orders.detail.subtotal'](), enableSorting: false, meta: { cardGroup: 'header' } },
    { id: 'services', accessorFn: (item) => item.services.map((service) => service.serviceName).join(', '), header: m['orders.detail.service'](), enableSorting: false, meta: { cardGroup: 'body' } },
    { accessorKey: 'notes', header: m['orders.detail.note'](), enableSorting: false, meta: { cardGroup: 'body' } },
  ]);

  onMount(async () => {
    // Non-blocking establishment fetch
    apiService.request<Establishment>(`${API_OPERATIONS}/establishment`)
      .then(res => establishment = res)
      .catch(e => console.warn('Could not load establishment settings (non-blocking):', e));
  });

  // Watch for ID changes to fetch order
  $effect(() => {
    if (!id) return;
    
    let isCancelled = false;
    const fetchOrder = async () => {
      try {
        loading = true;
        const [res, log] = await Promise.all([
          apiService.request<OrderResponse>(`${API_SALES}/orders/${id}`),
          apiService.request<any[]>(`${API_SALES}/orders/${id}/audit`).catch(() => [])
        ]);
        if (!isCancelled) {
          order = res;
          auditLog = log ?? [];
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!isCancelled) loading = false;
      }
    };
    fetchOrder();

    return () => { isCancelled = true; };
  });

  // Handle auto-print action
  $effect(() => {
    // We only need the order to be loaded; establishment can be null (we have fallbacks in handlePrint)
    if (action === 'print' && order && !loading) {
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState(null, '', url.toString());

      setTimeout(async () => {
        const ok = await adaptiveConfirm({
          title: m["orders.detail.createdTitle"](),
          description: m["orders.detail.createdDescription"]()
        });
        if (ok) handlePrint();
      }, 500);
    }
  });

  async function handleCancel() {
    if (!order) return;
    const ok = await adaptiveConfirm({
      title: m["orders.detail.cancelTitle"](),
      description: m["orders.detail.cancelDescription"]()
    });
    if (!ok) return;
    try {
      await apiService.request(`${API_SALES}/orders/${order.id}`, { method: "DELETE" });
      toast.success(m["orders.detail.cancelSuccess"]());
      goto("/dashboard/orders");
    } catch (e: any) {
      console.error(e);
      toast.error(m["orders.detail.cancelError"](), { description: e?.message });
    }
  }

  function handlePrint() {
    if (!order) return;

    let taxInfoParsed: any = undefined;
    if (establishment?.taxInfo) {
      try { taxInfoParsed = JSON.parse(establishment.taxInfo); } catch(e){}
    }

    const receiptHtml = generateReceiptHtml({
      ticketNumber: order.ticketNumber,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      phone: order.customer.phoneNumber,
      deadline: order.committedDeadline || new Date().toISOString(),
      items: order.items.map((i: OrderItemResponse) => ({
        garment: i.garmentName,
        services: i.services?.map((s) => ({
          name: s.serviceName,
          price: s.unitPrice,
          adjustment: s.adjustmentAmount,
          adjustmentReason: s.adjustmentReason,
          instructions: s.instructions
        })) || [],
        notes: i.notes,
      })),
      total: order.totalAmount,
      amountPaid: order.amountPaid || 0,
      balance: Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0)),
      establishment: {
        name: establishment?.name || "ANOTAME",
        address: taxInfoParsed?.address,
        rfc: taxInfoParsed?.rfc,
        taxRegime: taxInfoParsed?.regime,
        contactPhone: taxInfoParsed?.contactPhone,
      },
      pickupCode: order.pickupCode
    });

    const newWindow = window.open('', '_blank', 'width=400,height=600');
    if (newWindow) {
      newWindow.document.write(receiptHtml);
      newWindow.document.close();
      newWindow.setTimeout(() => {
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }, 250);
    }
  }

  async function handlePaymentSuccess() {
    paymentRefreshKey += 1;
    try {
      const res = await apiService.request<OrderResponse>(`${API_SALES}/orders/${id}`);
      order = res;
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendToOps() {
    if (!order) return;
    const ok = await adaptiveConfirm({
      title: m["orders.detail.sendToOpsTitle"](),
      description: m["orders.detail.sendToOpsDescription"]()
    });
    if (!ok) return;
    try {
      await apiService.request(`${API_SALES}/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });

      toast.success(m["orders.detail.sendToOpsSuccess"]());
      loading = true;
      const res = await apiService.request<OrderResponse>(`${API_SALES}/orders/${id}`);
      order = res;
    } catch (e: any) {
      console.error(e);
      toast.error(m["orders.detail.connectionError"](), { description: e.message });
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <div class="flex flex-col h-[60vh] items-center justify-center p-8 text-center text-muted-foreground animate-pulse gap-4">
    <div class="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    <div class="text-lg font-medium">{m["orders.detail.loading"]()}</div>
    <div class="text-sm opacity-50 font-mono">ID: {id}</div>
  </div>
{:else if !order}
  <div class="flex flex-col h-[60vh] items-center justify-center p-8 text-center gap-6 animate-in fade-in zoom-in-95">
    <div class="bg-destructive/10 p-6 rounded-full">
      <svg class="w-16 h-16 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <div>
      <h2 class="text-2xl font-bold text-destructive">{m["orders.detail.notFound"]()}</h2>
      <p class="text-muted-foreground mt-2 max-w-md">{m["orders.detail.notFoundDescription"]()}</p>
    </div>
    <Button href="/dashboard/orders" variant="outline" class="h-12 px-8 rounded-xl touch-manipulation">
      {m["orders.detail.backToList"]()}
    </Button>
  </div>
{:else}
  <div class="w-full min-w-0 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150 pb-20">
    <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      <a href="/dashboard/orders" class="shrink-0 text-muted-foreground hover:text-foreground touch-manipulation">
        &larr; {m["orders.detail.back"]()}
      </a>
      <h1 class="min-w-0 max-w-full text-xl sm:text-2xl font-bold wrap-break-word">{m["orders.detail.orderTitle"]({ ticket: order.ticketNumber })}</h1>
      <StatusBadge status={order.status} />
    </div>

    <div class="grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Customer Info -->
      <div class="min-w-0 bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm">
        <h3 class="font-bold mb-4 text-lg">{m["orders.detail.customer"]()}</h3>
        <div class="space-y-4 text-sm">
          <p class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.name"]()}:</span>
            <span class="min-w-0 wrap-break-word font-semibold">{order.customer.firstName} {order.customer.lastName}</span>
          </p>
          <p class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.email"]()}:</span>
            <span class="min-w-0 wrap-break-word">{order.customer.email || '-'}</span>
          </p>
          <p class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.phone"]()}:</span>
            <span class="min-w-0 wrap-break-word">{order.customer.phoneNumber || "-"}</span>
          </p>
        </div>
      </div>

      <!-- Order Info & Payment -->
      <div class="min-w-0 bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm">
        <h3 class="font-bold mb-4 text-lg">{m["orders.detail.orderDetails"]()}</h3>
        <div class="space-y-3 text-sm">
          <div class="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.created"]()}:</span>
            <span class="max-w-full wrap-break-word whitespace-normal font-mono bg-secondary/30 px-2 py-1 rounded sm:text-right">{formatDateTime(order.createdAt)}</span>
          </div>
          <div class="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.estimatedDelivery"]()}:</span>
            <span class="max-w-full wrap-break-word whitespace-normal font-medium bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 sm:text-right">{formatDateTime(order.committedDeadline)}</span>
          </div>
          <div class="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.workload"]()}:</span>
            <span class="font-bold text-foreground">{order.totalDurationMin || 0} min</span>
          </div>

          {#if order.priceListName}
            <div class="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.priceList"]()}:</span>
              <span class="min-w-0 wrap-break-word font-medium sm:text-right">{order.priceListName}</span>
            </div>
          {/if}

          <div class="h-px bg-border my-4"></div>

          <div class="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.paymentMethod"]()}:</span>
            <span class="font-bold text-foreground">
              {order.paymentMethod === 'CASH' ? m["orders.detail.paymentCash"]() : order.paymentMethod === 'CARD' ? m["orders.detail.paymentCard"]() : order.paymentMethod === 'TRANSFER' ? m["orders.detail.paymentTransfer"]() : order.paymentMethod || '-'}
            </span>
          </div>
          <div class="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.total"]()}:</span>
            <span class="font-medium text-lg">{formatCurrency(order.totalAmount)}</span>
          </div>
          <div class="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span class="shrink-0 text-muted-foreground font-medium">{m["orders.detail.amountPaid"]()}:</span>
            <span class="font-bold text-success text-lg">-{formatCurrency(order.amountPaid)}</span>
          </div>
          <div class="border-t border-border pt-3 mt-1 flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span class="shrink-0 font-bold uppercase tracking-wider text-muted-foreground">{m["orders.detail.balance"]()}:</span>
            <span class={`text-2xl font-black ${((order.totalAmount || 0) - (order.amountPaid || 0)) > 0.01 ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0)))}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Notes -->
    {#if order.notes}
      <div class="min-w-0 bg-warning/10 p-4 sm:p-5 rounded-2xl border-2 border-warning/30 text-warning-text shadow-sm">
        <h3 class="font-bold mb-2 text-sm uppercase tracking-wider opacity-80 flex items-center gap-2">{m["orders.detail.generalNotes"]()}</h3>
        <p class="wrap-break-word text-base font-medium">{order.notes}</p>
      </div>
    {/if}

    <!-- Payment History -->
    <PaymentHistoryPanel
      orderId={order.id}
      refreshKey={paymentRefreshKey}
      onRecordPayment={order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
        ? () => showPaymentModal = true
        : undefined}
    />

    <!-- Items -->
    <div class="min-w-0 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div class="wrap-break-word px-4 sm:px-6 py-4 border-b border-border font-bold text-lg bg-secondary/20">{m["orders.detail.garmentsAndServices"]()}</div>
      {#snippet garmentCell(row: Row<OrderItemResponse>)}
        <div class="flex flex-wrap items-center gap-2">
          <span>{row.original.garmentName}</span>
          {#if row.original.source === 'CUSTOM'}
            <span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium uppercase tracking-wide text-primary">{m['orders.custom.badge']()}</span>
          {/if}
        </div>
      {/snippet}
      {#snippet servicesCell(row: Row<OrderItemResponse>)}
        <div class="space-y-2">
          {#each row.original.services as service}
            <div class="min-w-0">
              <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span class="font-medium text-foreground">{service.serviceName}</span>
                <span class="font-mono text-foreground">${service.unitPrice}</span>
              </div>
              {#if service.instructions}
                <p class="mt-1 text-sm text-muted-foreground">{service.instructions}</p>
              {/if}
              {#if service.adjustmentAmount && service.adjustmentAmount !== 0}
                <span class={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-mono font-bold ${service.adjustmentAmount > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                  {service.adjustmentAmount > 0 ? '+' : ''}{service.adjustmentAmount}
                  {service.adjustmentReason && ` (${service.adjustmentReason})`}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      {/snippet}
      {#snippet notesCell(row: Row<OrderItemResponse>)}
        {#if row.original.notes}
          <span class="inline-block rounded-lg border border-warning/20 bg-warning/10 p-2 text-warning-text">{row.original.notes}</span>
        {:else}
          <span class="text-muted-foreground">—</span>
        {/if}
      {/snippet}

      {#if mobile.current}
        <div class="p-4">
          <CardGridWrapper
            columns={itemColumns}
            data={order.items}
            showFilter={false}
            showPagination={false}
            cellRenders={{ garmentName: garmentCell, services: servicesCell, notes: notesCell }}
          />
        </div>
      {:else}
        <div class="max-w-full overflow-x-auto overscroll-x-contain">
        <Table.Root class="w-full text-sm text-left">
          <Table.Header class="bg-muted/30 text-muted-foreground uppercase text-xs font-bold">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="px-6 py-4 font-bold h-auto">{m["orders.detail.description"]()}</Table.Head>
              <Table.Head class="px-6 py-4 font-bold h-auto">{m["orders.detail.service"]()}</Table.Head>
              <Table.Head class="px-6 py-4 font-bold h-auto text-center">{m["orders.detail.qty"]()}</Table.Head>
              <Table.Head class="px-6 py-4 font-bold h-auto">{m["orders.detail.price"]()}</Table.Head>
              <Table.Head class="px-6 py-4 font-bold h-auto text-right">{m["orders.detail.subtotal"]()}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="divide-y divide-border">
            {#each order.items as item}
              <Table.Row class="hover:bg-muted/10 transition-colors">
                <Table.Cell class="px-6 py-4 align-top">
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="font-bold text-base">{item.garmentName}</div>
                    {#if item.source === 'CUSTOM'}
                      <span class="text-xs font-medium uppercase tracking-wide bg-primary/10 text-primary px-2 py-1 rounded-full">{m['orders.custom.badge']()}</span>
                    {/if}
                  </div>
                  {#if item.notes}
                    <div class="text-sm mt-2 bg-warning/10 text-warning-text p-2 rounded-lg border border-warning/20 inline-block">
                      <span class="font-bold mr-1">{m["orders.detail.note"]()}:</span>{item.notes}
                    </div>
                  {/if}
                </Table.Cell>
                <Table.Cell colspan={3} class="px-0 py-0 align-top">
                  <Table.Root class="w-full">
                    <Table.Body class="divide-y divide-border/20">
                      {#each item.services as service}
                        <Table.Row class="hover:bg-transparent border-0">
                          <Table.Cell class="px-6 py-3 w-1/3 text-muted-foreground font-medium">
                            <div class="flex flex-wrap items-center gap-2">
                              <span>{service.serviceName}</span>
                              {#if service.source === 'CUSTOM'}
                                <span class="text-xs font-medium uppercase tracking-wide text-primary">{m['orders.custom.badge']()}</span>
                              {/if}
                            </div>
                            {#if service.instructions}
                              <div class="text-sm font-normal mt-1">{service.instructions}</div>
                            {/if}
                          </Table.Cell>
                          <Table.Cell class="px-6 py-3 w-1/3 text-center font-mono bg-secondary/10">{item.quantity}</Table.Cell>
                          <Table.Cell class="px-6 py-3 w-1/3">
                            <div class="font-mono text-foreground">${service.unitPrice}</div>
                            {#if service.adjustmentAmount && service.adjustmentAmount !== 0}
                              <div class={`text-xs mt-1 font-mono font-bold ${service.adjustmentAmount > 0 ? 'text-destructive bg-destructive/10' : 'text-success bg-success/10'} px-2 py-0.5 rounded-md inline-block`}>
                                {service.adjustmentAmount > 0 ? '+' : ''}{service.adjustmentAmount}
                                {service.adjustmentReason && ` (${service.adjustmentReason})`}
                              </div>
                            {/if}
                          </Table.Cell>
                        </Table.Row>
                      {/each}
                    </Table.Body>
                  </Table.Root>
                </Table.Cell>
                <Table.Cell class="px-6 py-4 font-bold text-lg font-mono align-top text-right text-primary">${item.subtotal}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
      {/if}
    </div>

    <!-- Pickup code and ticket tools -->
    <div class="min-w-0 bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm text-center">
      {#if order.pickupCode}
        <p class="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">{m["orders.detail.pickupCode"]()}</p>
        <p class="text-2xl font-semibold tracking-widest font-mono">{order.pickupCode}</p>
      {/if}
      <div class="flex flex-col justify-center gap-2 sm:flex-row" class:mt-4={order.pickupCode}>
        <Button onclick={() => showShareTicketDialog = true} variant="outline" class="h-10 touch-manipulation">
          <Share2 />
          {m["orders.detail.shareTicket"]()}
        </Button>
        <Button onclick={handlePrint} variant="outline" class="h-10 touch-manipulation">
          <Printer />
          {m["orders.detail.printTicket"]()}
        </Button>
      </div>
    </div>

    <!-- Order management -->
    <div class="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div class="px-4 py-4 text-lg font-bold bg-secondary/20 sm:px-6">{m['common.actions']()}</div>
      <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div class="flex flex-col gap-2 sm:flex-row">
          {#if order.status === 'RECEIVED'}
            <Button onclick={handleSendToOps} class="h-11 touch-manipulation">
              <Send />
              {m["orders.detail.sendToOps"]()}
            </Button>
          {/if}
          {#if order.status !== 'DELIVERED' && order.status !== 'CANCELLED'}
            <Button href={`/dashboard/orders/${order.id}/edit`} variant="outline" class="h-11 touch-manipulation">
              <Pencil />
              {m["orders.detail.editOrder"]()}
            </Button>
          {/if}
        </div>
        <Button onclick={handleCancel} variant="destructive" class="h-11 touch-manipulation">
          <XCircle />
          {m["orders.detail.cancelOrder"]()}
        </Button>
      </div>
    </div>

    <!-- Audit Log -->
    {#if auditLog.length > 0}
      <div class="min-w-0 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div class="px-6 py-4 border-b border-border font-bold text-lg bg-secondary/20">{m["orders.detail.auditLog"]()}</div>
        <div class="divide-y divide-border">
          {#each auditLog as entry}
            <div class="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
              <span class="text-muted-foreground font-mono text-xs whitespace-nowrap">{formatDateTime(entry.changedAt)}</span>
              <span class="font-semibold capitalize">{entry.fieldName}</span>
              <span class="text-muted-foreground flex-1">
                <span class="line-through opacity-60">{entry.oldValue ?? '—'}</span>
                <span class="mx-2">→</span>
                <span class="text-foreground font-medium">{entry.newValue ?? '—'}</span>
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <AddPaymentModal
      bind:open={showPaymentModal}
      orderId={order.id}
      orderTotal={order.totalAmount ?? 0}
      amountPaid={order.amountPaid ?? 0}
      onSuccess={handlePaymentSuccess}
      onClose={() => showPaymentModal = false}
    />

    <ShareTicketDialog
      bind:open={showShareTicketDialog}
      orderId={order.id}
      ticketNumber={order.ticketNumber}
    />
  </div>
{/if}
