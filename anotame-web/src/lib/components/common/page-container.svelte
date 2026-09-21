<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /**
   * Content column of a dashboard page. Owns the page's measure, the vertical
   * rhythm between sections, and the entry animation, so pages do not set them
   * ad hoc. Horizontal gutters and the dock clearance belong to AppShell.
   */
  interface Props {
    /**
     * `full` for lists and dashboards, `wide` for split layouts, `form` for
     * record and editor pages, `narrow` for settings-style single columns.
     */
    width?: 'full' | 'wide' | 'form' | 'narrow';
    /** Layout classes at the call site. */
    class?: string;
    children: Snippet;
  }

  let { width = 'full', class: className, children }: Props = $props();

  const WIDTH = {
    full: '',
    wide: 'max-w-5xl',
    form: 'max-w-4xl',
    narrow: 'max-w-3xl',
  } as const;
</script>

<div
  class={cn(
    'mx-auto w-full min-w-0 space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none',
    WIDTH[width],
    className
  )}
>
  {@render children()}
</div>
