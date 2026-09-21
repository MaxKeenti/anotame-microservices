<script lang="ts">
  import * as Item from '$lib/components/ui/item';
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

<Item.Root variant="outline" class={cn('items-start bg-background', className)}>
  <Item.Content>
    <Item.Title class="line-clamp-none text-base font-semibold">{title}</Item.Title>
    <Item.Description class="line-clamp-none leading-6">{description}</Item.Description>
    {@render children?.()}
  </Item.Content>
</Item.Root>
