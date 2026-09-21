<script lang="ts">
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { CAPACITY_TONE } from '$lib/utils/capacity';
  import { InlineAlert, LeadText, PeriodStepper, StatePanel } from '$lib/components/common';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import KpiStatCard from '$lib/components/dashboard/kpi-stat-card.svelte';
  import KpiLegend from '$lib/components/dashboard/kpi-legend.svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Truck, AlertCircle, Clock, Calendar } from '@lucide/svelte';
  import ReceivablesCard from '$lib/components/dashboard/receivables-card.svelte';
  import CalendarGrid from '$lib/components/calendar/calendar-grid.svelte';
  import { getLocale } from '$lib/paraglide/runtime';
  import type { CalendarDayResponse, CalendarMonthResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';
  import { getKpiDashboard, getMonthParam } from '../kpiContext';

  const dashboard = getKpiDashboard();
  const today = new Date();

  let calendarYear = $state(today.getFullYear());
  let calendarMonth = $state(today.getMonth() + 1);
  let calendarData = $state<CalendarDayResponse[]>([]);
  let calendarLoading = $state(true);
  let calendarError = $state<string | null>(null);

  let metrics = $derived(dashboard.metrics);
  let hasActiveWorkload = $derived((metrics?.workload.totalActive ?? 0) > 0);
  let readyPct = $derived(
    metrics && hasActiveWorkload
      ? (metrics.workload.readyForPickup / metrics.workload.totalActive) * 100
      : 0
  );
  let calendarMonthLabel = $derived(
    new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }).format(
      new Date(calendarYear, calendarMonth - 1, 1)
    )
  );

  // Capacity is read as a dependency: the layout resolves the establishment
  // settings in parallel with the first calendar fetch, so the grid refetches
  // once the real daily capacity lands instead of keeping the 480 fallback.
  $effect(() => {
    void loadCalendarMonth(calendarYear, calendarMonth, dashboard.capacity);
  });

  async function loadCalendarMonth(
    yearValue: number,
    monthValue: number,
    capacityMinutes: number
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

  function handlePreviousCalendarMonth() {
    const nextMonth = calendarMonth === 1 ? 12 : calendarMonth - 1;
    calendarYear = calendarMonth === 1 ? calendarYear - 1 : calendarYear;
    calendarMonth = nextMonth;
  }

  function handleNextCalendarMonth() {
    const nextMonth = calendarMonth === 12 ? 1 : calendarMonth + 1;
    calendarYear = calendarMonth === 12 ? calendarYear + 1 : calendarYear;
    calendarMonth = nextMonth;
  }
</script>

{#if dashboard.isLoading || !metrics}
  <StatePanel message={m['kpi.loading']()} />
{:else}
  <div class="space-y-6">
    <LeadText text={m['kpi.section.operationsDesc']()} />

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
      <KpiStatCard
        title={m['kpi.card.ready']()}
        value={metrics.workload.readyForPickup}
        description={m['kpi.card.readyDesc']()}
        icon={Truck}
        tone="success"
      />

      <KpiStatCard
        title={m['kpi.card.todayDeliveries']()}
        value={metrics.workload.todayDeliveries}
        description={m['kpi.card.todayDeliveriesDesc']()}
        icon={AlertCircle}
        tone="destructive"
      />

      <KpiStatCard
        title={m['kpi.card.pipeline']()}
        value={metrics.workload.pendingPipeline}
        description={m['kpi.card.pipelineDesc']()}
        icon={Clock}
        tone="primary"
      />

      <KpiStatCard
        title={m['kpi.card.upcoming']()}
        value={metrics.workload.comingDeliveries}
        description={m['kpi.card.upcomingDesc']()}
        icon={Calendar}
      />
    </div>

    <ReceivablesCard
      openReceivable={metrics.finance.openReceivable}
      deliveredUnpaid={metrics.finance.deliveredUnpaid}
    />

    <Card.Root class="p-4">
      <div class="mb-2 flex items-center justify-between">
        <Card.Title class="text-sm font-medium">{m['kpi.workload.progress']()}</Card.Title>
        <Card.Description class="text-sm text-foreground/70">
          {m['kpi.workload.progressCount']({
            ready: metrics.workload.readyForPickup,
            total: metrics.workload.totalActive,
          })}
        </Card.Description>
      </div>
      <!-- The unfinished remainder is the track, so the two segments always meet. -->
      <Progress
        value={readyPct}
        class={hasActiveWorkload ? 'h-3 bg-primary/40' : 'h-3'}
        indicatorClass="bg-success transition-all duration-1000 ease-out"
        aria-label={m['kpi.workload.progress']()}
      />
    </Card.Root>

    <Card.Root id="workload-calendar" class="scroll-mt-24">
      <Card.Header class="gap-4 md:flex md:flex-row md:items-center md:justify-between">
        <div>
          <Card.Title class="flex items-center gap-2">
            <Calendar class="h-5 w-5 text-primary" />
            {m['calendar.title']()}
          </Card.Title>
          <Card.Description>{m['calendar.description']()}</Card.Description>
        </div>
        <PeriodStepper
          framed
          label={calendarMonthLabel}
          labelWidth="min-w-36 md:min-w-44"
          onPrevious={handlePreviousCalendarMonth}
          onNext={handleNextCalendarMonth}
          previousDisabled={calendarLoading}
          nextDisabled={calendarLoading}
        />
      </Card.Header>
      <Card.Content class="space-y-6">
        {#if calendarError}
          <InlineAlert text={calendarError} showIcon={false} class="rounded-lg p-4 font-normal" />
        {/if}

        {#if calendarLoading}
          <Skeleton class="h-96 rounded-lg" />
        {:else}
          <CalendarGrid
            year={calendarYear}
            month={calendarMonth}
            days={calendarData}
            dailyCapacity={dashboard.capacity}
            thresholdGreen={dashboard.thresholdGreen}
            thresholdAmber={dashboard.thresholdAmber}
            showHeader={false}
          />

          <KpiLegend
            entries={[
              {
                swatch: CAPACITY_TONE.low.surface,
                label: m['calendar.capacity.low']({ green: String(dashboard.thresholdGreen) }),
              },
              {
                swatch: CAPACITY_TONE.medium.surface,
                label: m['calendar.capacity.medium']({
                  green: String(dashboard.thresholdGreen),
                  amber: String(dashboard.thresholdAmber),
                }),
              },
              {
                swatch: CAPACITY_TONE.high.surface,
                label: m['calendar.capacity.high']({ amber: String(dashboard.thresholdAmber) }),
              },
            ]}
          />
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
{/if}
