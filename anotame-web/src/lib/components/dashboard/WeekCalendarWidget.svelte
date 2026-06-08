<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Calendar } from '@lucide/svelte';
  import type { Establishment, WorkloadDayResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  let { href = '/dashboard/admin/kpi#workload-calendar' } = $props<{
    href?: string;
  }>();

  let days = $state<WorkloadDayResponse[]>([]);
  let capacity = $state(480);
  let thresholdGreen = $state(50);
  let thresholdAmber = $state(85);
  let loading = $state(true);

  function getOccupancyColor(pct: number): string {
    if (pct >= 100) return 'bg-destructive';
    if (pct >= thresholdAmber) return 'bg-red-500';
    if (pct >= thresholdGreen) return 'bg-amber-500';
    if (pct > 0)    return 'bg-green-500';
    return 'bg-secondary/40';
  }

  function fmtDay(dateStr: string): string {
    return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' })
      .format(new Date(dateStr + 'T12:00:00'));
  }

  onMount(async () => {
    try {
      const [kpiData, estData] = await Promise.all([
        apiService.request<{ dailyWorkload: WorkloadDayResponse[] }>(`${API_SALES}/orders/kpi/dashboard`),
        apiService.request<Establishment>(`${API_OPERATIONS}/establishment`)
      ]);
      if (estData?.dailyCapacityMinutes) capacity = estData.dailyCapacityMinutes;
      if (estData?.capacityThresholdGreen != null) thresholdGreen = estData.capacityThresholdGreen;
      if (estData?.capacityThresholdAmber != null) thresholdAmber = estData.capacityThresholdAmber;
      // Take first 7 future days
      days = (kpiData?.dailyWorkload ?? []).slice(0, 7);
    } catch {
      // non-critical — widget stays hidden on error
    } finally {
      loading = false;
    }
  });
</script>

{#if !loading && days.length > 0}
<a
  {href}
  aria-label={m["calendar.title"]()}
  class="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
  <div class="flex items-center gap-2 mb-3">
    <Calendar class="w-4 h-4 text-primary" />
    <span class="text-sm font-semibold font-heading">{m["calendar.widget.title"]()}</span>
  </div>
  <div class="grid grid-cols-7 gap-1.5">
    {#each days as day}
      {@const pct = Math.min(100, Math.round((day.totalMinutesUsed / capacity) * 100))}
      <div class="flex flex-col items-center gap-1">
        <span class="text-[9px] font-bold text-muted-foreground uppercase leading-tight text-center">{fmtDay(day.date)}</span>
        <div class="w-full h-10 rounded-md bg-muted/40 flex items-end overflow-hidden">
          <div class="w-full transition-all duration-700 {getOccupancyColor(pct)}" style="height: {pct}%"></div>
        </div>
        <span class="text-[9px] font-mono font-bold {pct >= 100 ? 'text-red-500' : pct >= thresholdAmber ? 'text-amber-500' : pct >= thresholdGreen ? 'text-amber-500' : 'text-green-500'}">{pct}%</span>
      </div>
    {/each}
  </div>
</a>
{/if}
