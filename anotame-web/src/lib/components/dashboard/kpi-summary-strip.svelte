<script lang="ts">
  import { Skeleton } from '$lib/components/ui/skeleton';

  /** One always-visible figure in the KPI header strip. */
  export type SummaryItem = {
    /** Localized caption. */
    label: string;
    /** Already-formatted figure. */
    value: string;
    /** Tailwind text colour carrying the figure's meaning. */
    toneClass?: string;
  };

  interface Props {
    items: SummaryItem[];
    /** Swaps each figure for a placeholder while the dashboard loads. */
    loading?: boolean;
  }

  let { items, loading = false }: Props = $props();
</script>

<div
  class="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4"
>
  {#each items as item (item.label)}
    <div class="bg-card px-4 py-3">
      <p class="truncate text-xs uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
      {#if loading}
        <Skeleton class="mt-1 h-7 w-20" />
      {:else}
        <p class={`mt-1 truncate font-mono text-xl font-bold md:text-2xl ${item.toneClass ?? ''}`}>
          {item.value}
        </p>
      {/if}
    </div>
  {/each}
</div>
