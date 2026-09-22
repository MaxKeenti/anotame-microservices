<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /** Full-height centred shell for standalone pages outside the app chrome. */
  interface Props {
    /** Page background: the app surface, or a recessed tone for focused cards. */
    tone?: 'background' | 'muted';
    /** Layout classes at the call site, such as padding. */
    class?: string;
    children: Snippet;
  }

  let { tone = 'background', class: className, children }: Props = $props();
</script>

<main
  class={cn(
    'flex min-h-dvh flex-col items-center justify-center px-4',
    tone === 'muted' ? 'bg-muted/40' : 'bg-background',
    className
  )}
>
  {@render children()}
</main>
