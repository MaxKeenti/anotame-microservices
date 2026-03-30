<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import * as Card from '$lib/components/ui/card';
  import { TrendingUp, Activity, Truck, AlertCircle, Clock, Banknote, Calendar } from 'lucide-svelte';

  interface DashboardMetrics {
    workload: {
      todayDeliveries: number;
      comingDeliveries: number;
      pendingPipeline: number;
      readyForPickup: number;
      totalActive: number;
    };
    finance: {
      todayRevenue: number;
      monthlyRevenue: number;
      pendingDebt: number;
    };
    weeklyRevenueChart: {
      date: string;
      totalPaid: number;
    }[];
  }

  let metrics = $state<DashboardMetrics | null>(null);
  let isLoading = $state(true);

  // Math for simple bar chart scaling
  let chartMax = $derived(
    metrics?.weeklyRevenueChart.reduce((max, point) => Math.max(max, point.totalPaid), 0) || 100
  );

  onMount(async () => {
    try {
      const data = await apiService.request<DashboardMetrics>(`${API_SALES}/orders/kpi/dashboard`);
      metrics = data;
    } catch (e) {
      console.error("Error cargando KPIs:", e);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="space-y-8 animate-in fade-in duration-300">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">
        Tablero de Control
      </h1>
      <p class="text-muted-foreground">
        Métricas clave de desempeño en tiempo real y flujo de operaciones.
      </p>
    </div>
  </div>

  {#if isLoading || !metrics}
    <div class="h-64 flex items-center justify-center text-muted-foreground border border-border rounded-xl bg-card">
      Calculando métricas...
    </div>
  {:else}
    <!-- OPERATIVA (Workload) -->
    <div>
      <h2 class="text-xl font-bold font-heading mb-4 flex items-center gap-2">
        <Activity class="w-5 h-5 text-primary" />
        Operativa y Flujo
      </h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <!-- Pipeline -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">Trabajo en Proceso</Card.Title>
            <Clock class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono text-primary">
              {metrics.workload.pendingPipeline}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Prendas lavándose o planchándose
            </p>
          </Card.Content>
        </Card.Root>

        <!-- Ready -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">Listos para Entrega</Card.Title>
            <Truck class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono text-success">
              {metrics.workload.readyForPickup}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Esperando recolección
            </p>
          </Card.Content>
        </Card.Root>

        <!-- Due Today -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">Entregas Hoy</Card.Title>
            <AlertCircle class="h-4 w-4 text-destructive" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono text-destructive">
              {metrics.workload.todayDeliveries}
            </div>
            <p class="text-xs mt-1 text-destructive/80 font-medium">
              Pedidos que vencen hoy
            </p>
          </Card.Content>
        </Card.Root>

        <!-- Coming -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">Próximos Días</Card.Title>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono">
              {metrics.workload.comingDeliveries}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Vencimientos futuros
            </p>
          </Card.Content>
        </Card.Root>
      </div>
      
      <!-- Workload Ratio Bar -->
      <div class="mt-4 p-4 rounded-xl border bg-card">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium">Progreso del Workload Activo</span>
          <span class="text-sm text-foreground/70">{metrics.workload.readyForPickup} de {metrics.workload.totalActive} terminados</span>
        </div>
        <div class="h-3 w-full bg-muted rounded-full overflow-hidden flex">
          {#if metrics.workload.totalActive > 0}
            {@const pctReady = (metrics.workload.readyForPickup / metrics.workload.totalActive) * 100}
            <div class="h-full bg-success transition-all duration-1000 ease-out" style="width: {pctReady}%"></div>
            <div class="h-full bg-primary/40 transition-all duration-1000 ease-out" style="width: {100 - pctReady}%"></div>
          {/if}
        </div>
      </div>
    </div>

    <!-- FINANZAS (Revenue) -->
    <div>
      <h2 class="text-xl font-bold font-heading mb-4 mt-8 flex items-center gap-2">
        <Banknote class="w-5 h-5 text-success" />
        Finanzas y Ventas
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <!-- Revenue Cards -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">Ingresos Hoy</Card.Title>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono">
              {formatCurrency(metrics.finance.todayRevenue)}
            </div>
            <p class="text-xs text-muted-foreground mt-1">Pagos recibidos en el día</p>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">Mes en Curso</Card.Title>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono">
              {formatCurrency(metrics.finance.monthlyRevenue)}
            </div>
            <p class="text-xs text-muted-foreground mt-1">Acumulado mensual</p>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">Cuentas por Cobrar</Card.Title>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono text-amber-500">
              {formatCurrency(metrics.finance.pendingDebt)}
            </div>
            <p class="text-xs text-muted-foreground mt-1">Deuda en tickets activos</p>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Simple CSS Bar Chart -->
      <Card.Root class="mt-6">
        <Card.Header>
          <Card.Title>Tendencia 7 Días (Ingresos)</Card.Title>
          <Card.Description>Histórico de ventas terminadas de la última semana.</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="flex items-end gap-2 h-48 w-full mt-4">
            {#each metrics.weeklyRevenueChart as day}
              {@const heightPct = chartMax > 0 ? (day.totalPaid / chartMax) * 100 : 0}
              <div class="relative flex-1 flex flex-col items-center justify-end h-full group">
                <!-- Tooltip -->
                <div class="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                  {formatCurrency(day.totalPaid)}
                </div>
                <!-- Bar -->
                <div 
                  class="w-full max-w-[40px] bg-primary/80 hover:bg-primary rounded-t-sm transition-all duration-500 ease-out"
                  style="height: {heightPct}%"
                ></div>
                <!-- Date Label -->
                <div class="text-[10px] mt-2 text-muted-foreground -rotate-45deg pb-2 uppercase truncate w-full text-center">
                  {#if day.date}
                    {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
