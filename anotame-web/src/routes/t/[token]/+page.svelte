<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import {
    PublicTicketShell,
    TicketParties,
    TicketItemList,
    TicketTotalRow,
    TicketPickupCode,
    TicketFooter,
  } from '$lib/components/ticket';
  import { formatCurrency, formatDateTime } from '$lib/utils/formatUtils';
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

<PublicTicketShell
  eyebrow={establishment.name}
  title={m['publicTicket.title']({ ticket: ticket.ticketNumber })}
  status={ticket.status}
>
  <TicketParties
    customerName={ticket.customerName}
    phoneNumber={ticket.phoneNumber}
    committedDeadline={ticket.committedDeadline}
  />

  <TicketItemList items={ticket.items} showPrices class="border-y py-5" />

  <section class="space-y-2">
    <TicketTotalRow label={m['receipt.total']()}>
      <strong>{formatCurrency(ticket.totalAmount)}</strong>
    </TicketTotalRow>
    <TicketTotalRow label={m['receipt.deposit']()}>
      <span>{formatCurrency(ticket.amountPaid)}</span>
    </TicketTotalRow>
    <TicketTotalRow label={m['receipt.remaining']()} emphasis>
      <span>{formatCurrency(ticket.balance)}</span>
    </TicketTotalRow>
  </section>

  {#if ticket.pickupCode}
    <TicketPickupCode code={ticket.pickupCode} />
  {/if}

  <TicketFooter notice={m['publicTicket.updated']({ date: formatDateTime(ticket.updatedAt) })}>
    <div class="grid grid-cols-2 gap-3">
      <Button size="touch-lg" onclick={shareTicket}>{m['publicTicket.share']()}</Button>
      <Button size="touch-lg" onclick={printTicket} variant="outline">{m['publicTicket.print']()}</Button>
    </div>
  </TicketFooter>
</PublicTicketShell>
