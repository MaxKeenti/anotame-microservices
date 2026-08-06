<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import { formatCurrency, formatDate, formatDateTime } from '$lib/utils/formatUtils';
  import { generateReceiptHtml } from '$lib/utils/receipt-generator';
  import type { PublicReceiptSettings, PublicTicketResponse } from '$lib/types/dtos';
  import * as m from '$lib/paraglide/messages';

  let { data }: { data: { ticket: PublicTicketResponse; establishment: PublicReceiptSettings } } = $props();
  const ticket = $derived(data.ticket);
  const establishment = $derived(data.establishment);
  const shareUrl = $derived(typeof window !== 'undefined' ? window.location.href : '');

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // The page stays useful when clipboard access is unavailable.
    }
  }

  async function shareTicket() {
    if (navigator.share) {
      try {
        await navigator.share({ title: m['publicTicket.title']({ ticket: ticket.ticketNumber }), url: shareUrl });
        return;
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
      }
    }
    await copyLink();
  }

  function printTicket() {
    const receiptHtml = generateReceiptHtml({
      ticketNumber: ticket.ticketNumber,
      customerName: ticket.customerName,
      phone: ticket.phoneNumber ?? '',
      deadline: ticket.committedDeadline || new Date().toISOString(),
      items: ticket.items.map((item) => ({
        garment: item.quantity > 1 ? `${item.quantity} × ${item.garmentName}` : item.garmentName,
        services: item.services.map((service) => ({
          name: service.serviceName,
          price: service.unitPrice,
          adjustment: service.adjustmentAmount,
          adjustmentReason: service.adjustmentReason ?? undefined,
          instructions: service.instructions ?? undefined,
        })),
        notes: item.notes ?? undefined,
      })),
      total: ticket.totalAmount,
      amountPaid: ticket.amountPaid,
      balance: ticket.balance,
      establishment: {
        name: establishment.name,
        address: establishment.address ?? undefined,
        rfc: establishment.rfc ?? undefined,
        taxRegime: establishment.taxRegime ?? undefined,
        contactPhone: establishment.contactPhone ?? undefined,
      },
      pickupCode: ticket.pickupCode ?? undefined,
    });
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  }
</script>

<svelte:head>
  <title>{m['publicTicket.title']({ ticket: ticket.ticketNumber })}</title>
  <meta name="robots" content="noindex,nofollow" />
  <meta name="referrer" content="no-referrer" />
</svelte:head>

<main class="min-h-screen bg-muted/40 px-4 py-6 sm:py-10">
  <article class="mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <header class="border-b border-border bg-primary px-5 py-6 text-primary-foreground sm:px-8">
      <p class="text-sm font-medium opacity-90">{establishment.name}</p>
      <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">{m['publicTicket.title']({ ticket: ticket.ticketNumber })}</h1>
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

      <section class="space-y-4 border-y border-dashed border-border py-5">
        {#each ticket.items as item}
          <div>
            <div class="flex items-start justify-between gap-3">
              <p class="font-semibold">{item.quantity > 1 ? `${item.quantity} × ` : ''}{item.garmentName}</p>
            </div>
            <div class="mt-2 space-y-2 text-sm">
              {#each item.services as service}
                <div class="flex justify-between gap-3 pl-3">
                  <span>+ {service.serviceName}</span>
                  <span class="shrink-0">{formatCurrency(service.unitPrice + service.adjustmentAmount)}</span>
                </div>
                {#if service.instructions}<p class="pl-6 text-muted-foreground">{service.instructions}</p>{/if}
              {/each}
              {#if item.notes}<p class="pl-3 text-muted-foreground italic">{m['receipt.note']()}: {item.notes}</p>{/if}
            </div>
          </div>
        {/each}
      </section>

      <section class="space-y-2 text-right">
        <div class="flex justify-between"><span>{m['receipt.total']()}</span><strong>{formatCurrency(ticket.totalAmount)}</strong></div>
        <div class="flex justify-between"><span>{m['receipt.deposit']()}</span><span>{formatCurrency(ticket.amountPaid)}</span></div>
        <div class="flex justify-between text-lg font-bold"><span>{m['receipt.remaining']()}</span><span>{formatCurrency(ticket.balance)}</span></div>
      </section>

      {#if ticket.pickupCode}
        <section class="rounded-xl border border-primary/25 bg-primary/5 p-5 text-center">
          <p class="text-sm font-medium text-muted-foreground">{m['receipt.pickupCode']()}</p>
          <p class="mt-2 font-mono text-3xl font-bold tracking-[0.28em]">{ticket.pickupCode}</p>
        </section>
      {/if}

      <footer class="space-y-3 border-t border-border pt-5 text-center">
        <p class="text-xs text-muted-foreground">{m['publicTicket.updated']({ date: formatDateTime(ticket.updatedAt) })}</p>
        <div class="grid grid-cols-2 gap-3">
          <Button onclick={shareTicket} class="h-12 touch-manipulation">{m['publicTicket.share']()}</Button>
          <Button onclick={printTicket} variant="outline" class="h-12 touch-manipulation">{m['publicTicket.print']()}</Button>
        </div>
      </footer>
    </div>
  </article>
</main>
