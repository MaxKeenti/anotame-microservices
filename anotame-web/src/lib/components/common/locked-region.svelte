<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /**
   * Shows content that cannot be changed. `inert` removes it from the tab order
   * and the accessibility tree as well as from the pointer; dimming alone would
   * still let a keyboard user reach and edit the fields inside.
   */
  interface Props {
    /** When false the content renders normally. */
    locked: boolean;
    /** Layout classes for the region. */
    class?: string;
    children: Snippet;
  }

  let { locked, class: className, children }: Props = $props();
</script>

<div class={cn(locked && 'opacity-60 select-none', className)} inert={locked}>
  {@render children()}
</div>
