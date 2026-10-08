<script lang="ts">
  import { onMount } from "svelte";
  import * as Card from '$lib/components/ui/card';
  import { useRoute } from "$lib/desktop/route-context.svelte";
  import { apiService, API_SALES, API_OPERATIONS } from "$lib/services/api.svelte";
  import type { OrderResponse, OrderItemResponse, Establishment } from "$lib/types/dtos";
  import { generateReceiptHtml } from "$lib/utils/receipt-generator";
  import { ErrorState, InlineAlert, StatePanel, PageContainer } from '$lib/components/common';
  import { formatCurrency, formatDateTime } from "$lib/utils/formatUtils";
  import { Button } from "$lib/components/ui/button";
  import AddPaymentModal from "$lib/components/orders/add-payment-modal.svelte";
  import PaymentHistoryPanel from "$lib/components/orders/payment-history-panel.svelte";
  import ShareTicketDialog from "$lib/components/orders/share-ticket-dialog.svelte";
  import GarmentTagDialog from "$lib/components/orders/garment-tag-dialog.svelte";
  import PanelHeading from "$lib/components/orders/panel-heading.svelte";
  import NotesCallout from "$lib/components/orders/notes-callout.svelte";
  import OrderSummaryPanels from "$lib/components/orders/order-summary-panels.svelte";
  import OrderDetailHeader from "$lib/components/orders/order-detail-header.svelte";
  import PickupCodeDisplay from "$lib/components/orders/pickup-code-display.svelte";
  import OrderItemsPanel from "$lib/components/orders/order-items-panel.svelte";
  import AuditLogPanel, { type AuditLogEntry } from "$lib/components/orders/audit-log-panel.svelte";
  import PickupCodeDialog from "$lib/components/orders/pickup-code-dialog.svelte";
  import { confirmAndCancelOrder } from "$lib/services/orders/cancel-order";
  import { workflowStore } from "$lib/stores/workflow.svelte";
  import { isOpenOrderStatus } from "$lib/utils/status-labels";
  import { toast } from "svelte-sonner";
  import { adaptiveConfirm } from "$lib/components/ui/responsive/confirm-state.svelte";
  import { PackageCheck, Pencil, Printer, Send, Share2, Tags, XCircle } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages';

  // Params and navigation come from the frame this page is shown in: the
  // whole app, or a desktop window (see docs/adr/0008).
  const route = useRoute();

  let id = $derived(route.params.id);
  let action = $derived(route.url.searchParams.get("action"));

  let order = $state<OrderResponse | null>(null);
  let loading = $state(true);
  let establishment = $state<Establishment | null>(null);
  let auditLog = $state<AuditLogEntry[]>([]);
  let showPaymentModal = $state(false);
  let paymentRefreshKey = $state(0);
  let showShareTicketDialog = $state(false);
  let showGarmentTagDialog = $state(false);
  let showDeliverDialog = $state(false);

  // Open orders can still be edited, paid, delivered or cancelled.
  const isOpen = $derived(!!order && isOpenOrderStatus(order.status));
  // A cancelled order keeps what the customer paid until it is refunded.
  const refundDue = $derived(order?.status === 'CANCELLED' && (order.amountPaid ?? 0) > 0.009);

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
      const url = new URL(route.url);
      url.searchParams.delete('action');
      route.replaceUrl(`${url.pathname}${url.search}`);

      setTimeout(async () => {
        const ok = await adaptiveConfirm({
          title: m["orders.detail.createdTitle"](),
          description: m["orders.detail.createdDescription"]()
        });
        if (ok) handlePrint();
      }, 500);
    }
  });

  /** Refreshes the order and its audit trail after an action changed them. */
  async function reloadOrder() {
    try {
      const [res, log] = await Promise.all([
        apiService.request<OrderResponse>(`${API_SALES}/orders/${id}`),
        apiService.request<any[]>(`${API_SALES}/orders/${id}/audit`).catch(() => [])
      ]);
      order = res;
      auditLog = log ?? [];
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCancel() {
    if (!order) return;
    if (await confirmAndCancelOrder(order)) await reloadOrder();
  }

  async function handleDelivered() {
    showDeliverDialog = false;
    // Delivery may have settled the balance, which adds a payment.
    paymentRefreshKey += 1;
    await reloadOrder();
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
    await reloadOrder();
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
  <StatePanel
    message={m["orders.detail.loading"]()}
    detail={`ID: ${id}`}
    spinner
    size="page"
  />
{:else if !order}
  <ErrorState
    title={m["orders.detail.notFound"]()}
    description={m["orders.detail.notFoundDescription"]()}
  >
    <Button size="touch-lg" href="/dashboard/orders" variant="outline" class="px-8">
      {m["orders.detail.backToList"]()}
    </Button>
  </ErrorState>
{:else}
  <PageContainer width="form">
    <OrderDetailHeader ticketNumber={order.ticketNumber} status={order.status} />

    <OrderSummaryPanels {order} />

    <!-- Order Notes -->
    {#if order.notes}
      <NotesCallout title={m["orders.detail.generalNotes"]()} notes={order.notes} />
    {/if}

    {#if refundDue}
      <InlineAlert
        tone="warning"
        text={m["orders.detail.refundDue"]({ amount: formatCurrency(order.amountPaid ?? 0) })}
      />
    {/if}

    <!-- Payment History -->
    <PaymentHistoryPanel
      orderId={order.id}
      refreshKey={paymentRefreshKey}
      refundOnly={refundDue}
      onRecordPayment={isOpen || refundDue ? () => showPaymentModal = true : undefined}
    />

    <OrderItemsPanel items={order.items} />

    <!-- Pickup code and ticket tools -->
    <Card.Root class="p-4 sm:p-6 text-center">
      {#if order.pickupCode}
        <PickupCodeDisplay code={order.pickupCode} />
      {/if}
      <div class="flex flex-col justify-center gap-2 sm:flex-row" class:mt-4={order.pickupCode}>
        <Button size="touch" onclick={() => showShareTicketDialog = true} variant="outline" >
          <Share2 />
          {m["orders.detail.shareTicket"]()}
        </Button>
        <Button size="touch" onclick={handlePrint} variant="outline">
          <Printer />
          {m["orders.detail.printTicket"]()}
        </Button>
        <Button size="touch" onclick={() => showGarmentTagDialog = true} variant="outline" >
          <Tags />
          {m["orders.detail.printTags"]()}
        </Button>
      </div>
    </Card.Root>

    <!-- Order management: a delivered or cancelled order has nothing left to do -->
    {#if isOpen}
      <Card.Root class="gap-0 p-0">
        <PanelHeading title={m['common.actions']()} divider={false} />
        <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div class="flex flex-col gap-2 sm:flex-row">
            {#if workflowStore.simple}
              <Button size="touch" onclick={() => showDeliverDialog = true}>
                <PackageCheck />
                {m["orders.action.deliver"]()}
              </Button>
            {:else if order.status === 'RECEIVED'}
              <Button size="touch" onclick={handleSendToOps}>
                <Send />
                {m["orders.detail.sendToOps"]()}
              </Button>
            {/if}
            <Button size="touch" href={`/dashboard/orders/${order.id}/edit`} variant="outline">
              <Pencil />
              {m["orders.detail.editOrder"]()}
            </Button>
          </div>
          <Button size="touch" onclick={handleCancel} variant="destructive">
            <XCircle />
            {m["orders.detail.cancelOrder"]()}
          </Button>
        </div>
      </Card.Root>
    {/if}

    <!-- Audit Log -->
    {#if auditLog.length > 0}
      <AuditLogPanel entries={auditLog} />
    {/if}

    <AddPaymentModal
      bind:open={showPaymentModal}
      orderId={order.id}
      orderTotal={order.totalAmount ?? 0}
      amountPaid={order.amountPaid ?? 0}
      refundOnly={refundDue}
      onSuccess={handlePaymentSuccess}
      onClose={() => showPaymentModal = false}
    />

    <PickupCodeDialog
      bind:open={showDeliverDialog}
      orderId={order.id}
      ticketNumber={order.ticketNumber}
      orderTotal={order.totalAmount ?? 0}
      amountPaid={order.amountPaid ?? 0}
      onDelivered={handleDelivered}
      onClose={() => showDeliverDialog = false}
    />

    <ShareTicketDialog
      bind:open={showShareTicketDialog}
      orderId={order.id}
      ticketNumber={order.ticketNumber}
    />

    <GarmentTagDialog
      bind:open={showGarmentTagDialog}
      {order}
      establishmentName={establishment?.name || "ANOTAME"}
    />
  </PageContainer>
{/if}
