<script lang="ts">
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
  <a
    href="/dashboard/orders"
    class="-ml-2 inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-muted-foreground touch-manipulation hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  >
    &larr; {m['orders.detail.back']()}
  </a>
  <Heading level={1} class="max-w-full min-w-0 wrap-break-word">
    {m['orders.detail.orderTitle']({ ticket: ticketNumber })}
  </Heading>
  <StatusBadge {status} />
</div>
