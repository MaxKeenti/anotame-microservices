<script lang="ts">
  import { Text } from '$lib/components/ui/typography';
  import { AlertCircle } from '@lucide/svelte';
  import * as Popover from '$lib/components/ui/popover';
  import { Progress } from '$lib/components/ui/progress';
  import { capacityTone, HOLIDAY_TONE, TODAY_RING } from '$lib/utils/capacity';
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

  const thresholds = $derived({ green: thresholdGreen, amber: thresholdAmber });
  const tone = $derived(capacityTone(capacityPercent, thresholds));

  /** Whole-cell tint: out-of-month days stay blank, holidays always read as closed. */
  function cellSurface(): string {
    if (!isCurrentMonth) return 'bg-transparent';
    return isHoliday ? HOLIDAY_TONE.surface : tone.surface;
  }

  /** An empty day has nothing to warn about, so its figure stays neutral. */
  const percentText = $derived(capacityPercent > 0 ? tone.text : 'text-muted-foreground');
</script>

{#if day}
  <Popover.Root>
    <Popover.Trigger>
      {#snippet child({ props })}
        <div
          {...props}
          class="relative p-3 min-h-28 border rounded-lg transition-all cursor-pointer hover:shadow-md flex flex-col justify-between {cellSurface()} {isPast ? 'opacity-60' : ''} {isToday ? TODAY_RING : ''}"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <Text variant="label" as="span">{dateLabel ?? day}</Text>
              {#if isHoliday || capacityPercent >= thresholdAmber}
                <AlertCircle class="w-4 h-4 text-destructive" />
              {/if}
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-baseline justify-between gap-2">
              <span class="font-mono text-sm font-bold text-foreground">
                {totalMinutesUsed} <span class="text-xs font-semibold text-muted-foreground">min</span>
              </span>
              <span class="text-sm font-black {percentText}">{capacityPercent.toFixed(0)}%</span>
            </div>

            <Progress
              value={Math.min(100, capacityPercent)}
              class="h-2 bg-background/80 shadow-inner"
              indicatorClass={tone.bar}
              aria-label={m["calendar.day.capacity"]()}
            />

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
          <Text variant="label" as="div" class="text-destructive-text">
            {m["calendar.day.holiday"]()}
          </Text>
        {/if}

        <!-- Capacity bar -->
        <div>
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-muted-foreground">{m["calendar.day.capacity"]()}</span>
            <span class="font-semibold">{capacityPercent.toFixed(0)}%</span>
          </div>
          <Progress
            value={Math.min(100, capacityPercent)}
            class="h-2"
            indicatorClass={tone.bar}
            aria-label={m["calendar.day.capacity"]()}
          />
          <div class="text-xs text-muted-foreground mt-0.5">
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
