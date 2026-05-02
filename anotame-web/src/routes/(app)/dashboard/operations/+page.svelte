<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table';
  import * as Tabs from '$lib/components/ui/tabs';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import PickupCodeDialog from '$lib/components/orders/pickup-code-dialog.svelte';
  import { formatDate } from '$lib/utils/formatUtils';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { CheckCircle2, Eye, XCircle } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages';

  let workOrders = $state<any[]>([]);
  let readyOrders = $state<any[]>([]);
  let loading = $state(true);
  let deliverDialogOpen = $state(false);
  let deliverTarget = $state<{ id: string; ticketNumber: string } | null>(null);

  async function fetchWorkOrders() {
    loading = true;
    try {
      const allOrders = await apiService.request<any[]>(`${API_SALES}/orders`);
      workOrders = (allOrders || []).filter((o: any) => o.status === 'IN_PROGRESS');
      readyOrders = (allOrders || []).filter((o: any) => o.status === 'READY');
    } catch (e: any) {
      console.error(e);
      toast.error(m["operations.toast.loadError"]());
      workOrders = [];
      readyOrders = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchWorkOrders();
  });

  async function handleComplete(order: any) {
    const ok = await adaptiveConfirm({
      title: m["operations.confirmMarkReadyTitle"](),
      description: m["operations.confirmMarkReadyDesc"]({ ticket: order.ticketNumber })
    });
    if (!ok) return;

    try {
      await apiService.request(`${API_SALES}/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'READY' })
      });
      toast.success(m["operations.toast.markedReady"](), { description: order.ticketNumber });
      fetchWorkOrders();
    } catch (e: any) {
      console.error(e);
      toast.error(m["operations.toast.updateError"](), { description: e.message });
    }
  }

  async function handleCancelWorkOrder(order: any) {
    const ok = await adaptiveConfirm({
      title: m["operations.confirmCancelTitle"](),
      description: m["operations.confirmCancelDesc"]({ ticket: order.ticketNumber })
    });
    if (!ok) return;

    try {
      await apiService.request(`${API_SALES}/orders/${order.id}`, { method: 'DELETE' });
      toast.success(m["operations.toast.cancelSuccess"](), { description: order.ticketNumber });
      fetchWorkOrders();
    } catch (e: any) {
      console.error(e);
      if (e instanceof ApiError && e.status === 409) {
        toast.error(m["operations.toast.cannotCancel"](), {
          description: m["operations.toast.cannotCancelDesc"]()
        });
      } else {
        toast.error(m["operations.toast.cancelError"](), { description: e?.message });
      }
    }
  }

  function openDeliverDialog(order: any) {
    deliverTarget = { id: order.id, ticketNumber: order.ticketNumber };
    deliverDialogOpen = true;
  }

  function handleDelivered() {
    deliverDialogOpen = false;
    deliverTarget = null;
    fetchWorkOrders();
  }

  function getServicesSummary(items: any[]): string {
    return items?.map((i: any) => i.services?.map((s: any) => s.serviceName).join(', ')).filter(Boolean).join('; ') || '-';
  }

  function getGarmentsSummary(items: any[]): string {
    return items?.map((i: any) => i.garmentName).filter(Boolean).join(', ') || '-';
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">{m["operations.page.title"]()}</h1>
      <p class="text-muted-foreground">{m["operations.page.subtitle"]()}</p>
    </div>
    <div class="text-sm text-muted-foreground bg-card border border-border px-4 py-2 rounded-lg">
      {workOrders.length === 1
        ? m["operations.count.single"]({ count: workOrders.length })
        : m["operations.count.plural"]({ count: workOrders.length })}
    </div>
  </div>

  <Tabs.Root value="in-progress" class="space-y-4">
    <Tabs.List class="shadow-sm border border-border/50">
      <Tabs.Trigger value="in-progress" class="px-6 font-bold">{m["operations.tab.inProgress"]()}</Tabs.Trigger>
      <Tabs.Trigger value="ready" class="px-6 font-bold">{m["operations.tab.ready"]()}</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="in-progress">
      <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
        <Table.Root class="w-full min-w-[800px]">
          <Table.Header>
            <Table.Row>
              <Table.Head class="px-6 py-4">{m["operations.column.ticket"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.column.customer"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.column.status"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.column.services"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.column.deadline"]()}</Table.Head>
              <Table.Head class="px-6 py-4 text-right">{m["operations.column.actions"]()}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if loading}
              <Table.Row>
                <Table.Cell colspan={6} class="h-24 text-center">
                  {m["common.loading"]()}
                </Table.Cell>
              </Table.Row>
            {:else if workOrders.length === 0}
              <Table.Row>
                <Table.Cell colspan={6} class="h-24 text-center text-muted-foreground">
                  {m["operations.empty.inProgress"]()}
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each workOrders as wo (wo.id)}
                <Table.Row class="hover:bg-muted/30 transition-colors">
                  <Table.Cell class="px-6 py-4 font-medium font-mono text-sm">{wo.ticketNumber}</Table.Cell>
                  <Table.Cell class="px-6 py-4">{wo.customer?.firstName} {wo.customer?.lastName}</Table.Cell>
                  <Table.Cell class="px-6 py-4">
                    <StatusBadge status={wo.status} />
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {getServicesSummary(wo.items)}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-muted-foreground text-sm">
                    {formatDate(wo.committedDeadline)}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-10 px-4 touch-manipulation font-medium"
                      href={`/dashboard/orders/${wo.id}`}
                    >
                      <Eye class="w-4 h-4 mr-2" />
                      {m["common.view"]()}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-10 px-4 touch-manipulation font-medium text-destructive hover:text-destructive/90"
                      onclick={() => handleCancelWorkOrder(wo)}
                    >
                      <XCircle class="w-4 h-4 mr-2" />
                      {m["operations.button.cancel"]()}
                    </Button>
                    <Button
                      size="sm"
                      class="h-10 px-4 touch-manipulation font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                      onclick={() => handleComplete(wo)}
                    >
                      <CheckCircle2 class="w-4 h-4 mr-2" />
                      {m["operations.button.markReady"]()}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </Tabs.Content>

    <Tabs.Content value="ready">
      <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
        <Table.Root class="w-full min-w-[700px]">
          <Table.Header>
            <Table.Row>
              <Table.Head class="px-6 py-4">{m["operations.column.ticket"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.column.customer"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.column.garments"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.column.deliveryPromised"]()}</Table.Head>
              <Table.Head class="px-6 py-4 text-right">{m["operations.column.actions"]()}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if loading}
              <Table.Row>
                <Table.Cell colspan={5} class="h-24 text-center">{m["common.loading"]()}</Table.Cell>
              </Table.Row>
            {:else if readyOrders.length === 0}
              <Table.Row>
                <Table.Cell colspan={5} class="h-32 text-center">
                  <div class="flex flex-col items-center gap-2 text-muted-foreground">
                    <p class="text-base font-semibold">{m["operations.emptyReadyTitle"]()}</p>
                    <p class="text-sm">{m["operations.emptyReadyDesc"]()}</p>
                  </div>
                </Table.Cell>
              </Table.Row>
            {:else}
              {#each readyOrders as ro (ro.id)}
                <Table.Row class="hover:bg-muted/30 transition-colors">
                  <Table.Cell class="px-6 py-4 font-medium font-mono text-sm">{ro.ticketNumber}</Table.Cell>
                  <Table.Cell class="px-6 py-4">{ro.customer?.firstName} {ro.customer?.lastName}</Table.Cell>
                  <Table.Cell class="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {getGarmentsSummary(ro.items)}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-muted-foreground text-sm">
                    {formatDate(ro.committedDeadline)}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-right">
                    <Button
                      class="h-12 px-4 touch-manipulation font-medium"
                      onclick={() => openDeliverDialog(ro)}
                    >
                      {m["operations.button.deliver"]()}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>

{#if deliverTarget}
  <PickupCodeDialog
    bind:open={deliverDialogOpen}
    orderId={deliverTarget.id}
    ticketNumber={deliverTarget.ticketNumber}
    onDelivered={handleDelivered}
    onClose={() => { deliverDialogOpen = false; deliverTarget = null; }}
  />
{/if}
