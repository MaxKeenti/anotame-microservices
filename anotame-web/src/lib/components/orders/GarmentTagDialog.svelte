<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { apiService, API_SALES } from '$lib/services/api.svelte';
  import type { CreatedTicketShareResponse, OrderResponse } from '$lib/types/dtos';
  import { generateGarmentTagsHtml, type GarmentTag } from '$lib/utils/garment-tag-generator';
  import { printHtmlDocument } from '$lib/utils/html';
  import { toast } from 'svelte-sonner';
  import QRCode from 'qrcode';
  import { Minus, Plus } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages';

  const MAX_COPIES = 6;

  let {
    open = $bindable(false),
    order,
    establishmentName,
  }: {
    open?: boolean;
    order: OrderResponse;
    establishmentName: string;
  } = $props();

  // Two copies by default: one for the garment, one for the client's handwritten format.
  let copies = $state(2);
  let includeQr = $state(true);
  let printing = $state(false);
  let selectedIds = $state<string[]>([]);
  let initialisedForCurrentOpen = $state(false);

  const customerName = $derived(
    `${order.customer.firstName} ${order.customer.lastName ?? ''}`.trim(),
  );
  const tagCount = $derived(selectedIds.length * copies);

  // The parent controls `open` through its bound prop, which does not fire
  // Dialog.Root's onOpenChange, so reset the selection on the state transition.
  $effect(() => {
    if (!open) {
      initialisedForCurrentOpen = false;
      return;
    }
    if (!initialisedForCurrentOpen) {
      initialisedForCurrentOpen = true;
      selectedIds = order.items.map((item) => item.id);
    }
  });

  function toggleItem(itemId: string) {
    selectedIds = selectedIds.includes(itemId)
      ? selectedIds.filter((id) => id !== itemId)
      : [...selectedIds, itemId];
  }

  async function buildQrDataUrl(): Promise<string> {
    // HANDLING scope: the resulting token resolves only to /g/<token>, which has
    // no pickup code and no amounts. A tag that goes astray cannot be used to
    // claim the garments.
    const share = await apiService.request<CreatedTicketShareResponse>(
      `${API_SALES}/orders/${order.id}/ticket-shares?scope=HANDLING`,
      { method: 'POST' },
    );
    const shareUrl = new URL(`/g/${share.token}`, window.location.origin).toString();
    // Keep the spec's 4-module quiet zone: thermal print is low-contrast enough
    // without also cropping the border scanners rely on.
    return QRCode.toDataURL(shareUrl, { margin: 4, width: 512, errorCorrectionLevel: 'M' });
  }

  async function handlePrint() {
    const chosen = order.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => selectedIds.includes(item.id));
    if (chosen.length === 0) return;

    printing = true;
    try {
      // One share link per print run, reused by every tag in it, so printing
      // tags does not accumulate a public link per garment.
      const qrDataUrl = includeQr ? await buildQrDataUrl() : undefined;

      const tags: GarmentTag[] = [];
      for (const { item, index } of chosen) {
        for (let copy = 0; copy < copies; copy++) {
          tags.push({
            ticketNumber: order.ticketNumber,
            itemIndex: index + 1,
            itemCount: order.items.length,
            garmentName: item.garmentName,
            customerName,
            phone: order.customer.phoneNumber,
            deadline: order.committedDeadline,
            qrDataUrl,
          });
        }
      }

      printHtmlDocument(generateGarmentTagsHtml(tags, establishmentName));
      open = false;
    } catch (error: any) {
      toast.error(m['garmentTag.printError'](), { description: error?.message });
    } finally {
      printing = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{m['garmentTag.title']()}</Dialog.Title>
      <Dialog.Description>{m['garmentTag.description']()}</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <div class="space-y-2">
        <p class="text-sm font-semibold">{m['garmentTag.garments']()}</p>
        <div class="space-y-2">
          {#each order.items as item, index (item.id)}
            <div class="flex items-center gap-3 rounded-lg border border-border p-3">
              <input
                id={`garment-tag-${item.id}`}
                type="checkbox"
                class="size-5 shrink-0 accent-primary touch-manipulation"
                checked={selectedIds.includes(item.id)}
                onchange={() => toggleItem(item.id)}
              />
              <label for={`garment-tag-${item.id}`} class="min-w-0 flex-1 text-sm">
                <span class="font-medium">{item.garmentName}</span>
                <span class="ml-2 text-xs text-muted-foreground">
                  {m['garmentTag.position']({ index: index + 1, total: order.items.length })}
                </span>
              </label>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 border-t border-border pt-4">
        <span id="garment-tag-copies-label" class="text-sm font-medium">{m['garmentTag.copies']()}</span>
        <div class="flex items-center gap-2" role="group" aria-labelledby="garment-tag-copies-label">
          <Button
            onclick={() => (copies = Math.max(1, copies - 1))}
            disabled={copies <= 1}
            variant="outline"
            class="size-11 touch-manipulation"
            aria-label={m['garmentTag.fewerCopies']()}
          >
            <Minus />
          </Button>
          <span class="w-8 text-center text-lg font-semibold tabular-nums" aria-live="polite">{copies}</span>
          <Button
            onclick={() => (copies = Math.min(MAX_COPIES, copies + 1))}
            disabled={copies >= MAX_COPIES}
            variant="outline"
            class="size-11 touch-manipulation"
            aria-label={m['garmentTag.moreCopies']()}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div class="space-y-2 border-t border-border pt-4">
        <div class="flex items-center gap-3">
          <input
            id="garment-tag-qr"
            type="checkbox"
            class="size-5 shrink-0 accent-primary touch-manipulation"
            bind:checked={includeQr}
          />
          <label for="garment-tag-qr" class="text-sm font-medium">{m['garmentTag.includeQr']()}</label>
        </div>
        <p class="text-xs text-muted-foreground">{m['garmentTag.qrNotice']()}</p>
      </div>

      <Button
        onclick={handlePrint}
        disabled={printing || selectedIds.length === 0}
        class="h-12 w-full touch-manipulation"
      >
        {printing ? m['garmentTag.printing']() : m['garmentTag.print']({ count: tagCount })}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
