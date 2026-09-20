<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /**
   * One line of a receipt's money column: label left, amount right.
   *
   * Unlike a detail row this keeps full contrast on the label and never wraps —
   * a receipt total that stacks or greys out reads as a mistake.
   */
  interface Props {
    label: string;
    /** Renders the row larger and bold, for the amount still owed. */
    emphasis?: boolean;
    /** The formatted amount. */
    children: Snippet;
  }

  let { label, emphasis = false, children }: Props = $props();
</script>

<div class={cn('flex items-center justify-between gap-3', emphasis && 'text-lg font-bold')}>
  <span>{label}</span>
  {@render children()}
</div>
