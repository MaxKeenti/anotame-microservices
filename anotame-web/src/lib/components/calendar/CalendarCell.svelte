<script lang="ts">
  import { AlertCircle } from '@lucide/svelte';
  import * as Popover from '$lib/components/ui/popover';
  import * as m from '$lib/paraglide/messages';
  import { formatCurrency } from '$lib/utils/formatUtils';

  interface Props {
    day?: number;
    dateLabel?: string;
    capacityPercent?: number;
    orderCount?: number;
    scheduledRevenue?: number;
    totalMinutesUsed?: number;
    dailyCapacity?: number;
    thresholdGreen?: number;
    thresholdAmber?: number;
    isToday?: boolean;
    isPast?: boolean;
    isHoliday?: boolean;
    isCurrentMonth?: boolean;
  }

  let {
    day,
    dateLabel,
    capacityPercent = 0,
    orderCount = 0,
    scheduledRevenue = 0,
    totalMinutesUsed = 0,
    dailyCapacity = 480,
    thresholdGreen = 50,
    thresholdAmber = 85,
    isToday = false,
    isPast = false,
    isHoliday = false,
    isCurrentMonth = true,
  }: Props = $props();

  function getCapacityColor() {
    if (!isCurrentMonth) return 'bg-transparent';
    if (isHoliday) return 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30';
    if (capacityPercent < thresholdGreen) return 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30';
    if (capacityPercent < thresholdAmber) return 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30';
    return 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30';
  }

  function getBarColor() {
    if (capacityPercent < thresholdGreen) return 'bg-green-500';
    if (capacityPercent < thresholdAmber) return 'bg-amber-500';
    return 'bg-red-500';
  }

  function getPercentTextColor() {
    if (capacityPercent >= thresholdAmber) return 'text-red-600 dark:text-red-400';
    if (capacityPercent >= thresholdGreen) return 'text-amber-600 dark:text-amber-400';
    if (capacityPercent > 0) return 'text-green-600 dark:text-green-400';
    return 'text-muted-foreground';
  }
</script>

{#if day}
  <Popover.Root>
    <Popover.Trigger>
      {#snippet child({ props })}
        <div
          {...props}
          class="relative p-3 min-h-28 border rounded-lg transition-all cursor-pointer hover:shadow-md flex flex-col justify-between {getCapacityColor()} {isPast ? 'opacity-60' : ''} {isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase text-muted-foreground">{dateLabel ?? day}</span>
              {#if isHoliday || capacityPercent >= thresholdAmber}
                <AlertCircle class="w-4 h-4 text-red-500" />
              {/if}
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-baseline justify-between gap-2">
              <span class="font-mono text-sm font-bold text-foreground">
                {totalMinutesUsed} <span class="text-[10px] font-semibold text-muted-foreground">min</span>
              </span>
              <span class="text-sm font-black {getPercentTextColor()}">{capacityPercent.toFixed(0)}%</span>
            </div>

            <div class="h-2 w-full rounded-full bg-background/80 shadow-inner overflow-hidden">
              <div
                class="h-full rounded-full transition-all {getBarColor()}"
                style="width: {Math.min(100, capacityPercent)}%"
              ></div>
            </div>

            {#if orderCount > 0}
              <div class="text-xs text-muted-foreground">
                {m["calendar.day.orders"]({ count: orderCount })}
              </div>
            {/if}
          </div>
        </div>
      {/snippet}
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
