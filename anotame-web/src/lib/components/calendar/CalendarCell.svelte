<script lang="ts">
  import { AlertCircle, CheckCircle2 } from 'lucide-svelte';

  interface Props {
    day?: number;
    capacityPercent?: number;
    orderCount?: number;
    isToday?: boolean;
    isPast?: boolean;
    isHoliday?: boolean;
    isCurrentMonth?: boolean;
  }

  let { day, capacityPercent = 0, orderCount = 0, isToday = false, isPast = false, isHoliday = false, isCurrentMonth = true }: Props = $props();

  // Color coding logic
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
</script>

<div
  class="relative p-2 min-h-24 border rounded-lg transition-all {getCapacityColor()} {isPast ? 'opacity-60' : ''} {isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}"
>
  {#if day}
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
  {/if}
</div>
