<script lang="ts">
  import * as Empty from '$lib/components/ui/empty';
  import StatePanel from '$lib/components/common/state-panel.svelte';
  import * as Item from '$lib/components/ui/item';
  import SimplePager from '$lib/components/common/simple-pager.svelte';
  import * as Alert from '$lib/components/ui/alert';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { Heading, Text } from '$lib/components/ui/typography';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/formatUtils';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
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
        <Heading level={2}>
          {m['kpi.financial.title']()}
        </Heading>
        <Text variant="muted" class="mt-1">
          {m['kpi.financialDescription']()}
        </Text>
      </div>
    </div>

    <!-- Granularity Selector -->
    <ToggleGroup.Root
      type="single"
      variant="segmented"
      size="touch"
      spacing={2}
      aria-label={m['kpi.financial.granularity.label']()}
      value={granularity}
      onValueChange={(v) => v && setGranularity(v as 'day' | 'week' | 'month')}
    >
      <ToggleGroup.Item value="day">{m['kpi.financial.granularity.day']()}</ToggleGroup.Item>
      <ToggleGroup.Item value="week">{m['kpi.financial.granularity.week']()}</ToggleGroup.Item>
      <ToggleGroup.Item value="month">{m['kpi.financial.granularity.month']()}</ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-64 rounded-xl" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton class="h-48 rounded-xl" />
        <Skeleton class="h-48 rounded-xl" />
      </div>
    </div>
  {:else if error}
    <Alert.Root variant="destructive">
      <TriangleAlertIcon aria-hidden="true" />
      <Alert.Title>{m['kpi.financial.error']()}</Alert.Title>
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {:else if !data || data.revenueTrend.length === 0}
    <Card.Root>
      <Card.Content class="pt-8">
        <Empty.Root class="py-12">
          <Empty.Header>
            <Empty.Media variant="icon"><TrendingUp /></Empty.Media>
            <Empty.Title>{m['kpi.financial.revenue.empty']()}</Empty.Title>
            <Empty.Description>{m['kpi.emptyDescription']()}</Empty.Description>
          </Empty.Header>
        </Empty.Root>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Revenue Trend Chart -->
    <Card.Root>
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
      <Card.Root>
        <Card.Header>
          <Card.Title>{m['kpi.financial.services.title']()}</Card.Title>
          <Card.Description>
            {m['kpi.servicesDescription']()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if rankedServices.length === 0}
            <StatePanel message={m['kpi.financial.services.empty']()} size="inline" />
          {:else}
            <Item.Group class="gap-2">
              {#each pagedServices as service, i}
                <Item.Root size="sm" class="px-0">
                  <Item.Content class="min-w-0">
                    <Item.Title class="font-semibold">
                      {servicePageIndex * pageSize + i + 1}. {service.serviceName}
                      {#if service.source === 'CUSTOM'}
                        <Badge variant="brand">{m['orders.custom.badge']()}</Badge>
                      {/if}
                    </Item.Title>
                    <Item.Description class="line-clamp-none text-xs">{service.orderCount} {m['kpi.financial.services.orders']()}</Item.Description>
                    <Item.Description class="line-clamp-none text-xs">{m['kpi.financial.services.revenuePerMin']()}:
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
                        </span></Item.Description>
                  </Item.Content>
                  <Item.Actions class="flex-col items-end gap-0">
                    <span class="font-mono text-sm font-bold text-primary">{formatCurrency(service.totalRevenue)}</span>
                    <span class="font-mono text-xs text-muted-foreground">{service.percentShare.toFixed(1)}%</span>
                  </Item.Actions>
                  <Item.Footer>
                    <Progress
                      value={service.percentShare}
                      class="h-2"
                      indicatorClass="bg-gradient-to-r from-primary to-primary/60 duration-500 ease-out"
                      aria-label={`${service.serviceName}: ${service.percentShare.toFixed(1)}%`}
                    />
                  </Item.Footer>
                </Item.Root>
              {/each}
            </Item.Group>

            {#if servicePageCount > 1}
              <SimplePager class="pt-4" pageIndex={servicePageIndex} pageCount={servicePageCount} onPrevious={previousServicePage} onNext={nextServicePage} />
            {/if}
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Top Customers -->
      <Card.Root>
        <Card.Header>
          <Card.Title>{m['kpi.financial.topCustomers.title']()}</Card.Title>
          <Card.Description>
            {m['kpi.topCustomersDescription']()}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if rankedTopCustomers.length === 0}
            <StatePanel message={m['kpi.financial.topCustomers.empty']()} size="inline" />
          {:else}
            <Item.Group class="gap-3">
              {#each pagedTopCustomers as customer, i}
                <Item.Root variant="muted" size="sm">
                  <Item.Media>
                    <Badge variant="brand" class="min-w-6 tabular-nums">{topCustomerPageIndex * pageSize + i + 1}</Badge>
                  </Item.Media>
                  <Item.Content class="min-w-0">
                    <Item.Title class="font-semibold">{getCustomerName(customer)}</Item.Title>
                    <Item.Description>
                      {customer.orderCount} {m['kpi.financial.topCustomers.orders']()}
                      · {m['kpi.financial.topCustomers.lastOrder']()}:
                      <span class="font-mono">{formatDate(customer.lastOrderDate)}</span>
                    </Item.Description>
                  </Item.Content>
                  <Item.Actions>
                    <span class="font-mono text-sm font-bold text-success-text">{formatCurrency(customer.totalSpend)}</span>
                  </Item.Actions>
                </Item.Root>
              {/each}
            </Item.Group>

            {#if topCustomerPageCount > 1}
              <SimplePager class="pt-4" pageIndex={topCustomerPageIndex} pageCount={topCustomerPageCount} onPrevious={previousTopCustomerPage} onNext={nextTopCustomerPage} />
            {/if}
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Repeat Rate -->
    <Card.Root>
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
          <StatePanel message={m['kpi.financial.repeatRate.empty']()} size="inline" />
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
          <StatePanel message={m['kpi.financial.atRisk.empty']()} size="inline" />
        {:else}
          <Item.Group class="gap-2">
            {#each data.atRiskCustomers as customer}
              <Item.Root variant="outline" size="sm">
                <Item.Content class="min-w-0">
                  <Item.Title class="font-semibold">{getAtRiskName(customer)}</Item.Title>
                  <Item.Description>
                    {m['kpi.financial.atRisk.lastOrder']()}:
                    <span class="font-mono">{getLastOrderLabel(customer)}</span>
                  </Item.Description>
                </Item.Content>
                <Item.Actions>
                  <Badge variant="warning" class="font-mono">{getAtRiskAgeLabel(customer)}</Badge>
                </Item.Actions>
              </Item.Root>
            {/each}
          </Item.Group>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Total Revenue Summary -->
    <Card.Root tone="highlight">
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
