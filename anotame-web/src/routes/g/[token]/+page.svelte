<script lang="ts">
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import { formatDate } from '$lib/utils/formatUtils';
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

<main class="min-h-screen bg-muted/40 px-4 py-6 sm:py-10">
  <article class="mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <header class="border-b border-border bg-primary px-5 py-6 text-primary-foreground sm:px-8">
      <p class="text-sm font-medium opacity-90">{m['handlingTicket.heading']()}</p>
      <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">{ticket.ticketNumber}</h1>
        <StatusBadge status={ticket.status} class="bg-background text-foreground" />
      </div>
    </header>

    <div class="space-y-6 p-5 sm:p-8">
      <section class="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p class="text-muted-foreground">{m['receipt.customer']()}</p>
          <p class="font-semibold">{ticket.customerName}</p>
          {#if ticket.phoneNumber}<p class="text-muted-foreground">{ticket.phoneNumber}</p>{/if}
        </div>
        <div class="sm:text-right">
          <p class="text-muted-foreground">{m['receipt.delivery']()}</p>
          <p class="font-semibold">{formatDate(ticket.committedDeadline)}</p>
        </div>
      </section>

      <section class="space-y-4 border-t border-dashed border-border pt-5">
        {#each ticket.items as item}
          <div>
            <p class="font-semibold">{item.quantity > 1 ? `${item.quantity} × ` : ''}{item.garmentName}</p>
            <div class="mt-2 space-y-2 text-sm">
              {#each item.services as service}
                <p class="pl-3">+ {service.serviceName}</p>
                {#if service.instructions}<p class="pl-6 text-muted-foreground">{service.instructions}</p>{/if}
              {/each}
              {#if item.notes}<p class="pl-3 italic text-muted-foreground">{m['receipt.note']()}: {item.notes}</p>{/if}
            </div>
          </div>
        {/each}
      </section>

      <footer class="border-t border-border pt-5 text-center">
        <p class="text-xs text-muted-foreground">{m['handlingTicket.notice']()}</p>
      </footer>
    </div>
  </article>
</main>
