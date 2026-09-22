<script lang="ts">
  import IconMedallion from './icon-medallion.svelte';
  import { Heading, Text } from '$lib/components/ui/typography';
  import type { Snippet } from 'svelte';
  import * as Card from '$lib/components/ui/card';

  /** Centred card carrying a single message, used by standalone pages. */
  interface Props {
    title: string;
    /** Localized explanation under the title. */
    body: string;
    /** Icon shown in a circle above the title. */
    icon?: Snippet;
    /** Recovery actions. */
    children?: Snippet;
    /** Small trailing note, such as a status code. */
    footnote?: string;
  }

  let { title, body, icon, children, footnote }: Props = $props();
</script>

<Card.Root class="w-full max-w-md gap-0 p-8 text-center">
  {#if icon}
    <IconMedallion tone="muted" class="mx-auto mb-5">
      {@render icon()}
    </IconMedallion>
  {/if}

  <Heading level={1}>{title}</Heading>
  <Text variant="muted" class="mt-3">{body}</Text>

  {@render children?.()}

  {#if footnote}
    <p class="mt-6 font-mono text-xs text-muted-foreground/70">{footnote}</p>
  {/if}
</Card.Root>
