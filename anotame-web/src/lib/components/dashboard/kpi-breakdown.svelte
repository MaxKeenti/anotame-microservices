<script lang="ts">
  import { cn } from '$lib/utils';

  /** One label/amount pair in a stat card's breakdown. */
  export type BreakdownEntry = {
    label: string;
    /** Already-formatted amount. */
    value: string;
    /** Tailwind text colour for the amount, when it carries meaning. */
    tone?: string;
  };

  /** Secondary figures shown under a KPI headline, split across a rule. */
  interface Props {
    entries: BreakdownEntry[];
    /** Layout classes at the call site, such as row spacing. */
    class?: string;
  }

  let { entries, class: className }: Props = $props();
</script>

<div class={cn('mt-3 grid grid-cols-2 gap-x-4 border-t border-border pt-3', className)}>
  {#each entries as entry (entry.label)}
    <div class="min-w-0">
      <p class="truncate text-xs text-muted-foreground">{entry.label}</p>
      <p class={cn('truncate font-mono text-sm font-semibold', entry.tone)}>{entry.value}</p>
    </div>
  {/each}
</div>
