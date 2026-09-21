<script lang="ts">
  import { Heading, Text } from '$lib/components/ui/typography';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/formatUtils';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import BarChart from './bar-chart.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Progress } from '$lib/components/ui/progress';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as m from '$lib/paraglide/messages';
  import { tablePreferences } from '$lib/stores/table-preferences.svelte';
  import { getFinancialKpiPeriodLabel } from '$lib/utils/kpiPeriodLabel';
  import { TrendingUp, AlertTriangle, Users } from '@lucide/svelte';

  // TypeScript interfaces for API responses
  interface RevenueTrendPoint {
    period: string;
    totalRevenue: number;
    paymentCount: number;
  }

  interface ServiceRevenueItem {
    source: 'CATALOG' | 'CUSTOM';
    serviceName: string;
    totalRevenue: number;
    orderCount: number;
    percentShare: number;
    totalDurationMin: number;
    revenuePerMinute: number;
  }

  interface TopCustomerItem {
    customerId: string;
    firstName: string;
    lastName: string;
    totalSpend: number;
    orderCount: number;
    lastOrderDate: string;
  }

  interface AtRiskCustomerItem {
    customerId: string;
    firstName: string;
    lastName: string;
    lastOrderDate: string | null;
    daysSinceLastOrder: number | null;
  }

  interface FinancialKpiResponse {
    revenueTrend: RevenueTrendPoint[];
    serviceBreakdown: ServiceRevenueItem[];
    topCustomers: TopCustomerItem[];
    atRiskCustomers: AtRiskCustomerItem[];
    repeatRate: number;
    totalCustomersInPeriod: number;
    repeatCustomers: number;
  }

  // Props
  type Props = {
    refreshKey?: number;
    atRiskDaysThreshold?: number;
  };

  let { refreshKey = 0, atRiskDaysThreshold = 60 }: Props = $props();

  // State
  let granularity = $state<'day' | 'week' | 'month'>('week');
  let data = $state<FinancialKpiResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let servicePageIndex = $state(0);
  let topCustomerPageIndex = $state(0);

  // Derived state
  let pageSize = $derived(tablePreferences.pageSize);


  let totalRevenue = $derived(
    data?.revenueTrend.reduce((sum, point) => sum + point.totalRevenue, 0) || 0
  );

  let rankedServices = $derived.by(() => {
    return (data?.serviceBreakdown ?? [])
      .filter((service) => toFiniteNumber(service.totalRevenue) > 0)
      .slice()
      .sort((a, b) => {
        const revenueDelta = toFiniteNumber(b.totalRevenue) - toFiniteNumber(a.totalRevenue);
        if (revenueDelta !== 0) return revenueDelta;
        const orderDelta = b.orderCount - a.orderCount;
        if (orderDelta !== 0) return orderDelta;
        return a.serviceName.localeCompare(b.serviceName);
      });
  });

  let rankedTopCustomers = $derived.by(() => {
    return (data?.topCustomers ?? [])
      .slice()
      .sort((a, b) => {
        const spendDelta = toFiniteNumber(b.totalSpend) - toFiniteNumber(a.totalSpend);
        if (spendDelta !== 0) return spendDelta;
        const orderDelta = b.orderCount - a.orderCount;
        if (orderDelta !== 0) return orderDelta;
        return getCustomerName(a).localeCompare(getCustomerName(b));
      });
  });

  let servicePageCount = $derived(getPageCount(rankedServices.length, pageSize));
  let topCustomerPageCount = $derived(getPageCount(rankedTopCustomers.length, pageSize));
  let pagedServices = $derived(rankedServices.slice(servicePageIndex * pageSize, (servicePageIndex + 1) * pageSize));
  let pagedTopCustomers = $derived(rankedTopCustomers.slice(topCustomerPageIndex * pageSize, (topCustomerPageIndex + 1) * pageSize));

  // Fetch data
  $effect(() => {
    void refreshKey;
    void granularity;
    void atRiskDaysThreshold;

    let cancelled = false;
    loading = true;
    error = null;

    apiService.request<FinancialKpiResponse>(
      `${API_SALES}/orders/kpi/financial?granularity=${granularity}&atRiskDays=${atRiskDaysThreshold}`
    )
      .then(res => {
        if (!cancelled) {
          data = res;
          loading = false;
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Error loading financial KPI:', err);
          error = m['kpi.financial.error']();
          loading = false;
        }
      });

    return () => {
      cancelled = true;
    };
  });

  const getPeriodLabel = (period: string) => getFinancialKpiPeriodLabel(period, granularity);

  $effect(() => {
    if (servicePageIndex >= servicePageCount) {
      servicePageIndex = servicePageCount - 1;
    }
    if (topCustomerPageIndex >= topCustomerPageCount) {
      topCustomerPageIndex = topCustomerPageCount - 1;
    }
  });

  function getPageCount(totalItems: number, perPage: number): number {
    return Math.max(1, Math.ceil(totalItems / perPage));
  }

  function toFiniteNumber(value: number | string | null | undefined): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function setGranularity(nextGranularity: 'day' | 'week' | 'month') {
    granularity = nextGranularity;
    servicePageIndex = 0;
    topCustomerPageIndex = 0;
  }

  function previousServicePage() {
    servicePageIndex = Math.max(0, servicePageIndex - 1);
  }

  function nextServicePage() {
    servicePageIndex = Math.min(servicePageCount - 1, servicePageIndex + 1);
  }

  function previousTopCustomerPage() {
    topCustomerPageIndex = Math.max(0, topCustomerPageIndex - 1);
  }

  function nextTopCustomerPage() {
    topCustomerPageIndex = Math.min(topCustomerPageCount - 1, topCustomerPageIndex + 1);
  }

  // Get customer display name
  function getCustomerName(customer: TopCustomerItem): string {
    return `${customer.firstName} ${customer.lastName}`.trim() || m['kpi.unknownCustomer']();
  }

  function getAtRiskName(customer: AtRiskCustomerItem): string {
    return `${customer.firstName} ${customer.lastName}`.trim() || m['kpi.unknownCustomer']();
  }

  function getGranularityLabel(): string {
    if (granularity === 'day') return m['kpi.financial.granularity.day']();
    if (granularity === 'month') return m['kpi.financial.granularity.month']();
    return m['kpi.financial.granularity.week']();
  }

  function getAtRiskDayCount(): number {
    return Math.max(1, Math.trunc(toFiniteNumber(atRiskDaysThreshold)));
  }

  function getAtRiskAgeLabel(customer: AtRiskCustomerItem): string {
    if (customer.daysSinceLastOrder == null) {
      return m['kpi.atRiskNeverOrdered']();
    }

    return `${customer.daysSinceLastOrder} ${m['kpi.financial.atRisk.daysLabel']()}`;
  }

  function getLastOrderLabel(customer: AtRiskCustomerItem): string {
    if (!customer.lastOrderDate) {
      return m['kpi.atRiskNeverOrdered']();
    }

    return formatDate(customer.lastOrderDate);
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Header with Title and Granularity Toggle -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-success/10 rounded-lg">
        <TrendingUp class="w-5 h-5 text-success-text" />
      </div>
      <div>
        <Heading level={1} as="h2">
          {m['kpi.financial.title']()}
        </Heading>
        <Text variant="muted" class="mt-1">
          {m['kpi.financialDescription']()}
        </Text>
      </div>
    </div>

    <!-- Granularity Selector -->
    <div class="flex gap-2" role="group" data-slot="button-group">
      <Button
        variant={granularity === 'day' ? 'default' : 'outline'}
        size="sm"
        class="h-11 px-4 touch-manipulation"
        onclick={() => setGranularity('day')}
        aria-label={m['kpi.financial.granularity.day']()}
      >
        {m['kpi.financial.granularity.day']()}
      </Button>
      <Button
        variant={granularity === 'week' ? 'default' : 'outline'}
        size="sm"
        class="h-11 px-4 touch-manipulation"
        onclick={() => setGranularity('week')}
        aria-label={m['kpi.financial.granularity.week']()}
      >
        {m['kpi.financial.granularity.week']()}
      </Button>
      <Button
        variant={granularity === 'month' ? 'default' : 'outline'}
        size="sm"
        class="h-11 px-4 touch-manipulation"
        onclick={() => setGranularity('month')}
        aria-label={m['kpi.financial.granularity.month']()}
      >
        {m['kpi.financial.granularity.month']()}
      </Button>
    </div>
  </div>

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-64 rounded-2xl" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton class="h-48 rounded-2xl" />
        <Skeleton class="h-48 rounded-2xl" />
      </div>
    </div>
  {:else if error}
    <div class="p-8 bg-card border border-destructive/30 rounded-2xl">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
          <span class="text-destructive font-bold text-sm">!</span>
        </div>
        <div>
          <p class="font-medium text-destructive">{m['kpi.financial.error']()}</p>
          <Text variant="muted" class="mt-1">{error}</Text>
        </div>
      </div>
    </div>
  {:else if !data || data.revenueTrend.length === 0}
    <Card.Root>
      <Card.Content class="pt-8">
        <div class="flex flex-col items-center justify-center py-12">
          <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <TrendingUp class="w-8 h-8 text-muted-foreground" />
          </div>
          <p class="text-base font-medium text-foreground">{m['kpi.financial.revenue.empty']()}</p>
          <Text variant="muted" class="mt-2 text-center">
            {m['kpi.emptyDescription']()}
          </Text>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Revenue Trend Chart -->
    <Card.Root class="border border-border">
      <Card.Header>
        <Card.Title>{m['kpi.financial.revenue.title']()}</Card.Title>
        <Card.Description>
          {m['kpi.revenueDescription']()}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <!-- Remount per granularity so a pinned value never points at a different bucket. -->
        {#key granularity}
          <BarChart
            size="md"
            format={formatCurrency}
            bars={data.revenueTrend.map((point) => ({
              key: point.period,
              value: point.totalRevenue,
              label: getPeriodLabel(point.period),
              ariaLabel: `${getPeriodLabel(point.period)}: ${formatCurrency(point.totalRevenue)}`,
            }))}
          />
        {/key}
      </Card.Content>
    </Card.Root>

    <!-- Service Breakdown Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Service Revenue Breakdown -->
      <Card.Root class="border border-border">
        <Card.Header>
          <Card.Title>{m['kpi.financial.services.title']()}</Card.Title>
          <Card.Description>
            {m['kpi.servicesDescription']()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if rankedServices.length === 0}
            <div class="py-8 text-center text-muted-foreground text-sm">
              {m['kpi.financial.services.empty']()}
            </div>
          {:else}
            <div class="space-y-4">
              {#each pagedServices as service, i}
                <div class="space-y-1.5">
                  <!-- Service Header -->
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-sm font-semibold text-foreground truncate">
                          {servicePageIndex * pageSize + i + 1}. {service.serviceName}
                        </p>
                        {#if service.source === 'CUSTOM'}
                          <span class="text-xs font-medium uppercase tracking-wide text-primary">{m['orders.custom.badge']()}</span>
                        {/if}
                      </div>
                      <Text variant="small">
                        {service.orderCount} {m['kpi.financial.services.orders']()}
                      </Text>
                      <Text variant="small">
                        {m['kpi.financial.services.revenuePerMin']()}:
                        {#if service.revenuePerMinute && service.revenuePerMinute > 0}
                          <span class="font-mono text-foreground">
                            {formatCurrency(service.revenuePerMinute)}{m['kpi.financial.services.perMin']()}
                          </span>
                        {:else}
                          <span class="font-mono text-muted-foreground">
                            {m['common.notAvailable']()}
                          </span>
                        {/if}
                        <span class="mx-1">•</span>
                        {m['kpi.financial.services.duration']()}:
                        <span class="font-mono text-foreground">
                          {m['kpi.minuteUnit']({ minutes: String(service.totalDurationMin) })}
                        </span>
                      </Text>
                    </div>
                    <span class="text-sm font-mono font-bold text-primary shrink-0 ml-4">
                      {formatCurrency(service.totalRevenue)}
                    </span>
                  </div>
                  <!-- Percentage Bar -->
                  <Progress
                    value={service.percentShare}
                    class="h-2"
                    indicatorClass="bg-gradient-to-r from-primary to-primary/60 duration-500 ease-out"
                    aria-label={`${service.serviceName}: ${service.percentShare.toFixed(1)}%`}
                  />
                  <!-- Percentage Label -->
                  <div class="text-right">
                    <span class="text-xs font-mono text-muted-foreground">
                      {service.percentShare.toFixed(1)}%
                    </span>
                  </div>
                </div>
              {/each}
            </div>

            {#if servicePageCount > 1}
              <div class="flex items-center justify-between px-2 pt-4">
                <Button
                  variant="outline"
                  class="h-11 px-5 touch-manipulation"
                  disabled={servicePageIndex === 0}
                  onclick={previousServicePage}
                >
                  {m["common.previous"]()}
                </Button>
                <span class="text-sm text-muted-foreground">
                  {m["common.pagination"]({ current: String(servicePageIndex + 1), total: String(servicePageCount) })}
                </span>
                <Button
                  variant="outline"
                  class="h-11 px-5 touch-manipulation"
                  disabled={servicePageIndex >= servicePageCount - 1}
                  onclick={nextServicePage}
                >
                  {m["common.next"]()}
                </Button>
              </div>
            {/if}
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Top Customers -->
      <Card.Root class="border border-border">
        <Card.Header>
          <Card.Title>{m['kpi.financial.topCustomers.title']()}</Card.Title>
          <Card.Description>
            {m['kpi.topCustomersDescription']()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if rankedTopCustomers.length === 0}
            <div class="py-8 text-center text-muted-foreground text-sm">
              {m['kpi.financial.topCustomers.empty']()}
            </div>
          {:else}
            <div class="space-y-3">
              {#each pagedTopCustomers as customer, i}
                <div class="p-3 bg-secondary/30 rounded-lg border border-secondary/50 hover:border-secondary transition-colors">
                  <!-- Customer Header -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded min-w-5 text-center">
                          {topCustomerPageIndex * pageSize + i + 1}
                        </span>
                        <p class="text-sm font-semibold text-foreground truncate">
                          {getCustomerName(customer)}
                        </p>
                      </div>
                      <Text variant="small" class="mt-1">
                        {customer.orderCount} {m['kpi.financial.topCustomers.orders']()}
                      </Text>
                    </div>
                    <span class="text-sm font-mono font-bold text-success-text shrink-0">
                      {formatCurrency(customer.totalSpend)}
                    </span>
                  </div>
                  <!-- Last Order Date -->
                  <div class="text-xs text-muted-foreground">
                    {m['kpi.financial.topCustomers.lastOrder']()}:
                    <span class="font-mono">
                      {formatDate(customer.lastOrderDate)}
                    </span>
                  </div>
                </div>
              {/each}
            </div>

            {#if topCustomerPageCount > 1}
              <div class="flex items-center justify-between px-2 pt-4">
                <Button
                  variant="outline"
                  class="h-11 px-5 touch-manipulation"
                  disabled={topCustomerPageIndex === 0}
                  onclick={previousTopCustomerPage}
                >
                  {m["common.previous"]()}
                </Button>
                <span class="text-sm text-muted-foreground">
                  {m["common.pagination"]({ current: String(topCustomerPageIndex + 1), total: String(topCustomerPageCount) })}
                </span>
                <Button
                  variant="outline"
                  class="h-11 px-5 touch-manipulation"
                  disabled={topCustomerPageIndex >= topCustomerPageCount - 1}
                  onclick={nextTopCustomerPage}
                >
                  {m["common.next"]()}
                </Button>
              </div>
            {/if}
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Repeat Rate -->
    <Card.Root class="border border-border">
      <Card.Header>
        <div class="flex items-center gap-2">
          <Users class="w-4 h-4 text-primary" />
          <Card.Title>{m['kpi.financial.repeatRate.title']()}</Card.Title>
        </div>
        <Card.Description>
          {m['kpi.financial.repeatRate.desc']()}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if !data.totalCustomersInPeriod || data.totalCustomersInPeriod === 0}
          <div class="py-8 text-center text-muted-foreground text-sm">
            {m['kpi.financial.repeatRate.empty']()}
          </div>
        {:else}
          <div class="space-y-2">
            <Text variant="metric" size="lg" class="text-primary">
              {data.repeatRate?.toFixed(1) ?? '0.0'}%
            </Text>
            <Text variant="muted">
              <span class="font-semibold text-foreground">{data.repeatCustomers}</span>
              <span class="mx-1">{m['kpi.financial.repeatRate.of']()}</span>
              <span class="font-semibold text-foreground">{data.totalCustomersInPeriod}</span>
              <span class="ml-1">{m['kpi.financial.repeatRate.customers']()}</span>
            </Text>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- At-Risk Customers -->
    <Card.Root class="border border-warning-border">
      <Card.Header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-warning-text" />
            <Card.Title>{m['kpi.financial.atRisk.title']()}</Card.Title>
          </div>
          {#if data.atRiskCustomers && data.atRiskCustomers.length > 0}
            <Badge variant="warning" class="h-6 min-w-6 rounded-full font-bold">
              {data.atRiskCustomers.length}
            </Badge>
          {/if}
        </div>
        <Card.Description>
          {m['kpi.financial.atRisk.desc']({ days: String(getAtRiskDayCount()) })}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if !data.atRiskCustomers || data.atRiskCustomers.length === 0}
          <div class="py-8 text-center text-muted-foreground text-sm">
            {m['kpi.financial.atRisk.empty']()}
          </div>
        {:else}
          <div class="space-y-2">
            {#each data.atRiskCustomers as customer}
              <div class="p-3 bg-warning/5 rounded-lg border border-warning/20 hover:border-warning/40 transition-colors">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-semibold text-foreground truncate">
                    {getAtRiskName(customer)}
                  </p>
                  <span class="text-xs font-mono font-bold text-warning-text shrink-0">
                    {getAtRiskAgeLabel(customer)}
                  </span>
                </div>
                <Text variant="small" class="mt-1">
                  {m['kpi.financial.atRisk.lastOrder']()}:
                  <span class="font-mono">{getLastOrderLabel(customer)}</span>
                </Text>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Total Revenue Summary -->
    <Card.Root class="bg-linear-to-br from-success/10 to-primary/10 border border-success/30">
      <Card.Content class="pt-6">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <Text variant="label">
              {m['kpi.financial.summary.total']()}
            </Text>
            <Text variant="metric" class="text-success-text mt-2">
              {formatCurrency(totalRevenue)}
            </Text>
          </div>
          <div>
            <Text variant="label">
              {m['kpi.summaryPeriod']()}
            </Text>
            <p class="text-lg font-bold text-foreground mt-2">
              {getGranularityLabel()}
            </p>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <Text variant="label">
              {m['kpi.financial.summary.average']()}
            </Text>
            <Text variant="metric" size="sm" class="text-primary mt-2">
              {formatCurrency(totalRevenue / (data.revenueTrend.length || 1))}
            </Text>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
