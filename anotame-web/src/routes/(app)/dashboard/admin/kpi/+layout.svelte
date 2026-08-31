<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import { apiService, API_SALES, API_OPERATIONS } from '$lib/services/api.svelte';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import { Activity, Banknote, Users } from '@lucide/svelte';
  import type { Establishment } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';
  import { toast } from 'svelte-sonner';
  import {
    getMonthParam,
    setKpiDashboard,
    type DashboardMetrics
  } from './kpiContext';

  let { children }: { children: Snippet } = $props();

  const today = new Date();
  const basePath = '/dashboard/admin/kpi';

  let metrics = $state<DashboardMetrics | null>(null);
  let isLoading = $state(true);
  let capacity = $state(480);
  let thresholdGreen = $state(50);
  let thresholdAmber = $state(85);
  let atRiskDaysThreshold = $state(60);
  let selectedYear = $state(today.getFullYear());
  let selectedMonth = $state(today.getMonth() + 1);
  let monthLoading = $state(false);

  async function fetchDashboardMetrics(monthParam: string) {
    return apiService.request<DashboardMetrics>(
      `${API_SALES}/orders/kpi/dashboard?month=${encodeURIComponent(monthParam)}`
    );
  }

  async function selectMonth(year: number, month: number) {
    const previousYear = selectedYear;
    const previousMonth = selectedMonth;
    selectedYear = year;
    selectedMonth = month;
    monthLoading = true;

    try {
      metrics = await fetchDashboardMetrics(getMonthParam(year, month));
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      selectedYear = previousYear;
      selectedMonth = previousMonth;
      toast.error(m['kpi.monthPicker.loadError']());
    } finally {
      monthLoading = false;
    }
  }

  setKpiDashboard({
    get metrics() {
      return metrics;
    },
    get isLoading() {
      return isLoading;
    },
    get capacity() {
      return capacity;
    },
    get thresholdGreen() {
      return thresholdGreen;
    },
    get thresholdAmber() {
      return thresholdAmber;
    },
    get atRiskDaysThreshold() {
      return atRiskDaysThreshold;
    },
    get selectedYear() {
      return selectedYear;
    },
    get selectedMonth() {
      return selectedMonth;
    },
    get monthLoading() {
      return monthLoading;
    },
    selectMonth
  });

  // The dot marks the tab that has something waiting on a human today, so the
  // signal the old "actua primero aqui" banner carried survives the split.
  let hasOperationsAlert = $derived(
    (metrics?.workload.readyForPickup ?? 0) > 0 || (metrics?.workload.todayDeliveries ?? 0) > 0
  );
  let hasMoneyAlert = $derived((metrics?.finance.openReceivable ?? 0) > 0);

  let tabs = $derived([
    {
      href: `${basePath}/operacion`,
      label: m['kpi.tab.operations'](),
      icon: Activity,
      alert: hasOperationsAlert
    },
    {
      href: `${basePath}/dinero`,
      label: m['kpi.tab.money'](),
      icon: Banknote,
      alert: hasMoneyAlert
    },
    {
      href: `${basePath}/clientes`,
      label: m['kpi.tab.customers'](),
      icon: Users,
      alert: false
    }
  ]);

  let summaryItems = $derived([
    {
      label: m['kpi.card.ready'](),
      value: String(metrics?.workload.readyForPickup ?? 0),
      toneClass: 'text-success'
    },
    {
      label: m['kpi.card.todayDeliveries'](),
      value: String(metrics?.workload.todayDeliveries ?? 0),
      toneClass: (metrics?.workload.todayDeliveries ?? 0) > 0 ? 'text-destructive' : 'text-foreground'
    },
    {
      label: m['kpi.card.receivables'](),
      value: formatCurrency(metrics?.finance.openReceivable ?? 0),
      toneClass: 'text-foreground'
    },
    {
      label: m['kpi.card.todayRevenue'](),
      value: formatCurrency(metrics?.finance.todayRevenue ?? 0),
      toneClass: 'text-foreground'
    }
  ]);

  function isActive(href: string): boolean {
    return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
  }

  onMount(async () => {
    try {
      const [metricsData, estData] = await Promise.all([
        fetchDashboardMetrics(getMonthParam(selectedYear, selectedMonth)),
        apiService.request<Establishment>(`${API_OPERATIONS}/establishment`)
      ]);
      metrics = metricsData;
      if (estData?.dailyCapacityMinutes) capacity = estData.dailyCapacityMinutes;
      if (estData?.capacityThresholdGreen != null) thresholdGreen = estData.capacityThresholdGreen;
      if (estData?.capacityThresholdAmber != null) thresholdAmber = estData.capacityThresholdAmber;
      if (estData?.atRiskDaysThreshold != null) atRiskDaysThreshold = estData.atRiskDaysThreshold;
    } catch (e) {
      console.error('Error loading KPIs:', e);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <div>
    <h1 class="text-3xl font-heading font-bold text-foreground">
      {m['nav.kpi.name']()}
    </h1>
    <p class="text-muted-foreground">
      {m['kpi.page.desc']()}
    </p>
  </div>

  <!-- Always-visible numbers, so moving the detail behind tabs does not cost
       the at-a-glance read the old hero provided. -->
  <div class="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
    {#each summaryItems as item (item.label)}
      <div class="bg-card px-4 py-3">
        <p class="truncate text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {item.label}
        </p>
        {#if isLoading}
          <div class="mt-1 h-7 w-20 animate-pulse rounded bg-muted"></div>
        {:else}
          <p class={`mt-1 truncate text-xl font-mono font-bold md:text-2xl ${item.toneClass}`}>
            {item.value}
          </p>
        {/if}
      </div>
    {/each}
  </div>

  <nav
    aria-label={m['kpi.tabs.ariaLabel']()}
    class="sticky top-0 z-20 -mx-2 overflow-x-auto bg-background/95 px-2 py-2 backdrop-blur"
  >
    <div class="flex w-max min-w-full gap-1 rounded-xl border border-border bg-muted/40 p-1">
      {#each tabs as tab (tab.href)}
        {@const active = isActive(tab.href)}
        <a
          href={tab.href}
          aria-current={active ? 'page' : undefined}
          class={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
            active
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <tab.icon class="h-4 w-4" />
          {tab.label}
          {#if tab.alert}
            <span
              class="h-2 w-2 shrink-0 rounded-full bg-destructive"
              aria-label={m['kpi.tabs.needsAttention']()}
            ></span>
          {/if}
        </a>
      {/each}
    </div>
  </nav>

  {@render children()}
</div>
