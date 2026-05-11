<script lang="ts">
  import { AlertCircle } from 'lucide-svelte';
  import * as Popover from '$lib/components/ui/popover';
  import * as m from '$lib/paraglide/messages';
  import { formatCurrency } from '$lib/utils/formatUtils';

  interface Props {
    day?: number;
    capacityPercent?: number;
    orderCount?: number;
    scheduledRevenue?: number;
    totalMinutesUsed?: number;
    dailyCapacity?: number;
    isToday?: boolean;
    isPast?: boolean;
    isHoliday?: boolean;
    isCurrentMonth?: boolean;
  }

  let {
    day,
    capacityPercent = 0,
    orderCount = 0,
    scheduledRevenue = 0,
    totalMinutesUsed = 0,
    dailyCapacity = 480,
    isToday = false,
    isPast = false,
    isHoliday = false,
    isCurrentMonth = true,
  }: Props = $props();

  function getCapacityColor() {
    if (!isCurrentMonth) return 'bg-transparent';
    if (isHoliday) return 'bg-red-50 border-red-200';
    if (capacityPercent < 50) return 'bg-green-50 border-green-200';
    if (capacityPercent < 85) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  }

  function getCapacityBadgeColor() {
    if (isHoliday) return 'bg-red-200 text-red-900';
    if (capacityPercent < 50) return 'bg-green-200 text-green-900';
    if (capacityPercent < 85) return 'bg-amber-200 text-amber-900';
    return 'bg-red-200 text-red-900';
  }

  function getBarColor() {
    if (capacityPercent < 50) return 'bg-green-500';
    if (capacityPercent < 85) return 'bg-amber-500';
    return 'bg-red-500';
  }
</script>

{#if day}
  <Popover.Root>
    <Popover.Trigger>
      <div
        class="relative p-2 min-h-24 border rounded-lg transition-all cursor-pointer hover:shadow-md {getCapacityColor()} {isPast ? 'opacity-60' : ''} {isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold">{day}</span>
            {#if isHoliday}
              <AlertCircle class="w-4 h-4 text-red-500" />
            {/if}
          </div>
          {#if capacityPercent !== undefined}
            <span class="text-xs font-bold px-2 py-0.5 rounded {getCapacityBadgeColor()}">
              {capacityPercent.toFixed(0)}%
            </span>
          {/if}
        </div>

        {#if orderCount > 0}
          <div class="text-xs text-gray-600 mt-1">
            {orderCount} {orderCount === 1 ? 'order' : 'orders'}
          </div>
        {/if}
      </div>
    </Popover.Trigger>

    <Popover.Content side="top" class="w-64">
      <div class="space-y-3">
        {#if isHoliday}
          <div class="text-xs font-semibold text-red-600 uppercase">
            {m["calendar.day.holiday"]()}
          </div>
        {/if}

        <!-- Capacity bar -->
        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-muted-foreground">{m["calendar.day.capacity"]()}</span>
            <span class="font-semibold">{capacityPercent.toFixed(0)}%</span>
          </div>
          <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full transition-all {getBarColor()}"
              style="width: {Math.min(100, capacityPercent)}%"
            ></div>
          </div>
          <div class="text-[10px] text-muted-foreground mt-0.5">
            {m["calendar.day.minutes"]({ used: String(totalMinutesUsed), total: String(dailyCapacity) })}
          </div>
        </div>

        <!-- Revenue -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted-foreground">{m["calendar.day.revenue"]()}</span>
          <span class="font-semibold">{formatCurrency(scheduledRevenue)}</span>
        </div>

        <!-- Orders -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted-foreground">{m["calendar.day.orders"]({ count: orderCount })}</span>
        </div>
      </div>
    </Popover.Content>
  </Popover.Root>
{:else}
  <div class="relative p-2 min-h-24 border rounded-lg bg-transparent"></div>
{/if}
