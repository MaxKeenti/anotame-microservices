<script lang="ts">
  import { Spinner } from '$lib/components/ui/spinner';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import { HintText, LeadText, PeriodStepper, StatePanel } from '$lib/components/common';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';
  import KpiStatCard from '$lib/components/dashboard/kpi-stat-card.svelte';
  import BarChart from '$lib/components/dashboard/bar-chart.svelte';
  import KpiBreakdown from '$lib/components/dashboard/kpi-breakdown.svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { TrendingUp, Calendar } from '@lucide/svelte';
  import { getLocale } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages';
  import { getKpiDashboard } from '../kpiContext';

  const dashboard = getKpiDashboard();
  const today = new Date();

  let monthOpen = $state(false);
  let pickerYear = $state(today.getFullYear());

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
      <LeadText text={m['kpi.section.financeDesc']()} class="max-w-2xl" />

      <Popover.Root bind:open={monthOpen} onOpenChange={handleMonthOpenChange}>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button size="touch"
              {...props}
              variant="outline"
              class="w-fit gap-2 capitalize"
              aria-label={m['kpi.monthPicker.ariaLabel']({ month: selectedMonthLabel })}
            >
              {#if dashboard.monthLoading}
                <Spinner aria-hidden="true" />
              {:else}
                <Calendar class="h-4 w-4" />
              {/if}
              {selectedMonthLabel}
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-80 max-w-[calc(100vw-2rem)]" align="end">
          <div class="space-y-4">
            <PeriodStepper
              label={String(pickerYear)}
              onPrevious={() => (pickerYear -= 1)}
              onNext={() => (pickerYear += 1)}
              previousDisabled={dashboard.monthLoading}
              nextDisabled={dashboard.monthLoading || pickerYear >= today.getFullYear()}
            />

            <ToggleGroup.Root
              type="single"
              variant="segmented"
              size="touch"
              spacing={2}
              aria-label={m['kpi.monthPicker.ariaLabel']({ month: selectedMonthLabel })}
              value={pickerYear === dashboard.selectedYear ? String(dashboard.selectedMonth) : ''}
              onValueChange={(v) => v && handleMonthSelect(Number(v))}
              class="grid w-full grid-cols-3"
            >
              {#each monthOptions as option (option.value)}
                <ToggleGroup.Item
                  value={String(option.value)}
                  class="capitalize"
                  disabled={isFutureMonth(pickerYear, option.value) || dashboard.monthLoading}
                  aria-label={m['kpi.monthPicker.selectMonth']({
                    month: formatMonthLabel(pickerYear, option.value)
                  })}
                >
                  {option.label}
                </ToggleGroup.Item>
              {/each}
            </ToggleGroup.Root>
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
            { label: m['kpi.finance.collected'](), value: formatCurrency(collected), tone: 'text-success-text' },
            { label: m['kpi.finance.pending'](), value: formatCurrency(pending), tone: 'text-warning-text' },
          ]}
        />
        <HintText text={m['kpi.finance.cohortNote']()} class="mt-3" />
      </KpiStatCard>
    </div>

    <Card.Root>
      <Card.Header>
        <Card.Title>{m['kpi.chart.weeklyTitle']()}</Card.Title>
        <Card.Description>{m['kpi.chart.weeklyDesc']()}</Card.Description>
      </Card.Header>
      <Card.Content>
        <BarChart
          format={formatCurrency}
          bars={metrics.weeklyRevenueChart.map((day) => ({
            key: day.date,
            value: day.totalPaid,
            label: day.date
              ? new Date(day.date).toLocaleDateString(getLocale(), { weekday: 'short' })
              : '',
          }))}
        />
      </Card.Content>
    </Card.Root>
  </div>
{/if}
