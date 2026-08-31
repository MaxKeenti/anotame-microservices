<script lang="ts">
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Truck, AlertCircle, Clock, Calendar, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import ReceivablesCard from '$lib/components/dashboard/ReceivablesCard.svelte';
  import CalendarGrid from '$lib/components/calendar/CalendarGrid.svelte';
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
  <div class="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
    {m['kpi.loading']()}
  </div>
{:else}
  <div class="space-y-6">
    <p class="max-w-3xl text-sm text-muted-foreground">
      {m['kpi.section.operationsDesc']()}
    </p>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between pb-2">
          <Card.Title class="text-sm font-medium">{m['kpi.card.ready']()}</Card.Title>
          <Truck class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-3xl font-bold font-mono text-success">
            {metrics.workload.readyForPickup}
          </div>
          <p class="mt-1 text-xs text-muted-foreground">{m['kpi.card.readyDesc']()}</p>
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

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between pb-2">
          <Card.Title class="text-sm font-medium">{m['kpi.card.pipeline']()}</Card.Title>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-3xl font-bold font-mono text-primary">
            {metrics.workload.pendingPipeline}
          </div>
          <p class="mt-1 text-xs text-muted-foreground">{m['kpi.card.pipelineDesc']()}</p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between pb-2">
          <Card.Title class="text-sm font-medium">{m['kpi.card.upcoming']()}</Card.Title>
          <Calendar class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-3xl font-bold font-mono">
            {metrics.workload.comingDeliveries}
          </div>
          <p class="mt-1 text-xs text-muted-foreground">{m['kpi.card.upcomingDesc']()}</p>
        </Card.Content>
      </Card.Root>
    </div>

    <ReceivablesCard
      openReceivable={metrics.finance.openReceivable}
      deliveredUnpaid={metrics.finance.deliveredUnpaid}
    />

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
            dailyCapacity={dashboard.capacity}
            thresholdGreen={dashboard.thresholdGreen}
            thresholdAmber={dashboard.thresholdAmber}
            showHeader={false}
          />

          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div class="flex items-center gap-3">
              <div class="h-4 w-4 rounded bg-green-200"></div>
              <span class="text-sm text-muted-foreground">
                {m['calendar.capacity.low']({ green: String(dashboard.thresholdGreen) })}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <div class="h-4 w-4 rounded bg-amber-200"></div>
              <span class="text-sm text-muted-foreground">
                {m['calendar.capacity.medium']({
                  green: String(dashboard.thresholdGreen),
                  amber: String(dashboard.thresholdAmber)
                })}
              </span>
            </div>
            <div class="flex items-center gap-3">
              <div class="h-4 w-4 rounded bg-red-200"></div>
              <span class="text-sm text-muted-foreground">
                {m['calendar.capacity.high']({ amber: String(dashboard.thresholdAmber) })}
              </span>
            </div>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
{/if}
