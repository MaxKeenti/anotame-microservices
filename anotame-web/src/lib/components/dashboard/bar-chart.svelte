<script lang="ts">
  import * as Chart from '$lib/components/ui/chart';
  import { BarChart } from 'layerchart';
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
   * Single-series column chart. The tooltip follows the pointer and opens on
   * tap, so touch screens get the value without hover. A visually hidden list
   * carries the same figures for screen readers, which cannot read the SVG.
   */
  interface Props {
    bars: ChartBar[];
    /** Formats a value for the tooltip and the accessible list. */
    format: (value: number) => string;
    /** Plot height. */
    size?: 'sm' | 'md';
  }

  let { bars, format, size = 'sm' }: Props = $props();

  const config = {
    value: { label: '', color: 'var(--primary)' },
  } satisfies Chart.ChartConfig;
</script>

<Chart.Container {config} class={cn('mt-4 aspect-auto w-full', size === 'md' ? 'h-64' : 'h-48')} aria-hidden="true">
  <BarChart
    data={bars}
    x="key"
    y="value"
    axis="x"
    grid={false}
    rule={false}
    bandPadding={0.25}
    series={[{ key: 'value', label: '', color: config.value.color }]}
    props={{
      bars: { stroke: 'none', radius: 4 },
      xAxis: {
        format: (key: string) => bars.find((bar) => bar.key === key)?.label ?? '',
        tickLabelProps: { class: cn('uppercase', size === 'md' ? 'text-xs' : 'text-[10px]') },
      },
    }}
  >
    {#snippet tooltip()}
      <Chart.Tooltip
        indicator="line"
        labelFormatter={(key: unknown) => bars.find((bar) => bar.key === key)?.label ?? ''}
        labelClassName="uppercase"
      >
        {#snippet formatter({ value })}
          <span class="font-mono font-medium tabular-nums">{format(Number(value))}</span>
        {/snippet}
      </Chart.Tooltip>
    {/snippet}
  </BarChart>
</Chart.Container>

<ul class="sr-only">
  {#each bars as bar (bar.key)}
    <li>{bar.ariaLabel ?? `${bar.label}: ${format(bar.value)}`}</li>
  {/each}
</ul>
