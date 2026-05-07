<script lang="ts">
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/formatUtils';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as m from '$lib/paraglide/messages';
  import { TrendingUp } from 'lucide-svelte';

  // TypeScript interfaces for API responses
  interface RevenueTrendPoint {
    period: string;
    totalRevenue: number;
    paymentCount: number;
  }

  interface ServiceRevenueItem {
    serviceName: string;
    totalRevenue: number;
    orderCount: number;
    percentShare: number;
  }

  interface TopCustomerItem {
    customerId: string;
    firstName: string;
    lastName: string;
    totalSpend: number;
    orderCount: number;
    lastOrderDate: string;
  }

  interface FinancialKpiResponse {
    revenueTrend: RevenueTrendPoint[];
    serviceBreakdown: ServiceRevenueItem[];
    topCustomers: TopCustomerItem[];
  }

  // Props
  type Props = {
    refreshKey?: number;
  };

  let { refreshKey = 0 }: Props = $props();

  // State
  let granularity = $state<'day' | 'week' | 'month'>('week');
  let data = $state<FinancialKpiResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeBarIndex = $state<number | null>(null);

  // Derived state
  let chartMax = $derived(
    data?.revenueTrend.reduce((max, point) => Math.max(max, point.totalRevenue), 0) || 100
  );

  let totalRevenue = $derived(
    data?.revenueTrend.reduce((sum, point) => sum + point.totalRevenue, 0) || 0
  );

  // Fetch data
  $effect(() => {
    void refreshKey;
    void granularity;

    let cancelled = false;
    loading = true;
    error = null;

    apiService.request<FinancialKpiResponse>(
      `${API_SALES}/orders/kpi/financial?granularity=${granularity}`
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
          error = m['kpi.financial.error']?.() ?? 'Failed to load financial data';
          loading = false;
        }
      });

    return () => {
      cancelled = true;
    };
  });

  // Helper function to format period label
  function getPeriodLabel(period: string): string {
    try {
      const date = new Date(period);
      if (granularity === 'day') {
        return date.toLocaleDateString('es-MX', { weekday: 'short', month: 'numeric', day: 'numeric' });
      } else if (granularity === 'week') {
        const weekNum = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        return `W${weekNum}`;
      } else {
        return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
      }
    } catch {
      return period;
    }
  }

  // Get customer display name
  function getCustomerName(customer: TopCustomerItem): string {
    return `${customer.firstName} ${customer.lastName}`.trim() || 'Anonymous';
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <!-- Header with Title and Granularity Toggle -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-success/10 rounded-lg">
        <TrendingUp class="w-5 h-5 text-success" />
      </div>
      <div>
        <h2 class="text-2xl font-bold font-heading text-foreground">
          {m['kpi.financial.title']?.() ?? 'Financial KPIs'}
        </h2>
        <p class="text-sm text-muted-foreground mt-1">
          Revenue trends, service breakdown, and top customers
        </p>
      </div>
    </div>

    <!-- Granularity Selector -->
    <div class="flex gap-2" role="group" data-slot="button-group">
      <Button
        variant={granularity === 'day' ? 'default' : 'outline'}
        size="sm"
        onclick={() => { granularity = 'day'; activeBarIndex = null; }}
        aria-label={m['kpi.financial.granularity.day']?.() ?? 'Daily'}
      >
        {m['kpi.financial.granularity.day']?.() ?? 'Daily'}
      </Button>
      <Button
        variant={granularity === 'week' ? 'default' : 'outline'}
        size="sm"
        onclick={() => { granularity = 'week'; activeBarIndex = null; }}
        aria-label={m['kpi.financial.granularity.week']?.() ?? 'Weekly'}
      >
        {m['kpi.financial.granularity.week']?.() ?? 'Weekly'}
      </Button>
      <Button
        variant={granularity === 'month' ? 'default' : 'outline'}
        size="sm"
        onclick={() => { granularity = 'month'; activeBarIndex = null; }}
        aria-label={m['kpi.financial.granularity.month']?.() ?? 'Monthly'}
      >
        {m['kpi.financial.granularity.month']?.() ?? 'Monthly'}
      </Button>
    </div>
  </div>

  {#if loading}
    <div class="space-y-4">
      <div class="h-64 bg-card border border-border rounded-2xl animate-pulse"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="h-48 bg-card border border-border rounded-2xl animate-pulse"></div>
        <div class="h-48 bg-card border border-border rounded-2xl animate-pulse"></div>
      </div>
    </div>
  {:else if error}
    <div class="p-8 bg-card border border-destructive/30 rounded-2xl">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
          <span class="text-destructive font-bold text-sm">!</span>
        </div>
        <div>
          <p class="font-medium text-destructive">{m['kpi.financial.error']?.() ?? 'Error'}</p>
          <p class="text-sm text-muted-foreground mt-1">{error}</p>
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
          <p class="text-base font-medium text-foreground">{m['kpi.financial.revenue.empty']?.() ?? 'No Data Available'}</p>
          <p class="text-sm text-muted-foreground mt-2 text-center">
            No financial data available for the selected period
          </p>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Revenue Trend Chart -->
    <Card.Root class="border border-border">
      <Card.Header>
        <Card.Title>{m['kpi.financial.revenue.title']?.() ?? 'Revenue Trend'}</Card.Title>
        <Card.Description>
          Total revenue by period
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="flex items-end gap-2 h-64 w-full mt-4 px-2">
          {#each data.revenueTrend as point, i}
            {@const heightPct = chartMax > 0 ? (point.totalRevenue / chartMax) * 100 : 0}
            {@const isBarActive = activeBarIndex === i}
            <div
              class="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              role="button"
              tabindex="0"
              aria-label={`${getPeriodLabel(point.period)}: ${formatCurrency(point.totalRevenue)}`}
              onclick={() => activeBarIndex = isBarActive ? null : i}
              onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (activeBarIndex = isBarActive ? null : i)}
            >
              <!-- Tooltip -->
              <div class="absolute -top-10 transition-transform bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none {isBarActive ? 'scale-100' : 'scale-0 group-hover:scale-100'}">
                {formatCurrency(point.totalRevenue)}
              </div>
              <!-- Bar -->
              <div
                class="w-full max-w-10 bg-primary/80 hover:bg-primary rounded-t-sm transition-all duration-500 ease-out"
                style="height: {heightPct}%"
              ></div>
              <!-- Label -->
              <div class="text-[10px] mt-2 text-muted-foreground -rotate-45deg pb-2 uppercase truncate w-full text-center origin-center">
                {getPeriodLabel(point.period)}
              </div>
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Service Breakdown Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Service Revenue Breakdown -->
      <Card.Root class="border border-border">
        <Card.Header>
          <Card.Title>{m['kpi.financial.services.title']?.() ?? 'Service Revenue'}</Card.Title>
          <Card.Description>
            Revenue by service type
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if data.serviceBreakdown.length === 0}
            <div class="py-8 text-center text-muted-foreground text-sm">
              {m['kpi.financial.services.empty']?.() ?? 'No service data available'}
            </div>
          {:else}
            <div class="space-y-4">
              {#each data.serviceBreakdown as service, i}
                <div class="space-y-1.5">
                  <!-- Service Header -->
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <p class="text-sm font-semibold text-foreground truncate">
                        {i + 1}. {service.serviceName}
                      </p>
                      <p class="text-xs text-muted-foreground">
                        {service.orderCount} {m['kpi.financial.services.orders']?.() ?? 'orders'}
                      </p>
                    </div>
                    <span class="text-sm font-mono font-bold text-primary shrink-0 ml-4">
                      {formatCurrency(service.totalRevenue)}
                    </span>
                  </div>
                  <!-- Percentage Bar -->
                  <div class="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out rounded-full"
                      style="width: {service.percentShare}%"
                      role="progressbar"
                      aria-valuenow={service.percentShare}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${service.serviceName}: ${service.percentShare.toFixed(1)}%`}
                    ></div>
                  </div>
                  <!-- Percentage Label -->
                  <div class="text-right">
                    <span class="text-xs font-mono text-muted-foreground">
                      {service.percentShare.toFixed(1)}%
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Top Customers -->
      <Card.Root class="border border-border">
        <Card.Header>
          <Card.Title>{m['kpi.financial.topCustomers.title']?.() ?? 'Top Customers'}</Card.Title>
          <Card.Description>
            Highest spending customers
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {#if data.topCustomers.length === 0}
            <div class="py-8 text-center text-muted-foreground text-sm">
              {m['kpi.financial.topCustomers.empty']?.() ?? 'No customer data available'}
            </div>
          {:else}
            <div class="space-y-3">
              {#each data.topCustomers as customer, i}
                <div class="p-3 bg-secondary/30 rounded-lg border border-secondary/50 hover:border-secondary transition-colors">
                  <!-- Customer Header -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded min-w-[20px] text-center">
                          {i + 1}
                        </span>
                        <p class="text-sm font-semibold text-foreground truncate">
                          {getCustomerName(customer)}
                        </p>
                      </div>
                      <p class="text-xs text-muted-foreground mt-1">
                        {customer.orderCount} {m['kpi.financial.topCustomers.orders']?.() ?? 'orders'}
                      </p>
                    </div>
                    <span class="text-sm font-mono font-bold text-success shrink-0">
                      {formatCurrency(customer.totalSpend)}
                    </span>
                  </div>
                  <!-- Last Order Date -->
                  <div class="text-xs text-muted-foreground">
                    {m['kpi.financial.topCustomers.lastOrder']?.() ?? 'Last order'}:
                    <span class="font-mono">
                      {formatDate(customer.lastOrderDate)}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Total Revenue Summary -->
    <Card.Root class="bg-gradient-to-br from-success/10 to-primary/10 border border-success/30">
      <Card.Content class="pt-6">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {m['kpi.financial.summary.total']?.() ?? 'Total Revenue'}
            </p>
            <p class="text-2xl font-bold font-mono text-success mt-2">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Period
            </p>
            <p class="text-lg font-bold text-foreground mt-2 capitalize">
              {granularity}
            </p>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <p class="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {m['kpi.financial.summary.average']?.() ?? 'Avg per Period'}
            </p>
            <p class="text-lg font-bold font-mono text-primary mt-2">
              {formatCurrency(totalRevenue / (data.revenueTrend.length || 1))}
            </p>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
