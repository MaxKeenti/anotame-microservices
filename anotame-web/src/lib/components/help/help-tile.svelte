<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /** A titled definition or troubleshooting entry inside a help topic. */
  interface Props {
    title: string;
    description: string;
    /** Layout classes at the call site, such as tighter padding in a dense grid. */
    class?: string;
    /** Optional actions rendered under the description. */
    children?: Snippet;
  }

  let { title, description, class: className, children }: Props = $props();
</script>

<div class={cn('rounded-lg border border-border bg-background p-4', className)}>
  <h3 class="font-semibold">{title}</h3>
  <p class="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
  {@render children?.()}
</div>
