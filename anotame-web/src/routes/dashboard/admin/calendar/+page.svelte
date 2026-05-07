<script lang="ts">
  import { page } from '$app/stores';
  import CalendarGrid from '$lib/components/calendar/CalendarGrid.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import * as m from '$lib/paraglide/messages';

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
        <CalendarGrid {year} {month} days={calendarData} />
      </Card.Content>
    </Card.Root>

    <!-- Legend -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="flex items-center gap-3">
        <div class="w-4 h-4 rounded bg-green-200"></div>
        <span class="text-sm text-muted-foreground">
          {m['calendar.capacity.low']?.() ?? '< 50% Capacity'}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-4 h-4 rounded bg-amber-200"></div>
        <span class="text-sm text-muted-foreground">
          {m['calendar.capacity.medium']?.() ?? '50-85% Capacity'}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-4 h-4 rounded bg-red-200"></div>
        <span class="text-sm text-muted-foreground">
          {m['calendar.capacity.high']?.() ?? '> 85% Capacity'}
        </span>
      </div>
    </div>
  {/if}
</div>
