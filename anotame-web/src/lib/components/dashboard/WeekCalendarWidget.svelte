<script lang="ts">
  import { onMount } from 'svelte';
  import { apiService, API_SALES, API_OPERATIONS } from '$lib/services/api.svelte';
  import { Calendar } from 'lucide-svelte';

  interface DayLoad { date: string; totalMinutesUsed: number; }

  let days = $state<DayLoad[]>([]);
  let capacity = $state(480);
  let loading = $state(true);

  function getOccupancyColor(pct: number): string {
    if (pct >= 100) return 'bg-destructive';
    if (pct >= 80)  return 'bg-warning';
    if (pct >= 50)  return 'bg-warning/60';
    if (pct > 0)    return 'bg-success';
    return 'bg-secondary/40';
  }

  function fmtDay(dateStr: string): string {
    return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' })
      .format(new Date(dateStr + 'T12:00:00'));
  }

  onMount(async () => {
    try {
      const [kpiData, estData] = await Promise.all([
        apiService.request<{ dailyWorkload: DayLoad[] }>(`${API_SALES}/orders/kpi/dashboard`),
        apiService.request<{ dailyCapacityMinutes?: number }>(`${API_OPERATIONS}/establishment`)
      ]);
      if (estData?.dailyCapacityMinutes) capacity = estData.dailyCapacityMinutes;
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
<div class="rounded-xl border border-border bg-card p-4">
  <div class="flex items-center gap-2 mb-3">
    <Calendar class="w-4 h-4 text-primary" />
    <span class="text-sm font-semibold font-heading">Carga próximos 7 días</span>
  </div>
  <div class="grid grid-cols-7 gap-1.5">
    {#each days as day}
      {@const pct = Math.min(100, Math.round((day.totalMinutesUsed / capacity) * 100))}
      <div class="flex flex-col items-center gap-1">
        <span class="text-[9px] font-bold text-muted-foreground uppercase leading-tight text-center">{fmtDay(day.date)}</span>
        <div class="w-full h-10 rounded-md bg-muted/40 flex items-end overflow-hidden">
          <div class="w-full transition-all duration-700 {getOccupancyColor(pct)}" style="height: {pct}%"></div>
        </div>
        <span class="text-[9px] font-mono font-bold {pct >= 100 ? 'text-destructive' : pct >= 80 ? 'text-warning-foreground' : 'text-muted-foreground'}">{pct}%</span>
      </div>
    {/each}
  </div>
</div>
{/if}
