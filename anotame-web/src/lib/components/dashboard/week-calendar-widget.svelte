<script lang="ts">
  import NavLink from '$lib/components/common/nav-link.svelte';
  import { getIntlLocale } from '$lib/utils/formatUtils';
  import { Text } from '$lib/components/ui/typography';
  import { onMount } from 'svelte';
  import { capacityTone } from '$lib/utils/capacity';
  import { apiService, API_SALES, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Calendar } from '@lucide/svelte';
  import type { Establishment, WorkloadDayResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  interface Props {
    href?: string;
  }

  let { href = '/dashboard/admin/kpi/operacion#workload-calendar' }: Props = $props();

  let days = $state<WorkloadDayResponse[]>([]);
  let capacity = $state(480);
  let thresholdGreen = $state(50);
  let thresholdAmber = $state(85);
  let loading = $state(true);

  /**
   * Bar fill for a day. Fully booked is called out on its own; an empty day gets
   * a neutral track so it is not mistaken for a comfortable, low-load day.
   */
  function occupancyBar(pct: number): string {
    if (pct >= 100) return 'bg-destructive';
    if (pct === 0) return 'bg-secondary/40';
    return capacityTone(pct, { green: thresholdGreen, amber: thresholdAmber }).bar;
  }


  function fmtDay(dateStr: string): string {
    return new Intl.DateTimeFormat(getIntlLocale(), { weekday: 'short', day: 'numeric' })
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
<NavLink {href} variant="card" aria-label={m["calendar.title"]()}>
  <div class="flex items-center gap-2 mb-3">
    <Calendar class="w-4 h-4 text-primary" />
    <span class="text-sm font-semibold font-heading">{m["calendar.widget.title"]()}</span>
  </div>
  <div class="grid grid-cols-7 gap-1.5">
    {#each days as day}
      {@const pct = Math.min(100, Math.round((day.totalMinutesUsed / capacity) * 100))}
      <div class="flex flex-col items-center gap-1">
        <Text variant="label" as="span" class="leading-tight text-center">{fmtDay(day.date)}</Text>
        <div class="w-full h-11 rounded-md bg-muted/40 flex items-end overflow-hidden">
          <div class="w-full transition-all duration-700 {occupancyBar(pct)}" style="height: {pct}%"></div>
        </div>
        <span class="text-xs font-mono font-bold {capacityTone(pct, { green: thresholdGreen, amber: thresholdAmber }).text}">{pct}%</span>
      </div>
    {/each}
  </div>
</NavLink>
{/if}
