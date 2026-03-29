<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import * as Card from '$lib/components/ui/card';
  import { TrendingUp, Activity, Truck, Users } from 'lucide-svelte';

  let orders = $state<any[]>([]);
  let isLoading = $state(true);

  onMount(async () => {
    try {
      const data = await apiService.request<any[]>(`${API_SALES}/orders`);
      orders = data || [];
    } catch (e) {
      console.error(e);
      // In case of error, just show 0s
      orders = [];
    } finally {
      isLoading = false;
    }
  });

  // KPIs
  let totalRevenue = $derived(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0));
  let activeOrders = $derived(orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED").length);
  let pendingDelivery = $derived(orders.filter(o => o.status === "READY").length);
  let uniqueCustomers = $derived(new Set(orders.map(o => o.customer?.id).filter(Boolean)).size);
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">
        Métricas del Negocio
      </h1>
      <p class="text-muted-foreground">
        Resumen de desempeño y KPIs (Vista de Administrador).
      </p>
    </div>
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    <!-- Revenue Card -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Ingresos Totales</Card.Title>
        <TrendingUp class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold font-mono">
          {isLoading ? '...' : formatCurrency(totalRevenue)}
        </div>
        <p class="text-xs text-muted-foreground mt-1 text-success flex items-center gap-1">
          Histórico
        </p>
      </Card.Content>
    </Card.Root>

    <!-- Active Orders Card -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Órdenes Activas</Card.Title>
        <Activity class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">
          {isLoading ? '...' : activeOrders}
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          En proceso
        </p>
      </Card.Content>
    </Card.Root>

    <!-- Pending Delivery Card -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Para Entrega</Card.Title>
        <Truck class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">
          {isLoading ? '...' : pendingDelivery}
        </div>
        <p class={`text-xs mt-1 ${pendingDelivery > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
          Listas en sucursal
        </p>
      </Card.Content>
    </Card.Root>

    <!-- Customers Card -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Clientes Únicos</Card.Title>
        <Users class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">
          {isLoading ? '...' : uniqueCustomers}
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          En base de datos
        </p>
      </Card.Content>
    </Card.Root>
  </div>
</div>
