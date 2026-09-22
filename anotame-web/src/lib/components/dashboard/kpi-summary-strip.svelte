<script lang="ts">
  import { cn } from '$lib/utils';
  import { Text } from '$lib/components/ui/typography';
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
      <Text variant="label" class="truncate">{item.label}</Text>
      {#if loading}
        <Skeleton class="mt-1 h-7 w-20" />
      {:else}
        <Text variant="metric" size="sm" class={cn('mt-1 truncate md:text-2xl', item.toneClass)}>
          {item.value}
        </Text>
      {/if}
    </div>
  {/each}
</div>
