<script lang="ts">
    import { Calendar as CalendarIcon, Info } from 'lucide-svelte';

    let { dailyWorkload = [], capacity = 480 } = $props<{
        dailyWorkload: any[],
        capacity: number
    }>();

    let activeIndex = $state<number | null>(null);

    function getOccupancyColor(percentage: number) {
        if (percentage >= 100) return 'bg-destructive shadow-[0_0_8px_oklch(from_var(--destructive)_l_c_h_/_40%)]';
        if (percentage >= 80) return 'bg-warning text-warning-foreground';
        if (percentage >= 50) return 'bg-warning/60 text-warning-foreground';
        if (percentage > 0) return 'bg-success text-success-foreground';
        return 'bg-secondary/40';
    }

    function formatDate(dateStr: string) {
        const d = new Date(dateStr + 'T12:00:00');
        return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    }

    function toggleActive(i: number) {
        activeIndex = activeIndex === i ? null : i;
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
            <CalendarIcon class="w-5 h-5 text-primary" />
            <span class="font-bold text-lg">Distribución de Carga (Próximos 30 días)</span>
        </div>
        <div class="flex gap-4 text-xs font-medium">
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-secondary/40"></div>
                <span>Libre</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-success"></div>
                <span>Ok</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-warning/60"></div>
                <span>Medio</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-warning"></div>
                <span>Alto</span>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-destructive"></div>
                <span>Saturado</span>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {#each dailyWorkload as day, i}
            {@const occupancy = Math.min(100, Math.round((day.totalMinutesUsed / capacity) * 100))}
            {@const isActive = activeIndex === i}

            <div
                class="group relative bg-card border border-border p-3 rounded-xl hover:ring-2 hover:ring-primary/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-all cursor-default overflow-visible h-24 flex flex-col justify-between shadow-sm"
                tabindex="0"
                role="button"
                aria-expanded={isActive}
                aria-label={`${formatDate(day.date)}: ${day.totalMinutesUsed} de ${capacity} minutos usados (${occupancy}%)`}
                onclick={() => toggleActive(i)}
                onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleActive(i)}
            >
                <!-- Custom Tooltip — visible on hover (desktop) or tap (mobile via isActive) -->
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-popover border border-border rounded-lg shadow-xl pointer-events-none transition-opacity z-50 animate-in fade-in zoom-in-95 fill-mode-forwards {isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}">
                    <div class="text-sm font-bold border-b border-border pb-1 mb-2 capitalize">{formatDate(day.date)}</div>
                    <div class="space-y-1.5">
                        <div class="flex justify-between text-[10px]">
                            <span class="text-muted-foreground font-medium">Minutos Reservados:</span>
                            <span class="font-mono font-bold">{day.totalMinutesUsed} min</span>
                        </div>
                        <div class="flex justify-between text-[10px]">
                            <span class="text-muted-foreground font-medium">Capacidad Total:</span>
                            <span class="font-mono font-bold">{capacity} min</span>
                        </div>
                        <div class="pt-1.5">
                             <div class="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                 <div class="h-full {getOccupancyColor(occupancy)}" style="width: {occupancy}%"></div>
                             </div>
                        </div>
                    </div>
                    <!-- Tooltip Arrow -->
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-popover"></div>
                </div>

                <!-- Card Content -->
                <div class="flex justify-between items-start z-10">
                    <span class="text-xs font-bold text-muted-foreground uppercase">{formatDate(day.date)}</span>
                    {#if occupancy >= 80}
                        <div class="flex gap-1 items-center">
                            <Info class="w-3.5 h-3.5 text-destructive animate-pulse" />
                        </div>
                    {/if}
                </div>

                <div class="z-10 mt-auto">
                    <div class="flex justify-between items-baseline mb-1.5">
                        <span class="font-mono text-[11px] font-bold">{day.totalMinutesUsed} <span class="text-[10px] opacity-60">min</span></span>
                        <span class="text-[11px] font-black {occupancy >= 100 ? 'text-destructive' : 'text-primary'}">{occupancy}%</span>
                    </div>
                    <div class="h-2 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner">
                        <div class="h-full transition-all duration-700 ease-out {getOccupancyColor(occupancy)}" style="width: {occupancy}%"></div>
                    </div>
                </div>

                <!-- Subtle background glow -->
                <div class="absolute inset-0 rounded-xl opacity-[0.03] transition-opacity group-hover:opacity-[0.07] {getOccupancyColor(occupancy)}"></div>
            </div>
        {/each}
    </div>
</div>
