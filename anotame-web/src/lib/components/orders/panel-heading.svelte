<script lang="ts">
  import { Heading } from '$lib/components/ui/typography';
  import * as Card from '$lib/components/ui/card';
  import { cn } from '$lib/utils';

  /** Tinted heading bar at the top of an order detail panel. */
  interface Props {
    /** Localized section title. */
    title: string;
    /** Draws a rule under the heading. Off when the panel body supplies its own. */
    divider?: boolean;
  }

  let { title, divider = true }: Props = $props();
</script>

<Card.Header class={cn('bg-secondary/20 px-4 py-4 sm:px-6', divider && 'border-b border-border')}>
  <Card.Title><Heading level={3} class="wrap-break-word">{title}</Heading></Card.Title>
</Card.Header>
