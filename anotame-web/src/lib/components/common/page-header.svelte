<script lang="ts">
  import { Heading } from '$lib/components/ui/typography';
  import type { Snippet } from 'svelte';
  // Typed against a concrete icon, matching `lib/config/menu.ts`.
  import type CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { cn } from '$lib/utils';

  /** Title block shown at the top of a dashboard page, with optional trailing actions. */
  interface Props {
    /** Localized page title. */
    title: string;
    /** Localized supporting line rendered under the title. */
    description?: string;
    /** Lucide icon shown before the title. */
    icon?: typeof CircleHelpIcon;
    /** Trailing controls (usually buttons) aligned opposite the title. */
    actions?: Snippet;
    /** Layout classes for the header row at the call site. */
    class?: string;
  }

  let { title, description, icon: Icon, actions, class: className }: Props = $props();
</script>

<div class={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
  <div class="min-w-0">
    <div class={cn(Icon && 'flex items-center gap-3')}>
      {#if Icon}
        <Icon class="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
      {/if}
      <Heading level={1}>{title}</Heading>
    </div>
    {#if description}
      <p class="text-muted-foreground wrap-break-word">{description}</p>
    {/if}
  </div>
  {#if actions}
    {@render actions()}
  {/if}
</div>
