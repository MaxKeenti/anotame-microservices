<script lang="ts">
  import { cn } from '$lib/utils';

  /** One column in the chart. */
  export type ChartBar = {
    /** Stable identity for keyed rendering. */
    key: string;
    value: number;
    /** Short caption under the bar. */
    label: string;
    /** Spoken name for the bar; defaults to the formatted value. */
    ariaLabel?: string;
  };

  /**
   * Simple column chart with tap-to-reveal values. Hover shows the value on
   * pointer devices; a tap or Enter pins it, since touch screens cannot hover.
   */
  interface Props {
    bars: ChartBar[];
    /** Formats a value for the tooltip. */
    format: (value: number) => string;
    /** Plot height. */
    size?: 'sm' | 'md';
  }

  let { bars, format, size = 'sm' }: Props = $props();

  let activeIndex = $state<number | null>(null);
  const max = $derived(Math.max(0, ...bars.map((bar) => bar.value)));

  function toggle(index: number) {
    activeIndex = activeIndex === index ? null : index;
  }
</script>

<div class={cn('mt-4 flex w-full items-end gap-2', size === 'md' ? 'h-64 px-2' : 'h-48')}>
  {#each bars as bar, i (bar.key)}
    {@const heightPct = max > 0 ? (bar.value / max) * 100 : 0}
    {@const active = activeIndex === i}
    <div
      class="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
      role="button"
      tabindex="0"
      aria-label={bar.ariaLabel ?? format(bar.value)}
      onclick={() => toggle(i)}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(i)}
    >
      <div
        class={cn(
          'pointer-events-none absolute -top-10 z-10 rounded bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-lg transition-transform',
          active ? 'scale-100' : 'scale-0 group-hover:scale-100'
        )}
      >
        {format(bar.value)}
      </div>
      <div
        class="w-full max-w-10 rounded-t-sm bg-primary/80 transition-all duration-500 ease-out hover:bg-primary"
        style="height: {heightPct}%"
      ></div>
      <div
        class={cn(
          'mt-2 w-full truncate pb-2 text-center uppercase text-muted-foreground',
          size === 'md' ? 'text-xs' : 'text-[10px]'
        )}
      >
        {bar.label}
      </div>
    </div>
  {/each}
</div>
