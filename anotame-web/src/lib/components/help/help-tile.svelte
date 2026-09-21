<script lang="ts">
  import { Heading, Text } from '$lib/components/ui/typography';
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
  <Heading level={4} as="h3">{title}</Heading>
  <Text variant="muted" class="mt-1 leading-6">{description}</Text>
  {@render children?.()}
</div>
