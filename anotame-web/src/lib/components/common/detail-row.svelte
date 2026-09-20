<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /** A label/value pair in a detail panel, stacking on narrow screens. */
  interface Props {
    /** Localized field label. A colon is appended by the component. */
    label: string;
    /**
     * `baseline` sits the value next to its label; `spread` pushes it to the
     * opposite edge, for figures that should line up down a column.
     */
    layout?: 'baseline' | 'spread';
    /** Emphasises the label, for a summary row such as a balance. */
    emphasis?: boolean;
    /** Layout classes at the call site, such as a divider above the row. */
    class?: string;
    /** The value being labelled. */
    children: Snippet;
  }

  let { label, layout = 'baseline', emphasis = false, class: className, children }: Props = $props();
</script>

<div
  class={cn(
    'flex min-w-0 flex-col gap-1',
    layout === 'spread'
      ? 'items-start sm:flex-row sm:items-center sm:justify-between sm:gap-4'
      : 'sm:flex-row sm:items-baseline sm:gap-2',
    className
  )}
>
  <span
    class={cn(
      'shrink-0 text-muted-foreground',
      emphasis ? 'font-bold uppercase tracking-wider' : 'font-medium'
    )}
  >
    {label}:
  </span>
  {@render children()}
</div>
