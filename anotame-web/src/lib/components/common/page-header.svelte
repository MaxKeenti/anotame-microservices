<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  /** Title block shown at the top of a dashboard page, with optional trailing actions. */
  interface Props {
    /** Localized page title. */
    title: string;
    /** Localized supporting line rendered under the title. */
    description?: string;
    /** Trailing controls (usually buttons) aligned opposite the title. */
    actions?: Snippet;
    /** Layout classes for the header row at the call site. */
    class?: string;
  }

  let { title, description, actions, class: className }: Props = $props();
</script>

<div class={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
  <div class="min-w-0">
    <h1 class="text-3xl font-heading font-bold text-foreground">{title}</h1>
    {#if description}
      <p class="text-muted-foreground wrap-break-word">{description}</p>
    {/if}
  </div>
  {#if actions}
    {@render actions()}
  {/if}
</div>
