<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import * as m from '$lib/paraglide/messages';

  /** Quick +/- price adjustments applied to every row of a price list. */
  interface Props {
    /** Applies a signed amount to all overrides. */
    onAdjust: (amount: number) => void;
    /** The page's own revert control, which differs between create and edit. */
    reset: Snippet;
  }

  let { onAdjust, reset }: Props = $props();

  const STEPS = [5, 10, 15, 20];
</script>

<div
  class="flex flex-col flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/20 p-4 sm:flex-row"
>
  <span class="mr-2 text-sm font-bold uppercase tracking-wide opacity-70">
    {m['catalog.pricelist.bulkAdjust']()}
  </span>

  <div class="flex gap-2">
    {#each STEPS as amount (amount)}
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-11 border-success/30 font-mono text-success-text touch-manipulation hover:bg-success/10 hover:text-success-text"
        onclick={() => onAdjust(amount)}
      >
        +${amount}
      </Button>
    {/each}
  </div>

  <Separator orientation="vertical" class="mx-2 hidden h-6 sm:block" />

  <div class="flex gap-2">
    {#each STEPS as amount (amount)}
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-11 border-destructive/30 font-mono text-destructive touch-manipulation hover:bg-destructive/10 hover:text-destructive"
        onclick={() => onAdjust(-amount)}
      >
        -${amount}
      </Button>
    {/each}
  </div>

  <Separator class="my-2 w-full sm:mx-2 sm:my-0 sm:h-6 sm:w-px" />

  {@render reset()}
</div>
