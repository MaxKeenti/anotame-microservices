<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { ApiError } from '$lib/services/ApiError';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table';
  import { translateStatus, getStatusColor } from '$lib/utils/statusUtils';
  import { formatDate } from '$lib/utils/formatUtils';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { toast } from 'svelte-sonner';
  import { CheckCircle2, Eye, XCircle } from 'lucide-svelte';

  let workOrders = $state<any[]>([]);
  let loading = $state(true);

  async function fetchWorkOrders() {
    loading = true;
    try {
      const allOrders = await apiService.request<any[]>(`${API_SALES}/orders`);
      workOrders = (allOrders || []).filter(o => o.status === 'IN_PROGRESS');
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar las órdenes de trabajo");
      workOrders = [];
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchWorkOrders();
  });

  async function handleComplete(order: any) {
    const ok = await adaptiveConfirm({
      title: 'Marcar como Listo',
      description: `¿Desea marcar la orden ${order.ticketNumber} como lista? El estado cambiará a LISTO.`
    });
    if (!ok) return;

    try {
      await apiService.request(`${API_SALES}/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'READY' })
      });
      toast.success("¡Orden marcada como lista!", { description: order.ticketNumber });
      fetchWorkOrders();
    } catch (e: any) {
      console.error(e);
      toast.error("Error al actualizar el estado", { description: e.message });
    }
  }

  async function handleCancelWorkOrder(order: any) {
    const ok = await adaptiveConfirm({
      title: 'Cancelar Orden de Trabajo',
      description: `¿Estás seguro que deseas cancelar la orden ${order.ticketNumber}? Esta acción no se puede deshacer.`
    });
    if (!ok) return;

    try {
      await apiService.request(`${API_SALES}/orders/${order.id}`, { method: 'DELETE' });
      toast.success('Orden cancelada exitosamente', { description: order.ticketNumber });
      fetchWorkOrders();
    } catch (e: any) {
      console.error(e);
      if (e instanceof ApiError && e.status === 409) {
        toast.error('No se puede cancelar', {
          description: 'La orden tiene registros de trabajo vinculados.'
        });
      } else {
        toast.error('Error al cancelar la orden', { description: e?.message });
      }
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">Control de Operaciones</h1>
      <p class="text-muted-foreground">Órdenes en progreso pendientes de completar.</p>
    </div>
    <div class="text-sm text-muted-foreground bg-card border border-border px-4 py-2 rounded-lg">
      {workOrders.length} {workOrders.length === 1 ? 'orden' : 'órdenes'} en progreso
    </div>
  </div>

  <div class="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
    <Table.Root class="w-full min-w-[800px]">
      <Table.Header>
        <Table.Row>
          <Table.Head class="px-6 py-4">Ticket</Table.Head>
          <Table.Head class="px-6 py-4">Cliente</Table.Head>
          <Table.Head class="px-6 py-4">Estado</Table.Head>
          <Table.Head class="px-6 py-4">Servicios</Table.Head>
          <Table.Head class="px-6 py-4">Fecha Límite</Table.Head>
          <Table.Head class="px-6 py-4 text-right">Acciones</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if loading}
          <Table.Row>
            <Table.Cell colspan={6} class="h-24 text-center">
              Cargando...
            </Table.Cell>
          </Table.Row>
        {:else if workOrders.length === 0}
          <Table.Row>
            <Table.Cell colspan={6} class="h-24 text-center text-muted-foreground">
              No hay órdenes en progreso.
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each workOrders as wo (wo.id)}
            <Table.Row class="hover:bg-muted/30 transition-colors">
              <Table.Cell class="px-6 py-4 font-medium font-mono text-sm">{wo.ticketNumber}</Table.Cell>
              <Table.Cell class="px-6 py-4">{wo.customer?.firstName} {wo.customer?.lastName}</Table.Cell>
              <Table.Cell class="px-6 py-4">
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(wo.status)}`}>
                  {translateStatus(wo.status)}
                </span>
              </Table.Cell>
              <Table.Cell class="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                {wo.items?.map((i: any) => i.services?.map((s: any) => s.serviceName).join(', ')).filter(Boolean).join('; ') || '-'}
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
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-10 px-4 touch-manipulation font-medium text-destructive hover:text-destructive/90"
                  onclick={() => handleCancelWorkOrder(wo)}
                >
                  <XCircle class="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  class="h-10 px-4 touch-manipulation font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                  onclick={() => handleComplete(wo)}
                >
                  <CheckCircle2 class="w-4 h-4 mr-2" />
                  Marcar Listo
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </div>
</div>
