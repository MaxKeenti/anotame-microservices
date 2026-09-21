<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /** Bordered, horizontally scrollable frame around a table on narrow screens. */
  interface Props {
    /** Layout classes at the call site. */
    class?: string;
    children: Snippet;
  }

  let { class: className, children }: Props = $props();
</script>

<div class={cn('overflow-x-auto rounded-md border', className)}>
  {@render children()}
</div>
