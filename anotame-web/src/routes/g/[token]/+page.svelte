<script lang="ts">
  import {
    PublicTicketShell,
    TicketParties,
    TicketItemList,
    TicketFooter,
  } from '$lib/components/ticket';
  import type { PublicHandlingTicketResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  let { data }: { data: { ticket: PublicHandlingTicketResponse } } = $props();
  const ticket = $derived(data.ticket);
</script>

<svelte:head>
  <title>{m['handlingTicket.title']({ ticket: ticket.ticketNumber })}</title>
  <meta name="robots" content="noindex,nofollow" />
  <meta name="referrer" content="no-referrer" />
</svelte:head>

<PublicTicketShell
  eyebrow={m['handlingTicket.heading']()}
  title={ticket.ticketNumber}
  status={ticket.status}
>
  <TicketParties
    customerName={ticket.customerName}
    phoneNumber={ticket.phoneNumber}
    committedDeadline={ticket.committedDeadline}
  />

  <TicketItemList items={ticket.items} class="border-t pt-5" />

  <TicketFooter notice={m['handlingTicket.notice']()} />
</PublicTicketShell>
