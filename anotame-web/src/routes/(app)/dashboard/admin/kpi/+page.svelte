<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_OPERATIONS } from '$lib/services/api.svelte';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Popover from '$lib/components/ui/popover';
  import {
    TrendingUp,
    Activity,
    Truck,
    AlertCircle,
    Clock,
    Banknote,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Check,
    Loader2,
    ArrowRight,
    Users
  } from '@lucide/svelte';
  import FinancialKpiPanel from '$lib/components/dashboard/FinancialKpiPanel.svelte';
  import ReceivablesCard from '$lib/components/dashboard/ReceivablesCard.svelte';
  import CalendarGrid from '$lib/components/calendar/CalendarGrid.svelte';
  import { getLocale } from '$lib/paraglide/runtime';
  import type {
    CalendarDayResponse,
    CalendarMonthResponse,
    Establishment,
    WorkloadDayResponse
  } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';
  import { toast } from 'svelte-sonner';

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
      monthlyRevenueByPaymentMethod: {
        paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'UNSPECIFIED';
        total: number;
      }[];
      monthlyBilled: number;
      monthlyCollected: number;
      monthlyPending: number;
      openReceivable: number;
      deliveredUnpaid: number;
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
  let financeMonthOpen = $state(false);
  let financeMonthLoading = $state(false);
  let financePickerYear = $state(today.getFullYear());
  let selectedFinanceYear = $state(today.getFullYear());
  let selectedFinanceMonth = $state(today.getMonth() + 1);

  let chartMax = $derived(
    metrics?.weeklyRevenueChart.reduce((max, point) => Math.max(max, point.totalPaid), 0) || 100
  );
  let calendarMonthLabel = $derived(
    new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(
      new Date(calendarYear, calendarMonth - 1, 1)
    )
  );
  let selectedFinanceMonthParam = $derived(
    getMonthParam(selectedFinanceYear, selectedFinanceMonth)
  );
  let selectedFinanceMonthLabel = $derived(
    formatMonthLabel(selectedFinanceYear, selectedFinanceMonth)
  );
  let selectedFinanceMonthlyRevenue = $derived(metrics?.finance.monthlyRevenue ?? 0);
  let selectedFinancePaymentMethodTotals = $derived(
    metrics?.finance.monthlyRevenueByPaymentMethod ?? []
  );
  // Cohort figures: billed and collected both follow tickets *created* in the selected month, so
  // they subtract. selectedFinanceMonthlyRevenue is cash-in by payment date and is not comparable.
  let selectedFinanceBilled = $derived(metrics?.finance.monthlyBilled ?? 0);
  let selectedFinanceCollected = $derived(metrics?.finance.monthlyCollected ?? 0);
  let selectedFinancePending = $derived(metrics?.finance.monthlyPending ?? 0);
  let collectedPct = $derived(
    selectedFinanceBilled > 0 ? (selectedFinanceCollected / selectedFinanceBilled) * 100 : 0
  );
  let financeMonthOptions = $derived(
    Array.from({ length: 12 }, (_, index) => {
      const monthValue = index + 1;

      return {
        value: monthValue,
        label: new Intl.DateTimeFormat(getLocale(), { month: 'short' }).format(
          new Date(financePickerYear, index, 1)
        )
      };
    })
  );
  let concernCards = $derived.by(() => [
    {
      id: 'attention',
      title: m['kpi.concern.immediate.title'](),
      description: m['kpi.concern.immediate.description'](),
      icon: AlertCircle,
      toneClass: 'border-destructive/20 bg-destructive/5',
      iconClass: 'bg-destructive/10 text-destructive',
      metrics: [
        {
          value: String(metrics?.workload.readyForPickup ?? 0),
          label: m['kpi.card.ready']()
        },
        {
          value: formatCurrency(metrics?.finance.openReceivable ?? 0),
          label: m['kpi.card.receivables']()
        }
      ]
    },
    {
      id: 'planning',
      title: m['kpi.concern.operations.title'](),
      description: m['kpi.concern.operations.description'](),
      icon: Activity,
      toneClass: 'border-primary/20 bg-primary/5',
      iconClass: 'bg-primary/10 text-primary',
      metrics: [
        {
          value: String(metrics?.workload.pendingPipeline ?? 0),
          label: m['kpi.card.pipeline']()
        },
        {
          value: String(metrics?.workload.comingDeliveries ?? 0),
          label: m['kpi.card.upcoming']()
        }
      ]
    },
    {
      id: 'revenue',
      title: m['kpi.concern.revenue.title'](),
      description: m['kpi.concern.revenue.description'](),
      icon: Banknote,
      toneClass: 'border-emerald-500/20 bg-emerald-500/5',
      iconClass: 'bg-emerald-500/10 text-emerald-700',
      metrics: [
        {
          value: formatCurrency(metrics?.finance.todayRevenue ?? 0),
          label: m['kpi.card.todayRevenue']()
        },
        {
          value: formatCurrency(selectedFinanceMonthlyRevenue),
          label: selectedFinanceMonthLabel
        }
      ]
    },
    {
      id: 'customers',
      title: m['kpi.concern.customers.title'](),
      description: m['kpi.concern.customers.description'](),
      icon: Users,
      toneClass: 'border-amber-500/20 bg-amber-500/5',
      iconClass: 'bg-amber-500/10 text-amber-700',
      metrics: [
        {
          value: `${atRiskDaysThreshold}+`,
          label: m['kpi.concern.customers.window']()
        },
        {
          value: m['kpi.concern.customers.focusValue'](),
          label: m['kpi.concern.customers.focusLabel']()
        }
      ]
    }
  ]);

  function getMonthParam(yearValue: number, monthValue: number): string {
    return `${yearValue}-${String(monthValue).padStart(2, '0')}`;
  }

  function formatMonthLabel(yearValue: number, monthValue: number): string {
    return new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(
      new Date(yearValue, monthValue - 1, 1)
    );
  }

  function getPaymentMethodLabel(method: string): string {
    if (method === 'CASH') return m['orders.detail.paymentCash']();
    if (method === 'CARD') return m['orders.detail.paymentCard']();
    if (method === 'TRANSFER') return m['orders.detail.paymentTransfer']();
    return m['kpi.paymentMethod.unspecified']();
  }

  function isFutureFinanceMonth(yearValue: number, monthValue: number): boolean {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    return yearValue > currentYear || (yearValue === currentYear && monthValue > currentMonth);
  }

  async function fetchDashboardMetrics(monthParam = selectedFinanceMonthParam) {
    return apiService.request<DashboardMetrics>(
      `${API_SALES}/orders/kpi/dashboard?month=${encodeURIComponent(monthParam)}`
    );
  }

  async function handleFinanceMonthSelect(monthValue: number) {
    if (isFutureFinanceMonth(financePickerYear, monthValue)) return;

    const previousYear = selectedFinanceYear;
    const previousMonth = selectedFinanceMonth;
    const nextYear = financePickerYear;
    const nextMonthParam = getMonthParam(nextYear, monthValue);
    selectedFinanceYear = nextYear;
    selectedFinanceMonth = monthValue;
    financeMonthOpen = false;
    financeMonthLoading = true;

    try {
      metrics = await fetchDashboardMetrics(nextMonthParam);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      selectedFinanceYear = previousYear;
      selectedFinanceMonth = previousMonth;
      financePickerYear = previousYear;
      toast.error(m['kpi.monthPicker.loadError']());
    } finally {
      financeMonthLoading = false;
    }
  }

  function handleFinanceMonthOpenChange(open: boolean) {
    financeMonthOpen = open;
    if (open) {
      financePickerYear = selectedFinanceYear;
    }
  }

  function handlePreviousFinanceYear() {
    financePickerYear -= 1;
  }

  function handleNextFinanceYear() {
    if (financePickerYear < today.getFullYear()) {
      financePickerYear += 1;
    }
  }

  async function loadCalendarMonth(
    yearValue = calendarYear,
    monthValue = calendarMonth,
    capacityMinutes = capacity
  ) {
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
      calendarError = m['common.noData']();
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
        fetchDashboardMetrics(selectedFinanceMonthParam),
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
      console.error('Error loading KPIs:', e);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="space-y-8 animate-in fade-in duration-300">
  <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
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
    <div class="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
      {m['kpi.loading']()}
    </div>
  {:else}
    <section class="rounded-[2rem] border border-border/70 bg-gradient-to-br from-primary/8 via-card to-emerald-500/8 p-6 shadow-sm md:p-8">
      <div class="max-w-3xl space-y-3">
        <span class="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {m['kpi.concerns.eyebrow']()}
        </span>
        <div>
          <h2 class="text-2xl font-heading font-bold text-foreground md:text-3xl">
            {m['kpi.concerns.title']()}
          </h2>
          <p class="mt-2 text-sm text-muted-foreground md:text-base">
            {m['kpi.concerns.description']()}
          </p>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {#each concernCards as concern (concern.id)}
          {@const IconComponent = concern.icon}
          <a
            href={`#${concern.id}`}
            class={`group rounded-[1.5rem] border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${concern.toneClass}`}
          >
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-2">
                <h3 class="text-lg font-heading font-bold text-foreground">{concern.title}</h3>
                <p class="text-sm leading-6 text-muted-foreground">{concern.description}</p>
              </div>
              <div class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${concern.iconClass}`}>
                <IconComponent class="h-5 w-5" />
              </div>
            </div>

            <div class="mt-5 grid gap-2 sm:grid-cols-2">
              {#each concern.metrics as metric (metric.label)}
                <div class="rounded-2xl border border-background/70 bg-background/80 px-3 py-2 backdrop-blur">
                  <p class="text-sm font-mono font-semibold text-foreground">{metric.value}</p>
                  <p class="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
              {/each}
            </div>

            <div class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              {m['kpi.concerns.viewSection']()}
              <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </a>
        {/each}
      </div>
    </section>

    <section id="attention" class="scroll-mt-24 space-y-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-xl font-heading font-bold">
            <AlertCircle class="h-5 w-5 text-destructive" />
            {m['kpi.concern.immediate.title']()}
          </h2>
          <p class="mt-2 max-w-3xl text-sm text-muted-foreground">
            {m['kpi.section.immediateDesc']()}
          </p>
        </div>
        <span class="inline-flex w-fit rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
          {m['kpi.concern.immediate.eyebrow']()}
        </span>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.ready']()}</Card.Title>
            <Truck class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono text-success">
              {metrics.workload.readyForPickup}
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {m['kpi.card.readyDesc']()}
            </p>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.todayDeliveries']()}</Card.Title>
            <AlertCircle class="h-4 w-4 text-destructive" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono text-destructive">
              {metrics.workload.todayDeliveries}
            </div>
            <p class="mt-1 text-xs font-medium text-destructive/80">
              {m['kpi.card.todayDeliveriesDesc']()}
            </p>
          </Card.Content>
        </Card.Root>

        <ReceivablesCard
          openReceivable={metrics.finance.openReceivable}
          deliveredUnpaid={metrics.finance.deliveredUnpaid}
        />
      </div>
    </section>

    <section id="planning" class="scroll-mt-24 space-y-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-xl font-heading font-bold">
            <Activity class="h-5 w-5 text-primary" />
            {m['kpi.concern.operations.title']()}
          </h2>
          <p class="mt-2 max-w-3xl text-sm text-muted-foreground">
            {m['kpi.section.operationsDesc']()}
          </p>
        </div>
        <span class="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {m['kpi.concern.operations.eyebrow']()}
        </span>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.pipeline']()}</Card.Title>
            <Clock class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono text-primary">
              {metrics.workload.pendingPipeline}
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {m['kpi.card.pipelineDesc']()}
            </p>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.upcoming']()}</Card.Title>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-2xl font-bold font-mono">
              {metrics.workload.comingDeliveries}
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {m['kpi.card.upcomingDesc']()}
            </p>
          </Card.Content>
        </Card.Root>
      </div>

      <div class="rounded-xl border bg-card p-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">{m['kpi.workload.progress']()}</span>
          <span class="text-sm text-foreground/70">
            {metrics.workload.readyForPickup} de {metrics.workload.totalActive} terminados
          </span>
        </div>
        <div class="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {#if metrics.workload.totalActive > 0}
            {@const pctReady = (metrics.workload.readyForPickup / metrics.workload.totalActive) * 100}
            <div
              class="h-full bg-success transition-all duration-1000 ease-out"
              style={`width: ${pctReady}%`}
            ></div>
            <div
              class="h-full bg-primary/40 transition-all duration-1000 ease-out"
              style={`width: ${100 - pctReady}%`}
            ></div>
          {/if}
        </div>
      </div>

      <Card.Root id="workload-calendar" class="scroll-mt-24">
        <Card.Header class="gap-4 md:flex md:flex-row md:items-center md:justify-between">
          <div>
            <Card.Title class="flex items-center gap-2">
              <Calendar class="h-5 w-5 text-primary" />
              {m['calendar.title']()}
            </Card.Title>
            <Card.Description>{m['calendar.description']()}</Card.Description>
          </div>
          <div class="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 p-1">
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10"
              onclick={handlePreviousCalendarMonth}
              disabled={calendarLoading}
              aria-label={m['common.previous']()}
            >
              <ChevronLeft class="h-5 w-5" />
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
              aria-label={m['common.next']()}
            >
              <ChevronRight class="h-5 w-5" />
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
            <div class="h-96 animate-pulse rounded-lg border border-border bg-muted/40"></div>
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
                <div class="h-4 w-4 rounded bg-green-200"></div>
                <span class="text-sm text-muted-foreground">
                  {m['calendar.capacity.low']({ green: String(thresholdGreen) })}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <div class="h-4 w-4 rounded bg-amber-200"></div>
                <span class="text-sm text-muted-foreground">
                  {m['calendar.capacity.medium']({
                    green: String(thresholdGreen),
                    amber: String(thresholdAmber)
                  })}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <div class="h-4 w-4 rounded bg-red-200"></div>
                <span class="text-sm text-muted-foreground">
                  {m['calendar.capacity.high']({ amber: String(thresholdAmber) })}
                </span>
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </section>

    <section id="revenue" class="scroll-mt-24 space-y-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-xl font-heading font-bold">
            <Banknote class="h-5 w-5 text-success" />
            {m['kpi.concern.revenue.title']()}
          </h2>
          <p class="mt-2 max-w-3xl text-sm text-muted-foreground">
            {m['kpi.section.financeDesc']()}
          </p>
        </div>
        <span class="inline-flex w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
          {m['kpi.concern.revenue.eyebrow']()}
        </span>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between pb-2">
            <Card.Title class="text-sm font-medium">{m['kpi.card.todayRevenue']()}</Card.Title>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono">
              {formatCurrency(metrics.finance.todayRevenue)}
            </div>
            <p class="mt-1 text-xs text-muted-foreground">{m['kpi.card.todayRevenueDesc']()}</p>
          </Card.Content>
        </Card.Root>

        <Popover.Root bind:open={financeMonthOpen} onOpenChange={handleFinanceMonthOpenChange}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Card.Root
                {...props}
                aria-label={m['kpi.monthPicker.ariaLabel']({ month: selectedFinanceMonthLabel })}
                class={`cursor-pointer transition-all hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${financeMonthLoading ? 'opacity-80' : ''}`}
              >
                <Card.Header class="flex flex-row items-center justify-between pb-2">
                  <Card.Title class="text-sm font-medium">{m['kpi.card.monthRevenueSelectable']()}</Card.Title>
                  {#if financeMonthLoading}
                    <Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
                  {:else}
                    <Calendar class="h-4 w-4 text-muted-foreground" />
                  {/if}
                </Card.Header>
                <Card.Content>
                  <div class="text-3xl font-bold font-mono">
                    {formatCurrency(selectedFinanceMonthlyRevenue)}
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {m['kpi.card.monthRevenueSelectedDesc']({ month: selectedFinanceMonthLabel })}
                  </p>
                  <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3">
                    {#each selectedFinancePaymentMethodTotals as category (category.paymentMethod)}
                      <div class="min-w-0">
                        <p class="truncate text-xs text-muted-foreground">
                          {getPaymentMethodLabel(category.paymentMethod)}
                        </p>
                        <p class="truncate text-sm font-mono font-semibold">
                          {formatCurrency(category.total)}
                        </p>
                      </div>
                    {/each}
                  </div>
                </Card.Content>
              </Card.Root>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-80 max-w-[calc(100vw-2rem)]" align="center">
            <div class="space-y-4">
              <div class="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-10 w-10"
                  onclick={handlePreviousFinanceYear}
                  disabled={financeMonthLoading}
                  aria-label={m['common.previous']()}
                >
                  <ChevronLeft class="h-5 w-5" />
                </Button>
                <span class="min-w-24 text-center text-sm font-bold">
                  {financePickerYear}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-10 w-10"
                  onclick={handleNextFinanceYear}
                  disabled={financeMonthLoading || financePickerYear >= today.getFullYear()}
                  aria-label={m['common.next']()}
                >
                  <ChevronRight class="h-5 w-5" />
                </Button>
              </div>

              <div class="grid grid-cols-3 gap-2">
                {#each financeMonthOptions as option (option.value)}
                  {@const isMonthSelected = selectedFinanceYear === financePickerYear && selectedFinanceMonth === option.value}
                  {@const isMonthDisabled = isFutureFinanceMonth(financePickerYear, option.value)}
                  <Button
                    variant={isMonthSelected ? 'default' : 'outline'}
                    class="h-12 justify-center capitalize touch-manipulation"
                    disabled={financeMonthLoading || isMonthDisabled}
                    aria-label={m['kpi.monthPicker.selectMonth']({
                      month: formatMonthLabel(financePickerYear, option.value)
                    })}
                    onclick={() => handleFinanceMonthSelect(option.value)}
                  >
                    <span class="truncate">{option.label}</span>
                    {#if isMonthSelected}
                      <Check class="ml-1 h-3 w-3" />
                    {/if}
                  </Button>
                {/each}
              </div>
            </div>
          </Popover.Content>
        </Popover.Root>

        <Card.Root>
          <Card.Header class="pb-2">
            <Card.Title class="text-sm font-medium">
              {m['kpi.finance.billed']()}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="text-3xl font-bold font-mono">
              {formatCurrency(selectedFinanceBilled)}
            </div>
            <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div class="h-full rounded-full bg-success" style="width: {collectedPct}%"></div>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-x-4 border-t border-border pt-3">
              <div class="min-w-0">
                <p class="truncate text-xs text-muted-foreground">{m['kpi.finance.collected']()}</p>
                <p class="truncate text-sm font-mono font-semibold text-success">
                  {formatCurrency(selectedFinanceCollected)}
                </p>
              </div>
              <div class="min-w-0">
                <p class="truncate text-xs text-muted-foreground">{m['kpi.finance.pending']()}</p>
                <p class="truncate text-sm font-mono font-semibold text-amber-500">
                  {formatCurrency(selectedFinancePending)}
                </p>
              </div>
            </div>
            <p class="mt-3 text-xs text-muted-foreground">{m['kpi.finance.cohortNote']()}</p>
          </Card.Content>
        </Card.Root>
      </div>

      <Card.Root>
        <Card.Header>
          <Card.Title>{m['kpi.chart.weeklyTitle']()}</Card.Title>
          <Card.Description>{m['kpi.chart.weeklyDesc']()}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="mt-4 flex h-48 w-full items-end gap-2">
            {#each metrics.weeklyRevenueChart as day, i (day.date)}
              {@const heightPct = chartMax > 0 ? (day.totalPaid / chartMax) * 100 : 0}
              {@const isBarActive = activeBarIndex === i}
              <div
                class="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
                role="button"
                tabindex="0"
                aria-label={formatCurrency(day.totalPaid)}
                onclick={() => (activeBarIndex = isBarActive ? null : i)}
                onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (activeBarIndex = isBarActive ? null : i)}
              >
                <div class={`absolute -top-10 z-10 rounded bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-lg transition-transform pointer-events-none ${isBarActive ? 'scale-100' : 'scale-0 group-hover:scale-100'}`}>
                  {formatCurrency(day.totalPaid)}
                </div>
                <div
                  class="w-full max-w-10 rounded-t-sm bg-primary/80 transition-all duration-500 ease-out hover:bg-primary"
                  style={`height: ${heightPct}%`}
                ></div>
                <div class="mt-2 w-full truncate pb-2 text-center text-[10px] uppercase -rotate-45deg text-muted-foreground">
                  {#if day.date}
                    {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </section>

    <section id="customers" class="scroll-mt-24 space-y-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-xl font-heading font-bold">
            <Users class="h-5 w-5 text-amber-600" />
            {m['kpi.concern.customers.title']()}
          </h2>
          <p class="mt-2 max-w-3xl text-sm text-muted-foreground">
            {m['kpi.section.customersDesc']()}
          </p>
        </div>
        <span class="inline-flex w-fit rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          {m['kpi.concern.customers.eyebrow']()}
        </span>
      </div>

      <FinancialKpiPanel {atRiskDaysThreshold} />
    </section>
  {/if}
</div>
