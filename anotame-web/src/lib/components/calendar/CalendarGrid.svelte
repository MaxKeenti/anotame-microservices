<script lang="ts">
  import CalendarCell from './CalendarCell.svelte';
  import { formatDate } from '$lib/utils/formatUtils';

  interface CalendarDay {
    date: string;
    totalMinutesUsed: number;
    orderCount: number;
    scheduledRevenue: number;
    capacityPercent: number;
    isHoliday: boolean;
    isOpen: boolean;
  }

  interface Props {
    year: number;
    month: number;
    days: CalendarDay[];
  }

  let { year, month, days }: Props = $props();

  const today = new Date();
  const currentDate = new Date(year, month - 1, 1);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get first day of month (0 = Sunday, need to adjust to Monday = 0)
  const firstDay = new Date(year, month - 1, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday to 6, others shift back
  const daysInMonth = new Date(year, month, 0).getDate();

  // Create calendar grid
  let calendarDays: (CalendarDay | null)[] = $derived.by(() => {
    const grid: (CalendarDay | null)[] = [];

    // Add empty cells before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      grid.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = days.find(d => d.date === dateStr);
      grid.push(dayData || null);
    }

    return grid;
  });

  function isToday(dayNum: number, monthNum: number, yearNum: number): boolean {
    return today.getDate() === dayNum && today.getMonth() === monthNum - 1 && today.getFullYear() === yearNum;
  }

  function isPastDay(dayNum: number, monthNum: number, yearNum: number): boolean {
    const cellDate = new Date(yearNum, monthNum - 1, dayNum);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return cellDate < todayStart;
  }
</script>

<div class="space-y-6">
  <!-- Month Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold">
      {monthNames[month - 1]} {year}
    </h2>
  </div>

  <!-- Weekday Headers -->
  <div class="grid grid-cols-7 gap-2 mb-2">
    {#each dayNames as day}
      <div class="text-xs font-semibold text-center text-gray-600 py-2">
        {day}
      </div>
    {/each}
  </div>

  <!-- Calendar Grid -->
  <div class="grid grid-cols-7 gap-2 auto-rows-max">
    {#each calendarDays as cellData, index}
      {@const dayNum = index - adjustedFirstDay + 1}
      {@const isInMonth = dayNum > 0 && dayNum <= daysInMonth}

      {#if isInMonth && cellData}
        <CalendarCell
          day={dayNum}
          capacityPercent={cellData.capacityPercent}
          orderCount={cellData.orderCount}
          isToday={isToday(dayNum, month, year)}
          isPast={isPastDay(dayNum, month, year)}
          isHoliday={cellData.isHoliday}
          isCurrentMonth={true}
        />
      {:else}
        <CalendarCell />
      {/if}
    {/each}
  </div>
</div>
