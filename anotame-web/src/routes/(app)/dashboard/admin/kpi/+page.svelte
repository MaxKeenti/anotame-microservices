<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_OPERATIONS } from '$lib/services/api.svelte';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { TrendingUp, Activity, Truck, AlertCircle, Clock, Banknote, Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import FinancialKpiPanel from '$lib/components/dashboard/FinancialKpiPanel.svelte';
  import CalendarGrid from '$lib/components/calendar/CalendarGrid.svelte';
  import { getLocale } from '$lib/paraglide/runtime';
  import type { CalendarDayResponse, CalendarMonthResponse, Establishment, WorkloadDayResponse } from '$lib/types/dtos';
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
    dailyWorkload: WorkloadDayResponse[];
  }

  const today = new Date();

  let metrics = $state<DashboardMetrics | null>(null);
  let capacity = $state(480);
  let thresholdGreen = $state(50);
  let thresholdAmber = $state(85);
  let atRiskDaysThreshold = $state(60);
  let isLoading = $state(true);
  let activeBarIndex = $state<number | null>(null);
  let calendarYear = $state(today.getFullYear());
  let calendarMonth = $state(today.getMonth() + 1);
  let calendarData = $state<CalendarDayResponse[]>([]);
  let calendarLoading = $state(true);
  let calendarError = $state<string | null>(null);

  // Math for simple bar chart scaling
  let chartMax = $derived(
    metrics?.weeklyRevenueChart.reduce((max, point) => Math.max(max, point.totalPaid), 0) || 100
  );
  let calendarMonthLabel = $derived(
    new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(
      new Date(calendarYear, calendarMonth - 1, 1)
    )
  );

  function getMonthParam(yearValue: number, monthValue: number): string {
    return `${yearValue}-${String(monthValue).padStart(2, '0')}`;
  }

  async function loadCalendarMonth(yearValue = calendarYear, monthValue = calendarMonth, capacityMinutes = capacity) {
    calendarLoading = true;
    calendarError = null;

    try {
      const monthParam = getMonthParam(yearValue, monthValue);
      const response = await apiService.request<CalendarMonthResponse>(
        `${API_SALES}/orders/kpi/calendar?month=${monthParam}&dailyCapacityMinutes=${capacityMinutes}`
      );
      calendarData = response.days || [];
    } catch (err) {
      console.error('Failed to load workload calendar:', err);
      calendarData = [];
      calendarError = m["common.noData"]();
    } finally {
      calendarLoading = false;
    }
  }

  async function handlePreviousCalendarMonth() {
    const nextMonth = calendarMonth === 1 ? 12 : calendarMonth - 1;
    const nextYear = calendarMonth === 1 ? calendarYear - 1 : calendarYear;
    calendarMonth = nextMonth;
    calendarYear = nextYear;
    await loadCalendarMonth(nextYear, nextMonth);
  }

  async function handleNextCalendarMonth() {
    const nextMonth = calendarMonth === 12 ? 1 : calendarMonth + 1;
    const nextYear = calendarMonth === 12 ? calendarYear + 1 : calendarYear;
    calendarMonth = nextMonth;
    calendarYear = nextYear;
    await loadCalendarMonth(nextYear, nextMonth);
  }

  onMount(async () => {
    try {
      const [metricsData, estData] = await Promise.all([
        apiService.request<DashboardMetrics>(`${API_SALES}/orders/kpi/dashboard`),
        apiService.request<Establishment>(`${API_OPERATIONS}/establishment`)
      ]);
      metrics = metricsData;
      const nextCapacity = estData?.dailyCapacityMinutes || capacity;
      capacity = nextCapacity;
      if (estData?.capacityThresholdGreen != null) thresholdGreen = estData.capacityThresholdGreen;
      if (estData?.capacityThresholdAmber != null) thresholdAmber = estData.capacityThresholdAmber;
      if (estData?.atRiskDaysThreshold != null) atRiskDaysThreshold = estData.atRiskDaysThreshold;
      await loadCalendarMonth(calendarYear, calendarMonth, nextCapacity);
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
      <Card.Root id="workload-calendar" class="mt-8 scroll-mt-24">
        <Card.Header class="gap-4 md:flex md:flex-row md:items-center md:justify-between">
          <div>
            <Card.Title class="flex items-center gap-2">
              <Calendar class="w-5 h-5 text-primary" />
              {m["calendar.title"]()}
            </Card.Title>
            <Card.Description>{m["calendar.description"]()}</Card.Description>
          </div>
          <div class="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-1">
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10"
              onclick={handlePreviousCalendarMonth}
              disabled={calendarLoading}
              aria-label={m["common.previous"]()}
            >
              <ChevronLeft class="w-5 h-5" />
            </Button>
            <span class="min-w-36 text-center text-sm font-bold capitalize md:min-w-44">
              {calendarMonthLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10"
              onclick={handleNextCalendarMonth}
              disabled={calendarLoading}
              aria-label={m["common.next"]()}
            >
              <ChevronRight class="w-5 h-5" />
            </Button>
          </div>
        </Card.Header>
        <Card.Content class="space-y-6">
          {#if calendarError}
            <div class="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {calendarError}
            </div>
          {/if}

          {#if calendarLoading}
            <div class="h-96 rounded-lg border border-border bg-muted/40 animate-pulse"></div>
          {:else}
            <CalendarGrid
              year={calendarYear}
              month={calendarMonth}
              days={calendarData}
              dailyCapacity={capacity}
              {thresholdGreen}
              {thresholdAmber}
              showHeader={false}
            />

            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded bg-green-200"></div>
                <span class="text-sm text-muted-foreground">
                  {m["calendar.capacity.low"]({ green: String(thresholdGreen) })}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded bg-amber-200"></div>
                <span class="text-sm text-muted-foreground">
                  {m["calendar.capacity.medium"]({ green: String(thresholdGreen), amber: String(thresholdAmber) })}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded bg-red-200"></div>
                <span class="text-sm text-muted-foreground">
                  {m["calendar.capacity.high"]({ amber: String(thresholdAmber) })}
                </span>
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
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

      <!-- Financial KPI Panel -->
      <div class="mt-8">
        <FinancialKpiPanel {atRiskDaysThreshold} />
      </div>
    </div>
  {/if}
</div>
