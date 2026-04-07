<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_CATALOG } from '$lib/services/api.svelte';
  import { orderWizardState } from '$lib/services/orders/OrderWizardState.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/formatUtils';
  import { Edit, Trash2, Eye } from 'lucide-svelte';
  import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';
  import { AdaptiveSelect } from '$lib/components/ui/responsive';
  import { AdaptiveDatePicker } from '$lib/components/ui/responsive';
  import DataTableWrapper from '$lib/components/ui/DataTableWrapper.svelte';
  import type { ColumnDef } from '@tanstack/table-core';
  import * as Tabs from '$lib/components/ui/tabs';

  let view = $state<'active' | 'drafts'>('active');
  let orders = $state<any[]>([]);
  let garments = $state<any[]>([]);
  let loading = $state(true);

  // Filters
  let searchQuery = $state("");
  let garmentFilter = $state("");
  let dateFilter = $state("");

  let drafts = $derived(orderWizardState.drafts.current);

  const activeColumns: ColumnDef<any>[] = [
    { accessorKey: 'ticketNumber', header: 'Ticket', enableSorting: true },
    { id: 'customer', accessorFn: (row) => `${row.customer?.firstName ?? ''} ${row.customer?.lastName ?? ''}`, header: 'Cliente', enableSorting: true },
    { id: 'garments', accessorFn: (row) => row.items?.map((i: any) => i.garmentName).join(', '), header: 'Prendas (Resumen)', enableSorting: false },
    { id: 'status', accessorFn: (row) => row.status, header: 'Estado', enableSorting: true },
    { id: 'deadline', accessorFn: (row) => formatDate(row.committedDeadline), header: 'Entrega', enableSorting: true },
    { id: 'total', accessorFn: (row) => formatCurrency(row.totalAmount), header: 'Total', enableSorting: true },
    { id: 'actions', header: 'Acciones', enableSorting: false },
  ];

  const draftsColumns: ColumnDef<any>[] = [
    { id: 'draftId', accessorFn: (row) => row.id, header: 'ID (Temporal)', enableSorting: false },
    { id: 'customer', accessorFn: (row) => row.customer?.firstName ? `${row.customer.firstName} ${row.customer.lastName ?? ''}` : 'Sin nombre', header: 'Cliente', enableSorting: true },
    { id: 'garments', accessorFn: (row) => `${row.items?.length || 0} prendas`, header: 'Prendas', enableSorting: false },
    { id: 'lastModified', accessorFn: (row) => new Date(row.lastModified).toLocaleString(), header: 'Última Modificación', enableSorting: true },
    { id: 'actions', header: 'Acciones', enableSorting: false },
  ];

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

  <Tabs.Root bind:value={view} class="space-y-6">
    <Tabs.List class="shadow-sm border border-border/50">
      <Tabs.Trigger value="active" class="px-6 font-bold">Órdenes Activas</Tabs.Trigger>
      <Tabs.Trigger value="drafts" class="px-6 font-bold">
        Borradores {drafts.length > 0 ? `(${drafts.length})` : ''}
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="active" class="space-y-6">
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
            placeholder="Selecciona una prenda"
            items={garments.map(g => ({ value: g.id, label: g.name }))}
            allowClear={true}
            clearText="Todas las prendas"
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
      <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
        {#snippet statusCell(row: any)}
          <StatusBadge status={row.original.status} />
        {/snippet}

        <DataTableWrapper
          columns={activeColumns}
          data={filteredOrders}
          loading={loading}
          emptyMessage="No se encontraron pedidos."
          filterPlaceholder="Buscar pedidos..."
          showFilter={false}
          cellRenders={{
            status: statusCell
          }}
        >
          {#snippet actionCell(row)}
            <div class="flex justify-end gap-2">
              <Button variant="ghost" href={`/dashboard/orders/${row.original.id}/edit`} class="h-10 px-4 font-medium hover:text-primary hover:bg-primary/10 touch-manipulation">
                <Edit class="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" href={`/dashboard/orders/${row.original.id}`} class="h-10 px-4 font-medium touch-manipulation">
                <Eye class="w-4 h-4 mr-2" />
                Detalles
              </Button>
            </div>
          {/snippet}
        </DataTableWrapper>
      </div>
    </Tabs.Content>

    <Tabs.Content value="drafts" class="space-y-6">
      <div class="bg-card border border-border rounded-xl overflow-hidden shadow-sm p-4">
        <DataTableWrapper
          columns={draftsColumns}
          data={drafts}
          emptyMessage="No hay borradores guardados."
          filterPlaceholder="Buscar borradores..."
          showFilter={false}
        >
          {#snippet actionCell(row)}
            <div class="flex justify-end gap-2">
              <Button variant="ghost" href={`/dashboard/orders/new?draftId=${row.original.id}`} class="h-10 px-4 font-medium hover:text-primary hover:bg-primary/10 touch-manipulation flex items-center justify-center">
                <Edit class="w-4 h-4 mr-2" />
                <span>Editar Borrador</span>
              </Button>
              <Button variant="ghost" class="h-10 px-4 font-medium text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation" onclick={() => handleDeleteDraft(row.original.id)}>
                <Trash2 class="w-4 h-4 mr-2" />
                <span>Eliminar</span>
              </Button>
            </div>
          {/snippet}
        </DataTableWrapper>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
