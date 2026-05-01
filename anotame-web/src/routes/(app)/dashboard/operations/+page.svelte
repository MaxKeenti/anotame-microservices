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
      toast.error(m["operations.loadError"]());
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
      title: m["operations.markReadyTitle"](),
      description: m["operations.markReadyDesc"]({ ticket: order.ticketNumber })
    });
    if (!ok) return;

    try {
      await apiService.request(`${API_SALES}/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'READY' })
      });
      toast.success(m["operations.markReadySuccess"](), { description: order.ticketNumber });
      fetchWorkOrders();
    } catch (e: any) {
      console.error(e);
      toast.error(m["operations.markReadyError"](), { description: e.message });
    }
  }

  async function handleCancelWorkOrder(order: any) {
    const ok = await adaptiveConfirm({
      title: m["operations.cancelTitle"](),
      description: m["operations.cancelDesc"]({ ticket: order.ticketNumber })
    });
    if (!ok) return;

    try {
      await apiService.request(`${API_SALES}/orders/${order.id}`, { method: 'DELETE' });
      toast.success(m["operations.cancelSuccess"](), { description: order.ticketNumber });
      fetchWorkOrders();
    } catch (e: any) {
      console.error(e);
      if (e instanceof ApiError && e.status === 409) {
        toast.error(m["operations.cancelConflict"](), {
          description: m["operations.cancelConflictDesc"]()
        });
      } else {
        toast.error(m["operations.cancelError"](), { description: e?.message });
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
      <h1 class="text-3xl font-heading font-bold text-foreground">{m["operations.title"]()}</h1>
      <p class="text-muted-foreground">{m["operations.description"]()}</p>
    </div>
    <div class="text-sm text-muted-foreground bg-card border border-border px-4 py-2 rounded-lg">
      {workOrders.length === 1 ? m["operations.notesCount"]({ count: workOrders.length }) : m["operations.notesCountPlural"]({ count: workOrders.length })}
    </div>
  </div>

  <Tabs.Root value="in-progress" class="space-y-4">
    <Tabs.List class="shadow-sm border border-border/50">
      <Tabs.Trigger value="in-progress" class="px-6 font-bold">{m["operations.tabInProgress"]()}</Tabs.Trigger>
      <Tabs.Trigger value="ready" class="px-6 font-bold">{m["operations.tabReady"]()}</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="in-progress">
      <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
        <Table.Root class="w-full min-w-[800px]">
          <Table.Header>
            <Table.Row>
              <Table.Head class="px-6 py-4">{m["operations.colTicket"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.colCustomer"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.colStatus"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.colServices"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.colDeadline"]()}</Table.Head>
              <Table.Head class="px-6 py-4 text-right">{m["operations.colActions"]()}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if loading}
              <Table.Row>
                <Table.Cell colspan={6} class="h-24 text-center">
                  {m["operations.loading"]()}
                </Table.Cell>
              </Table.Row>
            {:else if workOrders.length === 0}
              <Table.Row>
                <Table.Cell colspan={6} class="h-24 text-center text-muted-foreground">
                  {m["operations.emptyInProgress"]()}
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
                      {m["operations.viewButton"]()}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-10 px-4 touch-manipulation font-medium text-destructive hover:text-destructive/90"
                      onclick={() => handleCancelWorkOrder(wo)}
                    >
                      <XCircle class="w-4 h-4 mr-2" />
                      {m["operations.cancelButton"]()}
                    </Button>
                    <Button
                      size="sm"
                      class="h-10 px-4 touch-manipulation font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                      onclick={() => handleComplete(wo)}
                    >
                      <CheckCircle2 class="w-4 h-4 mr-2" />
                      {m["operations.markReadyButton"]()}
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
              <Table.Head class="px-6 py-4">{m["operations.colTicket"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.colCustomer"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.colGarments"]()}</Table.Head>
              <Table.Head class="px-6 py-4">{m["operations.colPromisedDelivery"]()}</Table.Head>
              <Table.Head class="px-6 py-4 text-right">{m["operations.colActions"]()}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#if loading}
              <Table.Row>
                <Table.Cell colspan={5} class="h-24 text-center">{m["operations.loading"]()}</Table.Cell>
              </Table.Row>
            {:else if readyOrders.length === 0}
              <Table.Row>
                <Table.Cell colspan={5} class="h-32 text-center">
                  <div class="flex flex-col items-center gap-2 text-muted-foreground">
                    <p class="text-base font-semibold">{m["operations.emptyReady"]()}</p>
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
                      {m["operations.deliverButton"]()}
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
