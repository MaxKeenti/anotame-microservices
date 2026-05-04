<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import * as Card from '$lib/components/ui/card';
  import { TrendingUp, Activity, Truck, AlertCircle, Clock, Banknote, Calendar } from 'lucide-svelte';
  import WorkloadCalendar from '$lib/components/dashboard/WorkloadCalendar.svelte';
  import { API_OPERATIONS } from '$lib/services/api.svelte';
  import * as m from '$lib/paraglide/messages';

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
    dailyWorkload: {
      date: string;
      totalMinutesUsed: number;
    }[];
  }

  let metrics = $state<DashboardMetrics | null>(null);
  let capacity = $state(480);
  let isLoading = $state(true);
  let activeBarIndex = $state<number | null>(null);

  // Math for simple bar chart scaling
  let chartMax = $derived(
    metrics?.weeklyRevenueChart.reduce((max, point) => Math.max(max, point.totalPaid), 0) || 100
  );

  onMount(async () => {
    try {
      const [metricsData, estData] = await Promise.all([
        apiService.request<DashboardMetrics>(`${API_SALES}/orders/kpi/dashboard`),
        apiService.request<any>(`${API_OPERATIONS}/establishment`)
      ]);
      metrics = metricsData;
      if (estData?.dailyCapacityMinutes) capacity = estData.dailyCapacityMinutes;
    } catch (e) {
      console.error("Error loading KPIs:", e);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="space-y-8 animate-in fade-in duration-300">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <h1 class="text-3xl font-heading font-bold text-foreground">
        {m['nav.kpi.name']()}
      </h1>
      <p class="text-muted-foreground">
        {m['kpi.page.desc']()}
      </p>
    </div>
  </div>

  {#if isLoading || !metrics}
    <div class="h-64 flex items-center justify-center text-muted-foreground border border-border rounded-xl bg-card">
      {m['kpi.loading']()}
    </div>
  {:else}
    <!-- Operations (Workload) -->
    <div>
      <h2 class="text-xl font-bold font-heading mb-4 flex items-center gap-2">
        <Activity class="w-5 h-5 text-primary" />
        {m['kpi.section.operations']()}
      </h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <!-- Pipeline -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.pipeline']()}</Card.Title>
            <Clock class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono text-primary">
              {metrics.workload.pendingPipeline}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              {m['kpi.card.pipelineDesc']()}
            </p>
          </Card.Content>
        </Card.Root>

        <!-- Ready -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.ready']()}</Card.Title>
            <Truck class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono text-success">
              {metrics.workload.readyForPickup}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              {m['kpi.card.readyDesc']()}
            </p>
          </Card.Content>
        </Card.Root>

        <!-- Due Today -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.todayDeliveries']()}</Card.Title>
            <AlertCircle class="h-4 w-4 text-destructive" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono text-destructive">
              {metrics.workload.todayDeliveries}
            </div>
            <p class="text-xs mt-1 text-destructive/80 font-medium">
              {m['kpi.card.todayDeliveriesDesc']()}
            </p>
          </Card.Content>
        </Card.Root>

        <!-- Coming -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.upcoming']()}</Card.Title>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono">
              {metrics.workload.comingDeliveries}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              {m['kpi.card.upcomingDesc']()}
            </p>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Workload Ratio Bar -->
      <div class="mt-4 p-4 rounded-xl border bg-card">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium">{m['kpi.workload.progress']()}</span>
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

      <!-- Workload Calendar -->
      <div class="mt-8">
        <WorkloadCalendar dailyWorkload={metrics.dailyWorkload} {capacity} />
      </div>
    </div>

    <!-- Finance (Revenue) -->
    <div>
      <h2 class="text-xl font-bold font-heading mb-4 mt-8 flex items-center gap-2">
        <Banknote class="w-5 h-5 text-success" />
        {m['kpi.section.finance']()}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <!-- Revenue Cards -->
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.todayRevenue']()}</Card.Title>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono">
              {formatCurrency(metrics.finance.todayRevenue)}
            </div>
            <p class="text-xs text-muted-foreground mt-1">{m['kpi.card.todayRevenueDesc']()}</p>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.monthRevenue']()}</Card.Title>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono">
              {formatCurrency(metrics.finance.monthlyRevenue)}
            </div>
            <p class="text-xs text-muted-foreground mt-1">{m['kpi.card.monthRevenueDesc']()}</p>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.receivables']()}</Card.Title>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono text-amber-500">
              {formatCurrency(metrics.finance.pendingDebt)}
            </div>
            <p class="text-xs text-muted-foreground mt-1">{m['kpi.card.receivablesDesc']()}</p>
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Simple CSS Bar Chart -->
      <Card.Root class="mt-6">
        <Card.Header>
          <Card.Title>{m['kpi.chart.weeklyTitle']()}</Card.Title>
          <Card.Description>{m['kpi.chart.weeklyDesc']()}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="flex items-end gap-2 h-48 w-full mt-4">
            {#each metrics.weeklyRevenueChart as day, i}
              {@const heightPct = chartMax > 0 ? (day.totalPaid / chartMax) * 100 : 0}
              {@const isBarActive = activeBarIndex === i}
              <div
                class="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                role="button"
                tabindex="0"
                aria-label={formatCurrency(day.totalPaid)}
                onclick={() => activeBarIndex = isBarActive ? null : i}
                onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (activeBarIndex = isBarActive ? null : i)}
              >
                <!-- Tooltip — visible on hover (desktop) or tap (mobile) -->
                <div class="absolute -top-10 transition-transform bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none {isBarActive ? 'scale-100' : 'scale-0 group-hover:scale-100'}">
                  {formatCurrency(day.totalPaid)}
                </div>
                <!-- Bar -->
                <div
                  class="w-full max-w-10 bg-primary/80 hover:bg-primary rounded-t-sm transition-all duration-500 ease-out"
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
