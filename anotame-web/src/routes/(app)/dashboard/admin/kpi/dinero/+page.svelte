<script lang="ts">
  import { formatCurrency } from '$lib/utils/formatUtils';
  import { StatePanel } from '$lib/components/common';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import KpiStatCard from '$lib/components/dashboard/kpi-stat-card.svelte';
  import KpiBreakdown from '$lib/components/dashboard/kpi-breakdown.svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { TrendingUp, Calendar, ChevronLeft, ChevronRight, Check, Loader2 } from '@lucide/svelte';
  import { getLocale } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages';
  import { getKpiDashboard } from '../kpiContext';

  const dashboard = getKpiDashboard();
  const today = new Date();

  let monthOpen = $state(false);
  let pickerYear = $state(today.getFullYear());
  let activeBarIndex = $state<number | null>(null);

  let metrics = $derived(dashboard.metrics);
  let selectedMonthLabel = $derived(
    formatMonthLabel(dashboard.selectedYear, dashboard.selectedMonth)
  );
  // Cohort figures: billed and collected both follow tickets *created* in the
  // selected month, so they subtract. monthlyRevenue is cash-in by payment date
  // and is not comparable.
  let billed = $derived(metrics?.finance.monthlyBilled ?? 0);
  let collected = $derived(metrics?.finance.monthlyCollected ?? 0);
  let pending = $derived(metrics?.finance.monthlyPending ?? 0);
  let collectedPct = $derived(billed > 0 ? (collected / billed) * 100 : 0);
  let chartMax = $derived(
    metrics?.weeklyRevenueChart.reduce((max, point) => Math.max(max, point.totalPaid), 0) || 100
  );
  let monthOptions = $derived(
    Array.from({ length: 12 }, (_, index) => ({
      value: index + 1,
      label: new Intl.DateTimeFormat(getLocale(), { month: 'short' }).format(
        new Date(pickerYear, index, 1)
      )
    }))
  );

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

  function isFutureMonth(yearValue: number, monthValue: number): boolean {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    return yearValue > currentYear || (yearValue === currentYear && monthValue > currentMonth);
  }

  async function handleMonthSelect(monthValue: number) {
    if (isFutureMonth(pickerYear, monthValue)) return;

    monthOpen = false;
    await dashboard.selectMonth(pickerYear, monthValue);
    pickerYear = dashboard.selectedYear;
  }

  function handleMonthOpenChange(open: boolean) {
    monthOpen = open;
    if (open) {
      pickerYear = dashboard.selectedYear;
    }
  }
</script>

{#if dashboard.isLoading || !metrics}
  <StatePanel message={m['kpi.loading']()} />
{:else}
  <div class="space-y-6">
    <!-- One period control governs everything below it, instead of each card
         carrying its own date state. -->
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p class="max-w-2xl text-sm text-muted-foreground">
        {m['kpi.section.financeDesc']()}
      </p>

      <Popover.Root bind:open={monthOpen} onOpenChange={handleMonthOpenChange}>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="outline"
              class="h-11 w-fit gap-2 capitalize"
              aria-label={m['kpi.monthPicker.ariaLabel']({ month: selectedMonthLabel })}
            >
              {#if dashboard.monthLoading}
                <Loader2 class="h-4 w-4 animate-spin" />
              {:else}
                <Calendar class="h-4 w-4" />
              {/if}
              {selectedMonthLabel}
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-80 max-w-[calc(100vw-2rem)]" align="end">
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                class="h-10 w-10"
                onclick={() => (pickerYear -= 1)}
                disabled={dashboard.monthLoading}
                aria-label={m['common.previous']()}
              >
                <ChevronLeft class="h-5 w-5" />
              </Button>
              <span class="min-w-24 text-center text-sm font-bold">{pickerYear}</span>
              <Button
                variant="ghost"
                size="icon"
                class="h-10 w-10"
                onclick={() => (pickerYear += 1)}
                disabled={dashboard.monthLoading || pickerYear >= today.getFullYear()}
                aria-label={m['common.next']()}
              >
                <ChevronRight class="h-5 w-5" />
              </Button>
            </div>

            <div class="grid grid-cols-3 gap-2">
              {#each monthOptions as option (option.value)}
                {@const isSelected =
                  pickerYear === dashboard.selectedYear && option.value === dashboard.selectedMonth}
                {@const isDisabled = isFutureMonth(pickerYear, option.value)}
                <Button
                  variant={isSelected ? 'default' : 'ghost'}
                  class="h-11 capitalize"
                  disabled={isDisabled || dashboard.monthLoading}
                  aria-label={m['kpi.monthPicker.selectMonth']({
                    month: formatMonthLabel(pickerYear, option.value)
                  })}
                  onclick={() => handleMonthSelect(option.value)}
                >
                  {option.label}
                  {#if isSelected}
                    <Check class="ml-1 h-3.5 w-3.5" />
                  {/if}
                </Button>
              {/each}
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      <KpiStatCard
        title={m['kpi.card.todayRevenue']()}
        value={formatCurrency(metrics.finance.todayRevenue)}
        description={m['kpi.card.todayRevenueDesc']()}
        icon={TrendingUp}
      />

      <KpiStatCard
        title={m['kpi.card.monthRevenueSelectable']()}
        value={formatCurrency(metrics.finance.monthlyRevenue)}
        description={m['kpi.card.monthRevenueSelectedDesc']({ month: selectedMonthLabel })}
        icon={Calendar}
      >
        <KpiBreakdown
          class="mt-4 gap-y-2"
          entries={metrics.finance.monthlyRevenueByPaymentMethod.map((category) => ({
            label: getPaymentMethodLabel(category.paymentMethod),
            value: formatCurrency(category.total),
          }))}
        />
      </KpiStatCard>

      <KpiStatCard title={m['kpi.finance.billed']()} value={formatCurrency(billed)}>
        <Progress
          value={collectedPct}
          class="mt-3 h-2"
          indicatorClass="bg-success"
          aria-label={m['kpi.finance.collected']()}
        />
        <KpiBreakdown
          entries={[
            { label: m['kpi.finance.collected'](), value: formatCurrency(collected), tone: 'text-success' },
            { label: m['kpi.finance.pending'](), value: formatCurrency(pending), tone: 'text-amber-500' },
          ]}
        />
        <p class="mt-3 text-xs text-muted-foreground">{m['kpi.finance.cohortNote']()}</p>
      </KpiStatCard>
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
              onkeydown={(e) =>
                (e.key === 'Enter' || e.key === ' ') && (activeBarIndex = isBarActive ? null : i)}
            >
              <div
                class={`absolute -top-10 z-10 rounded bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-lg transition-transform pointer-events-none ${isBarActive ? 'scale-100' : 'scale-0 group-hover:scale-100'}`}
              >
                {formatCurrency(day.totalPaid)}
              </div>
              <div
                class="w-full max-w-10 rounded-t-sm bg-primary/80 transition-all duration-500 ease-out hover:bg-primary"
                style={`height: ${heightPct}%`}
              ></div>
              <div class="mt-2 w-full truncate pb-2 text-center text-[10px] uppercase text-muted-foreground">
                {#if day.date}
                  {new Date(day.date).toLocaleDateString(getLocale(), { weekday: 'short' })}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  </div>
{/if}
