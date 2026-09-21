<script lang="ts">
  import * as ButtonGroup from '$lib/components/ui/button-group';
  import { Text } from '$lib/components/ui/typography';
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
  <Text variant="label" as="span" class="sm:mr-2">
    {m['catalog.pricelist.bulkAdjust']()}
  </Text>

  <ButtonGroup.Root>
    {#each STEPS as amount (amount)}
      <Button
        type="button"
        variant="outline"
        size="touch"
        class="border-success/30 font-mono text-success-text hover:bg-success/10 hover:text-success-text"
        onclick={() => onAdjust(amount)}
      >
        +${amount}
      </Button>
    {/each}
  </ButtonGroup.Root>

  <Separator orientation="vertical" class="mx-2 hidden h-6 sm:block" />

  <ButtonGroup.Root>
    {#each STEPS as amount (amount)}
      <Button
        type="button"
        variant="destructive-outline"
        size="touch"
        class="font-mono"
        onclick={() => onAdjust(-amount)}
      >
        -${amount}
      </Button>
    {/each}
  </ButtonGroup.Root>

  <Separator class="my-2 w-full sm:mx-2 sm:my-0 sm:h-6 sm:w-px" />

  {@render reset()}
</div>
