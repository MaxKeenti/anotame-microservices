<script lang="ts">
  import CalendarCell from './CalendarCell.svelte';
  import { formatCurrency } from '$lib/utils/formatUtils';
  import { getLocale } from '$lib/paraglide/runtime';
  import type { CalendarDayResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    year: number;
    month: number;
    days: CalendarDayResponse[];
    dailyCapacity?: number;
    thresholdGreen?: number;
    thresholdAmber?: number;
    showHeader?: boolean;
  }

  let {
    year,
    month,
    days,
    dailyCapacity = 480,
    thresholdGreen = 50,
    thresholdAmber = 85,
    showHeader = true
  }: Props = $props();

  const today = new Date();
  const monday = new Date(2024, 0, 1);

  let activeLocale = $derived(getLocale());
  let monthLabel = $derived(
    new Intl.DateTimeFormat(activeLocale, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  );
  let dayNames = $derived(
    Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(activeLocale, { weekday: 'short' }).format(
        new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)
      )
    )
  );

  let firstDay = $derived(new Date(year, month - 1, 1).getDay());
  let adjustedFirstDay = $derived(firstDay === 0 ? 6 : firstDay - 1);
  let daysInMonth = $derived(new Date(year, month, 0).getDate());

  let calendarDays: (CalendarDayResponse | null)[] = $derived.by(() => {
    const grid: (CalendarDayResponse | null)[] = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = days.find(d => d.date === dateStr);
      grid.push(dayData || null);
    }
    return grid;
  });

  let agendaDays: CalendarDayResponse[] = $derived(
    days.filter(d => d.orderCount > 0 || d.isHoliday).sort((a, b) => a.date.localeCompare(b.date))
  );

  function isToday(dayNum: number): boolean {
    return today.getDate() === dayNum && today.getMonth() === month - 1 && today.getFullYear() === year;
  }

  function isPastDay(dayNum: number): boolean {
    const cellDate = new Date(year, month - 1, dayNum);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cellDate < todayStart;
  }

  function getCapacityBarColor(pct: number): string {
    if (pct < thresholdGreen) return 'bg-green-500';
    if (pct < thresholdAmber) return 'bg-amber-500';
    return 'bg-red-500';
  }

  function formatAgendaDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat(activeLocale, { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  }

  function formatCellDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat(activeLocale, { weekday: 'short', day: 'numeric', month: 'short' })
      .format(d)
      .replace('.', '')
      .toUpperCase();
  }
</script>

<div class="space-y-6">
  <!-- Month Header -->
  {#if showHeader}
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold capitalize">
        {monthLabel}
      </h2>
    </div>
  {/if}

  <!-- Desktop: Calendar Grid (hidden below sm) -->
  <div class="hidden sm:block">
    <div class="grid grid-cols-7 gap-2 mb-2">
      {#each dayNames as day}
        <div class="text-xs font-semibold text-center text-gray-600 py-2">
          {day}
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-7 gap-2 auto-rows-max">
      {#each calendarDays as cellData, index}
        {@const dayNum = index - adjustedFirstDay + 1}
        {@const isInMonth = dayNum > 0 && dayNum <= daysInMonth}

        {#if isInMonth && cellData}
          <CalendarCell
            day={dayNum}
            dateLabel={formatCellDate(cellData.date)}
            capacityPercent={cellData.capacityPercent}
            orderCount={cellData.orderCount}
            scheduledRevenue={cellData.scheduledRevenue}
            totalMinutesUsed={cellData.totalMinutesUsed}
            {dailyCapacity}
            {thresholdGreen}
            {thresholdAmber}
            isToday={isToday(dayNum)}
            isPast={isPastDay(dayNum)}
            isHoliday={cellData.isHoliday}
            isCurrentMonth={true}
          />
        {:else}
          <CalendarCell />
        {/if}
      {/each}
    </div>
  </div>

  <!-- Mobile: Agenda list (visible below sm) -->
  <div class="sm:hidden space-y-2">
    <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
      {m["calendar.agenda.title"]()}
    </h3>

    {#if agendaDays.length === 0}
      <p class="text-sm text-muted-foreground py-4 text-center">{m["common.noData"]()}</p>
    {:else}
      {#each agendaDays as day}
        {@const isTodayDate = day.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`}
        <div class="flex items-center gap-3 p-3 rounded-lg border {isTodayDate ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50/50' : 'bg-card'}">
          <!-- Capacity indicator -->
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-end overflow-hidden">
            <div
              class="w-full transition-all {getCapacityBarColor(day.capacityPercent)}"
              style="height: {Math.min(100, day.capacityPercent)}%"
            ></div>
          </div>

          <!-- Day info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold">{formatAgendaDate(day.date)}</span>
              <span class="text-xs font-bold px-1.5 py-0.5 rounded {day.capacityPercent >= thresholdAmber ? 'bg-red-100 text-red-700' : day.capacityPercent >= thresholdGreen ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}">
                {day.capacityPercent.toFixed(0)}%
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {#if day.isHoliday}
                <span class="text-red-600 font-semibold">{m["calendar.day.holiday"]()}</span>
              {/if}
              <span>{m["calendar.day.orders"]({ count: day.orderCount })}</span>
              <span>{formatCurrency(day.scheduledRevenue)}</span>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
