<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_CATALOG } from '$lib/services/api.svelte';
  import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Table from '$lib/components/ui/table';
  import { translateStatus, getStatusColor } from '$lib/utils/statusUtils';
  import { formatCurrency, formatDate } from '$lib/utils/formatUtils';
  import { Edit, Trash2, Eye } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { AdaptiveDatePicker } from '$lib/components/ui/responsive';

  let view = $state<'active' | 'drafts'>('active');
  let orders = $state<any[]>([]);
  let garments = $state<any[]>([]);
  let loading = $state(true);

  // Filters
  let searchQuery = $state("");
  let garmentFilter = $state("");
  let dateFilter = $state("");

  let drafts = $derived(orderWizardState.drafts.current);

  async function fetchData() {
    loading = true;
    try {
      const [ordersData, garmentsData] = await Promise.all([
        apiService.request<any[]>(`${API_SALES}/orders`),
        apiService.request<any[]>(`${API_CATALOG}/catalog/garments`)
      ]);
      orders = ordersData || [];
      garments = garmentsData || [];
    } catch (e) {
      console.error(e);
      // Optional: Add toast error handling here
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchData();
  });

  async function handleDeleteDraft(id: string) {
    const ok = await adaptiveConfirm({
      title: 'Eliminar Borrador',
      description: '¿Estás seguro de eliminar este borrador? Esta acción no se puede deshacer.'
    });
    if (ok) {
      orderWizardState.deleteDraft(id);
    }
  }

  function setView(target: 'active' | 'drafts') {
    view = target;
  }

  // Derived filter logic
  let filteredOrders = $derived.by(() => {
    return orders.filter(order => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        order.ticketNumber?.toLowerCase().includes(query) ||
        order.customer?.firstName?.toLowerCase().includes(query) ||
        order.customer?.lastName?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (garmentFilter) {
        const selectedGarment = garments.find(g => g.id === garmentFilter);
        if (selectedGarment) {
          const hasGarment = order.items?.some((item: any) =>
            item.garmentName === selectedGarment.name
          );
          if (!hasGarment) return false;
        }
      }

      if (dateFilter) {
        if (!order.committedDeadline) return false;
        const orderDate = order.committedDeadline.split('T')[0];
        if (orderDate !== dateFilter) return false;
      }

      return true;
    });
  });
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-brand font-bold text-foreground">Pedidos</h1>
      <p class="text-muted-foreground">Ver y gestionar pedidos de clientes.</p>
    </div>
    <Button href="/dashboard/orders/new" class="w-full sm:w-auto h-12 px-6 text-lg font-bold touch-manipulation shadow-md">+ Nuevo Pedido</Button>
  </div>

  <div class="flex bg-muted/20 p-1.5 rounded-xl w-fit shadow-sm border border-border/50">
    <button
      onclick={() => setView('active')}
      class={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 touch-manipulation ${view === 'active'
        ? 'bg-background text-foreground shadow-sm border-border border'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
        }`}
    >
      Órdenes Activas
    </button>
    <button
      onclick={() => setView('drafts')}
      class={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 touch-manipulation ${view === 'drafts'
        ? 'bg-background text-foreground shadow-sm border-border border'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
        }`}
    >
      Borradores {drafts.length > 0 ? `(${drafts.length})` : ''}
    </button>
  </div>

  {#if view === 'active'}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-card border border-border rounded-xl shadow-sm">
      <div class="col-span-1 md:col-span-2 space-y-1.5">
        <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="search-orders">Buscar</label>
        <Input
          id="search-orders"
          placeholder="Ticket, Nombre del Cliente..."
          bind:value={searchQuery}
          class="h-12 text-base touch-manipulation"
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="filter-garment">Filtrar por Prenda</label>
        <AdaptiveSelect
          id="filter-garment"
          bind:value={garmentFilter}
          placeholder="Todas"
          items={garments.map(g => ({ value: g.id, label: g.name }))}
          class=""
        />
      </div>
      <div class="space-y-1.5">
        <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for="filter-date">Fecha de Entrega</label>
        <AdaptiveDatePicker
          id="filter-date"
          bind:value={dateFilter}
          placeholder="Seleccionar fecha..."
        />
      </div>
    </div>

    <!-- Active Orders Table -->
    <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto min-w-full">
        <Table.Root class="w-full text-sm text-left align-middle">
          <Table.Header class="bg-muted/30">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Ticket</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Cliente</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Prendas (Resumen)</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Estado</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Entrega</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Total</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto text-right">Aciones</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="divide-y divide-border">
            {#if loading}
              <Table.Row>
                <Table.Cell colspan={7} class="h-32 text-center text-muted-foreground animate-pulse font-medium text-base">Cargando...</Table.Cell>
              </Table.Row>
            {:else if filteredOrders.length === 0}
              <Table.Row>
                <Table.Cell colspan={7} class="h-32 text-center text-muted-foreground font-medium text-base">No se encontraron pedidos.</Table.Cell>
              </Table.Row>
            {:else}
              {#each filteredOrders as order (order.id)}
                <Table.Row class="hover:bg-muted/10 transition-colors">
                  <Table.Cell class="px-6 py-4 font-mono font-bold">{order.ticketNumber}</Table.Cell>
                  <Table.Cell class="px-6 py-4 font-medium whitespace-nowrap">{order.customer?.firstName} {order.customer?.lastName}</Table.Cell>
                  <Table.Cell class="px-6 py-4 text-muted-foreground text-xs max-w-[200px] truncate" title={order.items?.map((i: any) => i.garmentName).join(", ")}>
                    {order.items?.map((i: any) => i.garmentName).join(", ")}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4">
                    <span class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border border-border/30 shadow-sm uppercase ${getStatusColor(order.status)}`}>
                      {translateStatus(order.status)}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-muted-foreground whitespace-nowrap">{formatDate(order.committedDeadline)}</Table.Cell>
                  <Table.Cell class="px-6 py-4 font-bold font-mono text-primary text-base">${formatCurrency(order.totalAmount).split('$')[1]}</Table.Cell>
                  <Table.Cell class="px-6 py-4">
                    <div class="flex justify-end gap-2">
                      <Button variant="ghost" href={`/dashboard/orders/${order.id}/edit`} class="h-10 px-4 font-medium hover:text-primary hover:bg-primary/10 touch-manipulation">
                        <Edit class="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" href={`/dashboard/orders/${order.id}`} class="h-10 px-4 font-medium touch-manipulation">
                        <Eye class="w-4 h-4 mr-2" />
                        Detalles
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  {:else}
    <!-- Drafts View -->
    <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto min-w-full">
        <Table.Root class="w-full text-sm text-left align-middle">
          <Table.Header class="bg-muted/30">
            <Table.Row class="hover:bg-transparent">
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">ID (Temporal)</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Cliente</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Prendas</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto">Última Modificación</Table.Head>
              <Table.Head class="px-6 py-4 text-xs font-bold uppercase text-muted-foreground h-auto text-right">Acciones</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body class="divide-y divide-border">
            {#if drafts.length === 0}
              <Table.Row>
                <Table.Cell colspan={5} class="h-32 text-center text-muted-foreground font-medium text-base">No hay borradores guardados</Table.Cell>
              </Table.Row>
            {:else}
              {#each drafts as d (d.id)}
                <Table.Row class="hover:bg-muted/10 transition-colors">
                  <Table.Cell class="px-6 py-6 border-0">
                    <span class="font-mono font-bold text-xs bg-secondary/30 rounded px-2 py-1">{d.id.slice(0, 8)}...</span>
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 font-medium">
                    {#if d.customer?.firstName}
                      {d.customer.firstName} {d.customer.lastName || ''}
                    {:else}
                      <span class="text-muted-foreground italic font-normal">Sin nombre</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4">
                    <span class="font-bold bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border border-primary/20">
                      {d.items?.length || 0} prendas
                    </span>
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-muted-foreground text-sm font-medium">
                    {new Date(d.lastModified).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <Button variant="ghost" href={`/dashboard/orders/new?draftId=${d.id}`} class="h-10 px-4 font-medium hover:text-primary hover:bg-primary/10 touch-manipulation flex items-center justify-center">
                        <Edit class="w-4 h-4 mr-2" />
                        <span>Editar Borrador</span>
                      </Button>
                      <Button variant="ghost" class="h-10 px-4 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation" onclick={() => handleDeleteDraft(d.id)}>
                        <Trash2 class="w-4 h-4 mr-2" />
                        <span>Eliminar</span>
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              {/each}
            {/if}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  {/if}
</div>
