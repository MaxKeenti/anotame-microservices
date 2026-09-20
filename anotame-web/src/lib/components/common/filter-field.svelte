<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /** A labelled filter or search control in a page's filter bar. */
  interface Props {
    /** Localized field label. */
    label: string;
    /** `id` of the control this labels, so the label stays clickable. */
    for: string;
    /** Layout classes at the call site, such as a column span. */
    class?: string;
    /** The input, select, or picker being labelled. */
    children: Snippet;
  }

  let { label, for: htmlFor, class: className, children }: Props = $props();
</script>

<div class={cn('space-y-1.5', className)}>
  <label class="text-xs font-bold uppercase tracking-wider text-muted-foreground" for={htmlFor}>
    {label}
  </label>
  {@render children()}
</div>
