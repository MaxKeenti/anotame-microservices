<script lang="ts">
  import { page } from '$app/stores';
  import CalendarGrid from '$lib/components/calendar/CalendarGrid.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages';
  import { apiService, API_OPERATIONS } from '$lib/services/api.svelte';

  interface CalendarDay {
    date: string;
    totalMinutesUsed: number;
    orderCount: number;
    scheduledRevenue: number;
    capacityPercent: number;
    isHoliday: boolean;
    isOpen: boolean;
  }

  interface PageData {
    calendarData: CalendarDay[];
    year: number;
    month: number;
    monthParam: string;
    error?: string;
  }

  let data: PageData = $page.data as PageData;

  let year = $state(data.year);
  let month = $state(data.month);
  let calendarData = $state<CalendarDay[]>(data.calendarData);
  let loading = $state(false);
  let error = $state<string | null>(data.error || null);
  let thresholdGreen = $state(50);
  let thresholdAmber = $state(85);

  import { onMount } from 'svelte';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  onMount(async () => {
    try {
      const estData = await apiService.request<any>(`${API_OPERATIONS}/establishment`);
      if (estData?.capacityThresholdGreen != null) thresholdGreen = estData.capacityThresholdGreen;
      if (estData?.capacityThresholdAmber != null) thresholdAmber = estData.capacityThresholdAmber;
    } catch (err) {
      console.error('Failed to load establishment thresholds:', err);
    }
  });

  async function handlePrevMonth() {
    if (month === 1) {
      month = 12;
      year -= 1;
    } else {
      month -= 1;
    }
    await loadMonth();
  }

  async function handleNextMonth() {
    if (month === 12) {
      month = 1;
      year += 1;
    } else {
      month += 1;
    }
    await loadMonth();
  }

  async function loadMonth() {
    loading = true;
    error = null;

    try {
      const monthParam = `${year}-${String(month).padStart(2, '0')}`;
      const { apiService, API_SALES } = await import('$lib/services/api.svelte');

      interface CalendarMonthResponse {
        days: CalendarDay[];
      }

      const response = await apiService.request<CalendarMonthResponse>(
        `${API_SALES}/orders/kpi/calendar?month=${monthParam}`
      );

      calendarData = response.days;

      // Update URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('month', monthParam);
      window.history.pushState({}, '', newUrl.toString());
    } catch (err) {
      console.error('Failed to load calendar:', err);
      error = 'Failed to load calendar data';
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-6 p-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold font-heading text-foreground">
        {m['calendar.title']?.() ?? 'Workload Calendar'}
      </h1>
      <p class="text-sm text-muted-foreground mt-1">
        {m['calendar.description']?.() ?? 'View daily workload and capacity'}
      </p>
    </div>
  </div>

  <!-- Month Navigation -->
  <div class="flex items-center justify-between bg-card border border-border rounded-2xl p-4">
    <Button
      variant="ghost"
      size="icon"
      onclick={handlePrevMonth}
      disabled={loading}
    >
      <ChevronLeft class="w-5 h-5" />
    </Button>

    <h2 class="text-xl font-bold">
      {monthNames[month - 1]} {year}
    </h2>

    <Button
      variant="ghost"
      size="icon"
      onclick={handleNextMonth}
      disabled={loading}
    >
      <ChevronRight class="w-5 h-5" />
    </Button>
  </div>

  <!-- Error State -->
  {#if error}
    <Card.Root class="border-destructive/30 bg-destructive/5">
      <Card.Content class="pt-6">
        <p class="text-sm text-destructive">{error}</p>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Loading State -->
  {#if loading}
    <div class="space-y-4">
      <div class="h-96 bg-card border border-border rounded-2xl animate-pulse"></div>
    </div>
  {:else}
    <!-- Calendar Grid -->
    <Card.Root class="border border-border">
      <Card.Content class="pt-6">
        <CalendarGrid {year} {month} days={calendarData} {thresholdGreen} {thresholdAmber} />
      </Card.Content>
    </Card.Root>

    <!-- Legend -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="flex items-center gap-3">
        <div class="w-4 h-4 rounded bg-green-200"></div>
        <span class="text-sm text-muted-foreground">
          {m['calendar.capacity.low']?.({ green: String(thresholdGreen) }) ?? `< ${thresholdGreen}% Capacity`}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-4 h-4 rounded bg-amber-200"></div>
        <span class="text-sm text-muted-foreground">
          {m['calendar.capacity.medium']?.({ green: String(thresholdGreen), amber: String(thresholdAmber) }) ?? `${thresholdGreen}-${thresholdAmber}% Capacity`}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-4 h-4 rounded bg-red-200"></div>
        <span class="text-sm text-muted-foreground">
          {m['calendar.capacity.high']?.({ amber: String(thresholdAmber) }) ?? `> ${thresholdAmber}% Capacity`}
        </span>
      </div>
    </div>
  {/if}
</div>
