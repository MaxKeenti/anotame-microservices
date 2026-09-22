<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { Heading } from '$lib/components/ui/typography';
  import { StatusBadge } from '$lib/components/common';
  import * as m from '$lib/paraglide/messages';

  /** Back link, ticket title, and status shown atop the order detail page. */
  interface Props {
    ticketNumber: string;
    status: string;
  }

  let { ticketNumber, status }: Props = $props();
</script>

<div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
  <Button href="/dashboard/orders" variant="ghost" size="touch" class="-ml-2 text-muted-foreground">
    <ArrowLeftIcon data-icon="inline-start" />
    {m['orders.detail.back']()}
  </Button>
  <Heading level={1} class="max-w-full min-w-0 wrap-break-word">
    {m['orders.detail.orderTitle']({ ticket: ticketNumber })}
  </Heading>
  <StatusBadge {status} />
</div>
