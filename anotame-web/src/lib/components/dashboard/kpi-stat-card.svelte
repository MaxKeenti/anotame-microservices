<script lang="ts">
  import { Text } from '$lib/components/ui/typography';
  import type { Snippet } from 'svelte';
  // Typed against a concrete icon, matching `lib/config/menu.ts`; the generic
  // `Icon` type requires an `iconNode` prop that concrete icons already supply.
  import type TruckIcon from '@lucide/svelte/icons/truck';
  import * as Card from '$lib/components/ui/card';
  import { cn } from '$lib/utils';

  /** A single headline figure on a KPI dashboard. */
  interface Props {
    /** Localized card title. */
    title: string;
    /** The headline figure, already formatted for display. */
    value: string | number;
    /** Localized line explaining what the figure covers. */
    description?: string;
    /** Lucide icon shown opposite the title. */
    icon?: typeof TruckIcon;
    /**
     * Tone of the figure. `destructive` also tints the description, so a card
     * that is raising an alarm reads as one unit rather than a stray red number.
     */
    tone?: 'default' | 'success' | 'destructive' | 'primary';
    /** Extra detail under the description, such as a breakdown grid. */
    children?: Snippet;
  }

  let { title, value, description, icon: Icon, tone = 'default', children }: Props = $props();

  const VALUE_TONE = {
    default: '',
    success: 'text-success',
    destructive: 'text-destructive',
    primary: 'text-primary',
  } as const;
</script>

<Card.Root>
  <Card.Header class="pb-2">
    <Card.Title class="text-sm font-medium">{title}</Card.Title>
    {#if Icon}
      <Card.Action>
        <Icon class={cn('h-4 w-4', tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground')} />
      </Card.Action>
    {/if}
  </Card.Header>
  <Card.Content>
    <Text variant="metric" size="lg" as="div" class={VALUE_TONE[tone]}>{value}</Text>
    {#if description}
      <p
        class={cn(
          'mt-1 text-xs',
          tone === 'destructive' ? 'font-medium text-destructive/80' : 'text-muted-foreground'
        )}
      >
        {description}
      </p>
    {/if}
    {@render children?.()}
  </Card.Content>
</Card.Root>
